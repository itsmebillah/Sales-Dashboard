# Phase 5 Security and Deployment

Release: Frontend 1.0.0  
Apps Script deployment: version 3

## Request path

1. The browser authenticates against `POST /api/auth/login`.
2. Next.js issues an eight-hour HMAC-signed, HTTP-only, secure, strict-same-site
   session cookie.
3. Authenticated dashboard requests call only same-origin `/api/kpi`.
4. The Vercel server exchanges its stored Google refresh credential for a
   short-lived access token.
5. The server invokes owner-only Apps Script `getDashboardApi` using the Apps
   Script Execution API.
6. Apps Script returns certified aggregate contracts from `SIP.KpiService`.

No Google secret, script identifier, Apps Script URL, Sheet identifier, raw
Master Dataset row, or source transaction is delivered to client JavaScript.
Missing credentials fail closed.

## Vercel configuration

The `sales-dashboard` project is Git-connected to
`itsmebillah/Sales-Dashboard`, uses `frontend` as its root directory, and uses
the Next.js framework preset. Production, preview, and development must define
the variables documented in `frontend/.env.example`.

## Extension model

The session payload already includes a subject and role. A future Google Login,
Workspace SSO, or OAuth provider replaces only the login/session issuer. Role
checks can be introduced at the Next.js policy boundary without changing the
Apps Script KPI response or dashboard component contract.

## Security controls

- Apps Script Execution API access remains `MYSELF`; there is no anonymous web app.
- Secrets are server-only Vercel variables and are absent from Git.
- CSP, HSTS, frame denial, MIME sniffing denial, referrer, and browser-permission
  headers are set for every route.
- Production dependencies are pinned to patched PostCSS and Sharp releases.
- The production dependency audit must report zero known vulnerabilities.
