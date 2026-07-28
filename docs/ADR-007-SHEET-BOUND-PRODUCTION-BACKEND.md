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

Vercel Production `APPS_SCRIPT_ID` was updated to the bound Script ID. OAuth
now succeeds, proving the prior OAuth-client failure is resolved. `scripts.run`
currently returns `NOT_FOUND` because the bound Apps Script project has no
standard GCP project association for the OAuth client's Google Cloud project.
That association is Google project metadata rather than Apps Script source and
is not writable through clasp push or the Apps Script content API.
