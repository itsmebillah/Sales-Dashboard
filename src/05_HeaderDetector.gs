SIP.HeaderDetector = (function () {
  var U = SIP.Utils;

  function rowKeys(row) { return row.map(U.headerKey); }

  function score(keys, requiredGroups) {
    return requiredGroups.reduce(function (total, group) {
      return total + (group.some(function (candidate) { return keys.indexOf(candidate) >= 0; }) ? 1 : 0);
    }, 0);
  }

  function detect(rows, spec, diagnostics, sourceId) {
    var max = Math.min(rows.length, spec.maxRows || 12);
    var best = { index: -1, score: -1, keys: [] };
    for (var i = 0; i < max; i++) {
      var keys = rowKeys(rows[i]);
      var current = score(keys, spec.requiredGroups);
      if (current > best.score) best = { index: i, score: current, keys: keys };
    }
    if (best.score < spec.minimumScore) {
      diagnostics.issue('ERROR', 'HEADER_NOT_FOUND', 'No row met the header signature', { sourceId: sourceId, bestScore: best.score });
      return null;
    }
    var duplicates = {};
    best.keys.forEach(function (key, index) {
      if (!key) return;
      if (!duplicates[key]) duplicates[key] = [];
      duplicates[key].push(index);
    });
    Object.keys(duplicates).forEach(function (key) {
      if (duplicates[key].length > 1 && !/^\d{1,2}$/.test(key)) {
        diagnostics.issue('WARN', 'DUPLICATE_HEADER', 'Duplicate header detected: ' + key, { sourceId: sourceId, indexes: duplicates[key] });
      }
    });
    var columns = {};
    best.keys.forEach(function (key, index) { if (key && columns[key] === undefined) columns[key] = index; });
    return { rowIndex: best.index, keys: best.keys, columns: columns, duplicates: duplicates };
  }

  function find(columns, aliases) {
    for (var i = 0; i < aliases.length; i++) if (columns[aliases[i]] !== undefined) return columns[aliases[i]];
    return -1;
  }

  return { detect: detect, find: find, rowKeys: rowKeys };
}());
