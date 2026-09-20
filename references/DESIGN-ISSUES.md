# Design issues — Global Concierge reference designs

Audit of the seven Google Stitch concepts in `/references/designs` (screenshots and
`code.html` source), checked against each other and against `CLAUDE.md`.

Issues are numbered so they can be referenced. Tick them off as they're resolved.

**Severity**
- **Blocker**: the demo tells a wrong or contradictory story, or a pair retrofit can't work.
- **Fix**: visibly wrong or inconsistent; a visitor or stakeholder could notice.
- **Minor**: polish, or can be quietly normalised during the build.

Screens referred to:

| Short name | Folder |
|---|---|
| Dashboard | `marhaba_b2b_portal_desktop_dashboard` |
| Confirmation | `booking_confirmation_desktop_updated_navigation` |
| All Bookings | `all_bookings_management` |
| Details | `booking_details_desktop` |
| Modify | `modify_booking_expanded_workspace_with_summary_panel` |
| Cancel | `cancel_booking_refund_summary` |
| Financials | `financials_insights_dashboard_optimized` |

---

## 1. The hero booking (MB-2024-8892) contradicts itself

This is the booking the visitor creates in the wizard and that carries through every
pair retrofit, so it has to be identical everywhere.

| # | Severity | Field | What the designs say |
|---|---|---|---|
| - [ ] 1.1 | Blocker | Flight number | Confirmation: **EK 408**. Details, Modify, Cancel, CLAUDE.md: **EK 001**. All Bookings gives 8892 **EK 004**. |
| - [ ] 1.2 | Blocker | Guest(s) | Confirmation: **John Doe + Jane Smith**. Details / Modify / Cancel: **Mr. James Sterling**. All Bookings: **Alexander Wright**. |
| - [ ] 1.3 | Blocker | Number of guests | Confirmation: 2 named guests. Details: "2 Adults", "Elite Meet & Greet (x2)", but only one named guest. Modify and Cancel: 1 guest only. |
| - [ ] 1.4 | Blocker | Time | Confirmation: **08:45 AM**. Details: **08:30** (at LHR). Modify / Cancel: **08:30 AM**. All Bookings: **14:30**. |
| - [ ] 1.5 | Blocker | Arrival vs departure | Confirmation and Details say **Arrival** and "arrival assistance". But Details shows the route as **DXB → LHR** (a departure *from* Dubai), and Modify / Cancel use a *takeoff* icon. The service location is unclear: Dubai or Heathrow? |
| - [ ] 1.6 | Fix | Guest email | Details: `j.sterling@globalpartners.com`. Modify: `james.s@example.com`. |
| - [ ] 1.7 | Fix | Status badge | Four different styles for "Confirmed": grey pill (Confirmation), green pill (Details), yellow pill (Modify), red dot (All Bookings). |

## 2. The prices don't add up

AED 669.38 is the total everywhere, but no two screens build it the same way, and two
of them are arithmetically wrong.

| # | Severity | Screen | Breakdown | Problem |
|---|---|---|---|---|
| - [ ] 2.1 | Blocker | Details | Elite M&G ×2 600.00 + Tax 30.00 − Discount 60.00 + Platform Fee 39.38 = **"669.38"** | Actually sums to **609.38**. Wrong by AED 60. Discount also applied after tax. |
| - [ ] 2.2 | Blocker | Modify, Cancel | Elite M&G 350 + Porter 80 + Buggy 120 = **"669.38"** | Actually sums to **550.00**, with no tax line. |
| - [ ] 2.3 | Fix | Confirmation | Subtotal 637.50 + VAT 5% 31.88 = 669.38 | **The only one that adds up**, but it doesn't itemise what the 637.50 is. |
| - [ ] 2.4 | Blocker | Unit price | Elite Meet & Greet is **AED 300** each in Details (600 ÷ 2) but **AED 350** in Modify and Cancel. |
| - [ ] 2.5 | Fix | Modify | "Modifications: AED 50.00" → New Total 719.38 | Nothing on the screen changes to justify +50. Elite M&G is already selected; Premium Lounge (210) is not. |
| - [ ] 2.6 | Fix | Modify | Service Selection offers only Elite M&G and Premium Lounge | But the summary beside it lists Porter and Buggy, which can't be seen or changed. |
| - [ ] 2.7 | Fix | Tax label | "VAT (5%)" (Confirmation) vs "Tax (5%)" (Details). |

**Suggestion:** keep Confirmation's structure (subtotal + 5% VAT = 669.38) and itemise
lines that total exactly **637.50**. Use the same lines on Details, Modify and Cancel.

## 3. Conflicts with the demo's story (CLAUDE.md)

| # | Severity | Issue |
|---|---|---|
| - [ ] 3.1 | Blocker | **Buggy Service (AED 120) is already in the booking** (Modify, Cancel). The stretch goal's payoff is a supplier adding "Buggy Service — AED 120" *live* so it appears in the wizard. It must not be in the base data. |
| - [ ] 3.2 | Blocker | **MB-2024-8892 is already in All Bookings.** The New Booking ↔ Bookings pair has the wizard booking *appear* as a new card. The base list must not contain it. |
| - [ ] 3.3 | Blocker | **Dashboard's Active Services shows EK202 / James Henderson.** The Dashboard ↔ New Booking pair needs it to start empty and then show the **EK 001** booking. |
| - [ ] 3.4 | Fix | **Dashboard's "Booking Confirmed" notification uses reference `#MRH-99281`.** It should be MB-2024-8892, and the format should match `MB-YYYY-NNNN`. |
| - [ ] 3.5 | Fix | **Currency is mixed.** Bookings are in **AED**; credit limit, usage and all Financials figures are in **USD ($)**. The Bookings ↔ Financials pair fills credit to "$12,450 / $50,000" from AED bookings. Pick one currency. |
| - [ ] 3.6 | Fix | **The timeline doesn't line up.** Bookings are 23–26 **Oct** 2024. The Booking Value Trend chart runs **Jan–Jun**. The dropdown offers "Q1 2024". |
| - [ ] 3.7 | Fix | **The hero product is missing from Financials.** Elite Meet & Greet isn't among the Most Booked Products (Lounge, Porter, Chauffeur). |

## 4. The shell is different on every screen

CLAUDE.md specifies one shell: a slim top bar (logo, search, New Booking,
notifications, avatar) plus a left sidebar that **starts empty and gains one entry per
feature**.

| # | Severity | Screen | Top bar | Sidebar |
|---|---|---|---|---|
| - [ ] 4.1 | Blocker | Dashboard | Marketplace, Bookings, Financials, Clients, Reports + settings | Dashboard, Reservations, Corporate Accounts, Agent Tools, Support Center |
| | | Confirmation | Dashboard, Bookings + help | **none** |
| | | All Bookings | single "Bookings" tab + settings | Dashboard, Bookings, Agent Tools, Reports + credit widget (bottom) |
| | | Details | Dashboard, Bookings + help | credit widget (top), Dashboard, Bookings, Agent Tools, Reports, Settings |
| | | Modify | Dashboard, Bookings, **Search** + help | **none** |
| | | Cancel | Dashboard, Bookings + help | **none** |
| | | Financials | Marketplace, Bookings, Clients, Reports + settings | avatar, credit widget, Dashboard, Reservations, Corporate Accounts, Agent Tools |

Resulting problems:

| # | Severity | Issue |
|---|---|---|
| - [ ] 4.2 | Blocker | Sidebar items that no feature ever builds: **Agent Tools, Reports, Corporate Accounts, Settings, Support Center**. With these in place the sidebar can never "start empty and fill up". |
| - [ ] 4.3 | Blocker | Top-bar nav links (Marketplace, Clients, Reports…) aren't in the CLAUDE.md shell. Drop them. |
| - [ ] 4.4 | Fix | **Financials highlights "Corporate Accounts"** as the active sidebar item, and has no "Financials" entry anywhere. |
| - [ ] 4.5 | Fix | The credit widget sits at the **bottom** of the sidebar (All Bookings), the **top** (Details, Financials) or is **absent** (others). The Bookings ↔ Financials pair animates it, so it needs one fixed position. |
| - [ ] 4.6 | Fix | Modify has **both** a search box and a "Search" nav link. |
| - [ ] 4.7 | Minor | Header utility icon: **settings** on some screens, **help** on others. |
| - [ ] 4.8 | Minor | The **New Booking** button has a "+" icon on some screens and none on others. On Dashboard its text wraps to two lines. |
| - [ ] 4.9 | Minor | Active sidebar item is dark red (#b5000b) on most screens but bright red (#e30613) on Details. |
| - [ ] 4.10 | Minor | Footer is present on Dashboard, Confirmation, All Bookings and Financials; **absent** on Details, Modify and Cancel. Footer links differ between screens. |
| - [ ] 4.11 | Fix | **The signed-in user differs.** "Sarah" with a photo (Dashboard), "JD" initials (All Bookings), a generic icon (Confirmation), different photos (Details, Financials). |

## 5. Naming and terminology

| # | Severity | Issue |
|---|---|---|
| - [ ] 5.1 | Fix | "**Reservations**" (Dashboard, Financials sidebar) vs "**Bookings**" (everywhere else). |
| - [ ] 5.2 | Fix | One service, four names: "Meet & Greet Gold" (Dashboard) vs "Elite Meet & Greet" (everywhere else). |
| - [ ] 5.3 | Fix | Lounge is called "Premium Lounge Access (VIP Tier)", "Premium Lounge", "Lounge Access" and "Marhaba Lounge Access". |
| - [ ] 5.4 | Fix | **People reused in different roles.** Sarah Jenkins is a *guest* (All Bookings) and the #1 *agent* (Financials leaderboard), and possibly the signed-in "Sarah". Michael Chen is a *guest* and the #2 *agent*. |
| - [ ] 5.5 | Minor | "In Progress" (Dashboard) vs "In-Progress" (All Bookings). |
| - [ ] 5.6 | Minor | Dates written as "Oct 24", "24 Oct 2024" and "24 Oct, 2024"; times as "08:30", "08:30 AM" and "08:45 AM (Local Time)". |
| - [ ] 5.7 | Fix | **Cancellation policy threshold.** Confirmation says free until **6 hours** before. Cancel says no fee at **>4 hrs** prior. |
| - [ ] 5.8 | Minor | "Back to Bookings" (Modify) vs "Back to Booking Details" (Cancel). Both are reached from Details. |
| - [ ] 5.9 | Fix | **Numbers conflict.** Dashboard says "12 active bookings for today"; Financials says "342 Active Bookings". "75% of monthly quota used" (Dashboard) vs "24.9% of credit used" (Financials). |

## 6. All Bookings: logic errors

| # | Severity | Issue |
|---|---|---|
| - [ ] 6.1 | Fix | The **Upcoming** tab shows a **Completed** (Oct 23) and a **Cancelled** booking. |
| - [ ] 6.2 | Fix | The **"Elite Meet & Greet" filter** is applied, but cards show Family Fast Track, Lounge Access and Chauffeur Transfer. |
| - [ ] 6.3 | Fix | The **"Next 7 Days"** filter is applied, yet an Oct 23 (past) booking is shown. |
| - [ ] 6.4 | Minor | Completed and Cancelled cards carry a "100% Refundable" badge, which has no meaning for them. |
| - [ ] 6.5 | Minor | The In-Progress card (Sarah Jenkins) has no **View** button; the other active cards do. |

## 7. Rendering and layout bugs

Most of these are Stitch export defects and won't carry over to the React build. Listed
so nobody mistakes them for intent.

**Financials: badly broken**
- [ ] 7.1 **Fix**: The Material Symbols icon font didn't load, so raw icon names show as text: `account_balance_wallet`, `savings`, `airplane_ticket`, `trending_up`, `emoji_events`, `dashboard`, `event_available`, `business`, `construction`, `corporate_fare`, `luggage`, `local_taxi`, `help`, `search`, `notifications`, `settings`, `download`.
- [ ] 7.2 **Fix**: Heavy truncation: "Global Tr…", "Dashb…", "Res…", "Corporate Acc…", "Agent T…", "This Mo…", "Total Money S…", "Active Bo…", "Agent …", "Marhaba Lounge …", "MARHA…", "Support C…", "Client:", "+12.5% vs last m…".
- [ ] 7.3 **Fix**: Leaderboard values show only "$…". Product percentages show "7…", "5…", "3…".
- [ ] 7.4 **Minor**: Credit usage "$12,450" wraps to "$12,4 / 50".
- [ ] 7.5 **Minor**: The chart axes render in a fallback serif font.

**Dashboard**
- [ ] 7.6 **Fix**: The welcome card has an empty decorative circle, which looks like a missing image.
- [ ] 7.7 **Fix**: The "Need Assistance?" card and a cut-off "Chauffeur Elite" promo image overlap the footer.
- [ ] 7.8 **Minor**: The search placeholder is truncated ("Search bookings, ref").
- [ ] 7.9 **Minor**: The Performance Reports card has coloured avatar dots with no meaning.

**Confirmation**
- [ ] 7.10 **Fix**: The booking reference "MB-2024-8892" breaks across two lines.

**All Bookings**
- [ ] 7.11 **Minor**: The "Upcoming" tab label wraps to "Upcomin / g", and the "In-Progress" badge wraps.
- [ ] 7.12 **Minor**: A stray black bar sits below the footer.

**Details**
- [ ] 7.13 **Fix**: The Payment Summary total renders as "AED / Total 669.38", and amounts wrap onto two lines.
- [ ] 7.14 **Minor**: The "EK 001" flight pill wraps. The sidebar background stops partway down the page. The account name and tier are truncated.
- [ ] 7.15 **Minor**: It relies on a stock photo of real people. We'd need a licensed image or to drop it.

**Modify**
- [ ] 7.16 **Minor**: The email field is truncated. The "Confirmed" badge floats detached at the far right.
- [ ] 7.17 **Minor**: The only guest (the lead guest) has a **delete** icon.

## 8. Scope mismatches with CLAUDE.md

Content in the designs that CLAUDE.md doesn't list for the feature. Each needs a
**keep or cut** decision.

| # | Screen | Extra content |
|---|---|---|
| - [ ] 8.1 | Dashboard | Corporate Portal card, Performance Reports card, "Need Assistance?" card, Chauffeur Elite promo |
| - [ ] 8.2 | Financials | Three KPI tiles (Revenue, Money Saved, Active Bookings), Agent Leaderboard, date-range dropdown, Export |
| - [ ] 8.3 | All Bookings | Upcoming/Historical tabs, filter bar |
| - [ ] 8.4 | Details | Stock photo, special-notes block |

Recommendation: cut anything that doesn't take part in a hook or pair. It's more
surface for agents to build without payoff.

## 9. Designs that don't exist yet

| # | Severity | Missing |
|---|---|---|
| - [ ] 9.1 | Blocker | **Agent Login screen**, part of the Gate sequence. |
| - [ ] 9.2 | Blocker | **The empty shell**: sidebar with a disabled Dashboard stub and "Nothing here yet." |
| - [ ] 9.3 | Blocker | **Booking wizard steps** before Confirmation (flight → guests → service → review/pay). |
| - [ ] 9.4 | Blocker | **Empty states** for every feature, which CLAUDE.md calls load-bearing: "No active bookings yet" (Dashboard), empty Notifications, empty All Bookings, flat Booking Value Trend, empty credit bar, inert grey "View all". |
| - [ ] 9.5 | Fix | **The notification that slides in** for the Dashboard ↔ New Booking pair ("Booking Confirmed — MB-2024-8892"). |
| - [ ] 9.6 | Minor | Supplier Portal (stretch goal only; not needed now). |

## 10. Branding

| # | Severity | Issue |
|---|---|---|
| - [ ] 10.1 | Blocker | Everything is **Marhaba**-branded; the demo is **dnata**. Wordmarks vary: "MARHABA", "marhaba", "Marhaba B2B", "Marhaba Concierge" (page title). |
| - [ ] 10.2 | Fix | The palette (red #b5000b / #e30613, gold #fed000, blue #0059a8) and DESIGN.md are Marhaba's. They're waiting on dnata brand values. The build uses CSS variables either way. |
| - [ ] 10.3 | Open | **dnata** or **dnata International**? |
| - [ ] 10.4 | Minor | DESIGN.md contradicts itself. Its prose says the background is white #FFFFFF / #F9FAFB and outlines are #E5E7EB, but its tokens (and every screen) use a warm #fcf9f8 and pinkish outlines #e9bcb6. |

---

## Decisions needed before building

1. **The hero booking** (fixes 1.x, 2.x): guest name(s) and count, flight, date, time,
   arrival or departure, service location, itemised price lines totalling AED 637.50
   before VAT.
2. **Currency** (3.5): AED throughout, or USD for credit and financials.
3. **The sidebar's final item list** (4.2): one entry per built feature, plus nothing else?
4. **Keep or cut** the extra content in section 8.
5. **The base dataset** for All Bookings, Dashboard and Financials, excluding
   MB-2024-8892 and Buggy Service, with names that don't collide with agent names.
6. **Who drafts the missing designs** in section 9, or whether they're designed directly in code.
