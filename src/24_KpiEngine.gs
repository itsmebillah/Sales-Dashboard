SIP.KpiEngine = (function () {
  var A = SIP.KpiAccumulator;

  function calculate(master, options) {
    options = options || {}; var started=Date.now(), aggregated=A.aggregate(master), contracts={};
    Object.keys(aggregated.entities).forEach(function(key){contracts[key]=finalize(aggregated.entities[key]);});
    enrichRanksAndContribution(contracts);
    var risks=SIP.RiskEngine.evaluate(contracts,options);
    var generatedAt=SIP.Utils.nowIso(); risks.forEach(function(r){r.generatedAt=generatedAt;});
    var byType=groupByType(contracts);
    var company=(byType.COMPANY||[])[0] || emptyCompany();
    var snapshot={
      schemaVersion:'1.0.0', kpiVersion:'1.0.0', masterSchemaVersion:master.schemaVersion,
      batchId:master.batchId, generatedAt:generatedAt,
      executive:company,
      hierarchy:{ COMPANY:byType.COMPANY||[], RSM:byType.RSM||[], TSO:byType.TSO||[], SR:byType.SR||[], DEALER:byType.DEALER||[], PRODUCT:byType.PRODUCT||[] },
      sales:buildSalesModule(contracts),
      dealers:buildDealerModule(byType.DEALER||[],risks),
      products:buildProductModule(byType.PRODUCT||[]),
      collection:buildCollectionModule(company,byType.DEALER||[]),
      projection:buildProjectionModule(company,byType.DEALER||[]),
      lifting:buildLiftingModule(company,byType.DEALER||[]),
      forecastBase:{ executive:company.forecastBase, entities:Object.keys(contracts).reduce(function(o,k){o[k]=contracts[k].forecastBase;return o;},{}) },
      risks:risks,
      insights:risks.map(toInsight),
      quality:{ acceptedRecords:aggregated.acceptedRecords, excludedRecords:aggregated.excludedRecords,
        masterQualityFlags:(master.qualityFlags||[]).length, certification:aggregated.excludedRecords===0?'CERTIFIED_INPUT':'PARTIAL_INPUT' },
      performance:{ recordsVisited:(master.records||[]).length, entityContracts:Object.keys(contracts).length, calculationMs:Date.now()-started }
    };
    return snapshot;
  }

  function finalize(state) {
    var sum=state.sums,max=state.maxima;
    var sales=sum.SALES_AMOUNT||0,target=sum.TARGET_AMOUNT||0,collection=sum.COLLECTION_AMOUNT||0;
    var current=max.WORKING_DAYS_ELAPSED || Object.keys(state.daily.SALES_AMOUNT||{}).length;
    var due=max.DUE_WORKING_DAYS||0,total=max.TOTAL_WORKING_DAYS||(current+due);
    var forecast=SIP.ForecastBaseEngine.calculate(state,{sales:sales,currentWorkingDay:current,totalWorkingDay:total});
    var historical=state.periods.HISTORICAL_SALES_AMOUNT||{}, periods=Object.keys(historical).sort();
    var prior=periods.length?historical[periods[periods.length-1]]:null;
    var growthComparable=prior!==null&&prior!==0&&total>0&&current>=total;
    var growth=growthComparable?(sales-prior)/Math.abs(prior):null;
    return {
      entityType:state.entityType,entityId:state.entityId,
      sales:sales,target:target,achievementPct:ratio(sales,target),gap:target-sales,
      forecast:forecast.workingDayForecast,forecastAchievementPct:ratio(forecast.workingDayForecast,target),
      requiredDailySales:due>0?Math.max(target-sales,0)/due:(target>sales?null:0),
      averageDailySales:forecast.averageDailySales,currentWorkingDay:current,dueWorkingDay:due,totalWorkingDay:total,
      dealerCount:A.count(state.sets.dealers),srCount:A.count(state.sets.srs),tsoCount:A.count(state.sets.tsos),
      rsmCount:A.count(state.sets.rsms),productCount:A.count(state.sets.products),
      collection:collection,projection:sum.PROJECTION_AMOUNT||0,lifting:sum.LIFTING_AMOUNT||0,
      stock:A.latestSum(state,'STOCK_AMOUNT'),secondary:sum.SECONDARY_AMOUNT||0,orders:sum.ORDER_COUNT||0,
      growthPct:growth,growthReferenceAmount:prior,growthComparable:growthComparable,momentumPct:forecast.momentum,
      collectionTrendPct:SIP.ForecastBaseEngine.seriesMomentum(state.daily.COLLECTION_AMOUNT||{}),
      collectionFlowRatioPct:ratio(collection,sales),periodSalesCollectionGap:sales-collection,
      productVolume:sum.PRODUCT_QUANTITY||0,contributionPct:null,mixPct:null,rank:null,trend:forecast.historicalTrend.direction,
      forecastBase:forecast,recordCount:state.recordCount,certification:'PROVISIONAL'
    };
  }

  function enrichRanksAndContribution(contracts) {
    var grouped=groupByType(contracts);
    Object.keys(grouped).forEach(function(type){
      var rows=grouped[type],total=rows.reduce(function(a,x){return a+(type==='PRODUCT'?x.productVolume:x.sales);},0);
      rows.sort(function(a,b){return (type==='PRODUCT'?b.productVolume:b.sales)-(type==='PRODUCT'?a.productVolume:a.sales);});
      rows.forEach(function(x,i){x.rank=i+1;var value=type==='PRODUCT'?x.productVolume:x.sales;x.contributionPct=ratio(value,total);if(type==='PRODUCT')x.mixPct=x.contributionPct;});
    });
  }
  function groupByType(contracts){return Object.keys(contracts).reduce(function(o,k){var x=contracts[k];o[x.entityType]=o[x.entityType]||[];o[x.entityType].push(x);return o;},{});}
  function buildSalesModule(c){return { entities:Object.keys(c).map(function(k){return c[k];}),metricSource:'KPI_CONTRACT_V1' };}
  function buildDealerModule(rows,risks){var riskBy={};risks.filter(function(r){return r.entityType==='DEALER';}).forEach(function(r){riskBy[r.entityId]=riskBy[r.entityId]||[];riskBy[r.entityId].push(r);});return {entities:rows.map(function(x){return Object.assign({},x,{dealerRisk:riskBy[x.entityId]||[]});}),top:rows.slice().sort(function(a,b){return b.sales-a.sales;}).slice(0,10),bottom:rows.filter(function(x){return x.sales>0;}).sort(function(a,b){return a.sales-b.sales;}).slice(0,10)};}
  function buildProductModule(rows){var sorted=rows.slice().sort(function(a,b){return b.productVolume-a.productVolume;});return {entities:rows,topProducts:sorted.slice(0,10),bottomProducts:sorted.filter(function(x){return x.productVolume>0;}).slice(-10).reverse(),unitPolicy:'SOURCE_UNIT_ONLY'};}
  function buildCollectionModule(c,dealers){return {total:c.collection,ratio:c.collectionFlowRatioPct,trendPct:c.collectionTrendPct,coveragePct:ratio(dealers.filter(function(x){return x.collection>0;}).length,dealers.filter(function(x){return x.sales>0;}).length),exceptions:dealers.filter(function(x){return x.sales>0&&x.collection===0;}).map(function(x){return x.entityId;})};}
  function buildProjectionModule(c,dealers){return {total:c.projection,dealerCount:dealers.filter(function(x){return x.projection>0;}).length,exceptions:dealers.filter(function(x){return x.sales>0&&x.projection===0;}).map(function(x){return x.entityId;})};}
  function buildLiftingModule(c,dealers){return {total:c.lifting,stock:c.stock,secondary:c.secondary,salesFlowRatioPct:ratio(c.lifting,c.sales),exceptions:dealers.filter(function(x){return x.sales>0&&x.lifting===0;}).map(function(x){return x.entityId;})};}
  function toInsight(r){return {type:r.type,severity:r.severity,entity:r.entityType,entityId:r.entityId,metric:r.metric,value:r.value,threshold:r.threshold,riskId:r.riskId};}
  function ratio(a,b){return a===null||a===undefined||b===null||b===undefined||b===0?null:a/b;}
  function emptyCompany(){return finalize({entityType:'COMPANY',entityId:'COMPANY:DEFAULT',sums:{},maxima:{},latest:{},periods:{},daily:{},sets:{dealers:{},srs:{},tsos:{},rsms:{},products:{}},recordCount:0});}
  return { calculate:calculate };
}());
