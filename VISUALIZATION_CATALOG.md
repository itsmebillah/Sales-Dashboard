# Visualization Catalog

## Selection rules

- Use position/length for precise comparison; reserve area/angle for contribution summaries.
- Do not use 3D charts, gauges with poor scale efficiency, decorative animation or unexplained dual axes.
- Show units, cutoff, comparison, zero baseline where relevant and data-quality coverage.
- All charts cross-filter, expose tooltips with numerator/denominator, and support drill to records when authorized.
- Rank categories; group minor categories as “Other” only with drill access.

## Executive and pace visuals

| ID | Visualization | Business question | Measures/dimensions | Drill |
|---|---|---|---|---|
| V01 | KPI card + sparkline | What is the current result and direction? | Sales, target, forecast, growth, collection, lifting | Metric detail |
| V02 | Cumulative pace line | Are we ahead of expected target pace? | Cumulative Sales, target pace, forecast | Date → hierarchy |
| V03 | Daily line + rolling average | Is momentum improving? | Daily Sales, 3/7-day average | Day → contributors |
| V04 | Bullet chart | Who is on target? | Actual, target, forecast by hierarchy | RSM → TSO → SR |
| V05 | Variance waterfall | What explains the gap/change? | Entity/product absolute variances | Contributor detail |
| V06 | Risk heatmap | Where are multiple risks concentrated? | Risk severity by hierarchy/category | Risk → entity |
| V07 | Contribution treemap | Who contributes most? | Sales share | Hierarchy/entity |
| V08 | Executive driver bars | Top positive/negative drivers? | Absolute change/gap | Entity detail |

## Comparison and hierarchy visuals

| ID | Visualization | Business question | Measures/dimensions | Drill |
|---|---|---|---|---|
| V09 | Ranked horizontal bars | Who leads/lags? | Sales/growth/achievement | Peer → detail |
| V10 | Contribution–growth scatter | Is scale accompanied by growth? | Contribution, growth; size=Sales | Entity detail |
| V11 | Target-gap quadrant | Which entities need action? | Forecast achievement, momentum; size=gap | Entity action view |
| V12 | Distribution/box plot | How does performance compare with peers? | KPI distribution by peer group | Outlier entity |
| V13 | Decomposition tree | Where does company result originate? | Sales/variance through hierarchy | Company → product |
| V14 | Expandable matrix | What is the complete scorecard? | KPI columns by hierarchy | Row expand/source |
| V15 | Dumbbell/slope chart | How did rank or mix change? | Current vs comparison value | Entity/product |
| V16 | Small multiples | Are trends consistent across units? | Daily/monthly trend per entity | Panel detail |

## Dealer, lifting and stock visuals

| ID | Visualization | Business question | Measures/dimensions | Drill |
|---|---|---|---|---|
| V17 | Dealer health matrix | Which dealers combine weak growth/recovery? | Growth, collection proxy; size=Sales; color=stock risk | Dealer detail |
| V18 | Sales–Lifting scatter | Where do movement and sales diverge? | Sales, Lifting, peer bands | Dealer/hierarchy |
| V19 | Stock-days histogram | How is inventory risk distributed? | Dealer count by stock-days band | Risk dealers |
| V20 | Reconciliation waterfall | How do lifting, secondary and stock relate? | Approved reconciliation measures | Depot/dealer |
| V21 | Dealer activity timeline | What occurred and when? | Sales/Lifting lines, Collection events | Transaction/day |
| V22 | Geographic map | Where is performance concentrated? | Territory Sales/risk | Territory → dealer; only after geo IDs |
| V23 | Lifecycle flow | How are dealer states changing? | Open/replaced/closed counts | Dealer list |
| V24 | Exception table | What action is needed? | Risk evidence, impact, owner | Source records |

## Product visuals

| ID | Visualization | Business question | Measures/dimensions | Drill |
|---|---|---|---|---|
| V25 | Pareto chart | Which products drive most volume/value? | Ranked product + cumulative share | Group → product → pack |
| V26 | Drillable bars | What is product hierarchy performance? | Quantity/value by group/product/pack | Product path |
| V27 | Product × hierarchy heatmap | Where is each product strong/weak? | Quantity/mix/growth | Cell → contributors |
| V28 | Mix-shift dumbbell | Which products gained/lost mix? | Prior/current mix | Product detail |
| V29 | Top/bottom ranking | Which products lead/lag? | Quantity/growth | Product detail |
| V30 | Product trend small multiples | Is growth broad or isolated? | Time trend by product | Product → hierarchy |

## Collection and projection visuals

| ID | Visualization | Business question | Measures/dimensions | Drill |
|---|---|---|---|---|
| V31 | Daily Collection line | Is recovery activity on pace? | Collection and aligned Sales | Day → transactions |
| V32 | Bank mix bars | Through which channels is money collected? | Collection by bank | Bank → transaction |
| V33 | Collection ranking | Who/dealer collects most or least? | Collection, proxy ratio, gap | Hierarchy → dealer |
| V34 | Actual–Projection variance bars | How accurate are submissions? | Actual, Projection, variance | Entity/dealer |
| V35 | Projection accuracy trend | Is field judgment improving? | WAPE/bias by period | Hierarchy |
| V36 | Transaction table | What are the underlying events? | All event fields | Transaction detail |

## Forecast and anomaly visuals

| ID | Visualization | Business question | Measures/dimensions | Drill |
|---|---|---|---|---|
| V37 | Forecast fan chart | What range of outcomes is plausible? | Actual, point forecast, interval | Entity/period |
| V38 | Forecast gap waterfall | Where is forecast shortfall located? | Gap by hierarchy/product | Contributor |
| V39 | Accuracy by cutoff line | When does forecast become reliable? | WAPE/bias by selling day | Method/grain |
| V40 | Method comparison table | Which method wins? | Error, bias, coverage, stability | Backtest runs |
| V41 | Control chart | Which days/entities are anomalous? | Sales vs robust bounds | Observation |
| V42 | Calendar heatmap | Are there temporal gaps/patterns? | Daily Sales/Lifting/Collection | Day detail |
| V43 | Risk bubble chart | What is severity and exposure? | Probability proxy, impact, urgency | Risk case |
| V44 | Insight feed | What happened and what should we do? | Evidence-linked narratives | Supporting view |

## Future Attendance visuals

| ID | Visualization | Business question | Measures/dimensions | Drill |
|---|---|---|---|---|
| V45 | Attendance calendar heatmap | Where are absence/late patterns? | Status by employee/date | Authorized event detail |
| V46 | Attendance vs productivity scatter | Does field presence align with output? | Attendance rate, Sales/present day | Team/employee |
| V47 | Worked-hours trend | Is capacity changing? | Hours, Sales/hour | Hierarchy/date |
| V48 | Absence-impact waterfall | What output is associated with lost capacity? | Expected vs actual productivity | Team/date |

## Conditional and prohibited visuals

- Geographic maps require governed geography/coordinates; dealer text is insufficient.
- Receivable aging charts, DSO gauges and true recovery funnels are prohibited until invoice/allocation data exists.
- Margin waterfalls are prohibited until cost and net revenue exist.
- Product value charts are prohibited until SKU-level values exist.
- Forecast intervals are prohibited until calibrated coverage is demonstrated.
- Pie/donut charts are limited to a small number of stable categories such as bank mix; sorted bars remain the default.
