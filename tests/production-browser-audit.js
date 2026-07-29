const { chromium } = require('playwright-core');

async function main() {
  const auditStarted = Date.now();
  const url = process.env.PRODUCTION_WEB_APP_URL;
  const executablePath = process.env.BROWSER_EXECUTABLE;
  if (!url || !executablePath) throw new Error('PRODUCTION_WEB_APP_URL and BROWSER_EXECUTABLE are required');

  const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-sync'] });
  const page = await browser.newPage({ viewport: { width: Number(process.env.VIEWPORT_WIDTH || 1440), height: Number(process.env.VIEWPORT_HEIGHT || 1000) } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  let appFrame;
  for (let i = 0; i < 60; i += 1) {
    for (const frame of page.frames()) {
      if (frame !== page.mainFrame() && await frame.locator('#statusTitle').count().catch(() => 0)) {
        appFrame = frame;
        break;
      }
    }
    if (appFrame) break;
    await page.waitForTimeout(500);
  }
  if (!appFrame) throw new Error(`Apps Script application frame did not load. Frames: ${page.frames().map(frame => frame.url()).join(', ')}`);

  let maintenanceTrigger = null;
  if (process.env.INSTALL_MAINTENANCE_TRIGGER === 'true') {
    maintenanceTrigger = await appFrame.evaluate(() => new Promise((resolve, reject) => {
      const timer=setTimeout(()=>reject(new Error('Maintenance trigger installation timed out')),30000);
      google.script.run.withSuccessHandler(value=>{clearTimeout(timer);resolve(value);}).withFailureHandler(error=>{clearTimeout(timer);reject(error);}).installDailyMaintenanceTrigger();
    }));
  }

  if (process.env.TRIGGER_REFRESH === 'true') {
    var refreshStarted = Date.now();
    await appFrame.locator('#refreshButton').click();
    await appFrame.locator('#refreshButton:not([disabled])').waitFor({ timeout: 360000 });
    var refreshWallMs = Date.now() - refreshStarted;
  } else {
    await appFrame.waitForFunction(() => document.getElementById('statusTitle').textContent !== 'Loading certified dashboard', null, { timeout: 120000 });
  }

  if (process.env.RELOAD_PAGE === 'true') {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    appFrame = null;
    for (let i = 0; i < 60; i += 1) {
      for (const frame of page.frames()) {
        if (frame !== page.mainFrame() && await frame.locator('#statusTitle').count().catch(() => 0)) { appFrame = frame; break; }
      }
      if (appFrame) break;
      await page.waitForTimeout(500);
    }
    if (!appFrame) throw new Error('Apps Script application frame did not reload.');
    await appFrame.waitForFunction(() => document.getElementById('statusTitle').textContent !== 'Loading certified dashboard', null, { timeout: 120000 });
  }

  const read = selector => appFrame.locator(selector).first().textContent().catch(() => null);
  const cacheProbeStarted = Date.now();
  const cacheHealth = process.env.SKIP_CACHE_PROBE === 'true' ? null : await appFrame.evaluate(() => new Promise((resolve, reject) => {
    const timer=setTimeout(()=>reject(new Error('Cache health RPC timed out')),30000);
    google.script.run.withSuccessHandler(value=>{clearTimeout(timer);resolve(value);}).withFailureHandler(error=>{clearTimeout(timer);reject(error);}).getDashboardApi('health');
  }));
  const cacheProbeWallMs = Date.now() - cacheProbeStarted;
  const renderTimings = await appFrame.evaluate(() => {
    const now = () => performance.now();
    let started = now(); BI.Charts.renderAll(BI.state.scope || BI.state.data.executive); const chartMs = now() - started;
    started = now(); BI.Tables.render(); const reportMs = now() - started;
    const first = BI.state.data.hierarchy.RSM && BI.state.data.hierarchy.RSM[0];
    started = now(); if (first) BI.Filters.select('RSM', first.entityId); const filterMs = now() - started;
    if (first) BI.Filters.clear();
    return { chartMs, reportMs, filterMs };
  });
  let interaction = null;
  if (process.env.RUN_INTERACTIONS === 'true') {
    const rsm = appFrame.locator('#filterRSM');
    const values = await rsm.locator('option').evaluateAll(options => options.map(option => option.value).filter(Boolean));
    if (values.length) {
      await rsm.selectOption(values[0]);
      await page.waitForTimeout(500);
    }
    const tooltipShown = await appFrame.evaluate(() => {
      const hit = BI.state.chartHits.flow && BI.state.chartHits.flow[0];
      const canvas = document.getElementById('flowChart');
      if (!hit || !canvas) return false;
      const rect = canvas.getBoundingClientRect();
      canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: rect.left + hit.x + Math.max(1, hit.w / 2), clientY: rect.top + hit.y + Math.max(1, hit.h / 2), bubbles: true }));
      return getComputedStyle(document.getElementById('flowTooltip')).display !== 'none';
    });
    interaction = { selectedRsm: values[0] || null, scopeName: await read('#scopeName'), tooltipShown };
  }

  let filterAudit = null;
  if (process.env.FILTER_AUDIT === 'true') {
    filterAudit = await appFrame.evaluate(async () => {
      const levels = ['RSM', 'TSO', 'SR', 'DEALER', 'PRODUCT'];
      const results = [];
      for (const level of levels) {
        const select = document.getElementById('filter' + level);
        const id = [...select.options].map(option => option.value).find(Boolean);
        const expected = id && BI.findEntity(level, id);
        if (id) BI.Filters.select(level, id);
        results.push({
          level, optionCount: Math.max(0, select.options.length - 1), selected: !!id,
          entityMatch: !!expected && BI.state.scope === expected,
          salesMatch: !!expected && document.querySelector('.kpi-card .kpi-value').textContent === BI.number(level === 'PRODUCT' ? expected.productVolume : expected.sales)
        });
        BI.Filters.clear();
      }
      const disabled = ['DATE', 'REGION', 'CATEGORY'].reduce((out, name) => {
        out[name] = document.getElementById('filter' + name).disabled; return out;
      }, {});
      return { levels: results, disabled, cascadingHierarchy: false };
    });
  }

  const result = {
    url: page.url(),
    title: await page.title(),
    frameUrl: appFrame.url(),
    statusTitle: await read('#statusTitle'),
    statusText: await read('#statusText'),
    lastRefresh: await read('#sideStamp'),
    generatedLabel: await read('#generatedStamp'),
    cacheGenerationTimestamp: await appFrame.evaluate(() => BI.state.data && BI.state.data.generatedAt || null),
    cacheBatchId: await appFrame.evaluate(() => BI.state.data && BI.state.data.batchId || null),
    certification: await read('#certification'),
    executive: await appFrame.evaluate(() => {
      const x = BI.state.data && BI.state.data.executive;
      if (!x) return null;
      return {
        sales: x.sales, target: x.target, achievementPct: x.achievementPct, gap: x.gap,
        forecast: x.forecast, forecastAchievementPct: x.forecastAchievementPct,
        averageDailySales: x.averageDailySales, requiredDailySales: x.requiredDailySales,
        currentWorkingDay: x.currentWorkingDay, dueWorkingDay: x.dueWorkingDay, totalWorkingDay: x.totalWorkingDay,
        collection: x.collection, projection: x.projection, lifting: x.lifting, stock: x.stock,
        secondary: x.secondary, productVolume: x.productVolume, dealerCount: x.dealerCount,
        srCount: x.srCount, tsoCount: x.tsoCount, rsmCount: x.rsmCount, productCount: x.productCount,
        growthPct: x.growthPct, growthComparable: x.growthComparable, momentumPct: x.momentumPct,
        forecastBase: x.forecastBase
      };
    }),
    cachePerformance: await appFrame.evaluate(() => BI.state.data && BI.state.data.performance || null),
    measuredPerformance: {
      dashboardReadyMs: Date.now() - auditStarted,
      cacheProbeWallMs,
      cacheServerResponseMs: cacheHealth && cacheHealth.data && cacheHealth.data.responseMs,
      refreshWallMs: typeof refreshWallMs === 'number' ? refreshWallMs : null,
      chartRenderMs: renderTimings.chartMs,
      filterResponseMs: renderTimings.filterMs,
      reportRenderMs: renderTimings.reportMs
    },
    kpiCards: await appFrame.locator('.kpi-card').count(),
    canvases: await appFrame.locator('canvas').count(),
    filterControls: await appFrame.locator('.filter-grid select, .filter-grid input').count(),
    reportRows: await appFrame.locator('#reportTable tbody tr').count(),
    mobileCards: await appFrame.locator('.mobile-report article').count(),
    refreshDisabled: await appFrame.locator('#refreshButton').isDisabled(),
    bodyScrollWidth: await appFrame.locator('body').evaluate(element => element.scrollWidth),
    viewportWidth: await appFrame.evaluate(() => innerWidth),
    interaction,
    filterAudit,
    maintenanceTrigger,
    consoleErrors,
    pageErrors
  };
  if (process.env.SCREENSHOT_PATH) await page.screenshot({ path: process.env.SCREENSHOT_PATH, fullPage: true });
  console.log(JSON.stringify(result, null, 2));
  await browser.close().catch(() => {});
  process.exit(0);
}

main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
