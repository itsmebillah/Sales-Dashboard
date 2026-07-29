const { chromium } = require('playwright-core');

async function main() {
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

  if (process.env.TRIGGER_REFRESH === 'true') {
    await appFrame.locator('#refreshButton').click();
    await appFrame.locator('#refreshButton:not([disabled])').waitFor({ timeout: 360000 });
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
      canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: hit.x + Math.max(1, hit.w / 2), clientY: hit.y + Math.max(1, hit.h / 2), bubbles: true }));
      return getComputedStyle(document.getElementById('flowTooltip')).display !== 'none';
    });
    interaction = { selectedRsm: values[0] || null, scopeName: await read('#scopeName'), tooltipShown };
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
    kpiCards: await appFrame.locator('.kpi-card').count(),
    canvases: await appFrame.locator('canvas').count(),
    filterControls: await appFrame.locator('.filter-grid select, .filter-grid input').count(),
    reportRows: await appFrame.locator('#reportTable tbody tr').count(),
    mobileCards: await appFrame.locator('.mobile-report article').count(),
    refreshDisabled: await appFrame.locator('#refreshButton').isDisabled(),
    bodyScrollWidth: await appFrame.locator('body').evaluate(element => element.scrollWidth),
    viewportWidth: await appFrame.evaluate(() => innerWidth),
    interaction,
    consoleErrors,
    pageErrors
  };
  if (process.env.SCREENSHOT_PATH) await page.screenshot({ path: process.env.SCREENSHOT_PATH, fullPage: true });
  console.log(JSON.stringify(result, null, 2));
  await browser.close().catch(() => {});
  process.exit(0);
}

main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
