# Local visitor-session backend

This is the persistence foundation for the Fursa Tek PoC, not the finished booking product or the scene controller. The existing bot module and reference HTML remain independent.

## Start

Use Node 24 (the laptop's bundled Codex runtime works), then `npm run dev -- --port 5173 --strictPort`, or double-click `start-dev.command`. This starts Vite and the API together. Stop existing standalone development/API processes before starting a second instance.

- Browser verification workspace: http://127.0.0.1:5173/session.html
- Existing bot studio: http://127.0.0.1:5173/
- API: http://127.0.0.1:8787/api/health

The separate static-reference server on 5175 is unchanged. `npm run server` and `npm run dev:ui -- --port 5173 --strictPort` can also be used separately. The client expects the Vite `/api` proxy, and the mutation origin allowlist uses port 5173. This is a localhost-only event service, not an internet deployment. `npm run build` packages the frontend; Vite preview alone does not run or proxy the backend.

## Persistence and reset

`data/concierge.sqlite` stores anonymous session IDs, timestamps, completed features and sample bookings with price snapshots. Data is excluded from Git. The SQLite database uses WAL mode. Do not delete the database as part of visitor reset.

A persistent HttpOnly, SameSite cookie identifies the kiosk's session. Refreshing or restarting the server resumes it. A browser profile gets its own session. All tabs in that profile share it. The SQLite reset transaction archives the previous session and creates the next one. Old mutation requests cannot add bookings to an archived session. Reloading a stale tab follows the reset chain to the current session.

Bookings and resets require idempotency keys: retry the same logical request with the same key. A repeated booking does not charge twice; using its key with a different payload is rejected. Reset retries return the same next session. The verification UI retains uncertain-operation keys while the page remains open. A future product should persist in-flight request keys across page closure before it supports real transactions.

The outgoing session's bookings and feature progress remain in the database. There is deliberately no browser endpoint exposing previous visitors' records. For a backup, stop the API and copy the entire `data` directory. `GC_DATABASE` overrides the database path for testing or a different local storage location.

## API used by the product and scenes

`src/api/client.js` exposes `load`, `completeFeature`, `book` and `reset`. Call reset successfully before clearing the interface. If saving fails, keep the current UI and offer retry. A later scene controller can animate teardown around the successful reset, but should never erase the database.

- `GET /api/session`: resume/create the current session; returns bookings, feature progress and balances.
- `GET /api/catalog`: sample prices and corporate discount.
- `POST /api/session/features`: `{feature}` from workspace/dashboard/booking/bookings/financials.
- `POST /api/bookings`: `{mode: 'single'|'multi', adults: 1..20, services: [...]}`. Allowed service IDs are in the catalog. Unknown price/credit fields are ignored; the server computes the amount.
- `POST /api/session/reset`: archive and start the next visitor.

Writes require JSON and `X-GC-Demo: 1`. Booking/reset also require `Idempotency-Key`. All monetary values are **integer fils**, not floating point AED. Every session starts with a sample AED 100,000 limit, zero opening usage and a 10% corporate discount. Available credit is derived from saved bookings, not browser state. Insufficient credit and invalid services fail without saving any part of the booking.

No real login, traveller PII, card collection, supplier reservations or payments are implemented. Booking drafts, cancellation, amendments, full product screens and scene events beyond feature completion are subsequent integrations. Session records have no automatic deletion policy yet; the operator controls the local demo data.

## Checks

`npm test` includes persistence after database reopening, atomic archival reset, duplicate request protection, HTTP cookie handling, stale requests, origin checks and insufficient credit. The real browser verification confirmed a saved booking and feature survive reload, and reset returns to an empty session with the starting facility.
