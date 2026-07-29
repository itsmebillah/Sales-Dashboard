SIP.KpiDefinitions = (function () {
  var definitions = {
    SALES_AMOUNT: { owner: 'Sales Owner', aggregation: 'SUM', unit: 'CURRENCY' },
    TARGET_AMOUNT: { owner: 'Sales Planning', aggregation: 'SUM', unit: 'CURRENCY' },
    COLLECTION_AMOUNT: { owner: 'Finance Owner', aggregation: 'SUM', unit: 'CURRENCY' },
    PROJECTION_AMOUNT: { owner: 'Sales Owner', aggregation: 'SUM', unit: 'CURRENCY' },
    LIFTING_AMOUNT: { owner: 'Supply Owner', aggregation: 'SUM', unit: 'CURRENCY' },
    STOCK_AMOUNT: { owner: 'Supply Owner', aggregation: 'SUM_LATEST_ENTITY', unit: 'CURRENCY' },
    SECONDARY_AMOUNT: { owner: 'Sales Owner', aggregation: 'SUM', unit: 'CURRENCY' },
    PRODUCT_QUANTITY: { owner: 'Product Owner', aggregation: 'SUM', unit: 'SOURCE_UNIT' },
    ORDER_COUNT: { owner: 'Sales Owner', aggregation: 'SUM', unit: 'COUNT' },
    WORKING_DAYS_ELAPSED: { owner: 'Sales Planning', aggregation: 'MAX', unit: 'DAY' },
    DUE_WORKING_DAYS: { owner: 'Sales Planning', aggregation: 'MAX', unit: 'DAY' },
    TOTAL_WORKING_DAYS: { owner: 'Sales Planning', aggregation: 'MAX', unit: 'DAY' },
    HISTORICAL_SALES_AMOUNT: { owner: 'Sales Owner', aggregation: 'SUM_BY_PERIOD', unit: 'CURRENCY' },
    SALES_ACTIVITY_ATTENDANCE_STATUS: { owner: 'Sales Operations', aggregation: 'NON_ADDITIVE', unit: 'STATUS' },
    HISTORICAL_DAILY_SALES_AMOUNT: { owner: 'Sales Owner', aggregation: 'SUM_BY_PERIOD', unit: 'CURRENCY' }
  };
  function get(id) { return definitions[id] || { owner: 'Data Governance', aggregation: 'SUM', unit: '' }; }
  return { get: get, all: definitions };
}());
