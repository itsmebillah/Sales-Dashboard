SIP.RelationshipEngine = (function () {
  var U = SIP.Utils;

  function build(parsed, diagnostics) {
    var dimensions = { employees: {}, dealers: {}, products: {}, depots: {}, banks: {} };
    parsed.forEach(function (result) {
      Object.keys(result.dimensions || {}).forEach(function (kind) {
        dimensions[kind] = dimensions[kind] || {};
        Object.keys(result.dimensions[kind]).forEach(function (id) {
          if (!dimensions[kind][id]) dimensions[kind][id] = result.dimensions[kind][id];
          else dimensions[kind][id] = preferStrongKey(dimensions[kind][id], result.dimensions[kind][id]);
        });
      });
    });
    var dealerCrosswalk = buildDealerCrosswalk(dimensions.dealers, diagnostics);
    var relationships = {}, hierarchy = {};
    parsed.forEach(function (result) {
      (result.records || []).forEach(function (r) {
        if (r.dealer_id && dealerCrosswalk[r.dealer_id]) r.dealer_id = dealerCrosswalk[r.dealer_id];
        addHierarchy(hierarchy, 'SR_TO_TSO', r.sr_id, r.tso_id, r);
        addHierarchy(hierarchy, 'TSO_TO_RSM', r.tso_id, r.rsm_id, r);
        addHierarchy(hierarchy, 'RSM_TO_ASM', r.rsm_id, r.asm_id, r);
        addRelationship(relationships, 'EMPLOYEE_SERVES_DEALER', r.employee_id || r.sr_id || r.tso_id, r.dealer_id, r);
        addRelationship(relationships, 'DEALER_SUPPLIED_BY_DEPOT', r.dealer_id, r.depot_id, r);
        addRelationship(relationships, 'OBSERVATION_FOR_PRODUCT', r.record_id, r.product_id, r);
      });
    });
    return { dimensions: dimensions, dealerCrosswalk: dealerCrosswalk, hierarchy: values(hierarchy), relationships: values(relationships) };
  }

  function buildDealerCrosswalk(dealers, diagnostics) {
    var byCode = {}, byName = {}, map = {};
    Object.keys(dealers).forEach(function (id) {
      var d = dealers[id];
      if (d.code) byCode[d.code] = byCode[d.code] || [];
      if (d.code) byCode[d.code].push(id);
      if (d.normalizedName) byName[d.normalizedName] = byName[d.normalizedName] || [];
      if (d.normalizedName) byName[d.normalizedName].push(id);
    });
    Object.keys(dealers).forEach(function (id) {
      var d = dealers[id], candidates = d.code ? byCode[d.code] : byName[d.normalizedName] || [];
      var coded = candidates.filter(function (x) { return dealers[x].code; });
      if (coded.length === 1) map[id] = coded[0];
      else if (candidates.length === 1) map[id] = candidates[0];
      else {
        map[id] = id;
        if (candidates.length > 1) diagnostics.issue('WARN', 'AMBIGUOUS_DEALER_MATCH', 'Dealer has multiple canonical candidates', { dealerId: id, candidates: candidates.slice(0, 10) });
      }
    });
    return map;
  }

  function preferStrongKey(a, b) { return (a.keyQuality === 'CODE' || a.keyQuality === 'ID') ? a : ((b.keyQuality === 'CODE' || b.keyQuality === 'ID') ? b : a); }
  function addHierarchy(out, type, child, parent, r) {
    if (!child || !parent) return; var id = U.uniqueId('HIER', [type, child, parent, r.period_start || r.event_date]);
    out[id] = { hierarchyId: id, type: type, childId: child, parentId: parent, effectiveFrom: r.period_start || r.event_date, effectiveTo: r.period_end || '', version: r.relationship_version };
  }
  function addRelationship(out, type, subject, object, r) {
    if (!subject || !object) return; var id = U.uniqueId('REL', [type, subject, object, r.period_start || r.event_date]);
    out[id] = { relationshipId: id, type: type, subjectId: subject, objectId: object, effectiveFrom: r.period_start || r.event_date, effectiveTo: r.period_end || '', sourceRecordId: r.source_record_id };
  }
  function values(obj) { return Object.keys(obj).map(function (k) { return obj[k]; }); }
  return { build: build };
}());
