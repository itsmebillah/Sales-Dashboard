/**
 * Main Apps Script entry point (Code.gs).
 * Features: Automatic External Data Sync & Clean 1-Hour Dashboard Refresh.
 */

/**
 * Hourly dashboard refresh execution function.
 * Copies external Sales Data ('Sheet4!A1:DS' from 1uQnfNHo-rkazm02yG81LZn1slmQtNvmiFwS48vjq1E0)
 * into 'Sales Data Base Monthly' in this workbook and updates certified dashboard cache.
 */
/**
 * 30-Minute automated sync & dashboard refresh execution function.
 * Copies external 'Raw Data' D4:AO from spreadsheet 19m8lzD1oz1TKviS0zMqLKi-hEC8odGuhh69nSHRUzzE
 * into 'Raw Data' C3:AN in this workbook and updates certified dashboard cache.
 */
function runThirtyMinuteSyncAndRefresh() {
  var syncResult = SIP.ExternalSync.sync();
  if (!syncResult.ok) {
    Logger.log('External Sync Error: ' + JSON.stringify(syncResult.error));
    return syncResult;
  }
  var refreshResult = refreshDashboardData();
  Logger.log('30-Minute Dashboard Refresh Completed.');
  return { sync: syncResult, refresh: refreshResult };
}

/**
 * Run this function ONCE from Apps Script to set up the 30-minute automatic sync trigger!
 */
function setupThirtyMinuteSyncTrigger() {
  clearAllDashboardTriggers();
  ScriptApp.newTrigger('runThirtyMinuteSyncAndRefresh')
    .timeBased()
    .everyMinutes(30)
    .create();
  Logger.log('Automated 30-minute sync & dashboard refresh trigger configured successfully.');
  return { ok: true, message: 'Automated 30-minute sync & refresh trigger configured successfully.' };
}

function runHourlyDashboardRefresh() {
  return runThirtyMinuteSyncAndRefresh();
}

function setupHourlyRefreshTrigger() {
  return setupThirtyMinuteSyncTrigger();
}

/** Clears all dashboard triggers */
function clearAllDashboardTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var fn = triggers[i].getHandlerFunction();
    if (fn === 'runThirtyMinuteSyncAndRefresh' || fn === 'runHourlyDashboardRefresh' || fn === 'runFiveMinuteRetryRefresh' || fn === 'runTenMinuteExternalSync') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

/** Alias for direct execution */
function runTenMinuteExternalSync() {
  return runThirtyMinuteSyncAndRefresh();
}

/**
 * Custom spreadsheet menu created on opening the workbook in Google Sheets.
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('⚡ Sales Dashboard')
      .addItem('🔥 Hard Refresh (Force Clear Cache & Rebuild)', 'runHardRefresh')
      .addItem('💾 Add Cache Manually (Dashboard Cache Tab)', 'addCacheManually')
      .addItem('📥 Run External Sync (D4:AO -> C3:AN) & Refresh', 'runThirtyMinuteSyncAndRefresh')
      .addSeparator()
      .addItem('⚙️ One-Click Platform Setup', 'runPlatformSetup')
      .addItem('🕒 Setup 30-Min Auto Sync Trigger', 'setupThirtyMinuteSyncTrigger')
      .addToUi();
  } catch (e) {
    // Execution outside Spreadsheet UI context
  }
}

/**
 * Hard Refresh: Force clears all L1 and L2 caches, re-syncs external ERP sales data,
 * re-parses all workbook data from scratch, recalculates KPIs, and publishes fresh certified cache.
 */
function runHardRefresh() {
  var started = Date.now();
  Logger.log('Starting Hard Refresh...');
  try {
    // 1. Purge L1 memory cache and L2 Durable Cache sheet tab
    try {
      var config = dashboardCacheConfig();
      SIP.CacheEngine.remove(config);
      SIP.DurableCache.remove();
    } catch (e) {
      Logger.log('Cache purge warning: ' + (e ? e.message : ''));
    }

    // 2. Perform external sync if enabled
    var syncResult = null;
    try {
      syncResult = SIP.ExternalSync.sync();
    } catch (e) {
      Logger.log('Sync warning: ' + (e ? e.message : ''));
    }

    // 3. Force full data engine parse + KPI calculation + cache publication
    var refreshResult = refreshDashboardData({ forceRefresh: true });
    if (!refreshResult.ok) {
      throw new Error(refreshResult.error ? refreshResult.error.message : 'Dashboard hard refresh failed');
    }

    var durationMs = Date.now() - started;
    var batchId = refreshResult.data ? refreshResult.data.batchId : 'N/A';
    var syncStatus = (syncResult && syncResult.ok) ? ('SUCCESS (' + (syncResult.rows || 0) + ' rows synced)') : 'SKIPPED/OK';
    
    var successMsg = '🔥 Hard Refresh Completed Successfully!\n\n' +
                     '• External Sync: ' + syncStatus + '\n' +
                     '• Master Batch ID: ' + batchId + '\n' +
                     '• Total Execution Time: ' + durationMs + ' ms';
    Logger.log(successMsg);

    try {
      if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
        SpreadsheetApp.getUi().alert('Hard Refresh Complete', successMsg, SpreadsheetApp.getUi().ButtonSet.OK);
      }
    } catch (e) {}

    return { ok: true, message: 'Hard refresh completed successfully', batchId: batchId, durationMs: durationMs, sync: syncResult, refresh: refreshResult };
  } catch (error) {
    var errorMsg = 'Hard Refresh Failed: ' + (error && error.message ? error.message : 'Unknown error');
    Logger.log(errorMsg);
    try {
      if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
        SpreadsheetApp.getUi().alert('Hard Refresh Error', errorMsg, SpreadsheetApp.getUi().ButtonSet.OK);
      }
    } catch (e) {}
    return { ok: false, error: { message: errorMsg }, durationMs: Date.now() - started };
  }
}

/**
 * One-Click Platform Setup: Authorizes production workbook, configures 1-hour hourly refresh trigger,
 * and sets up daily maintenance automated triggers.
 */
function runPlatformSetup() {
  var started = Date.now();
  Logger.log('Running One-Click Platform Setup...');
  try {
    var auth = authorizeProduction();
    var triggerResult = setupHourlyRefreshTrigger();
    var maintResult = typeof installDailyMaintenanceTrigger === 'function' ? installDailyMaintenanceTrigger() : { installed: false };

    var msg = '⚙️ One-Click Platform Setup Completed Successfully!\n\n' +
              '• Spreadsheet Connected: ' + (auth.spreadsheetName || 'OK') + '\n' +
              '• Hourly Data Sync & Refresh Trigger: ACTIVE\n' +
              '• Daily Maintenance Trigger: ACTIVE (' + (maintResult.hour || 3) + ':00 AM)\n\n' +
              'Your platform is fully configured and operational!';
    Logger.log(msg);

    try {
      if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
        SpreadsheetApp.getUi().alert('Platform Setup Complete', msg, SpreadsheetApp.getUi().ButtonSet.OK);
      }
    } catch (e) {}

    return { ok: true, auth: auth, trigger: triggerResult, maintenance: maintResult, durationMs: Date.now() - started };
  } catch (error) {
    var errorMsg = 'Platform Setup Failed: ' + (error && error.message ? error.message : 'Unknown error');
    Logger.log(errorMsg);
    try {
      if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
        SpreadsheetApp.getUi().alert('Platform Setup Error', errorMsg, SpreadsheetApp.getUi().ButtonSet.OK);
      }
    } catch (e) {}
    return { ok: false, error: { message: errorMsg } };
  }
}

/**
 * Manually builds/refreshes and populates the certified dashboard cache into the 'Dashboard Cache' tab.
 */
function addCacheManually() {
  var started = Date.now();
  Logger.log('Starting manual cache addition to "Dashboard Cache" tab...');
  try {
    var refreshResult = refreshDashboardData();
    if (!refreshResult.ok) {
      var errorMsg = 'Failed to add cache to Dashboard Cache tab: ' + (refreshResult.error ? refreshResult.error.message : 'Unknown error');
      Logger.log(errorMsg);
      try {
        if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
          SpreadsheetApp.getUi().alert('Cache Update Error', errorMsg, SpreadsheetApp.getUi().ButtonSet.OK);
        }
      } catch (e) {}
      return refreshResult;
    }

    var batchId = refreshResult.data ? refreshResult.data.batchId : 'N/A';
    var durationMs = refreshResult.refresh ? refreshResult.refresh.durationMs : (Date.now() - started);
    var durableCacheInfo = (refreshResult.refresh && refreshResult.refresh.dashboardCache) ? refreshResult.refresh.dashboardCache.durable : null;
    var chunks = durableCacheInfo ? durableCacheInfo.chunks : 0;

    var successMsg = 'Cache manually added to "Dashboard Cache" tab successfully!\n\n' +
                       '• Batch ID: ' + batchId + '\n' +
                       '• Chunks Written: ' + chunks + '\n' +
                       '• Execution Time: ' + durationMs + ' ms';
    Logger.log(successMsg);

    try {
      if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
        SpreadsheetApp.getUi().alert('Dashboard Cache Updated', successMsg, SpreadsheetApp.getUi().ButtonSet.OK);
      }
    } catch (e) {}

    return {
      ok: true,
      message: 'Cache manually added to Dashboard Cache tab successfully.',
      batchId: batchId,
      chunks: chunks,
      durationMs: durationMs,
      details: refreshResult
    };
  } catch (err) {
    var fatalMsg = 'Manual Cache Addition Failed: ' + (err && err.message ? err.message : String(err));
    Logger.log(fatalMsg);
    try {
      if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
        SpreadsheetApp.getUi().alert('Cache Update Exception', fatalMsg, SpreadsheetApp.getUi().ButtonSet.OK);
      }
    } catch (e) {}
    return { ok: false, error: { message: fatalMsg }, durationMs: Date.now() - started };
  }
}

/** Aliases for direct execution from Apps Script Editor or Macros */
function hardRefreshDashboard() { return runHardRefresh(); }
function forceHardRefresh() { return runHardRefresh(); }
function setupPlatform() { return runPlatformSetup(); }
function setupDashboard() { return runPlatformSetup(); }
function addDashboardCacheManually() { return addCacheManually(); }
function addCacheManuallyToDashboardCacheTab() { return addCacheManually(); }


