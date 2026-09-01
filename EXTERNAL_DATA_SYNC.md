# External Sales Data Sync Specification

## 1. Executive Summary

This module replaces fragile Google Sheets `=IMPORTRANGE()` formulas with an automated, high-performance Apps Script sync engine (`SIP.ExternalSync`). It copies raw sales data directly from the external source ERP export spreadsheet into the core Sales Intelligence Platform workbook every 10 minutes without truncation, formula calculation lags, or authorization breaks.

---

## 2. Source & Destination Governance

| Property | Source Workbook | Destination Workbook (SIP Core) |
|---|---|---|
| **Spreadsheet ID** | `1uQnfNHo-rkazm02yG81LZn1slmQtNvmiFwS48vjq1E0` | `1HxVEJqWqIc_xSGIBYJpJBIuHeqTaQiUUJ_Lc7jLKlSY` |
| **Tab Name** | `Sheet4` | `Sales Data Base Monthly` |
| **Range** | `A1:DS` (Columns 1 to 123) | Rectangular overwrite (`A1:DS{lastRow}`) |
| **Sync SLA** | Every 10 minutes (Time-Driven Trigger) | Immediate certified cache refresh |

---

## 3. Technical Workflow

1. **Lock Acquisition**: Acquires `LockService.getScriptLock()` (3-second timeout) to prevent overlapping execution.
2. **Source Ingestion**: Opens source workbook `1uQnfNHo-rkazm02yG81LZn1slmQtNvmiFwS48vjq1E0`, selects tab `Sheet4`, and reads `A1:DS{lastRow}` in a single array read.
3. **Atomic Rectangular Overwrite**: Opens destination tab `Sales Data Base Monthly`, clears old values, and writes the entire rectangular 2D array in one `setValues()` batch.
4. **Data Engine Trigger**: Automatically triggers `refreshDashboardData()` to recalculate KPIs and update certified dashboard cache.
5. **Time-Driven Trigger Automation**: Function `setupTenMinuteSyncTrigger()` automatically configures a 10-minute timer in Apps Script.

---

## 4. Why This Replaces `=IMPORTRANGE()`

| Feature | `=IMPORTRANGE()` Formula | `SIP.ExternalSync` (Apps Script) |
|---|---|---|
| **Reliability** | ❌ Fails frequently with `#N/A` & timeouts | ✅ 100% Guaranteed rectangular copy |
| **Data Integrity** | ⚠️ Prone to column truncation & missing rows | ✅ Full 2D array preserved with data types |
| **Refresh Speed** | ⚠️ Unpredictable Google Sheets recalculation | ✅ Exact 10-minute background execution |
| **Dashboard Caching** | ❌ Cannot trigger KPI recalculation | ✅ Instantly updates certified dashboard cache |

---

## 5. Manual & Automated Triggers

- **Automated Schedule**: Set up `runTenMinuteExternalSync()` on a 10-minute time-driven trigger.
- **Manual Setup Function**: Run `setupTenMinuteSyncTrigger()` once in Apps Script Editor.
- **On-Demand Manual Sync**: Run `syncExternalSalesData()` directly from Apps Script or Web UI.
