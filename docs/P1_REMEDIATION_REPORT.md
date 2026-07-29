# P1 Remediation Report

Release: 3.5.5

Production patch 3.5.1 increases persistence batches from 1,000 to 5,000 rows, reducing Apps Script spreadsheet write round trips while preserving identical row-level output.

Production v3.5.5 certified batch `BATCH_06272af7d1344ec4a55e35bb`. Final roster counts are 428 SR, 53 TSO and 13 RSM. At 2026-07-30 Bangladesh time, the three-day posting policy produced data cutoff 2026-07-27, 23 matured working days, 3 remaining working days, matured Sales 51,604,280 and baseline forecast 58,335,273.04. The durable cache was generated at 2026-07-30 05:42:30 Asia/Dhaka and survived independent desktop and mobile sessions. Mobile verification used a 390-pixel viewport with matching 390-pixel body width, so no horizontal overflow occurred. The measured fresh-session dashboard-ready time was 15.074 seconds on desktop and 13.317 seconds on mobile; this remains a performance risk against the under-two-second target.

## P0 closure

P0 is closed. The daily 03:00 Asia/Dhaka maintenance trigger is installed. Its verified production run completed under ScriptLock, retained the active certified cache, retained 20 batches and 3,054 quality rows, removed no in-window records, and left all five business worksheets untouched. `Holiday` is classified as governed Metadata.

## P1 findings

| Finding | Root cause | Remediation |
|---|---|---|
| Previous-month daily facts discarded | Historical parser retained only embedded monthly totals. | Preserve daily facts as `HISTORICAL_DAILY_SALES_AMOUNT`, never current Sales. Comparable MTD uses aligned historical days. |
| Calendar/cutoff absent | P0 predecessor state. | Closed in v3.3.0 with official Calendar and `CLOSED_DAY_ONLY`. |
| Sales control variance | Upstream control differs from atomic facts by 90. | Closed under documented `ATOMIC_DAILY_AUTHORITATIVE` policy and tolerance 100. |
| Headcounts mixed domains | Entity sets accumulated identities from unrelated modules. | SR, TSO, RSM and Dealer counts now come only from current Sales facts; product count comes from product quantity. |
| Date, Region and Category filters disabled | Consumer cache lacked these contracts. | Date uses certified period contexts; Region/Zone uses governed RSM scope; Category uses product-group entities. |
| Product scope looked like revenue | Product observations contain quantity, not attributable revenue. | Product and Category scopes render volume, mix, rank and fact count, never revenue KPIs. |
| Cache startup unstable | Durable cache appended generations and scanned every row. | Publication replaces the old cache body and reads only the active generation's declared chunks. |

## Forecast integrity

The approved working-day run-rate forecast formula is unchanged. Historical daily facts add comparable-period sales, aligned-day count and full prior-month context; they do not silently replace the approved model.

## Three-day sales posting window

A sale dated day D may be posted through D+3. Forecast inputs therefore use only matured sales dates at or before `as_of_date - 3 days`. Recent posted values remain visible in total Sales but are excluded from the run-rate numerator and elapsed-day denominator until their posting window closes. A calendar sales month becomes operationally closed on day 4 of the following month; transaction event dates and calendar-month ownership are not shifted.

Configuration keys: `SALES_POSTING_LAG_DAYS = 3` and `MONTH_CLOSE_DAY = 4`. The Forecast panel discloses matured posted sales and the effective data-cutoff date.

The business date is calculated explicitly in `Asia/Dhaka`, rather than by slicing a UTC timestamp. The boundary test proves that 2026-07-29 23:30 UTC is treated as 2026-07-30 locally and therefore produces the correct 2026-07-27 maturity cutoff.

## Production verification

- Certified cache: `BATCH_06272af7d1344ec4a55e35bb`, generated 2026-07-30 05:42:30 Asia/Dhaka.
- UI: 12 KPI cards, 3 charts, 9 filter controls, responsive reports and tooltips rendered from the certified cache.
- Filters: RSM, TSO, SR, Dealer and Product values matched their selected entity contracts; Date, Region/Zone and Category were enabled.
- Browser: no console errors or uncaught page errors on desktop or mobile.
- Cache-only proof: both final audits had `refreshWallMs = null`; neither session invoked the Data Engine.
- Evidence: `assets/screenshots/v3.5.5-production.png` and `assets/screenshots/v3.5.5-mobile.png`.
