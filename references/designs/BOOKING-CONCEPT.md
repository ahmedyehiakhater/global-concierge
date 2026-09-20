# B2B booking experience — credit facility

Static HTML storyboard, using the existing dnata shell, tokens and components. There is no authentication, backend, payment processing, credit ledger or data persistence.

## Confirmed business model

The agent or travel desk books against the organisation’s corporate credit facility. The net booking value after corporate discount reduces available credit; the agent does not make a payment at checkout.

Journey → Travellers → Services → Review → Credit facility → Confirmation.

The final step shows the organisation, credit limit, used credit, available credit before booking, net deduction and projected available credit afterwards. The confirmation is explicitly simulated. The required acknowledgement navigates to a local confirmation page; no balance is changed.

The right-hand summary shows selected service charges, subtotal, corporate discount, net credit charge and available credit. Before services are selected, the corporate rate is shown but no amount is calculated.

## Illustrative figures, not confirmed terms

- Corporate discount: 10% applied to the sample service subtotal, including hypothetical fees/taxes. Actual eligibility and tax treatment remain to be agreed.
- Facility: AED 100,000 limit; AED 32,500 used; AED 67,500 available.
- Single leg: DXB → CAI, two adults. AED 640 subtotal − AED 64 discount = **AED 576 credit deduction**. Available afterwards: **AED 66,924**.
- Multi-leg: DXB → CAI → LHR, two adults. AED 1,040 subtotal − AED 104 discount = **AED 936 credit deduction**. Available afterwards: **AED 66,564**.
- The two flows are alternative examples starting at the same balance, not consecutive transactions.
- Empty Financials represents a configured facility with no usage: AED 100,000 limit, AED 0 used and AED 100,000 available; activity and savings remain zero.

Financials separates current credit balances from historical booking activity. Historical booking value is not the same as outstanding credit usage: settlements and adjustments can change the latter. AED throughout is illustrative sample data, not a currency conversion of the previous export.

## Scope and open questions

The same travellers take every leg. Flights, services, schedules and prices are unverified examples. Login and traveller inputs remain read-only; services are fixed selections.

Still to agree: airport/provider availability, connecting-flight services, traveller-specific service selection, child/infant pricing, corporate discount eligibility, tax calculation, and cancellation rules. For the credit facility: insufficient-credit handling, blocked/overdue accounts, approval permissions, holds versus immediate deduction, settlement cycles and refund processing. The current design shows the sufficient-credit happy path and makes no live guarantee of availability.

## Maintenance

`tools/build_booking_references.py` regenerates login and both six-screen flows. Sample facility and discount constants live at the top. Existing `booking_*_payment` folder names remain for link compatibility; the page title and step label are now “Credit facility”. The gallery labels are updated too. `shared/booking.css` uses the central palette. Run `python3 verify_references.py` after editing.
