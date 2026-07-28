'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const cache = new Map();
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
  const row3 = Array(24).fill(''); row3[20] = 'Product A'; row3[21] = 'Product B';
  const header = ['ID','RSM','TSO','SR','Designation','Dealer SL','AREA/ Point','DL_CD','1','2','3','Sales of July\'26','No. of Order','Current WD','July\'26 Monthly Tgt. Product Wise Value','SR Avg. Working Hour','Average Daily Outlet','','','','500ml','1L'];
  const data = ['3018','RSM One','TSO One','SR One','SR','137','M/S. Rupali Traders (137)','',100,200,0,300,4,3,1000,'5 Hr 30 Min','','','','',2,3];
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

process.on('exit', () => {
  if (!process.exitCode) console.log(`\n${passed} tests passed.`);
});
