SIP.CacheEngine = (function () {
  function getCache() { return CacheService.getScriptCache(); }
  function metaKey(config) { return config.cache.namespace + ':META'; }
  function chunkKey(config, generation, i) { return config.cache.namespace + ':' + generation + ':' + i; }

  function put(master, config, diagnostics) {
    var json = JSON.stringify(master), payload = encode(json), size = config.cache.chunkChars;
    var chunks = [];
    for (var i = 0; i < payload.length; i += size) chunks.push(payload.slice(i, i + size));
    if (chunks.length > config.cache.maxChunks) {
      diagnostics.issue('WARN', 'CACHE_PAYLOAD_TOO_LARGE', 'Master Dataset exceeded configured cache capacity', { chunks: chunks.length, maxChunks: config.cache.maxChunks });
      return { cached: false, chunks: chunks.length };
    }
    var generation = SIP.Utils.hash([master.batchId, master.generatedAt]).slice(0, 16), cache = getCache(), entries = {}, batchChars = 0;
    chunks.forEach(function (chunk, index) {
      if (batchChars && batchChars + chunk.length > 90000) { cache.putAll(entries, config.cache.ttlSeconds); entries = {}; batchChars = 0; }
      entries[chunkKey(config, generation, index)] = chunk; batchChars += chunk.length;
    });
    if (batchChars) cache.putAll(entries, config.cache.ttlSeconds);
    var keys = []; for (var k = 0; k < chunks.length; k++) keys.push(chunkKey(config, generation, k));
    var verified = cache.getAll(keys), missing = keys.filter(function (key) { return !verified[key]; });
    if (missing.length) {
      diagnostics.issue('ERROR', 'CACHE_PUBLICATION_INCOMPLETE', 'Cache rejected one or more chunks', { expected: keys.length, missing: missing.length });
      cache.removeAll(keys);
      return { cached: false, chunks: chunks.length, missing: missing.length, reason: 'PUBLICATION_INCOMPLETE' };
    }
    cache.put(metaKey(config), JSON.stringify({ generation: generation, chunks: chunks.length, hash: SIP.Utils.hash(json), generatedAt: master.generatedAt }), config.cache.ttlSeconds);
    diagnostics.counters.cacheChunks = chunks.length;
    return { cached: true, generation: generation, chunks: chunks.length };
  }

  function get(config, diagnostics) {
    var rawMeta = getCache().get(metaKey(config)); if (!rawMeta) return null;
    var meta; try { meta = JSON.parse(rawMeta); } catch (e) { diagnostics.issue('WARN', 'CACHE_META_INVALID', e.message); return null; }
    var keys = []; for (var i = 0; i < meta.chunks; i++) keys.push(chunkKey(config, meta.generation, i));
    var found = getCache().getAll(keys), payload = '';
    for (var j = 0; j < keys.length; j++) { if (!found[keys[j]]) { diagnostics.issue('WARN', 'CACHE_CHUNK_MISSING', 'Cache generation is incomplete', { chunk: j }); return null; } payload += found[keys[j]]; }
    try {
      var json = decode(payload); if (SIP.Utils.hash(json) !== meta.hash) throw new Error('Cache checksum mismatch');
      diagnostics.increment('cacheHits'); return JSON.parse(json);
    } catch (error) { diagnostics.issue('WARN', 'CACHE_READ_FAILED', error.message); return null; }
  }

  function remove(config) {
    var cache = getCache(), raw = cache.get(metaKey(config));
    if (raw) { try { var meta = JSON.parse(raw); var keys=[]; for(var i=0;i<meta.chunks;i++)keys.push(chunkKey(config,meta.generation,i)); cache.removeAll(keys); } catch(e) {} }
    cache.remove(metaKey(config));
  }

  function encode(json) {
    if (typeof Utilities !== 'undefined' && Utilities.gzip) return Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(json, 'application/json')).getBytes());
    return json;
  }
  function decode(payload) {
    if (typeof Utilities !== 'undefined' && Utilities.ungzip) return Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(payload))).getDataAsString();
    return payload;
  }
  return { put: put, get: get, remove: remove };
}());
