# ADR-007: Sheet-Bound Production Backend

Status: Accepted  
Date: 2026-07-28

## Decision

The permanent production backend is the Sheet-bound Apps Script project:

`1H88OzmYKwSNSOx8X4K_seVPZkP8xB7EOMUciAdClS5qLEF1s04gyr7oi`

The GitHub repository is the single source of truth. `.clasp.json` binds clasp
to this project, and production content must be pushed only from reviewed Git
source. The previous standalone script is no longer a production target.

Version 24 contains the complete 28-file backend and manifest. Its API
executable deployment is:

`AKfycbwVab89xreK0Eeo08ZSJ_uUgeMlYk2HYdFQlcJRHDvizvyMtDts78J14dgZ_8zh9_Di`

## Verification

An isolated remote pull returned 28 source files and `appsscript.json`. SHA-256
comparison against the repository reported zero missing or differing files.
Local tests passed 12/12, and the required functions are present:

- `getKpiSnapshot`
- `runDataEngineSelfTest`
- `runKpiEngineSelfTest`

Vercel uses `APPS_SCRIPT_DEPLOYMENT_ID` with the immutable API executable
deployment ID. Google's current `scripts.run` specification defines the path as
`/v1/scripts/{deploymentId}:run`; a Script ID is not valid in that path.
