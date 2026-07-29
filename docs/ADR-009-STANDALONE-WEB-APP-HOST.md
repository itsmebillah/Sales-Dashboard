# ADR-009: Standalone Production Web App Host

## Status

Accepted on 2026-07-29. This supersedes ADR-007 only for the production runtime
host. The logical data platform and private spreadsheet remain unchanged.

## Context

Apps Script versions 26 and 27 were successfully created in the former
sheet-bound project, and the Apps Script API reported valid `WEB_APP` entry
points with anonymous access and deployer execution. Nevertheless, every
published `/exec` URL returned Google HTTP 404 before `doGet()` executed.
Recreating and redeploying those entry points did not change the result.

A minimal standalone project deployed by the same Google principal, with the
same Web App access and execution settings, returned HTTP 200. This isolated the
failure to the old container-bound project rather than the account, manifest,
URL construction, or HTML Service.

## Decision

Production is hosted in the clean standalone Apps Script project:

`1hCN6POj_JDUDjXylMXnqayQMzNltFd6vOwW-yIs64aG2vqF1fK-KHoH7`

The repository remains the source of truth and `.clasp.json` targets this
project. The Data Engine already uses `SpreadsheetApp.openById()` with the
governed spreadsheet ID, so moving the runtime host does not change parsers,
Master Dataset structure, KPI formulas, forecast logic, risk rules, or cache
contracts.

The obsolete Execution API manifest entry is removed because production
dashboard rendering uses HTML Service exclusively. The manifest declares only
the Sheets scope required by the existing Data Engine.

## Security and operational consequences

- The Google Sheet remains private.
- Anonymous browsers receive aggregate dashboard data only.
- The Web App executes as its deploying owner and holds no browser credentials.
- Initial page loading still reads only certified KPI cache.
- Refresh is the only browser action that opens the configured Sheet.
- The former sheet-bound project and deployments remain intact for audit and
  rollback but are no longer production.
