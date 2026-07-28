# Phase 5 Security and Deployment

Release: Frontend 1.0.0  
Apps Script deployment: Sheet-bound version 24

Production Script ID: `1H88OzmYKwSNSOx8X4K_seVPZkP8xB7EOMUciAdClS5qLEF1s04gyr7oi`
Production deployment ID: `AKfycbwVab89xreK0Eeo08ZSJ_uUgeMlYk2HYdFQlcJRHDvizvyMtDts78J14dgZ_8zh9_Di`

## Request path

1. A public browser requests the dashboard or same-origin `/api/kpi`.
2. The Vercel server exchanges its stored Google refresh credential for a
   short-lived access token.
3. The server invokes owner-only Apps Script `getDashboardApi` using the Apps
   Script Execution API.
4. Apps Script returns certified aggregate contracts from `SIP.KpiService`.

No Google secret, script identifier, Apps Script URL, Sheet identifier, raw
Master Dataset row, or source transaction is delivered to client JavaScript.
Missing credentials fail closed.

## Vercel configuration

The `sales-dashboard` project is Git-connected to
`itsmebillah/Sales-Dashboard`, uses `frontend` as its root directory, and uses
the Next.js framework preset. Production, preview, and development must define
the variables documented in `frontend/.env.example`.

## Extension model

The dashboard is intentionally public. A future Google Login, Workspace SSO,
OAuth provider, or role policy can be inserted at the Next.js route boundary
without changing the Apps Script KPI response or dashboard component contract.

## Security controls

- Apps Script Execution API access remains owner-only; there is no anonymous
  web app or browser-to-Apps-Script route.
- Secrets are server-only Vercel variables and are absent from Git.
- CSP, HSTS, frame denial, MIME sniffing denial, referrer, and browser-permission
  headers are set for every route.
- Production dependencies are pinned to patched PostCSS and Sharp releases.
- The production dependency audit must report zero known vulnerabilities.
