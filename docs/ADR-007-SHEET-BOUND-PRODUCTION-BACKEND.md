# ADR-007: Sheet-Bound Production Backend

Status: Accepted  
Date: 2026-07-28

## Decision

The permanent production backend is the Sheet-bound Apps Script project:

`1H88OzmYKwSNSOx8X4K_seVPZkP8xB7EOMUciAdClS5qLEF1s04gyr7oi`

The bound production spreadsheet is:

`1HxVEJqWqIc_xSGIBYJpJBIuHeqTaQiUUJ_Lc7jLKlSY`

The GitHub repository is the single source of truth. `.clasp.json` binds clasp
to this project and spreadsheet, and production content must be pushed only
from reviewed Git source. No standalone or alternate script or spreadsheet is
a production target.

The production entry point is the versioned Apps Script HTML Service Web App
described by ADR-008.

## Verification

Remote content verification must compare the original bound project with the
reviewed repository source and manifest. The required production functions
include:

- `getKpiSnapshot`
- `runDataEngineSelfTest`
- `runKpiEngineSelfTest`
- `doGet`
- `getCachedDashboardApi`
- `refreshDashboardData`

Deployment verification must confirm that the versioned Web App executes as
the production owner, renders the HTML shell, reads the certified KPI cache,
and performs a full Data Engine build only after an explicit refresh.
