# Phase 2 hierarchy and Attendance implementation

## Final re-audit delta

The repository and live Apps Script project were identical at commit `e029969`,
and GitHub `main` had no newer commit. The live Sheet changed after the earlier
audit: `Hierarchy tab` now contains the announced 15 columns and Dealer Lifting
now reports August 2026. Monthly Projection still contains July 2026 events,
Attendance still had no month key, the August target header was not recognized,
and the generated Master/Hierarchy/Relationship sheets had continued growing.

No source tab was deleted. `Attendance!AP1:AP2` is the only source-sheet update:
`month_start` plus an ISO-text formula linked to `Sales Data Base Monthly!B2`.

## Architecture

```text
Sales + Dealer Lifting + Monthly Projection
                 +
Hierarchy tab (canonical IDs and assignments)
                 +
Attendance (SR ID + explicit date)
                 ↓
Parsers → hierarchy/date/period validation → canonical facts + compact models
                 ↓
Certified cache → KPI layer → Apps Script API → dashboard
```

`Hierarchy tab` is the only maintained hierarchy source. The physical `Master
Dataset`, old `Hierarchy`, and `Relationship Model` are not read by any runtime
or dashboard consumer, so they are no longer rewritten; their current contents
remain available for rollback. The logical Master and graph are generated in
memory, certified, and cached. Attendance observations are reduced to entity
aggregates and are not copied into a physical fact table.

## Actual hierarchy data model

Stored hierarchy fields used by the system are ASM ID/name, RSM ID/name, TSO
ID/name, SR ID/name, and Dealer ID/name. Phone columns remain available to the
business sheet but are not exposed to dashboard consumers. `Growth Rate` is
explicitly ignored.

The minimum runtime assignment is:

```text
asm_id, rsm_id, tso_id, sr_id, dealer_id,
territory_id, area_id, effective_from, effective_to, status
```

ASM is stored. Territory/Area is derived from the same Dealer in current-period
Dealer Lifting when available. Effective From/To defaults to the selected Sales
month, and Status defaults to ACTIVE. Optional columns with those names are
supported if the business later needs exceptions. This avoids repeating the
same month/status hundreds of times.

The live source currently reuses several SR IDs on stale rows. Where one SR has
multiple manager paths, the assignment matching the selected-month Sales dealer
is the active path and Attendance is an independent confirmation. If Sales has
no evidence, the selected-month Attendance manager path may resolve it. Stale
alternatives are reported and excluded; disagreement or multiple current paths
blocks certification.

### Legacy output mapping

| Old `Hierarchy` field | `Hierarchy tab` / runtime source | Required | Used by |
| --- | --- | --- | --- |
| hierarchy_record_id | deterministic runtime hash | Derived | graph/cache diagnostics |
| hierarchy_type | ASM/RSM/TSO/SR IDs | Derived | hierarchy filters |
| child_entity_type/id | RSM/TSO/SR IDs | Yes | aggregation and filters |
| parent_entity_type/id | ASM/RSM/TSO IDs | Yes | aggregation and filters |
| level_code/number | relationship type | Derived | graph contract |
| effective_from/to | optional source field or selected Sales month | Yes, derived by default | period-safe hierarchy |
| is_primary | one active assignment | Derived | relationship contract |
| status_code | optional Status or ACTIVE | Yes, derived by default | active-row filtering |
| source_system | fixed `Hierarchy tab` provider | Derived | lineage |
| source_record_id | source row number | Derived | diagnostics |
| version | application schema | Derived | cache compatibility |

Phone fields are not required by the dashboard. The source Growth Rate and the
large employee-level legacy output are redundant. Territory/Area remains null
only when no governed source supplies it.

## Attendance model

The parser reads stable RSM/TSO/SR IDs, day columns, and the single month marker.
Every nonblank P/A cell becomes an in-memory observation with a real ISO date.
The join key is exactly `sr_id + attendance_date`. The provider aggregates those
observations for Company, ASM, RSM, TSO, SR, Dealer, and available Territory/Area.
An explicit mismatch between Attendance month and selected Sales month is a
blocking data-quality error; the system never silently combines the periods.

## Supported KPIs and views

- Sales, target, achievement, gap, forecast, daily pace, orders, and product mix
- Lifting, stock, secondary, Collection, and Projection when their period equals
  the selected Sales period
- ASM, RSM, TSO, SR, Dealer, Product, and available Territory/Area filters/reports
- Present, Absent, Attendance %, Sales versus Attendance, and Sales per present
  day where at least one present day exists
- Dynamic growth from comparable historical Sales; never from hierarchy data

## Remaining gaps

- Monthly Projection currently contains July 2026 only, so August Collection and
  Projection correctly show zero/unavailable instead of reusing July values.
- Territory/Area coverage depends on a matching current-period Dealer Lifting
  record or an optional maintained hierarchy field.
- Historical Attendance requires historical Attendance sources; current
  Attendance is never relabeled as a different selected month.
- Business-owner sign-off is still required for target, currency, Collection,
  Projection, and territory semantics.

## Operations and rollback

1. Authorize the Apps Script owner for the bound spreadsheet and Sheets API.
2. Push repository code with clasp and create a versioned deployment.
3. Run the data/KPI self-tests, then refresh one certified batch.
4. Review Import Batches and Quality Results for period or hierarchy errors.
5. Compare current-period hierarchy counts/mappings with the archived old sheet.
6. Keep the old sheets during the observation window. Archive/delete them only
   after business equivalence sign-off and a recoverable spreadsheet revision.
