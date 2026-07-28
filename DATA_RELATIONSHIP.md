# Data Relationship Analysis

## Current-state relationships

The current sheets do not share one universally populated, enforced dealer key. Names and embedded numeric codes are mixed. Measured distinct-key overlap was:

| Pair | Matched dealer keys | Interpretation |
|---|---:|---|
| Sales ↔ Dealer lifting | 193 | Low coverage relative to 404 Sales and 841 Lifting dealer keys |
| Sales ↔ Transactions | 257 | High relative to 262 transaction dealers, but not complete |
| Dealer lifting ↔ Transactions | 151 | Name/code variation and population differences remain |

Counts use a conservative key: embedded `(numeric code)` where present, otherwise normalized name; they demonstrate why name-only joining is unsafe.

## Key assessment

| Entity/event | Primary key | Candidate keys | Unsafe keys |
|---|---|---|---|
| Transaction | `TransactionID` | Source record ID + type | Row number, timestamp alone |
| Employee | Proposed governed `employee_id` | PF No. after validation | Name, designation, row number |
| Dealer | Proposed governed `dealer_id` | ERP dealer code / lifting `S.L NO` after crosswalk | Dealer name, `Dealer SL` alone, row number |
| Product | Proposed ERP `product_id`/SKU | Product name + pack size + effective period | Product name alone, column position |
| Territory | Proposed `territory_id` | Governed territory code | Area text alone |
| Depot | Proposed `depot_id` | ERP depot/super-dealer code | Display name alone |
| Daily sales | `(sales_date, employee_id, dealer_id?, product_id?, source_record_id)` | Depends on ERP atomic grain | Report row + day column |
| Daily lifting | `(lifting_date, dealer_id, source_record_id)` | Dealer + date only if one event/day is guaranteed | Report row + day column |
| Attendance | `attendance_id` | Employee + work date + source event | Name + date |

## Target logical model

`dim_employee` stores people and stable identifiers. `bridge_employee_hierarchy` stores effective-dated reporting relationships so reorganizations do not rewrite history. `dim_dealer`, `dim_product`, `dim_territory`, `dim_depot`, `dim_date`, and `dim_bank` provide governed keys.

Facts:

- `fact_sales_daily`: daily sales amount at the lowest ERP-supported grain.
- `fact_sales_product_daily` or unified sales line fact: product quantity/value by date and SKU.
- `fact_dealer_lifting_daily`: lifting by dealer/date/depot.
- `fact_inventory_snapshot`: stock by dealer/product/as-of timestamp where available.
- `fact_collection`: one collection transaction.
- `fact_projection`: one projection submission, versioned by as-of date.
- `fact_attendance`: one attendance event/day.
- `fact_target`: target by owner, period and optional product.

## Safest merge strategy

1. Preserve raw source values and source workbook/range, import time and source row reference for traceability only.
2. Extract explicit ERP codes from labels without discarding the original text.
3. Match on governed IDs first: dealer code, employee/PF ID, product/SKU, and effective date.
4. Use a curated crosswalk for aliases and legacy codes. Crosswalk entries require effective dates and review status.
5. Use normalized-name matching only to propose candidates; never auto-approve ambiguous matches.
6. Quarantine unmatched and multiply matched records with reason codes.
7. Apply hierarchy through effective-dated relationships, not through the manager name printed on a report.
8. Make loads idempotent with source record IDs plus batch/as-of metadata.

## Hierarchy

The requested conceptual chain RSM → TSO → SR → Dealer → Product is analytically useful but not a strict single-parent entity chain: a dealer can be served by multiple SRs over time, products belong to transactions, and management assignments change. Model employee reporting and employee–dealer assignments as effective-dated bridges. Product connects to sales-line facts, not directly to a dealer master.
