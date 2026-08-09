# Phase 4 Verification Record

> Historical verification record. The deployment ID below is retired; current production is defined by [ADR-007](ADR-007-SHEET-BOUND-PRODUCTION-BACKEND.md), [ADR-008](ADR-008-CACHE-ONLY-HTML-SERVICE-RUNTIME.md), and [../README.md](../README.md).

Release: 1.1.0  
Date: 2026-07-28

## Automated tests

Twelve test groups passed:

- shared normalization and dynamic header behavior;
- all source parsers and subtotal exclusion;
- Master Dataset relationships and validation quarantine;
- Master cache checksum/chunking;
- Phase 3 runtime self-test;
- executive, hierarchy, dealer and product KPI totals;
- identical hierarchy KPI contracts;
- forecast-base inputs;
- deterministic risks and structured insights;
- stale KPI cache rejection by Master batch ID;
- Attendance compatibility;
- 100,000-observation aggregation benchmark.

Observed benchmark range: approximately 647–739 ms locally, below the five-second
verification budget. This is a local comparative benchmark, not an Apps Script
quota guarantee.

## Code review and fixes

1. Replaced an invalid dealer-order Collection “trend” with a dated Collection
   series calculation.
2. Prevented incomplete MTD Sales from being certified as growth against a full
   prior month.
3. Added KPI/Master `batchId` cache-coherency validation so a stale KPI generation
   cannot survive a refreshed Master Dataset.
4. Confirmed Phase 4 modules contain no Spreadsheet service or raw-sheet reads.
5. Confirmed working-day measures use maxima and stock uses latest-per-entity
   snapshot aggregation.

## Google Metric Dictionary

Rows 22–31 were appended under the frozen 22-column contract. Existing formatting
and ACTIVE status validation were preserved and verified through connector
readback. No existing metric was overwritten.

## Deployment

- Apps Script push: 28 files completed.
- Immutable Apps Script version: 2.
- Deployment ID: `AKfycbzQ_zIEA0kZJ_AE9buVXgWY5pkIOywj6fTHW-jTAsvDKFJa6v0gWaIKfKXYnqnSfsuznw`.
- Deployment description: `Phase 4 KPI Engine v1.1.0`.
- Deployment listing confirms version 2 is active.

## Remote smoke-test status

Both development and immutable CLI execution were attempted. Google rejected the
development call for execution permission and reported the immutable function as
unavailable to the CLI identity. This is the same owner-authorization limitation
recorded in Phase 3. The deployed source exists and local/runtime-compatible tests
pass, but the one-time spreadsheet-scope authorization must be completed by the
deployment owner in the Apps Script editor.

Required owner sequence:

1. Run `runDataEngineSelfTest()`.
2. Run `runKpiEngineSelfTest()`.
3. Run `refreshKpiSnapshot()`.
4. Review `Import Batches` and `Quality Results` before certifying live KPIs.

No failed remote call mutated spreadsheet data.
