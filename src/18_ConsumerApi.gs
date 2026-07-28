/** Build the Master Dataset, refresh cache, and write diagnostics. */
function runEnterpriseDataEngine() {
  return SIP.DataEngine.run({ writeDiagnostics: true });
}

/** Read cached Master Dataset; rebuild on cache miss. */
function getMasterDataset(options) {
  return SIP.DataEngine.get(options || {}).master;
}

/** Force a full rebuild after source refresh or contract change. */
function refreshMasterDataset() {
  return SIP.DataEngine.get({ forceRefresh: true, writeDiagnostics: true });
}

/** Invalidate cache without changing source or diagnostic data. */
function invalidateMasterDatasetCache() {
  var config = SIP.Config.get();
  SIP.CacheEngine.remove(config);
  return { invalidated: true, at: SIP.Utils.nowIso() };
}

/** Lightweight status endpoint for future consumers. */
function getDataEngineStatus() {
  var result = SIP.DataEngine.get({ writeDiagnostics: false });
  return {
    platformVersion: result.master.platformVersion,
    schemaVersion: result.master.schemaVersion,
    batchId: result.master.batchId,
    generatedAt: result.master.generatedAt,
    recordCount: result.master.records.length,
    qualityFlags: result.master.qualityFlags.length,
    diagnostics: result.master.diagnostics || result.diagnostics,
    cache: result.cache
  };
}
