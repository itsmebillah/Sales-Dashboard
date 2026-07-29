SIP.KpiAccumulator = (function () {
  var D = SIP.KpiDefinitions;

  function aggregate(master) {
    var entities = {}, accepted = 0, excluded = 0;
    (master.records || []).forEach(function (record) {
      if (record.quality_status !== 'VALID' && record.quality_status !== 'CERTIFIED') { excluded++; return; }
      accepted++;
      entityRefs(record).forEach(function (ref) { apply(ensure(entities, ref), record); });
    });
    return { entities: entities, acceptedRecords: accepted, excludedRecords: excluded };
  }

  function entityRefs(r) {
    var refs = [{ type: 'COMPANY', id: r.company_id || 'COMPANY:DEFAULT' }];
    [['RSM',r.rsm_id],['TSO',r.tso_id],['SR',r.sr_id || (r.module_id === 'SALES' ? r.employee_id : '')],
      ['DEALER',r.dealer_id],['PRODUCT',r.product_id],['CATEGORY',r.product_group_id]].forEach(function (x) { if (x[1]) refs.push({ type:x[0], id:x[1] }); });
    var seen = {}; return refs.filter(function (x) { var k=x.type+'|'+x.id; if(seen[k])return false; seen[k]=true; return true; });
  }

  function ensure(entities, ref) {
    var key = ref.type + '|' + ref.id;
    if (!entities[key]) entities[key] = {
      entityType: ref.type, entityId: ref.id, sums: {}, maxima: {}, latest: {}, periods: {}, daily: {},
      sets: { dealers:{}, srs:{}, tsos:{}, rsms:{}, products:{}, collectingDealers:{}, projectingDealers:{} }, recordCount: 0
    };
    return entities[key];
  }

  function apply(state, r) {
    state.recordCount++;
    if(r.metric_id==='SALES_AMOUNT'||r.source_dataset==='Sales Data Base Monthly'){addSet(state.sets.dealers,r.dealer_id);addSet(state.sets.srs,r.sr_id);addSet(state.sets.tsos,r.tso_id);addSet(state.sets.rsms,r.rsm_id);}
    if(r.metric_id==='PRODUCT_QUANTITY')addSet(state.sets.products,r.product_id);
    if (r.metric_id === 'COLLECTION_AMOUNT') addSet(state.sets.collectingDealers, r.dealer_id);
    if (r.metric_id === 'PROJECTION_AMOUNT') addSet(state.sets.projectingDealers, r.dealer_id);
    var value = numeric(r); if (value === null) return;
    var def = D.get(r.metric_id);
    if (def.aggregation === 'MAX') state.maxima[r.metric_id] = Math.max(state.maxima[r.metric_id] || 0, value);
    else if (def.aggregation === 'SUM_BY_PERIOD') {
      var period = r.period_start || r.event_date || 'UNKNOWN';
      state.periods[r.metric_id] = state.periods[r.metric_id] || {};
      state.periods[r.metric_id][period] = (state.periods[r.metric_id][period] || 0) + value;
    } else if (def.aggregation === 'SUM_LATEST_ENTITY') {
      var entity = r.dealer_id || r.product_id || r.employee_id || r.record_id;
      var current = state.latest[r.metric_id + '|' + entity];
      var timestamp = r.as_of_at || r.observed_at || r.event_date || r.ingested_at || '';
      if (!current || timestamp >= current.timestamp) state.latest[r.metric_id + '|' + entity] = { timestamp:timestamp, value:value };
    } else state.sums[r.metric_id] = (state.sums[r.metric_id] || 0) + value;
    if (r.event_date && ['SALES_AMOUNT','HISTORICAL_DAILY_SALES_AMOUNT','LIFTING_AMOUNT','COLLECTION_AMOUNT','PROJECTION_AMOUNT'].indexOf(r.metric_id) >= 0) {
      state.daily[r.metric_id] = state.daily[r.metric_id] || {};
      state.daily[r.metric_id][r.event_date] = (state.daily[r.metric_id][r.event_date] || 0) + value;
    }
  }

  function numeric(r) {
    var value = r.numeric_value;
    if (value === null || value === undefined) value = r.amount;
    if (value === null || value === undefined) value = r.quantity;
    return typeof value === 'number' && isFinite(value) ? value : null;
  }
  function addSet(set, value) { if (value) set[value] = true; }
  function latestSum(state, metricId) { return Object.keys(state.latest).filter(function(k){return k.indexOf(metricId+'|')===0;}).reduce(function(a,k){return a+state.latest[k].value;},0); }
  function count(set) { return Object.keys(set || {}).length; }
  return { aggregate: aggregate, latestSum: latestSum, count: count };
}());
