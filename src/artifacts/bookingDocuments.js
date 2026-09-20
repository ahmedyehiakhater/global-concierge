const section = (title, body, items) => ({
  title,
  body,
  ...(items ? { items } : {}),
});
const doc = (owner, kind, title, sections, extra = {}) => ({
  id: `booking-${owner}`,
  owner,
  kind,
  title,
  feature: "New Booking",
  sections,
  summary: sections[0].body,
  version: "1.0",
  status: "Draft · awaiting publication",
  ...extra,
});
export const BOOKING_DOCUMENTS = [
  doc(
    "nour",
    "Feature PRD",
    "New Booking — an itinerary-led airport experience",
    [
      section(
        "Purpose and connection to the master brief",
        "Turn the Global Concierge B2B proposition into a complete, usable transaction. Travel agents, corporate travel desks and similar partners arrange airport assistance for people travelling on one or more flights. The operator must understand which services apply at each airport, who receives them, the negotiated discount and the effect on their corporate credit before confirming. The flow must remain understandable without knowledge of travel-industry terminology.",
      ),
      section(
        "Users and responsibilities",
        "The signed-in demo operator represents Global Travel Partners. Travellers receive the airport services; they are not necessarily the purchasing contact. The lead traveller contact is collected separately from names. The PoC uses fictional details and does not authenticate an actual employee, contact a traveller or reserve a real supplier service.",
      ),
      section(
        "Five-step journey",
        "Journey → Travellers → Services → Review → Credit facility. Confirmation is the saved outcome, not a sixth form step. The summary remains alongside the changing step body. Back navigation and saved drafts support editing without re-entering the whole journey.",
      ),
      section(
        "BOOK-F01 — journey",
        "Start with one flight. Required fields include known departure and arrival airports, a valid future/current travel date and flight number. Airports must differ. Search by city, country or airport code. Add another flight expands the itinerary automatically; do not expose Single/Multi controls or the word leg. All flights carry the same party in this PoC. Adults are supported from 1 to 20; children and infant pricing are outside this release.",
      ),
      section(
        "BOOK-F02 — travellers and contact",
        "Collect first and last names for every traveller, plus a valid email and phone with country code. Show required markers and keep Continue unavailable while details are incomplete or invalid. Sample data must remain editable. The helper fills only the current step; it must not submit the order, spend credit or overwrite an existing booking.",
      ),
      section(
        "BOOK-F03 — service eligibility",
        "Organise services by flight and airport direction. Users choose Before departure and After arrival, with category filters to keep the catalogue manageable. Available families include Meet & Greet, lounge access, VIP assistance, chauffeur transfers, porter/baggage assistance and Dubai departure home/hotel check-in. Do not list departure-only check-in as an arrival service. Coverage and prices are illustrative, not a promise of live supplier inventory.",
      ),
      section(
        "BOOK-F04 — quantity and price",
        "Price by the service’s stated unit: adult, vehicle or booking. The sample journey uses two adults, DXB Meet & Greet at AED 180 per adult and CAI arrival assistance at AED 140 per adult. Subtotal AED 640, corporate discount 10% or AED 64, net charge AED 576. The summary lists airport context, quantity and charge. Money uses integer fils and the backend recalculates the authoritative amount rather than trusting client prices.",
      ),
      section(
        "BOOK-F05 — review and credit",
        "Review reproduces the entered route, party, contact and selected services. The final step shows limit, used credit, available credit, this deduction and projected availability. A fresh facility is AED 100,000 with zero opening usage. The same AED 576 booking leaves AED 99,424; an existing session uses its actual balance. There is no credit-card payment step. Confirmation requires acknowledgement and sufficient credit.",
      ),
      section(
        "BOOK-F06 — save and recovery",
        "Confirmation creates one demo booking and one deduction. Disable repeat submission while saving. A network retry must reuse the same request key and payload. Show a real saved reference only after the response identifies the booking. A save failure is not success: preserve inputs and offer a safe retry. The scripted rehearsal has a separate saved-draft slot, so an attendee’s existing draft is preserved.",
      ),
      section(
        "BOOK-F07 — application integration",
        "A saved booking updates Dashboard metrics, recent active services and notifications if Dashboard exists. This connection reads the saved result; it never creates a second booking. Booking management and Financials remain independently released features. Their eventual pages consume the same persisted records and balances.",
      ),
      section(
        "Acceptance and hand-back",
        "Accept only after valid/invalid states, service eligibility, commercial arithmetic, acknowledgement, saved reference, one-time deduction and existing-draft preservation are observed. Return to a fresh Journey form for the attendee while retaining the demonstrated booking. Selecting an already-built feature opens its form instead of replaying the scripted save.",
      ),
      section(
        "Non-goals and risks",
        "No real airport reservation, payment settlement, traveller communication or supplier confirmation occurs. Production identity, real negotiated contracts, children, cancellations and service fulfilment require separate work. Sample dates are generated in the future so the booth does not depend on a fixed calendar date. Manual reset archives the session; late responses must not restore an interrupted scene.",
      ),
    ],
  ),
  doc(
    "ellie",
    "Feature design specification",
    "New Booking — five steps, one persistent summary",
    [
      section(
        "Design intent",
        "Reduce the cognitive load of planning multiple airport touchpoints. Keep the same dnata shell and visual language as the released Dashboard. A clear step rail orients the user, while a persistent commercial summary explains the consequences of choices. Complete containers are reviewed in context, not field by field during construction.",
      ),
      section(
        "Actual component references",
        "The previews below render the real BookingWizard and confirmation component with labelled illustrative data. They cover Journey, Travellers, Services, Review, Credit facility and the saved outcome. They are reference states rather than submitted bookings; no preview writes to the backend.",
      ),
      section(
        "Journey and travellers",
        "Required indicators sit with field labels. The Add another flight action is visually distinct and separated from Who is travelling. Keep airport search, readable flight numbering and editable sample values. Traveller cards group first/last names; the separate contact card avoids confusing the operator with the travelling party.",
      ),
      section(
        "Services planner",
        "Use flight tabs above departure/arrival airport tabs and category filters. The selected state and price/quantity should be easy to scan. Switching airports must preserve selections already made elsewhere. The summary groups selections by flight and direction. Changing a flight invalidates incompatible selections instead of leaving hidden charges.",
      ),
      section(
        "Progress and commercial hierarchy",
        "Completed steps display ticks, the current step remains identifiable, and future steps cannot bypass required data. Subtotal, corporate discount and charge are distinct lines. Credit projection is secondary to the charge. The staged missing tick and missing totals are presentation findings; the calculator is not disabled or made incorrect.",
      ),
      section(
        "Final states and responsive behaviour",
        "Review and credit use complete readable cards. On narrower layouts the summary stacks according to the existing product CSS. Saving, insufficient-credit and retry states must be explicit. The confirmation reference comes from the saved response. On hand-back the next empty form must not retain the test acknowledgement or selected services.",
      ),
      section(
        "Accessibility review boundary",
        "Use semantic labels, keyboard-operable controls, visible disabled states and the real checkbox. The animated hop invokes the same control as an attendee. Visual inspection does not certify screen-reader focus, reduced motion or every breakpoint; record those separately rather than marking them passed.",
      ),
    ],
    {
      previews: [
        "journey",
        "travellers",
        "services",
        "review",
        "credit",
        "confirmation",
      ].map((view) => ({
        view: `booking-${view}`,
        label: `${view[0].toUpperCase() + view.slice(1)} — actual component preview`,
      })),
    },
  ),
  doc(
    "omar",
    "Feature implementation record",
    "New Booking — drafts, calculation and one-time confirmation",
    [
      section(
        "Architecture",
        "Reuse BookingWizard, shared product validation, service eligibility and quote calculation. The scene module orchestrates generic movement, continuous builds, inspection and real button presses. The product form remains reusable independently of the bots. Presentation-only flags stage missing ticks and totals without changing business rules.",
      ),
      section(
        "Draft isolation",
        "The regular draft belongs to the attendee. A separate rehearsal_drafts table stores scripted step progress. Both use the same validation and normalisation rules. Rehearsal confirmation clears only its own draft; normal confirmation clears only the regular draft. Session reset archives both via the session boundary, without deleting the database.",
      ),
      section(
        "Confirmation and idempotency",
        "The backend validates fields and eligibility, recalculates the amount and commits the booking and deduction atomically. Requests need an idempotency key. The scripted scene uses a session-specific stable key; an existing saved rehearsal can be recovered without another charge. Visitor requests persist their pending key and original payload for safe retries.",
      ),
      section(
        "Cancellation and late responses",
        "BookingFlow uses a generation counter. Reset increments it and stale operations cannot publish UI changes. Server-side archived-session checks reject writes that arrive after reset; a save that commits first remains in the archived visitor session. It never leaks into the next visitor. Application request tracking must not let an older response replace the current session identity.",
      ),
      section(
        "Navigation and integration",
        "Published feature availability controls the header, sidebar and dashboard creation/resume actions. The release adds a real New Booking route and preserves Dashboard. A saved snapshot supplies the confirmation and all dashboard metrics. Connection animations highlight changes without re-submitting a transaction.",
      ),
      section(
        "Validation boundaries",
        "Continue uses step-specific validation. Service selections are scoped to flight and direction; multi-flight changes prune invalid choices. Confirm requires acknowledgement, valid full details and sufficient available credit. Illustrative prices are not client-authoritative and the booth has no card-payment integration.",
      ),
    ],
  ),
  doc(
    "priya",
    "Feature test plan & results",
    "New Booking — transaction acceptance and evidence",
    [
      section(
        "Test objective",
        "Demonstrate a valid itinerary-to-confirmation path and collect actual evidence for validation, commercial accuracy and persistence. Cases begin Not run. A scripted discovery is retained alongside its retest; no generic inspection animation alone proves a business outcome.",
      ),
      section(
        "Fixture and preconditions",
        "Use one generated future flight DXB to CAI, EK 927, two adults James Sterling and Amelia Sterling, fictional email/phone and two airport assistance selections. Preserve the original attendee draft. Read starting credit and booking count before the run. If recovering an already-saved rehearsal, assert that the same request key still has exactly one booking.",
      ),
      section(
        "Staged findings",
        "Design observes that completed steps lack ticks. Product observes that the summary shows dashes after services are selected. The fixes alter presentation only. The real quote must remain AED 640 subtotal less AED 64 discount, net AED 576. Retain both findings and record observed corrections.",
      ),
      section(
        "Additional regression scope",
        "Multi-flight addition/removal, invalid service directions, insufficient credit, duplicate confirmation, lost-response retries and reset during saving require automated regression coverage beyond the visible scene. Distinguish these tests from the live scene results. Keyboard and screen-reader acceptance remains manual and must not be fabricated.",
      ),
      section(
        "Release rule",
        "Do not ship on a failed validation check or failed save. The confirmation must name the persisted record, credit must reconcile, and the user’s prior draft must survive the rehearsal. Dashboard connection is checked only if Dashboard is built; otherwise leave that case Not run and record why.",
      ),
    ],
    {
      tests: [
        [
          "BOOK-01",
          "Inspect a blank Journey form.",
          "Required fields are marked and Continue is disabled.",
        ],
        [
          "BOOK-02",
          "Select two adults and use sample Journey data.",
          "Editable DXB–CAI future flight for two adults appears.",
        ],
        [
          "BOOK-03",
          "Clear and restore the flight number.",
          "Missing flight number prevents progression.",
        ],
        [
          "BOOK-04",
          "Enter malformed email and restore the sample address.",
          "Email error prevents progression; valid data restores it.",
        ],
        [
          "BOOK-05",
          "Observe completed Journey after the design fix.",
          "The completed step displays a tick.",
        ],
        [
          "BOOK-06",
          "Choose DXB departure and CAI arrival assistance.",
          "Two eligible service selections calculate AED 576 for two adults.",
        ],
        [
          "BOOK-07",
          "Inspect the repaired summary.",
          "Subtotal AED 640; discount AED 64; charge AED 576.",
        ],
        [
          "BOOK-08",
          "Inspect the Review screen.",
          "The entered journey and traveller details remain consistent.",
        ],
        [
          "BOOK-09",
          "Observe Confirm before acknowledgement.",
          "Confirmation is disabled until the credit checkbox is selected.",
        ],
        [
          "BOOK-10",
          "Save the booking and compare the session.",
          "Exactly one request-key record, one deduction, and original attendee draft preserved.",
        ],
        [
          "BOOK-11",
          "Navigate to an already-built Dashboard.",
          "The saved reference and live credit appear without another save.",
        ],
        [
          "BOOK-12",
          "Open a fresh Journey form after release.",
          "Empty selections and no stale acknowledgement; saved booking retained.",
        ],
        [
          "BOOK-A11Y",
          "Traverse all steps with keyboard and screen reader.",
          "Labels, errors and focus order remain understandable.",
        ],
      ].map(([id, steps, expected]) => ({ id, steps, expected })),
    },
  ),
  doc(
    "sami",
    "Feature release report",
    "New Booking — scope, transaction and delivery",
    [
      section(
        "Release scope",
        "Deliver the five-step airport-services booking flow, persistent discounted summary, credit acknowledgement and actual saved confirmation. Activate New Booking entry points. Connect to Dashboard if it exists and hand back a fresh Journey form.",
      ),
      section(
        "Milestones",
        "Requirements → design → frame/Journey/summary → travellers → services → commercial repair → review → credit confirmation → saved outcome → existing-feature connections → approval. Construction and independent reviews overlap where possible. Moving to another step waits for real validation and draft saving.",
      ),
      section(
        "Time and budget",
        "The countdown is a milestone-adjusted estimate of active scene time, not a software-effort commitment. Reading and save pauses stop it. It never blocks release after work finishes. Actual duration is appended at completion. No software-project budget has been supplied; the AED 100,000 credit facility is not a development budget.",
      ),
      section(
        "Saved outcome",
        "Record the actual saved booking reference and charge here when the transaction succeeds. Do not pre-fill a fake reference or announce success before persistence. The same request key must never create another charge on retry or recovery.",
      ),
      section(
        "Dependencies and follow-up",
        "Login & workspace is required. Dashboard connection is conditional on its release. Bookings & Manage and Financials remain separate scenes. The delivered flow uses illustrative catalogue/prices and does not contact airlines, airports, suppliers or travellers.",
      ),
    ],
  ),
];
