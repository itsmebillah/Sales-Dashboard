# Data Quality Report

## Summary

| Dimension | Assessment | Evidence |
|---|---|---|
| Completeness | Mixed | Transaction core fields complete; report sheets contain structural blanks/placeholders |
| Uniqueness | Good for observed IDs | 502 Sales IDs, 751 coded lifting rows and 733 transaction IDs had no duplicates |
| Consistency | Weak across datasets | Dealer codes are embedded inconsistently; only partial cross-dataset overlap |
| Validity | Requires rules | Hyphens, mixed text/numbers, name variants and summary rows share data regions |
| Timeliness | Snapshot-dependent | All data is live-spilled from external workbooks; refresh SLA is undocumented |
| Lineage | Partial | Source workbook and range are known, but upstream ERP/load processes are not audited |

## Verified issues

1. Mixed grains: Sales and Lifting combine details, headers, separators and multiple aggregation levels.
2. Schema drift: month names and days appear as columns; different months can change meaning and width.
3. Identifier inconsistency: dealer IDs may appear in parentheses, `S.L NO`, `Dealer SL`, or not at all.
4. Naming inconsistency: TSO vs TSM, ASM vs NSM/ASM, RSM vs RSM/ASE.
5. Presentation tokens: `-`, blank and zero coexist and cannot be conflated.
6. Derived and atomic values coexist without formal calculation definitions.
7. Source dependency: an upstream permission, rename, range expansion or formula error can invalidate an entire tab.
8. Transaction timestamp samples display date-only values, limiting audit sequencing within a day.
9. All 733 transactions have only one status (`Submitted`), so approval/rejection/cancellation behavior is either absent or stored elsewhere.

## Positive controls observed

- Transaction IDs are populated and unique.
- Transaction core fields have no blanks in the audited snapshot.
- Type and ID prefixes agree conceptually (`COL_` and `PRJ_`).
- Sales employee IDs and lifting dealer codes are unique within their observed detail populations.

## Recommended quality gates

- Reject duplicate immutable event IDs.
- Validate required IDs, dates, numeric ranges, currency and allowed statuses.
- Track row classification and exclude subtotal rows from fact ingestion.
- Reconcile unpivoted daily totals to supplied monthly totals within an approved tolerance.
- Reconcile dealer lifting, secondary and stock using documented equations.
- Publish unmatched-dealer, unmatched-employee and unmatched-product queues.
- Record source row count, checksum, import timestamp and rejected-row count per batch.
- Alert on header/schema changes before publishing analytics.
