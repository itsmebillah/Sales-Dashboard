SIP.HierarchyProvider=(function(){
  var U=SIP.Utils;
  function apply(parsed,diagnostics,context){
    var source=find(parsed,'SRC_HIERARCHY'),assignments=source&&source.hierarchyAssignments||[];
    if(!assignments.length){diagnostics.issue('ERROR','HIERARCHY_SOURCE_EMPTY','Hierarchy tab has no usable active assignments',{});return{provider:'Hierarchy tab',assignments:0,recordsEnriched:0};}
    var resolution=resolveActive(assignments,parsed,diagnostics,context);assignments=resolution.assignments;source.hierarchyAssignments=assignments;
    var hierarchyEmployees=source.dimensions.employees||{},aliasByName={},bySr={},bySrDealer={},byTso={},byRsm={},territoryByDealer={};
    Object.keys(hierarchyEmployees).forEach(function(id){var e=hierarchyEmployees[id],key=(e.role||'')+'|'+e.normalizedName;if(e.normalizedName)aliasByName[key]=aliasByName[key]===undefined?id:(aliasByName[key]===id?id:null);});
    parsed.forEach(function(result){
      var employees=result.dimensions&&result.dimensions.employees||{};
      (result.records||[]).forEach(function(record){['asm_id','rsm_id','tso_id','sr_id','employee_id'].forEach(function(field){var entity=employees[record[field]];if(!entity)return;var canonical=aliasByName[(entity.role||'')+'|'+entity.normalizedName];if(canonical)record[field]=canonical;});if(record.dealer_id&&record.territory_id&&samePeriod(record,context))territoryByDealer[record.dealer_id]=record.territory_id;});
    });
    var conflicts=0;assignments.forEach(function(a){
      if(!a.territoryId&&territoryByDealer[a.dealerId])a.territoryId=territoryByDealer[a.dealerId];
      if(bySr[a.srId]&&!samePath(bySr[a.srId],a)){conflicts++;diagnostics.issue('ERROR','HIERARCHY_SOURCE_CONFLICT','Hierarchy tab assigns one SR to multiple active manager paths',{srId:a.srId,sourceRows:[bySr[a.srId].sourceRow,a.sourceRow]});}else bySr[a.srId]=bySr[a.srId]||a;
      if(a.dealerId)bySrDealer[a.srId+'|'+a.dealerId]=a;
      if(byTso[a.tsoId]&&byTso[a.tsoId].rsmId!==a.rsmId){conflicts++;diagnostics.issue('ERROR','HIERARCHY_SOURCE_CONFLICT','Hierarchy tab assigns one TSO to multiple active RSMs',{tsoId:a.tsoId,sourceRows:[byTso[a.tsoId].sourceRow,a.sourceRow]});}else byTso[a.tsoId]=byTso[a.tsoId]||a;
      if(byRsm[a.rsmId]&&byRsm[a.rsmId].asmId!==a.asmId){conflicts++;diagnostics.issue('ERROR','HIERARCHY_SOURCE_CONFLICT','Hierarchy tab assigns one RSM to multiple active ASMs',{rsmId:a.rsmId,sourceRows:[byRsm[a.rsmId].sourceRow,a.sourceRow]});}else byRsm[a.rsmId]=byRsm[a.rsmId]||a;
    });
    var enriched=0;
    parsed.forEach(function(result){(result.records||[]).forEach(function(record){
      var a=bySrDealer[record.sr_id+'|'+record.dealer_id]||bySr[record.sr_id]||byTso[record.tso_id]||byRsm[record.rsm_id];if(!a)return;
      var before=[record.asm_id,record.rsm_id,record.tso_id,record.sr_id,record.territory_id,record.area_id].join('|');
      if(record.sr_id){record.asm_id=a.asmId;record.rsm_id=a.rsmId;record.tso_id=a.tsoId;record.sr_id=a.srId;if(record.employee_id)record.employee_id=a.srId;}
      else if(record.tso_id){record.asm_id=a.asmId;record.rsm_id=a.rsmId;record.tso_id=a.tsoId;}
      else if(record.rsm_id){record.asm_id=a.asmId;record.rsm_id=a.rsmId;}
      if(!record.territory_id)record.territory_id=a.territoryId||territoryByDealer[record.dealer_id]||'';if(!record.area_id)record.area_id=a.areaId||'';
      if(before!==[record.asm_id,record.rsm_id,record.tso_id,record.sr_id,record.territory_id,record.area_id].join('|'))enriched++;
    });});
    diagnostics.counters.hierarchyProviderAssignments=assignments.length;diagnostics.counters.hierarchyRecordsEnriched=enriched;
    return{provider:'Hierarchy tab',assignments:assignments.length,recordsEnriched:enriched,conflicts:conflicts,staleAssignmentsExcluded:resolution.excluded,growthRateUsed:false};
  }
  function find(parsed,id){for(var i=0;i<parsed.length;i++)if(parsed[i].sourceId===id)return parsed[i];return null;}
  function resolveActive(assignments,parsed,diagnostics,context){
    var groups={},sales={},attendance={},excluded=0,out=[];
    assignments.forEach(function(a){groups[a.srId]=groups[a.srId]||[];groups[a.srId].push(a);});
    var salesSource=find(parsed,'SRC_SALES_MONTHLY');(salesSource&&salesSource.records||[]).forEach(function(r){if(samePeriod(r,context)&&r.sr_id&&r.dealer_id)sales[r.sr_id+'|'+r.dealer_id]=true;});
    var attendanceSource=find(parsed,'SRC_ATTENDANCE');(attendanceSource&&attendanceSource.attendanceObservations||[]).forEach(function(o){attendance[o.srId]=attendance[o.srId]||{};attendance[o.srId][o.rsmId+'|'+o.tsoId]=true;});
    Object.keys(groups).forEach(function(srId){var rows=groups[srId],paths={};rows.forEach(function(a){paths[path(a)]=true;});if(Object.keys(paths).length<=1){out=out.concat(rows);return;}
      var evidence={};rows.forEach(function(a){if(sales[srId+'|'+a.dealerId])evidence[path(a)]=true;});
      if(!Object.keys(evidence).length)rows.forEach(function(a){if(attendance[srId]&&attendance[srId][a.rsmId+'|'+a.tsoId])evidence[path(a)]=true;});
      var selected=Object.keys(evidence);if(selected.length!==1){diagnostics.issue('ERROR','HIERARCHY_SOURCE_CONFLICT','Hierarchy tab has multiple manager paths and selected-period evidence does not identify exactly one',{srId:srId,paths:Object.keys(paths),evidence:selected});out=out.concat(rows);return;}
      rows.forEach(function(a){if(path(a)===selected[0])out.push(a);else excluded++;});
    });
    if(excluded)diagnostics.issue('WARN','HIERARCHY_STALE_ASSIGNMENTS_EXCLUDED','Stale hierarchy rows were excluded using selected-month Sales/Attendance evidence',{count:excluded,periodStart:context.selectedSalesPeriod&&context.selectedSalesPeriod.periodStart||''});
    return{assignments:out,excluded:excluded};
  }
  function path(a){return[a.asmId,a.rsmId,a.tsoId].join('|');}
  function samePeriod(r,context){var p=context.selectedSalesPeriod&&context.selectedSalesPeriod.periodStart;return!p||!r.period_start||r.period_start===p;}
  function samePath(a,b){return a.asmId===b.asmId&&a.rsmId===b.rsmId&&a.tsoId===b.tsoId;}
  return{apply:apply};
}());
