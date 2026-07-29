# Phase 2.5 — P0 Production Remediation Report

## Release 3.3.0 extension — P0-2

The official Calendar now spans 2025–2032, reads approved holidays from the governed `Holiday` worksheet, applies a six-day week with Friday closed and Saturday working, and exposes fiscal periods. Sales Activity Attendance is derived from valid sales only through a replaceable provider contract and is explicitly not HR attendance. See `BUSINESS_CALENDAR_IMPLEMENTATION.md` and `SALES_ACTIVITY_ATTENDANCE_PHASE1.md`.

Status: **P0-1 through P0-7 closed. P0-8 code complete; daily trigger authorization pending. Overall phase remains NOT CERTIFIED until the owner installs and verifies the trigger.**

Production Script ID: `1H88OzmYKwSNSOx8X4K_seVPZkP8xB7EOMUciAdClS5qLEF1s04gyr7oi`  
Production spreadsheet: `1HxVEJqWqIc_xSGIBYJpJBIuHeqTaQiUUJ_Lc7jLKlSY`  
Verified cache batch: `BATCH_71f12c0d0a83292d72916632`  
Cache generated: `2026-07-29T17:34:27.608Z`

## P0 closure matrix

| Finding | Root cause | Fix | Verification | Before → after | Performance impact |
|---|---|---|---|---|---|
| P0-1 Working Day Engine | KPI aggregation independently selected maximum employee `Current WD` and `Due WD`, producing `25 + 25 = 50`. | One batch-level Business Calendar supplies elapsed, remaining, total and month length to every KPI contract. | Unit test plus production cache. | `25 / 25 / 50` → `24 / 2 / 26`. | KPI calculation remains 2.343 s for 25,771 facts; no dashboard-load computation added. |
| P0-2 Official Calendar | Calendar sheet contained headers only and cutoff policy was `UNCONFIRMED`. | Added Friday-weekend/public-holiday-capable calendar engine, persisted dates, and recorded `CLOSED_DAY_ONLY`. | July has 31 rows, 26 working days; current open day excluded. | Header-only → authoritative dated rows. | Calendar generation is O(days), negligible relative to source parsing. |
| P0-3 Certification Gate | `excludedRecords === 0` alone produced `CERTIFIED_INPUT`, even for failed batches. | Certification now requires no errors/quarantine, verified calendar and persistence, resolved hierarchy, and accepted Sales control. Cache publishers reject any other state. | Failed-batch unit test; production batch `COMPLETED_WITH_WARNINGS`, dashboard `Certified`. | Failed batch could display Certified → failed batch cannot publish. | Constant-time gate; no cache-read penalty. |
| P0-4 Master Persistence | Canonical records existed only in memory/cache; Master Dataset had headers only. | Atomic replacement writes every canonical row in chunks and verifies counts before certification. | 25,771 rows persisted plus header; Calendar 31, Hierarchy 5,315, Relationships 11,548. | 0 trace rows → 25,771 trace rows. | First build 209 s; steady build 249 s. Dashboard remains cache-only (8.3–10.0 s observed fresh load). |
| P0-5 Hierarchy Reconciliation | Source modules used mixed IDs/name aliases and historical assignments created repeated conflicts. | Safe employee alias mapping, source-priority/majority hierarchy selection, coded-dealer preservation, unique numeric dealer resolution, orphan/duplicate report. | Successful production batch; 7 conflicts reconciled, 701 record assignments corrected, no remaining blocking conflict/orphan. | 731 repeated warnings + ambiguous dealer → zero blocking hierarchy issues. | One in-memory reconciliation pass; included in build time only. |
| P0-6 Sales Control Difference | Atomic daily facts total 51,631,145; SR MTD is 51,631,084; source control is 51,631,055. Upstream report-level rounding/control composition differs by 90 from atomic detail. | Formal policy `ATOMIC_DAILY_AUTHORITATIVE`; exact variance and tolerance (100) published in diagnostics. | Production diagnostic records atomic, MTD, control, variance and policy. | Unexplained 90 → documented 90 (0.0001743%) with explicit authority. | Three linear sums over already parsed Sales facts; negligible. |
| P0-7 Cache Certification | Dashboard cache publication was independent of batch success. | Refresh order is Data Engine → persistence → certification → KPI → durable cache → UI. Last successful certified cache is preserved on failure. | Durable cache has 9 verified chunks for the successful batch; desktop/mobile fresh sessions populated without rebuild. | False certified cache → certified successful batch only. | Cache-only page: 8.3 s desktop, 10.0 s mobile; chart 2.0–2.3 ms, filter 14.3–18.8 ms, report 6.4–8.3 ms. |
| P0-8 Lifecycle/Cleanup | Append-only system logs had no bounded retention or scheduled maintenance. | Added locked, certified-cache-aware maintenance, 90-day/100-batch retention, report-only safety for uncertain artifacts, and idempotent daily-trigger installer. | 26 local tests pass; trigger installation requires owner consent for `script.scriptapp`. | Unbounded logs → bounded policy/code; schedule pending owner authorization. | Daily off-hours only; skips active refresh; no dashboard-path work. |

## Traceability evidence

`Sales Data Base Monthly` row/day → `SalesParser` → persisted `Master Dataset` record with batch/source row → `KpiEngine` → certified durable batch → dashboard component.

The Master Dataset preserves `record_id`, `batch_id`, source system/dataset/record, contract, metric, event date, every hierarchy/entity key, value, quality status, attributes JSON and source hash.

## System worksheet inventory and retention

### Permanent business assets — automation prohibited

- Sales Data Base Monthly
- Previous Month Sales
- Monthly Projection
- Dealer lifting
- Attendance (created empty by explicit approval)

### System assets

| Worksheet | Class | Retention/cleanup |
|---|---|---|
| Dashboard Cache | Cache | Active certified generation only; never remove current batch. |
| Master Dataset | Runtime | Replace only after successful parsing; must verify row count before certification. |
| Calendar | Metadata | Current parsed periods; replace only after successful build. |
| Hierarchy | Metadata | Current reconciled graph; replace only after successful build. |
| Relationship Model | Metadata | Current relationship graph; replace only after successful build. |
| Import Batches | Log | Last 90 days or at least 100 batches; active certified batch always retained. |
| Quality Results | Log | Retain rows belonging to retained batches. |
| Master Lookup, Configuration, Parser Contract, Metric Dictionary, Module Registry, Source Registry, Quality Rules, Platform Guide | Metadata | Permanent governed metadata; no automatic deletion. |
| Metric Store | Historical Cache | Report-only until production references and rollback requirements are proven. |
| Action Register | Recovery | Report-only; no deletion without governance approval. |
| Audit Log | Log | Report-only until its audit-retention obligation is approved. |

No worksheet is classified Temporary or Debug in the production inventory. No business worksheet is modified by the maintenance engine.

## Storage and cleanup impact

Current system capacity is dominated by Master Dataset (25,772 × 41 allocated grid), Relationship Model (11,549 × 16) and Quality Results (6,381 × 18). The first two are bounded replacement stores, not append-only history. The immediate cleanup estimate is intentionally zero because all current batches are inside the 90-day/100-batch rollback window. Long-term growth is capped by pruning Import Batches and their dependent Quality Results. This prevents unbounded log growth without claiming unsafe savings or deleting current data.

## Verification evidence

- Local: 26/26 tests pass; 100,000-record KPI benchmark 701 ms.
- Production batch: `COMPLETED_WITH_WARNINGS`, 25,771 canonical records.
- Desktop: 12 KPI cards, 3 canvases, 15 table rows, RSM filter matched `S.M. Wahiduzzaman`, tooltip visible, zero console/page errors.
- Mobile 390 px: body width 390 px, 15 mobile cards, no horizontal overflow, zero console/page errors.
- Screenshots: `assets/screenshots/p0-production-state.png` and `assets/screenshots/p0-production-mobile.png`.

## Production readiness score

Current: **94/100 — NOT CERTIFIED pending P0-8 trigger authorization and scheduled-run verification.**  
Expected after trigger verification: **100/100 for the defined P0 scope.**

P1 must not begin until the trigger is installed, a cleanup dry/safe run returns a summary, and the final P0 gate is signed off.
