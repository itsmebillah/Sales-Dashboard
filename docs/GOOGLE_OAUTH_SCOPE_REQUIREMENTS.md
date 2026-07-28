# Google OAuth Scope Requirements

Status: Production requirement  
Date: 2026-07-28

## Complete required scope list

The production refresh token must grant exactly this application scope:

```text
https://www.googleapis.com/auth/spreadsheets
```

The OAuth authorization flow must request offline access so Google issues a
refresh token. `access_type=offline` and `prompt=consent` are OAuth request
parameters, not scopes.

## Evidence by execution path

### Apps Script Execution API: `scripts.run`

Google's [`scripts.run` reference](https://developers.google.com/apps-script/api/reference/rest/v1/scripts/run)
states that the OAuth token must include a scope required by the deployed script
and directs callers to the script's Project OAuth Scopes. The execution method
does not require `script.projects` in addition to the deployed script's service
scopes.

### `getKpiSnapshot()`

`getKpiSnapshot()` calls `SIP.KpiService.get()`, which calls
`SIP.DataEngine.get()`. The data engine opens the configured spreadsheet using
`SpreadsheetApp.openById()` before reading source ranges and, when enabled,
writing diagnostic ranges.

Google documents that
[`SpreadsheetApp.openById()`](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app#openById(String))
requires:

```text
https://www.googleapis.com/auth/spreadsheets
```

### Other services

The current backend also uses `CacheService`, `LockService`, and `Utilities`.
These Apps Script runtime services do not add OAuth scopes. The manifest has no
Advanced Google Service dependencies, and the source does not invoke Drive,
Gmail, Calendar, Admin SDK, Docs, Forms, Slides, BigQuery, Maps, JDBC, or
`UrlFetchApp`.

## Scopes intentionally not required

- `https://www.googleapis.com/auth/script.projects` — manages Apps Script
  project content; it is not an additional requirement for `scripts.run`.
- `https://www.googleapis.com/auth/spreadsheets.currentonly` — insufficient
  because the backend explicitly opens the configured spreadsheet by ID.
- `https://www.googleapis.com/auth/drive` — no Drive API or `DriveApp` use.
- `https://www.googleapis.com/auth/script.external_request` — no
  `UrlFetchApp` or external request from Apps Script.
- `https://www.googleapis.com/auth/userinfo.email`, `openid`, and `email` — the
  backend does not inspect user identity. They may be requested by an OAuth
  client for identity UX, but they are not required by this execution path.

## Refresh-token regeneration checklist

1. Use the OAuth client belonging to the same standard Google Cloud project as
   the Sheet-bound Apps Script project.
2. Authenticate as a principal permitted by the API executable deployment and
   authorized to access the private spreadsheet.
3. Request `https://www.googleapis.com/auth/spreadsheets`.
4. Request offline access and force consent when a new refresh token is needed.
5. Replace `GOOGLE_OAUTH_REFRESH_TOKEN` in Vercel without printing or committing
   its value.
6. Redeploy Vercel so the new token is loaded by production functions.
