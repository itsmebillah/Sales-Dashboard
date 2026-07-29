# Security Policy

## Sensitive Data

Do not commit Google OAuth credentials, Apps Script access tokens, populated environment files, production spreadsheet exports, or personally identifiable business data. Use Script Properties for production configuration and synthetic data for tests and screenshots.

## Architecture Boundary

The browser communicates with server functions only through the same-origin Apps Script HTML Service bridge (`google.script.run`). The private spreadsheet, Master Dataset, and credentials are never returned to browser code. Initial dashboard hydration may read only the certified KPI cache; changes that expose raw records or trigger parsing during page load are security regressions.

The production runtime and its security boundary are documented in [ADR-008](docs/ADR-008-CACHE-ONLY-HTML-SERVICE-RUNTIME.md).

## Reporting a Vulnerability

Do not open a public issue containing exploit details or secrets. Report suspected vulnerabilities privately to the production owner at [ptcoffice20@gmail.com](mailto:ptcoffice20@gmail.com) with reproduction steps, affected components, and impact. Credentials included in a report should be revoked immediately.

## Supported Version

Security fixes target the current `main` branch and deployed release. Older snapshots and phase branches are not supported unless stated otherwise.
