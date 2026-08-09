SIP.AttendanceParser=(function(){
  var U=SIP.Utils,H=SIP.HeaderDetector,C=SIP.ParserCommon,N=SIP.Normalizer;
  function parse(source,context){
    var rows=source.values,id=source.definition.id,diag=context.diagnostics;
    var header=H.detect(rows,{maxRows:context.config.parser.maxHeaderScanRows,minimumScore:4,requiredGroups:[['RSM_ID'],['TSO_ID'],['SR_ID'],['SR_NAME']]},diag,id);
    if(!header)return empty(id);
    var salesPeriod=context.selectedSalesPeriod||{},monthStart=metadataMonth(rows)||salesPeriod.periodStart||'';
    if(!monthStart){diag.issue('ERROR','ATTENDANCE_MONTH_MISSING','Attendance cannot be dated without the selected Sales month',{sourceId:id});return empty(id);}
    monthStart=monthStart.slice(0,7)+'-01';
    if(salesPeriod.periodStart&&monthStart!==salesPeriod.periodStart){diag.issue('ERROR','ATTENDANCE_PERIOD_MISMATCH','Attendance month does not match the selected Sales month',{attendanceMonth:monthStart,salesMonth:salesPeriod.periodStart});return empty(id);}
    if(!metadataMonth(rows))diag.issue('WARN','ATTENDANCE_MONTH_DERIVED_FROM_SALES','Attendance month is derived once from the selected Sales period',{periodStart:monthStart});
    var year=Number(monthStart.slice(0,4)),month=Number(monthStart.slice(5,7)),days=C.contiguousDayColumns(rows[header.rowIndex],-1,rows[header.rowIndex].length),observations=[],employees={},weekdayRow=rows[header.rowIndex-1]||[];
    days=days.filter(function(d){return d.day<=new Date(Date.UTC(year,month,0)).getUTCDate();});
    days.forEach(function(d){var expected=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(Date.UTC(year,month-1,d.day)).getUTCDay()],actual=U.text(weekdayRow[d.index]).slice(0,3);if(actual&&actual.toLowerCase()!==expected.toLowerCase())diag.issue('ERROR','ATTENDANCE_WEEKDAY_MISMATCH','Attendance day does not align with selected Sales month',{day:d.day,expected:expected,actual:actual});});
    for(var r=header.rowIndex+1;r<rows.length;r++){
      var row=rows[r],sr=N.employee(C.value(row,header.columns,['SR_ID']),C.value(row,header.columns,['SR_NAME']),'SR');if(!sr.sourceId)continue;
      var rsm=N.employee(C.value(row,header.columns,['RSM_ID']),C.value(row,header.columns,['RSM_NAME']),'RSM'),tso=N.employee(C.value(row,header.columns,['TSO_ID']),C.value(row,header.columns,['TSO_NAME']),'TSO');employees[sr.id]=sr;
      days.forEach(function(d){var raw=U.canonicalText(row[d.index]),status=raw==='P'||raw==='PRESENT'?'PRESENT':(raw==='A'||raw==='ABSENT'?'ABSENT':'');if(!status)return;observations.push({srId:sr.id,tsoId:tso.id,rsmId:rsm.id,date:U.isoDate(d.day,year,month),status:status,sourceRow:r+1});});
    }
    diag.source(id).headerRow=header.rowIndex+1;diag.source(id).rowsLoaded=Object.keys(employees).length;diag.source(id).recordsEmitted=observations.length;
    return{sourceId:id,records:[],dimensions:{employees:employees},attendanceObservations:observations,metadata:{period:{periodStart:monthStart,periodEnd:periodEnd(year,month)},employeeCount:Object.keys(employees).length,observationCount:observations.length,explicitDates:true}};
  }
  function metadataMonth(rows){for(var r=0;r<Math.min(rows.length,4);r++)for(var c=40;c<(rows[r]||[]).length;c++)if(U.headerKey(rows[r][c])==='MONTH_START'){var value=rows[r+1]&&rows[r+1][c];return U.isoDate(value);}return'';}
  function periodEnd(year,month){return year+'-'+String(month).padStart(2,'0')+'-'+new Date(Date.UTC(year,month,0)).getUTCDate();}
  function empty(id){return{sourceId:id,records:[],dimensions:{employees:{}},attendanceObservations:[],metadata:{}};}
  return{parse:parse};
}());
