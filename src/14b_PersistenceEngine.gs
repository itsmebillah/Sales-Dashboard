SIP.PersistenceEngine=(function(){
  var MASTER_HEADERS=['record_id','batch_id','source_system','source_dataset','source_record_id','contract_id','module_id','record_type','event_type','metric_id','event_date','period_start','period_end','as_of_at','observed_at','ingested_at','company_id','asm_id','rsm_id','tso_id','sr_id','employee_id','territory_id','area_id','dealer_id','depot_id','product_id','product_group_id','pack_id','bank_id','currency_code','unit_code','quantity','amount','numeric_value','text_value','status_code','quality_status','relationship_version','attributes_json','source_hash'];
  function persist(spreadsheet,master,config){
    var started=Date.now(),spreadsheetId=spreadsheet.getId?spreadsheet.getId():'';
    var masterResult=enforceMasterHeader(spreadsheet.getSheetByName(config.sheets.masterDataset),MASTER_HEADERS,master.records.length);
    var calendarHeaders=['date_id','calendar_date','year','quarter','month_number','month_name','year_month','week_of_year','day_of_month','day_of_week_number','day_name','is_weekend','is_holiday','is_working_day','selling_day_index','calendar_status','fiscal_year','fiscal_quarter','holiday_name','holiday_approval'];
    var calendarResult=replace(spreadsheet.getSheetByName(config.sheets.calendar),calendarHeaders,master.calendar.rows.map(function(r){return [r.dateId,r.date,r.year,r.quarter,r.monthNumber,r.monthName,r.yearMonth,r.weekOfYear,r.dayOfMonth,r.dayOfWeekNumber,r.dayName,r.isWeekend,r.isHoliday,r.isWorkingDay,r.sellingDayIndex,r.status,r.fiscalYear,r.fiscalQuarter,r.holidayName,r.holidayApproval];}),config.persistence.chunkRows,spreadsheetId);
    var hierarchyResult={rows:0,archived:true,source:config.sheets.hierarchySource,reason:'Hierarchy tab is the canonical provider; legacy generated sheet retained for rollback'};
    var relationshipResult={rows:0,persisted:false,reason:'Runtime graph is cached with the certified dataset'};
    if(typeof SpreadsheetApp!=='undefined'&&SpreadsheetApp.flush)SpreadsheetApp.flush();
    return {verified:masterResult.headerOnly&&masterResult.runtimeRecords===master.records.length&&calendarResult.rows===master.calendar.rows.length,master:masterResult,calendar:calendarResult,hierarchy:hierarchyResult,relationships:relationshipResult,durationMs:Date.now()-started};
  }
  function enforceMasterHeader(sheet,headers,runtimeRecords){
    if(!sheet)throw new Error('Required Master Dataset contract sheet is missing');
    var previous=Math.max(0,(sheet.getLastRow?sheet.getLastRow():1)-1),maxRows=sheet.getMaxRows?sheet.getMaxRows():2,maxColumns=sheet.getMaxColumns?sheet.getMaxColumns():headers.length;
    if(maxColumns<headers.length&&sheet.insertColumnsAfter)sheet.insertColumnsAfter(maxColumns,headers.length-maxColumns);
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    if(previous&&sheet.getRange)sheet.getRange(2,1,previous,headers.length).clearContent();
    var allocatedRowsRemoved=0;
    if(maxRows>2&&sheet.deleteRows){allocatedRowsRemoved=maxRows-2;sheet.deleteRows(3,allocatedRowsRemoved);}
    return{rows:0,persisted:false,headerOnly:true,runtimeRecords:runtimeRecords,physicalRowsRemoved:previous,allocatedRowsRemoved:allocatedRowsRemoved,maxRows:maxRows-allocatedRowsRemoved,reason:'Logical Master Dataset is rebuilt from governed sources in memory/cache; the physical sheet retains only its frozen schema header'};
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
