SIP.SourceReader = (function () {
  function readAll(spreadsheet, config, diagnostics) {
    var definitions = [
      { id: 'SRC_SALES_MONTHLY', moduleId: 'SALES', name: config.sheets.sales },
      { id: 'SRC_DEALER_LIFTING', moduleId: 'LIFTING', name: config.sheets.lifting },
      { id: 'SRC_MONTHLY_PROJECTION', moduleId: 'COLLECTION_PROJECTION', name: config.sheets.transactions }
    ];
    var output = {};
    definitions.forEach(function (def) {
      var started = Date.now();
      var sheet = spreadsheet.getSheetByName(def.name);
      if (!sheet) {
        diagnostics.issue('ERROR', 'SOURCE_SHEET_MISSING', 'Required source sheet not found: ' + def.name, def);
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
