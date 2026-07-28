# Scalability Report

## Assessment

The current three `IMPORTRANGE` staging views are acceptable for discovery and modest reporting, but the mixed-grain wide reports are not a safe analytical architecture at 50,000–100,000 rows. The primary constraint is repeated full-range parsing and workbook recalculation, not merely row count.

| Scale | Assessment | Required approach |
|---:|---|---|
| 10,000 rows | Feasible | Batch reads/writes, in-memory transforms, cached aggregates |
| 25,000 rows | Feasible with discipline | Incremental loads, unpivot once, avoid repeated scans |
| 50,000 rows | Elevated risk in Sheets/Apps Script | Partition facts, preaggregate, resumable jobs, strict payload limits |
| 100,000 rows | Backend recommended | BigQuery or equivalent canonical store; Sheets only for inputs/outputs |

## Execution and memory risks

- Wide Sales rows (123 used columns) magnify array and serialization cost.
- Full refreshes repeat unchanged history.
- Multiple Apps Script executions can overlap and duplicate work without locks/idempotency.
- Per-cell `getRange/getValue/setValue` patterns would be prohibitively slow.
- Large HTML payloads and client-side filtering would cause latency and browser memory pressure.
- `IMPORTRANGE` chains create refresh delays and upstream dependency failures.
- Apps Script execution time, memory, URL fetch, trigger and spreadsheet-service quotas vary by account and can change; Phase 2 must verify current official limits for the deployment account.

## Scale controls

- Read/write rectangular arrays in bounded batches; never loop Sheet API calls per cell.
- Normalize once per new batch and persist results.
- Increment by immutable transaction ID and source batch/as-of date.
- Partition facts by month; archive closed raw batches.
- Precompute common hierarchy/date aggregates.
- Return paginated/aggregated dashboard payloads.
- Use locks, checkpoints, retry-safe upserts and dead-letter/error queues.
- Measure execution duration, rows processed, heap/payload size and error rates.

## Migration trigger

Adopt a query backend before production if normalized facts approach 50,000 active rows with frequent refresh, require multi-year retention, or need concurrent dashboard users and cross-fact joins. Do not wait for spreadsheet failure at 100,000 rows.
