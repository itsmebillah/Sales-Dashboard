SIP.Diagnostics = function () {
  this.startedAt = Date.now();
  this.sources = {};
  this.issues = [];
  this.counters = {};
};

SIP.Diagnostics.prototype.source = function (id) {
  if (!this.sources[id]) this.sources[id] = { rowsRead: 0, rowsLoaded: 0, rowsIgnored: 0, recordsEmitted: 0, headerRow: null, executionMs: 0 };
  return this.sources[id];
};

SIP.Diagnostics.prototype.increment = function (key, amount) {
  this.counters[key] = (this.counters[key] || 0) + (amount === undefined ? 1 : amount);
};

SIP.Diagnostics.prototype.issue = function (severity, code, message, context) {
  this.issues.push({ severity: severity, code: code, message: message, context: context || {}, at: SIP.Utils.nowIso() });
};

SIP.Diagnostics.prototype.finish = function () {
  return {
    status: this.issues.some(function (x) { return x.severity === 'ERROR'; }) ? 'FAILED' :
      (this.issues.some(function (x) { return x.severity === 'WARN'; }) ? 'COMPLETED_WITH_WARNINGS' : 'COMPLETED'),
    executionMs: Date.now() - this.startedAt,
    sources: this.sources,
    counters: this.counters,
    issues: this.issues
  };
};
