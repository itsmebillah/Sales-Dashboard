# Phase 2 Edge-Case Validation

| Case | Current behavior | Result |
| --- | --- | --- |
| Zero Sales day | Literal zero emits a dated fact; blank/hyphen emits no fact. Dashboard cannot distinguish a true zero from missing/not-loaded data. | Fail for semantic distinction |
| Missing dealer in Sales | Sales remains valid and contributes to Company/employee, but dealer attribution is absent. | Conditional |
| Missing dealer in Collection/Projection | Validator quarantines the transaction record. | Pass |
| Missing SR | Source row 220 is ignored and logs `SALES_EMPLOYEE_KEY_MISSING`; batch becomes FAILED even though row has no amount. | Control policy unresolved |
| Empty Projection | SUM falls back to zero and empty exception lists render safely. | Pass |
| Duplicate transaction ID | Duplicate canonical record ID quarantines subsequent duplicate; first record remains. | Pass |
| Duplicate dealer Lifting row | Logged as error but both rows would still be emitted unless duplicate record validation catches their identical record IDs/metrics. | Conditional |
| Incorrect transaction date | Parser ignores row and logs error. | Pass |
| Invalid Sales calendar day | Day number is formatted without validating month length; a populated February day 31 could create an invalid date string. | Fail |
| Future Collection date | No future-date validation exists. | Fail |
| Future Projection date | Accepted; may be legitimate, but no separate effective-date policy exists. | Policy required |
| Cancelled transaction | Status is stored but not filtered; a cancelled numeric transaction would still aggregate. | Fail |
| Closed/cancelled Sales row | Only Designation=SR controls inclusion; close/status fields are not applied to daily facts. | Policy required |
| Single-day Sales | Formula can calculate when elapsed WD > 0, but confidence/cutoff handling is not certified. | Conditional |
| First day of month | No minimum elapsed-day suppression is implemented despite forecast specification. | Fail |
| Month-end | Growth requires Current WD >= Total WD; current mixed maxima make this unreliable. | Fail |
| Last day of month | Day columns 1–31 are accepted based on headers; month-length validation is absent. | Fail |
| Source subtotal rows | Designation and dealer-detail classifiers exclude presentation/subtotal rows. | Pass |
| Blank versus hyphen | Both become null under configured blank tokens despite the Parser Contract saying preserve them separately. | Fail contract fidelity |
| Negative business amount | Record is quarantined. | Pass, except approved reversals are unsupported |
| Partial current day | No approved cutoff policy; current-day partial values influence Sales, momentum and forecast. | Fail |

Edge certification is withheld until failed cases have explicit business policies and automated regression tests.

