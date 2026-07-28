# ADR-006: Private Server Consumer API

Status: Accepted  
Date: 2026-07-28

## Decision

Apps Script remains owner-only and exposes `getDashboardApi` solely through the
Apps Script Execution API. Vercel's Next.js server obtains a short-lived Google
OAuth access token using credentials held only in encrypted environment
variables, invokes the function, and returns the compact KPI contract through a
same-origin public aggregate route.

The production principal must be an owner-authorized Google identity with
explicit access to the script and its data. The browser never receives Google credentials, the script identifier, an Apps
Script URL, raw Sheet values, or Master Dataset rows. It receives only KPI,
hierarchy, risk, insight, quality, and forecast contracts requested by the
public dashboard.

## Authentication boundary

Public users authenticate neither to the dashboard nor to Google. The trust
boundary is the Next.js server: it alone holds Google OAuth credentials and
invokes Apps Script. A future identity provider or role policy can be added at
the same-origin Next.js boundary without changing the Apps Script KPI contract.

The refresh token is required because `scripts.run` accepts a short-lived OAuth
access token, Vercel has no interactive Google session, and the Apps Script API
does not support service accounts. A push-based aggregate read model could avoid
user OAuth, but would add another datastore, ingestion authentication,
synchronization, retries, and data staleness.

All secrets are required at runtime and are configured in Vercel, never source
control. Production fails closed when any required credential is absent.
