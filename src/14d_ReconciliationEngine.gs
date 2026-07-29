SIP.ReconciliationEngine=(function(){
  function calculate(parsed,config,diagnostics){
    var sales=parsed.filter(function(x){return x.sourceId==='SRC_SALES_MONTHLY';})[0],records=sales?sales.records:[];
    var atomic=sum(records,'SALES_AMOUNT'),mtd=sum(records,'SALES_MTD_AMOUNT'),control=sales&&sales.metadata?sales.metadata.salesControlTotal:null;
    var variance=control===null?null:atomic-control,tolerance=config.quality.salesControlTolerance;
    var accepted=variance!==null&&Math.abs(variance)<=tolerance;
    if(variance!==0)diagnostics.issue(accepted?'WARN':'ERROR','SALES_CONTROL_VARIANCE',accepted?'Documented upstream control variance; atomic daily detail remains authoritative':'Sales control variance exceeds the approved tolerance',{atomicDaily:atomic,srMtd:mtd,sourceControl:control,variance:variance,tolerance:tolerance,policy:'ATOMIC_DAILY_AUTHORITATIVE'});
    return{sales:{atomicDaily:atomic,srMtd:mtd,sourceControl:control,variance:variance,tolerance:tolerance,varianceRate:control?variance/control:null,accepted:accepted,status:variance===0?'RECONCILED':(accepted?'DOCUMENTED_VARIANCE':'FAILED'),policy:'ATOMIC_DAILY_AUTHORITATIVE'}};
  }
  function sum(records,metric){return records.filter(function(r){return r.metric_id===metric;}).reduce(function(n,r){return n+(Number(r.numeric_value)||0);},0);}
  return{calculate:calculate};
}());
