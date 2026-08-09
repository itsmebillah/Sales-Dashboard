SIP.HierarchyParser=(function(){
  var U=SIP.Utils,H=SIP.HeaderDetector,N=SIP.Normalizer,C=SIP.ParserCommon;
  function parse(source,context){
    var rows=source.values,id=source.definition.id,diag=context.diagnostics;
    var header=H.detect(rows,{maxRows:context.config.parser.maxHeaderScanRows,minimumScore:5,requiredGroups:[['ASM_ID'],['RSM_ID'],['TSO_ID'],['SR_ID'],['DEALER_ID']]},diag,id);
    if(!header)return empty(id);
    var period=context.selectedSalesPeriod||{},assignments=[],dimensions={employees:{},dealers:{},territories:{},areas:{}},seen={};
    for(var r=header.rowIndex+1;r<rows.length;r++){
      var row=rows[r],asm=N.employee(C.value(row,header.columns,['ASM_ID']),C.value(row,header.columns,['ASM_NAME']),'ASM');
      var rsm=N.employee(C.value(row,header.columns,['RSM_ID']),C.value(row,header.columns,['RSM_NAME']),'RSM');
      var tso=N.employee(C.value(row,header.columns,['TSO_ID']),C.value(row,header.columns,['TSO_NAME']),'TSO');
      var sr=N.employee(C.value(row,header.columns,['SR_ID']),C.value(row,header.columns,['SR_NAME']),'SR');
      var dealer=N.dealer(C.value(row,header.columns,['DEALER_NAME']),C.value(row,header.columns,['DEALER_ID']));
      if(!sr.id||!tso.id||!rsm.id){continue;}
      [asm,rsm,tso,sr].forEach(function(e){if(e.id)dimensions.employees[e.id]=e;});if(dealer.id)dimensions.dealers[dealer.id]=dealer;
      var territory=entity('TERRITORY',C.value(row,header.columns,['TERRITORY']));
      var area=entity('AREA',C.value(row,header.columns,['AREA']));
      if(territory.id)dimensions.territories[territory.id]=territory;if(area.id)dimensions.areas[area.id]=area;
      var status=U.canonicalText(C.value(row,header.columns,['STATUS']))||'ACTIVE';if(status!=='ACTIVE')continue;
      var assignment={sourceRow:r+1,asmId:asm.id,rsmId:rsm.id,tsoId:tso.id,srId:sr.id,dealerId:dealer.id,territoryId:territory.id,areaId:area.id,
        effectiveFrom:U.isoDate(C.value(row,header.columns,['EFFECTIVE_FROM']))||period.periodStart||'',effectiveTo:U.isoDate(C.value(row,header.columns,['EFFECTIVE_TO']))||period.periodEnd||'',status:'ACTIVE'};
      var key=[assignment.srId,assignment.dealerId,assignment.effectiveFrom].join('|');if(!seen[key]){seen[key]=true;assignments.push(assignment);}
    }
    diag.source(id).headerRow=header.rowIndex+1;diag.source(id).rowsLoaded=assignments.length;diag.source(id).rowsIgnored=Math.max(0,rows.length-header.rowIndex-1-assignments.length);
    if(H.find(header.columns,['EFFECTIVE_FROM'])<0||H.find(header.columns,['STATUS'])<0)diag.issue('WARN','HIERARCHY_METADATA_DERIVED','Hierarchy effective dates/status are derived from the selected Sales period',{sourceId:id,periodStart:period.periodStart||''});
    return{sourceId:id,records:[],dimensions:dimensions,hierarchyAssignments:assignments,metadata:{provider:'Hierarchy tab',period:period,assignmentCount:assignments.length,growthRateIgnored:true}};
  }
  function entity(type,value){var name=U.text(value),normalized=U.normalizeName(name);return{id:normalized?type+':'+U.hash(normalized).slice(0,16):'',name:name,normalizedName:normalized};}
  function empty(id){return{sourceId:id,records:[],dimensions:{employees:{},dealers:{},territories:{},areas:{}},hierarchyAssignments:[],metadata:{}};}
  return{parse:parse};
}());
