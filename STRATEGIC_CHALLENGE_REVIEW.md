# Strategic Challenge Review

Date: 2026-07-28  
Status: Design recommendation only; no implementation authorized

## Executive conclusion

The proposed BI design is directionally sound but still too close to the source reports. The larger opportunity is not a better dashboard; it is a governed commercial decision system.

The current process optimizes for reporting what happened. The recommended process should instead optimize for detecting material deviation, explaining controllable drivers, assigning action, and measuring whether the action worked.

Five changes are recommended:

1. Replace the fixed hierarchy dashboard concept with a role-aware decision and exception system.
2. Stop presenting Collection-to-Sales as recovery or Sales minus Collection as outstanding.
3. Replace one forecast with probabilistic, reconciled scenarios and a separate target-attainment model.
4. Replace report-shaped monthly tables with atomic events, snapshots, effective-dated relationships and a metric semantic layer.
5. Use Sheets and Apps Script as workflow surfaces, not as the enterprise analytical engine.

## 1. Challenge: the existing hierarchy is not the business model

The proposed Company → RSM → TSO → SR → Dealer → Product path is useful navigation, but it is not a valid universal relationship chain:

- managers and territories change over time;
- a dealer may be served by multiple SRs or reassigned;
- product belongs to a sale/order line, not permanently to a dealer;
- Collection is associated with dealer and submitter but may settle invoices owned by a different historical assignment;
- depot and territory form alternative paths, not children of one fixed tree.

### Better model

Use a network of effective-dated relationships:

- employee reports-to employee;
- employee assigned-to territory;
- employee serves dealer;
- dealer supplied-by depot;
- sale contains product;
- collection settles invoice;
- target assigned-to employee/territory/dealer/product at an explicit grain.

The dashboard may still show a hierarchy breadcrumb, but queries must resolve relationships as of the event date. This prevents current assignments from rewriting historical performance.

## 2. Challenge: management totals are currently trusted more than atomic activity

Sales and Dealer Lifting combine detail, subtotal and executive report rows. Building analytics directly from them risks double counting and makes every metric dependent on layout.

### Better process

Adopt “atomic first, totals as controls”:

1. Ingest invoice/order/lifting/collection events at their lowest source grain.
2. Derive management totals from atomic records.
3. Compare derived totals with ERP report totals as reconciliation tests.
4. Quarantine discrepancies instead of choosing one total silently.

The monthly wide reports should remain audit references, not production facts.

## 3. Challenge: several familiar KPIs are financially misleading

### Retire or relabel

| Current concept | Problem | Recommendation |
|---|---|---|
| Sales − Collection = Outstanding | Ignores opening receivables, credit sales, cash sales, due dates, allocations, returns and adjustments | Label only as `Period Sales–Collection Gap`; never call it outstanding |
| Collection / Sales = Recovery | Measures two period flows, not receivable recovery | Label `Collection-to-Sales Flow Ratio`; add true recovery after AR allocation data exists |
| Lifting / Sales as a universal efficiency ratio | Direction and grain may differ; timing lag is ignored | Use lag-aware flow balance and stock-cover diagnostics |
| Product mix using raw quantities | Packs and units are not additive | Standardize base units or use value contribution |
| Rank by Sales alone | Rewards territory size and inherited potential | Pair scale with attainment, growth, quality, coverage and risk |
| One composite “dealer health score” | Weights hide the reason and encourage false precision | Use transparent health states with component evidence |
| Forecast accuracy using MAPE | Explodes near zero and overweights small entities | Use WAPE/MASE, bias and interval coverage |

### Better executive KPIs

1. **Forecasted Target Shortfall** — `max(Target − reconciled forecast, 0)`. Better than current gap because it distinguishes time already elapsed from likely month-end exposure.
2. **Recoverable Gap** — portion of forecasted shortfall that can be closed without exceeding a defensible recent/seasonal capacity bound. This separates actionable shortfall from structurally improbable recovery.
3. **Gap Closure Velocity** — reduction in forecasted shortfall over the last N working days. It measures whether corrective action is working.
4. **Expected-to-Date Variance** — actual minus target phased by the company’s historical intra-month curve, not a flat working-day split.
5. **Performance Breadth** — percentage of subordinate entities growing or on plan. It distinguishes broad health from a total driven by one large performer.
6. **Contribution-Adjusted Growth** — each entity’s absolute contribution to company growth or decline. It prioritizes material action over dramatic percentage changes on small bases.
7. **Sales Quality Index** — a transparent panel, not a single hidden score: growth, target attainment, concentration, order productivity, return/cancellation rate, and collection quality when those facts exist.
8. **Flow Balance** — lag-aligned Lifting minus Secondary/Sales movement, interpreted with stock change. This is superior to same-period ratio comparisons.
9. **Stockout Exposure** — forecast demand at risk because projected stock cover falls below replenishment lead time. Requires SKU stock and lead-time data.
10. **Excess Inventory Exposure** — stock value above policy cover, not merely high stock quantity.
11. **True Recovery Rate** — allocated collections divided by collectible receivables due in scope. Requires AR ledger.
12. **Forecast Value Added (FVA)** — improvement of the selected forecast over a naïve baseline and, later, over field Projection. This prevents complexity that does not improve decisions.
13. **Decision Conversion Rate** — percentage of assigned risk actions resolved with measured improvement. This evaluates the BI system itself.

## 4. Challenge: the dashboard is page-centric rather than decision-centric

A large catalog of charts can recreate information overload. Executives should not navigate through nine pages to discover where to act.

### Preferred experience: an exception-led decision cockpit

The landing view should contain:

- outcome: actual, phased plan, forecast range and material gap;
- driver tree: the few entities/products explaining most variance;
- risk portfolio: impact versus urgency versus controllability;
- action queue: owner, recommended intervention, due date and follow-up result;
- confidence and data-quality state.

Traditional reports remain available for investigation, not as the primary experience.

### Better visualizations

| Need | Preferred visual | Why it is better |
|---|---|---|
| Explain company gap | Variance contribution waterfall with drill | Shows monetary causes, not only ranking |
| Prioritize intervention | Impact × controllability matrix; urgency encoded separately | Distinguishes large but unactionable risks from recoverable ones |
| Show forecast uncertainty | Fan chart plus probability of target attainment | Avoids false precision of one number |
| Compare many managers | Bullet chart plus peer interval | Shows target, actual and reasonable peer context compactly |
| Diagnose flow imbalance | Lagged Sales/Lifting/stock small multiples | Reveals timing rather than misleading same-period ratios |
| Understand dealer behavior | Cohort/state-transition view | Shows movement between healthy, constrained, inactive and risk states |
| Detect broad decline | Contribution-weighted change heatmap | Combines materiality and direction |
| Product portfolio | Growth–share matrix with compatible units/value | Supports investment and rationalization decisions |
| Monitor interventions | Before/after action timeline with counterfactual baseline | Tests whether action changed the outcome |

Treemaps, donuts and generic gauges should be minimized. They are visually attractive but weak for precise comparison and action prioritization.

## 5. Challenge: one month-end forecast is insufficient

The existing design proposes a sensible working-day forecast baseline, but management decisions need two different predictions:

1. What Sales outcome is likely?
2. What is the probability of achieving target, and how much intervention is needed?

### Recommended forecast system

#### A. Hierarchical probabilistic Sales forecast

- Forecast daily Sales distributions at the lowest stable grain, with partial pooling to parent levels for sparse series.
- Candidate models: seasonal naïve/run-rate baseline; dynamic regression with selling-day index, day-of-week, payday/holiday and campaign effects; intermittent-demand methods for sparse dealer/SKU series; gradient-boosted or Bayesian hierarchical models only after enough history exists.
- Reconcile all levels so Company = sum of RSM = sum of TSO/SR forecasts.
- Produce P10/P50/P90 or calibrated prediction intervals.

#### B. Target-attainment probability

Estimate `P(month-end Sales ≥ Target)` rather than only Forecast/Target. Combine the predictive distribution with remaining-day capacity. This gives a better executive risk signal.

#### C. Scenario engine

Show baseline, downside and intervention scenarios. Intervention is constrained by realistic daily capacity, active staff, stock cover and remaining working days. Until those drivers exist, label scenarios as arithmetic sensitivities rather than causal simulations.

#### D. Forecast governance

- Measure WAPE, MASE, bias, interval coverage and FVA at multiple cutoffs.
- Detect structural breaks, new entities and source revisions.
- Maintain model champion/challenger versions.
- Do not automatically use field Projection as ground truth; test whether it adds forecast value.

### Immediate recommendation

With current data, keep the working-day run rate as baseline, add historical cumulative-curve phasing when closed daily history becomes available, and show a forecast range derived from backtest error. Do not deploy complex ML until it consistently beats the baseline.

## 6. Challenge: the proposed dimensional model needs event and snapshot semantics

A classic star schema is necessary but not sufficient because assignments, corrections, projections, inventory and workflow states change.

### Preferred data model

Use four types of records:

- **Events:** order, invoice, delivery/lifting, collection, return, visit, attendance and action events.
- **Snapshots:** inventory, receivable balance, target/forecast state and dealer status as of a timestamp.
- **Effective-dated dimensions/bridges:** hierarchy, territory, dealer ownership, product attributes and credit terms.
- **Semantic metrics:** governed definitions computed from certified events/snapshots.

Core facts should include `fact_order_line`, `fact_invoice_line`, `fact_lifting_line`, `fact_collection`, `bridge_collection_invoice`, `fact_inventory_snapshot`, `fact_receivable_snapshot`, `fact_target`, `fact_forecast`, `fact_visit`, `fact_attendance`, and `fact_management_action`.

Every record should carry source ID, source event time, ingestion time, effective date, batch ID, quality status and correction/version linkage. This enables late-arriving changes, auditability and reproducible “as known at the time” analysis.

## 7. Challenge: Google Sheets + Apps Script is not the best analytical core

Sheets and Apps Script are excellent for familiar input, exception stewardship and lightweight workflow. They are a poor long-term system of record for atomic multi-year facts, concurrent analytical queries, probabilistic forecasting, row-level security and reliable job orchestration.

### Recommended scalable architecture

| Layer | Preferred role |
|---|---|
| Google Sheets | Controlled operational input, mapping review, exception resolution, lightweight exports |
| Apps Script | Thin UI/workflow integration, validation and job invocation; no full historical scans |
| Ingestion service | Scheduled/idempotent extraction, schema validation, batch ledger and quarantine |
| Analytical warehouse | BigQuery or equivalent for normalized facts, history, joins, partitions and governed views |
| Transformation | Version-controlled SQL/data build with automated tests and documentation |
| Forecast service | Scheduled warehouse-native or containerized model execution with model registry |
| Semantic/API layer | Certified metrics, authorization, caching and bounded query responses |
| Dashboard | Role-aware decision cockpit consuming aggregates, not raw sheets |
| Monitoring | Freshness, quality, reconciliation, cost, latency and model performance alerts |

If organizational constraints require a Sheets-only pilot, define it explicitly as a temporary tier with row/latency/concurrency exit criteria. Do not allow the pilot to become the unplanned production architecture.

## 8. Challenge: AI insight is not valuable without closed-loop action

Narrative summaries alone create novelty, not operational value.

### Better AI role

- Rank certified exceptions by expected material impact.
- Retrieve the exact drivers and history behind each exception.
- Draft an evidence-bounded explanation and action options.
- Route the case to the responsible manager.
- Track acknowledgment, action, outcome and false-positive feedback.
- Learn threshold calibration from resolved cases, while metric calculations remain deterministic.

The system must distinguish fact, statistical association, hypothesis and recommendation. Generative output must never calculate official KPIs or invent missing causes.

## 9. Challenge: monthly management encourages late intervention

The current process is dominated by month-to-date and month-end views. That encourages intervention after a gap is already large.

### Better operating rhythm

- Daily: source freshness, severe anomalies, stockout exposure and critical target risk.
- Twice weekly: recoverable gaps, declining momentum, collection actions and dealer exceptions.
- Weekly: hierarchy performance review, forecast change, action effectiveness and mapping quality.
- Monthly: closed-period reconciliation, forecast backtest, portfolio/product review and KPI-definition governance.

Alerts require materiality, persistence and cooldown rules to prevent fatigue.

## 10. Revised priorities

### Before dashboard implementation

1. Obtain atomic source data or confirm the lowest available grain.
2. Establish stable dealer, employee, territory and product keys.
3. Define Sales, Lifting, Secondary, Stock, Target, Collection and receivables precisely.
4. Build a working-day calendar and retain closed daily history.
5. Establish source reconciliation and match-coverage thresholds.
6. Decide whether BigQuery/equivalent is the production analytical core.
7. Interview executive, regional and field users around decisions and actions, not desired charts.

### First production release

Build the smallest closed loop:

- certified Sales and target;
- phased expected-to-date performance;
- baseline forecast and target-attainment risk;
- contribution-based driver analysis;
- manager action queue;
- follow-up outcome tracking;
- data freshness and quality evidence.

Add Lifting, Collection, Product and Attendance only as their keys and definitions become certifiable. This sequence delivers reliable decisions earlier than attempting every page and KPI simultaneously.

## Final recommendation

Do not approve Phase 3 as “build the complete dashboard.” Approve it as “build the governed commercial intelligence foundation and one closed-loop executive use case.”

The success metric should not be number of charts, refresh speed or user logins. It should be measurable reduction in avoidable target shortfall, earlier detection of material risks, improved forecast value over baseline, higher action closure, and fewer decisions made from unreconciled data.
