/** Public HTML Service entry point. It never opens or parses the spreadsheet. */
function doGet() {
  return HtmlService.createTemplateFromFile('src/html/Index').evaluate()
    .setTitle('Sales Intelligence Platform')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT)
    .addMetaTag('viewport','width=device-width, initial-scale=1, viewport-fit=cover');
}

function include(filename) { return HtmlService.createHtmlOutputFromFile(filename).getContent(); }

/** Cache-only browser contract. Never calls DataEngine or KpiEngine. */
function getCachedDashboardApi() { return getDashboardApi('dashboard'); }

/** Explicit refresh: one parse, one KPI calculation, then publish cache. */
function refreshDashboardData(options) {
  var started=Date.now();
  try {
    var masterResult=runDataEngine(options);
    if(!masterResult.certification||!masterResult.certification.certified)throw new Error('Data Engine batch did not pass certification');
    var kpiResult=refreshKpiSnapshot(masterResult.master);
    var dashboardResult=publishDashboardApi(kpiResult.snapshot),response={ok:true,data:dashboardResult.data};
    response.refresh={ok:true,durationMs:Date.now()-started,masterCache:masterResult.cache,kpiCache:kpiResult.cache,dashboardCache:dashboardResult.cache};
    return response;
  } catch(error) {
    var isLock = error && /in progress|already running/i.test(error.message || '');
    return{ok:false,error:{code:isLock?'REFRESH_IN_PROGRESS':'REFRESH_FAILED',message:error&&error.message?error.message:'Refresh failed'},durationMs:Date.now()-started};
  }
}

function runDataEngine(options){return SIP.DataEngine.run(Object.assign({writeDiagnostics:true}, options || {}));}

/** Read-only production refresh progress for timeout diagnostics. */
function getRefreshTrace(){return SIP.RefreshTrace.get();}

/** One-time owner authorization and private Sheet connectivity check. */
function authorizeProduction() {
  var config=SIP.Config.get(),spreadsheet=SpreadsheetApp.openById(config.spreadsheetId);
  return{authorized:true,spreadsheetName:spreadsheet.getName(),checkedAt:SIP.Utils.nowIso()};
}

/** Helper function to set up automated 10-minute trigger in Google Apps Script. */
function setupTenMinuteSyncTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'runTenMinuteExternalSync') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('runTenMinuteExternalSync')
    .timeBased()
    .everyMinutes(10)
    .create();
  Logger.log('Automated 10-minute external sync trigger configured successfully.');
  return { ok: true, message: 'Automated 10-minute external sync trigger configured successfully.' };
}


