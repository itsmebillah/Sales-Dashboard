SIP.ValidationEngine = (function () {
  var U = SIP.Utils;

  function validate(parsed, context) {
    var records = [], seenRecords = {}, entitySources = {}, invalid = 0;
    parsed.forEach(function (result) {
      Object.keys(result.dimensions || {}).forEach(function (kind) {
        Object.keys(result.dimensions[kind] || {}).forEach(function (id) {
          entitySources[id] = entitySources[id] || [];
          entitySources[id].push(result.sourceId);
        });
      });
      (result.records || []).forEach(function (record) {
        var issues = validateRecord(record);
        if (seenRecords[record.record_id]) issues.push(['ERROR', 'DUPLICATE_MASTER_RECORD', 'Duplicate canonical record ID']);
        seenRecords[record.record_id] = true;
        issues.forEach(function (x) { context.diagnostics.issue(x[0], x[1], x[2], { recordId: record.record_id, sourceRecordId: record.source_record_id }); });
        if (issues.some(function (x) { return x[0] === 'ERROR'; })) { record.quality_status = 'QUARANTINED'; invalid++; }
        records.push(record);
      });
    });
    validateHierarchy(parsed, context);
    context.diagnostics.counters.recordsValidated = records.length;
    context.diagnostics.counters.recordsQuarantined = invalid;
    return { records: records, entitySources: entitySources };
  }

  function validateRecord(r) {
    var issues = [];
    ['record_id','source_dataset','source_record_id','contract_id','module_id','record_type','metric_id'].forEach(function (key) {
      if (!U.text(r[key])) issues.push(['ERROR', 'REQUIRED_FIELD_MISSING', 'Required field missing: ' + key]);
    });
    if ((r.record_type === 'EVENT' || /DAILY|SALES_AMOUNT|COLLECTION|PROJECTION/.test(r.metric_id)) && !r.event_date) {
      issues.push(['ERROR', 'EVENT_DATE_MISSING', 'Dated metric/event has no event_date']);
    }
    if (r.numeric_value !== null && r.numeric_value !== undefined && (typeof r.numeric_value !== 'number' || !isFinite(r.numeric_value))) {
      issues.push(['ERROR', 'INVALID_NUMERIC_VALUE', 'numeric_value is not finite']);
    }
    if (/SALES|LIFTING|COLLECTION|PROJECTION|QUANTITY/.test(r.metric_id) && r.numeric_value !== null && r.numeric_value < 0) {
      issues.push(['ERROR', 'NEGATIVE_BUSINESS_VALUE', 'Negative value is not allowed without an approved adjustment event']);
    }
    if (/PRODUCT_QUANTITY/.test(r.metric_id) && !r.product_id) issues.push(['ERROR', 'PRODUCT_KEY_MISSING', 'Product quantity has no product_id']);
    if (/COLLECTION|PROJECTION/.test(r.metric_id) && !r.dealer_id) issues.push(['ERROR', 'DEALER_KEY_MISSING', 'Transaction has no dealer_id']);
    return issues;
  }

  function validateHierarchy(parsed, context) {
    var parentByChild = {};
    parsed.forEach(function (result) {
      (result.records || []).forEach(function (r) {
        if (r.metric_id !== 'SALES_AMOUNT' && r.metric_id !== 'COLLECTION_AMOUNT' && r.metric_id !== 'PROJECTION_AMOUNT' && r.metric_id !== 'LIFTING_AMOUNT') return;
        [['sr_id','tso_id'],['tso_id','rsm_id'],['rsm_id','asm_id']].forEach(function (pair) {
          var child = r[pair[0]], parent = r[pair[1]]; if (!child || !parent) return;
          var key = pair[0] + ':' + child;
          if (parentByChild[key] && parentByChild[key] !== parent) context.diagnostics.issue('ERROR', 'AMBIGUOUS_HIERARCHY', 'Entity has multiple parents in the same effective period', { child: child, parents: [parentByChild[key], parent], period:r.period_start||r.event_date });
          else parentByChild[key] = parent;
        });
      });
    });
  }

  return { validate: validate, validateRecord: validateRecord };
}());
