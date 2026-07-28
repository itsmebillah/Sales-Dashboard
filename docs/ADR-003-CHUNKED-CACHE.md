# ADR-003: Versioned Chunked Cache

Status: Accepted  
Date: 2026-07-28

## Decision

The serialized Master Dataset is compressed when Apps Script utilities are
available, split into bounded cache entries, checksummed, and published by a
generation manifest. Consumers either receive a complete verified generation or
trigger a rebuild; partial cache generations are never returned.

Oversized payloads fail open to a freshly built in-memory result and emit a
diagnostic rather than silently truncating data. The architecture is compatible
with replacing CacheService by a persistent warehouse/cache adapter later.
