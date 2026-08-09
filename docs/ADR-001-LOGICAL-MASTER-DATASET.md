# ADR-001: Logical, Long-Form Master Dataset

Status: Accepted  
Date: 2026-07-28

## Context

Phase 2 created a stable 41-column Master Dataset contract and required every
consumer to use it. Phase 3 additionally prohibits copying thousands of parsed
rows into another worksheet and requires an in-memory business model and cache.
The source reports are wide, mixed-grain, and change columns by month/product.

## Decision

The Master Dataset is implemented as an in-memory long-form ledger of typed
events, observations, snapshots, and plans. The existing `Master Dataset` sheet
retains the frozen schema header as a contract and stewardship reference, but is
not populated as a duplicate data store.

Refreshes enforce this header-only boundary and bound the tab to two allocated
rows. Current-period, prior-comparable, and historical-trend records are rebuilt
from governed source tabs for each generation; they are not retained physically.

Parsers emit the same frozen fields. The logical master adds in-memory indexes,
dimensions, effective relationships, hierarchy, quality flags, metadata,
forecast placeholders, and an Attendance placeholder. Consumers receive this
model from the cache/API and never parse raw sheets.

## Why this is better

- A new month, product, metric, or Attendance event adds records, not columns.
- Atomic facts and source subtotals cannot be accidentally summed together.
- Source lineage and quality state travel with every record.
- The identical contract can migrate from Apps Script memory/cache to BigQuery
  without changing metric or consumer semantics.
- It satisfies the single-source-of-truth principle without creating a second
  large worksheet.

## Compatibility

No frozen column was renamed or removed. Attendance uses `module_id`,
`record_type`, `event_type`, `metric_id`, employee/date keys, typed values,
status, quality, and attributes already present in v1.0.0.
