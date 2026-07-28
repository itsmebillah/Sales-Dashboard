# ADR-004: Isolated Apps Script Host

Status: Accepted  
Date: 2026-07-28

## Context

The existing historical Apps Script implementation must not be reused or
overwritten. The authenticated CLI could create a new container but did not bind
it to the already governed spreadsheet.

## Decision

Deploy the Phase 3 engine in its own new Apps Script project and explicitly open
the approved platform spreadsheet by configured ID. The host spreadsheet is only
an Apps Script container and is not a data source or consumer.

## Why this is better

- The previous implementation remains untouched.
- Deployment lifecycle and permissions are isolated.
- The engine targets the one approved spreadsheet deterministically rather than
  relying on whichever spreadsheet happens to be active.
- Future migration to a standalone script or managed runtime does not change the
  data contracts or consumer API.
