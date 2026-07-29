# ADR-009: Standalone Production Web App Host (Rejected)

## Status

Rejected on 2026-07-29. The diagnostic host proved that the deployer account can
publish Web Apps, but production remains in the original sheet-bound project by
owner decision. No production migration is authorized.

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

## Rejected proposal

The temporary diagnostic proposal was to host production in:

`1hCN6POj_JDUDjXylMXnqayQMzNltFd6vOwW-yIs64aG2vqF1fK-KHoH7`

The repository does not target this project. `.clasp.json` remains bound to the
original production Script ID. The temporary project is not a production data
host and must not receive future releases.

The Execution API is not part of dashboard rendering. The production manifest
declares only the Web App and the Sheets scope required by the Data Engine.

## Security and operational consequences

- The Google Sheet remains private.
- Anonymous browsers receive aggregate dashboard data only.
- The Web App executes as its deploying owner and holds no browser credentials.
- Initial page loading still reads only certified KPI cache.
- Refresh is the only browser action that opens the configured Sheet.
- The original sheet-bound project remains the single production project.
