# Phase 3 Data Engine Operations

## Components

- `SourceReader`: one rectangular read per source sheet.
- `HeaderDetector`: signature-based header discovery and duplicate detection.
- `SalesParser`, `LiftingParser`, `TransactionParser`: source-specific adapters.
- `Normalizer`: canonical names, IDs, dates, numbers, hours and record contract.
- `ValidationEngine`: record, duplicate, hierarchy and business-value gates.
- `RelationshipEngine`: safe dealer resolution and effective relationship graph.
- `MasterDatasetBuilder`: canonical logical model and indexes.
- `CacheEngine`: versioned, checksummed, chunked Script Cache.
- `DiagnosticsWriter`: batched operational evidence only.
- `ConsumerApi`: stable entry points for future consumers.

## Apps Script entry points

- `runEnterpriseDataEngine()` — full build, cache refresh, diagnostics write.
- `getMasterDataset(options)` — cache-first consumer API.
- `refreshMasterDataset()` — forced rebuild.
- `invalidateMasterDatasetCache()` — cache invalidation.
- `getDataEngineStatus()` — lightweight health response.
- `runDataEngineSelfTest()` — non-mutating runtime smoke tests.

## Data flow

1. Acquire a script lock.
2. Read each source once into a two-dimensional array.
3. Detect source headers and metadata dynamically.
4. Classify rows and exclude subtotal/presentation rows.
5. Normalize and emit long-form canonical records.
6. Validate; quarantine invalid records without deleting raw data.
7. Resolve canonical entities and effective relationships.
8. Build indexes, placeholders and metadata in memory.
9. Publish a complete cache generation.
10. Append one batch row and bounded quality issues to diagnostic sheets.

## Deployment

The project uses the V8 runtime. The deployment has a dedicated Apps Script host
container and explicitly opens the governed Sales Dashboard spreadsheet by its
configured ID. This avoids modifying or overwriting the previous Apps Script
implementation while keeping the data engine isolated. `.claspignore` limits
remote Apps Script content to the manifest and `src/*.gs`.

After authenticated project creation/linking:

```text
clasp push
```

Run `runDataEngineSelfTest` first, then `runEnterpriseDataEngine`. Review
`Import Batches` and `Quality Results` before authorizing any consumer.

On first execution, the deployment owner must authorize access to the configured
spreadsheet. CLI execution may be unavailable until that consent is completed in
the Apps Script editor.

## Quality behavior

Errors are never silently swallowed. Parser exceptions, missing sheets/headers,
duplicate headers/entities/transactions, invalid dates/numbers, negative
business values, ambiguous relationships, incomplete cache generations, and
capacity failures produce structured diagnostics.

Quarantined records remain in the logical model for traceability but certified
consumers must filter to approved quality states.

## Performance contract

- Exactly one source `getValues()` call per source per build.
- All parsing, normalization, validation and merge work occurs in arrays/maps.
- Diagnostic output uses one batched `setValues()` call per target sheet.
- No Master Dataset worksheet replication.
- Cache entries are bounded and checksummed.

## Local verification

Run `npm test`. Tests cover normalization, dynamic headers, subtotal exclusion,
all three parsers, unified model construction, relationships, quarantine,
cache integrity, and future Attendance compatibility.
