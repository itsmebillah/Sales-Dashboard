# Database Dictionary

## Conventions

- `Text?` means nullable text; `Decimal?` means nullable numeric.
- Hyphen (`-`), blank, and zero are distinct source states until business rules confirm otherwise.
- Proposed canonical names are design recommendations, not current spreadsheet columns.

## Sales Data Base Monthly

Grain is mixed. An SR detail row is approximately one employee × reporting month, while TSO/RSM/ASM/ALL rows are aggregates and blank-designation rows include structural content. This must be separated before analysis.

| Source field/group | Meaning | Observed type | Proposed canonical treatment |
|---|---|---|---|
| ID | Employee/hierarchy identifier | Text | `employee_id`; preserve leading zeros |
| RSM, TSO, SR | Hierarchy names | Text | Resolve to employee dimensions using IDs, not names |
| Op., Old, NEW, Close | Operational status indicators | Text | Standardized status codes after rule confirmation |
| Designation | Row role (`SR`, `T.S.O.`, etc.) | Text | `row_type`; used to separate detail and aggregates |
| PF No. | Personnel file number | Text | Candidate employee key; confirm stability |
| Dealer SL | Dealer sequence/reference | Text/number | Not globally unique; do not use alone |
| AREA/ Point | Dealer/territory display label | Text | Parse dealer code where present and map to dealer master |
| SR QTY, DL_CD | Source operational attributes | Mixed | Definitions require business-owner confirmation |
| Day 1–31 | Daily sales amounts | Decimal? | Unpivot to `fact_sales_daily(sales_date, employee_id, amount)` |
| Sales of month | Month-to-date sales | Decimal? | Derived/check measure, not authoritative duplicate fact |
| AVG, No. of Order, WD fields | Productivity KPIs | Mixed | Store typed measures with documented calculation rules |
| Forecast/target fields | Month-end expectation and target | Decimal? | Separate plan/forecast facts with version and as-of date |
| Historical Sales | Prior monthly amounts | Decimal? | Unpivot by period; avoid month names in column names |
| Product columns | Quantity by product/SKU/pack | Decimal? | Unpivot to product-level fact using stable `product_id` |
| Product group labels | E.g. Detergent/Others | Text | Product dimension hierarchy |

The product header is two-level: row 3 contains product name and row 4 contains pack size. A product key must combine a governed product/SKU identifier with pack size; display name alone is unsafe.

## Dealer lifting

Detail grain is approximately dealer × reporting month, with daily lifting measures. Subtotal/management rows are interleaved.

| Field/group | Meaning | Type | Key/handling |
|---|---|---|---|
| S.L NO | Dealer/source code on detail rows | Text | Candidate dealer key, subject to source-system scope |
| NSM/ASM, RSM/ASE, TSO | Management hierarchy | Text | Map through employee IDs in a hierarchy bridge |
| Territory / Area | Sales territory | Text | Territory dimension candidate |
| Dealer | Dealer display name, often with `(code)` | Text | Extract code; retain original label |
| DEPO | Depot or super-dealer label | Text | Depot dimension candidate |
| Lifting Number Of | Lifting event count | Integer? | Monthly measure |
| Lifting | Lifting value | Decimal | Monthly measure/check total |
| STOCK | Dealer stock | Decimal | Snapshot fact; requires snapshot date |
| Secondary | Secondary sales | Decimal | Period measure |
| SR | SR count | Integer? | Snapshot/derived measure |
| Day Remain | Days remaining | Integer? | As-of-date attribute |
| Day 1–31 | Daily lifting | Decimal? | Unpivot to `fact_dealer_lifting_daily` |
| Diff / TSM Diff | Difference measures | Decimal? | Calculation definition required |
| Opening Copy / Main Lifting | Reconciliation measures | Decimal? | Preserve separately with lineage |
| Avg Sales / Per Day | Derived averages | Decimal? | Recalculate centrally after definition approval |
| Opened / Replace / Close Dealer | Lifecycle indicators | Mixed | Normalize as dealer lifecycle events |
| SR ID | Employee reference | Text? | Candidate foreign key; sparsely positioned in report |

## Monthly Projection (Collection + Projection)

Grain: one submitted transaction/event. Current primary key: `TransactionID`.

| Column | Meaning | Type | Constraints |
|---|---|---|---|
| TransactionID | Generated event identifier | Text | Unique and nonblank; prefix indicates type (`COL_`, `PRJ_`) |
| Date | Effective business date | Date | Required |
| Type | `Collection` or `Projection` | Enum | Required; 674/59 records respectively |
| TSM_ID | Submitting/owning TSO/TSM ID | Text | Required; naming must be standardized |
| RSM_ID | Regional manager ID | Text | Required |
| ASM_ID | Area manager ID | Text | Required |
| Dealer_Name | Dealer display label | Text | Required; replace as relationship with `dealer_id` |
| Amount | Event amount | Decimal | Required; currency/unit must be documented |
| Timestamp | Submission timestamp/date representation | Datetime | Audit attribute; current display loses time precision in samples |
| Bank | Collection channel/bank | Text? | Required for Collection; blank for Projection is valid |
| Status | Workflow state | Enum | Currently only `Submitted` |
| Submitted_By | Submitter employee ID | Text | Required |
| Submitted_At | Submission datetime/date representation | Datetime | Required; timezone Asia/Dhaka |

Collection bank counts: Islami Bank Bangladesh Ltd 279; Pubali Bank Ltd. 149; Dutch Bangla Bank Ltd. 128; Cash 99; Al-Arafah Islami Bank Ltd. 19. Projection rows have 59 blanks.

## Proposed future Attendance dataset

Recommended grain: employee × work date × attendance event/version.

| Field | Type | Purpose |
|---|---|---|
| attendance_id | Text | Immutable primary key |
| employee_id | Text | FK to employee dimension |
| work_date | Date | Business date |
| status_code | Enum | Present, absent, leave, holiday, field duty, etc. |
| check_in_at / check_out_at | Datetime? | Time measures in Asia/Dhaka |
| worked_minutes | Integer? | Derived duration |
| territory_id | Text? | Assignment at event time |
| source_system / source_record_id | Text | Lineage and idempotency |
| captured_at / updated_at | Datetime | Audit fields |

Recommended uniqueness: `(employee_id, work_date, source_system, source_record_id)` or immutable `attendance_id`, with versioning if corrections are allowed.
