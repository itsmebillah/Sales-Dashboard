# Release Notes

## 1.1.0 — Phase 4 KPI Engine

- Added one-pass KPI aggregation over the Master Dataset.
- Added identical Company/RSM/TSO/SR/Dealer/Product contracts.
- Added executive, Sales, dealer, product, Collection, Projection and Lifting
  modules.
- Added working-day forecast inputs, momentum, historical trend, volatility and
  disclosed confidence inputs.
- Added deterministic machine-readable risks and structured insight objects.
- Added independent checksummed KPI cache and consumer APIs.
- Extended Sales parsing with historical Sales and working-day observations.
- Updated the governed Google Metric Dictionary additively with ten Phase 4
  metric definitions.
- Guarded growth until current and historical periods are comparable.
- Added KPI self-tests and a 100,000-record performance benchmark.

Verification: 12 automated test groups passed. The final local 100,000-record
aggregation benchmark completed in approximately 647–739 ms on the verification
host, below the five-second budget.

Known issues and certification limits:

- Google owner authorization is still required before CLI runtime functions can
  access the configured spreadsheet.
- Sales, Target, Lifting, Secondary, Stock and currency definitions remain
  provisional until business-owner sign-off.
- Growth is intentionally unavailable for incomplete-vs-full period comparisons.
- Product mix is source-unit-only until governed UOM conversion exists.
- No receivable recovery, outstanding, aging or DSO metric is calculated.
- Remote CLI smoke execution remains blocked by Google owner authorization; the
  deployed version and required editor-run sequence are recorded in
  `docs/PHASE4_VERIFICATION.md`.

Next recommendation: authorize and execute `runKpiEngineSelfTest()`, then
`refreshKpiSnapshot()`, review live diagnostic/coverage results, and approve the
stable consumer contract before beginning the mobile-first dashboard phase.

No dashboard, HTML, chart or Web App was created.
