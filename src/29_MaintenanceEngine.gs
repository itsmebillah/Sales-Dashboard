SIP.MaintenanceEngine=(function(){
  var BUSINESS={'Sales Data Base Monthly':true,'Previous Month Sales':true,'Monthly Projection':true,'Dealer lifting':true,'Attendance':true};
  var CLASSIFICATION={
    'Dashboard Cache':'Cache','Master Dataset':'Contract','Master Lookup':'Metadata','Calendar':'Metadata','Holiday':'Metadata','Configuration':'Metadata','Hierarchy':'Archive','Hierarchy tab':'Business Source','Relationship Model':'Archive','Parser Contract':'Metadata','Metric Dictionary':'Metadata','Module Registry':'Metadata','Source Registry':'Metadata','Import Batches':'Log','Quality Rules':'Metadata','Quality Results':'Log','Metric Store':'Historical Cache','Action Register':'Recovery','Audit Log':'Log','Platform Guide':'Metadata'
  };
  function inventory(spreadsheet){return spreadsheet.getSheets().map(function(sheet){var name=sheet.getName();return{name:name,classification:BUSINESS[name]?'Business':(CLASSIFICATION[name]||'Unclassified'),rows:sheet.getLastRow(),columns:sheet.getLastColumn(),maxRows:sheet.getMaxRows(),maxColumns:sheet.getMaxColumns(),automaticCleanup:cleanupPolicy(name)};});}
  function cleanupPolicy(name){
    if(BUSINESS[name])return'PERMANENT_NO_AUTOMATION';
    if(name==='Dashboard Cache')return'ACTIVE_CERTIFIED_ONLY';
    if(name==='Calendar')return'REPLACE_AFTER_SUCCESSFUL_BUILD';
    if(name==='Master Dataset')return'HEADER_ONLY_LOGICAL_MODEL';
    if(name==='Hierarchy'||name==='Relationship Model')return'RETAIN_FOR_ROLLBACK';
    if(name==='Import Batches'||name==='Quality Results')return'90_DAYS_OR_LAST_100_BATCHES';
    return'REPORT_ONLY_UNTIL_REFERENCE_PROVEN_SAFE';
  }
  function run(options){
    options=options||{};var config=SIP.Config.get(options.config),lock=LockService.getScriptLock();
    if(!lock.tryLock(options.lockTimeoutMs||1000))return{ok:false,status:'SKIPPED_ACTIVE_REFRESH',at:SIP.Utils.nowIso()};
    try{
      var active=SIP.DurableCache.get();
      if(!active||!active.batchId||!active.quality||active.quality.certification!=='CERTIFIED')return{ok:false,status:'SKIPPED_NO_CERTIFIED_CACHE',at:SIP.Utils.nowIso()};
      var spreadsheet=SpreadsheetApp.openById(config.spreadsheetId),before=inventory(spreadsheet);
      var batches=pruneBatches(spreadsheet.getSheetByName(config.sheets.importBatches),active.batchId,config.maintenance);
      var quality=pruneQuality(spreadsheet.getSheetByName(config.sheets.qualityResults),batches.retainedBatchIds);
      SpreadsheetApp.flush();
      return{ok:true,status:'COMPLETED',at:SIP.Utils.nowIso(),activeCertifiedBatch:active.batchId,batches:batches.summary,quality:quality,before:before,after:inventory(spreadsheet),untouchedBusinessSheets:Object.keys(BUSINESS),reportOnlySheets:Object.keys(CLASSIFICATION).filter(function(n){return cleanupPolicy(n).indexOf('REPORT_ONLY')===0;})};
    }finally{lock.releaseLock();}
  }
  function pruneBatches(sheet,activeBatchId,settings){
    if(!sheet)return{summary:{removed:0,reason:'SHEET_MISSING'},retainedBatchIds:{}};
    var values=sheet.getDataRange().getValues();if(values.length<=1)return{summary:{removed:0,retained:0},retainedBatchIds:{}};
    var header=values[0],rows=values.slice(1),now=Date.now(),cutoff=now-settings.batchRetentionDays*86400000;
    rows.sort(function(a,b){return new Date(b[3]||0)-new Date(a[3]||0);});
    var keep={},retained=rows.filter(function(row,index){var batch=String(row[0]||''),recent=new Date(row[3]||0).getTime()>=cutoff,allowed=index<settings.maxBatchHistory||recent||batch===activeBatchId;if(allowed)keep[batch]=true;return allowed;});
    replaceBody(sheet,header,retained);return{summary:{removed:rows.length-retained.length,retained:retained.length,retentionDays:settings.batchRetentionDays,maxHistory:settings.maxBatchHistory},retainedBatchIds:keep};
  }
  function pruneQuality(sheet,retainedBatchIds){
    if(!sheet)return{removed:0,reason:'SHEET_MISSING'};var values=sheet.getDataRange().getValues();if(values.length<=1)return{removed:0,retained:0};
    var header=values[0],rows=values.slice(1),retained=rows.filter(function(row){return !!retainedBatchIds[String(row[1]||'')];});replaceBody(sheet,header,retained);return{removed:rows.length-retained.length,retained:retained.length};
  }
  function replaceBody(sheet,header,rows){var old=Math.max(0,sheet.getLastRow()-1);if(old)sheet.getRange(2,1,old,header.length).clearContent();sheet.getRange(1,1,1,header.length).setValues([header]);if(rows.length)sheet.getRange(2,1,rows.length,header.length).setValues(rows);}
  return{run:run,inventory:inventory,cleanupPolicy:cleanupPolicy};
}());

function runScheduledMaintenance(){return SIP.MaintenanceEngine.run({});}
function getSystemWorksheetInventory(){return SIP.MaintenanceEngine.inventory(SpreadsheetApp.openById(SIP.Config.get().spreadsheetId));}
function installDailyMaintenanceTrigger(){
  var handler='runScheduledMaintenance',existing=ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()===handler;});
  if(!existing.length)ScriptApp.newTrigger(handler).timeBased().everyDays(1).atHour(SIP.Config.get().maintenance.scheduleHour).create();
  return{installed:true,handler:handler,hour:SIP.Config.get().maintenance.scheduleHour,triggerCount:ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()===handler;}).length,existingRemoved:0};
}
