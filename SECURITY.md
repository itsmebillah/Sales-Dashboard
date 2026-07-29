# Security Policy

## Sensitive Data

Do not commit Google OAuth credentials, Apps Script access tokens, populated environment files, production spreadsheet exports, or personally identifiable business data. Use [`frontend/.env.example`](frontend/.env.example) for configuration keys and synthetic data for tests and screenshots.

## Architecture Boundary

The browser communicates only with the same-origin Next.js API route. Google OAuth credentials and the Apps Script deployment identifier remain server-side. Changes that expose these values to client bundles are security regressions.

The complete deployment and credential model is documented in [docs/PHASE5_SECURITY_AND_DEPLOYMENT.md](docs/PHASE5_SECURITY_AND_DEPLOYMENT.md) and [docs/GOOGLE_OAUTH_SCOPE_REQUIREMENTS.md](docs/GOOGLE_OAUTH_SCOPE_REQUIREMENTS.md).

## Reporting a Vulnerability

Do not open a public issue containing exploit details or secrets. Report suspected vulnerabilities privately to the production owner at [ptcoffice20@gmail.com](mailto:ptcoffice20@gmail.com) with reproduction steps, affected components, and impact. Credentials included in a report should be revoked immediately.

## Supported Version

Security fixes target the current `main` branch and deployed release. Older snapshots and phase branches are not supported unless stated otherwise.
