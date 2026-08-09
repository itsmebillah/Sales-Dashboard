SIP.BusinessCalendar = (function () {
  var U=SIP.Utils;

  function loadSettings(spreadsheet,config){
    var settings=Object.assign({},config.calendar),sheet=spreadsheet.getSheetByName('Configuration');
    if(sheet){var values=sheet.getDataRange().getValues(),map={};values.slice(1).forEach(function(r){if(r[7]!==false)map[U.canonicalText(r[0])]=r[1];});
      settings.cutoffPolicy=U.canonicalText(map.CURRENT_DAY_CUTOFF_POLICY||settings.cutoffPolicy);
      settings.weekendDays=String(map.WEEKLY_HOLIDAY||map.WEEKEND_DAY||'FRIDAY').split(',').map(dayNumber);
      settings.workingWeekDays=Number(map.WORKING_WEEK_DAYS||settings.workingWeekDays);
      settings.startYear=Number(map.CALENDAR_START_YEAR||settings.startYear);
      settings.endYear=Number(map.CALENDAR_END_YEAR||settings.endYear);
      settings.fiscalStartMonth=Number(map.FISCAL_START_MONTH||settings.fiscalStartMonth);
      settings.holidayApprovalStatus=U.canonicalText(map.HOLIDAY_APPROVAL_STATUS||settings.holidayApprovalStatus);
      settings.postingLagDays=Number(map.SALES_POSTING_LAG_DAYS||settings.postingLagDays||3);
      settings.monthCloseDay=Number(map.MONTH_CLOSE_DAY||settings.monthCloseDay||4);
    }
    settings.holidays=readHolidays(spreadsheet.getSheetByName(config.sheets.holidays),settings.holidayApprovalStatus);
    if(settings.startYear>settings.endYear)throw new Error('Calendar start year must not exceed end year');
    return settings;
  }

  function build(parsed,context,settings) {
    settings=settings||context.config.calendar;var instant=new Date(context.ingestedAt||U.nowIso()),asOf=typeof Utilities!=='undefined'&&Utilities.formatDate?Utilities.formatDate(instant,settings.timezone||'Asia/Dhaka','yyyy-MM-dd'):instant.toISOString().slice(0,10),cutoffDate=shiftDate(asOf,-Number(settings.postingLagDays||0)),rows=[],holidayMap=settings.holidays||{};
    for(var year=settings.startYear;year<=settings.endYear;year++){
      var date=new Date(Date.UTC(year,0,1)),end=new Date(Date.UTC(year,11,31)),sellingByMonth={};
      while(date<=end){
        var iso=date.toISOString().slice(0,10),dow=date.getUTCDay(),monthKey=iso.slice(0,7),weekend=settings.weekendDays.indexOf(dow)>=0,holiday=holidayMap[iso]||null,working=!weekend&&!holiday;
        sellingByMonth[monthKey]=sellingByMonth[monthKey]||0;if(working)sellingByMonth[monthKey]++;
        rows.push(calendarRow(iso,dow,weekend,holiday,working,working?sellingByMonth[monthKey]:'',settings.fiscalStartMonth));date.setUTCDate(date.getUTCDate()+1);
      }
    }
    var current=parsed.filter(function(x){return x.sourceId==='SRC_SALES_MONTHLY';})[0],currentPeriod=current&&current.metadata&&current.metadata.period;
    var currentRows=currentPeriod?rows.filter(function(r){return r.periodStart===currentPeriod.periodStart;}):[];
    var calendarTotal=count(currentRows,function(r){return r.isWorkingDay;}),declared=findDeclaredTotal(current),total=declared||calendarTotal;
    if(declared&&declared!==calendarTotal)context.diagnostics.issue('WARN','CALENDAR_SOURCE_TOTAL_MISMATCH','Calendar-derived working days differ from authoritative Sales Data Base Monthly!AZ3',{calendarTotal:calendarTotal,sourceTotal:declared,authoritativeSource:'Sales Data Base Monthly!AZ3',period:currentPeriod.periodStart});
    var elapsed=count(currentRows,function(r){return r.isWorkingDay&&r.date<=cutoffDate;}),remaining=Math.max(0,total-elapsed),closeDate=currentPeriod?shiftDate(currentPeriod.periodEnd,settings.monthCloseDay):'';
    return {policy:settings.cutoffPolicy,asOfDate:asOf,dataCutoffDate:cutoffDate,settings:{startYear:settings.startYear,endYear:settings.endYear,weekendDays:settings.weekendDays,workingWeekDays:settings.workingWeekDays,fiscalStartMonth:settings.fiscalStartMonth,postingLagDays:settings.postingLagDays,monthCloseDay:settings.monthCloseDay},holidaySummary:{approved:Object.keys(holidayMap).length},rows:rows,current:{periodStart:currentPeriod?currentPeriod.periodStart:'',periodEnd:currentPeriod?currentPeriod.periodEnd:'',dataCutoffDate:cutoffDate,closeDate:closeDate,isClosed:!!closeDate&&asOf>=closeDate,elapsed:elapsed,remaining:remaining,total:total,monthLength:currentRows.length,calendarDerivedTotal:calendarTotal,sourceDeclaredTotal:declared||null,workingDayAuthority:declared?'Sales Data Base Monthly!AZ3':'BUSINESS_CALENDAR_FALLBACK'},verified:!!currentPeriod&&rows.length>0&&total>0&&elapsed<=total&&remaining===total-elapsed};
  }

  function readHolidays(sheet,approvedStatus){var out={};if(!sheet)return out;var values=sheet.getDataRange().getValues(),header=(values[0]||[]).map(U.headerKey),dateIndex=header.indexOf('HOLIDAY_DATE'),nameIndex=header.indexOf('HOLIDAY_NAME'),statusIndex=header.indexOf('APPROVAL_STATUS');values.slice(1).forEach(function(r){var date=U.isoDate(r[dateIndex]),status=U.canonicalText(r[statusIndex]);if(date&&status===approvedStatus)out[date]={name:U.text(r[nameIndex]),status:status};});return out;}
  function dayNumber(name){var names=['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'],n=names.indexOf(U.canonicalText(name));if(n<0)throw new Error('Unknown weekly holiday: '+name);return n;}
  function findDeclaredTotal(result){if(!result)return null;var sourceTotal=result.metadata&&result.metadata.monthlyWorkingDays;if(sourceTotal)return Number(sourceTotal);var records=result.records||[],values={};records.filter(function(r){return r.metric_id==='TOTAL_WORKING_DAYS';}).forEach(function(r){values[r.numeric_value]=(values[r.numeric_value]||0)+1;});var keys=Object.keys(values);return keys.length?Number(keys.sort(function(a,b){return values[b]-values[a];})[0]):null;}
  function count(rows,predicate){return rows.reduce(function(n,r){return n+(predicate(r)?1:0);},0);}
  function calendarRow(iso,dow,weekend,holiday,working,selling,fiscalStart){var d=new Date(iso+'T00:00:00Z'),month=d.getUTCMonth()+1,quarter=Math.floor((month-1)/3)+1,fiscalYear=month>=fiscalStart?d.getUTCFullYear()+1:d.getUTCFullYear(),fiscalMonth=((month-fiscalStart+12)%12)+1;return {dateId:iso.replace(/-/g,''),date:iso,year:d.getUTCFullYear(),quarter:'Q'+quarter,monthNumber:month,monthName:['January','February','March','April','May','June','July','August','September','October','November','December'][month-1],periodStart:iso.slice(0,7)+'-01',yearMonth:iso.slice(0,7),weekOfYear:weekNumber(d),dayOfMonth:d.getUTCDate(),dayOfWeekNumber:dow,dayName:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dow],isWeekend:weekend,isHoliday:!!holiday,isWorkingDay:working,sellingDayIndex:selling,status:holiday?'GOVERNMENT_HOLIDAY':(weekend?'WEEKLY_HOLIDAY':'WORKING_DAY'),fiscalYear:'FY'+fiscalYear,fiscalQuarter:'FQ'+Math.ceil(fiscalMonth/3),holidayName:holiday?holiday.name:'',holidayApproval:holiday?holiday.status:''};}
  function weekNumber(d){var start=new Date(Date.UTC(d.getUTCFullYear(),0,1));return Math.ceil((((d-start)/86400000)+start.getUTCDay()+1)/7);}
  function shiftDate(iso,days){var d=new Date(iso+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+Number(days||0));return d.toISOString().slice(0,10);}
  return {loadSettings:loadSettings,build:build,dayNumber:dayNumber};
}());
