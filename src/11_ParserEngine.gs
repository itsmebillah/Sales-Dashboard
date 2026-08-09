SIP.ParserEngine = (function () {
  function parseAll(sources, context) {
    var results = [];
    var jobs = [
      ['SRC_SALES_MONTHLY', SIP.SalesParser],
      ['SRC_SALES_PREVIOUS', SIP.HistoricalSalesParser],
      ['SRC_DEALER_LIFTING', SIP.LiftingParser],
      ['SRC_MONTHLY_PROJECTION', SIP.TransactionParser],
      ['SRC_HIERARCHY', SIP.HierarchyParser],
      ['SRC_ATTENDANCE', SIP.AttendanceParser]
    ];
    jobs.forEach(function (job) {
      var source = sources[job[0]];
      if (!source || !source.values.length) return;
      try {
        var result=job[1].parse(source, context);
        results.push(result);
        if(job[0]==='SRC_SALES_MONTHLY'&&result.metadata&&result.metadata.period)context.selectedSalesPeriod=result.metadata.period;
      }
      catch (error) {
        context.diagnostics.issue('ERROR', 'PARSER_EXCEPTION', error.message, { sourceId: job[0], stack: error.stack || '' });
      }
    });
    return results;
  }
  return { parseAll: parseAll };
}());
