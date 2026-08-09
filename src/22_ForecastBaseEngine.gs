SIP.ForecastBaseEngine = (function () {
  function calculate(state, inputs) {
    var sales = inputs.sales, elapsed = inputs.currentWorkingDay, total = inputs.totalWorkingDay;
    var ads = elapsed > 0 ? sales / elapsed : null;
    var runRate = ads !== null && total > 0 ? ads * total : null;
    var salesSeries=state.daily.SALES_AMOUNT||{},cutoff=inputs.calendar&&inputs.calendar.current&&inputs.calendar.current.dataCutoffDate;
    var momentumBase=momentumResult(salesSeries,workingKeys(salesSeries,inputs.calendar,cutoff));
    var historical = historicalTrend(state.periods.HISTORICAL_SALES_AMOUNT || {});
    var priorDaily=state.daily.HISTORICAL_DAILY_SALES_AMOUNT||{},priorKeys=workingKeys(priorDaily,inputs.calendar),priorComparable=sumKeys(priorDaily,priorKeys.slice(0,elapsed)),priorTotal=sumKeys(priorDaily,priorKeys);
    var volatility = coefficientOfVariation(valuesByDate(state.daily.SALES_AMOUNT || {}));
    var elapsedRatio = total > 0 ? elapsed / total : null;
    var confidenceScore = confidence({ elapsedRatio:elapsedRatio, volatility:volatility, historyPoints:historical.points, activeDays:activeDays(state.daily.SALES_AMOUNT || {}) });
    return {
      averageDailySales: ads,
      maturedSales:sales,
      dataCutoffDate:inputs.calendar&&inputs.calendar.current&&inputs.calendar.current.dataCutoffDate,
      runRate: runRate,
      workingDayForecast: runRate,
      momentum: momentumBase.value,
      momentumDirection: momentumBase.direction,
      momentumBase: momentumBase,
      historicalTrend: historical,
      previousMonthComparableSales:priorComparable,
      previousMonthTotalSales:priorTotal,
      previousMonthAlignedDays:Math.min(elapsed,priorKeys.length),
      confidenceInputs: {
        elapsedWorkingDayRatio: elapsedRatio,
        dailyVolatility: volatility,
        historicalPeriodCount: historical.points,
        activeSellingDays: activeDays(state.daily.SALES_AMOUNT || {}),
        confidenceScore: confidenceScore
      },
      method: 'WORKING_DAY_RUN_RATE_V1',
      certification: total > 0 && elapsed > 0 ? 'BASELINE' : 'INSUFFICIENT_DATA'
    };
  }

  function seriesMomentum(series) { return momentumResult(series).value; }
  function momentumResult(series,keys) {
    keys=(keys||Object.keys(series||{}).sort()).filter(function(k){return typeof series[k]==='number'&&isFinite(series[k]);});
    var size=Math.min(3,Math.floor(keys.length/2));
    if(!size)return momentumContract(null,'INSUFFICIENT_DATA',[],[],null,null);
    var currentKeys=keys.slice(-size),comparisonKeys=keys.slice(-size*2,-size),current=average(currentKeys.map(function(k){return series[k];})),comparison=average(comparisonKeys.map(function(k){return series[k];}));
    var value=comparison===0?null:(current-comparison)/Math.abs(comparison),direction=value===null?'INSUFFICIENT_DATA':(value>0?'UP':(value<0?'DOWN':'FLAT'));
    return momentumContract(value,direction,currentKeys,comparisonKeys,current,comparison);
  }
  function momentumContract(value,direction,currentKeys,comparisonKeys,current,comparison){return{value:value,direction:direction,method:'LATEST_UP_TO_3_MATURED_WORKING_DAYS_VS_PRECEDING_EQUAL_WINDOW',formula:'(current_average - comparison_average) / abs(comparison_average)',windowSize:currentKeys.length,currentDates:currentKeys,comparisonDates:comparisonKeys,currentAverage:current,comparisonAverage:comparison};}
  function historicalTrend(periods) {
    var keys = Object.keys(periods).sort(), vals = keys.map(function(k){return periods[k];});
    if (vals.length < 2) return { slope:null, direction:'INSUFFICIENT_DATA', points:vals.length, latest:vals.length?vals[vals.length-1]:null };
    var n=vals.length,sumX=0,sumY=0,sumXY=0,sumXX=0;
    vals.forEach(function(y,x){sumX+=x;sumY+=y;sumXY+=x*y;sumXX+=x*x;});
    var slope=(n*sumXY-sumX*sumY)/(n*sumXX-sumX*sumX);
    return { slope:slope, direction:slope>0?'UP':(slope<0?'DOWN':'FLAT'), points:n, latest:vals[vals.length-1] };
  }
  function coefficientOfVariation(values) {
    if (values.length < 2) return null; var mean=average(values); if(mean===0)return null;
    var variance=values.reduce(function(a,v){return a+Math.pow(v-mean,2);},0)/(values.length-1);
    return Math.sqrt(variance)/Math.abs(mean);
  }
  function confidence(x) {
    if (x.elapsedRatio === null) return 0;
    var history = Math.min(x.historyPoints / 6, 1), elapsed = Math.min(x.elapsedRatio, 1), activity = Math.min(x.activeDays / 10, 1);
    var stability = x.volatility === null ? 0.25 : Math.max(0, 1 - Math.min(x.volatility, 1));
    return round(0.35*elapsed + 0.25*history + 0.2*activity + 0.2*stability, 4);
  }
  function valuesByDate(series) { return Object.keys(series).sort().map(function(k){return series[k];}); }
  function activeDays(series) { return Object.keys(series).filter(function(k){return series[k] > 0;}).length; }
  function average(values) { return values.length ? values.reduce(function(a,b){return a+b;},0)/values.length : null; }
  function workingKeys(series,calendar,cutoff){var rows=calendar&&calendar.rows||[],working={};rows.forEach(function(r){if(r.isWorkingDay)working[r.date]=true;});return Object.keys(series).filter(function(k){return (!rows.length||working[k])&&(!cutoff||k<=cutoff);}).sort();}
  function sumKeys(series,keys){return keys.reduce(function(n,k){return n+(Number(series[k])||0);},0);}
  function round(v,p){var f=Math.pow(10,p);return Math.round(v*f)/f;}
  return { calculate:calculate, seriesMomentum:seriesMomentum, momentumResult:momentumResult, historicalTrend:historicalTrend, coefficientOfVariation:coefficientOfVariation };
}());
