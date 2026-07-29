# P1 Remediation Report

Release: 3.4.0

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
