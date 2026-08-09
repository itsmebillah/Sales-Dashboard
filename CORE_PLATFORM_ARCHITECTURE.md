# Sales Intelligence Platform — Frozen Core Architecture

Version: 1.0.0  
Effective date: 2026-07-28  
Status: Frozen core; additive extensions only

## Architectural invariant

The logical `Master Dataset` is the canonical observation/event ledger and single source of truth for analytical facts. It exists only in Apps Script memory and bounded checksummed cache; the physical Sheet tab is a header-only schema contract. Parsers are the only ingestion writers. Metrics, forecasts, reports, alerts, APIs, AI insights and dashboards are consumers.

The source staging sheets remain outside the canonical core:

`Source → Source Registry → Parser Contract → Quality Rules → Master Dataset → Metric Store/Consumers`

The Phase 4 semantic path is:

`Cached Master Dataset → one-pass KPI Accumulator → shared formulas → hierarchy contracts → forecast inputs/risk/insights → KPI Cache → consumers`

No KPI module reads raw sheets or recalculates another module's formula.

Reference resolution uses `Master Lookup`, `Calendar`, `Hierarchy` and `Relationship Model`. These enrich and govern the canonical records; they do not create competing facts.

## Frozen core

The following sheet schemas are frozen at version 1.0.0:

1. `Master Dataset`
2. `Master Lookup`
3. `Calendar`
4. `Configuration`
5. `Hierarchy`
6. `Relationship Model`
7. `Parser Contract`
8. `Metric Dictionary`

Header rows carry spreadsheet change-control warnings. A breaking change requires an approved architecture decision, migration/backfill plan, version increment, consumer impact assessment and `Audit Log` entry.

Allowed changes are additive records, new lookup values, effective-dated hierarchy/relationships, new parser-contract versions and new/versioned metric definitions. Existing identifiers and meanings are immutable after publication.

## Master Dataset contract

The logical master is a long-form, module-neutral ledger supporting events, observations, snapshots and plans. It contains lineage, time, hierarchy/entity keys, product/dealer/depot/bank keys, typed values, quality state and extensible JSON attributes. Each refresh rebuilds one deterministic generation from the governed source tabs; it never appends facts to the physical `Master Dataset` tab.

This avoids adding monthly day columns, product columns, Attendance columns or module-specific schemas. Only one of the relevant typed value fields should carry a measure per record, governed by `Metric Dictionary`.

Corrections do not overwrite source history. Runtime loaders are idempotent by canonical/source keys, and batch/quality diagnostics retain versioned execution evidence without permanently duplicating every generated fact row.

## Extension contract

A future module must:

1. Register itself in `Module Registry`.
2. Register each source in `Source Registry`.
3. add/version its field mappings in `Parser Contract`.
4. Add required lookup/relationship records without changing schemas.
5. Add/version metrics in `Metric Dictionary`.
6. Emit valid `Master Dataset` records.
7. Pass `Quality Rules` and publish results to `Quality Results`.
8. Expose derived results through `Metric Store` or another read-only consumer.

Attendance therefore requires a source, parser and metrics only. Its employee-date events already fit the entity, date, event, status and value fields in `Master Dataset`.

## Operational sheets

- `Platform Guide`: human-readable contract and governance summary.
- `Module Registry`: installed/planned module catalog.
- `Source Registry`: source ownership, refresh and contract binding.
- `Import Batches`: load control, counts, checksums and watermarks.
- `Quality Rules` / `Quality Results`: publication gates and evidence.
- `Metric Store`: materialized certified KPI results for consumers.
- `Action Register`: closed-loop management actions and outcomes.
- `Audit Log`: append-only architectural and operational change history.

## Scalability boundary

The Google Sheet is the canonical contract and initial operational store, but its schema is platform-neutral. At production scale, the same tables should be implemented in BigQuery or an equivalent analytical store without changing identifiers, contracts or consumer semantics. Sheets remains a stewardship/workflow surface; Apps Script remains a thin orchestrator.

## Non-negotiable rules

- No consumer reads report-shaped source tabs as certified facts.
- No row-number joins.
- No name-only joins for certified cross-dataset metrics.
- No subtotal rows in atomic facts.
- No KPI exists outside the versioned Metric Dictionary.
- No silent schema drift or destructive correction.
- No “Outstanding” or “Recovery” label without receivable/allocation facts.
- No future module may force a core redesign; if it cannot fit, the extension contract is reviewed before implementation.
