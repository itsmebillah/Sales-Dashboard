/**
 * Owner-authenticated Execution API contract for independent server consumers.
 * It is not a web app and cannot be called anonymously.
 */
function getDashboardApi(view) {
  var started = Date.now();
  try {
    view = view ? String(view) : 'dashboard';
    if (view !== 'dashboard' && view !== 'health') return { ok:false, error:{ code:'UNSUPPORTED_VIEW', message:'Supported views: dashboard, health' } };
    var result = SIP.KpiService.get({ writeDiagnostics:false });
    var snapshot = result.snapshot;
    if (view === 'health') {
      return { ok:true, data:{
        service:'sales-intelligence-platform', release:SIP.VERSION, kpiVersion:snapshot.kpiVersion,
        masterSchemaVersion:snapshot.masterSchemaVersion, batchId:snapshot.batchId, generatedAt:snapshot.generatedAt,
        quality:snapshot.quality, calculationMs:snapshot.performance.calculationMs, responseMs:Date.now()-started
      }};
    }
    return { ok:true, data:{
      release:SIP.VERSION, kpiVersion:snapshot.kpiVersion, masterSchemaVersion:snapshot.masterSchemaVersion,
      batchId:snapshot.batchId, generatedAt:snapshot.generatedAt,
      executive:snapshot.executive, hierarchy:snapshot.hierarchy,
      dealers:snapshot.dealers, products:snapshot.products,
      collection:snapshot.collection, projection:snapshot.projection, lifting:snapshot.lifting,
      risks:snapshot.risks, insights:snapshot.insights, quality:snapshot.quality, performance:snapshot.performance
    }};
  } catch (error) {
    return { ok:false, error:{ code:'BACKEND_ERROR', message:error && error.message ? error.message : 'Unknown backend error' }, responseMs:Date.now()-started };
  }
}
