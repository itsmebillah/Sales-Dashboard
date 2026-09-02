SIP.ExternalSync = (function () {
  /**
   * High-performance 2D array sync copying external sales data cleanly into core sheet.
   * Copies Source 'Raw Data' D4:AO into Target 'Raw Data' C3:AN automatically.
   */
  function sync(options) {
    options = options || {};
    var config = SIP.Config.get(options.config);
    var syncConf = config.externalSync || {};
    if (syncConf.enabled === false && !options.force) {
      return { ok: true, skipped: true, message: 'External sync disabled.' };
    }

    var sourceId = options.sourceSpreadsheetId || syncConf.sourceSpreadsheetId || '19m8lzD1oz1TKviS0zMqLKi-hEC8odGuhh69nSHRUzzE';
    var sourceTab = options.sourceSheetName || syncConf.sourceSheetName || 'Raw Data';
    var targetId = options.targetSpreadsheetId || syncConf.targetSpreadsheetId || config.spreadsheetId;
    var targetTab = options.targetSheetName || syncConf.targetSheetName || config.sheets.sales;

    var sRow = options.sourceStartRow || syncConf.sourceStartRow || 4;
    var sCol = options.sourceStartCol || syncConf.sourceStartCol || 4; // Column D
    var eCol = options.sourceEndCol || syncConf.sourceEndCol || 41;   // Column AO

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

      // Preserve the source reporting period inside the copied dataset. The Raw
      // Data parser must never infer a historical source month from runtime time.
      var sourceTitle = sourceSs.getName ? sourceSs.getName() : '';
      if (sourceTitle) targetSheet.getRange(1, 1).setValue(sourceTitle);

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
        sourcePeriodLabel: sourceTitle,
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

  return { sync: sync };
}());
