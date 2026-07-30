# Post-P1 Total System Audit

Release: 3.6.0  
Environment: original production Sheet, bound Apps Script project, and production Web App only.

## Audit result

The certified calculation pipeline, three-day sales-posting maturity rule, hierarchy contracts, cache certification gate, and exact-number policy remain correct. No approved KPI formula was changed. The application layer was upgraded to a light-first, color-centric BI workspace after verified UI defects were corrected.

## Production data audit

- Active certified batch before the UI release: `BATCH_06272af7d1344ec4a55e35bb`.
- Source rows: 3,687; accepted source rows: 2,384; persisted master facts: 35,168.
- Certified cache: ten checksummed durable chunks generated 2026-07-30 05:42:30 Asia/Dhaka.
- Forecast cutoff: 2026-07-27; matured working days: 23; remaining working days: 3.
- Matured Sales: 51,604,280; previous-month comparable Sales: 57,116,859; baseline forecast: 58,335,273.04.
- The current batch contains duplicate-header warnings from source-sheet layout. They do not bypass certification and no rejected or quarantined source rows were recorded. Source-header normalization should remain monitored during accounting reconciliation.
- The documented Sales control variance of 90 remains governed by the approved atomic-daily-authoritative policy and is not silently changed in this release.

## Defects found and fixed

| Area | Root cause | Fix | Verification |
|---|---|---|---|
| Default theme | Theme initialization inherited the device dark-mode preference. | Light is now always the default unless the user explicitly saved dark mode. | Automated source-contract assertion and browser verification. |
| Visual hierarchy | Panels and controls used a largely uniform neutral treatment. | Added KPI-specific color surfaces, multicolor filter rail, layered light background, sticky command bar, richer navigation, chart-panel depth, and clearer risk/insight accents. | Desktop, tablet, and mobile visual audit. |
| Application feel | Navigation, filters, and cards lacked strong state and depth cues. | Added active navigation indicator, hover/focus elevation, progressive color, translucent command surface, and touch-safe responsive states. | Interaction and responsive browser audit. |
| Product validation | Browser audit compared Product volume with Sales revenue. | Audit now validates Product scope against `productVolume`, preserving the no-fake-revenue contract. | Product filter contract passes. |

## Runtime and security audit

- Initial dashboard hydration remains cache-only; it never invokes the Data Engine.
- Explicit Refresh remains the only browser action that runs Data Engine, KPI Engine, certification, and cache publication.
- The browser receives aggregate certified KPI contracts, not raw spreadsheet rows or credentials.
- Failed batches cannot replace the last certified dashboard.
- LockService concurrency protection and scheduled maintenance remain enabled.

## Quality gates

- 32 automated tests pass.
- 100,000-fact local KPI benchmark: 565 ms in the final audit run.
- Exact unabridged number formatting remains enforced.
- Business-name resolution remains enforced.
- Light default, dark opt-in, keyboard focus, touch targets, responsive cards, responsive charts, mobile report cards, sticky table headers, and tooltips are covered.

## Remaining risks

1. Cache delivery through Apps Script HTML Service remains slower than the original two-second target; the last measured fresh-session readiness was 13–15 seconds. This is a platform/runtime performance risk, not a dashboard calculation defect.
2. Duplicate source headers are accepted through deterministic header normalization and remain visible as warnings. They should be cleaned in the business worksheets during the accounting reconciliation phase, with no parser changes made beforehand.
3. Holiday rows remain subject to explicit approval status; unapproved holidays correctly do not alter working-day calculations.

## Certification decision

Application release 3.6.0 was deployed as Apps Script version 50 and passed final production browser verification. Data/accounting certification remains governed separately and is not expanded by this presentation release.

Final evidence covered 1,440-pixel desktop, 768-pixel tablet, and 390-pixel mobile viewports. Every run loaded the same certified batch from cache, selected light mode by default, rendered 12 KPI cards and three charts, enabled all nine filters, passed RSM/TSO/SR/Dealer/Product value matching, displayed working tooltips and reports, produced no console or page errors, and had no horizontal overflow. Screenshots are stored under `assets/screenshots/v3.6.0-*`.
