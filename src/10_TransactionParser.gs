SIP.TransactionParser = (function () {
  var U = SIP.Utils, H = SIP.HeaderDetector, N = SIP.Normalizer;

  function parse(source, context) {
    var started = Date.now(), rows = source.values, diag = context.diagnostics, id = source.definition.id;
    var header = H.detect(rows, { maxRows: context.config.parser.maxHeaderScanRows, minimumScore: 8, requiredGroups: [
      ['TRANSACTIONID', 'TRANSACTION_ID'], ['DATE'], ['TYPE'], ['TSM_ID', 'TSO_ID'], ['RSM_ID'], ['ASM_ID'], ['DEALER_NAME'], ['AMOUNT'], ['STATUS']
    ] }, diag, id);
    if (!header) return empty(id);
    diag.source(id).headerRow = header.rowIndex + 1;
    var records = [], dimensions = { employees: {}, dealers: {}, banks: {} }, seen = {}, loaded = 0, ignored = 0;
    for (var r = header.rowIndex + 1; r < rows.length; r++) {
      var row = rows[r], transactionId = U.text(value(row, header, ['TRANSACTIONID', 'TRANSACTION_ID']));
      if (!transactionId) { ignored++; continue; }
      if (seen[transactionId]) diag.issue('ERROR', 'DUPLICATE_TRANSACTION', 'Duplicate TransactionID', { transactionId: transactionId, rows: [seen[transactionId], r + 1] });
      else seen[transactionId] = r + 1;
      var type = U.canonicalText(value(row, header, ['TYPE']));
      if (type !== 'COLLECTION' && type !== 'PROJECTION') {
        diag.issue('ERROR', 'INVALID_TRANSACTION_TYPE', 'Unknown transaction type', { row: r + 1, type: type }); ignored++; continue;
      }
      var amount = U.number(value(row, header, ['AMOUNT']), context.config.parser.blankTokens);
      var date = U.isoDate(value(row, header, ['DATE']));
      if (!date || amount === null) {
        diag.issue('ERROR', 'INVALID_TRANSACTION_VALUE', 'Transaction requires valid date and amount', { row: r + 1, transactionId: transactionId }); ignored++; continue;
      }
      var dealer = N.dealer(value(row, header, ['DEALER_NAME']), ''); dimensions.dealers[dealer.id] = dealer;
      var tsmId = U.normalizeId(value(row, header, ['TSM_ID', 'TSO_ID']));
      var rsmId = U.normalizeId(value(row, header, ['RSM_ID']));
      var asmId = U.normalizeId(value(row, header, ['ASM_ID']));
      var bank = U.text(value(row, header, ['BANK']));
      var bankId = bank ? 'BANK:' + U.hash(U.normalizeName(bank)).slice(0, 16) : '';
      if (bankId) dimensions.banks[bankId] = { id: bankId, name: bank };
      var metricId = type === 'COLLECTION' ? 'COLLECTION_AMOUNT' : 'PROJECTION_AMOUNT';
      records.push(N.masterRecord({
        recordId: 'TXN:' + transactionId, batchId: context.batchId, sourceSystem: 'TRANSACTION_LEDGER', sourceDataset: source.definition.name,
        sourceRecordId: transactionId, contractId: 'PC_TXN_V1', moduleId: 'COLLECTION_PROJECTION', recordType: 'EVENT',
        eventType: type, metricId: metricId, eventDate: date, observedAt: U.isoDate(value(row, header, ['TIMESTAMP'])) || date,
        ingestedAt: context.ingestedAt, asmId: asmId ? 'EMPLOYEE:' + asmId : '', rsmId: rsmId ? 'EMPLOYEE:' + rsmId : '',
        tsoId: tsmId ? 'EMPLOYEE:' + tsmId : '', employeeId: tsmId ? 'EMPLOYEE:' + tsmId : '', dealerId: dealer.id,
        bankId: bankId, amount: amount, numericValue: amount, currencyCode: 'UNCONFIRMED', statusCode: U.canonicalText(value(row, header, ['STATUS'])),
        attributes: { sourceRow: r + 1, dealerName: dealer.name, dealerKeyQuality: dealer.keyQuality,
          submittedBy: U.normalizeId(value(row, header, ['SUBMITTED_BY'])), submittedAt: U.isoDate(value(row, header, ['SUBMITTED_AT'])), bankName: bank },
        sourceValues: row
      }));
      loaded++;
    }
    var s = diag.source(id); s.rowsLoaded = loaded; s.rowsIgnored = ignored; s.recordsEmitted = records.length; s.executionMs += Date.now() - started;
    return { sourceId: id, records: records, dimensions: dimensions, metadata: { header: header } };
  }

  function value(row, header, aliases) { var i = H.find(header.columns, aliases); return i < 0 ? '' : row[i]; }
  function empty(id) { return { sourceId: id, records: [], dimensions: { employees: {}, dealers: {}, banks: {} }, metadata: {} }; }
  return { parse: parse };
}());
