SIP.KpiEngine = (function () {
  var A = SIP.KpiAccumulator;

  function calculate(master, options) {
    options = options || {}; var started=Date.now(),currentPeriod=options.periodStart||master.currentPeriodStart||(master.calendar&&master.calendar.current&&master.calendar.current.periodStart)||'',aggregated=A.aggregate(master,{periodStart:currentPeriod}), contracts={};
    Object.keys(aggregated.entities).forEach(function(key){contracts[key]=finalize(aggregated.entities[key],master.calendar,master.attendance);});
    enrichRanksAndContribution(contracts);
    var risks = [];
    var generatedAt = SIP.Utils.nowIso();
    var byType = groupByType(contracts);
    var company = (byType.COMPANY || [])[0] || emptyCompany();
    var snapshot = {
      schemaVersion: '1.0.0', kpiVersion: '1.0.0', masterSchemaVersion: master.schemaVersion,
      batchId: master.batchId, generatedAt: generatedAt,
      executive: company,
      labels: buildDisplayLabels(master.dimensions || {}),
      hierarchy: { COMPANY: byType.COMPANY || [], ASM: byType.ASM || [], RSM: byType.RSM || [], TSO: byType.TSO || [], SR: byType.SR || [], TERRITORY: byType.TERRITORY || [], AREA: byType.AREA || [], DEALER: byType.DEALER || [], PRODUCT: byType.PRODUCT || [], CATEGORY: byType.CATEGORY || [] },
      periods: buildPeriodContexts(master, company, currentPeriod),
      sales: buildSalesModule(contracts),
      dealers: buildDealerModule(byType.DEALER || [], risks),
      products: buildProductModule(byType.PRODUCT || [], byType.CATEGORY || [], buildDisplayLabels(master.dimensions || {}), company),
      collection: buildCollectionModule(company, byType.DEALER || []),
      projection: buildProjectionModule(company, byType.DEALER || []),
      lifting: buildLiftingModule(company, byType.DEALER || []),
      attendance: buildAttendanceModule(master.attendance),
      forecastBase: { executive: company.forecastBase, entities: Object.keys(contracts).reduce(function (o, k) { o[k] = contracts[k].forecastBase; return o; }, {}) },
      risks: [],
      insights: [],
      quality: { acceptedRecords: aggregated.acceptedRecords, excludedRecords: aggregated.excludedRecords, periodExcludedRecords: aggregated.periodExcludedRecords, currentPeriodStart: currentPeriod,
        masterQualityFlags: (master.qualityFlags || []).length, certification: master.certification && master.certification.certified ? (master.certification.status || 'CERTIFIED') : 'NOT_CERTIFIED', certificationGate: master.certification || null },
      performance: { recordsVisited: (master.records || []).length, entityContracts: Object.keys(contracts).length, calculationMs: Date.now() - started }
    };
    return snapshot;
  }

  function finalize(state,calendar,attendance) {
    var sum=state.sums,max=state.maxima;
    var sales=sum.SALES_AMOUNT||0,rawTarget=sum.TARGET_AMOUNT||0,collection=sum.COLLECTION_AMOUNT||0;
    var totalVolume=sum.PRODUCT_QUANTITY||0;
    var avgPrice=(sales>0&&totalVolume>0)?sales/totalVolume:0;
    var target=(rawTarget>0&&avgPrice>0&&sales>rawTarget*10)?rawTarget*avgPrice:rawTarget;
    var current=calendar&&calendar.current?calendar.current.elapsed:0;
    var due=calendar&&calendar.current?calendar.current.remaining:0,total=calendar&&calendar.current?calendar.current.total:0;
    var maturedSales=sumThrough(state.daily.SALES_AMOUNT||{},calendar&&calendar.current&&calendar.current.dataCutoffDate);
    var effectiveSales=(maturedSales>0&&current>0)?maturedSales:sales;
    var effectiveElapsed=(maturedSales>0&&current>0)?current:Math.max(1,calendar&&calendar.current&&(calendar.current.elapsedToDate||calendar.current.elapsed)||1);
    var forecast=SIP.ForecastBaseEngine.calculate(state,{sales:effectiveSales,currentWorkingDay:effectiveElapsed,totalWorkingDay:total,calendar:calendar});
    var historical=state.periods.HISTORICAL_SALES_AMOUNT||{}, periods=Object.keys(historical).sort();
    var prior=forecast.previousMonthComparableSales||null;
    var growthComparable=prior!==null&&prior!==0;
    var growth=growthComparable?(sales-prior)/Math.abs(prior):null;
    var attendanceEntity=attendance&&attendance.entities&&attendance.entities[state.entityType+'|'+state.entityId]||null;
    var detSales = sum.DETERGENT_SALES || 0;
    if (sales > 0 && detSales > sales) {
      detSales = sales;
    }
    var othSales = Math.max(0, sales - detSales);
    var detSalesPct = sales > 0 ? ratio(detSales, sales) : 0;
    var othSalesPct = sales > 0 ? ratio(othSales, sales) : 0;

    var momentumValue = forecast.momentum;
    var momentumDir = forecast.momentumDirection;
    if (momentumValue === null || momentumDir === 'INSUFFICIENT_DATA') {
      if (growth !== null) {
        momentumValue = growth;
        momentumDir = growth > 0 ? 'UP' : (growth < 0 ? 'DOWN' : 'FLAT');
      } else if (target > 0) {
        var achievement = sales / target;
        var expectedPace = total > 0 ? effectiveElapsed / total : 0;
        momentumValue = achievement - expectedPace;
        momentumDir = momentumValue >= 0 ? 'UP' : (momentumValue >= -0.1 ? 'FLAT' : 'DOWN');
      } else if (sales > 0) {
        momentumValue = 0;
        momentumDir = 'UP';
      } else {
        momentumDir = 'FLAT';
      }
    }

    var trendDir = forecast.historicalTrend && forecast.historicalTrend.direction;
    if (!trendDir || trendDir === 'INSUFFICIENT_DATA') {
      trendDir = momentumDir && momentumDir !== 'INSUFFICIENT_DATA' ? momentumDir : 'Stable';
    }

    return {
      entityType:state.entityType,entityId:state.entityId,
      sales:sales,target:target,achievementPct:ratio(sales,target),gap:target-sales,
      forecast:forecast.workingDayForecast,forecastAchievementPct:ratio(forecast.workingDayForecast,target),
      requiredDailySales:due>0?Math.max(target-sales,0)/due:(target>sales?null:0),
      averageDailySales:forecast.averageDailySales,currentWorkingDay:current,dueWorkingDay:due,totalWorkingDay:total,
      dealerCount:A.count(state.sets.dealers),srCount:A.count(state.sets.srs),tsoCount:A.count(state.sets.tsos),asmCount:A.count(state.sets.asms),
      rsmCount:A.count(state.sets.rsms),productCount:A.count(state.sets.products),
      collection:collection,projection:sum.PROJECTION_AMOUNT||0,lifting:sum.LIFTING_AMOUNT||0,
      stock:A.latestSum(state,'STOCK_AMOUNT'),secondary:sum.SECONDARY_AMOUNT||0,orders:sum.ORDER_COUNT||0,
      growthPct:growth,growthReferenceAmount:prior,growthComparable:growthComparable,momentumPct:momentumValue,momentumDirection:momentumDir,
      present:attendanceEntity?attendanceEntity.present:0,absent:attendanceEntity?attendanceEntity.absent:0,attendancePct:attendanceEntity?attendanceEntity.attendancePct:null,salesPerPresentDay:attendanceEntity&&attendanceEntity.present?sales/attendanceEntity.present:null,attendancePeriodStart:attendance&&attendance.periodStart||'',
      collectionTrendPct:SIP.ForecastBaseEngine.seriesMomentum(state.daily.COLLECTION_AMOUNT||{}),
      collectionFlowRatioPct:ratio(collection,sales),periodSalesCollectionGap:sales-collection,
      productVolume:sum.PRODUCT_QUANTITY||0,detergentSales:detSales,detergentSalesPct:detSalesPct,detergentVolume:sum.DETERGENT_VOLUME||0,othersSales:othSales,othersSalesPct:othSalesPct,contributionPct:null,mixPct:null,rank:null,trend:trendDir,
      forecastBase:forecast,recordCount:state.recordCount,certification:'PROVISIONAL'
    };
  }

  function enrichRanksAndContribution(contracts) {
    var grouped=groupByType(contracts);
    var company=(grouped.COMPANY||[])[0];
    var totalCompanySales=company?company.sales||0:0;
    Object.keys(grouped).forEach(function(type){
      var rows=grouped[type];
      var sumVal=rows.reduce(function(a,x){return a+(type==='PRODUCT'?x.productVolume:x.sales);},0);
      var denom=(type!=='PRODUCT'&&totalCompanySales>0)?totalCompanySales:sumVal;
      rows.sort(function(a,b){return (type==='PRODUCT'?b.productVolume:b.sales)-(type==='PRODUCT'?a.productVolume:a.sales);});
      rows.forEach(function(x,i){x.rank=i+1;var value=type==='PRODUCT'?x.productVolume:x.sales;x.contributionPct=ratio(value,denom);if(type==='PRODUCT')x.mixPct=x.contributionPct;});
    });
  }
  function groupByType(contracts){return Object.keys(contracts).reduce(function(o,k){var x=contracts[k];o[x.entityType]=o[x.entityType]||[];o[x.entityType].push(x);return o;},{});}
  function buildSalesModule(c){return { entities:Object.keys(c).map(function(k){return c[k];}),metricSource:'KPI_CONTRACT_V1' };}
  function buildDealerModule(rows,risks){var riskBy={};risks.filter(function(r){return r.entityType==='DEALER';}).forEach(function(r){riskBy[r.entityId]=riskBy[r.entityId]||[];riskBy[r.entityId].push(r);});return {entities:rows.map(function(x){return Object.assign({},x,{dealerRisk:riskBy[x.entityId]||[]});}),top:rows.slice().sort(function(a,b){return b.sales-a.sales;}).slice(0,10),bottom:rows.filter(function(x){return x.sales>0;}).sort(function(a,b){return a.sales-b.sales;}).slice(0,10)};}
  function buildProductModule(rows, categoryRows, labels, company) {
    var sorted = rows.slice().sort(function(a,b){ return b.productVolume - a.productVolume; });
    var sortedByValue = rows.slice().sort(function(a,b){ return b.sales - a.sales; });
    categoryRows = categoryRows || [];
    labels = labels || {};
    var categoryLabels = labels.CATEGORY || {};
    var totalCompanySales = company ? company.sales || 0 : 0;
    var totalCompanyVolume = rows.reduce(function(acc, x){ return acc + (x.productVolume || 0); }, 0);
    var categories = categoryRows.map(function(cat) {
      var name = categoryLabels[cat.entityId] || cat.displayName || cat.name || cat.entityId.replace(/^PRODUCT_GROUP:/i, '');
      var catSales = cat.sales || 0;
      var catVol = cat.productVolume || 0;
      return {
        id: cat.entityId,
        name: name,
        sales: catSales,
        volume: catVol,
        salesPct: totalCompanySales > 0 ? catSales / totalCompanySales : 0,
        volumePct: totalCompanyVolume > 0 ? catVol / totalCompanyVolume : 0
      };
    }).sort(function(a,b){ return b.sales - a.sales; });
    if (!categories.length && rows.length) {
      var catMap = {};
      rows.forEach(function(p) {
        var pLabel = (labels.PRODUCT && labels.PRODUCT[p.entityId]) || p.name || p.entityId;
        var groupName = p.group || (SIP.Normalizer.inferCategory ? SIP.Normalizer.inferCategory(pLabel) : 'General Products');
        catMap[groupName] = catMap[groupName] || { name: groupName, sales: 0, volume: 0 };
        catMap[groupName].sales += (p.sales || 0);
        catMap[groupName].volume += (p.productVolume || 0);
      });
      categories = Object.keys(catMap).map(function(k) {
        var c = catMap[k];
        return {
          id: 'PRODUCT_GROUP:' + SIP.Utils.hash(k).slice(0, 16),
          name: c.name,
          sales: c.sales,
          volume: c.volume,
          salesPct: totalCompanySales > 0 ? c.sales / totalCompanySales : 0,
          volumePct: totalCompanyVolume > 0 ? c.volume / totalCompanyVolume : 0
        };
      }).sort(function(a,b){ return b.sales - a.sales; });
    }
    var detergentSales = company ? company.detergentSales || 0 : 0;
    var detergentVol = company ? company.detergentVolume || 0 : 0;
    var othersSales = Math.max(0, totalCompanySales - detergentSales);
    var othersVol = Math.max(0, totalCompanyVolume - detergentVol);
    var detergentAnalysis = {
      targetCategory: 'Detergent',
      detergentSales: detergentSales,
      detergentSalesPct: totalCompanySales > 0 ? detergentSales / totalCompanySales : 0,
      detergentVolume: detergentVol,
      detergentVolumePct: totalCompanyVolume > 0 ? detergentVol / totalCompanyVolume : 0,
      othersSales: othersSales,
      othersSalesPct: totalCompanySales > 0 ? othersSales / totalCompanySales : 0,
      othersVolume: othersVol,
      othersVolumePct: totalCompanyVolume > 0 ? othersVol / totalCompanyVolume : 0,
      totalCompanySales: totalCompanySales,
      totalCompanyVolume: totalCompanyVolume
    };
    return {
      entities: rows,
      topProducts: sorted.slice(0, 10),
      topProductsByValue: sortedByValue.slice(0, 10),
      bottomProducts: sorted.filter(function(x){ return x.productVolume > 0; }).slice(-10).reverse(),
      categories: categories,
      detergentAnalysis: detergentAnalysis,
      unitPolicy: 'SOURCE_UNIT_ONLY'
    };
  }
  function buildCollectionModule(c,dealers){return {total:c.collection,ratio:c.collectionFlowRatioPct,trendPct:c.collectionTrendPct,coveragePct:ratio(dealers.filter(function(x){return x.collection>0;}).length,dealers.filter(function(x){return x.sales>0;}).length),exceptions:dealers.filter(function(x){return x.sales>0&&x.collection===0;}).map(function(x){return x.entityId;})};}
  function buildProjectionModule(c,dealers){return {total:c.projection,dealerCount:dealers.filter(function(x){return x.projection>0;}).length,exceptions:dealers.filter(function(x){return x.sales>0&&x.projection===0;}).map(function(x){return x.entityId;})};}
  function buildLiftingModule(c,dealers){return {total:c.lifting,stock:c.stock,secondary:c.secondary,salesFlowRatioPct:ratio(c.lifting,c.sales),exceptions:dealers.filter(function(x){return x.sales>0&&x.lifting===0;}).map(function(x){return x.entityId;})};}
  function buildPeriodContexts(master,company,currentPeriod){var out={};(master.records||[]).forEach(function(r){if((r.quality_status!=='VALID'&&r.quality_status!=='CERTIFIED')||(r.metric_id!=='SALES_AMOUNT'&&r.metric_id!=='HISTORICAL_DAILY_SALES_AMOUNT'))return;var p=r.period_start;if(!p)return;var x=out[p]=out[p]||{entityType:'COMPANY',entityId:'PERIOD:'+p,periodStart:p,sales:0,target:null,forecast:null,achievementPct:null,gap:null,collection:null,projection:null,lifting:null,stock:null,secondary:null,productCount:0,srCount:0,tsoCount:0,rsmCount:0,dealerCount:0,present:0,absent:0,attendancePct:null,salesPerPresentDay:null,attendancePeriodStart:''};x.sales+=Number(r.numeric_value)||0;});if(currentPeriod&&out[currentPeriod])Object.keys(company).forEach(function(k){if(k!=='entityId'&&k!=='entityType')out[currentPeriod][k]=company[k];});return Object.keys(out).sort().map(function(k){return out[k];});}
  function buildAttendanceModule(attendance){attendance=attendance||{};return {type:attendance.type||'SALES_ACTIVITY_NOT_HR',statusSource:attendance.statusSource||'SALES_ACTIVITY_DERIVED',providerContract:attendance.providerContract||'ATTENDANCE_PROVIDER_V1',hrAttendance:!!attendance.hrAttendance,periodStart:attendance.periodStart||'',periodEnd:attendance.periodEnd||'',employeeCount:attendance.employeeCount||0,workingDays:attendance.workingDays||0,present:attendance.present||0,absent:attendance.absent||0,attendancePct:attendance.attendancePct===undefined?null:attendance.attendancePct,observationCount:attendance.observationCount||0};}
  function toInsight(r){return {type:r.type,severity:r.severity,entity:r.entityType,entityId:r.entityId,metric:r.metric,value:r.value,threshold:r.threshold,riskId:r.riskId};}
  function buildDisplayLabels(dimensions){
    var labels={COMPANY:{'COMPANY:DEFAULT':'Company total'},ASM:{},RSM:{},TSO:{},SR:{},TERRITORY:{},AREA:{},DEALER:{},PRODUCT:{},CATEGORY:{}};
    Object.keys(dimensions.employees||{}).forEach(function(id){var x=dimensions.employees[id]||{},name=x.name||x.normalizedName;if(!name)return;var role=String(x.role||'').toUpperCase();if(role==='ASM')labels.ASM[id]=name;else if(role==='RSM')labels.RSM[id]=name;else if(role==='TSO')labels.TSO[id]=name;else labels.SR[id]=name;});
    Object.keys(dimensions.territories||{}).forEach(function(id){var x=dimensions.territories[id]||{};if(x.name||x.normalizedName)labels.TERRITORY[id]=x.name||x.normalizedName;});
    Object.keys(dimensions.areas||{}).forEach(function(id){var x=dimensions.areas[id]||{};if(x.name||x.normalizedName)labels.AREA[id]=x.name||x.normalizedName;});
    Object.keys(dimensions.dealers||{}).forEach(function(id){var x=dimensions.dealers[id]||{};if(x.name||x.normalizedName)labels.DEALER[id]=x.name||x.normalizedName;});
    Object.keys(dimensions.products||{}).forEach(function(id){var x=dimensions.products[id]||{},parts=[x.name,x.pack,x.group].filter(Boolean);if(parts.length)labels.PRODUCT[id]=parts.join(' · ');if(x.group)labels.CATEGORY['PRODUCT_GROUP:'+SIP.Utils.hash(x.group).slice(0,16)]=x.group;});
    return labels;
  }
  function ratio(a,b){return a===null||a===undefined||b===null||b===undefined||b===0?null:a/b;}
  function sumThrough(series,cutoff){return Object.keys(series).filter(function(k){return !cutoff||k<=cutoff;}).reduce(function(n,k){return n+(Number(series[k])||0);},0);}
  function emptyCompany(){return finalize({entityType:'COMPANY',entityId:'COMPANY:DEFAULT',sums:{},maxima:{},latest:{},periods:{},daily:{},sets:{dealers:{},srs:{},tsos:{},rsms:{},asms:{},products:{}},recordCount:0},null,null);}
  return { calculate:calculate };
}());
