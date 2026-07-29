SIP.SalesActivityAttendance=(function(){
  var PROVIDER_CONTRACT='ATTENDANCE_PROVIDER_V1';
  function resolve(validation,relationships,calendar,context,provider){
    return (provider||derive)(validation,relationships,calendar,context);
  }
  function derive(validation,relationships,calendar,context){
    var current=calendar.current||{},working=(calendar.rows||[]).filter(function(r){return r.periodStart===current.periodStart&&r.isWorkingDay&&r.date<calendar.asOfDate;}),employees={},activity={};
    (validation.records||[]).forEach(function(r){
      if(r.module_id==='SALES'&&r.sr_id)employees[r.sr_id]=true;
      if(r.metric_id==='SALES_AMOUNT'&&r.sr_id&&r.event_date&&r.quality_status==='VALID'&&Number(r.numeric_value)>0)activity[r.sr_id+'|'+r.event_date]=true;
    });
    var records=[];Object.keys(employees).sort().forEach(function(srId){working.forEach(function(day){var present=!!activity[srId+'|'+day.date],status=present?'PRESENT':'ABSENT';records.push(SIP.Normalizer.masterRecord({recordId:SIP.Utils.uniqueId('ATT',[context.batchId,srId,day.date,'SALES_ACTIVITY_DERIVED_V1']),batchId:context.batchId,sourceSystem:'DERIVED_ANALYTICS',sourceDataset:'Sales Activity Attendance',sourceRecordId:srId+'|'+day.date,contractId:'PC_SALES_ACTIVITY_ATTENDANCE_V1',moduleId:'SALES_ACTIVITY_ATTENDANCE',recordType:'OBSERVATION',eventType:'SALES_ACTIVITY_STATUS',metricId:'SALES_ACTIVITY_ATTENDANCE_STATUS',eventDate:day.date,periodStart:current.periodStart,periodEnd:current.periodEnd,ingestedAt:context.ingestedAt,srId:srId,employeeId:srId,numericValue:present?1:0,amount:null,textValue:status,statusCode:status,qualityStatus:'VALID',attributes:{statusSource:'SALES_ACTIVITY_DERIVED',attendanceType:'SALES_ACTIVITY_NOT_HR',ruleVersion:'1.0.0',workingDay:true}}));});});
    return{providerContract:PROVIDER_CONTRACT,records:records,employeeCount:Object.keys(employees).length,workingDays:working.length,present:records.filter(function(r){return r.status_code==='PRESENT';}).length,absent:records.filter(function(r){return r.status_code==='ABSENT';}).length,statusSource:'SALES_ACTIVITY_DERIVED',attendanceType:'SALES_ACTIVITY_NOT_HR',hrAttendance:false};
  }
  return{resolve:resolve,derive:derive,providerContract:PROVIDER_CONTRACT};
}());
