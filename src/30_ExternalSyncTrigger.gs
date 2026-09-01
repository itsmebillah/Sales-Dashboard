/**
 * External sync trigger module for automated Sales Data Sync.
 * Top-level trigger functions are cleanly registered in Code.gs.
 */
SIP.ExternalSyncTrigger = (function () {
  function runHourlySync() {
    var syncResult = SIP.ExternalSync.sync();
    if (!syncResult.ok) {
      Logger.log('External Sync Error: ' + JSON.stringify(syncResult.error));
      return syncResult;
    }
    var refreshResult = refreshDashboardData();
    Logger.log('Hourly Dashboard Refresh Completed.');
    return { sync: syncResult, refresh: refreshResult };
  }

  return { runHourlySync: runHourlySync };
}());

