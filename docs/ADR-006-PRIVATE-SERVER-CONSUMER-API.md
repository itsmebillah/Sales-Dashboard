# ADR-006: Private Server Consumer API

Status: Accepted  
Date: 2026-07-28

## Decision

Apps Script remains owner-only and exposes `getDashboardApi` solely through the
Apps Script Execution API. Vercel's Next.js server obtains a short-lived Google
OAuth access token using credentials held only in encrypted environment
variables, invokes the function, and returns the compact KPI contract through a
same-origin authenticated route.

The production principal must be an owner-authorized Google identity with
explicit access to the script and its data. The browser never receives Google credentials, the script identifier, an Apps
Script URL, raw Sheet values, or Master Dataset rows. It receives only KPI,
hierarchy, risk, insight, quality, and forecast contracts after a valid signed
dashboard session is established.

## Authentication boundary

The initial application login uses a server-only password and an HMAC-signed,
HTTP-only, `Secure`, `SameSite=Strict` session cookie. Authentication is
isolated from the KPI API contract. OAuth, Google Workspace SSO, and role claims
can therefore replace the login provider without changing dashboard components
or the backend contract.

All secrets are required at runtime and are configured in Vercel, never source
control. Production fails closed when any required credential is absent.
