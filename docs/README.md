# Documentation Index

This directory preserves both current operating guidance and dated audit evidence. A dated phase report describes the system at that point in time; it does not override a later architecture decision, release note, or certification record.

## Current production references

- [Project README](../README.md) — production URL, data sources, development, and deployment
- [Core Platform Architecture](../CORE_PLATFORM_ARCHITECTURE.md) — data and KPI invariants
- [ADR-007](ADR-007-SHEET-BOUND-PRODUCTION-BACKEND.md) — canonical sheet-bound backend
- [ADR-008](ADR-008-CACHE-ONLY-HTML-SERVICE-RUNTIME.md) — sole production runtime and browser contract
- [Operations Guide](PHASE3_OPERATIONS.md) — operational functions and recovery procedures
- [KPI Dictionary](../KPI_DICTIONARY.md) — metric contracts
- [Release Notes](../RELEASE_NOTES.md) — chronological implementation record
- [Phase 2 hierarchy and Attendance implementation](PHASE2_HIERARCHY_ATTENDANCE_IMPLEMENTATION.md) — current hierarchy, period, working-day, and Attendance rules
- [Master Dataset Retention Policy](MASTER_DATASET_RETENTION.md) — header-only physical contract and bounded runtime/cache model
- [Post-P1 System Audit](SYSTEM_AUDIT_3.6.0.md) — latest full-system audit before the Phase 2 hierarchy and Attendance release

## Historical records

The ADR-001 through ADR-005 series records earlier architectural decisions. ADR-004 is explicitly superseded by ADR-007. Phase, remediation, traceability, worksheet-classification, and edge-case reports are retained as dated evidence; their batch IDs, deployment IDs, test counts, limitations, and readiness decisions apply only to the release identified inside each document.

The root-level discovery reports and design specifications remain useful for business rationale and source-history context. Documents labeled `Historical` must not be used as current production runbooks.

## Authority order

When documents conflict, use this order:

1. Accepted, non-superseded ADRs
2. Current source code and automated tests on `main`
3. Latest release notes and implementation report
4. Dated audit, verification, remediation, and design records
