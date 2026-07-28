# Business Intelligence Specification

Version: Phase 2 design, 2026-07-28  
Status: Awaiting approval; no implementation authorized

## 1. Purpose and decision model

The BI system must help management answer five questions in order:

1. Where are we now: sales, lifting, secondary, collection, stock and target?
2. Are we on plan: achievement, pace, growth and forecast?
3. Why: hierarchy, dealer, product, working-day and activity drivers?
4. What is at risk: decline, low stock, excess stock, weak recovery, inactivity, concentration and anomalies?
5. What action is required, by whom, and by when?

The system is management intelligence, not merely a monthly report viewer. Every headline value must expose its definition, period, scope, last refresh, drill path and data-quality status.

## 2. Analytical scope and grains

| Subject | Analytical grain | Core time axis | Primary dimensions |
|---|---|---|---|
| Sales | SR × day; product quantities at SR/month unless source proves finer grain | Sales date/month | RSM, TSO, SR, dealer/point, product, pack |
| Dealer lifting | Dealer × day/month | Lifting date/month | NSM/ASM, RSM, TSO, area, dealer, depot |
| Secondary and stock | Dealer × snapshot/report period | As-of date/month | Hierarchy, dealer, depot |
| Collection | Transaction | Effective date | ASM, RSM, TSM/TSO, dealer, bank |
| Projection | Submission transaction/version | Effective/as-of date | ASM, RSM, TSM/TSO, dealer |
| Target/forecast/history | Owner × period, optionally product | Month/as-of date | Hierarchy, product |

Only atomic/detail rows may feed facts. Source totals are reconciliation controls, never additive fact rows.

## 3. Relationship intelligence

### Sales ↔ Dealer lifting

- Compare downstream Sales with upstream Lifting by matched dealer, hierarchy and period.
- Diagnose replenishment: Lifting below Sales can indicate stock drawdown; Lifting above Sales can indicate inventory build.
- Relate stock and secondary to Sales pace, subject to approved business definitions.
- Surface unmatched dealers separately; never silently exclude them from denominators.

### Sales ↔ Collection

- Compare collection with Sales for the same effective period and hierarchy/dealer.
- Estimate collection gap as Sales minus Collection only when management accepts this proxy.
- True outstanding requires opening receivable, invoice, payment allocation, credit note and adjustment data.
- Analyze collection timing, bank mix, active collecting dealers and collection concentration.

### Sales ↔ Projection

- Compare submitted projection with realized Sales for aligned dates/periods.
- Measure projection coverage, bias and accuracy after sufficient closed periods exist.
- Keep projection separate from model forecast; one is field judgment, the other is systematic estimation.

### Lifting ↔ Collection

- Collection-to-lifting and collection-to-secondary ratios can describe cash recovery relative to supply/movement.
- These are operational proxies, not receivables settlement, until invoice allocation exists.

### Three-way view

Classify dealers using Sales pace, Lifting/stock position and Collection behavior: healthy growth, stock-constrained, overstocked, cash-risk, inactive, or unmatched/unknown.

## 4. Management insight domains

### Executive

- MTD Sales, Target, Achievement, Forecast, Forecast Achievement, Growth, Lifting, Secondary, Collection and proxy Collection Gap.
- Contribution and concentration by hierarchy, dealer and product.
- Best/worst regions and the monetary gap to plan.
- Momentum direction and projected month-end exposure.
- Data freshness and unmatched-key coverage.

### Sales leadership

- Daily pace versus required pace; productive days and working-day utilization.
- SR/TSO/RSM attainment, productivity, order/memo intensity and working hours.
- New/closed/inactive entity impact.
- Persistent decliners, rebounders and volatility outliers.

### Dealer management

- Dealer sales, lifting, secondary, stock, collection, projection and health classification.
- Stock sufficiency/excess, replenishment gap, collection gap, concentration and inactivity.
- Dealer lifecycle and replacement indicators.

### Product management

- Product and pack quantity mix, contribution, rank, penetration and growth where historical product data exists.
- Top/bottom products, zero-sales products and mix shifts.
- Value metrics by product require price or product sales value at the product grain.

### Finance/collection

- Collection trend, bank/channel mix, collecting dealers, collection frequency and average ticket.
- Recovery proxies by hierarchy and dealer.
- True receivable aging and DSO are unavailable with current data.

### Operations

- Depot/dealer lifting and stock distribution, low/excess stock signals, dealer opening/closure/replacement.
- Exceptions requiring master-data repair or source refresh.

## 5. Comparison framework

Every additive measure should support, where data permits:

- MTD vs target, expected-to-date target and required remaining amount.
- Current month vs prior month, 3-month/6-month average and same period prior year.
- Current day vs prior working day, rolling 3/7 working-day average and average daily sales.
- Actual vs forecast and field projection.
- Hierarchy entity vs parent, peer median, peer quartile and company average.
- Dealer vs dealer segment/area; product vs group and total portfolio.
- Sales vs lifting, secondary, stock, collection and projection.
- Working days elapsed vs sales elapsed; order growth vs value growth.

Comparisons must align date cutoff, working-day calendar, grain, units and matched population.

## 6. Drill-down and cross-filter behavior

Primary path: Company → RSM → TSO → SR → Dealer → Product/Pack. Because actual relationships are many-to-many and effective-dated, the interface presents this as a navigation path while the model uses assignment bridges.

Alternative paths:

- Company → ASM/NSM → RSM → TSO → Dealer → daily lifting.
- Company → Product Group → Product → Pack → RSM → TSO → SR.
- Company → Depot → Dealer → TSO → SR.
- Company → Bank → Collection transaction → Dealer → hierarchy.
- Month → Week → Working Day → hierarchy/dealer/product.
- Risk category → entity → KPI drivers → source records.

At every level, show breadcrumb, filters, entity contribution, comparison baseline, trend, rank, exceptions, underlying records and export scope.

## 7. Insight and anomaly rules

Rule-based insights must precede generative summaries. Candidate rules include:

- Target risk: forecast achievement below threshold.
- Pace deficit: actual daily pace below required pace.
- Sustained decline: negative growth for configurable consecutive periods.
- Momentum reversal: recent rolling average changes direction materially.
- Sales/lifting divergence: ratio outside peer/own-history bounds.
- Low-stock risk or excess-stock risk relative to average sales.
- Collection risk: recovery proxy below threshold or collection inactivity.
- Projection bias: repeated over- or under-projection.
- Concentration risk: excessive share from top dealer/product/entity.
- Data anomaly: missing mappings, duplicates, negative values, sharp spikes, stale refresh.

Each insight contains severity, evidence, monetary impact, affected entity, suggested action, owner, due date and dismissal/acknowledgment state. “AI insight” text may summarize certified measures but must not invent causality.

## 8. Metrics currently unavailable or non-certifiable

| Missing metric | Why unavailable | Required additions |
|---|---|---|
| True outstanding/receivables | No invoice/opening balance/payment allocation | Invoice, due date, opening AR, allocations, credit notes, adjustments |
| Overdue, aging, DSO | No due dates or receivable ledger | Invoice and settlement dates/amounts |
| Gross/net revenue | Sales definition, returns, discounts and tax unknown | Invoice line values, returns, discounts, tax |
| Gross margin/profit | No cost of goods | Standard/actual cost by SKU and period |
| Product revenue/share by value | Product columns appear quantities | SKU-level sales value and price |
| Numeric distribution/coverage | No outlet universe or visit data | Outlet master, route/visit and order data |
| Strike rate/conversion | No visit and unsuccessful-call records | Calls/visits, orders and reason codes |
| Inventory days by SKU | Stock not clearly product-grained | Dealer-SKU stock snapshots and demand |
| Fill rate/service level | No order vs fulfillment lines | Ordered, fulfilled, short and delivered quantities |
| Returns/damage/expiry | No reverse logistics | Return reason, SKU, quantity and value |
| Promotion effectiveness | No campaign/exposure data | Promotion, spend, eligibility and control group |
| Certified YoY product growth | Insufficient confirmed product history | Historical SKU-level facts |
| Forecast confidence | Too little closed-period atomic history | Multi-period daily history and backtesting |
| Attendance productivity | Attendance absent | Employee-date attendance and assignment |

## 9. Recommended future fields

- Stable IDs: dealer, employee, territory, depot, product/SKU, outlet, invoice, order and route.
- Effective dates for hierarchy and dealer/SR assignments.
- Transaction currency, unit, sign convention, source system, created/updated timestamps and status history.
- Invoice/order lines: quantity, list price, discount, tax, net sales, cost, return and fulfillment.
- Receivable fields: due date, opening balance, payment allocation, credit note and adjustment.
- Product master: group, brand, SKU, pack, UOM, conversion factor, active status and launch date.
- Dealer master: type, channel, geography, credit limit/terms, open/close date and lifecycle status.
- Stock snapshots at dealer × SKU × date.
- Visit/outlet coverage and reason codes.
- Targets at explicit grain with version, owner and effective period.
- Calendar flags: working day, holiday, cutoff and selling-day sequence.
- Data lineage: source record ID, batch ID, import time and quality state.

## 10. Governance and acceptance

- Every KPI must be registered in `KPI_DICTIONARY.md` with owner and certification state.
- Joined metrics are certified only after key-match coverage meets an approved threshold.
- Dashboards show refresh timestamp, source period and quality warnings.
- Role-based visibility follows effective hierarchy; sensitive Attendance data is minimized.
- Phase 3 may begin only after management approves definitions for Sales, Lifting, Secondary, Collection, Target, working day and dealer ownership.
