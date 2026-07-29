# Sales Activity Attendance — Phase 1

Release: 3.3.0

## Business meaning

This is **Sales Activity Attendance**, not HR attendance.

For each SR and each elapsed working day defined by the official Calendar:

- `PRESENT`: at least one valid positive `SALES_AMOUNT` record exists for the SR on that date.
- `ABSENT`: no valid positive `SALES_AMOUNT` record exists for the SR on that date.

Weekly holidays, approved government holidays, future dates, and the current open day under `CLOSED_DAY_ONLY` do not produce attendance observations.

The empty production worksheet named `Attendance` is reserved for a future HR source and is not read or written by this implementation.

## Canonical contract

- Module: `SALES_ACTIVITY_ATTENDANCE`
- Parser/derived contract: `PC_SALES_ACTIVITY_ATTENDANCE_V1`
- Provider contract: `ATTENDANCE_PROVIDER_V1`
- Metric: `SALES_ACTIVITY_ATTENDANCE_STATUS`
- Status source: `SALES_ACTIVITY_DERIVED`
- Attendance type: `SALES_ACTIVITY_NOT_HR`
- Current statuses: `PRESENT`, `ABSENT`

Each result is persisted as an employee-working-date Master Dataset observation. It remains traceable to the certified sales batch and Calendar date.

## Future HR compatibility

The Data Engine resolves attendance through a provider boundary. A future HR parser can emit the same canonical employee-date records through `ATTENDANCE_PROVIDER_V1`. The Master Dataset, KPI API, certified cache, filters, and dashboard contract do not need redesign.

Future HR statuses such as Leave, Weekly Holiday, Government Holiday, Training, Tour, and Remote Duty are deliberately not implemented in this phase.

## Limitations

No-sale activity does not prove an employee was physically absent. Conversely, a sale does not constitute HR timekeeping evidence. Therefore these values must never be used for payroll, leave, disciplinary, or statutory attendance decisions.

