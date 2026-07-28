SIP.LiftingParser = (function () {
  var U = SIP.Utils, H = SIP.HeaderDetector, N = SIP.Normalizer, C = SIP.ParserCommon;

  function parse(source, context) {
    var started = Date.now(), rows = source.values, diag = context.diagnostics, id = source.definition.id;
    var header = H.detect(rows, { maxRows: context.config.parser.maxHeaderScanRows, minimumScore: 6, requiredGroups: [
      ['S_L_NO'], ['RSM_ASE'], ['TSO'], ['DEALER'], ['DEPO'], ['LIFTING'], ['STOCK'], ['SECONDARY']
    ] }, diag, id);
    if (!header) return empty(id);
    diag.source(id).headerRow = header.rowIndex + 1;
    var period = U.monthContext(rows);
    if (!period.year) diag.issue('ERROR', 'LIFTING_PERIOD_NOT_FOUND', 'Could not infer Lifting report month/year', { sourceId: id });
    var dayStart = H.find(header.columns, ['DAY_REMAIN']);
    var totalLifting = H.find(header.columns, ['TOTAL_LIFTING']);
    var days = C.contiguousDayColumns(rows[header.rowIndex], dayStart, totalLifting);
    var records = [], dimensions = { employees: {}, dealers: {}, depots: {} }, loaded = 0, ignored = 0;
    var seenDealers = {};
    for (var r = header.rowIndex + 1; r < rows.length; r++) {
      var row = rows[r], dealerCode = U.normalizeId(C.value(row, header.columns, ['S_L_NO']));
      var dealerName = C.value(row, header.columns, ['DEALER']);
      // A detail row requires a dealer code and name. This excludes hierarchy subtotal/presentation rows.
      if (!dealerCode || !U.text(dealerName)) { ignored++; continue; }
      var dealer = N.dealer(dealerName, dealerCode);
      if (seenDealers[dealer.id]) diag.issue('ERROR', 'DUPLICATE_DEALER_ROW', 'Duplicate dealer detail row in Lifting source', { dealerId: dealer.id, rows: [seenDealers[dealer.id], r + 1] });
      else seenDealers[dealer.id] = r + 1;
      dimensions.dealers[dealer.id] = dealer;
      var rsm = N.employee('', C.value(row, header.columns, ['RSM_ASE']), 'RSM');
      var tso = N.employee('', C.value(row, header.columns, ['TSO']), 'TSO');
      if (rsm.id) dimensions.employees[rsm.id] = rsm; if (tso.id) dimensions.employees[tso.id] = tso;
      var depotName = U.text(C.value(row, header.columns, ['DEPO']));
      var depotId = depotName ? 'DEPOT:' + U.hash(U.normalizeName(depotName)).slice(0, 16) : '';
      if (depotId) dimensions.depots[depotId] = { id: depotId, name: depotName, normalizedName: U.normalizeName(depotName) };
      var base = { batchId: context.batchId, sourceSystem: 'OPERATIONAL_EXPORT', sourceDataset: source.definition.name,
        sourceRecordId: dealerCode + ':' + period.periodStart, contractId: 'PC_LIFTING_V1', moduleId: 'LIFTING', recordType: 'OBSERVATION',
        periodStart: period.periodStart, periodEnd: period.periodEnd, ingestedAt: context.ingestedAt,
        rsmId: rsm.id, tsoId: tso.id, dealerId: dealer.id, depotId: depotId,
        territoryId: entityId('TERRITORY', C.value(row, header.columns, ['TERRITORY_AREA'])),
        attributes: { sourceRow: r + 1, dealerName: dealer.name, dealerCode: dealer.code, depotName: depotName,
          managerNames: { rsm: rsm.name, tso: tso.name, nsmAsm: U.text(C.value(row, header.columns, ['NSM_ASM'])) } } };
      days.forEach(function (d) {
        var amount = U.number(row[d.index], context.config.parser.blankTokens);
        if (amount !== null) records.push(C.metricRecord(base, 'LIFTING_AMOUNT', amount, U.isoDate(d.day, period.year, period.month), 'D' + d.day));
      });
      named(records, base, row, header, ['LIFTING'], 'LIFTING_MTD_AMOUNT', context);
      named(records, base, row, header, ['STOCK'], 'STOCK_AMOUNT', context, 'SNAPSHOT');
      named(records, base, row, header, ['SECONDARY'], 'SECONDARY_AMOUNT', context);
      named(records, base, row, header, ['LIFTING_NUMBER_OF'], 'LIFTING_EVENT_COUNT', context);
      loaded++;
    }
    var s = diag.source(id); s.rowsLoaded = loaded; s.rowsIgnored = ignored; s.recordsEmitted = records.length; s.executionMs += Date.now() - started;
    return { sourceId: id, records: records, dimensions: dimensions, metadata: { header: header, period: period, dailyColumns: days } };
  }

  function named(records, base, row, header, aliases, metricId, context, recordType) {
    var i = H.find(header.columns, aliases); if (i < 0) return;
    var v = U.number(row[i], context.config.parser.blankTokens);
    if (v !== null) records.push(C.metricRecord(base, metricId, v, '', metricId, { recordType: recordType || 'OBSERVATION', asOfAt: recordType === 'SNAPSHOT' ? context.ingestedAt : '' }));
  }

  function entityId(type, value) { var n = U.normalizeName(value); return n ? type + ':' + U.hash(n).slice(0, 16) : ''; }
  function empty(id) { return { sourceId: id, records: [], dimensions: { employees: {}, dealers: {}, depots: {} }, metadata: {} }; }
  return { parse: parse };
}());
