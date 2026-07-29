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
    await page.waitForTimeout(5000);
  }

  const read = selector => appFrame.locator(selector).first().textContent().catch(() => null);
  const result = {
    url: page.url(),
    title: await page.title(),
    frameUrl: appFrame.url(),
    statusTitle: await read('#statusTitle'),
    statusText: await read('#statusText'),
    kpiCards: await appFrame.locator('.kpi-card').count(),
    canvases: await appFrame.locator('canvas').count(),
    filterControls: await appFrame.locator('.filter-grid select, .filter-grid input').count(),
    reportRows: await appFrame.locator('#reportTable tbody tr').count(),
    mobileCards: await appFrame.locator('.mobile-report article').count(),
    refreshDisabled: await appFrame.locator('#refreshButton').isDisabled(),
    bodyScrollWidth: await appFrame.locator('body').evaluate(element => element.scrollWidth),
    viewportWidth: await appFrame.evaluate(() => innerWidth),
    consoleErrors,
    pageErrors
  };
  if (process.env.SCREENSHOT_PATH) await page.screenshot({ path: process.env.SCREENSHOT_PATH, fullPage: true });
  console.log(JSON.stringify(result, null, 2));
  await browser.close().catch(() => {});
  process.exit(0);
}

main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
