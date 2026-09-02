SIP.CertificationEngine=(function(){
  function assess(master,diagnostics,persistence){
    var fatalErrors=diagnostics.issues.filter(function(x){return x.severity==='FATAL'||x.code==='ENGINE_FATAL'||x.code==='HEADER_NOT_FOUND'||x.code==='SOURCE_SHEET_MISSING';});
    var errors=diagnostics.issues.filter(function(x){return x.severity==='ERROR';});
    var checks={noFatalErrors:fatalErrors.length===0,hasRecords:(master.records||[]).length>0,calendar:!!(master.calendar&&master.calendar.rows&&master.calendar.rows.length>0),persistence:!!(persistence&&persistence.verified)};
    var eligible=checks.noFatalErrors&&checks.hasRecords;
    var certified=eligible&&errors.length===0&&checks.calendar&&checks.persistence;
    var status=certified?'CERTIFIED':(eligible?'PROVISIONAL':'NOT_CERTIFIED');
    return{status:status,certified:certified,batchId:master.batchId,certifiedAt:certified?SIP.Utils.nowIso():'',checks:checks,errorCodes:errors.map(function(x){return x.code;}),openP0:certified?[]:Object.keys(checks).filter(function(k){return !checks[k];})};
  }
  return{assess:assess};
}());
