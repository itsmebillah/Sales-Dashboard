SIP.HrAttendance=(function(){
  function build(parsed,context){
    var attendance=find(parsed,'SRC_ATTENDANCE'),hierarchy=find(parsed,'SRC_HIERARCHY'),observations=attendance&&attendance.attendanceObservations||[],assignments=hierarchy&&hierarchy.hierarchyAssignments||[];
    if(!observations.length)return null;
    var bySr={};assignments.forEach(function(a){bySr[a.srId]=bySr[a.srId]||[];bySr[a.srId].push(a);});
    var entities={},employees={},dates={};
    observations.forEach(function(o){employees[o.srId]=true;dates[o.date]=true;var rows=bySr[o.srId]||[],primary=rows[0]||{};
      var refs=[['COMPANY','COMPANY:DEFAULT'],['ASM',primary.asmId],['RSM',primary.rsmId||o.rsmId],['TSO',primary.tsoId||o.tsoId],['SR',o.srId]];
      rows.forEach(function(a){refs.push(['DEALER',a.dealerId]);refs.push(['TERRITORY',a.territoryId]);refs.push(['AREA',a.areaId]);});
      var seen={};refs.forEach(function(ref){if(!ref[1])return;var key=ref[0]+'|'+ref[1];if(seen[key])return;seen[key]=true;add(entities,key,ref[0],ref[1],o);});
    });
    Object.keys(entities).forEach(function(key){var x=entities[key],total=x.present+x.absent;x.attendancePct=total?x.present/total:null;delete x._seen;});
    var company=entities['COMPANY|COMPANY:DEFAULT']||{present:0,absent:0,attendancePct:null};
    return{status:'ACTIVE',attendanceType:'HR_ATTENDANCE',type:'HR_ATTENDANCE',statusSource:'ATTENDANCE_TAB',providerContract:'HR_ATTENDANCE_V1',hrAttendance:true,
      periodStart:attendance.metadata.period.periodStart,periodEnd:attendance.metadata.period.periodEnd,employeeCount:Object.keys(employees).length,workingDays:Object.keys(dates).length,present:company.present,absent:company.absent,attendancePct:company.attendancePct,observationCount:observations.length,entities:entities,records:[]};
  }
  function add(entities,key,type,id,o){var x=entities[key]=entities[key]||{entityType:type,entityId:id,present:0,absent:0,attendancePct:null,_seen:{}};var unique=o.srId+'|'+o.date;if(x._seen[unique])return;x._seen[unique]=true;if(o.status==='PRESENT')x.present++;else if(o.status==='ABSENT')x.absent++;}
  function find(parsed,id){for(var i=0;i<parsed.length;i++)if(parsed[i].sourceId===id)return parsed[i];return null;}
  return{build:build};
}());
