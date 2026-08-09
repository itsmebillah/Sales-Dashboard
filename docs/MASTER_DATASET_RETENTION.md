# Master Dataset Retention Policy

Status: Implemented in v3.7.1

## Decision

The canonical `Master Dataset` is a logical in-memory/cache model. The physical Google Sheet tab retains only the frozen 41-column schema header and at most one blank row. It is never a fact-history store.

## Dependency classification

| Class | Data | Retention |
| --- | --- | --- |
| Runtime-required | Current refresh's normalized facts, relationships, hierarchy, Attendance and calendar context | In memory plus bounded checksummed cache for the active generation |
| Historical comparison | Prior comparable daily Sales and source-provided monthly trend totals | Rebuilt from `Previous Month Sales` and embedded governed Sales history on every refresh |
| Audit/debug | Batch status, counts, quality issues and refresh trace | `Import Batches`, `Quality Results`, cache metadata and governed maintenance retention |
| Duplicate/generated | Physical canonical rows derived from source tabs | Zero rows in the active workbook |
| Obsolete | Stale physical snapshots whose batch is not the certified dashboard batch | Archive once outside the active workbook, then remove from the active tab |

## Period requirement

The KPI engine needs the selected Sales period, an equal-scope prior daily comparison, and available monthly trend points. It reads those records from the logical Master built from the governed source tabs. Forecast confidence reaches its full history contribution at six monthly points, while the dashboard may display every source-provided point; neither requirement creates a physical Master retention period.

## Idempotency

`PersistenceEngine` rewrites the schema header, clears any fact rows, and bounds the physical tab to two allocated rows. Repeated refreshes cannot append or recreate physical Master history. The KPI engine receives the certified logical Master directly from the same refresh, and the browser reads only the compact certified dashboard cache.

## Rollback

Before the v3.7.1 cleanup, the single stale v3.6 physical snapshot was copied to a separate Google Sheets archive. The active tab's header note records the archive location and batch identifier. Source tabs, diagnostic logs, legacy hierarchy/relationship rollback tabs, and certified dashboard cache were not deleted.
