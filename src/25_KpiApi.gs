SIP.KpiService = (function () {
  function config(overrides) {
    var merged=Object.assign({},overrides||{});
    merged.cache=Object.assign({},merged.cache||{},{namespace:'SIP_KPI_V1'});
    return SIP.Config.get(merged);
  }
  function get(options) {
    options=options||{}; var cfg=config(options.config),diagnostics=new SIP.Diagnostics();
    var masterResult=SIP.DataEngine.get({forceRefresh:!!options.refreshMaster,writeDiagnostics:options.writeDiagnostics!==false,config:options.masterConfig||options.config});
    if(!options.forceRefresh){
      var cached=SIP.CacheEngine.get(cfg,diagnostics);
      if(cached&&cached.batchId===masterResult.master.batchId)return{snapshot:cached,cache:{hit:true},diagnostics:diagnostics.finish(),master:masterResult.cache};
      if(cached)diagnostics.issue('WARN','KPI_CACHE_STALE','KPI cache batch does not match Master Dataset',{kpiBatchId:cached.batchId,masterBatchId:masterResult.master.batchId});
    }
    var snapshot=SIP.KpiEngine.calculate(masterResult.master,options);
    var cacheResult=SIP.CacheEngine.put(snapshot,cfg,diagnostics);
    return{snapshot:snapshot,cache:cacheResult,diagnostics:diagnostics.finish(),master:masterResult.cache};
  }
  function getCached(options) {
    options=options||{}; var diagnostics=new SIP.Diagnostics(),snapshot=SIP.CacheEngine.get(config(options.config),diagnostics);
    return snapshot?{snapshot:snapshot,cache:{hit:true},diagnostics:diagnostics.finish()}:{snapshot:null,cache:{hit:false},diagnostics:diagnostics.finish()};
  }
  function refreshFromMaster(master,options) {
    if(!master||!master.batchId)throw new Error('A certified Master Dataset is required');
    options=options||{};var diagnostics=new SIP.Diagnostics(),snapshot=SIP.KpiEngine.calculate(master,options);
    var cacheResult=SIP.CacheEngine.put(snapshot,config(options.config),diagnostics);
    return{snapshot:snapshot,cache:cacheResult,diagnostics:diagnostics.finish(),master:{batchId:master.batchId}};
  }
  function invalidate(){SIP.CacheEngine.remove(config());return{invalidated:true,at:SIP.Utils.nowIso()};}
  return{get:get,getCached:getCached,refreshFromMaster:refreshFromMaster,invalidate:invalidate};
}());

/** Cache-first certified KPI snapshot for every future consumer. */
function getKpiSnapshot(options){return SIP.KpiService.get(options||{}).snapshot;}

/** Recalculate KPIs from the cached Master Dataset (or rebuild Master on miss). */
function refreshKpiSnapshot(master){return master?SIP.KpiService.refreshFromMaster(master,{}):SIP.KpiService.get({forceRefresh:true,writeDiagnostics:true});}

/** Return only machine-readable risk and structured insight objects. */
function getRiskAndInsightSnapshot(){var x=SIP.KpiService.get({});return{generatedAt:x.snapshot.generatedAt,risks:x.snapshot.risks,insights:x.snapshot.insights};}

function invalidateKpiCache(){return SIP.KpiService.invalidate();}
