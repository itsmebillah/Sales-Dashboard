SIP.PersistenceEngine=(function(){
  var MASTER_HEADERS=['record_id','batch_id','source_system','source_dataset','source_record_id','contract_id','module_id','record_type','event_type','metric_id','event_date','period_start','period_end','as_of_at','observed_at','ingested_at','company_id','asm_id','rsm_id','tso_id','sr_id','employee_id','territory_id','area_id','dealer_id','depot_id','product_id','product_group_id','pack_id','bank_id','currency_code','unit_code','quantity','amount','numeric_value','text_value','status_code','quality_status','relationship_version','attributes_json','source_hash'];
  function persist(spreadsheet,master,config){
    var started=Date.now(),spreadsheetId=spreadsheet.getId?spreadsheet.getId():'';
    var masterResult=replace(spreadsheet.getSheetByName(config.sheets.masterDataset),MASTER_HEADERS,master.records.map(function(r){return MASTER_HEADERS.map(function(h){return value(r[h]);});}),config.persistence.chunkRows,spreadsheetId);
    var calendarHeaders=['date_id','calendar_date','year','quarter','month_number','month_name','year_month','week_of_year','day_of_month','day_of_week_number','day_name','is_weekend','is_holiday','is_working_day','selling_day_index','calendar_status','fiscal_year','fiscal_quarter','holiday_name','holiday_approval'];
    var calendarResult=replace(spreadsheet.getSheetByName(config.sheets.calendar),calendarHeaders,master.calendar.rows.map(function(r){return [r.dateId,r.date,r.year,r.quarter,r.monthNumber,r.monthName,r.yearMonth,r.weekOfYear,r.dayOfMonth,r.dayOfWeekNumber,r.dayName,r.isWeekend,r.isHoliday,r.isWorkingDay,r.sellingDayIndex,r.status,r.fiscalYear,r.fiscalQuarter,r.holidayName,r.holidayApproval];}),config.persistence.chunkRows,spreadsheetId);
    var hierarchyHeaders=['hierarchy_record_id','hierarchy_type','child_entity_type','child_entity_id','parent_entity_type','parent_entity_id','level_code','level_number','effective_from','effective_to','is_primary','status_code','source_system','source_record_id','version'];
    var hierarchyResult=replace(spreadsheet.getSheetByName(config.sheets.hierarchy),hierarchyHeaders,master.hierarchy.map(function(h){var types=hierarchyTypes(h.type);return [h.hierarchyId,h.type,types.child,h.childId,types.parent,h.parentId,h.type,types.level,h.effectiveFrom,h.effectiveTo,true,'ACTIVE','DATA_ENGINE','',h.version||'1.0.0'];}),config.persistence.chunkRows,spreadsheetId);
    var relationshipHeaders=['relationship_id','subject_entity_type','subject_entity_id','relationship_type','object_entity_type','object_entity_id','role_code','allocation_weight','effective_from','effective_to','is_primary','status_code','source_system','source_record_id','attributes_json','version'];
    var relationshipResult=replace(spreadsheet.getSheetByName(config.sheets.relationships),relationshipHeaders,master.relationships.map(function(r){var types=relationshipTypes(r.type);return [r.relationshipId,types.subject,r.subjectId,r.type,types.object,r.objectId,r.type,1,r.effectiveFrom,r.effectiveTo,true,'ACTIVE','DATA_ENGINE',r.sourceRecordId||'','{}','1.0.0'];}),config.persistence.chunkRows,spreadsheetId);
    if(typeof SpreadsheetApp!=='undefined'&&SpreadsheetApp.flush)SpreadsheetApp.flush();
    return {verified:masterResult.rows===master.records.length&&calendarResult.rows===master.calendar.rows.length,master:masterResult,calendar:calendarResult,hierarchy:hierarchyResult,relationships:relationshipResult,durationMs:Date.now()-started};
  }
  function replace(sheet,headers,rows,chunk,spreadsheetId){
    if(!sheet)throw new Error('Required persistence sheet is missing');
    var required=Math.max(2,rows.length+1),max=sheet.getMaxRows?sheet.getMaxRows():required,maxColumns=sheet.getMaxColumns?sheet.getMaxColumns():headers.length;
    if(max<required&&sheet.insertRowsAfter)sheet.insertRowsAfter(max,required-max);
    if(maxColumns<headers.length&&sheet.insertColumnsAfter)sheet.insertColumnsAfter(maxColumns,headers.length-maxColumns);
    if(typeof Sheets!=='undefined'&&Sheets.Spreadsheets&&spreadsheetId)return replaceFast(spreadsheetId,sheet.getName(),headers,rows,chunk);
    var previous=Math.max(0,(sheet.getLastRow?sheet.getLastRow():1)-1);
    if(previous&&sheet.getRange)sheet.getRange(2,1,previous,headers.length).clearContent();
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    for(var i=0;i<rows.length;i+=chunk)sheet.getRange(i+2,1,Math.min(chunk,rows.length-i),headers.length).setValues(rows.slice(i,i+chunk));
    return {rows:rows.length,columns:headers.length};
  }
  function replaceFast(spreadsheetId,name,headers,rows,chunk){var escaped="'"+String(name).replace(/'/g,"''")+"'",data=[{range:escaped+'!A1',majorDimension:'ROWS',values:[headers]}];for(var i=0;i<rows.length;i+=chunk)data.push({range:escaped+'!A'+(i+2),majorDimension:'ROWS',values:rows.slice(i,i+chunk)});Sheets.Spreadsheets.Values.clear({},spreadsheetId,escaped+'!A:'+columnName(headers.length));Sheets.Spreadsheets.Values.batchUpdate({valueInputOption:'RAW',data:data},spreadsheetId);return{rows:rows.length,columns:headers.length,transport:'SHEETS_API_BATCH'};}
  function columnName(number){var out='';while(number){number--;out=String.fromCharCode(65+number%26)+out;number=Math.floor(number/26);}return out;}
  function value(v){return v===undefined||v===null?'':v;}
  function hierarchyTypes(type){if(type==='SR_TO_TSO')return{child:'SR',parent:'TSO',level:4};if(type==='TSO_TO_RSM')return{child:'TSO',parent:'RSM',level:3};return{child:'RSM',parent:'ASM',level:2};}
  function relationshipTypes(type){if(type==='EMPLOYEE_SERVES_DEALER')return{subject:'EMPLOYEE',object:'DEALER'};if(type==='DEALER_SUPPLIED_BY_DEPOT')return{subject:'DEALER',object:'DEPOT'};return{subject:'OBSERVATION',object:'PRODUCT'};}
  return{persist:persist,masterHeaders:MASTER_HEADERS};
}());
