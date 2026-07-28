SIP.DataEngine = (function () {
  function run(options) {
    options = options || {};
    var config = SIP.Config.get(options.config), diagnostics = new SIP.Diagnostics();
    var context = {
      config: config,
      diagnostics: diagnostics,
      startedAt: Date.now(),
      ingestedAt: SIP.Utils.nowIso(),
      batchId: options.batchId || SIP.Utils.uniqueId('BATCH', [SIP.Utils.nowIso(), SIP.VERSION])
    };
    var lock = getLock();
    if (lock && !lock.tryLock(options.lockTimeoutMs || 5000)) throw new Error('Another data-engine build is already running');
    try {
      var spreadsheet = options.spreadsheet || openSpreadsheet(config);
      var sources = SIP.SourceReader.readAll(spreadsheet, config, diagnostics);
      var parsed = SIP.ParserEngine.parseAll(sources, context);
      var validation = SIP.ValidationEngine.validate(parsed, context);
      var relationships = SIP.RelationshipEngine.build(parsed, diagnostics);
      var master = SIP.MasterDatasetBuilder.build(validation, relationships, parsed, context);
      var cacheResult = options.skipCache ? { cached: false, reason: 'SKIPPED' } : SIP.CacheEngine.put(master, config, diagnostics);
      var finalDiagnostics = diagnostics.finish();
      master.diagnostics = finalDiagnostics;
      if (options.writeDiagnostics !== false) SIP.DiagnosticsWriter.write(spreadsheet, context, finalDiagnostics, cacheResult);
      return { master: master, diagnostics: finalDiagnostics, cache: cacheResult };
    } catch (error) {
      diagnostics.issue('ERROR', 'ENGINE_FATAL', error.message, { stack: error.stack || '' });
      throw error;
    } finally { if (lock) lock.releaseLock(); }
  }

  function get(options) {
    options = options || {}; var config = SIP.Config.get(options.config), diagnostics = new SIP.Diagnostics();
    if (!options.forceRefresh) {
      var cached = SIP.CacheEngine.get(config, diagnostics);
      if (cached) return { master: cached, diagnostics: diagnostics.finish(), cache: { hit: true } };
    }
    return run(options);
  }

  function openSpreadsheet(config) {
    if (config.spreadsheetId) return SpreadsheetApp.openById(config.spreadsheetId);
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (!active) throw new Error('No active spreadsheet and no spreadsheetId configured');
    return active;
  }
  function getLock() { return typeof LockService !== 'undefined' ? LockService.getScriptLock() : null; }
  return { run: run, get: get };
}());
