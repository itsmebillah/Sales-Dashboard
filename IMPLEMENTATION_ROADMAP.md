# Implementation Roadmap

> The phase sequence below is retained as the original delivery plan. Current production status is summarized here and in [README.md](README.md), [RELEASE_NOTES.md](RELEASE_NOTES.md), and [docs/README.md](docs/README.md).

## Current delivery status

- Phase 1 — Discovery and data audit: complete.
- Phase 2 — BI specification and platform architecture: complete.
- Phase 3 — Enterprise Data Engine: implemented and deployed.
- Phase 4 — KPI and Business Calculation Engine: implemented; deterministic
  tests, performance benchmark, governed metric-registry update, and deployment
  verification are recorded in the Phase 4 release documents.
- Phase 5 — Apps Script HTML Service dashboard: implemented and deployed.
- Phase 6 — Canonical hierarchy, HR Attendance, strict period alignment,
  source working days, and corrected Momentum semantics: implemented and deployed.

The remaining sections document the original gates and exit criteria; they are not a statement that current production work is incomplete.

## Gate 0 — Audit approval

- Business owners validate dataset purpose, grain and terminology.
- Obtain and audit the three upstream source workbooks.
- Resolve open definitions and approve KPI ownership.
- Approve target platform boundary: Sheets-only pilot or Sheets + query backend.

Exit: signed data contracts and accepted Phase 1 findings.

## Phase 2 — Enterprise system architecture

- Finalize canonical schema, key registry and effective-dated hierarchy.
- Define raw/staging/core/semantic/presentation contracts.
- Define security, environment, logging, recovery and retention designs.
- Produce parser specifications from header signatures and row classifiers.

Exit: architecture decision record and testable specifications.

## Phase 3 — Data foundation

- Build controlled raw ingestion and batch ledger.
- Implement typed staging, unpivoting and row classification.
- Create dealer, employee, product, territory and depot masters/crosswalks.
- Add reconciliation and quarantine workflows.

Exit: repeatable, idempotent loads with quality reports.

## Phase 4 — Business facts and KPIs

- Publish Sales, Lifting, Inventory, Collection, Projection and Target facts.
- Implement approved KPI registry and hierarchy aggregations.
- Backtest and version forecast methods.

Exit: certified semantic datasets and metric tests.

## Phase 5 — Dashboard and operations

- Design dashboard around user decisions and authorized hierarchy scope.
- Serve aggregated/paginated payloads; add monitoring and freshness indicators.
- Conduct performance, concurrency, security and user-acceptance tests.

Exit: production readiness approval.

## Phase 6 — Attendance integration

- Confirm privacy and access policy.
- Ingest Attendance as a new fact using existing employee/date dimensions.
- Add capacity/productivity metrics without changing existing fact schemas.

Exit: attendance metrics certified independently.

## Suggested acceptance metrics

- 100% unique immutable transaction IDs.
- 100% subtotal/header exclusion from atomic facts.
- ≥99% governed dealer and employee key resolution, with the remainder quarantined.
- Reconciliation to source totals within an approved tolerance.
- Refresh SLA, failure alerts and documented recovery tested.
- Forecast accuracy measured against a named baseline over closed periods.
