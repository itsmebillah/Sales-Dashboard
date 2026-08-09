# Production Spreadsheet Audit

Audit date: 2026-07-29  
Spreadsheet ID: `1HxVEJqWqIc_xSGIBYJpJBIuHeqTaQiUUJ_Lc7jLKlSY`

## Decision

All 21 audited business and governance worksheets are retained. No worksheet is currently verified as obsolete
or temporary. The runtime reads operational sources and writes diagnostic
evidence; the remaining governed sheets are frozen platform contracts or
plug-and-play extension surfaces required by the enterprise architecture.

The certified Master Dataset and KPI snapshot use checksummed Apps Script
CacheService generations. A hidden `Dashboard Cache` worksheet is generated as
the durable L2 store for the compact certified browser payload because
CacheService is best-effort and was observed evicting the production payload.

## Worksheet Classification

| Worksheet | Classification | Production purpose | Decision |
| --- | --- | --- | --- |
| Sales Data Base Monthly | Production | Current-period sales, targets, hierarchy, products and embedded prior-period total | Keep |
| Previous Month Sales | Historical | Earlier-period sales history; history-only ingestion prevents duplicate current metrics | Keep |
| Monthly Projection | Production | Collection and projection transactions | Keep |
| Dealer lifting | Production | Lifting, stock and secondary commercial-flow facts | Keep |
| Platform Guide | Master | Operating guide for the governed platform | Keep |
| Master Dataset | Contract | Frozen 41-column logical-model header only; generated facts remain in memory/cache | Keep header only |
| Master Lookup | Master | Governed business-name and identity lookup contract | Keep |
| Calendar | Master | Working-day and reporting-period contract | Keep |
| Configuration | Master | Platform configuration contract | Keep |
| Hierarchy | Master | Company-to-field-force hierarchy contract | Keep |
| Relationship Model | Master | Governed entity relationship contract | Keep |
| Parser Contract | Master | Source-to-canonical parser contract | Keep |
| Metric Dictionary | Master | Governed metric definitions | Keep |
| Module Registry | Master | Plug-and-play module registry | Keep |
| Source Registry | Master | Governed source inventory | Keep |
| Import Batches | Production | Data-engine batch status and lineage evidence | Keep |
| Quality Rules | Master | Data-quality rule catalog | Keep |
| Quality Results | Production | Runtime validation and quarantine evidence | Keep |
| Metric Store | Master | Reserved governed metric persistence surface | Keep |
| Action Register | Master | Reserved risk and management-action workflow surface | Keep |
| Audit Log | Production | Platform change and governance audit trail | Keep |
| Dashboard Cache | Cache | Hidden durable certified payload; never stores raw source rows | Keep |

## Findings

- Current-period sales and Monthly Projection are populated through
  `IMPORTRANGE`; the Apps Script runtime nevertheless reads only this production
  workbook. These formulas remain upstream operational dependencies.
- The current Sales report contains June historical totals. The Previous Month
  report contains June daily details and an earlier historical column. Only the
  earlier historical metric is added from the Previous Month report to prevent
  double counting.
- Import Batches and Quality Results are active operational evidence, not
  disposable cache sheets.
- Metric Store and Action Register currently act as governed extension
  contracts. Removing them would violate the plug-and-play platform design.
- No accounting formulas, KPI formulas, or business rules were modified during
  this audit.

## Removal Register

No worksheets approved for removal. Any future deletion requires a fresh
reference audit, owner approval, export/backup evidence, and an Audit Log entry.
