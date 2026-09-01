# Executive Dashboard Blueprint

## 1. Information architecture

The application has one global context bar and nine analytical workspaces:

1. Executive Summary
2. Sales Performance
3. Forecast and Target Risk
4. Hierarchy Performance
5. Dealer Intelligence
6. Product Intelligence
7. Lifting, Stock and Secondary
8. Collection and Projection
9. Risks, AI Insights and Data Quality

Operational Reports and future Attendance are accessible as secondary modules. The default landing page answers “Are we on plan, why, and where must we act?” in one screen.

## 2. Global interaction model

Persistent filters: reporting month, as-of date, comparison basis, ASM/NSM, RSM, TSO, SR, dealer, depot, territory/area, product group, product, pack, status and risk band. Default scope is the latest complete source cutoff and the user’s authorized hierarchy.

Controls:

- Reset filters, bookmark view and export current scope.
- Breadcrumb drill: Company → RSM → TSO → SR → Dealer → Product.
- Cross-filter on chart selection; visible filter chips show every active constraint.
- Toggle value/quantity, actual/forecast and absolute/% variance where valid.
- “Matched population only” warning for cross-dataset ratios, with match coverage shown.
- Metric-definition tooltip, refresh timestamp and quality badge on every page.

## 3. Executive Summary

### Header

Title, selected period, cutoff, working days elapsed/total, last refresh, data-quality state and comparison selector.

### KPI cards

Primary row: MTD Sales, Target Achievement, Forecast, Forecast Achievement, MoM Growth, Collection, Lifting and Target-at-Risk Value.

Secondary row: Average Daily Sales, Required Daily Sales, Secondary, Stock, Collection-to-Sales proxy, Active Dealers, Active SRs and Unmatched Amount/Records.

Each card shows value, delta, mini-trend, status color, numerator/denominator coverage and click-through.

### Executive visuals

- Cumulative Sales versus expected target pace and forecast.
- RSM performance bullet/bar chart showing actual, target and forecast.
- Daily Sales with rolling average and anomaly markers.
- Sales/Lifting/Collection indexed trend; avoid mixing raw measures on misleading dual axes.
- Product group mix and change versus comparison period.
- Risk heatmap by RSM and risk category.
- Top five positive and negative monetary contributors.

### Executive narrative

Five concise, evidence-linked statements: overall result, target exposure, strongest driver, largest risk and recommended next action. Every statement links to its underlying view.

## 4. Sales Performance

KPI strip: Sales, target, gap, ADS, required pace, productive days, order count, sales/order, momentum and volatility.

Views:

- Cumulative pace chart.
- Daily calendar/heatmap and day-of-week profile.
- Current versus previous/6M average variance waterfall.
- Hierarchy contribution treemap or sorted bars.
- Detailed matrix: hierarchy rows; actual, target, achievement, forecast, growth, rank and risk columns.

Drill from company to source-level daily records while preserving cutoff and comparison.

## 5. Forecast and Target Risk

KPI strip: point forecast, forecast gap, expected remaining sales, required pace, pace uplift and model/backtest score.

Views:

- Actual cumulative line plus baseline/selected forecast trajectory and interval.
- Forecast achievement distribution by hierarchy.
- Gap-to-target waterfall identifying where shortfall sits.
- Risk quadrant: forecast achievement vs recent momentum, bubble size = target gap.
- Method comparison/backtest table for authorized analysts.
- Entity action queue sorted by recoverable gap and required uplift.

## 6. Hierarchy Performance

Tabs: RSM, TSO, SR and Area. A standardized scorecard avoids changing KPI meaning by level.

Views:

- Ranked bullet bars for Sales vs Target.
- Contribution vs Growth scatter plot.
- Peer percentile distribution.
- Performance breadth: share of children on target/growing.
- Decomposition tree from Company through hierarchy to dealer/product.
- Expandable performance table with sparkline, rank, pace, forecast, growth, collection proxy and quality state.

## 7. Dealer Intelligence

### Dealer health scorecard

Sales, growth, lifting, secondary, stock, stock days, collection, collection proxy, projection, last activity, concentration and mapping quality. Health state must display component evidence; no opaque composite score is permitted.

### Views

- Dealer health matrix: Growth × Collection proxy; size = Sales; color = stock risk.
- Dealer ranked table with health flags and recommended action.
- Sales–Lifting divergence scatter.
- Stock-days distribution and low/excess stock lists.
- Dealer timeline combining daily Sales, Lifting and Collection event markers.
- New, closed, replaced and inactive dealer report.
- Dealer detail page with hierarchy/territory/depot, trend, products, collections and source records.

## 8. Product Intelligence & Products-Wise Sales Analysis

KPI strip: quantity, sales value, value share %, volume share %, rank, category comparison ratio (Detergent vs Others), mix shift, selling SR/dealer count where supported, and zero-sale products.

Views:

- Products Wise Sales Analysis workspace with Value vs % Share dual-mode toggles.
- Category Comparison Visual (Detergent vs Others) comparing monetary revenue value and percentage mix.
- Product group → product → pack drillable bars and category mix distribution.
- Pareto chart with cumulative contribution and ABC SKU classification.
- Product × hierarchy heatmap.
- Top/bottom product rankings with value and volume filters.
- Detailed Product Register table with SKU value, %, volume, and category ranks.

## 9. Lifting, Stock and Secondary

KPI strip: Lifting, event count, average ticket, Secondary, Stock, Stock Days, lifting-to-sales and risk dealer counts.

Views:

- Daily lifting trend and cumulative pace.
- Lifting vs Sales scatter by dealer/TSO.
- Lifting → Secondary → Stock reconciliation waterfall after rules are approved.
- Depot → Dealer contribution hierarchy.
- Low-stock/excess-stock risk table.
- Daily lifting calendar and inactive dealer list.

## 10. Collection and Projection

KPI strip: Collection, transaction count, average ticket, collecting dealers, Collection-to-Sales proxy, proxy gap, Projection and Projection accuracy when closed data exists.

Views:

- Daily Collection trend with Sales context.
- Bank/channel mix using sorted bars; donut only for compact executive summary.
- Collection by hierarchy and dealer ranking.
- Collection transaction table with ID, date, dealer, bank, submitter and status.
- Actual vs Projection variance bars/scatter.
- Projection bias and accuracy trend after history accumulates.

Label all current recovery/outstanding views as proxies. Do not display receivable aging or DSO until finance facts exist.

## 11. Risk and AI Insight Center

Risk cards: target, decline, momentum, stock, collection, concentration, anomaly, mapping and freshness.

Main table fields: severity, entity, signal, observed value, threshold/baseline, estimated impact, evidence, suggested action, owner, due date, status and first/last detected.

AI narrative design:

- Summarize only certified measures returned by the semantic layer.
- Cite the exact entity, period and metric values used.
- Distinguish observation, likely explanation and recommendation.
- Never assert causality from correlation.
- Permit feedback: useful/not useful, acknowledge, assign, resolve.
- Fall back to deterministic templates when model service is unavailable.

## 12. Operational and performance reports

Operational:

- Daily Sales ledger and missing-day report.
- Dealer lifting/stock exceptions.
- Collection transaction register and bank reconciliation extract.
- Projection submission coverage.
- New/closed/replaced dealer register.
- Unmatched key, rejected row, stale source and reconciliation exception reports.

Performance:

- RSM/TSO/SR monthly scorecards.
- Area/depot/dealer performance packs.
- Target gap and recovery action list.
- Product mix/top-bottom report.
- Forecast accuracy and bias report.

Reports show filter scope, definition version, cutoff and export timestamp.

## 13. Future Attendance module

Pages: attendance overview, hierarchy attendance, exceptions and attendance-adjusted productivity. KPIs include attendance rate, worked hours, Sales per present day/hour, dealer coverage per present day and absenteeism impact. Managers see authorized aggregate/team data; sensitive raw events are restricted. Attendance filters augment existing Sales views without changing Sales definitions.

## 14. Responsive layout and accessibility

- Desktop: 12-column grid; mobile: prioritized KPI stack and one chart per section.
- Do not rely on color alone; use icons/text labels and accessible contrast.
- Currency, quantity, percent and dates use consistent locale-aware formats.
- Tables support keyboard navigation, search, sort, pinned identity columns and virtualization/pagination.
- Empty, loading, stale, partial-match and error states are designed explicitly.

## 15. Definition of dashboard readiness

Before build approval: hierarchy keys and security scope approved; core KPI definitions signed off; source totals reconcile; cross-dataset match coverage is visible; forecast baseline is backtested; risk thresholds have owners; wireframes pass executive and field-manager review.
