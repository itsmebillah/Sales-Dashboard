SIP.SourceReader = (function () {
  function readAll(spreadsheet, config, diagnostics) {
    var mainSalesName = config.sheets.sales;
    if (spreadsheet) {
      if (typeof spreadsheet.getSheetByName === 'function') {
        if (spreadsheet.getSheetByName('Raw Data')) mainSalesName = 'Raw Data';
        else if (spreadsheet.getSheetByName('Sales Data Base Monthly')) mainSalesName = 'Sales Data Base Monthly';
      } else {
        if (spreadsheet['Raw Data']) mainSalesName = 'Raw Data';
        else if (spreadsheet['Sales Data Base Monthly']) mainSalesName = 'Sales Data Base Monthly';
      }
    }
    var definitions = [
      { id: 'SRC_SALES_MONTHLY', moduleId: 'SALES', name: mainSalesName },
      { id: 'SRC_SALES_PREVIOUS', moduleId: 'SALES_HISTORY', name: config.sheets.previousSales, required: false },
      { id: 'SRC_DEALER_LIFTING', moduleId: 'LIFTING', name: config.sheets.lifting, required: false },
      { id: 'SRC_MONTHLY_PROJECTION', moduleId: 'COLLECTION_PROJECTION', name: config.sheets.transactions, required: false },
      { id: 'SRC_HIERARCHY', moduleId: 'HIERARCHY', name: config.sheets.hierarchySource, required: false },
      { id: 'SRC_ATTENDANCE', moduleId: 'ATTENDANCE', name: config.sheets.attendance, required: false }
    ];
    var output = {};
    definitions.forEach(function (def) {
      var started = Date.now();
      var sheet = spreadsheet.getSheetByName(def.name);
      if (!sheet) {
        diagnostics.issue(def.required === false ? 'WARN' : 'ERROR', 'SOURCE_SHEET_MISSING', (def.required === false ? 'Optional' : 'Required') + ' source sheet not found: ' + def.name, def);
        output[def.id] = { definition: def, values: [] };
        return;
      }
      // One rectangular read per source. All downstream stages operate in memory.
      var values = sheet.getDataRange().getValues();
      diagnostics.source(def.id).rowsRead = values.length;
      diagnostics.source(def.id).executionMs = Date.now() - started;
      output[def.id] = { definition: def, values: values };
    });
    return output;
  }
  return { readAll: readAll };
}());
