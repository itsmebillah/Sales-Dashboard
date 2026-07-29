# KPI Traceability Audit

## Traceability status

The parser creates deterministic `source_record_id`, `record_id`, `attributes_json.sourceRow` and `source_hash` fields in memory. The production `Master Dataset` sheet contains no rows after its header, and the certified dashboard cache contains aggregates rather than record lineage. Therefore the complete required chain is **broken between Parser and persisted Master Dataset**.

## Source-to-component matrix

| Displayed value | Production source and rows | Parser / canonical metric | KPI Engine | Certified cache | Dashboard component | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Net Sales | `Sales Data Base Monthly!Q5:AU918`, SR rows only | `SalesParser` → daily `SALES_AMOUNT`; source row stored in attributes | SUM accepted records | `executive.sales`; hierarchy entity `sales` | Net Sales card, performance/flow charts, reports | Additive value verified; durable row trace absent |
| Target | `Sales Data Base Monthly!BM5:BM918` | `SalesParser` → `TARGET_AMOUNT` | SUM | `executive.target`; hierarchy `target` | Target card, performance chart, reports | Verified |
| Achievement | Sales and Target above | Derived | `sales / target`, null on zero | `achievementPct` | Card, gauge, reports | Verified |
| Gap | Sales and Target above | Derived | `target - sales` | `gap` | Target note, gauge | Verified |
| Forecast | Sales daily facts; AY Current WD; BA Due WD; BB Total WD | `WORKING_DAYS_ELAPSED`, `DUE_WORKING_DAYS`, `TOTAL_WORKING_DAYS` | `Sales / Current WD * Total WD` | `forecast`, `forecastBase` | Forecast card/chart/report/forecast panel | Traceable formula; inputs invalid; not certified |
| Average Daily | Same as Forecast | Same | `Sales / Current WD` | `averageDailySales` | Daily Average card/forecast panel | Not certified |
| Required Daily | Sales, Target and Due WD | Same | `max(Target-Sales,0) / Due WD` | `requiredDailySales` | Required Daily card/forecast panel | Not certified |
| Collection | `Monthly Projection!A2:M764`, Type=Collection | `TransactionParser` → `COLLECTION_AMOUNT`, record `TXN:<TransactionID>` | SUM | `executive.collection` | Collection card, flow chart, reports | Company total verified; hierarchy identity incomplete |
| Projection | Same range, Type=Projection | `TransactionParser` → `PROJECTION_AMOUNT` | SUM | `executive.projection` | Projection card, flow chart, reports | Company total verified; hierarchy identity incomplete |
| Lifting | `Dealer lifting!J6:J993`, dealer detail rows | `LiftingParser` → `LIFTING_AMOUNT` | SUM | `executive.lifting` | Lifting card/flow/report | Company total verified |
| Stock | `Dealer lifting!K6:K993` | `LiftingParser` → `STOCK_AMOUNT` snapshot | latest per dealer then SUM | `executive.stock` | Lifting note/flow/report | Value verified; as-of semantics provisional |
| Secondary | `Dealer lifting!L6:L993` | `LiftingParser` → `SECONDARY_AMOUNT` | SUM | `executive.secondary` | Secondary card/flow | Value verified; definition provisional |
| Product quantity | `Sales Data Base Monthly!CJ5:DS918` with product/pack/group context rows 1–4 | `SalesParser` → `PRODUCT_QUANTITY` | SUM compatible `SOURCE_UNIT` | `productVolume`, Product hierarchy | Products card/rank/report | Total verified; 32 products have facts from 36 configured product columns |
| Growth | Current daily Sales plus historical monthly records | `HISTORICAL_SALES_AMOUNT` | `(current-prior)/prior` only when current >= total WD | `growthPct` | Growth card/reports | Not displayed; comparability logic blocked by WD defect |
| Momentum | Current daily Sales | daily `SALES_AMOUNT` | recent up-to-3 dates vs preceding window | `momentumPct` | Momentum card/forecast/risk | Formula reproducible; cutoff policy absent |
| Entity counts | Every accepted record across Sales, history, Lifting and transactions | Entity IDs on records | Distinct sets | dealer/SR/TSO/RSM/product counts | KPI notes/card | Arithmetic traceable but labels misstate mixed-domain population |
| Rank / contribution | Entity KPI contracts | Derived | sort by Sales or product quantity; divide by type total | hierarchy entity `rank`, `contributionPct` | charts/rankings/reports | Formula verified; peer/hierarchy groups not governed |
| Risks / AI insights | Derived KPI contracts | N/A | hard-coded deterministic thresholds | `risks`, `insights` | Risk and AI panels | Traceable to KPI values; thresholds lack business approval |

## Manual record traces

### Current Sales row 6

- Source: `Sales Data Base Monthly`, row 6, SR `MD.Habib`, employee 3018, dealer `M/S Brother Traders (2499)`, day 1 `13,483`, day 2 `7,245`, daily recomputation `196,671`, source MTD `196,671`, target `208,835`.
- Parser: `SalesParser`; `source_record_id=6:3018`; day facts become `SALES_AMOUNT` dated 2026-07-01 and 2026-07-02; source row is placed in `attributes_json`.
- Master: records exist only in the execution object; no row exists in production `Master Dataset`.
- KPI: facts contribute to Company, RSM S.M. Wahiduzzaman, TSO Mintu Sikder, SR 3018 and the canonical dealer.
- Cache/dashboard: amounts are included in aggregate cards and entity contracts; individual record IDs are not retained.

### Current Sales row 122

- Source: SR `Md.Abdul Motin`, daily sum `527,976`, source MTD `527,971`, variance `5`.
- Parser/KPI: daily atomic sum `527,976` is used.
- Control result: aggregation policy is followed, but the source variance remains unexplained and blocks zero-difference certification.

### Collection row 2

- Source: `Monthly Projection` row 2, `COL_1783163180517_V0CFS`, 2026-07-04, Nafiza Enterprise, amount `20,000`, status Submitted.
- Parser: `TransactionParser`; `record_id=TXN:COL_1783163180517_V0CFS`; metric `COLLECTION_AMOUNT`.
- KPI/cache/dashboard: contributes `20,000` to Company Collection `30,384,399`; dealer/RSM attribution depends on identity crosswalk.
- Master persistence: absent.

### Projection row 4

- Source: `Monthly Projection` row 4, `PRJ_1783175921578_SFS17`, 2026-07-05, Sehjad Traders, amount `30,000`.
- Parser: `PROJECTION_AMOUNT` with immutable transaction ID.
- KPI/cache/dashboard: contributes to Company Projection `2,451,650`.
- Master persistence: absent.

### Lifting row 6

- Source: `Dealer lifting` row 6, dealer code 166, M/S. Mondol Traders, Lifting `92,717`, Stock `212,993`, Secondary `22,895`.
- Parser: `LiftingParser`; source record `166:2026-07-01`; metrics `LIFTING_MTD_AMOUNT`, `STOCK_AMOUNT`, `SECONDARY_AMOUNT`, plus daily Lifting where populated.
- KPI/cache/dashboard: contributes to Company totals Lifting `28,489,264.15`, Stock `39,458,871.87`, Secondary `35,020,413.03`.
- Master persistence: absent.

### Previous Month Sales row 6

- Source: `Previous Month Sales` row 6, June daily recomputation `212,680`, MTD `212,679`.
- Parser: `HistoricalSalesParser` discards June daily and MTD facts and retains only earlier monthly history columns.
- Dashboard: this June daily record does not contribute to daily comparison or forecast.

## No-magic-number conclusion

The formulas and field paths are identifiable in code, but durable per-record traceability does not exist. No number can be certified as fully traceable until the canonical records and their source-row lineage are persisted and the certified cache batch references that exact persisted generation.

