/** Durable L2 cache for compact certified consumer payloads. */
SIP.DurableCache = (function () {
  var PREFIX='SIP_DASHBOARD_DURABLE_V1',META=PREFIX+':META',CHUNK_CHARS=8000,MAX_CHUNKS=60;
  function store(){return PropertiesService.getScriptProperties();}
  function chunkKey(generation,index){return PREFIX+':'+generation+':'+index;}
  function encode(json){return Utilities.gzip?Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(json,'application/json')).getBytes()):json;}
  function decode(payload){return Utilities.ungzip?Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(payload))).getDataAsString():payload;}
  function put(value){
    var json=JSON.stringify(value),payload=encode(json),chunks=[];
    for(var i=0;i<payload.length;i+=CHUNK_CHARS)chunks.push(payload.slice(i,i+CHUNK_CHARS));
    if(chunks.length>MAX_CHUNKS)return{cached:false,reason:'DURABLE_CAPACITY',chunks:chunks.length,maxChunks:MAX_CHUNKS};
    var properties=store(),previous=parse(properties.getProperty(META)),generation=SIP.Utils.hash([value.batchId,value.generatedAt,json.length]).slice(0,16),entries={},batchChars=0;
    chunks.forEach(function(chunk,index){
      if(batchChars&&batchChars+chunk.length>80000){properties.setProperties(entries,false);entries={};batchChars=0;}
      entries[chunkKey(generation,index)]=chunk;batchChars+=chunk.length;
    });
    if(batchChars)properties.setProperties(entries,false);
    properties.setProperty(META,JSON.stringify({generation:generation,chunks:chunks.length,hash:SIP.Utils.hash(json),generatedAt:value.generatedAt,batchId:value.batchId}));
    var verified=get();
    if(!verified||verified.batchId!==value.batchId){removeGeneration(properties,generation,chunks.length);return{cached:false,reason:'DURABLE_VERIFICATION_FAILED',chunks:chunks.length};}
    if(previous&&previous.generation!==generation)removeGeneration(properties,previous.generation,previous.chunks);
    return{cached:true,generation:generation,chunks:chunks.length,encodedChars:payload.length};
  }
  function get(){
    var properties=store(),meta=parse(properties.getProperty(META));if(!meta)return null;
    var all=properties.getProperties(),payload='';
    for(var i=0;i<meta.chunks;i++){var chunk=all[chunkKey(meta.generation,i)];if(!chunk)return null;payload+=chunk;}
    try{var json=decode(payload);if(SIP.Utils.hash(json)!==meta.hash)return null;return JSON.parse(json);}catch(error){return null;}
  }
  function remove(){var properties=store(),meta=parse(properties.getProperty(META));if(meta)removeGeneration(properties,meta.generation,meta.chunks);properties.deleteProperty(META);}
  function removeGeneration(properties,generation,count){for(var i=0;i<(count||0);i++)properties.deleteProperty(chunkKey(generation,i));}
  function parse(value){try{return value?JSON.parse(value):null;}catch(error){return null;}}
  return{put:put,get:get,remove:remove};
}());
