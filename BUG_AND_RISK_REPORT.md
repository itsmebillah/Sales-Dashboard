# Bug and Risk Report

No application code was tested in Phase 1. “Bug” below means a verified data/design defect or a high-confidence failure mode, not a diagnosed software defect.

| Severity | Finding | Impact | Recommended control |
|---|---|---|---|
| Critical | No governed cross-dataset dealer key | Incorrect joins and KPIs | Dealer master plus reviewed crosswalk |
| Critical | Detail and subtotal rows share ranges | Double counting | Explicit row classifier and reconciliation |
| High | All datasets depend on single-cell `IMPORTRANGE` | Whole-tab outage or stale data | Monitored ingestion with snapshots and lineage |
| High | Month/day/product encoded in columns | Schema drift and brittle parsers | Unpivot into date/product facts |
| High | Source workbooks were outside audit boundary | Unknown upstream controls | Audit sources before production design sign-off |
| High | Names used for hierarchy and dealer relationships | Broken history after renaming/reassignment | Stable IDs and effective-dated bridges |
| High | `-`, blank and zero coexist | Wrong arithmetic and completeness results | Typed parsing with explicit null/status mapping |
| Medium | Transaction status has only `Submitted` | Incomplete workflow analytics | Define lifecycle and immutable status history |
| Medium | Timestamp displays may lack time precision | Weak sequencing/auditability | Preserve ISO datetime and timezone |
| Medium | Projection and Collection share one table | Type-specific null/rule ambiguity | Separate semantic facts while retaining common event lineage |
| Medium | Forecast rules are undocumented | Unreproducible forecasts | Versioned forecast specification and backtests |
| Medium | Attendance introduces personal data | Privacy/access risk | Data minimization and role-based access |

## Open risks requiring owner decisions

- ERP export grain and whether returns/cancellations revise earlier records.
- Code reuse across regions or time.
- Currency, rounding, tax and sign conventions.
- Source refresh cadence and late-arriving corrections.
- Definition and ownership of every KPI.
- Retention, privacy and audit requirements.

## Release blockers for Phase 2 production use

Do not publish joined KPIs until dealer/employee/product key coverage thresholds, subtotal exclusion, daily-to-monthly reconciliation, source freshness, and transaction deduplication have automated tests and named owners.
