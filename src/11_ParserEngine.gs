SIP.ParserEngine = (function () {
  function parseAll(sources, context) {
    var results = [];
    var jobs = [
      ['SRC_SALES_MONTHLY', SIP.SalesParser],
      ['SRC_DEALER_LIFTING', SIP.LiftingParser],
      ['SRC_MONTHLY_PROJECTION', SIP.TransactionParser]
    ];
    jobs.forEach(function (job) {
      var source = sources[job[0]];
      if (!source || !source.values.length) return;
      try { results.push(job[1].parse(source, context)); }
      catch (error) {
        context.diagnostics.issue('ERROR', 'PARSER_EXCEPTION', error.message, { sourceId: job[0], stack: error.stack || '' });
      }
    });
    return results;
  }
  return { parseAll: parseAll };
}());
