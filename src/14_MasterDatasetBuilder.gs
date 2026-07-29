SIP.MasterDatasetBuilder = (function () {
  function build(validation, relationships, parsed, context, calendar) {
    var records = validation.records;
    var byMetric = {}, byEntity = {}, qualityFlags = [];
    records.forEach(function (r) {
      byMetric[r.metric_id] = byMetric[r.metric_id] || [];
      byMetric[r.metric_id].push(r.record_id);
      entityIds(r).forEach(function (id) { byEntity[id] = byEntity[id] || []; byEntity[id].push(r.record_id); });
      if (r.quality_status !== 'VALID' && r.quality_status !== 'CERTIFIED') qualityFlags.push({ recordId: r.record_id, status: r.quality_status });
    });
    var matchStats = computeDealerCoverage(records);
    context.diagnostics.counters.masterRecords = records.length;
    context.diagnostics.counters.dealerMatchedByCode = matchStats.code;
    context.diagnostics.counters.dealerMatchedByName = matchStats.name;
    context.diagnostics.counters.dealerMissing = matchStats.missing;
    return {
      schemaVersion: SIP.SCHEMA_VERSION,
      platformVersion: SIP.VERSION,
      batchId: context.batchId,
      generatedAt: context.ingestedAt,
      records: records,
      dimensions: relationships.dimensions,
      hierarchy: relationships.hierarchy,
      relationships: relationships.relationships,
      calendar: calendar,
      indexes: { byMetric: byMetric, byEntity: byEntity },
      forecast: { status: 'PLACEHOLDER', versions: [] },
      attendance: { status: 'NOT_IMPLEMENTED', compatibleSchemaVersion: SIP.SCHEMA_VERSION },
      qualityFlags: qualityFlags,
      metadata: { parserMetadata: parsed.map(function (p) { return { sourceId: p.sourceId, metadata: p.metadata }; }), dealerCoverage: matchStats, hierarchyReconciliation:relationships.reconciliation||{} }
    };
  }

  function entityIds(r) { return ['company_id','asm_id','rsm_id','tso_id','sr_id','employee_id','territory_id','area_id','dealer_id','depot_id','product_id'].map(function (k) { return r[k]; }).filter(Boolean); }
  function computeDealerCoverage(records) {
    var result = { code: 0, name: 0, missing: 0 };
    records.forEach(function (r) {
      if (!r.dealer_id) result.missing++;
      else if (r.dealer_id.indexOf('DEALER:') === 0) result.code++;
      else result.name++;
    });
    return result;
  }
  return { build: build };
}());
