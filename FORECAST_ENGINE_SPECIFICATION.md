# Forecast Engine Specification

## Scope

Forecast Sales only. Dealer lifting, Collection, Projection, stock and future Attendance may be displayed as context or used in later model versions, but the Phase 2 Sales-only forecast must be independently reproducible from Sales data.

## Forecast outputs

For Company, RSM, TSO, SR and any supported Sales-linked dealer/product grain:

- month-end point forecast;
- forecast achievement and gap to target;
- lower/upper interval after sufficient backtest history;
- method/version, cutoff date and training window;
- expected remaining sales and required daily pace;
- risk band and primary statistical drivers;
- backtest error metrics.

Do not imply precision unsupported by history. If confidence intervals cannot be calibrated, label the result “run-rate estimate,” not predictive forecast.

## Input contract

- Typed daily Sales with stable employee/hierarchy IDs.
- Official working-day calendar, elapsed/remaining working days and month cutoff.
- Historical monthly Sales currently available in report columns.
- Targets stored separately from actuals.
- Product quantities only for product forecasts and only with stable product/pack identity.
- Explicit missing/blank/closed status; hyphen is not automatically zero.

## Candidate methods

| Method | Formula/approach | Best use | Limitation |
|---|---|---|---|
| Working-day run rate | `MTD / elapsed WD × total WD` | Transparent baseline | Assumes constant pace |
| Recent weighted run rate | Weighted recent 3/7 WD average × remaining WD + MTD | Momentum-sensitive | Volatile early in month |
| Historical daily curve | Apply typical cumulative share by selling-day index | Captures intra-month pattern | Needs many closed months of daily data |
| Monthly seasonal average | Weighted prior comparable months/6M history | Stable hierarchy forecasts | Current report history is limited/uneven |
| Trend regression | Robust regression on daily or monthly history | Sustained trend | Sensitive to structural changes |
| Ensemble | Weighted combination chosen by backtest | Production candidate | Requires sufficient history and governance |

## Selection hierarchy

1. Fewer than 3 elapsed working days: suppress predictive result or use historical seasonal baseline with low confidence.
2. Limited history: working-day run rate is the official baseline.
3. Adequate recent daily observations: compare run rate and recent-weighted method.
4. Adequate closed daily history: add historical curve and robust trend candidates.
5. Select weights by rolling-origin backtest at each stable grain; fall back to parent/grand total when a child series is sparse.

## Reconciliation

Use a top-down/bottom-up hybrid:

- Compute child forecasts where data is adequate.
- Reconcile children to the approved parent forecast so totals add exactly.
- Allocate residual using recent contribution with caps to avoid extreme redistribution.
- Never add source subtotal rows to child totals.

Product forecasts must reconcile within compatible quantity units; do not add packs or liters without UOM conversions.

## Working-day logic

- Use selling-day index, not calendar-day count.
- Future working days come from the official calendar.
- Exclude holidays and explicitly approved shutdowns.
- Treat current day according to a documented cutoff rule; incomplete-day Sales must not be compared with full days.
- Joining date, close status and remaining eligible days must adjust employee forecasts.

## Risk classification

Default proposal, subject to management approval:

- Green: forecast achievement ≥ 100%.
- Amber: 90% to <100%, or required pace 10–25% above recent pace.
- Red: <90%, required pace >25% above recent pace, or sustained negative momentum.
- Gray: insufficient/invalid data.

Thresholds must be configurable by business unit and never hard-coded into metric logic.

## Backtesting

Use rolling-origin evaluation: for each closed month, simulate forecasts at selling-day cutoffs (for example WD 5, 10, 15, 20) without future leakage. Report MAE, WAPE, bias, median absolute percentage error, target-risk precision/recall and interval coverage. WAPE is preferred for portfolio reporting; avoid MAPE where actuals approach zero.

Evaluate Company and hierarchy levels separately. Compare every method against the naïve working-day run-rate baseline. A complex model is adopted only if it improves accuracy and stability materially.

## Anomaly handling

- Flag rather than silently delete spikes, negative values, long zero runs and source revisions.
- Winsorization or robust loss may be used only in experimental models with documented effect.
- New employees/dealers use parent/peer priors and are labeled cold-start.
- Closed entities forecast zero only when effective closure is verified.
- Late ERP loads trigger forecast recomputation and version increment.

## Explainability and versioning

Every forecast stores `forecast_id`, entity/grain, cutoff, method, model version, input batch, point value, interval, target, risk, created time and backtest score. Explanation examples: “pace is 8% below expected-to-date,” “last 3 working days improved 12%,” or “forecast uses parent allocation due to sparse history.” These statements must be deterministically supported.

## Current limitations

The present workbook contains one current daily month and several monthly historical fields, not a confirmed long daily history. Therefore the immediately certifiable method is working-day run rate plus descriptive momentum. Historical curves, calibrated intervals and automated ensemble selection require retained closed-period daily facts.
