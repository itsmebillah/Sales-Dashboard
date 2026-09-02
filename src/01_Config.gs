SIP.Config = (function () {
  var defaults = {
    spreadsheetId: '1HxVEJqWqIc_xSGIBYJpJBIuHeqTaQiUUJ_Lc7jLKlSY',
    sheets: {
      sales: 'Raw Data',
      previousSales: 'Previous Month Sales',
      lifting: 'Dealer lifting',
      transactions: 'Monthly Projection',
      importBatches: 'Import Batches',
      qualityResults: 'Quality Results',
      masterDataset: 'Master Dataset',
      calendar: 'Calendar',
      holidays: 'Holiday',
      hierarchySource: 'Hierarchy tab',
      attendance: 'Attendance',
      hierarchy: 'Hierarchy',
      relationships: 'Relationship Model'
    },
    externalSync: {
      enabled: true,
      sourceSpreadsheetId: '1RElsFupKhds4iKLfZ9epwhSfaNoTi_g69QLESMjbbQg',
      sourceSheetName: 'Sales Posting',
      sourceStartRow: 3,
      sourceStartCol: 3,
      sourceEndCol: 40,
      periodSourceSheetName: 'Raw Data',
      periodSourceStartRow: 2,
      periodSourceDateCol: 22,
      targetSpreadsheetId: '1HxVEJqWqIc_xSGIBYJpJBIuHeqTaQiUUJ_Lc7jLKlSY',
      targetSheetName: 'Raw Data',
      targetStartRow: 3,
      targetStartCol: 3
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
      issueLimit: 1000,
      salesControlTolerance: 100
    },
    calendar: {
      timezone: 'Asia/Dhaka',
      cutoffPolicy: 'CLOSED_DAY_ONLY',
      weekendDays: [5],
      workingWeekDays: 6,
      startYear: 2025,
      endYear: 2032,
      fiscalStartMonth: 7,
      holidayApprovalStatus: 'APPROVED',
      postingLagDays: 3,
      monthCloseDay: 4
    },
    persistence: {
      chunkRows: 5000
    },
    maintenance: {
      scheduleHour: 3,
      batchRetentionDays: 90,
      maxBatchHistory: 100
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
