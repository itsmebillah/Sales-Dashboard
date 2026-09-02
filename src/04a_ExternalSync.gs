SIP.ExternalSync = (function () {
  /**
   * High-performance 2D array sync copying external sales data cleanly into core sheet.
   * Copies Source 'Sales Posting' C3:AN into Target 'Raw Data' C3:AN automatically.
   */
  function sync(options) {
    options = options || {};
    var config = SIP.Config.get(options.config);
    var syncConf = config.externalSync || {};
    if (syncConf.enabled === false && !options.force) {
      return { ok: true, skipped: true, message: 'External sync disabled.' };
    }

    var sourceId = options.sourceSpreadsheetId || syncConf.sourceSpreadsheetId || '1RElsFupKhds4iKLfZ9epwhSfaNoTi_g69QLESMjbbQg';
    var sourceTab = options.sourceSheetName || syncConf.sourceSheetName || 'Sales Posting';
    var targetId = options.targetSpreadsheetId || syncConf.targetSpreadsheetId || config.spreadsheetId;
    var targetTab = options.targetSheetName || syncConf.targetSheetName || config.sheets.sales;

    var sRow = options.sourceStartRow || syncConf.sourceStartRow || 3;
    var sCol = options.sourceStartCol || syncConf.sourceStartCol || 3; // Column C
    var eCol = options.sourceEndCol || syncConf.sourceEndCol || 40;   // Column AN

    var tRow = options.targetStartRow || syncConf.targetStartRow || 3;
    var tCol = options.targetStartCol || syncConf.targetStartCol || 3; // Column C

    var started = Date.now();
    var lock = typeof LockService !== 'undefined' ? LockService.getScriptLock() : null;
    if (lock && !lock.tryLock(10000)) {
      return { ok: false, error: { code: 'SYNC_LOCKED', message: 'External sync is already running in another process' } };
    }

    try {
      var sourceSs = SpreadsheetApp.openById(sourceId);
      var sourceSheet = sourceSs.getSheetByName(sourceTab);
      if (!sourceSheet) {
        throw new Error('Source sheet "' + sourceTab + '" not found in spreadsheet ' + sourceId);
      }

      var lastRow = sourceSheet.getLastRow();
      if (lastRow < sRow) {
        return { ok: true, rowsCopied: 0, message: 'Source sheet contains no data rows at row ' + sRow };
      }

      var numRows = lastRow - sRow + 1;
      var numCols = eCol - sCol + 1;

      var values = sourceSheet.getRange(sRow, sCol, numRows, numCols).getValues();
      if (!values || !values.length) {
        throw new Error('No values found in source range ' + columnLabel(sCol) + sRow + ':' + columnLabel(eCol) + ' in sheet ' + sourceTab);
      }

      var targetSs = SpreadsheetApp.openById(targetId);
      var targetSheet = targetSs.getSheetByName(targetTab);
      if (!targetSheet) {
        targetSheet = targetSs.insertSheet(targetTab);
      }

      var sourceTitle = sourceSs.getName ? sourceSs.getName() : '';
      // Sales Posting exposes day-of-month only. Resolve its month/year from an
      // explicit title first, then from the source ERP OrderDate column. Never
      // replace Raw Data!A1 with a generic workbook title.
      var sourcePeriod = resolveSourcePeriod(sourceSs, sourceTitle, syncConf, options);
      if (!sourcePeriod.label) {
        throw new Error('Could not resolve one explicit reporting month from the source workbook');
      }
      targetSheet.getRange(1, 1).setValue(sourcePeriod.label);

      var targetLastRow = targetSheet.getLastRow();
      var clearRows = Math.max(numRows, targetLastRow >= tRow ? (targetLastRow - tRow + 1) : 1);
      targetSheet.getRange(tRow, tCol, clearRows, numCols).clearContent();

      targetSheet.getRange(tRow, tCol, numRows, numCols).setValues(values);

      var elapsedMs = Date.now() - started;
      return {
        ok: true,
        sourceId: sourceId,
        sourceTab: sourceTab,
        targetId: targetId,
        targetTab: targetTab,
        rowsCopied: numRows,
        colsCopied: numCols,
        sourceRange: columnLabel(sCol) + sRow + ':' + columnLabel(eCol) + lastRow,
        targetRange: columnLabel(tCol) + tRow + ':' + columnLabel(tCol + numCols - 1) + (tRow + numRows - 1),
        sourcePeriodLabel: sourcePeriod.label,
        sourcePeriodSource: sourcePeriod.source,
        executionMs: elapsedMs
      };
    } catch (err) {
      return { ok: false, error: { code: 'EXTERNAL_SYNC_FAILED', message: err && err.message ? err.message : String(err) } };
    } finally {
      if (lock) lock.releaseLock();
    }
  }

  function columnLabel(column) {
    var out = '';
    while (column > 0) {
      column--;
      out = String.fromCharCode(65 + (column % 26)) + out;
      column = Math.floor(column / 26);
    }
    return out;
  }

  function resolveSourcePeriod(sourceSs, sourceTitle, syncConf, options) {
    var titleLabel = periodLabelFromText(sourceTitle);
    if (titleLabel) return { label: titleLabel, source: 'WORKBOOK_TITLE' };

    var sheetName = options.periodSourceSheetName || syncConf.periodSourceSheetName || 'Raw Data';
    var startRow = options.periodSourceStartRow || syncConf.periodSourceStartRow || 2;
    var dateCol = options.periodSourceDateCol || syncConf.periodSourceDateCol || 22;
    var sheet = sourceSs.getSheetByName(sheetName);
    if (!sheet) return { label: '', source: '' };
    var lastRow = sheet.getLastRow();
    if (lastRow < startRow) return { label: '', source: '' };

    var values = sheet.getRange(startRow, dateCol, lastRow - startRow + 1, 1).getValues();
    var months = {};
    values.forEach(function (row) {
      var key = monthKey(row[0]);
      if (key) months[key] = true;
    });
    var keys = Object.keys(months).sort();
    if (keys.length !== 1) return { label: '', source: keys.length ? 'AMBIGUOUS_ORDER_DATE' : '' };
    return { label: monthLabel(keys[0]), source: sheetName + '!' + columnLabel(dateCol) + startRow + ':' + columnLabel(dateCol) + lastRow };
  }

  function periodLabelFromText(value) {
    var text = String(value || '');
    var names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    for (var i = 0; i < names.length; i++) {
      var match = text.match(new RegExp(names[i] + "[^0-9]*(20)?(\\d{2})", 'i'));
      if (match) return names[i] + "'" + match[2];
    }
    return '';
  }

  function monthKey(value) {
    var date = value instanceof Date ? value : null;
    if (!date && typeof value === 'number' && isFinite(value)) {
      date = new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86400000);
    }
    if (!date || isNaN(date.getTime())) return '';
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
  }

  function monthLabel(key) {
    var names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var parts = key.split('-');
    return names[Number(parts[1]) - 1] + "'" + parts[0].slice(-2);
  }

  return { sync: sync };
}());
