SIP.SalesParser = (function () {
  var U = SIP.Utils, H = SIP.HeaderDetector, N = SIP.Normalizer, C = SIP.ParserCommon;

  function parse(source, context) {
    var started = Date.now(), rows = source.values, diag = context.diagnostics, id = source.definition.id;
    var header = H.detect(rows, { maxRows: context.config.parser.maxHeaderScanRows, minimumScore: 5, requiredGroups: [
      ['ID'], ['RSM'], ['TSO', 'T_S_O'], ['SR'], ['DESIGNATION'], ['AREA_POINT', 'AREA_POINT_'], ['SALES_OF_JULY_26', 'AVG']
    ] }, diag, id);
    if (!header) return empty(id);
    diag.source(id).headerRow = header.rowIndex + 1;
    var period = U.monthContext(rows);
    if (!period.year) diag.issue('ERROR', 'SALES_PERIOD_NOT_FOUND', 'Could not infer Sales report month/year', { sourceId: id });
    var dlIndex = H.find(header.columns, ['DL_CD']);
    var totalIndex = findPrefix(header.keys, 'SALES_OF_');
    var days = C.contiguousDayColumns(rows[header.rowIndex], dlIndex, totalIndex);
    if (!days.length) diag.issue('ERROR', 'DAILY_COLUMNS_NOT_FOUND', 'No Sales day columns detected', { sourceId: id });
    var productStart = H.find(header.columns, ['AVERAGE_DAILY_OUTLET']);
    var productMeta = buildProductMeta(rows, header.rowIndex, productStart);
    var records = [], dimensions = { employees: {}, dealers: {}, products: {} }, ignored = 0, loaded = 0;
    for (var r = header.rowIndex + 1; r < rows.length; r++) {
      var row = rows[r];
      var designation = U.canonicalText(C.value(row, header.columns, ['DESIGNATION']));
      if (context.config.parser.salesDesignations.indexOf(designation) < 0) { ignored++; continue; }
      var sourceEmployeeId = C.value(row, header.columns, ['ID', 'PF_NO']);
      var srName = C.value(row, header.columns, ['SR']);
      var employee = N.employee(sourceEmployeeId, srName, 'SR');
      if (!employee.id) {
        if (isPresentationRow(row,header,days,productMeta,context)) { ignored++; continue; }
        diag.issue('ERROR', 'SALES_EMPLOYEE_KEY_MISSING', 'SR row has business values but no employee key', { row: r + 1 }); ignored++; continue;
      }
      var dealer = N.dealer(C.value(row, header.columns, ['AREA_POINT', 'AREA_POINT_']), C.value(row, header.columns, ['DEALER_SL']));
      dimensions.employees[employee.id] = employee; if (dealer.id) dimensions.dealers[dealer.id] = dealer;
      var base = baseRecord(context, source, row, r, period, employee, dealer, header.columns);
      days.forEach(function (d) {
        var amount = U.number(row[d.index], context.config.parser.blankTokens);
        if (amount !== null) records.push(C.metricRecord(base, 'SALES_AMOUNT', amount, U.isoDate(d.day, period.year, period.month), 'D' + d.day));
      });
      addNamedMetric(records, base, row, header, ['SALES_OF_'], 'SALES_MTD_AMOUNT', context);
      addNamedMetric(records, base, row, header, ['MONTHLY_TGT_PRODUCT_WISE_VALUE'], 'TARGET_AMOUNT', context, 'PLAN', true);
      addNamedMetric(records, base, row, header, ['NO_OF_ORDER'], 'ORDER_COUNT', context);
      addNamedMetric(records, base, row, header, ['CURRENT_WD'], 'WORKING_DAYS_ELAPSED', context);
      addNamedMetric(records, base, row, header, ['DUE_WD'], 'DUE_WORKING_DAYS', context);
      addNamedMetric(records, base, row, header, ['TOTAL_WD'], 'TOTAL_WORKING_DAYS', context);
      addHistoricalMetrics(records, base, row, header, context);
      var workHoursIndex = H.find(header.columns, ['SR_AVG_WORKING_HOUR']);
      if (workHoursIndex >= 0) {
        var minutes = N.workingHours(row[workHoursIndex]);
        if (minutes !== null) records.push(C.metricRecord(base, 'AVG_WORKING_MINUTES', minutes, '', 'WORK_MIN', { unitCode: 'MINUTE' }));
      }
      productMeta.forEach(function (p) {
        var qty = U.number(row[p.index], context.config.parser.blankTokens);
        if (qty === null) return;
        var product = N.product(p.name, p.pack, p.group); if (!product.id) return;
        dimensions.products[product.id] = product;
        records.push(C.metricRecord(base, 'PRODUCT_QUANTITY', qty, '', 'P' + p.index, {
          productId: product.id, productGroupId: product.group ? 'PRODUCT_GROUP:' + U.hash(product.group).slice(0, 16) : '',
          packId: product.pack ? 'PACK:' + U.hash(product.pack).slice(0, 16) : '', quantity: qty, amount: null, unitCode: 'SOURCE_UNIT'
        }));
      });
      loaded++;
    }
    var s = diag.source(id); s.rowsLoaded = loaded; s.rowsIgnored = ignored; s.recordsEmitted = records.length; s.executionMs += Date.now() - started;
    return { sourceId: id, records: records, dimensions: dimensions, metadata: { header: header, period: period, dailyColumns: days, productColumns: productMeta, monthlyWorkingDays: monthlyWorkingDays(rows), monthlyWorkingDaysSource:'Sales Data Base Monthly!AZ3', salesControlTotal:controlTotal(rows) } };
  }

  function baseRecord(context, source, row, rowIndex, period, employee, dealer, columns) {
    var rsm = N.employee('', C.value(row, columns, ['RSM']), 'RSM');
    var tso = N.employee('', C.value(row, columns, ['TSO', 'T_S_O']), 'TSO');
    return { batchId: context.batchId, sourceSystem: 'ERP_EXPORT', sourceDataset: source.definition.name,
      sourceRecordId: U.text(rowIndex + 1) + ':' + employee.sourceId, contractId: 'PC_SALES_V1', moduleId: 'SALES', recordType: 'OBSERVATION',
      periodStart: period.periodStart, periodEnd: period.periodEnd, ingestedAt: context.ingestedAt,
      rsmId: rsm.id, tsoId: tso.id, srId: employee.id, employeeId: employee.id, dealerId: dealer.id,
      qualityStatus: dealer.keyQuality === 'MISSING' ? 'VALID' : (dealer.keyQuality === 'CODE' ? 'VALID' : 'VALID'),
      attributes: { sourceRow: rowIndex + 1, employeeName: employee.name, dealerName: dealer.name, dealerKeyQuality: dealer.keyQuality,
        joiningDate: U.isoDate(C.value(row, columns, ['JOINING_DATE'])), areaPoint: dealer.name } };
  }

  function addNamedMetric(records, base, row, header, aliases, metricId, context, recordType, suffixMatch) {
    var index = suffixMatch ? findSuffix(header.keys,aliases[0]) : (aliases[0].slice(-1) === '_' ? findPrefix(header.keys, aliases[0]) : H.find(header.columns, aliases));
    if (index < 0) return;
    var v = U.number(row[index], context.config.parser.blankTokens);
    if (v !== null) records.push(C.metricRecord(base, metricId, v, '', metricId, { recordType: recordType || 'OBSERVATION' }));
  }

  function findPrefix(keys, prefix) { for (var i = 0; i < keys.length; i++) if (keys[i].indexOf(prefix) === 0) return i; return -1; }
  function findSuffix(keys, suffix) { for (var i = 0; i < keys.length; i++) if (keys[i]===suffix||keys[i].slice(-suffix.length)===suffix) return i; return -1; }

  function addHistoricalMetrics(records, base, row, header, context) {
    header.keys.forEach(function (key, index) {
      if (key.indexOf('SALES_') !== 0 || key.indexOf('SALES_OF_') === 0) return;
      var period = historicalPeriod(key); if (!period) return;
      var value = U.number(row[index], context.config.parser.blankTokens); if (value === null) return;
      records.push(C.metricRecord(base, 'HISTORICAL_SALES_AMOUNT', value, period.end, 'HIST_' + period.start, {
        periodStart: period.start, periodEnd: period.end,
        attributes: Object.assign({}, base.attributes || {}, { historicalPeriod: period.start.slice(0, 7), sourceHeader: key })
      }));
    });
  }

  function historicalPeriod(key) {
    var match = key.match(/^SALES_([A-Z]+)_((?:20)?\d{2})$/); if (!match) return null;
    var months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    var month = months.indexOf(match[1].slice(0, 3)) + 1; if (!month) return null;
    var year = Number(match[2]); if (year < 100) year += 2000;
    var start = year + '-' + String(month).padStart(2, '0') + '-01';
    var end = year + '-' + String(month).padStart(2, '0') + '-' + new Date(Date.UTC(year, month, 0)).getUTCDate();
    return { start: start, end: end };
  }

  function buildProductMeta(rows, headerIndex, start) {
    var out = []; if (start < 0) return out;
    var names = rows[Math.max(0, headerIndex - 1)] || [], packs = rows[headerIndex] || [], groups = rows[Math.max(0, headerIndex - 3)] || [];
    var lastName = '', lastGroup = '';
    for (var i = start + 1; i < packs.length; i++) {
      if (U.text(names[i])) lastName = U.text(names[i]);
      if (U.text(groups[i])) lastGroup = U.text(groups[i]);
      if (lastName && U.text(packs[i])) out.push({ index: i, name: lastName, pack: U.text(packs[i]), group: lastGroup });
    }
    return out;
  }

  function isPresentationRow(row,header,days,products,context) {
    var indexes=days.map(function(x){return x.index;}).concat(products.map(function(x){return x.index;}));
    ['SALES_OF_','NO_OF_ORDER'].forEach(function(alias){var index=alias.slice(-1)==='_'?findPrefix(header.keys,alias):H.find(header.columns,[alias]);if(index>=0)indexes.push(index);});
    var targetIndex=findSuffix(header.keys,'MONTHLY_TGT_PRODUCT_WISE_VALUE');if(targetIndex>=0)indexes.push(targetIndex);
    return !indexes.some(function(index){var value=U.number(row[index],context.config.parser.blankTokens);return value!==null&&value!==0;});
  }
  function monthlyWorkingDays(rows) {
    var label=rows[2]&&U.headerKey(rows[2][50]),value=rows[2]&&U.number(rows[2][51],[]);
    return label==='MONTHLY_WD'&&value!==null&&value>0&&value<=31?value:null;
  }
  function controlTotal(rows) {
    var value=rows[1]&&U.number(rows[1][13],[]);
    return value!==null?value:null;
  }

  function empty(id) { return { sourceId: id, records: [], dimensions: { employees: {}, dealers: {}, products: {} }, metadata: {} }; }
  return { parse: parse };
}());
