SIP.Utils = (function () {
  function text(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function canonicalText(value) {
    return text(value).toUpperCase().replace(/[’‘`]/g, "'").replace(/\s*\/\s*/g, '/');
  }

  function headerKey(value) {
    return canonicalText(value).replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  function normalizeName(value) {
    return text(value)
      .toLowerCase()
      .replace(/[’‘`]/g, "'")
      .replace(/\b(m\/s|ms)\.?\b/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function embeddedCode(value) {
    var match = text(value).match(/\((\d+)\)/);
    return match ? match[1] : '';
  }

  function normalizeId(value) {
    var v = text(value).replace(/,/g, '');
    return /^\d+(\.0+)?$/.test(v) ? v.replace(/\.0+$/, '') : v;
  }

  function number(value, blankTokens) {
    if (typeof value === 'number') return isFinite(value) ? value : null;
    var raw = text(value);
    var upper = raw.toUpperCase();
    if (!raw || (blankTokens || []).some(function (x) { return upper === String(x).toUpperCase(); })) return null;
    var negative = /^\(.*\)$/.test(raw);
    var cleaned = raw.replace(/[(),%\s]/g, '').replace(/,/g, '');
    if (!/^[-+]?\d*\.?\d+$/.test(cleaned)) return null;
    var parsed = Number(cleaned);
    if (!isFinite(parsed)) return null;
    if (negative) parsed = -Math.abs(parsed);
    return /%/.test(raw) ? parsed / 100 : parsed;
  }

  function isoDate(value, contextYear, contextMonth) {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return Utilities.formatDate(value, 'GMT', 'yyyy-MM-dd');
    }
    if (typeof value === 'number' && value > 20000 && value < 80000) {
      var epoch = new Date(Date.UTC(1899, 11, 30));
      epoch.setUTCDate(epoch.getUTCDate() + value);
      return Utilities.formatDate(epoch, 'GMT', 'yyyy-MM-dd');
    }
    var raw = text(value);
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    if (/^\d{1,2}$/.test(raw) && contextYear && contextMonth) {
      return [contextYear, String(contextMonth).padStart(2, '0'), raw.padStart(2, '0')].join('-');
    }
    var parsed = new Date(raw);
    return isNaN(parsed.getTime()) ? '' : Utilities.formatDate(parsed, 'GMT', 'yyyy-MM-dd');
  }

  function monthContext(rows) {
    var sample = (rows.slice(0, 5).reduce(function (a, r) { return a.concat(r); }, [])).join(' ');
    var names = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    var match = sample.toUpperCase().match(/(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)[^0-9]*(20\d{2}|\d{2})/);
    if (!match) return { year: null, month: null, periodStart: '', periodEnd: '' };
    var month = names.indexOf(match[1].slice(0, 3)) + 1;
    var year = Number(match[2]); if (year < 100) year += 2000;
    var last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return { year: year, month: month, periodStart: year + '-' + String(month).padStart(2, '0') + '-01', periodEnd: year + '-' + String(month).padStart(2, '0') + '-' + last };
  }

  function hash(parts) {
    var input = Array.isArray(parts) ? parts.join('|') : String(parts);
    if (typeof Utilities !== 'undefined' && Utilities.computeDigest) {
      return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input)
        .map(function (b) { return ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2); }).join('');
    }
    var h = 2166136261;
    for (var i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  }

  function uniqueId(prefix, parts) { return prefix + '_' + hash(parts).slice(0, 24); }
  function nowIso() { return new Date().toISOString(); }
  function safeJson(value) { try { return JSON.stringify(value || {}); } catch (e) { return '{}'; } }

  return {
    text: text, canonicalText: canonicalText, headerKey: headerKey, normalizeName: normalizeName,
    embeddedCode: embeddedCode, normalizeId: normalizeId, number: number, isoDate: isoDate,
    monthContext: monthContext, hash: hash, uniqueId: uniqueId, nowIso: nowIso, safeJson: safeJson
  };
}());
