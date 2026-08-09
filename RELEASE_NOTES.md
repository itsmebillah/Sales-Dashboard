# Release Notes

## 3.7.1 — Bounded Logical Master Dataset

- Confirmed that the dashboard, KPI engine, filters, hierarchy, Attendance, reports, refresh and certification use the logical in-memory/cache Master Dataset and never read the physical Sheet tab.
- Archived the single stale v3.6 physical snapshot outside the active workbook, then reduced the production `Master Dataset` to its frozen 41-column header.
- Enforced a header-only, two-row allocation during refresh so repeated builds remain idempotent and cannot regrow generated fact history.
- Kept current, prior-comparable and historical-trend facts sourced from the governed Sales tabs; no business source, diagnostic log or rollback tab was deleted.

## Repository Governance — 2026-08-09

- Consolidated the complete v3.7.0 production history onto the canonical `main` branch.
- Rewrote the repository entrypoint around the sole Apps Script production runtime, actual Sheet sources, Git-to-clasp workflow, access requirements, and versioned deployment command.
- Added a documentation authority index, marked superseded deployment guidance, and labeled old audit/readiness decisions as dated evidence.
- Removed four superseded screenshots that had no documentation or runtime references.
- Declared and locked the `playwright-core` development dependency used by the tracked production browser audit; the application runtime remains dependency-free.
- Reverified 44 regression groups, exact Apps Script source/manifest parity, and the live certified dashboard without changing Sheet data or the deployed runtime.

## 3.7.0 — Canonical Hierarchy, HR Attendance, and Period Safety

- Made `Hierarchy tab` the canonical hierarchy provider for stable ASM, RSM,
  TSO, SR, and Dealer IDs. `Growth Rate` is ignored by ingestion and growth is
  calculated only from comparable Sales facts.
- Added derived effective dates/status and Dealer Lifting-based territory
  enrichment without duplicating the hierarchy source.
- Integrated HR Attendance by stable SR ID plus explicit attendance date. The
  single `Attendance!AP2` month marker follows the selected Sales start date.
- Added Present, Absent, Attendance %, and Sales per present day to KPI contracts,
  filters, cards, and reports.
- Kept Territory, Area, and Region independent. Territory is populated from its
  governed source while unavailable Area/Region filters remain empty and disabled.
- Made `Sales Data Base Monthly!AZ3` the authoritative monthly working-day total
  for remaining-day, daily-pace, required-daily, and forecast calculations.
- Corrected Momentum to compare equal matured working-day windows through the
  governed cutoff. Its percentage and Up/Down/Flat direction now come from the
  same result instead of mixing daily momentum with the historical monthly trend.
  Approved Sheet holiday dates are normalized in the configured business
  timezone so local-midnight dates cannot shift to the preceding UTC day.
- Added strict operational period alignment. July Collection/Projection cannot
  enter August KPIs; explicitly historical Sales remains available for trends.
- Made target parsing month-independent.
- Stopped rewriting redundant `Master Dataset`, legacy `Hierarchy`, and
  `Relationship Model` sheets. They remain unchanged as rollback archives while
  the compact runtime model is certified and cached.
- Expanded regression coverage from 32 to 44 passing test groups, including a
  bounded refresh trace for production timeout diagnosis.

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
# v3.2.0 — P0 Production Remediation

- Replaced impossible per-employee working-day maxima with one official `CLOSED_DAY_ONLY` business calendar.
- Added certified row-level Master Dataset, Calendar, Hierarchy and Relationship persistence.
- Added strict failed-batch certification and cache-publication gates.
- Reconciled safe hierarchy/dealer aliases and formally documented the Sales control variance of 90.
- Added safe, locked system-data lifecycle maintenance with bounded log retention.
- Created the explicitly approved empty `Attendance` worksheet; no Attendance feature code was added.
