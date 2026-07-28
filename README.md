# Sales Intelligence Platform

Enterprise Google Sheets and Apps Script data engine for governed ingestion,
normalization, validation, relationship resolution, caching, and downstream
consumers.

Phase 3 intentionally contains no dashboard, charts, HTML, or visualization
code. See [docs/PHASE3_OPERATIONS.md](docs/PHASE3_OPERATIONS.md) for setup and
execution guidance.

Phase 4 adds the deterministic KPI and business-calculation layer. It consumes
only the cache-first Master Dataset API and exposes executive, hierarchy,
dealer, product, collection, projection, lifting, forecast-base, risk, and
machine-insight contracts. See [docs/PHASE4_KPI_ENGINE.md](docs/PHASE4_KPI_ENGINE.md).
