# ADR-004: Isolated Apps Script Host

Status: Superseded by [ADR-007](ADR-007-SHEET-BOUND-PRODUCTION-BACKEND.md)
Date: 2026-07-28

This record explains a temporary publication path. It is not a current deployment instruction; production is the original sheet-bound project defined by ADR-007 and ADR-008.

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
