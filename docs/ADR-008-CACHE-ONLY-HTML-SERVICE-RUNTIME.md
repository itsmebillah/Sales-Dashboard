# ADR-008: Cache-Only Apps Script HTML Service Runtime

## Status

Accepted on 2026-07-29. This supersedes ADR-006 as the primary dashboard
runtime. ADR-006 remains a supported legacy consumer contract.

## Decision

The production application is an Apps Script HTML Service Web App in the
sheet-bound production project. Its browser contract uses `google.script.run`;
it does not use the Apps Script Execution API or Vercel for dashboard rendering.

Initial loading calls `getCachedDashboardApi()`. That function reads only the
versioned, checksummed KPI cache. A cache miss returns `KPI_CACHE_EMPTY` and
cannot open the spreadsheet, run parsers, build the Master Dataset, or calculate
KPIs.

An explicit refresh calls `refreshDashboardData()` and executes exactly this
sequence:

1. `runDataEngine()` builds and certifies one Master Dataset under the existing
   ScriptLock.
2. `refreshKpiSnapshot(master)` calculates KPIs from that supplied Master
   Dataset, without parsing a second time.
3. The existing chunked Cache Engine publishes the certified KPI snapshot.
4. A compact consumer projection updates the browser.

The Data Engine, KPI Engine, Forecast Engine, Risk Engine, parsers, validation,
relationships, and cache implementation are unchanged. The consumer projection
removes duplicate dealer and product arrays already present in the hierarchy;
it does not alter calculations or metric definitions.

## Security boundary

The Web App is publicly viewable and executes as its deploying owner. Google
Sheets remains private. Only aggregated KPI output crosses the HTML Service
boundary; raw spreadsheet ranges and Master Dataset records are not returned.
No credentials are embedded in HTML or browser JavaScript.

Because refresh is a public action, the existing ScriptLock remains mandatory:
only one Data Engine build may execute at a time, and its `finally` block always
releases the lock. Concurrent refresh attempts receive a controlled
`REFRESH_IN_PROGRESS` response.

## Performance and responsive design

`doGet()` renders only the application shell. Certified data is loaded
asynchronously from CacheService. The transport payload is compact and has no
external chart-library dependency. Canvas charts resize with their container;
cards, panels, and reports collapse into touch-friendly tablet and mobile
layouts without horizontal page scrolling.

The initial-load target is under two seconds when a valid KPI cache exists.
Refresh duration depends on source volume and is intentionally asynchronous;
the UI shows its real elapsed time and never displays fabricated progress.

## Consequences

- OAuth refresh tokens, Vercel server functions, and `scripts.run` are no longer
  dependencies of the production dashboard path.
- The repository and clasp deployment remain the source of truth.
- New modules extend the Master Dataset and KPI cache contracts; they do not
  require a dashboard runtime redesign.
- Empty or evicted cache requires an explicit refresh and is never silently
  rebuilt during page load.
