SIP.ParserCommon = (function () {
  var H = SIP.HeaderDetector, U = SIP.Utils;

  function value(row, columns, aliases) {
    var index = H.find(columns, aliases);
    return index >= 0 ? row[index] : '';
  }

  function contiguousDayColumns(header, startAfter, endBefore) {
    var result = [], start = Math.max(0, startAfter + 1), end = endBefore >= 0 ? endBefore : header.length;
    for (var i = start; i < end; i++) {
      var day = U.number(header[i], []);
      if (day !== null && day >= 1 && day <= 31 && Math.floor(day) === day) result.push({ index: i, day: day });
    }
    return result;
  }

  function metricRecord(base, metricId, value, date, suffix, extra) {
    var input = Object.assign({}, base, extra || {});
    input.metricId = metricId;
    input.eventDate = date || base.eventDate || '';
    input.numericValue = value;
    input.amount = input.amount === undefined && /AMOUNT|SALES|LIFTING|STOCK|SECONDARY|TARGET|COLLECTION|PROJECTION/.test(metricId) ? value : input.amount;
    input.recordId = SIP.Utils.uniqueId('REC', [base.sourceDataset, base.sourceRecordId, metricId, date, suffix || '']);
    return SIP.Normalizer.masterRecord(input);
  }

  return { value: value, contiguousDayColumns: contiguousDayColumns, metricRecord: metricRecord };
}());
