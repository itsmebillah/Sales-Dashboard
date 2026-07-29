SIP.CertificationEngine=(function(){
  function assess(master,diagnostics,persistence){
    var errors=diagnostics.issues.filter(function(x){return x.severity==='ERROR';});
    var hierarchyConflicts=diagnostics.issues.filter(function(x){return x.code==='AMBIGUOUS_HIERARCHY';});
    var checks={noErrors:errors.length===0,noQuarantined:(diagnostics.counters.recordsQuarantined||0)===0,calendar:!!(master.calendar&&master.calendar.verified),persistence:!!(persistence&&persistence.verified),hierarchy:hierarchyConflicts.length===0,salesControl:!!(master.reconciliation&&master.reconciliation.sales&&master.reconciliation.sales.accepted)};
    var certified=Object.keys(checks).every(function(k){return checks[k];});
    return{status:certified?'CERTIFIED':'NOT_CERTIFIED',certified:certified,batchId:master.batchId,certifiedAt:certified?SIP.Utils.nowIso():'',checks:checks,errorCodes:errors.map(function(x){return x.code;}),openP0:certified?[]:Object.keys(checks).filter(function(k){return !checks[k];})};
  }
  return{assess:assess};
}());
