# Phase 2 Data Audit, KPI Validation and Forecast Certification

> Historical certification snapshot for the batch named below. Its `NOT CERTIFIED` decision is not the current production status. See [../RELEASE_NOTES.md](../RELEASE_NOTES.md), [SYSTEM_AUDIT_3.6.0.md](SYSTEM_AUDIT_3.6.0.md), and [README.md](README.md).

Audit date: 2026-07-29  
Production spreadsheet: `1HxVEJqWqIc_xSGIBYJpJBIuHeqTaQiUUJ_Lc7jLKlSY`  
Production Script ID: `1H88OzmYKwSNSOx8X4K_seVPZkP8xB7EOMUciAdClS5qLEF1s04gyr7oi`  
Audited cache batch: `BATCH_1fb489e5a3c14fd7f7138ed0`  

## Certification decision

**NOT CERTIFIED. Production Readiness Score: 49/100.**

The additive company totals listed below reconcile exactly to atomic source rows and the dashboard is operational. Certification is withheld because the forecast is materially wrong, the latest Data Engine batch is `FAILED`, the dashboard nevertheless says `Certified Input`, the canonical Master Dataset is not persisted, hierarchy identity is unresolved, and source control totals contain unexplained variances.

No KPI calculation, business rule, forecast model or runtime architecture was changed during this audit.

## Executive findings

| Severity | Finding | Evidence | Impact | Priority |
| --- | --- | --- | --- | --- |
| Critical | Forecast combines independent maximum Current WD and Due WD values | Dashboard: Current `25`, Due `25`, Total `50`; source month control: `26` working days; every SR `Total WD` cell is blank | Forecast `103,262,290` and 140.11% target attainment are not decision-safe | P0 |
| Critical | Certification gate ignores failed parser/relationship diagnostics | Latest batch: `FAILED`; 747 findings. Dashboard: `Certified Input` | Executives see a false certification claim | P0 |
| Critical | Master Dataset is not persisted | `Master Dataset` contains only row 1 headers while cache reports 25,771 visited records | Required row-level source-to-dashboard trace is impossible after execution | P0 |
| Critical | Cross-module employee identity is unresolved | Sales uses name-hash RSM/TSO IDs; transactions use numeric employee IDs; 731 hierarchy conflicts | RSM/TSO Collection, Projection and flow ratios do not align with Sales scope | P0 |
| High | Previous-month daily records are discarded | `HistoricalSalesParser` retains only `HISTORICAL_SALES_AMOUNT` | No daily alignment, historical curve, holiday comparison or comparable MTD growth | P1 |
| High | Official calendar and cutoff policy are absent | `Calendar` has headers only; `CURRENT_DAY_CUTOFF_POLICY=UNCONFIRMED` | Working days, partial-day treatment and forecasts cannot be certified | P1 |
| High | Source controls have unexplained variances | Atomic current Sales `51,631,145`; report control `51,631,055`; variance `90`. Atomic vs SR MTD variance `61` | Zero-difference certification criterion is not met | P1 |
| High | Count cards mix domains and periods | Dashboard 458 SR / 123 TSO / 29 RSM versus current Sales 428 / 53 / 13 | Labels imply current Sales headcount but values are union-of-record counts | P1 |
| High | Date, Region and Category filters are nonfunctional | Controls are disabled; Date has no cache contract | Required filter coverage is incomplete | P1 |
| Medium | Product filtering is not a relational Sales filter | Product facts contain quantity only; Product entity Sales/Target/Forecast are zero/null | Product drill-down can be misread as revenue performance | P1 |
| Medium | Cache-only startup is slow and unstable | Normal ready `15.920s`; two later fresh sessions timed out at 180s and 300s | Production availability target is not met | P1 |
| Medium | Currency is unapproved | `DEFAULT_CURRENCY=UNCONFIRMED` | Monetary labels cannot state a certified currency | P2 |

## Production values reconciled

| KPI | Source recomputation | Dashboard/cache | Difference | Result |
| --- | ---: | ---: | ---: | --- |
| Sales | 51,631,145 | 51,631,145 | 0 | Formula/atomic detail pass |
| Target | 73,699,354 | 73,699,354 | 0 | Pass |
| Achievement | 70.0564417430% | 70.0564417430% | 0 | Pass |
| Gap | 22,068,209 | 22,068,209 | 0 | Pass |
| Collection | 30,384,399 | 30,384,399 | 0 | Pass at Company total only |
| Projection | 2,451,650 | 2,451,650 | 0 | Pass at Company total only |
| Lifting | 28,489,264.15 | 28,489,264.15 | 0 | Pass at Company total only |
| Stock | 39,458,871.87 | 39,458,871.87 | 0 | Sum matches; snapshot semantics unapproved |
| Secondary | 35,020,413.03 | 35,020,413.03 | 0 | Sum matches; business definition provisional |
| Product quantity | 375,212 | 375,212 | 0 | Pass in source units |
| Forecast | Not certifiable | 103,262,290 | N/A | Fail |
| Average daily Sales | Not certifiable | 2,065,245.80 | N/A | Fail: cutoff/elapsed WD unapproved |
| Required daily Sales | Not certifiable | 882,728.36 | N/A | Fail: Due WD is wrong |
| Momentum | Reproducible from calendar-date series | -61.1659% | 0 to implementation | Provisional; partial-day contamination not controlled |
| Growth | Comparable MTD indicative: -19.2719% | Not displayed | N/A | Missing required comparison |

## Data integrity audit

- Current Sales source: 918 returned rows, 448 SR-labelled rows, 447 accepted rows, one blank SR slot at source row 220.
- Previous Month Sales: 918 returned rows and 424 SR detail rows.
- Monthly Projection: 763 transactions; zero duplicate IDs, zero missing dealers, zero invalid dates in production; all current statuses are `Submitted`.
- Dealer lifting: 750 dealer detail rows; zero duplicate dealer codes; source totals reconcile to parsed Lifting, Stock and Secondary.
- Current Sales has 66 SR rows where the sum of day columns differs from the source SR MTD field. Previous Month has 42 such rows.
- Latest Data Engine run visits 25,771 canonical records and reports zero quarantined records, but ignores one invalid presentation row and emits 747 batch-level findings.
- The source report control is deliberately excluded from KPI aggregation. That policy is reasonable, but the `90` reconciliation variance must be recorded and resolved before certification.

## Forecast audit

Current production formula:

`Forecast = Sales / max(Current WD) * (max(Current WD) + max(Due WD))`

Current inputs and output:

| Input | Value |
| --- | ---: |
| Current date | 2026-07-29 |
| Current Sales | 51,631,145 |
| Working Days Passed | 25 (independent maximum) |
| Remaining Working Days | 25 (independent maximum from a different SR population) |
| Total Working Days | 50 (fallback sum) |
| Run rate | 2,065,245.80 |
| Previous-month daily trend | Not used |
| Forecast | 103,262,290 |
| Confidence score | 0.7538 |
| Certification label | BASELINE |

The source report states 26 monthly working days, while SR Current/Due fields vary with employee joining/opening context and every Total WD cell is blank. Independent maxima cannot be added. Depending on the approved cutoff, a 26-day denominator would produce an indicative run-rate near `53.7m` to `58.4m`, not `103.3m`. These are sensitivity examples, not certified alternatives.

The confidence score is also not certifiable: it treats the impossible elapsed ratio `25/50` as valid and calls ten monthly points “history,” while daily prior-month data is excluded.

### Forecast improvement proposal — approval required

1. Preserve transparent working-day run rate as the baseline after Calendar and cutoff certification.
2. Ingest Previous Month Sales as `HISTORICAL_DAILY_SALES_AMOUNT`, isolated from current Sales.
3. Compare by selling-day ordinal rather than calendar day.
4. Add a historical cumulative-curve candidate: `MTD / prior cumulative share at same selling-day ordinal`.
5. Blend baseline and historical curve only after rolling-origin backtests; publish method, cutoff, confidence inputs and error.

Do not implement this proposal until the business owner approves the Calendar, cutoff policy and model experiment.

## Previous-month validation

- June has 30 calendar days; July has 31.
- Both source report controls state 26 monthly working days.
- Current atomic July Sales: `51,631,145`.
- Previous atomic June Sales: `65,409,123` including all populated daily cells.
- Full-month simple growth indication: `-21.0643%`; not comparable because July is open.
- A Friday-exclusion illustrative comparison gives July elapsed `50,257,117` versus June first 25 selling days `62,254,817`, or `-19.2719%`. It is not certifiable because Friday contains material Sales and no approved holiday calendar exists.
- June daily records are not currently added to the Master Dataset, so weekend, holiday and daily-shape effects do not influence the dashboard.

## Refresh and lock validation

| Run | Batch | Data Engine | End-to-end UI Refresh | KPI calculation | Outcome |
| --- | --- | ---: | ---: | ---: | --- |
| 1 | `BATCH_62bbbb788fe0c7ff73d363ca` | 137.223s | 148.074s | 1.774s | Cache regenerated; timestamp changed; UI populated |
| 2 | `BATCH_1fb489e5a3c14fd7f7138ed0` | 121.521s | 135.730s | 1.732s | Cache regenerated; timestamp changed; mobile populated |

The second run started after the first completed, proving the ScriptLock was released. Import Batches show no overlapping intervals. Both refreshes published a durable dashboard cache, but both Data Engine batches are recorded as `FAILED`.

## Performance validation

| Measurement | Production result |
| --- | ---: |
| Fresh dashboard ready | 15.920s in successful measured session |
| Cache health server response | 2.432s |
| Cache health browser round trip | 3.934s |
| Data Engine | 121.521s–137.223s |
| KPI Engine | 1.732s–1.774s |
| Cache publication plus transport/UI residual | approximately 9.1s–12.5s; not separately instrumented |
| Chart render | 2.6ms–4.6ms |
| Filter response | 15.4ms–33.6ms |
| Report render | 11.1ms–29.0ms |

Two cache-only fresh sessions after refresh timed out at 180s and 300s. Performance is therefore not merely above the two-second target; availability is variable.

## Executive usability review

- Sales, Target, Achievement and Gap are understandable and arithmetically correct.
- Forecast, Required Daily and Average Daily appear precise but are based on uncertified working-day inputs; they are currently misleading.
- “Certified Input” is misleading while the batch is failed.
- “Products” and employee/dealer counts need domain-qualified labels such as “active Sales SRs” and “products with reported quantity.”
- Flow bars compare Sales, Collection, Lifting, Projection, Secondary and Stock even though these use different semantics and matching coverage. Display match coverage and as-of dates.
- Product reports should be labelled quantity/mix; do not imply revenue until SKU Sales value exists.
- Date, Region and Category controls should not appear as usable filters until their contracts are populated.

## Score

| Area | Score |
| --- | ---: |
| Source and additive-value integrity | 14/20 |
| Traceability | 4/15 |
| KPI correctness | 12/20 |
| Forecast certification | 2/15 |
| Dashboard/filter validation | 6/10 |
| Refresh/reliability | 7/10 |
| Performance | 4/10 |
| **Total** | **49/100** |

## Required remediation before certification

1. Approve and populate the Calendar and current-day cutoff policy.
2. Correct working-day aggregation and re-certify forecast math.
3. Make the publication gate honor fatal diagnostics and change the badge contract.
4. Persist the canonical Master Dataset with source row lineage, or provide an equally durable governed row-level lineage store within the frozen Master Dataset contract.
5. Resolve employee and hierarchy identities across Sales, Lifting and transaction sources.
6. Resolve the `90` source report variance and the SR-level daily-versus-MTD variances.
7. Add governed daily Previous Month facts without current-period duplication.
8. Separate current Sales activity counts from all-module/all-period entity counts.
9. Complete filter contracts and validate cascading drill-down.
10. Re-run this report with zero unexplained differences before changing status to Certified.

