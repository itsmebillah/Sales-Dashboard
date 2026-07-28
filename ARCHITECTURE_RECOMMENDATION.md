# Architecture Recommendation

## Decision

Use a layered, metadata-driven architecture. Google Sheets may remain the operational input and review surface, while Apps Script orchestrates bounded ingestion and presentation. Do not make report-shaped sheets the canonical database.

## Layers

1. **Raw** — immutable copies of each source extract plus source ID, range, batch ID and import timestamp.
2. **Staging** — typed, row-classified and unpivoted records; no business aggregation.
3. **Core** — governed dimensions, effective-dated hierarchy bridges and atomic facts.
4. **Semantic** — approved KPI definitions, forecast versions and aggregation tables.
5. **Presentation** — dashboard/API payloads optimized for filters and charts.

## Core design principles

- Stable surrogate keys with preserved source-system natural keys.
- Effective dating for employee hierarchy, territory assignment and dealer relationships.
- Long-form daily/product facts instead of one column per date or product.
- Append-only event facts for Collection, Projection and Attendance; corrections through status/version records.
- Central metric registry defining formula, grain, units, owner and effective version.
- Incremental/idempotent loads and explicit watermarks.
- Configuration for sheet IDs, header signatures and field mappings; no hard-coded column numbers in business logic.
- Least-privilege access, audit logs and separate environments for development, testing and production.

## Google Sheets + Apps Script boundary

Sheets is appropriate for controlled inputs, exception queues, mapping stewardship and lightweight output. Apps Script is appropriate for orchestration, validation and small bounded transforms. At sustained high volume or long retention, store normalized facts in a query-oriented backend such as BigQuery and let Apps Script/Sheets consume aggregates.

## Attendance-ready design

Attendance connects through `employee_id`, `work_date` and effective territory assignment. Adding it creates a new fact and metrics; it does not alter Sales, Lifting or Collection schemas. Restrict raw attendance access and expose only authorized derived measures.

## Source-contract requirements

For every source, register owner, source workbook ID, source tab/range, refresh SLA, timezone, grain, required columns, header signature, key policy, allowed schema changes and reconciliation totals.
