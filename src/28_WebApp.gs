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
function refreshDashboardData() {
  var started=Date.now();
  try {
    var masterResult=runDataEngine();
    var kpiResult=refreshKpiSnapshot(masterResult.master);
    var response=dashboardPayload(kpiResult.snapshot);
    response.refresh={ok:true,durationMs:Date.now()-started,masterCache:masterResult.cache,kpiCache:kpiResult.cache};
    return response;
  } catch(error) {
    return{ok:false,error:{code:error&&error.message==='Another data-engine build is already running'?'REFRESH_IN_PROGRESS':'REFRESH_FAILED',message:error&&error.message?error.message:'Refresh failed'},durationMs:Date.now()-started};
  }
}

function runDataEngine(){return SIP.DataEngine.run({writeDiagnostics:true});}
