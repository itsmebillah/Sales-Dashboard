/** Durable L2 cache stored only in the approved production spreadsheet. */
SIP.DurableCache = (function () {
  var SHEET='Dashboard Cache',SCHEMA='SIP_DASHBOARD_CACHE_V1',CHUNK_CHARS=30000,MAX_CHUNKS=60;
  function encode(json){return Utilities.gzip?Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(json,'application/json')).getBytes()):json;}
  function decode(payload){return Utilities.ungzip?Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(payload),'application/x-gzip')).getDataAsString():payload;}
  function spreadsheet(){return SpreadsheetApp.openById(SIP.Config.get().spreadsheetId);}
  function cacheSheet(create){var book=spreadsheet(),sheet=book.getSheetByName(SHEET);if(!sheet&&create){sheet=book.insertSheet(SHEET);sheet.hideSheet();}return sheet;}
  function put(value){
    var json=JSON.stringify(value),payload=encode(json),chunks=[];
    for(var i=0;i<payload.length;i+=CHUNK_CHARS)chunks.push(payload.slice(i,i+CHUNK_CHARS));
    if(chunks.length>MAX_CHUNKS)return{cached:false,reason:'DURABLE_CAPACITY',chunks:chunks.length,maxChunks:MAX_CHUNKS};
    var sheet=cacheSheet(true),generation=SIP.Utils.hash([value.batchId,value.generatedAt,json.length]).slice(0,16),start=Math.max(2,sheet.getLastRow()+1);
    var rows=chunks.map(function(chunk,index){return[generation,index,chunk];});
    sheet.getRange(start,1,rows.length,3).setValues(rows);
    var meta={schema:SCHEMA,generation:generation,chunks:chunks.length,hash:SIP.Utils.hash(json),generatedAt:value.generatedAt,batchId:value.batchId};
    sheet.getRange(1,1,1,3).setValues([[SCHEMA,JSON.stringify(meta),value.generatedAt]]);
    SpreadsheetApp.flush();
    var verified=get();
    if(!verified||verified.batchId!==value.batchId)return{cached:false,reason:'DURABLE_VERIFICATION_FAILED',chunks:chunks.length};
    return{cached:true,generation:generation,chunks:chunks.length,encodedChars:payload.length,sheet:SHEET};
  }
  function get(){
    var sheet=cacheSheet(false);if(!sheet||sheet.getLastRow()<2)return null;
    var meta=parse(sheet.getRange(1,2).getValue());if(!meta||meta.schema!==SCHEMA)return null;
    var values=sheet.getRange(2,1,sheet.getLastRow()-1,3).getValues(),chunks=[];
    values.forEach(function(row){if(row[0]===meta.generation)chunks[Number(row[1])]=String(row[2]||'');});
    if(chunks.length!==meta.chunks||chunks.some(function(chunk){return !chunk;}))return null;
    try{var json=decode(chunks.join(''));if(SIP.Utils.hash(json)!==meta.hash)return null;return JSON.parse(json);}catch(error){return null;}
  }
  function remove(){var sheet=cacheSheet(false);if(sheet)sheet.clearContents();}
  function parse(value){try{return value?JSON.parse(String(value)):null;}catch(error){return null;}}
  return{put:put,get:get,remove:remove};
}());
