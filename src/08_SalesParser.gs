SIP.SalesParser = (function () {
  var U = SIP.Utils, H = SIP.HeaderDetector, N = SIP.Normalizer, C = SIP.ParserCommon;

  function parse(source, context) {
    if (isRawDataFormat(source.values, source)) {
      return parseRawDataFormat(source, context);
    }
    var started = Date.now(), rows = source.values, diag = context.diagnostics, id = source.definition.id;
    var header = H.detect(rows, { maxRows: context.config.parser.maxHeaderScanRows, minimumScore: 5, requiredGroups: [
      ['ID'], ['RSM'], ['TSO', 'T_S_O'], ['SR'], ['DESIGNATION'], ['AREA_POINT', 'AREA_POINT_'], ['SALES_OF_JULY_26', 'SALES_OF_AUG_26', 'AVG']
    ] }, diag, id);
    if (!header) return empty(id);
    diag.source(id).headerRow = header.rowIndex + 1;
    var period = U.monthContext(rows);
    if (!period.year) diag.issue('WARN', 'SALES_PERIOD_NOT_FOUND', 'Could not infer Sales report month/year', { sourceId: id });
    var dlIndex = H.find(header.columns, ['DL_CD']);
    var totalIndex = findPrefix(header.keys, 'SALES_OF_');
    var days = C.contiguousDayColumns(rows[header.rowIndex], dlIndex, totalIndex);
    if (!days.length) diag.issue('WARN', 'DAILY_COLUMNS_NOT_FOUND', 'No Sales day columns detected', { sourceId: id });
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
        diag.issue('WARN', 'SALES_EMPLOYEE_KEY_MISSING', 'SR row has business values but no employee key', { row: r + 1 }); ignored++; continue;
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
        var groupId = product.group ? 'PRODUCT_GROUP:' + U.hash(product.group).slice(0, 16) : '';
        if (groupId) {
          dimensions.categories = dimensions.categories || {};
          dimensions.categories[groupId] = { id: groupId, name: product.group, entityType: 'CATEGORY' };
        }
        records.push(C.metricRecord(base, 'PRODUCT_QUANTITY', qty, '', 'P' + p.index, {
          productId: product.id, productGroupId: groupId,
          packId: product.pack ? 'PACK:' + U.hash(product.pack).slice(0, 16) : '', quantity: qty, amount: null, unitCode: 'SOURCE_UNIT'
        }));
      });
      loaded++;
    }
    var s = diag.source(id); s.rowsLoaded = loaded; s.rowsIgnored = ignored; s.recordsEmitted = records.length; s.executionMs += Date.now() - started;
    return { sourceId: id, records: records, dimensions: dimensions, metadata: { header: header, period: period, dailyColumns: days, productColumns: productMeta, monthlyWorkingDays: monthlyWorkingDays(rows), monthlyWorkingDaysSource:null, salesControlTotal:controlTotal(rows) } };
  }

  function baseRecord(context, source, row, rowIndex, period, employee, dealer, columns) {
    var rsm = N.employee('', C.value(row, columns, ['RSM', 'RSM_NAME', 'REGION']), 'RSM');
    var tso = N.employee('', C.value(row, columns, ['TSO', 'T_S_O', 'TSO_NAME']), 'TSO');
    var asm = N.employee('', C.value(row, columns, ['ASM', 'A_S_M', 'ASM_NAME']), 'ASM');
    var areaName = C.value(row, columns, ['AREA', 'AREA_NAME', 'ZONE']);
    var areaId = areaName ? 'AREA:' + U.hash(U.normalizeName(areaName)).slice(0, 16) : '';
    var terrName = C.value(row, columns, ['TERRITORY', 'TERRITORY_NAME']);
    var terrId = terrName ? 'TERRITORY:' + U.hash(U.normalizeName(terrName)).slice(0, 16) : '';
    return { batchId: context.batchId, sourceSystem: 'ERP_EXPORT', sourceDataset: source.definition.name,
      sourceRecordId: U.text(rowIndex + 1) + ':' + employee.sourceId, contractId: 'PC_SALES_V1', moduleId: 'SALES', recordType: 'OBSERVATION',
      periodStart: period.periodStart, periodEnd: period.periodEnd, ingestedAt: context.ingestedAt,
      asmId: asm.id, rsmId: rsm.id, tsoId: tso.id, srId: employee.id, employeeId: employee.id, dealerId: dealer.id,
      areaId: areaId, territoryId: terrId, qualityStatus: 'VALID',
      attributes: { sourceRow: rowIndex + 1, employeeName: employee.name, dealerName: dealer.name, dealerKeyQuality: dealer.keyQuality,
        joiningDate: U.isoDate(C.value(row, columns, ['JOINING_DATE'])), areaPoint: dealer.name } };
  }

  function addNamedMetric(records, base, row, header, aliases, metricId, context, recordType, suffixMatch) {
    if (!header || !header.columns) return;
    var index = H.find(header.columns, aliases);
    if (index < 0 && header.keys) {
      for (var a = 0; a < aliases.length; a++) {
        var alias = aliases[a];
        index = suffixMatch ? findSuffix(header.keys, alias) : (alias.slice(-1) === '_' ? findPrefix(header.keys, alias) : -1);
        if (index >= 0) break;
      }
    }
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

  function isRawDataFormat(rows, source) {
    if (!rows || rows.length < 3) return false;
    var sheetName = (source && source.name) || (source && source.definition && source.definition.sheetName) || '';
    if (/raw\s*data/i.test(sheetName)) return true;
    var cellA1 = U.text(rows[0][0]);
    if (/Sales Data Base/i.test(cellA1)) return false;
    var row0 = rows[0] || [], row1 = rows[1] || [];
    var hasNumberOrPriceInRow0 = false, hasProductInRow1 = false;
    for (var c = 0; c < Math.max(row0.length, row1.length); c++) {
      var val0 = U.number(row0[c], []);
      if (val0 !== null && val0 > 0) hasNumberOrPriceInRow0 = true;
      var val1 = U.text(row1[c]);
      if (val1 && !/^\d+$/.test(val1) && !/total|sales|target|designation|rsm|tso|sr|id|area|dealer/i.test(val1)) hasProductInRow1 = true;
    }
    return hasNumberOrPriceInRow0 || hasProductInRow1;
  }

  function parseRawDataFormat(source, context) {
    var started = Date.now(), rows = source.values, diag = context.diagnostics, id = source.definition.id;
    var priceRow = rows[0] || [], nameRow = rows[1] || [];
    var salesIndex = findRawHeader(nameRow, ['SALES_AMOUNT', 'TOTAL_SALES', 'SALES', 'SALES_OF'], [/বিক্রয়ের\s*পরিমাণ/i]);
    var targetIndex = findRawHeader(nameRow, ['TARGET', 'MONTHLY_TGT_PRODUCT_WISE_VALUE', 'MONTHLY_TGT', 'TGT', 'TARGET_AMOUNT'], []);
    var orderIndex = findRawHeader(nameRow, ['NO_OF_ORDER', 'ORDER_COUNT', 'ORDERS'], []);
    var productMeta = [];
    var ignoreHeaderKeys = /^(total|sales|target|tgt|monthly\s*wd|wd|order|no\.\s*of\s*order|avg|working\s*hour|id|sr|rsm|tso|asm|dealer|area|point|sl|cd|code|date|designation|desig)$/i;
    for (var col = 4; col < nameRow.length; col++) {
      if (col === salesIndex || col === targetIndex || col === orderIndex) continue;
      var pName = U.text(nameRow[col]);
      if (!pName || ignoreHeaderKeys.test(pName)) continue;
      if (/^(sl|point|dealer|sr|id|sr_id|sr_name|rsm|tso|asm|area|territory|total|target|tgt|monthly_tgt)$/i.test(pName)) continue;
      var pPrice = U.number(priceRow[col], context.config.parser.blankTokens);
      if (pPrice === null || pPrice <= 0) continue;
      productMeta.push({ index: col, name: pName, price: pPrice });
    }

    var header = H.detect(rows, { maxRows: 6, minimumScore: 1, requiredGroups: [
      ['ID', 'PF_NO', 'SR_ID', 'EMPLOYEE_ID', 'CODE', 'SR_CODE', 'SL', 'DEALER_SL'],
      ['SR', 'SR_NAME', 'NAME', 'NAME_OF_SR', 'EMPLOYEE_NAME', 'SALES_REPRESENTATIVE', 'SR_']
    ] }, diag, id);

    var headerRowIndex = header ? header.rowIndex : 2;
    var columns = header ? header.columns : {};
    var period = U.monthContext(rows);
    if (!period.explicit) diag.issue('ERROR', 'SALES_PERIOD_NOT_FOUND', 'Raw Data has no explicit report month/year; runtime month fallback is not safe', { sourceId: id });

    var records = [], dimensions = { employees: {}, dealers: {}, products: {} }, ignored = 0, loaded = 0;
    var statedSalesTotal = 0, calculatedSalesTotal = 0, statedSalesRows = 0, salesVarianceRows = 0, unallocatedSalesRows = 0, maxSalesVariance = 0;
    for (var r = headerRowIndex + 1; r < rows.length; r++) {
      var row = rows[r];
      if (!row || !row.length) { ignored++; continue; }
      var sourceEmployeeId = C.value(row, columns, ['SR_ID', 'ID', 'PF_NO', 'EMPLOYEE_ID', 'CODE', 'SR_CODE', 'SL']);
      if (!sourceEmployeeId && row[2] != null && String(row[2]).trim() !== '' && !/total|subtotal|sum|grand/i.test(String(row[2]))) {
        sourceEmployeeId = String(row[2]).trim();
      }
      var srName = C.value(row, columns, ['SR_NAME', 'SR', 'NAME', 'NAME_OF_SR', 'EMPLOYEE_NAME', 'SALES_REPRESENTATIVE']);
      if (!srName && row[3] != null && typeof row[3] === 'string' && row[3].trim() !== '') {
        srName = String(row[3]).trim();
      }
      if (!srName && !sourceEmployeeId) { ignored++; continue; }
      if (/total|subtotal|sum|grand/i.test(srName || '') || /total|subtotal|sum|grand/i.test(sourceEmployeeId || '')) { ignored++; continue; }

      var employee = N.employee(sourceEmployeeId, srName, 'SR');
      if (!employee.id) { ignored++; continue; }

      var dealerName = C.value(row, columns, ['POINT', 'AREA_POINT', 'AREA_POINT_', 'DEALER_NAME', 'DEALER']);
      if (!dealerName && row[1] != null && typeof row[1] === 'string' && row[1].trim() !== '') {
        dealerName = String(row[1]).trim();
      }
      if (/^(paste here|sample|template|enter data|n\/a|test)$/i.test(dealerName)) {
        dealerName = '';
      }
      var dealerCode = C.value(row, columns, ['DEALER_SL', 'DEALER_ID', 'DL_CD', 'DEALER_CODE', 'SL']);
      var dealer = N.dealer(dealerName, dealerCode);
      dimensions.employees[employee.id] = employee;
      if (dealer.id) dimensions.dealers[dealer.id] = dealer;

      var base = baseRecord(context, source, row, r, period, employee, dealer, columns);
      var eventDate = U.isoDate(C.value(row, columns, ['DATE', 'EVENT_DATE']), period.year, period.month) || period.periodStart;

      var rowSalesValue = 0;
      productMeta.forEach(function (p) {
        var qty = U.number(row[p.index], context.config.parser.blankTokens);
        if (qty === null || qty === 0) return;
        var product = N.product(p.name, '', '');
        if (!product.id) return;
        dimensions.products[product.id] = product;
        var groupId = product.group ? 'PRODUCT_GROUP:' + U.hash(product.group).slice(0, 16) : '';
        if (groupId) {
          dimensions.categories = dimensions.categories || {};
          dimensions.categories[groupId] = { id: groupId, name: product.group, entityType: 'CATEGORY' };
        }
        var amount = p.price > 0 ? qty * p.price : null;
        if (amount !== null) rowSalesValue += amount;
        records.push(C.metricRecord(base, 'PRODUCT_QUANTITY', qty, eventDate, 'P' + p.index, {
          productId: product.id,
          productGroupId: groupId,
          productName: p.name,
          categoryName: product.group,
          quantity: qty,
          amount: amount,
          unitCode: 'SOURCE_UNIT'
        }));
      });

      var explicitSales = salesIndex >= 0 ? row[salesIndex] : C.value(row, columns, ['SALES_AMOUNT', 'TOTAL_SALES', 'SALES', 'SALES_OF']);
      var statedSales = U.number(explicitSales, context.config.parser.blankTokens);
      var salesVal = statedSales !== null ? statedSales : (rowSalesValue > 0 ? rowSalesValue : null);
      calculatedSalesTotal += rowSalesValue;
      if (statedSales !== null) {
        statedSalesRows++; statedSalesTotal += statedSales;
        var salesVariance = rowSalesValue - statedSales;
        if (Math.abs(salesVariance) > 0.01) salesVarianceRows++;
        if (rowSalesValue === 0 && statedSales > 0) unallocatedSalesRows++;
        maxSalesVariance = Math.max(maxSalesVariance, Math.abs(salesVariance));
      }
      if (salesVal !== null) {
        records.push(C.metricRecord(base, 'SALES_AMOUNT', salesVal, eventDate, 'RAW_SALES'));
      }

      var explicitTarget = targetIndex >= 0 ? row[targetIndex] : C.value(row, columns, ['TARGET', 'MONTHLY_TGT_PRODUCT_WISE_VALUE', 'MONTHLY_TGT', 'TGT', 'TARGET_AMOUNT']);
      var targetVal = U.number(explicitTarget, context.config.parser.blankTokens);
      if (targetVal !== null && targetVal > 0) {
        records.push(C.metricRecord(base, 'TARGET_AMOUNT', targetVal, eventDate, 'RAW_TARGET', { recordType: 'PLAN' }));
      }
      var orderVal = U.number(orderIndex >= 0 ? row[orderIndex] : C.value(row, columns, ['NO_OF_ORDER', 'ORDER_COUNT', 'ORDERS']), context.config.parser.blankTokens);
      if (orderVal !== null) records.push(C.metricRecord(base, 'ORDER_COUNT', orderVal, eventDate, 'RAW_ORDERS'));
      loaded++;
    }

    if (statedSalesRows && salesVarianceRows) diag.issue('WARN', 'RAW_SALES_CALC_VARIANCE', 'Stated sales differ from quantity multiplied by reference price; stated sales remain authoritative', {
      sourceId: id, statedSalesRows: statedSalesRows, varianceRows: salesVarianceRows, unallocatedSalesRows: unallocatedSalesRows,
      statedSalesTotal: statedSalesTotal, calculatedSalesTotal: calculatedSalesTotal,
      variance: calculatedSalesTotal - statedSalesTotal, maxAbsoluteRowVariance: maxSalesVariance, policy: 'STATED_SALES_AUTHORITATIVE'
    });

    var s = diag.source(id); s.rowsLoaded = loaded; s.rowsIgnored = ignored; s.recordsEmitted = records.length; s.executionMs += Date.now() - started;
    return { sourceId: id, records: records, dimensions: dimensions, metadata: { header: header, period: period, productColumns: productMeta, monthlyWorkingDays: null,
      salesControlTotal: statedSalesRows ? statedSalesTotal : null, statedSalesTotal: statedSalesRows ? statedSalesTotal : null,
      calculatedSalesTotal: calculatedSalesTotal, salesVariance: statedSalesRows ? calculatedSalesTotal - statedSalesTotal : null,
      salesVarianceRows: salesVarianceRows, unallocatedSalesRows: unallocatedSalesRows, salesAuthority: statedSalesRows ? 'STATED_SALES' : 'CALCULATED_PRODUCT_VALUE' } };
  }

  function findRawHeader(row, aliases, patterns) {
    for (var i = 0; i < row.length; i++) {
      var key = U.headerKey(row[i]), label = U.canonicalText(row[i]);
      if (aliases.indexOf(key) >= 0) return i;
      for (var p = 0; p < patterns.length; p++) if (patterns[p].test(label)) return i;
    }
    return -1;
  }

  function empty(id) { return { sourceId: id, records: [], dimensions: { employees: {}, dealers: {}, products: {} }, metadata: {} }; }
  return { parse: parse };
}());
