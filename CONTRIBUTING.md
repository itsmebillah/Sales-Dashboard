# Contributing

Thank you for improving the Sales Intelligence Platform. Changes must preserve the governed data contracts that make the dashboard trustworthy.

## Before You Start

1. Read [CORE_PLATFORM_ARCHITECTURE.md](CORE_PLATFORM_ARCHITECTURE.md).
2. Review the relevant records in [`docs`](docs), especially the ADRs.
3. Confirm that the change is additive or document the required migration, backfill, version, and consumer impact.
4. Do not include production spreadsheets, credentials, OAuth tokens, or identifiable business data.

## Development Checks

Run the backend suite:

```powershell
npm test
```

Run the frontend checks:

```powershell
Set-Location frontend
npm ci
npm run check
```

## Change Requirements

- Keep parsers as the only ingestion writers.
- Preserve canonical identifiers, source lineage, and batch identity.
- Add or version KPI definitions instead of silently changing their meaning.
- Add regression tests for parser, quality, cache, KPI, or API behavior changes.
- Update business dictionaries and operational documentation with the code.
- Use synthetic or anonymized data in fixtures and screenshots.

## Pull Requests

Explain the business rule, data-contract impact, verification evidence, and deployment steps. Breaking frozen-core changes require an architecture decision and explicit owner approval.

