/**
 * Cache-only dashboard contract shared by HTML Service browser functions.
 * It never opens the spreadsheet or starts a data build.
 */
function getDashboardApi(view) {
  var started = Date.now();
  try {
    view = view ? String(view) : 'dashboard';
    if (view !== 'dashboard' && view !== 'health') return { ok:false, error:{ code:'UNSUPPORTED_VIEW', message:'Supported views: dashboard, health' } };
    var config=dashboardCacheConfig(),diagnostics=new SIP.Diagnostics();
    var snapshot = SIP.CacheEngine.get(config,diagnostics) || SIP.DurableCache.get();
    if (!snapshot) return { ok:false, error:{ code:'KPI_CACHE_EMPTY', message:'Certified KPI cache is empty. Run refresh to publish the dashboard.' }, responseMs:Date.now()-started };
    if(!SIP.CacheEngine.get(config,new SIP.Diagnostics()))SIP.CacheEngine.put(snapshot,config,new SIP.Diagnostics());
    if (view === 'health') {
      return { ok:true, data:{
        service:'sales-intelligence-platform', release:SIP.VERSION, kpiVersion:snapshot.kpiVersion,
        masterSchemaVersion:snapshot.masterSchemaVersion, batchId:snapshot.batchId, generatedAt:snapshot.generatedAt,
        quality:snapshot.quality, calculationMs:snapshot.performance.calculationMs, responseMs:Date.now()-started
      }};
    }
    return { ok:true, data:snapshot };
  } catch (error) {
    return { ok:false, error:{ code:'BACKEND_ERROR', message:error && error.message ? error.message : 'Unknown backend error' }, responseMs:Date.now()-started };
  }
}

function dashboardCacheConfig() {
  return SIP.Config.get({cache:{namespace:'SIP_DASHBOARD_V1',ttlSeconds:21600,chunkChars:30000,maxChunks:60}});
}

/** Publish and verify the compact certified consumer projection. */
function publishDashboardApi(snapshot) {
  var data=dashboardPayload(snapshot).data,diagnostics=new SIP.Diagnostics(),config=dashboardCacheConfig();
  var durable=SIP.DurableCache.put(data);
  if(!durable.cached)throw new Error('Certified durable dashboard cache publication failed: '+durable.reason+' ('+(durable.chunks||0)+' chunks)');
  var levelOne=SIP.CacheEngine.put(data,config,diagnostics);
  var verified=SIP.DurableCache.get();
  if(!verified||verified.batchId!==data.batchId)throw new Error('Certified durable dashboard cache publication verification failed');
  return{data:data,cache:{durable:durable,levelOne:levelOne}};
}

/** Compact, certified consumer projection. KPI calculations remain unchanged. */
function dashboardPayload(snapshot) {
  return { ok:true, data:{
    release:SIP.VERSION, kpiVersion:snapshot.kpiVersion, masterSchemaVersion:snapshot.masterSchemaVersion,
    batchId:snapshot.batchId, generatedAt:snapshot.generatedAt,
    executive:snapshot.executive, labels:snapshot.labels||{}, hierarchy:snapshot.hierarchy,
    dealers:{top:snapshot.dealers.top},
    products:{topProducts:snapshot.products.topProducts,unitPolicy:snapshot.products.unitPolicy},
    collection:{total:snapshot.collection.total,ratio:snapshot.collection.ratio,trendPct:snapshot.collection.trendPct,coveragePct:snapshot.collection.coveragePct},
    projection:{total:snapshot.projection.total,dealerCount:snapshot.projection.dealerCount},
    lifting:{total:snapshot.lifting.total,stock:snapshot.lifting.stock,secondary:snapshot.lifting.secondary,salesFlowRatioPct:snapshot.lifting.salesFlowRatioPct},
    risks:(snapshot.risks||[]).slice(0,30), insights:(snapshot.insights||[]).slice(0,30),
    riskTotal:(snapshot.risks||[]).length, insightTotal:(snapshot.insights||[]).length,
    quality:snapshot.quality, performance:snapshot.performance
  }};
}
