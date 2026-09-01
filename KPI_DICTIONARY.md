# KPI Dictionary

## Phase 4 implementation contract

The authoritative calculation source is `SIP.KpiEngine` v1.0.0. Every supported entity level—Company, ASM, RSM, TSO, Territory, Area, SR, Dealer, Product, and Category—returns the same KPI contract. Area remains empty until a distinct Area source is governed; Territory is never aliased into Area.
Aggregation is performed once from accepted Master Dataset records; modules do not recalculate formulas independently.

Implemented baseline fields include Sales, Target, Achievement, Gap, forecast, forecast achievement, required/average daily Sales, working days, entity counts, Collection, Projection, Lifting, Stock, Secondary, orders, comparable growth, momentum, Collection flow ratio, product volume/mix, category sales value, category volume %, Detergent vs Others comparison, rank, contribution, trend, forecast inputs, Present/Absent days, Attendance %, Sales per present day, and certification state.

Growth is deliberately `null` until the current period is comparable with the closed historical period. This prevents MTD Sales from being misrepresented as full-month growth. Collection flow metrics remain operational proxies and are never labeled receivable recovery or outstanding.

## Rules

Notation: `A` actual Sales, `T` monthly Target, `WD_e` elapsed working days, `WD_t` total working days, `WD_r = WD_t - WD_e`, `L` Lifting, `S2` Secondary, `C` Collection, `P` submitted Projection, `Stock` dealer stock. Ratios return null when the denominator is zero. All comparisons require identical scope and cutoff. “Available” means computable after Phase 3 normalization; “conditional” requires definition validation or stronger joins.

## Sales, target and pace

| KPI | Definition | Availability |
|---|---|---|
| MTD Sales | Sum daily Sales through cutoff | Available |
| Daily Sales | Sum Sales for selected date | Available |
| Target | Approved monthly target at selected grain | Available where source target maps cleanly |
| Target Achievement % | `A / T × 100` | Available |
| Target Gap | `T - A` | Available |
| Expected-to-Date Target | `T × WD_e / WD_t` | Available after calendar validation |
| Pace Variance | `A - Expected-to-Date Target` | Available |
| Pace Achievement % | `A / Expected-to-Date Target × 100` | Available |
| Average Daily Sales | `A / WD_e` | Available |
| Required Daily Sales | `max(T - A, 0) / WD_r` | Available |
| Required Pace Uplift % | `Required Daily Sales / Average Daily Sales - 1` | Available |
| Productive Day Count | Working days with Sales > 0 | Available |
| Zero-Sales Day Count | Elapsed working days with Sales = 0 | Available |
| Working-Day Utilization % | Productive days / elapsed working days | Available |
| Month-end Run-rate Forecast | `A / WD_e × WD_t` | Available |
| Forecast Achievement % | Forecast / Target × 100 | Available |
| Forecast Gap | Target - Forecast | Available |
| Order Count | Source `No. of Order` | Conditional on definition |
| Sales per Order | Sales / Order Count | Conditional |
| Orders per Working Day | Order Count / WD_e | Conditional |
| Memo per Day | Source/derived memo count / WD_e | Conditional |
| Memo per Hour | Source memo / working hour | Conditional |
| Sales per Working Hour | Sales / reported working hours | Conditional |

## Growth, trend and momentum

| KPI | Definition | Availability |
|---|---|---|
| MoM Growth % | `(current month - previous month) / previous month × 100` | Available |
| Absolute MoM Change | Current month - previous month | Available |
| Growth vs 3M Average | `(A - avg prior 3 months) / avg prior 3 months` | Available if history aligned |
| Growth vs 6M Average | `(A - avg prior 6 months) / avg prior 6 months` | Available |
| YoY Growth % | `(current - same month prior year) / prior year` | Conditional on history |
| Rolling 3-Day Average | Mean Sales over last 3 working days | Available |
| Rolling 7-Day Average | Mean Sales over last 7 working days | Available |
| Short-term Momentum % | latest up-to-3 matured working-day average / preceding equal working-day average - 1; zero comparison returns unavailable | Available |
| Trend Slope | Linear slope of daily Sales over chosen window | Available |
| Volatility | Standard deviation or coefficient of variation of daily Sales | Available |
| Growth Contribution | Entity absolute growth / company absolute growth | Available |
| Consecutive Decline Count | Number of consecutive periods with negative growth | Conditional on history depth |

## Hierarchy performance

These apply independently at ASM, RSM, TSO, Territory, Area, SR, Dealer, Product, and Depot where a governed fact relationship exists.

| KPI | Definition | Availability |
|---|---|---|
| Contribution % | Entity Sales / parent Sales | Available |
| Rank | Rank by selected KPI within peer group | Available |
| Percentile | Entity percentile within comparable peers | Available |
| Attainment Rank | Rank by Target Achievement % | Available |
| Active SR/Dealer Count | Count with Sales > 0 in period | Available after mapping |
| Average Sales per SR | Sales / active SR count | Available |
| Average Sales per Dealer | Sales / active dealer count | Conditional on Sales dealer mapping |
| Target-Hit Count | Count entities with achievement ≥ 100% | Available |
| Target-Hit Rate | Target-hit count / target-bearing entities | Available |
| Underperformance Value | Sum positive target gaps | Available |
| Parent Dependence | Largest child contribution to parent | Available |
| Performance Breadth | Share of children growing/achieving target | Available |

## Product performance & Products-Wise Sales Analysis

| KPI | Definition | Availability |
|---|---|---|
| Product Quantity | Sum quantity by product/pack | Available |
| Category Sales Value | Sum Sales Amount for SKU ∈ Category | Available |
| Category Sales Value Share % | `(Category Sales Value / Total Sales Value) × 100` | Available |
| Category Volume Share % | `(Category Volume / Total Company Volume) × 100` | Available |
| Target Category vs Others Ratio | `Target Category Value / Others Value` (e.g. Detergent vs Others) | Available |
| Product Value Mix % | Product sales value / total sales value | Available |
| Product Volume Mix % | Product quantity / compatible group quantity | Available; never mix incompatible UOMs |
| Product Rank | Rank by value or quantity within group/pack basis | Available |
| Product Growth % | Current vs prior comparable product quantity/value | Conditional on historical product grain |
| Product Penetration % | Selling SRs/dealers for product / active SRs/dealers | Conditional on product relationship grain |
| Zero-Sale Product Count | Active products with zero quantity/value | Available after product master |
| Top-N Contribution | Top-N product quantity/value / total | Available |
| Mix Shift | Current mix % - prior mix % | Conditional |
| Pareto Cumulative Contribution % | `Running Sum(SKU Value) / Total Sales Value × 100` | Available |

## Lifting, secondary and stock

| KPI | Definition | Availability |
|---|---|---|
| MTD Lifting | Sum dealer Lifting | Available |
| Lifting Event Count | Sum/number of lifting events | Conditional on field definition |
| Average Lifting Ticket | Lifting / lifting event count | Conditional |
| MTD Secondary | Sum Secondary | Conditional on business definition |
| Stock | Sum/latest dealer stock at common as-of date | Conditional on snapshot semantics |
| Lifting-to-Sales Ratio | `L / A` on matched population | Conditional |
| Sales-to-Lifting Ratio | `A / L` | Conditional |
| Secondary-to-Lifting % | `S2 / L × 100` | Conditional |
| Stock Change Proxy | `L - S2` or approved reconciliation | Not certified until equation confirmed |
| Stock Days | `Stock / average daily secondary or sales` | Conditional |
| Replenishment Gap | Sales - Lifting | Conditional; interpretation depends on flow |
| Low-Stock Dealer Count | Dealers below approved stock-days threshold | Conditional |
| Excess-Stock Dealer Count | Dealers above threshold | Conditional |
| Inactive Dealer Count | Active master dealers with no Sales/Lifting in window | Requires dealer master |

## Collection and projection

| KPI | Definition | Availability |
|---|---|---|
| Collection Amount | Sum Collection transactions | Available |
| Collection Transaction Count | Count distinct Collection IDs | Available |
| Average Collection Ticket | Collection / transaction count | Available |
| Collecting Dealer Count | Distinct dealers with Collection | Available after mapping |
| Collection Frequency | Transactions / collecting dealer | Available |
| Collection-to-Sales % | `C / A × 100` on aligned matched population | Conditional/proxy |
| Collection Gap Proxy | `A - C` | Conditional; not true outstanding |
| Collection-to-Lifting % | `C / L × 100` | Conditional/proxy |
| Collection-to-Secondary % | `C / S2 × 100` | Conditional/proxy |
| Bank Mix % | Collection by bank / total Collection | Available |
| Cash Collection % | Cash Collection / total Collection | Available |
| Projection Amount | Sum Projection transactions | Available |
| Projecting Dealer Count | Distinct dealers with Projection | Available |
| Projection Coverage % | Projecting active dealers / eligible active dealers | Requires eligibility/master |
| Actual vs Projection Variance | Actual aligned Sales - Projection | Conditional |
| Projection Accuracy % | `1 - abs(actual-projection)/actual` bounded per policy | Conditional on closed periods |
| Projection Bias % | `(projection-actual)/actual` | Conditional |
| True Outstanding | Open receivable balance | Not available |
| Recovery % | Allocated collections / collectible receivables | Not available; proxy ratio only |
| DSO/Aging | Receivable timing measures | Not available |

## Risk, concentration and quality

| KPI | Definition | Availability |
|---|---|---|
| Top-5 Concentration % | Top 5 entity Sales / total Sales | Available |
| HHI Concentration | Sum squared contribution shares | Available |
| Target-at-Risk Value | Sum forecast shortfall where forecast < target | Available |
| Declining Entity Count | Entities below growth threshold | Available |
| Volatile Entity Count | Entities above volatility threshold | Available |
| Sales Anomaly Score | Robust deviation from own history/peer expectation | Conditional on history |
| Collection-Risk Count | Dealers below approved collection proxy threshold | Conditional |
| Stock-Risk Count | Dealers outside approved stock-days band | Conditional |
| Unmatched Dealer Count/% | Records/amount without governed dealer key | Available after matching |
| Unmatched Employee Count/% | Records/amount without governed employee key | Available |
| Stale Data Age | Now - latest successful source refresh | Requires batch metadata |
| Reconciliation Variance | Parsed atomic total - source reported total | Available in Phase 3 |
| Data Quality Score | Weighted completeness, validity, uniqueness, mapping, freshness | Requires approved weights |

## Attendance KPIs

Present days, Absent days, Attendance %, and Sales per present day are implemented from HR Attendance joined by stable SR ID plus explicit attendance date. The Attendance reporting month is always the selected Sales month. Leave, late arrival, worked hours, field-day utilization, Sales per worked hour, attendance-adjusted target pace, absenteeism impact, and manager team attendance remain conditional on governed source fields and privacy-approved policies.
