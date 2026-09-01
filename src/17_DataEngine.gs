SIP.DataEngine = (function () {
  function run(options) {
    options = options || {};
    var config = SIP.Config.get(options.config), diagnostics = new SIP.Diagnostics();
    var context = {
      config: config,
      diagnostics: diagnostics,
      persistSalesActivityRecords: false,
      startedAt: Date.now(),
      ingestedAt: SIP.Utils.nowIso(),
      batchId: options.batchId || SIP.Utils.uniqueId('BATCH', [SIP.Utils.nowIso(), SIP.VERSION])
    };
    SIP.RefreshTrace.begin(context.batchId);
    var lock = getLock();
    if (!acquireLock(lock, options.lockTimeoutMs || 20000)) {
      if (options.forceRefresh) {
        lock = null; // Proceed with forced refresh under contention
      } else {
        throw new Error('A data-engine refresh is currently in progress. Please wait a few seconds and try again.');
      }
    }
    try {
      var spreadsheet = options.spreadsheet || openSpreadsheet(config);
      var sources = SIP.SourceReader.readAll(spreadsheet, config, diagnostics);
      SIP.RefreshTrace.mark('SOURCES_READ');
      var parsed = SIP.ParserEngine.parseAll(sources, context);
      SIP.RefreshTrace.mark('SOURCES_PARSED');
      var hierarchyProvider=SIP.HierarchyProvider.apply(parsed,diagnostics,context);
      SIP.RefreshTrace.mark('HIERARCHY_APPLIED',hierarchyProvider);
      var relationships = SIP.RelationshipEngine.build(parsed, diagnostics);
      SIP.RefreshTrace.mark('RELATIONSHIPS_BUILT',{hierarchy:relationships.hierarchy.length,relationships:relationships.relationships.length});
      var validation = SIP.ValidationEngine.validate(parsed, context);
      SIP.RefreshTrace.mark('VALIDATED',{records:validation.records.length});
      var calendarSettings=SIP.BusinessCalendar.loadSettings(spreadsheet,config);
      var calendar = SIP.BusinessCalendar.build(parsed,context,calendarSettings);
      SIP.RefreshTrace.mark('CALENDAR_BUILT');
      var attendance=SIP.HrAttendance.build(parsed,context)||SIP.SalesActivityAttendance.resolve(validation,relationships,calendar,context,options.attendanceProvider);
      SIP.RefreshTrace.mark('ATTENDANCE_BUILT',{type:attendance.attendanceType||attendance.type,observations:attendance.observationCount||0});
      if(attendance.records.length)validation.records=validation.records.concat(attendance.records);
      var master = SIP.MasterDatasetBuilder.build(validation, relationships, parsed, context,calendar);
      SIP.RefreshTrace.mark('MASTER_BUILT',{records:master.records.length});
      master.currentPeriodStart=context.selectedSalesPeriod&&context.selectedSalesPeriod.periodStart||'';
      master.hierarchyProvider=hierarchyProvider;
      master.attendance={status:'ACTIVE',type:attendance.attendanceType||attendance.type,statusSource:attendance.statusSource,providerContract:attendance.providerContract,hrAttendance:!!attendance.hrAttendance,periodStart:attendance.periodStart||master.currentPeriodStart,periodEnd:attendance.periodEnd||'',employeeCount:attendance.employeeCount,workingDays:attendance.workingDays,present:attendance.present,absent:attendance.absent,attendancePct:attendance.attendancePct,observationCount:attendance.observationCount||0,entities:attendance.entities||{}};
      master.reconciliation=SIP.ReconciliationEngine.calculate(parsed,config,diagnostics);
      SIP.RefreshTrace.mark('RECONCILED');
      var persistence=SIP.PersistenceEngine.persist(spreadsheet,master,config);
      SIP.RefreshTrace.mark('PERSISTED');
      master.persistence=persistence;
      master.certification=SIP.CertificationEngine.assess(master,diagnostics,persistence);
      SIP.RefreshTrace.mark('CERTIFIED',{certified:master.certification.certified});
      var cacheResult = options.skipCache||!master.certification.certified ? { cached: false, reason: options.skipCache?'SKIPPED':'NOT_CERTIFIED' } : SIP.CacheEngine.put(master, config, diagnostics);
      SIP.RefreshTrace.mark('MASTER_CACHE_FINISHED',{cached:cacheResult.cached,chunks:cacheResult.chunks||0});
      var finalDiagnostics = diagnostics.finish();
      master.diagnostics = finalDiagnostics;
      if (options.writeDiagnostics !== false) SIP.DiagnosticsWriter.write(spreadsheet, context, finalDiagnostics, cacheResult);
      SIP.RefreshTrace.mark('COMPLETE',{certified:master.certification.certified});
      return { master: master, diagnostics: finalDiagnostics, cache: cacheResult, persistence:persistence, certification:master.certification };
    } catch (error) {
      diagnostics.issue('ERROR', 'ENGINE_FATAL', error.message, { stack: error.stack || '' });
      SIP.RefreshTrace.mark('FAILED',{message:error.message});
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
  function acquireLock(lock, timeoutMs) {
    if (!lock) return true;
    if (typeof lock.hasLock === 'function' && lock.hasLock()) return true;
    if (lock.tryLock(timeoutMs || 20000)) return true;
    for (var retry = 0; retry < 5; retry++) {
      if (typeof Utilities !== 'undefined' && Utilities.sleep) Utilities.sleep(3000);
      try {
        if (lock.tryLock(10000)) return true;
      } catch (e) {}
    }
    return false;
  }
  return { run: run, get: get };
}());
