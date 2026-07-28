# ADR-005: One-Pass KPI Semantic Layer

Status: Accepted  
Date: 2026-07-28

## Decision

All KPI modules consume one shared accumulator built in a single pass over
accepted Master Dataset records. Each record contributes to its applicable
Company, RSM, TSO, SR, Dealer and Product states. Shared deterministic formulas
then finalize an identical contract for every entity.

Domain modules are projections of those contracts. They do not repeat totals,
ratios, forecast inputs or ranks. Risk and structured insight objects reference
the same finalized metrics.

## Why this is better

- No repeated raw or Master Dataset reads.
- No formula drift among dashboard pages or future consumers.
- Complexity is bounded by records × applicable hierarchy levels.
- Metric provenance and owner are centralized.
- Attendance can contribute new registered metrics without changing aggregation
  architecture or existing contracts.

## Correctness safeguards

- Quarantined/rejected records are excluded and counted.
- Snapshot metrics retain the latest value per entity before roll-up.
- Working-day values use maxima, not sums.
- Growth is withheld until periods are comparable.
- Collection/Sales remains a flow ratio, not receivable recovery.
- Product mix is labeled source-unit-only until UOM conversion is governed.
