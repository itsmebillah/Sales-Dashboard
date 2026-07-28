# Phase 3 Verification Record

Date: 2026-07-28

## Automated coverage

The dependency-free Node harness evaluates the Apps Script source files in one
V8 context with mocks for Apps Script utilities, cache and locks.

Covered behaviors:

- canonical text/name/ID/number/date/working-hour normalization;
- dynamic header selection and duplicate-header diagnostics;
- Sales multi-row parsing, daily unpivoting and product metadata;
- Dealer Lifting detail classification and subtotal exclusion;
- Collection/Projection event parsing and immutable transaction IDs;
- negative-value and duplicate-record quarantine;
- safe canonical dealer relationships and logical master indexes;
- complete-generation chunked cache read/write with checksum;
- Attendance record compatibility without schema changes.

## Production validation gate

Local tests prove engine behavior against representative fixtures. The first
container execution against live sources must additionally verify actual counts,
source-total reconciliation, key-match coverage, execution time, cache size and
diagnostic writes. Until that run passes, metric certification remains
provisional.

## Deployment evidence

- Apps Script source push: 21 files completed successfully.
- Owner-only API deployment: version 1 created successfully.
- Deployment ID: `AKfycbzQ_zIEA0kZJ_AE9buVXgWY5pkIOywj6fTHW-jTAsvDKFJa6v0gWaIKfKXYnqnSfsuznw`.
- CLI runtime call was rejected by Google with a permission error despite the
  owner-only deployment. No source or platform data was changed by that failed
  call. Runtime smoke/full-source execution must therefore be initiated once in
  the Apps Script editor by the deployment owner to grant/confirm spreadsheet
  scopes, then diagnostics must be reviewed.

This limitation is deployment authorization state, not a failing unit test. It
is recorded explicitly because Phase 3 requires errors never to be hidden.
