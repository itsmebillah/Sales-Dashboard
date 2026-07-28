SIP.DiagnosticsWriter = (function () {
  function write(spreadsheet, context, diagnostic, cacheResult) {
    var batchSheet = spreadsheet.getSheetByName(context.config.sheets.importBatches);
    var qualitySheet = spreadsheet.getSheetByName(context.config.sheets.qualityResults);
    if (batchSheet) append(batchSheet, [batchRow(context, diagnostic, cacheResult)]);
    if (qualitySheet && diagnostic.issues.length) append(qualitySheet, diagnostic.issues.slice(0, context.config.quality.issueLimit).map(function (issue, index) {
      return [
        SIP.Utils.uniqueId('QR', [context.batchId, index, issue.code]), context.batchId, issue.code,
        issue.context.sourceId || '', issue.context.moduleId || '', 'ENGINE', issue.context.recordId || issue.context.sourceRecordId || '',
        SIP.Utils.nowIso(), issue.severity === 'ERROR' ? 'FAILED' : 'WARNING', '', '', 1, '', SIP.Utils.safeJson(issue.context),
        'LOGGED', '', '', issue.message
      ];
    }));
  }

  function batchRow(context, d, cacheResult) {
    var sources = Object.keys(d.sources).reduce(function (a, k) { a += d.sources[k].rowsRead || 0; return a; }, 0);
    var accepted = Object.keys(d.sources).reduce(function (a, k) { a += d.sources[k].rowsLoaded || 0; return a; }, 0);
    return [context.batchId, 'ALL_ACTIVE_SOURCES', 'MULTI_CONTRACT', new Date(context.startedAt).toISOString(), SIP.Utils.nowIso(), context.ingestedAt,
      d.status, sources, accepted, d.counters.recordsQuarantined || 0, 0, d.counters.masterRecords || 0,
      '', SIP.SCHEMA_VERSION, '', d.issues.slice(0, 10).map(function (x) { return x.code; }).join('|'), 'DATA_ENGINE', SIP.VERSION + (cacheResult && cacheResult.cached ? ':CACHED' : ':NOT_CACHED')];
  }

  function append(sheet, rows) {
    if (!rows.length) return;
    var start = Math.max(2, sheet.getLastRow() + 1);
    sheet.getRange(start, 1, rows.length, rows[0].length).setValues(rows);
  }
  return { write: write };
}());
