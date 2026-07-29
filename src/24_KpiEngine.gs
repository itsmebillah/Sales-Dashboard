SIP.KpiEngine = (function () {
  var A = SIP.KpiAccumulator;

  function calculate(master, options) {
    options = options || {}; var started=Date.now(), aggregated=A.aggregate(master), contracts={};
    Object.keys(aggregated.entities).forEach(function(key){contracts[key]=finalize(aggregated.entities[key],master.calendar);});
    enrichRanksAndContribution(contracts);
    var risks=SIP.RiskEngine.evaluate(contracts,options);
    var generatedAt=SIP.Utils.nowIso(); risks.forEach(function(r){r.generatedAt=generatedAt;});
    var byType=groupByType(contracts);
    var company=(byType.COMPANY||[])[0] || emptyCompany();
    var snapshot={
      schemaVersion:'1.0.0', kpiVersion:'1.0.0', masterSchemaVersion:master.schemaVersion,
      batchId:master.batchId, generatedAt:generatedAt,
      executive:company,
      labels:buildDisplayLabels(master.dimensions||{}),
      hierarchy:{ COMPANY:byType.COMPANY||[], RSM:byType.RSM||[], TSO:byType.TSO||[], SR:byType.SR||[], DEALER:byType.DEALER||[], PRODUCT:byType.PRODUCT||[], CATEGORY:byType.CATEGORY||[] },
      periods:buildPeriodContexts(master),
      sales:buildSalesModule(contracts),
      dealers:buildDealerModule(byType.DEALER||[],risks),
      products:buildProductModule(byType.PRODUCT||[]),
      collection:buildCollectionModule(company,byType.DEALER||[]),
      projection:buildProjectionModule(company,byType.DEALER||[]),
      lifting:buildLiftingModule(company,byType.DEALER||[]),
      attendance:buildAttendanceModule(master.attendance),
      forecastBase:{ executive:company.forecastBase, entities:Object.keys(contracts).reduce(function(o,k){o[k]=contracts[k].forecastBase;return o;},{}) },
      risks:risks,
      insights:risks.map(toInsight),
      quality:{ acceptedRecords:aggregated.acceptedRecords, excludedRecords:aggregated.excludedRecords,
        masterQualityFlags:(master.qualityFlags||[]).length, certification:master.certification&&master.certification.certified?'CERTIFIED':'NOT_CERTIFIED', certificationGate:master.certification||null },
      performance:{ recordsVisited:(master.records||[]).length, entityContracts:Object.keys(contracts).length, calculationMs:Date.now()-started }
    };
    return snapshot;
  }

  function finalize(state,calendar) {
    var sum=state.sums,max=state.maxima;
    var sales=sum.SALES_AMOUNT||0,target=sum.TARGET_AMOUNT||0,collection=sum.COLLECTION_AMOUNT||0;
    var current=calendar&&calendar.current?calendar.current.elapsed:0;
    var due=calendar&&calendar.current?calendar.current.remaining:0,total=calendar&&calendar.current?calendar.current.total:0;
    var forecast=SIP.ForecastBaseEngine.calculate(state,{sales:sales,currentWorkingDay:current,totalWorkingDay:total,calendar:calendar});
    var historical=state.periods.HISTORICAL_SALES_AMOUNT||{}, periods=Object.keys(historical).sort();
    var prior=forecast.previousMonthComparableSales||null;
    var growthComparable=prior!==null&&prior!==0;
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
  function buildPeriodContexts(master){var out={};(master.records||[]).forEach(function(r){if((r.quality_status!=='VALID'&&r.quality_status!=='CERTIFIED')||(r.metric_id!=='SALES_AMOUNT'&&r.metric_id!=='HISTORICAL_DAILY_SALES_AMOUNT'))return;var p=r.period_start;if(!p)return;var x=out[p]=out[p]||{entityType:'COMPANY',entityId:'PERIOD:'+p,periodStart:p,sales:0,target:null,forecast:null,achievementPct:null,gap:null,collection:null,projection:null,lifting:null,stock:null,secondary:null,productCount:0,srCount:0,tsoCount:0,rsmCount:0,dealerCount:0};x.sales+=Number(r.numeric_value)||0;});return Object.keys(out).sort().map(function(k){return out[k];});}
  function buildAttendanceModule(attendance){attendance=attendance||{};return {type:attendance.type||'SALES_ACTIVITY_NOT_HR',statusSource:attendance.statusSource||'SALES_ACTIVITY_DERIVED',providerContract:attendance.providerContract||'ATTENDANCE_PROVIDER_V1',hrAttendance:false,employeeCount:attendance.employeeCount||0,workingDays:attendance.workingDays||0,present:attendance.present||0,absent:attendance.absent||0};}
  function toInsight(r){return {type:r.type,severity:r.severity,entity:r.entityType,entityId:r.entityId,metric:r.metric,value:r.value,threshold:r.threshold,riskId:r.riskId};}
  function buildDisplayLabels(dimensions){
    var labels={COMPANY:{'COMPANY:DEFAULT':'Company total'},RSM:{},TSO:{},SR:{},DEALER:{},PRODUCT:{},CATEGORY:{}};
    Object.keys(dimensions.employees||{}).forEach(function(id){var x=dimensions.employees[id]||{},name=x.name||x.normalizedName;if(!name)return;var role=String(x.role||'').toUpperCase();if(role==='RSM')labels.RSM[id]=name;else if(role==='TSO')labels.TSO[id]=name;else labels.SR[id]=name;});
    Object.keys(dimensions.dealers||{}).forEach(function(id){var x=dimensions.dealers[id]||{};if(x.name||x.normalizedName)labels.DEALER[id]=x.name||x.normalizedName;});
    Object.keys(dimensions.products||{}).forEach(function(id){var x=dimensions.products[id]||{},parts=[x.name,x.pack,x.group].filter(Boolean);if(parts.length)labels.PRODUCT[id]=parts.join(' · ');if(x.group)labels.CATEGORY['PRODUCT_GROUP:'+SIP.Utils.hash(x.group).slice(0,16)]=x.group;});
    return labels;
  }
  function ratio(a,b){return a===null||a===undefined||b===null||b===undefined||b===0?null:a/b;}
  function emptyCompany(){return finalize({entityType:'COMPANY',entityId:'COMPANY:DEFAULT',sums:{},maxima:{},latest:{},periods:{},daily:{},sets:{dealers:{},srs:{},tsos:{},rsms:{},products:{}},recordCount:0},null);}
  return { calculate:calculate };
}());
