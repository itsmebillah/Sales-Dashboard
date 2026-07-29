SIP.BusinessCalendar = (function () {
  var U=SIP.Utils;

  function build(parsed,context) {
    var periods={};
    parsed.forEach(function(result){
      var p=result.metadata&&result.metadata.period;
      if(p&&p.periodStart)periods[p.periodStart]={start:p.periodStart,end:p.periodEnd};
    });
    var current=parsed.filter(function(x){return x.sourceId==='SRC_SALES_MONTHLY';})[0];
    if(current&&current.metadata&&current.metadata.period)periods[current.metadata.period.periodStart]=current.metadata.period;
    var asOf=(context.ingestedAt||U.nowIso()).slice(0,10),rows=[];
    Object.keys(periods).sort().forEach(function(key){
      var period=periods[key],date=new Date(period.periodStart+'T00:00:00Z'),end=new Date(period.periodEnd+'T00:00:00Z'),selling=0;
      while(date<=end){
        var iso=date.toISOString().slice(0,10),dow=date.getUTCDay(),weekend=context.config.calendar.weekendDays.indexOf(dow)>=0;
        var holiday=context.config.calendar.publicHolidays.indexOf(iso)>=0,working=!weekend&&!holiday;
        if(working)selling++;
        rows.push(calendarRow(iso,dow,weekend,holiday,working,selling));
        date.setUTCDate(date.getUTCDate()+1);
      }
    });
    var currentPeriod=current&&current.metadata&&current.metadata.period;
    var currentRows=currentPeriod?rows.filter(function(r){return r.periodStart===currentPeriod.periodStart;}):[];
    var total=count(currentRows,function(r){return r.isWorkingDay;});
    var declared=findDeclaredTotal(current);
    if(declared&&declared!==total)context.diagnostics.issue('WARN','CALENDAR_SOURCE_TOTAL_MISMATCH','Official calendar differs from source-declared monthly working days',{calendarTotal:total,sourceTotal:declared,period:currentPeriod.periodStart});
    var elapsed=count(currentRows,function(r){return r.isWorkingDay&&r.date<asOf;});
    var remaining=Math.max(0,total-elapsed);
    return {policy:context.config.calendar.cutoffPolicy,asOfDate:asOf,rows:rows,current:{periodStart:currentPeriod?currentPeriod.periodStart:'',periodEnd:currentPeriod?currentPeriod.periodEnd:'',elapsed:elapsed,remaining:remaining,total:total,monthLength:currentRows.length,sourceDeclaredTotal:declared||null},verified:!!currentPeriod&&total>0&&elapsed<=total&&remaining===total-elapsed};
  }

  function findDeclaredTotal(result){
    if(!result)return null;
    var records=result.records||[],values={};
    records.filter(function(r){return r.metric_id==='TOTAL_WORKING_DAYS';}).forEach(function(r){values[r.numeric_value]=(values[r.numeric_value]||0)+1;});
    var keys=Object.keys(values);if(keys.length)return Number(keys.sort(function(a,b){return values[b]-values[a];})[0]);
    return result.metadata&&result.metadata.monthlyWorkingDays||null;
  }
  function count(rows,predicate){return rows.reduce(function(n,r){return n+(predicate(r)?1:0);},0);}
  function calendarRow(iso,dow,weekend,holiday,working,selling){
    var d=new Date(iso+'T00:00:00Z'),month=d.getUTCMonth()+1,quarter=Math.floor((month-1)/3)+1;
    return {dateId:iso.replace(/-/g,''),date:iso,year:d.getUTCFullYear(),quarter:'Q'+quarter,monthNumber:month,monthName:['January','February','March','April','May','June','July','August','September','October','November','December'][month-1],periodStart:iso.slice(0,7)+'-01',yearMonth:iso.slice(0,7),weekOfYear:weekNumber(d),dayOfMonth:d.getUTCDate(),dayOfWeekNumber:dow,dayName:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dow],isWeekend:weekend,isHoliday:holiday,isWorkingDay:working,sellingDayIndex:working?selling:'',status:holiday?'PUBLIC_HOLIDAY':(weekend?'WEEKEND':'WORKING_DAY')};
  }
  function weekNumber(d){var start=new Date(Date.UTC(d.getUTCFullYear(),0,1));return Math.ceil((((d-start)/86400000)+start.getUTCDay()+1)/7);}
  return {build:build};
}());
