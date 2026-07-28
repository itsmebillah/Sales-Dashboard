/** Non-mutating KPI engine runtime self-test with a synthetic Master Dataset. */
function runKpiEngineSelfTest(){
  var records=[],base={batchId:'SELF',sourceSystem:'SELF_TEST',sourceDataset:'SELF_TEST',contractId:'SELF',moduleId:'SALES',recordType:'OBSERVATION',ingestedAt:'2026-07-28T00:00:00Z',rsmId:'R1',tsoId:'T1',srId:'S1',employeeId:'S1',dealerId:'D1',qualityStatus:'VALID'};
  function add(metric,value,date,extra){var x=Object.assign({},base,extra||{}, {recordId:SIP.Utils.uniqueId('SELF',[metric,date,value,records.length]),sourceRecordId:String(records.length+1),metricId:metric,eventDate:date||'',numericValue:value});records.push(SIP.Normalizer.masterRecord(x));}
  add('SALES_AMOUNT',100,'2026-07-01');add('SALES_AMOUNT',200,'2026-07-02');add('TARGET_AMOUNT',600,'',{recordType:'PLAN'});
  add('WORKING_DAYS_ELAPSED',2);add('DUE_WORKING_DAYS',2);add('TOTAL_WORKING_DAYS',4);
  add('COLLECTION_AMOUNT',150,'2026-07-02',{moduleId:'COLLECTION_PROJECTION',recordType:'EVENT'});
  add('LIFTING_AMOUNT',250,'2026-07-02',{moduleId:'LIFTING'});add('STOCK_AMOUNT',50,'',{moduleId:'LIFTING',recordType:'SNAPSHOT',asOfAt:'2026-07-02'});
  add('PRODUCT_QUANTITY',10,'',{productId:'P1',quantity:10,numericValue:10,amount:null});
  add('HISTORICAL_SALES_AMOUNT',250,'2026-06-30',{periodStart:'2026-06-01',periodEnd:'2026-06-30'});
  var snapshot=SIP.KpiEngine.calculate({schemaVersion:'1.0.0',batchId:'SELF',records:records,qualityFlags:[]});
  var e=snapshot.executive,checks=[
    ['total sales',e.sales===300],['target',e.target===600],['achievement',e.achievementPct===0.5],['gap',e.gap===300],
    ['average daily sales',e.averageDailySales===150],['forecast',e.forecast===600],['collection',e.collection===150],
    ['lifting',e.lifting===250],['stock',e.stock===50],['growth guarded until comparable',e.growthPct===null&&e.growthComparable===false],
    ['hierarchy contract',snapshot.hierarchy.RSM.length===1&&snapshot.hierarchy.TSO.length===1&&snapshot.hierarchy.SR.length===1],
    ['dealer total',snapshot.dealers.entities[0].sales===300],['product total',snapshot.products.entities[0].productVolume===10],
    ['risk objects',snapshot.risks.length>0],['insight objects',snapshot.insights.length===snapshot.risks.length]
  ];
  checks.forEach(function(c){if(!c[1])throw new Error('KPI self-test failed: '+c[0]);});
  return{passed:true,checks:checks.length,kpiVersion:snapshot.kpiVersion,performance:snapshot.performance};
}
