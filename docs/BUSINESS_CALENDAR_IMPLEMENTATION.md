# Official Business Calendar Implementation

Release: 3.3.0  
Status: P0-2 implementation

## Authority and scope

`Calendar` is the only source of working-day, elapsed-day, remaining-day, month-length, selling-day, fiscal-period, weekly-holiday, and government-holiday truth. Sales, forecast, projection, cache certification, and Sales Activity Attendance consume it; they do not calculate these dates independently.

The calendar is generated for 2025 through 2032. The working week contains six days. Friday is the weekly holiday and Saturday is working. `CLOSED_DAY_ONLY` excludes the current open date from elapsed working days.

## Holiday governance

`Holiday` is the controlled input worksheet. Only rows with `approval_status = APPROVED` affect the production calendar. `DRAFT` and `REJECTED` rows have no effect. Holiday changes require worksheet data maintenance, not a code change.

The initial rows are research drafts and require owner approval. They were sourced from official Bangladesh Ministry of Public Administration notices; no draft date changes working-day calculations.

## Validation controls

- Calendar range: 2025-01-01 through 2032-12-31 (2,922 dates).
- Friday: non-working unless a future approved policy version changes Configuration.
- Saturday: working unless it is an approved government holiday.
- Approved holidays: non-working and retain holiday name and approval evidence.
- Selling-day index: restarts each month and increments only on working days.
- Leap years: February 29 is generated where applicable.
- Fiscal year: starts in July; fiscal quarter is derived from the configured fiscal month.
- Current-period invariant: elapsed + remaining = total working days.

## Configuration

The production `Configuration` worksheet contains the working week, weekly holiday, calendar range, fiscal start month, holiday source, approval status, and cutoff policy. Code defaults exist only as safe startup defaults; production rules are read from Configuration.

## Integration report

The Data Engine loads Configuration and approved Holiday records, generates Calendar, persists it, and then derives dependent facts. Certification evaluates the persisted master/calendar result before KPI cache publication. Dashboard hydration continues to read the certified cache only.

