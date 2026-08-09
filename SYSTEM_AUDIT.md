# Sales Intelligence Platform — System Audit

> Historical discovery snapshot from 2026-07-28. The workbook and application have changed substantially since this audit. See [README.md](README.md), [RELEASE_NOTES.md](RELEASE_NOTES.md), and [docs/README.md](docs/README.md) for the current production state.

Audit date: 2026-07-28  
Phase: Discovery only  
Audited workbook: `Sales Dashboard` (`1HxVEJqWqIc_xSGIBYJpJBIuHeqTaQiUUJ_Lc7jLKlSY`)

## Executive summary

The workbook contains three visible sheets. Each is a read-only staging view populated by one `IMPORTRANGE` formula in `A1`; the visible data is therefore a snapshot-shaped projection of a separate source workbook, not a governed database. No application code was reviewed or created.

| Sheet | Business purpose | Header | Data starts | Used rows | Used columns | Allocated grid | Source pattern |
|---|---|---:|---:|---:|---:|---|---|
| Sales Data Base Monthly | Monthly ERP sales/performance report by hierarchy and product | Rows 1–4; canonical field names on row 4 | Row 5, with interleaved group and summary rows | 918 | 123 (`A:DS`) | 1,000 × 133 | `IMPORTRANGE` from `Sheet4!A1:DS` |
| Dealer lifting | Dealer/depot stock, secondary sales and daily lifting report | Rows 1–5; canonical field names on row 5 | Row 6, with interleaved subtotal rows | 1,055 | 67 (`A:BO`) | 1,586 × 77 | `IMPORTRANGE` from `Main Sheet!A1:BO` |
| Monthly Projection | Transaction ledger containing Collection and Projection events | Row 1 | Row 2 | 734 | 13 (`A:M`) | 1,000 × 26 | `IMPORTRANGE` from `Data!A1:M` |

“Monthly Collection” is not a separate tab. Collection records are stored in `Monthly Projection`, distinguished by `Type = Collection`.

## Workbook structure

- Locale: `en_US`; timezone: `Asia/Dhaka`.
- Visible sheets: 3; no supporting or Attendance sheet was found.
- Named ranges: none returned by workbook metadata.
- Conditional-formatting rules: none returned.
- Sheet filters/filter views: none returned.
- Frozen rows/columns: none declared in sheet properties.
- Hidden sheets: none found. Hidden row/column metadata was not exposed by the connected read interface; no hidden dimensions were evidenced by the imported staging layout.
- Merged ranges: none returned. Multi-level headings use populated anchor cells and blanks; `IMPORTRANGE` spill ranges should remain unmerged.
- Data validation: no validation rules were observed in the imported data ranges.
- Formula columns: none. Each sheet has exactly one formula, the `IMPORTRANGE` in `A1`; all other visible cells are spill results.

## Dataset observations

### Sales Data Base Monthly

- Four-level report header: report/company context (rows 1–2), day/product grouping (row 3), field names and pack sizes (row 4).
- Identity/hierarchy fields occupy `A:P`; daily sales occupy `Q:AU` (days 1–31); monthly/KPI/history fields follow; product quantity fields occupy the right side of the report.
- Observed record labels after the header: 447 `SR`, 58 `T.S.O.`, 13 `RSM`, 2 `A.S.M.`, 1 `ALL`, 1 `Grade`, and 392 blank-designation rows (group labels, separators, summaries, or placeholders).
- 502 nonblank values in column `ID`, with no duplicates in this monthly snapshot.
- 404 distinct nonblank `AREA/ Point` labels were observed.
- Dates and month names are embedded in headings, so schema changes with the reporting month.
- Hyphens are widely used as presentation placeholders and must not automatically become numeric zero.

### Dealer lifting

- Rows 1–4 contain report date and national summary metrics; row 5 is the field header.
- Hierarchy: NSM/ASM → RSM/ASE → TSO → Territory/Area → Dealer → Depot/Super Dealer.
- Daily lifting columns are day 1–31. Other measures include lifting count/value, stock, secondary, SR count, day remaining, differences, opening copy, main lifting, average sales and dealer lifecycle indicators.
- 751 distinct nonblank dealer-code values in column A, with no duplicates among coded detail rows.
- 851 distinct nonblank dealer-name strings, 62 TSO names, 15 RSM/ASE names, 4 NSM/ASM names, and 25 depot/super-dealer labels.
- 228 hierarchy/subtotal rows have blank dealer code but populated management fields; they must be classified, not treated as dealers.

### Monthly Projection

- Normalized-looking event table with 13 columns and 733 records.
- 674 Collection records and 59 Projection records; all have `Status = Submitted`.
- Transaction IDs are unique: 733 distinct IDs, no duplicates.
- Collection total in the audited snapshot: 28,954,399; Projection total: 2,451,650.
- Activity spans 2026-07-01 through 2026-07-28.
- All core fields are populated: date, type, TSM_ID, RSM_ID, ASM_ID, dealer, amount and status.
- Bank is intentionally blank for 59 Projection records; Collection bank distribution is documented in the data dictionary.

## Important limitations

The three upstream workbooks referenced by `IMPORTRANGE` were not separately audited. Consequently, source-side formatting, hidden dimensions, validations, calculations, refresh ownership and ERP extraction controls remain outside the evidence boundary. Counts describe the workbook as observed on the audit date and will change with source refreshes.

## Phase 1 conclusion

The workbook is suitable as a human-readable staging/report surface, but not as the platform’s canonical data model. Phase 2 should preserve these imports as immutable raw inputs, add explicit dimensional/master data, and transform report-shaped records into governed fact tables.
