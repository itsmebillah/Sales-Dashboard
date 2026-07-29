SIP.RelationshipEngine = (function () {
  var U = SIP.Utils;

  function build(parsed, diagnostics) {
    var reconciliation=reconcileHierarchy(parsed,diagnostics);
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
    return { dimensions: dimensions, dealerCrosswalk: dealerCrosswalk, hierarchy: values(hierarchy), relationships: values(relationships), reconciliation:reconciliation };
  }

  function reconcileHierarchy(parsed,diagnostics){
    var identity=canonicalizeEmployeeAliases(parsed),votes={},changes=0;
    parsed.forEach(function(result){(result.records||[]).forEach(function(r){
      if(['SALES_AMOUNT','LIFTING_AMOUNT','COLLECTION_AMOUNT','PROJECTION_AMOUNT'].indexOf(r.metric_id)<0)return;
      vote(votes,'SR_TO_TSO',r.sr_id,r.tso_id,result.sourceId,r.source_record_id);
      vote(votes,'TSO_TO_RSM',r.tso_id,r.rsm_id,result.sourceId,r.source_record_id);
      vote(votes,'RSM_TO_ASM',r.rsm_id,r.asm_id,result.sourceId,r.source_record_id);
    });});
    var winners={};Object.keys(votes).forEach(function(key){winners[key]=winner(votes[key]);});
    parsed.forEach(function(result){(result.records||[]).forEach(function(r){
      [['SR_TO_TSO','sr_id','tso_id'],['TSO_TO_RSM','tso_id','rsm_id'],['RSM_TO_ASM','rsm_id','asm_id']].forEach(function(x){var key=x[0]+'|'+r[x[1]];if(r[x[1]]&&winners[key]&&r[x[2]]!==winners[key]){r[x[2]]=winners[key];changes++;}});
    });});
    var conflicts=Object.keys(votes).filter(function(k){return Object.keys(votes[k]).length>1;}).length,orphans={};
    parsed.forEach(function(result){
      (result.records||[]).forEach(function(r){if(r.metric_id!=='SALES_AMOUNT')return;if(r.sr_id&&!r.tso_id)orphans['SR|'+r.sr_id]=true;if(r.tso_id&&!r.rsm_id)orphans['TSO|'+r.tso_id]=true;});
    });
    var orphanCount=Object.keys(orphans).length;
    if(orphanCount)diagnostics.issue('ERROR','HIERARCHY_ORPHAN','Sales hierarchy contains orphan entities',{count:orphanCount,sample:Object.keys(orphans).slice(0,20)});
    if(identity.aliases)diagnostics.issue('WARN','EMPLOYEE_ALIAS_RECONCILED','Name-key employee aliases were safely mapped to their single numeric identity',{aliases:identity.aliases});
    if(conflicts)diagnostics.issue('WARN','HIERARCHY_RECONCILED','Conflicting source hierarchy assignments were reconciled deterministically',{conflicts:conflicts,recordsCorrected:changes,policy:'SALES_SOURCE_THEN_MAJORITY'});
    return{conflictsFound:conflicts,conflictsRemaining:0,orphanRecords:orphanCount,duplicateIdentities:0,homonymGroups:identity.homonyms,employeeAliasesResolved:identity.aliases,recordsCorrected:changes,policy:'SAFE_ID_ALIAS_THEN_SALES_SOURCE_THEN_MAJORITY',entities:Object.keys(winners).length};
  }
  function canonicalizeEmployeeAliases(parsed){
    var groups={},aliases={},homonyms=0;
    parsed.forEach(function(result){Object.keys(result.dimensions&&result.dimensions.employees||{}).forEach(function(id){var e=result.dimensions.employees[id];if(!e.normalizedName)return;var key=(e.role||'')+'|'+e.normalizedName;groups[key]=groups[key]||{};groups[key][id]=true;});});
    Object.keys(groups).forEach(function(key){var ids=Object.keys(groups[key]),strong=ids.filter(function(id){return id.indexOf('EMPLOYEE:')===0;});if(strong.length===1)ids.filter(function(id){return id.indexOf('EMPLOYEE_NAME:')===0;}).forEach(function(id){aliases[id]=strong[0];});else if(strong.length>1)homonyms++;});
    parsed.forEach(function(result){
      (result.records||[]).forEach(function(r){['asm_id','rsm_id','tso_id','sr_id','employee_id'].forEach(function(field){if(aliases[r[field]])r[field]=aliases[r[field]];});});
      var employees=result.dimensions&&result.dimensions.employees||{};Object.keys(aliases).forEach(function(old){if(employees[old]){employees[aliases[old]]=employees[aliases[old]]||employees[old];delete employees[old];}});
    });
    return{aliases:Object.keys(aliases).length,homonyms:homonyms};
  }
  function vote(out,type,child,parent,source,record){if(!child||!parent)return;var key=type+'|'+child;out[key]=out[key]||{};out[key][parent]=out[key][parent]||{count:0,sales:0,records:{}};if(out[key][parent].records[record])return;out[key][parent].records[record]=true;out[key][parent].count++;if(source==='SRC_SALES_MONTHLY')out[key][parent].sales++;}
  function winner(candidates){return Object.keys(candidates).sort(function(a,b){return candidates[b].sales-candidates[a].sales||candidates[b].count-candidates[a].count||a.localeCompare(b);})[0];}

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
      if (d.code) { map[id] = id; return; }
      var coded = candidates.filter(function (x) { return dealers[x].code; });
      var numeric=coded.filter(function(x){return /^DEALER:\d+$/.test(x);});
      if (numeric.length === 1) map[id] = numeric[0];
      else if (coded.length === 1) map[id] = coded[0];
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
