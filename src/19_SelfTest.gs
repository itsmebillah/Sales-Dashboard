/** Runtime smoke tests that do not mutate source data. */
function runDataEngineSelfTest() {
  var assertions = [];
  function check(name, condition, detail) {
    assertions.push({ name: name, passed: !!condition, detail: detail || '' });
    if (!condition) throw new Error('Self-test failed: ' + name + (detail ? ' — ' + detail : ''));
  }
  check('number normalization', SIP.Utils.number('1,234.50', []) === 1234.5);
  check('dealer code extraction', SIP.Utils.embeddedCode('Dealer Name (1234)') === '1234');
  check('name normalization', SIP.Utils.normalizeName('M/S.  Alpha Traders') === 'alpha traders');
  check('working-hours normalization', SIP.Normalizer.workingHours('5 Hr 41 Min') === 341);
  check('future attendance schema', SIP.Normalizer.masterRecord({ recordId:'T', moduleId:'ATTENDANCE', recordType:'EVENT', metricId:'ATTENDANCE_STATUS', eventDate:'2026-07-28' }).module_id === 'ATTENDANCE');
  return { passed: true, assertions: assertions, platformVersion: SIP.VERSION, schemaVersion: SIP.SCHEMA_VERSION };
}
