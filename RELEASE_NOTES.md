# Release Notes

## 3.0.1 — Production Readiness Corrections

- Restored and retained the original sheet-bound Apps Script project as the
  single production host after using a standalone project only for publication
  diagnostics.
- Added certified employee, dealer, and product display-name dictionaries to the
  KPI consumer contract so visible UI never exposes canonical/hash IDs.
- Increased certified Master/KPI cache retention from 30 minutes to six hours.
- Added an explicit owner authorization and private-Sheet connectivity check.
- Updated canonical project, deployment, documentation, live links, and release
  metadata.
- Expanded the automated suite to 17 passing test groups.

## 3.0.0 — Phase 7 Production Executive BI Dashboard

- Rebuilt the Apps Script HTML Service frontend as a polished executive BI
  workspace with light and dark themes.
- Added global RSM, TSO, SR, dealer, product, and report-search controls without
  page reloads. Unsupported date, region, zone, and category dimensions are
  disclosed rather than fabricated.
- Added exact-value KPI cards, responsive Canvas charts, exact-value hover
  tooltips, achievement gauge, forecast summary, commercial-flow analysis,
  dealer and product rankings, risk monitoring, and AI-ready insights.
- Added searchable, sortable, sticky-header, paginated, CSV-exportable BI
  reports.
- Added loading skeletons, cache-miss and connection states, empty states,
  refresh elapsed-time feedback, responsive navigation, mobile layouts, and
  touch-friendly controls.
- Split the browser implementation into reusable formatting, theme, filters,
  charts, tables, and orchestration modules.
- Preserved the cache-only initial load and single-build refresh workflow. No
  KPI formula, parser, forecast, or risk calculation was changed.
- Added frontend syntax and architecture regression tests, bringing the suite to
  16 passing test groups.

Contract limitation: the certified KPI snapshot does not yet contain date
series, region, zone, or category dimensions. Certified business-name labels are
now included; the remaining dimensions require additive source and contract
enhancements in the data-accuracy phase.

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
