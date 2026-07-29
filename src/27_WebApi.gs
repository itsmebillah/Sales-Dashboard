/**
 * Cache-only dashboard contract shared by HTML Service browser functions.
 * It never opens the spreadsheet or starts a data build.
 */
function getDashboardApi(view) {
  var started = Date.now();
  try {
    view = view ? String(view) : 'dashboard';
    if (view !== 'dashboard' && view !== 'health') return { ok:false, error:{ code:'UNSUPPORTED_VIEW', message:'Supported views: dashboard, health' } };
    var result = SIP.KpiService.getCached({});
    if (!result.snapshot) return { ok:false, error:{ code:'KPI_CACHE_EMPTY', message:'Certified KPI cache is empty. Run refresh to publish the dashboard.' }, responseMs:Date.now()-started };
    var snapshot = result.snapshot;
    if (view === 'health') {
      return { ok:true, data:{
        service:'sales-intelligence-platform', release:SIP.VERSION, kpiVersion:snapshot.kpiVersion,
        masterSchemaVersion:snapshot.masterSchemaVersion, batchId:snapshot.batchId, generatedAt:snapshot.generatedAt,
        quality:snapshot.quality, calculationMs:snapshot.performance.calculationMs, responseMs:Date.now()-started
      }};
    }
    return dashboardPayload(snapshot);
  } catch (error) {
    return { ok:false, error:{ code:'BACKEND_ERROR', message:error && error.message ? error.message : 'Unknown backend error' }, responseMs:Date.now()-started };
  }
}

/** Compact, certified consumer projection. KPI calculations remain unchanged. */
function dashboardPayload(snapshot) {
  return { ok:true, data:{
    release:SIP.VERSION, kpiVersion:snapshot.kpiVersion, masterSchemaVersion:snapshot.masterSchemaVersion,
    batchId:snapshot.batchId, generatedAt:snapshot.generatedAt,
    executive:snapshot.executive, labels:snapshot.labels||{}, hierarchy:snapshot.hierarchy,
    dealers:{top:snapshot.dealers.top,bottom:snapshot.dealers.bottom},
    products:{topProducts:snapshot.products.topProducts,bottomProducts:snapshot.products.bottomProducts,unitPolicy:snapshot.products.unitPolicy},
    collection:snapshot.collection, projection:snapshot.projection, lifting:snapshot.lifting,
    risks:snapshot.risks, insights:snapshot.insights, quality:snapshot.quality, performance:snapshot.performance
  }};
}
