# Business Process Analysis

## Sales

ERP exports a monthly, presentation-oriented report. The report combines hierarchy, daily sales, productivity KPIs, targets/forecast values, historical months and product quantities. Detail and management totals are interleaved. The business flow appears to be daily selling by SRs, consolidated through TSO, RSM and ASM levels, with dealer/point context attached to SR rows. The `Sales of July'26` field is month-to-date actual; month-end expected delivery is a forecast-like measure.

## Dealer lifting

Dealer lifting represents upstream replenishment/primary movement and dealer stock context, while `Secondary` represents downstream sales from dealer toward the market. Daily lifting and stock help interpret whether low sales arise from demand, stock availability or replenishment. Depot/super-dealer and management totals are embedded for operational review.

## Collection and projection

The transaction ledger records cash/bank collections and forward projection submissions. Collection has a bank/channel and effective date; Projection is a planned amount and legitimately lacks a bank. IDs identify event type and are currently unique. Submitted records roll up through TSM/TSO, RSM and ASM IDs and dealer.

## Forecasting design

Forecasting should not copy the current month-end estimate blindly. A governed forecast should have:

- actuals through an explicit cutoff timestamp;
- working-day calendar and remaining working days;
- recent daily run rate with configurable lookback;
- seasonality and comparable historical periods;
- stock and lifting constraints;
- submitted dealer projections as a separate signal;
- target as a benchmark, not an input disguised as actual;
- forecast version, method, owner and confidence interval.

Backtesting against closed months is required before selecting a method.

## Attendance contribution

Attendance adds a capacity/execution signal. It can explain field coverage, working hours, orders per active day and sales per attended hour. It must never overwrite sales; it joins through employee ID and work date. Access to personally sensitive fields should be restricted, with analytics using only necessary attendance measures.

## Required business confirmations

- Exact difference among Sales, Secondary, Lifting and Collection.
- Currency and whether values include tax/discount/returns.
- Whether one SR may serve multiple dealers and one dealer multiple SRs on the same date.
- Ownership and stability of PF, dealer, depot and product codes.
- Meaning of `SR QTY`, `DL_CD`, `Opening Copy`, `Main Lifting`, `TSM Diff`, grade fields and product group letters.
- Rules for closed/replaced/opened dealers and reassigned employees.
- Official working-day calendar and forecast acceptance criteria.
