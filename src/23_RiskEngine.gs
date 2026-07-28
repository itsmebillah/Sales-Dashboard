SIP.RiskEngine = (function () {
  var defaults = {
    targetHigh: 0.75, targetMedium: 0.90,
    momentumHigh: -0.25, momentumMedium: -0.10,
    growthHigh: -0.20, growthMedium: -0.05,
    collectionHigh: 0.40, collectionMedium: 0.70,
    confidenceHigh: 0.30, confidenceMedium: 0.50
  };

  function evaluate(kpis, options) {
    var t = Object.assign({}, defaults, (options || {}).thresholds || {}), risks = [];
    Object.keys(kpis).forEach(function (key) {
      var k = kpis[key];
      addBelow(risks, k, 'TargetRisk', 'achievementPct', k.achievementPct, t.targetHigh, t.targetMedium);
      addBelow(risks, k, 'ForecastRisk', 'forecastAchievementPct', k.forecastAchievementPct, t.targetHigh, t.targetMedium);
      addBelow(risks, k, 'SalesRisk', 'momentumPct', k.momentumPct, t.momentumHigh, t.momentumMedium);
      if (k.growthComparable) addBelow(risks, k, 'PerformanceRisk', 'growthPct', k.growthPct, t.growthHigh, t.growthMedium);
      if (k.sales > 0) addBelow(risks, k, 'CollectionRisk', 'collectionFlowRatioPct', k.collectionFlowRatioPct, t.collectionHigh, t.collectionMedium);
      if (k.entityType === 'DEALER' && k.sales > 0 && k.stock <= 0) add(risks, k, 'StockRisk', 'stock', k.stock, 'HIGH', 0, 'Sales-positive dealer has no reported stock');
      if (k.forecastBase && k.forecastBase.certification !== 'INSUFFICIENT_DATA') {
        addBelow(risks, k, 'ForecastConfidenceRisk', 'confidenceScore', k.forecastBase.confidenceInputs.confidenceScore, t.confidenceHigh, t.confidenceMedium);
      }
    });
    return risks;
  }

  function addBelow(out, k, type, metric, value, high, medium) {
    if (value === null || value === undefined) return;
    if (value < high) add(out, k, type, metric, value, 'HIGH', high, 'Value below high-risk threshold');
    else if (value < medium) add(out, k, type, metric, value, 'MEDIUM', medium, 'Value below review threshold');
  }
  function add(out, k, type, metric, value, severity, threshold, reason) {
    out.push({
      riskId: SIP.Utils.uniqueId('RISK',[type,k.entityType,k.entityId,metric]), type:type, severity:severity,
      entityType:k.entityType, entityId:k.entityId, metric:metric, value:value, threshold:threshold,
      reason:reason, machineReadable:true, generatedAt:''
    });
  }
  return { evaluate:evaluate, defaults:defaults };
}());
