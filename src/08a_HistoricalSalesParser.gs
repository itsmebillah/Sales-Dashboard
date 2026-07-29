/**
 * Reads only earlier-period totals embedded in the previous-month report.
 * Daily and MTD values are intentionally excluded to avoid double-counting the
 * latest historical month already published by the current Sales report.
 */
SIP.HistoricalSalesParser = (function () {
  function parse(source, context) {
    var parsed = SIP.SalesParser.parse(source, context);
    parsed.records = (parsed.records || []).filter(function (record) {
      return record.metric_id === 'HISTORICAL_SALES_AMOUNT';
    });
    parsed.metadata = parsed.metadata || {};
    parsed.metadata.historyOnly = true;
    context.diagnostics.source(source.definition.id).recordsEmitted = parsed.records.length;
    return parsed;
  }
  return { parse: parse };
}());
