SIP.Normalizer = (function () {
  var U = SIP.Utils;

  function dealer(name, explicitCode) {
    var original = U.text(name);
    if (/^(paste here|sample|template|enter data|n\/a|test)$/i.test(original)) original = '';
    var code = U.normalizeId(explicitCode || U.embeddedCode(original));
    var normalized = U.normalizeName(original);
    return {
      id: code ? 'DEALER:' + code : (normalized ? 'DEALER_NAME:' + U.hash(normalized).slice(0, 16) : ''),
      code: code,
      name: original,
      normalizedName: normalized,
      keyQuality: code ? 'CODE' : (normalized ? 'NORMALIZED_NAME' : 'MISSING')
    };
  }

  function employee(id, name, role) {
    var canonicalId = U.normalizeId(id);
    var normalized = U.normalizeName(name);
    return {
      id: canonicalId ? 'EMPLOYEE:' + canonicalId : (normalized ? 'EMPLOYEE_NAME:' + U.hash([normalized, role]).slice(0, 16) : ''),
      sourceId: canonicalId,
      name: U.text(name),
      normalizedName: normalized,
      role: U.canonicalText(role),
      keyQuality: canonicalId ? 'ID' : (normalized ? 'NORMALIZED_NAME' : 'MISSING')
    };
  }

  function inferCategory(name) {
    var text = U.text(name).toLowerCase();
    if (!text) return 'General Products';
    if (/detergent|dtg|neat\s*bucket|powder|wash\s*powder/i.test(text)) return 'Detergent';
    if (/toilet|harpic|wc\s*cleaner/i.test(text)) return 'Toilet Cleaner';
    if (/dish|dishwash|dish\s*bar|dish\s*wash|dish\s*paste|vim/i.test(text)) return 'Dish Care';
    if (/tiles|tile\s*cleaner|floor|glass\s*cleaner|surface/i.test(text)) return 'Surface Cleaner';
    if (/soap|handwash|hand\s*wash|beauty\s*soap|body\s*wash/i.test(text)) return 'Personal Care';
    if (/liquid|cleaner|bleach|softener|fabric/i.test(text)) return 'Fabric & Home Care';
    return 'Other Products';
  }

  function product(name, pack, group) {
    var n = U.text(name), p = U.text(pack), g = U.text(group) || inferCategory(n);
    var key = [U.normalizeName(n), U.normalizeName(p), U.normalizeName(g)];
    return { id: key[0] ? 'PRODUCT:' + U.hash(key).slice(0, 20) : '', name: n, pack: p, group: g, normalizedName: key[0] };
  }

  function workingHours(value) {
    if (typeof value === 'number') return Math.round(value * 24 * 60);
    var raw = U.text(value); if (!raw) return null;
    var h = raw.match(/(\d+(?:\.\d+)?)\s*(?:HR|HOUR)/i);
    var m = raw.match(/(\d+)\s*MIN/i);
    if (!h && !m) return null;
    return Math.round((h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0));
  }

  function masterRecord(input) {
    var record = {
      record_id: input.recordId,
      batch_id: input.batchId || '', source_system: input.sourceSystem || '', source_dataset: input.sourceDataset || '',
      source_record_id: input.sourceRecordId || '', contract_id: input.contractId || '', module_id: input.moduleId || '',
      record_type: input.recordType || 'OBSERVATION', event_type: input.eventType || '', metric_id: input.metricId || '',
      event_date: input.eventDate || '', period_start: input.periodStart || '', period_end: input.periodEnd || '',
      as_of_at: input.asOfAt || '', observed_at: input.observedAt || '', ingested_at: input.ingestedAt || '',
      company_id: input.companyId || 'COMPANY:DEFAULT', asm_id: input.asmId || '', rsm_id: input.rsmId || '',
      tso_id: input.tsoId || '', sr_id: input.srId || '', employee_id: input.employeeId || '', territory_id: input.territoryId || '',
      area_id: input.areaId || '', dealer_id: input.dealerId || '', depot_id: input.depotId || '', product_id: input.productId || '',
      product_group_id: input.productGroupId || '', pack_id: input.packId || '', bank_id: input.bankId || '',
      currency_code: input.currencyCode || 'UNCONFIRMED', unit_code: input.unitCode || '', quantity: input.quantity,
      amount: input.amount, numeric_value: input.numericValue, text_value: input.textValue || '', status_code: input.statusCode || '',
      quality_status: input.qualityStatus || 'VALID', relationship_version: input.relationshipVersion || '1.0.0',
      attributes_json: U.safeJson(input.attributes), source_hash: input.sourceHash || U.hash(input.sourceValues || input.recordId)
    };
    return record;
  }

  return { dealer: dealer, employee: employee, product: product, inferCategory: inferCategory, workingHours: workingHours, masterRecord: masterRecord };
}());
