# ADR-002: Identity and Effective Relationship Resolution

Status: Accepted  
Date: 2026-07-28

## Decision

Merging means resolving canonical entities and constructing relationships, not
joining source rows into one denormalized record. Explicit employee/dealer codes
win. Embedded dealer codes are next. Normalized names may identify a candidate
only when exactly one match exists; ambiguous matches remain distinct and are
logged. Row number and sheet order are never business keys.

Hierarchy and employee–dealer/dealer–depot relationships are emitted with
effective periods. This improves the Phase 2 concept by preventing current
assignments from rewriting historical performance while preserving the frozen
Hierarchy and Relationship Model contracts.
