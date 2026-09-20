# Working Global Concierge product

Open http://127.0.0.1:5173/product.html after running `npm run dev -- --port 5173 --strictPort` from the project root. The bot studio stays at `/`; the static references remain on 5175.

## Implemented

- Demo login into the current visitor session (not real authentication).
- Dashboard with empty/populated states, booking notifications and current credit.
- Single-leg and dynamic multi-leg journeys using a searchable airport/country directory.
- Editable dates, flight numbers, adult count, traveller names and lead contact.
- Per-leg departure/arrival services with per-adult, per-vehicle and per-booking prices, 10% illustrative corporate discount and credit deduction.
- Draft persistence at each Continue/Save draft action and when navigating away through the shell. Reload the page, then choose Resume saved booking. Unsaved typing is not autosaved.
- Confirmation, saved booking details, searchable booking list and Financials derived from the same persisted bookings.
- Archive/reset with a confirmation prompt. A successful reset returns to login and starts a clean session; a failed reset preserves the interface. Existing visitor records are retained locally.

## Architecture and future scenes

`controller.js` is the product action boundary: `load`, `enter`, `navigate`, `startBooking`, `changeDraft`, `saveDraft`, `confirm`, `openBooking`, `reset`. React components subscribe to its state. The future scene layer can use these same actions instead of duplicating booking logic. It must wait for saving to succeed before revealing confirmation or completing reset choreography.

`shared/product.js` defines service metadata, estimates and detail validation. The backend validates the submitted details, strips unknown fields and calculates the authoritative deduction in integer fils. SQLite stores draft and booking payloads with their visitor session. Confirmation retries keep their request key in sessionStorage, including across refresh; session reset clears the current pending key.

Existing sample bookings created through session.html without traveller details remain readable. The product UI always supplies full traveller and flight details. Cookie/session matching prevents an old tab from writing into a newer visitor session after reset elsewhere.

## Deliberately not yet implemented

Bot scenes, real authentication, supplier integration, child pricing, individual-traveller service allocation, amendments/cancellation, exports, and the disabled sidebar sections. Use fictional contact information for this local event PoC. There is no live reservation, actual payment or real credit agreement.

## Validation

The product tests cover draft validation, saved traveller details, server-calculated totals, duplicate-safe recovery after a lost response and failure-safe reset. Browser verification exercised a multi-leg booking, edited traveller, optional services, refresh/resume, confirmation and reflected Financials.

### Booking expansion (20 September 2026)

The credit facility starts at AED 100,000 with zero opening usage. Saved booking totals determine Dashboard and Financials balances; drafts do not consume credit. Reset archives the session and starts another zero-usage facility.

Journeys use a dynamic array of legs with stable IDs. Service selections are keyed by leg ID, direction and catalogue ID, so a repeated airport on different flights is billed independently. Airport edits remove selections no longer eligible. The HTTP body limit is 1 MiB; there is no two-leg UI limit. Required fields and contact/date/flight validation run in the browser and server.

The itinerary services screen switches between legs, departure/arrival and categories. The approved PoC catalogue covers Meet & Greet, lounge access, VIP assistance, chauffeur, porter and Dubai (DXB) departure-only home/hotel check-in. Lounges are departure-only in this PoC. Prices are illustrative: Meet & Greet AED 90–180 by airport/direction, lounge AED 220/adult, VIP AED 650/adult, porter AED 80/adult, chauffeur AED 280/vehicle (four travellers), home/hotel check-in AED 350/booking. A 10% corporate discount applies. The airport directory does not assert dnata supplier coverage. No services are actually reserved.

Service families reference: https://www.dnata.com/en/our-services/premium-services/

Airport search is offline, using `shared/data/airports.json`: 3,244 scheduled-service large/medium airports with IATA codes, across 233 countries/territories. Source: public-domain OurAirports data, downloaded 20 September 2026 from https://davidmegginson.github.io/ourairports-data/ (airports.csv and countries.csv). To refresh, join airports.iso_country to countries.code, filter scheduled_service=yes, type large_airport/medium_airport, and three-letter IATA codes; export code, name, city (municipality), country and countryCode. OurAirports does not guarantee accuracy.

Login is explicitly demo access: editable credentials, no authentication and no password persistence. Sample data buttons populate the current editable wizard step and remain visible while scrolling.

Journey UX: start with one flight and use Add another flight; the stored journey mode is derived from the flight count. Removing down to one flight is supported, and removed-flight service selections are discarded. All customer-facing terminology uses flight. Services show airport city/code and selected counts, compact single-total cards, next-airport navigation and a summary grouped by flight and airport.
