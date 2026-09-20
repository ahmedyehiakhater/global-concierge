# dnata design references

Static HTML + Tailwind references, with no application integration. Start a local server in this directory (`python3 -m http.server 5175`) and open http://127.0.0.1:5175/ for the gallery. The existing Vite bot studio is unaffected.

## Shared structure

- `shared/tokens.css` is the **only colour palette definition**. Edit this one `:root` block to recolour every screen, utility, chart, shadow and interaction.
- `shared/tailwind.config.js` maps the original Stitch semantic utility names to those CSS variables. Existing page grids, typography, cards, forms and content remain intact.
- `shared/reference.css` contains shell layout and shared treatments.
- `shared/shell.html` is the canonical static header/sidebar source. Every screen embeds the same markup; the active sidebar link's `aria-current="page"` is the only normal variation. `empty_shell` deliberately has only the disabled Dashboard stub.
- Navigation order: Dashboard, Marketplace, Bookings, Financials, Clients, Reports, Corporate Accounts, Agent Tools. Support Center sits at the bottom. Sections without an exported reference are disabled placeholders rather than broken routes.
- Header: dnata wordmark, search, New Booking, notifications, settings, profile avatar. At mobile widths the sidebar becomes an icon rail; desktop pages retain the full left navigation.

Primary brand and links use blue. Primary actions use lime with near-black text. Success, warning and error use independent semantic tokens. No lime text on light surfaces. Original inline colours and individual Tailwind palettes have been removed. The existing financial chart reads tokens when it renders; reload after editing palette values.

## Screens

Existing references: `agent_dashboard`, `all_bookings_management`, `booking_details_desktop`, `modify_booking_expanded_workspace_with_summary_panel`, `booking_confirmation_desktop_updated_navigation`, `cancel_booking_refund_summary`, `financials_insights_dashboard_optimized`.

New empty states:

- `empty_dashboard/code.html`: no active bookings, zero counts and a deliberate first-booking prompt.
- `empty_bookings/code.html`: no booking rows, zero counts, inactive filters and a create-booking prompt.
- `empty_financials/code.html`: all metrics at zero, a flat zero-value SVG trend, empty leaderboard and products.
- `empty_shell/code.html`: the normal header, one disabled Dashboard stub, and “Nothing here yet”.

The original dashboard folder was renamed from `marhaba_b2b_portal_desktop_dashboard` to `agent_dashboard`. Original HTML is preserved in `../stitch-original-html.zip`. Any `screen.png` files are **original Stitch export images**, not updated screenshots. `shared/migration-audit.json` records the seven content-preservation checks.

These remain visual references: search, booking CTAs and other action buttons do not connect to a backend. The original cancellation acknowledgement interaction and populated financial chart are retained. Tailwind 3.4.17, Google Fonts/Material Symbols, and Chart.js 4.4.8 on the populated financial screen load from CDNs, so internet access is needed. All empty-state chart geometry is static SVG.

Run `python3 verify_references.py` to check shell consistency, active navigation, colour-token usage, main-content preservation against the archive, zero financial metrics and local asset links. This check uses only the Python standard library.

## Login and booking storyboard

Thirteen additional HTML references cover login plus six screens each for single-leg and multi-leg booking. Start at `login/code.html` or `booking_single_journey/code.html`. **New Booking** in the shared header now links to the journey screen. The original pages' main content is unchanged.

See [BOOKING-CONCEPT.md](BOOKING-CONCEPT.md) for the proposed experience, sample totals, assumptions and open business questions. These pages are a fixed-data click-through: step links work; inputs and service selections are read-only examples. Credit confirmation is a clearly labelled local navigation simulation with a required acknowledgement, with no backend or data storage. The net booking value after the sample corporate discount is deducted from available credit in the illustrated flow; no card checkout is shown. The login screen deliberately omits the authenticated shell.

## B2B credit update

Financials now includes the current corporate credit limit, usage and available balance; its empty state retains the configured facility with zero usage. The six other original screen layouts are retained, with credit-related wording updated where relevant. `shared/credit-copy-migration.json` records those copy changes for the preservation checks. Populated financial content was intentionally revised for this model. Sample balances and discounts are described in BOOKING-CONCEPT.md.

## Official logo

All header, login, gallery and footer wordmarks use `shared/dnata-logo.svg`, copied unchanged from the supplied dnata artwork. Its intrinsic brand colours are intentionally preserved; the interface palette still comes from `shared/tokens.css`. The booking generator also uses this asset.
