SIP.Config = (function () {
  var defaults = {
    spreadsheetId: '1HxVEJqWqIc_xSGIBYJpJBIuHeqTaQiUUJ_Lc7jLKlSY',
    sheets: {
      sales: 'Sales Data Base Monthly',
      previousSales: 'Previous Month Sales',
      lifting: 'Dealer lifting',
      transactions: 'Monthly Projection',
      importBatches: 'Import Batches',
      qualityResults: 'Quality Results'
    },
    cache: {
      namespace: 'SIP_MASTER_V1',
      ttlSeconds: 21600,
      chunkChars: 80000,
      maxChunks: 60
    },
    parser: {
      maxHeaderScanRows: 12,
      blankTokens: ['', '-', '—', '–', 'N/A', 'NA', 'NULL'],
      salesDesignations: ['SR'],
      summaryDesignations: ['T.S.O.', 'TSO', 'RSM', 'A.S.M.', 'ASM', 'ALL', 'GRADE']
    },
    quality: {
      duplicateSampleLimit: 50,
      issueLimit: 1000
    }
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function merge(base, override) {
    Object.keys(override || {}).forEach(function (key) {
      if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
        base[key] = merge(base[key] || {}, override[key]);
      } else if (override[key] !== undefined) {
        base[key] = override[key];
      }
    });
    return base;
  }

  function get(overrides) {
    return merge(clone(defaults), overrides || {});
  }

  return { get: get, defaults: clone(defaults) };
}());
