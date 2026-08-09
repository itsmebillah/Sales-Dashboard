'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const cache = new Map();
const properties = new Map();
const durableRows = [];
const durableSheet = {
  getLastRow: () => durableRows.length,
  hideSheet: () => {},
  clearContents: () => { durableRows.length=0; },
  getRange: (row,column,rowCount=1,columnCount=1) => ({
    setValues: values => values.forEach((cells,rowIndex)=>cells.forEach((value,columnIndex)=>{durableRows[row-1+rowIndex]=durableRows[row-1+rowIndex]||[];durableRows[row-1+rowIndex][column-1+columnIndex]=value;})),
    getValue: () => (durableRows[row-1]||[])[column-1] || '',
    getValues: () => Array.from({length:rowCount},(_,rowIndex)=>Array.from({length:columnCount},(_,columnIndex)=>(durableRows[row-1+rowIndex]||[])[column-1+columnIndex] || ''))
  })
};
const sandbox = {
  console,
  Date,
  JSON,
  Math,
  Object,
  Array,
  String,
  Number,
  RegExp,
  Error,
  isFinite,
  Utilities: {
    DigestAlgorithm: { SHA_256: 'sha256' },
    computeDigest: (_alg, input) => [...crypto.createHash('sha256').update(String(input)).digest()].map(x => x > 127 ? x - 256 : x),
    formatDate: (date) => new Date(date).toISOString().slice(0, 10)
  },
  CacheService: {
    getScriptCache: () => ({
      put: (k, v) => cache.set(k, v),
      get: k => cache.get(k) || null,
      putAll: entries => Object.entries(entries).forEach(([k, v]) => cache.set(k, v)),
      getAll: keys => Object.fromEntries(keys.filter(k => cache.has(k)).map(k => [k, cache.get(k)])),
      remove: k => cache.delete(k),
      removeAll: keys => keys.forEach(k => cache.delete(k))
    })
  },
  SpreadsheetApp: {
    openById: () => ({getSheetByName: () => durableRows.length ? durableSheet : null,insertSheet: () => durableSheet}),
    flush: () => {}
  },
  PropertiesService: {
    getScriptProperties: () => ({
      setProperty: (key,value) => properties.set(key,String(value)),
      getProperty: key => properties.has(key) ? properties.get(key) : null,
      setProperties: entries => Object.entries(entries).forEach(([key,value])=>properties.set(key,String(value))),
      getProperties: () => Object.fromEntries(properties),
      deleteProperty: key => properties.delete(key)
    })
  },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) }
};
vm.createContext(sandbox);
fs.readdirSync(path.join(root, 'src')).filter(f => f.endsWith('.gs')).sort().forEach(file => {
  vm.runInContext(fs.readFileSync(path.join(root, 'src', file), 'utf8'), sandbox, { filename: file });
});

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}\n${error.stack}`); process.exitCode = 1; }
}
function equal(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message || 'not equal'}: expected ${expected}, got ${actual}`);
}
function ok(value, message) { if (!value) throw new Error(message || 'expected truthy value'); }

const SIP = sandbox.SIP;

test('normalizes text, names, IDs, numbers, dates and working hours', () => {
  equal(SIP.Utils.headerKey('Territory / Area'), 'TERRITORY_AREA');
  equal(SIP.Utils.normalizeName('M/S.  Rupali Traders (137)'), 'rupali traders 137');
  equal(SIP.Utils.normalizeId('3,018'), '3018');
  equal(SIP.Utils.number('(1,250.50)', []), -1250.5);
  equal(SIP.Utils.isoDate(46207), '2026-07-04');
  equal(SIP.Normalizer.workingHours('5 Hr 41 Min'), 341);
});

test('detects dynamic headers and duplicate non-day headers', () => {
  const d = new SIP.Diagnostics();
  const rows = [['title'], ['ID', 'RSM', 'TSO', 'SR', 'Designation', 'RSM']];
  const h = SIP.HeaderDetector.detect(rows, { maxRows: 4, minimumScore: 4, requiredGroups: [['ID'],['RSM'],['TSO'],['DESIGNATION']] }, d, 'X');
  equal(h.rowIndex, 1);
  ok(d.issues.some(x => x.code === 'DUPLICATE_HEADER'));
});

function salesFixture() {
  const row1 = ['July\'26'];
  const row2 = [];
  const row3 = Array(23).fill(''); row3[21] = 'Product A'; row3[22] = 'Product B';
  const header = ['ID','RSM','TSO','SR','Designation','Dealer SL','AREA/ Point','DL_CD','1','2','3','Sales of July\'26','No. of Order','Current WD','July\'26 Monthly Tgt. Product Wise Value','SR Avg. Working Hour','Sales >June,26','Average Daily Outlet','','','','500ml','1L'];
  const data = ['3018','RSM One','TSO One','SR One','SR','137','M/S. Rupali Traders (137)','',100,200,0,300,4,3,1000,'5 Hr 30 Min',250,'','','','',2,3];
  return [row1,row2,row3,header,data];
}
function liftingFixture() {
  return [
    ['Depo-Dealer Wise Lifting - Jul\'26'],[],[],[],
    ['S.L NO','NSM/ASM','RSM/ASE','TSO','Territory / Area','Dealer','DEPO','Lifting Number Of','Lifting','STOCK','Secondary','SR','Day Remain','1','2','Total lifting'],
    ['137','ASM One','RSM One','TSO One','Area One','M/S. Rupali Traders (137)','Depot One',2,300,500,250,1,3,100,200,300],
    ['','ASM One','RSM One','TSO One','','','','',300,500,250]
  ];
}
function transactionFixture() {
  return [
    ['TransactionID','Date','Type','TSM_ID','RSM_ID','ASM_ID','Dealer_Name','Amount','Timestamp','Bank','Status','Submitted_By','Submitted_At'],
    ['COL_1','2026-07-04','Collection','3680','3568','2380','M/S. Rupali Traders, (137), Narail',100000,'2026-07-04','Cash','Submitted','3680','2026-07-04'],
    ['PRJ_1','2026-07-05','Projection','3680','3568','2380','M/S. Rupali Traders, (137), Narail',30000,'2026-07-04','','Submitted','3680','2026-07-04']
  ];
}
function mockSpreadsheet(fixtures) {
  return {
    getSheetByName: name => fixtures[name] ? { getDataRange: () => ({ getValues: () => fixtures[name] }) } : null
  };
}

test('parses all sources once, ignores subtotals and emits canonical long records', () => {
  const config = SIP.Config.get();
  const diagnostics = new SIP.Diagnostics();
  const spreadsheet = mockSpreadsheet({
    [config.sheets.sales]: salesFixture(),
    [config.sheets.lifting]: liftingFixture(),
    [config.sheets.transactions]: transactionFixture()
  });
  const context = { config, diagnostics, batchId:'B1', ingestedAt:'2026-07-28T00:00:00Z' };
  const sources = SIP.SourceReader.readAll(spreadsheet, config, diagnostics);
  const parsed = SIP.ParserEngine.parseAll(sources, context);
  equal(parsed.length, 3);
  equal(parsed[0].records.filter(x => x.metric_id === 'SALES_AMOUNT').length, 3);
  equal(parsed[0].records.filter(x => x.metric_id === 'HISTORICAL_SALES_AMOUNT').length, 1);
  equal(parsed[1].records.filter(x => x.metric_id === 'LIFTING_AMOUNT').length, 2);
  equal(diagnostics.source('SRC_DEALER_LIFTING').rowsIgnored, 1);
  equal(parsed[2].records.length, 2);
  ok(parsed[2].records.every(x => x.dealer_id === 'DEALER:137'));
});

test('builds a unified logical model and relationship graph', () => {
  const config = SIP.Config.get();
  const diagnostics = new SIP.Diagnostics();
  const context = { config, diagnostics, batchId:'B2', ingestedAt:'2026-07-28T00:00:00Z' };
  const sources = SIP.SourceReader.readAll(mockSpreadsheet({
    [config.sheets.sales]: salesFixture(), [config.sheets.lifting]: liftingFixture(), [config.sheets.transactions]: transactionFixture()
  }), config, diagnostics);
  const parsed = SIP.ParserEngine.parseAll(sources, context);
  const validation = SIP.ValidationEngine.validate(parsed, context);
  const rel = SIP.RelationshipEngine.build(parsed, diagnostics);
  const master = SIP.MasterDatasetBuilder.build(validation, rel, parsed, context);
  ok(master.records.length >= 10);
  equal(master.schemaVersion, '1.0.0');
  equal(master.attendance.status, 'NOT_IMPLEMENTED');
  ok(master.relationships.some(x => x.type === 'EMPLOYEE_SERVES_DEALER'));
  ok(master.indexes.byMetric.SALES_AMOUNT.length === 3);
});

test('quarantines invalid negative business values and duplicate canonical records', () => {
  const context = { diagnostics: new SIP.Diagnostics() };
  const record = SIP.Normalizer.masterRecord({ recordId:'R1', sourceDataset:'S', sourceRecordId:'1', contractId:'C', moduleId:'SALES', metricId:'SALES_AMOUNT', eventDate:'2026-07-01', numericValue:-1 });
  const result = SIP.ValidationEngine.validate([{ sourceId:'S', records:[record, Object.assign({}, record)], dimensions:{} }], context);
  ok(result.records.every(x => x.quality_status === 'QUARANTINED'));
  ok(context.diagnostics.issues.some(x => x.code === 'DUPLICATE_MASTER_RECORD'));
});

test('writes and reads chunked cache with checksum validation', () => {
  cache.clear();
  const config = SIP.Config.get({ cache:{ chunkChars:20, maxChunks:100, ttlSeconds:60 } });
  const diagnostics = new SIP.Diagnostics();
  const master = { batchId:'B', generatedAt:'2026-07-28', records:Array.from({length:20},(_,i)=>({id:i,value:'abc'})) };
  const write = SIP.CacheEngine.put(master, config, diagnostics);
  ok(write.cached); ok(write.chunks > 1);
  const read = SIP.CacheEngine.get(config, diagnostics);
  equal(read.records.length, 20);
});

test('runtime self-test passes including Attendance compatibility', () => {
  const result = sandbox.runDataEngineSelfTest();
  ok(result.passed); equal(result.assertions.length, 5);
});

test('calculates executive totals, forecast inputs, hierarchy, dealer and product KPIs', () => {
  const result = sandbox.runKpiEngineSelfTest();
  ok(result.passed); equal(result.checks, 15);
});

test('exposes an identical KPI contract at every hierarchy level', () => {
  const records=[];
  function rec(id,metric,value,extra={}) { records.push(SIP.Normalizer.masterRecord(Object.assign({
    recordId:id,sourceDataset:'T',sourceRecordId:id,contractId:'T',moduleId:'SALES',recordType:'OBSERVATION',metricId:metric,
    eventDate:'2026-07-01',numericValue:value,qualityStatus:'VALID',rsmId:'R',tsoId:'T',srId:'S',employeeId:'S',dealerId:'D'
  },extra))); }
  rec('1','SALES_AMOUNT',100); rec('2','TARGET_AMOUNT',200,{recordType:'PLAN'}); rec('3','PRODUCT_QUANTITY',5,{productId:'P',quantity:5});
  const snapshot=SIP.KpiEngine.calculate({schemaVersion:'1.0.0',batchId:'B',records,qualityFlags:[]});
  const entities=['COMPANY','RSM','TSO','SR','DEALER','PRODUCT'].map(t=>snapshot.hierarchy[t][0]);
  const keys=Object.keys(entities[0]).sort().join('|');
  entities.forEach(x=>equal(Object.keys(x).sort().join('|'),keys,`contract mismatch for ${x.entityType}`));
});

test('calculates deterministic risk thresholds and machine insight objects', () => {
  const k={ 'DEALER|D':{entityType:'DEALER',entityId:'D',sales:100,stock:0,achievementPct:0.5,forecastAchievementPct:0.6,momentumPct:-0.3,growthPct:-0.25,collectionFlowRatioPct:0.2,forecastBase:{certification:'BASELINE',confidenceInputs:{confidenceScore:0.2}}} };
  const risks=SIP.RiskEngine.evaluate(k,{});
  ok(risks.some(x=>x.type==='StockRisk'&&x.severity==='HIGH'));
  ok(risks.some(x=>x.type==='TargetRisk'&&x.value===0.5));
  ok(risks.every(x=>x.machineReadable===true));
});

test('aggregates 100,000 canonical observations within the local performance budget', () => {
  const records=Array.from({length:100000},(_,i)=>({
    record_id:`R${i}`,source_dataset:'T',source_record_id:String(i),contract_id:'T',module_id:'SALES',record_type:'OBSERVATION',
    metric_id:'SALES_AMOUNT',event_date:`2026-07-${String((i%28)+1).padStart(2,'0')}`,numeric_value:1,amount:1,quality_status:'VALID',
    company_id:'COMPANY:DEFAULT',rsm_id:`R${i%10}`,tso_id:`T${i%50}`,sr_id:`S${i%500}`,employee_id:`S${i%500}`,dealer_id:`D${i%1000}`
  }));
  const start=Date.now();
  const snapshot=SIP.KpiEngine.calculate({schemaVersion:'1.0.0',batchId:'PERF',records,qualityFlags:[]});
  const elapsed=Date.now()-start;
  equal(snapshot.executive.sales,100000);
  equal(snapshot.hierarchy.DEALER.length,1000);
  ok(elapsed<5000,`100k aggregation took ${elapsed}ms`);
  console.log(`INFO 100k KPI benchmark: ${elapsed}ms`);
});

test('rejects a KPI cache generation from an older Master Dataset batch', () => {
  cache.clear();
  const kpiConfig=SIP.Config.get({cache:{namespace:'SIP_KPI_V1',chunkChars:1000,maxChunks:20,ttlSeconds:60}});
  SIP.CacheEngine.put({batchId:'OLD',generatedAt:'2026-07-27',records:[],risks:[]},kpiConfig,new SIP.Diagnostics());
  const original=SIP.DataEngine.get;
  SIP.DataEngine.get=()=>({master:{schemaVersion:'1.0.0',batchId:'NEW',records:[],qualityFlags:[]},cache:{hit:true}});
  try {
    const result=SIP.KpiService.get({config:{cache:{chunkChars:1000,maxChunks:20,ttlSeconds:60}},writeDiagnostics:false});
    equal(result.snapshot.batchId,'NEW');
    ok(result.diagnostics.issues.some(x=>x.code==='KPI_CACHE_STALE'));
  } finally { SIP.DataEngine.get=original; }
});

test('reads the certified dashboard cache without invoking the Data Engine', () => {
  cache.clear();
  const config=SIP.Config.get({cache:{namespace:'SIP_KPI_V1',chunkChars:1000,maxChunks:20,ttlSeconds:60}});
  SIP.CacheEngine.put({batchId:'CACHE_ONLY',generatedAt:'2026-07-29',executive:{sales:42},dealers:{top:[],bottom:[]},products:{topProducts:[],bottomProducts:[]}},config,new SIP.Diagnostics());
  const original=SIP.DataEngine.get;
  SIP.DataEngine.get=()=>{throw new Error('Data Engine must not run during dashboard load');};
  try {
    const result=SIP.KpiService.getCached({config:{cache:{chunkChars:1000,maxChunks:20,ttlSeconds:60}}});
    equal(result.snapshot.batchId,'CACHE_ONLY');
    equal(result.snapshot.executive.sales,42);
  } finally { SIP.DataEngine.get=original; cache.clear(); }
});

test('refreshes KPIs from the supplied certified Master Dataset without reparsing', () => {
  cache.clear();
  const original=SIP.DataEngine.get;
  SIP.DataEngine.get=()=>{throw new Error('Data Engine must not be called twice');};
  try {
    const result=SIP.KpiService.refreshFromMaster({schemaVersion:'1.0.0',batchId:'ONE_PARSE',records:[],qualityFlags:[],certification:{certified:true,status:'CERTIFIED'}},{config:{cache:{chunkChars:1000,maxChunks:100,ttlSeconds:60}}});
    equal(result.snapshot.batchId,'ONE_PARSE');
    equal(result.master.batchId,'ONE_PARSE');
  } finally { SIP.DataEngine.get=original; cache.clear(); }
});

test('publishes cache chunks in bounded transport batches', () => {
  const source=fs.readFileSync(path.join(root,'src','15_CacheEngine.gs'),'utf8');
  ok(source.includes('batchChars + chunk.length > 90000'));
  ok(source.includes("reason: 'PUBLICATION_INCOMPLETE'"));
  ok(source.indexOf('cache.getAll(keys)')<source.indexOf('cache.put(metaKey(config)'),'metadata must publish only after chunk verification');
});

test('publishes a compact certified dashboard cache for fresh-page hydration', () => {
  cache.clear();properties.clear();
  const snapshot=SIP.KpiEngine.calculate({schemaVersion:'1.0.0',batchId:'DASHBOARD_CACHE',records:[],qualityFlags:[],dimensions:{},certification:{certified:true,status:'CERTIFIED'}});
  const published=sandbox.publishDashboardApi(snapshot);
  ok(published.cache.durable.cached);
  const loaded=sandbox.getDashboardApi('dashboard');
  ok(loaded.ok);
  equal(loaded.data.batchId,'DASHBOARD_CACHE');
  cache.clear();properties.clear();
});

test('bounds dashboard intelligence payload while preserving total counts', () => {
  const risks=Array.from({length:75},(_,index)=>({riskId:'R'+index})),insights=Array.from({length:75},(_,index)=>({riskId:'I'+index}));
  const payload=sandbox.dashboardPayload({schemaVersion:'1.0.0',kpiVersion:'1.0.0',masterSchemaVersion:'1.0.0',batchId:'BOUNDED',generatedAt:'2026-07-29',executive:{},labels:{},hierarchy:{},dealers:{top:[]},products:{topProducts:[],unitPolicy:'SOURCE_UNIT_ONLY'},collection:{},projection:{},lifting:{},risks,insights,quality:{},performance:{}}).data;
  equal(payload.risks.length,30);equal(payload.insights.length,30);equal(payload.riskTotal,75);equal(payload.insightTotal,75);
});

test('uses the approved spreadsheet for the durable certified cache', () => {
  const source=fs.readFileSync(path.join(root,'src','15a_DurableCache.gs'),'utf8');
  ok(source.includes("SHEET='Dashboard Cache'"));
  ok(source.includes('SpreadsheetApp.openById(SIP.Config.get().spreadsheetId)'));
  ok(source.includes('SpreadsheetApp.flush()'));
});

test('preserves previous-month daily facts without duplicating current Sales', () => {
  const rows=salesFixture().map(row=>row.slice());
  rows[0][0]="June'26";
  rows[3][16]='Sales >May,26';
  const diagnostics=new SIP.Diagnostics(),config=SIP.Config.get();
  const context={config,diagnostics,batchId:'HISTORY',ingestedAt:'2026-07-29T00:00:00Z'};
  const parsed=SIP.HistoricalSalesParser.parse({definition:{id:'SRC_SALES_PREVIOUS',name:'Previous Month Sales'},values:rows},context);
  ok(parsed.records.length>0);
  ok(parsed.records.some(record=>record.metric_id==='HISTORICAL_DAILY_SALES_AMOUNT'&&record.period_start==='2026-06-01'));
  ok(parsed.records.some(record=>record.metric_id==='HISTORICAL_SALES_AMOUNT'&&record.period_start==='2026-05-01'));
  ok(parsed.records.every(record=>record.metric_id!=='SALES_AMOUNT'));
});

test('scopes executive headcounts to current Sales facts',()=>{
  const records=[
    SIP.Normalizer.masterRecord({recordId:'S',moduleId:'SALES',metricId:'SALES_AMOUNT',numericValue:10,srId:'SR1',tsoId:'T1',rsmId:'R1',qualityStatus:'VALID'}),
    SIP.Normalizer.masterRecord({recordId:'C',moduleId:'COLLECTION_PROJECTION',metricId:'COLLECTION_AMOUNT',numericValue:5,srId:'SR2',tsoId:'T2',rsmId:'R2',qualityStatus:'VALID'})
  ];
  const snapshot=SIP.KpiEngine.calculate({schemaVersion:'1.0.0',batchId:'COUNTS',records,qualityFlags:[]});
  equal(snapshot.executive.srCount,1);equal(snapshot.executive.tsoCount,1);equal(snapshot.executive.rsmCount,1);
});

test('classifies Holiday as governed metadata in lifecycle inventory',()=>{
  const source=fs.readFileSync(path.join(root,'src','29_MaintenanceEngine.gs'),'utf8');
  ok(source.includes("'Holiday':'Metadata'"));
});

test('emits only statuses accepted by the Import Batches sheet contract', () => {
  const successful = new SIP.Diagnostics().finish();
  equal(successful.status, 'COMPLETED');
  const warning = new SIP.Diagnostics();
  warning.issue('WARN', 'TEST_WARNING', 'warning');
  equal(warning.finish().status, 'COMPLETED_WITH_WARNINGS');
  const failed = new SIP.Diagnostics();
  failed.issue('ERROR', 'TEST_ERROR', 'error');
  equal(failed.finish().status, 'FAILED');
  ok(['QUEUED', 'RUNNING', 'COMPLETED', 'COMPLETED_WITH_WARNINGS', 'FAILED', 'REJECTED'].includes(failed.finish().status));
});

test('publishes certified business display names without exposing raw entity IDs', () => {
  const master={schemaVersion:'1.0.0',batchId:'LABELS',records:[],qualityFlags:[],dimensions:{
    employees:{'EMPLOYEE:1':{id:'EMPLOYEE:1',name:'Ayesha Rahman',role:'RSM'},'EMPLOYEE:2':{id:'EMPLOYEE:2',name:'Tanvir Ahmed',role:'TSO'}},
    dealers:{'DEALER:137':{id:'DEALER:137',name:'City Enterprise'}},
    products:{'PRODUCT:HASH':{id:'PRODUCT:HASH',name:'Premium Cement',pack:'50 KG',group:'Cement'}}
  }};
  const snapshot=SIP.KpiEngine.calculate(master);
  equal(snapshot.labels.RSM['EMPLOYEE:1'],'Ayesha Rahman');
  equal(snapshot.labels.TSO['EMPLOYEE:2'],'Tanvir Ahmed');
  equal(snapshot.labels.DEALER['DEALER:137'],'City Enterprise');
  equal(snapshot.labels.PRODUCT['PRODUCT:HASH'],'Premium Cement · 50 KG · Cement');
});

test('compiles every modular HTML Service browser script', () => {
  const htmlDir=path.join(root,'src','html');
  const scripts=fs.readdirSync(htmlDir).filter(file=>file.endsWith('.html')).map(file=>({file,source:fs.readFileSync(path.join(htmlDir,file),'utf8')}));
  scripts.forEach(({file,source})=>{
    const blocks=[...source.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    blocks.forEach((block,index)=>new vm.Script(block[1],{filename:`${file}:${index+1}`}));
  });
  ok(scripts.some(x=>x.file==='Charts.html'));
  ok(scripts.some(x=>x.file==='Tables.html'));
  ok(scripts.some(x=>x.file==='Filters.html'));
});

test('enforces exact-number dashboard formatting and cache-only hydration', () => {
  const htmlDir=path.join(root,'src','html');
  const source=fs.readdirSync(htmlDir).filter(file=>file.endsWith('.html')).map(file=>fs.readFileSync(path.join(htmlDir,file),'utf8')).join('\n');
  ok(!/notation\s*:\s*['"]compact['"]/.test(source),'compact number notation is prohibited');
  ok(source.includes("useGrouping:true"),'exact grouped-number formatter is required');
  ok(source.includes('.getCachedDashboardApi()'),'initial hydration must use certified KPI cache');
  ok(!/BI\.boot[\s\S]{0,500}runDataEngine/.test(source),'dashboard boot must never start the Data Engine');
  ok(source.includes('id="mobileReport"'),'responsive report-card container is required');
  ok(source.includes('renderMobile(rows)'),'mobile report rows must render from live KPI data');
  ok(source.includes("saved==='dark'?'dark':'light'"),'light mode must be the default application theme');
});

test('uses CLOSED_DAY_ONLY with the approved three-day posting maturity lag', () => {
  const context={config:SIP.Config.get(),diagnostics:new SIP.Diagnostics(),ingestedAt:'2026-07-29T16:00:00Z'};
  const parsed=[{sourceId:'SRC_SALES_MONTHLY',records:[],metadata:{period:{periodStart:'2026-07-01',periodEnd:'2026-07-31'},monthlyWorkingDays:26}}];
  const calendar=SIP.BusinessCalendar.build(parsed,context);
  equal(calendar.policy,'CLOSED_DAY_ONLY');
  equal(calendar.current.monthLength,31);
  equal(calendar.current.total,26);
  equal(calendar.current.dataCutoffDate,'2026-07-26');
  equal(calendar.current.closeDate,'2026-08-04');
  equal(calendar.current.elapsed,22);
  equal(calendar.current.remaining,4);
  ok(calendar.current.elapsed+calendar.current.remaining===calendar.current.total);
});

test('uses the Bangladesh business date across the UTC midnight boundary', () => {
  const originalFormatDate=sandbox.Utilities.formatDate;
  sandbox.Utilities.formatDate=(date,timeZone) => {
    const offsetHours=timeZone==='Asia/Dhaka'?6:0;
    return new Date(new Date(date).getTime()+offsetHours*60*60*1000).toISOString().slice(0,10);
  };
  try {
    const context={config:SIP.Config.get(),diagnostics:new SIP.Diagnostics(),ingestedAt:'2026-07-29T23:30:00.000Z'};
    const parsed=[{sourceId:'SRC_SALES_MONTHLY',records:[],metadata:{period:{periodStart:'2026-07-01',periodEnd:'2026-07-31'},monthlyWorkingDays:26}}];
    const calendar=SIP.BusinessCalendar.build(parsed,context);
    equal(calendar.asOfDate,'2026-07-30');
    equal(calendar.dataCutoffDate,'2026-07-27');
  } finally {
    sandbox.Utilities.formatDate=originalFormatDate;
  }
});

test('generates the governed 2025-2032 calendar with Friday-only closure and fiscal periods', () => {
  const config=SIP.Config.get(),context={config,diagnostics:new SIP.Diagnostics(),ingestedAt:'2026-07-29T16:00:00Z'};
  const parsed=[{sourceId:'SRC_SALES_MONTHLY',records:[],metadata:{period:{periodStart:'2026-07-01',periodEnd:'2026-07-31'}}}];
  const calendar=SIP.BusinessCalendar.build(parsed,context,config.calendar);
  equal(calendar.rows.length,2922);
  ok(calendar.rows.filter(x=>x.dayName==='Friday').every(x=>!x.isWorkingDay));
  ok(calendar.rows.filter(x=>x.dayName==='Saturday').every(x=>x.isWorkingDay));
  ok(calendar.rows.some(x=>x.date==='2028-02-29'));
  equal(calendar.rows.find(x=>x.date==='2026-06-30').fiscalYear,'FY2026');
  equal(calendar.rows.find(x=>x.date==='2026-07-01').fiscalYear,'FY2027');
  equal(calendar.rows.find(x=>x.date==='2026-07-04').sellingDayIndex,3);
});

test('uses only approved Holiday rows in the official business calendar', () => {
  const config=SIP.Config.get(),context={config,diagnostics:new SIP.Diagnostics(),ingestedAt:'2026-07-29T16:00:00Z'};
  const values=[['holiday_date','holiday_name','approval_status'],['2026-07-04','Approved Closure','APPROVED'],['2026-07-05','Draft Closure','DRAFT']];
  const spreadsheet={getSheetByName:name=>name==='Holiday'?{getDataRange:()=>({getValues:()=>values})}:null};
  const settings=SIP.BusinessCalendar.loadSettings(spreadsheet,config);
  const parsed=[{sourceId:'SRC_SALES_MONTHLY',records:[],metadata:{period:{periodStart:'2026-07-01',periodEnd:'2026-07-31'}}}];
  const calendar=SIP.BusinessCalendar.build(parsed,context,settings);
  equal(calendar.rows.find(x=>x.date==='2026-07-04').status,'GOVERNMENT_HOLIDAY');
  equal(calendar.rows.find(x=>x.date==='2026-07-05').status,'WORKING_DAY');
});

test('derives Sales Activity Attendance only for elapsed working days and remains HR-replaceable', () => {
  const config=SIP.Config.get(),context={config,diagnostics:new SIP.Diagnostics(),batchId:'ATT',ingestedAt:'2026-07-06T00:00:00Z'};
  const parsed=[{sourceId:'SRC_SALES_MONTHLY',records:[],metadata:{period:{periodStart:'2026-07-01',periodEnd:'2026-07-31'}}}];
  const settings=Object.assign({},config.calendar,{startYear:2026,endYear:2026,holidays:{}}),calendar=SIP.BusinessCalendar.build(parsed,context,settings);
  const records=[
    SIP.Normalizer.masterRecord({recordId:'A',moduleId:'SALES',metricId:'SALES_AMOUNT',eventDate:'2026-07-01',srId:'SR:1',numericValue:10,qualityStatus:'VALID'}),
    SIP.Normalizer.masterRecord({recordId:'B',moduleId:'SALES',metricId:'SALES_AMOUNT',eventDate:'2026-07-01',srId:'SR:2',numericValue:0,qualityStatus:'VALID'})
  ];
  const result=SIP.SalesActivityAttendance.resolve({records},[],calendar,context);
  equal(result.providerContract,'ATTENDANCE_PROVIDER_V1');
  equal(result.attendanceType,'SALES_ACTIVITY_NOT_HR');
  equal(result.hrAttendance,false);
  equal(result.employeeCount,2);
  equal(result.workingDays,2);
  equal(result.present,1);
  equal(result.absent,3);
  ok(result.records.every(x=>x.metric_id==='SALES_ACTIVITY_ATTENDANCE_STATUS'));
  ok(result.records.every(x=>x.event_date!=='2026-07-03'));
});

test('documents the production sales control variance and keeps atomic daily facts authoritative', () => {
  const diagnostics=new SIP.Diagnostics(),config=SIP.Config.get();
  const records=[
    {metric_id:'SALES_AMOUNT',numeric_value:51631145},
    {metric_id:'SALES_MTD_AMOUNT',numeric_value:51631084}
  ];
  const result=SIP.ReconciliationEngine.calculate([{sourceId:'SRC_SALES_MONTHLY',records,metadata:{salesControlTotal:51631055}}],config,diagnostics);
  equal(result.sales.variance,90);
  equal(result.sales.status,'DOCUMENTED_VARIANCE');
  ok(result.sales.accepted);
  ok(diagnostics.issues.some(x=>x.code==='SALES_CONTROL_VARIANCE'&&x.severity==='WARN'));
});

test('blocks certification and cache publication for failed batches', () => {
  const diagnostics=new SIP.Diagnostics();diagnostics.issue('ERROR','P0_TEST','failed batch');
  const master={batchId:'FAILED',calendar:{verified:true},reconciliation:{sales:{accepted:true}}};
  const gate=SIP.CertificationEngine.assess(master,diagnostics,{verified:true});
  equal(gate.status,'NOT_CERTIFIED');
  let blocked=false;try{sandbox.publishDashboardApi({quality:{certification:'NOT_CERTIFIED'}});}catch(_){blocked=true;}
  ok(blocked,'uncertified dashboard publication must be blocked');
});

test('records bounded refresh stages for production timeout diagnosis',()=>{
  properties.clear();SIP.RefreshTrace.begin('TRACE_BATCH');SIP.RefreshTrace.mark('ATTENDANCE_BUILT',{observations:3});const trace=SIP.RefreshTrace.get();
  equal(trace.batchId,'TRACE_BATCH');equal(trace.stage,'ATTENDANCE_BUILT');equal(trace.detail.observations,3);equal(trace.complete,false);
});

test('parses dynamic monthly targets without a hardcoded month name',()=>{
  const rows=salesFixture().map(row=>row.slice());rows[0][0]="August'26";rows[3][11]="Sales of August'26";rows[3][14]="August'26 Monthly Tgt. Product Wise Value";
  const config=SIP.Config.get(),diagnostics=new SIP.Diagnostics(),context={config,diagnostics,batchId:'TARGET',ingestedAt:'2026-08-09T00:00:00Z'};
  const parsed=SIP.SalesParser.parse({definition:{id:'SRC_SALES_MONTHLY',name:config.sheets.sales},values:rows},context);
  const target=parsed.records.find(x=>x.metric_id==='TARGET_AMOUNT');
  ok(target);equal(target.numeric_value,1000);equal(target.period_start,'2026-08-01');
});

test('uses Hierarchy tab as the stable current-period hierarchy provider and ignores Growth Rate',()=>{
  const hierarchyRows=[
    ['ASM_ID','ASM Name','RSM ID','RSM Name','RSM Phone','TSO ID','TSO Name','TSO Phone','SR ID','SR Name','SR Phone','Dealer ID','Dealer Name','Dealer Phone','Growth Rate'],
    ['2380','ASM One','3568','RSM One','','3680','TSO One','','3018','SR One','','137','M/S. Rupali Traders (137)','','999999%']
  ];
  const config=SIP.Config.get(),diagnostics=new SIP.Diagnostics(),context={config,diagnostics,batchId:'HIER',ingestedAt:'2026-07-09T00:00:00Z',selectedSalesPeriod:{periodStart:'2026-07-01',periodEnd:'2026-07-31'}};
  const hierarchy=SIP.HierarchyParser.parse({definition:{id:'SRC_HIERARCHY',name:config.sheets.hierarchySource},values:hierarchyRows},context);
  const sales=SIP.SalesParser.parse({definition:{id:'SRC_SALES_MONTHLY',name:config.sheets.sales},values:salesFixture()},context),parsed=[sales,hierarchy];
  const provider=SIP.HierarchyProvider.apply(parsed,diagnostics,context),record=sales.records.find(x=>x.metric_id==='SALES_AMOUNT');
  equal(provider.provider,'Hierarchy tab');equal(provider.growthRateUsed,false);equal(hierarchy.metadata.growthRateIgnored,true);
  equal(record.asm_id,'EMPLOYEE:2380');equal(record.rsm_id,'EMPLOYEE:3568');equal(record.tso_id,'EMPLOYEE:3680');equal(record.sr_id,'EMPLOYEE:3018');
  const graph=SIP.RelationshipEngine.build(parsed,diagnostics),types=new Set(graph.hierarchy.map(x=>x.type));
  ok(types.has('SR_TO_TSO'));ok(types.has('TSO_TO_RSM'));ok(types.has('RSM_TO_ASM'));
});

test('resolves stale reused-SR hierarchy rows from selected-month Sales evidence',()=>{
  const headers=['ASM_ID','ASM Name','RSM ID','RSM Name','RSM Phone','TSO ID','TSO Name','TSO Phone','SR ID','SR Name','SR Phone','Dealer ID','Dealer Name','Dealer Phone','Growth Rate'];
  const rows=[headers,['2380','A','3568','RSM One','','3680','TSO One','','3018','SR One','','137','Current Dealer','',''],['981','B','1083','RSM Old','','2670','TSO Old','','3018','SR One','','999','Stale Dealer','','']];
  const config=SIP.Config.get(),diagnostics=new SIP.Diagnostics(),context={config,diagnostics,batchId:'STALE',ingestedAt:'2026-07-09T00:00:00Z',selectedSalesPeriod:{periodStart:'2026-07-01',periodEnd:'2026-07-31'}};
  const hierarchy=SIP.HierarchyParser.parse({definition:{id:'SRC_HIERARCHY',name:config.sheets.hierarchySource},values:rows},context),sales=SIP.SalesParser.parse({definition:{id:'SRC_SALES_MONTHLY',name:config.sheets.sales},values:salesFixture()},context);
  const provider=SIP.HierarchyProvider.apply([sales,hierarchy],diagnostics,context);
  equal(provider.staleAssignmentsExcluded,1);equal(provider.conflicts,0);equal(hierarchy.hierarchyAssignments.length,1);equal(hierarchy.hierarchyAssignments[0].tsoId,'EMPLOYEE:3680');
  ok(!diagnostics.issues.some(x=>x.code==='HIERARCHY_SOURCE_CONFLICT'));
});

test('uses a selected-period target fact to resolve a zero-activity SR hierarchy path',()=>{
  const assignment=(tso,dealer)=>({asmId:'EMPLOYEE:1',rsmId:'EMPLOYEE:2',tsoId:'EMPLOYEE:'+tso,srId:'EMPLOYEE:3',dealerId:'DEALER:'+dealer,effectiveFrom:'2026-08-01',effectiveTo:'2026-08-31',sourceRow:Number(dealer)});
  const hierarchy={sourceId:'SRC_HIERARCHY',records:[],dimensions:{employees:{},dealers:{}},hierarchyAssignments:[assignment('4','10'),assignment('5','20')]};
  const target=SIP.Normalizer.masterRecord({recordId:'T',sourceDataset:'Sales Data Base Monthly',sourceRecordId:'T',contractId:'T',moduleId:'SALES',recordType:'PLAN',metricId:'TARGET_AMOUNT',periodStart:'2026-08-01',numericValue:100,srId:'EMPLOYEE:3',dealerId:'DEALER:10'});
  const sales={sourceId:'SRC_SALES_MONTHLY',records:[target],dimensions:{employees:{},dealers:{}}},diagnostics=new SIP.Diagnostics(),context={diagnostics,selectedSalesPeriod:{periodStart:'2026-08-01'}};
  const result=SIP.HierarchyProvider.apply([sales,hierarchy],diagnostics,context);
  equal(result.staleAssignmentsExcluded,1);equal(hierarchy.hierarchyAssignments[0].tsoId,'EMPLOYEE:4');
});

test('joins HR Attendance by stable SR ID and explicit selected-month dates',()=>{
  const weekdays=Array(42).fill('');weekdays[6]='Wed';weekdays[7]='Thu';weekdays[8]='Fri';weekdays[41]='month_start';
  const header=Array(42).fill('');['RSM ID','RSM Name','TSO ID','TSO Name','SR ID','SR Name','1','2','3'].forEach((x,i)=>header[i]=x);header[41]='2026-07-01';
  const attendanceRows=[weekdays,header,['3568','RSM One','3680','TSO One','3018','SR One','P','A','P']];
  const hierarchyRows=[['ASM_ID','ASM Name','RSM ID','RSM Name','RSM Phone','TSO ID','TSO Name','TSO Phone','SR ID','SR Name','SR Phone','Dealer ID','Dealer Name','Dealer Phone','Growth Rate'],['2380','ASM One','3568','RSM One','','3680','TSO One','','3018','SR One','','137','Dealer 137','','-100%']];
  const config=SIP.Config.get(),diagnostics=new SIP.Diagnostics(),context={config,diagnostics,batchId:'ATT_HR',ingestedAt:'2026-07-09T00:00:00Z',selectedSalesPeriod:{periodStart:'2026-07-01',periodEnd:'2026-07-31'}};
  const hierarchy=SIP.HierarchyParser.parse({definition:{id:'SRC_HIERARCHY',name:config.sheets.hierarchySource},values:hierarchyRows},context),attendance=SIP.AttendanceParser.parse({definition:{id:'SRC_ATTENDANCE',name:config.sheets.attendance},values:attendanceRows},context);
  const result=SIP.HrAttendance.build([hierarchy,attendance],context);
  equal(result.hrAttendance,true);equal(result.periodStart,'2026-07-01');equal(result.periodEnd,'2026-07-31');equal(result.present,2);equal(result.absent,1);equal(result.entities['SR|EMPLOYEE:3018'].attendancePct,2/3);
  ok(attendance.attendanceObservations.every(x=>x.date.indexOf('2026-07-')===0));
});

test('rejects Attendance when its explicit month differs from selected Sales',()=>{
  const row0=Array(42).fill('');row0[6]='Sat';row0[41]='month_start';const row1=Array(42).fill('');['RSM ID','RSM Name','TSO ID','TSO Name','SR ID','SR Name','1'].forEach((x,i)=>row1[i]=x);row1[41]='2026-08-01';
  const context={config:SIP.Config.get(),diagnostics:new SIP.Diagnostics(),selectedSalesPeriod:{periodStart:'2026-07-01',periodEnd:'2026-07-31'}};
  const result=SIP.AttendanceParser.parse({definition:{id:'SRC_ATTENDANCE',name:'Attendance'},values:[row0,row1,['1','R','2','T','3','S','P']]},context);
  equal(result.attendanceObservations.length,0);ok(context.diagnostics.issues.some(x=>x.code==='ATTENDANCE_PERIOD_MISMATCH'));
});

test('strictly aligns operational KPIs to the selected Sales period',()=>{
  const records=[];const add=(id,metric,value,period,extra={})=>records.push(SIP.Normalizer.masterRecord(Object.assign({recordId:id,sourceDataset:'T',sourceRecordId:id,contractId:'T',moduleId:'SALES',metricId:metric,eventDate:period+'-02',periodStart:period+'-01',numericValue:value,qualityStatus:'VALID',srId:'EMPLOYEE:1'},extra)));
  add('S','SALES_AMOUNT',100,'2026-08');add('T','TARGET_AMOUNT',200,'2026-08',{recordType:'PLAN'});add('L','LIFTING_AMOUNT',70,'2026-08');add('C','COLLECTION_AMOUNT',90,'2026-07');add('P','PROJECTION_AMOUNT',80,'2026-07');
  const attendance={periodStart:'2026-08-01',hrAttendance:true,entities:{'COMPANY|COMPANY:DEFAULT':{present:2,absent:1,attendancePct:2/3},'SR|EMPLOYEE:1':{present:2,absent:1,attendancePct:2/3}}};
  const snapshot=SIP.KpiEngine.calculate({schemaVersion:'1.0.0',batchId:'PERIOD',currentPeriodStart:'2026-08-01',records,qualityFlags:[],attendance});
  equal(snapshot.executive.sales,100);equal(snapshot.executive.target,200);equal(snapshot.executive.lifting,70);equal(snapshot.executive.collection,0);equal(snapshot.executive.projection,0);equal(snapshot.executive.salesPerPresentDay,50);equal(snapshot.quality.periodExcludedRecords,2);
});

test('keeps legacy generated hierarchy and relationship sheets as rollback archives',()=>{
  const source=fs.readFileSync(path.join(root,'src','14b_PersistenceEngine.gs'),'utf8');
  ok(source.includes('legacy generated sheet retained for rollback'));ok(!source.includes("replace(spreadsheet.getSheetByName(config.sheets.hierarchy),hierarchyHeaders"));ok(!source.includes("replace(spreadsheet.getSheetByName(config.sheets.relationships),relationshipHeaders"));
});

process.on('exit', () => {
  if (!process.exitCode) console.log(`\n${passed} tests passed.`);
});
