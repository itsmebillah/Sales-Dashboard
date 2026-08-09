SIP.RefreshTrace=(function(){
  var KEY='SIP_REFRESH_TRACE_V1';
  function store(value){if(typeof PropertiesService==='undefined')return;PropertiesService.getScriptProperties().setProperty(KEY,JSON.stringify(value));}
  function begin(batchId){store({batchId:batchId,startedAt:SIP.Utils.nowIso(),stage:'STARTED',updatedAt:SIP.Utils.nowIso(),complete:false});}
  function mark(stage,detail){var value=get()||{};value.stage=stage;value.updatedAt=SIP.Utils.nowIso();value.detail=detail||{};value.complete=stage==='COMPLETE'||stage==='FAILED';store(value);return value;}
  function get(){if(typeof PropertiesService==='undefined')return null;var raw=PropertiesService.getScriptProperties().getProperty(KEY);try{return raw?JSON.parse(raw):null;}catch(error){return{stage:'TRACE_INVALID',complete:true};}}
  return{begin:begin,mark:mark,get:get};
}());
