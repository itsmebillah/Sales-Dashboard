# Phase 4 KPI and Business Calculation Engine

Release: 1.1.0  
KPI contract: 1.0.0

## Modules

- Executive KPI Engine
- Sales KPI Engine
- Hierarchy KPI Engine
- Dealer KPI Engine
- Product KPI Engine
- Collection KPI Engine
- Projection KPI Engine
- Lifting KPI Engine
- Forecast Base Engine
- Risk and Exception KPI Engine

## Consumer API

- `getKpiSnapshot(options)` — cache-first complete snapshot.
- `refreshKpiSnapshot()` — recalculate from Master Dataset.
- `getRiskAndInsightSnapshot()` — machine-readable risks and structured insights.
- `invalidateKpiCache()` — remove only the KPI cache generation.
- `runKpiEngineSelfTest()` — non-mutating deterministic runtime verification.

No function reads source sheets. `SIP.KpiService` obtains the Master Dataset only
through `SIP.DataEngine.get()`.

## Identical hierarchy contract

Company, RSM, TSO, SR, Dealer and Product objects expose identical keys,
including actuals, target/forecast, working-day pace, entity counts, commercial
flows, growth/momentum, rank/contribution, forecast inputs and certification.
This gives every future consumer one stable rendering/query contract.

## Forecast baseline

The baseline calculates average daily Sales, working-day run rate, recent-window
momentum, historical monthly slope, daily volatility, elapsed ratio, activity,
history depth and a disclosed confidence-input score. It is not an advanced or
probabilistic forecast and does not claim calibrated intervals.

## Risk and insight output

Risk thresholds are centralized and configurable. Objects include stable risk
ID, type, severity, entity type/ID, metric, observed value, threshold, reason and
timestamp. Insight objects are structured projections of those risks; no natural
language is generated.

## Performance

The local benchmark processes 100,000 canonical observations, including entity
roll-ups and risk generation, within the five-second verification budget. The
observed result is recorded in release notes; Apps Script runtime varies with
account quotas and payload size.

## Mobile-first future consumer constraint

Phase 4 creates no UI. The KPI contracts are deliberately compact, stable and
page-independent so the future dashboard can request bounded sections for
responsive cards, touch interactions and automatically resizing charts without
reading raw data or requiring horizontal mobile layouts.
