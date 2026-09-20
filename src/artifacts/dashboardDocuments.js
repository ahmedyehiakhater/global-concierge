const section = (title, body, items) => ({
  title,
  body,
  ...(items ? { items } : {}),
});
const doc = (owner, kind, title, sections, extra = {}) => ({
  id: `dashboard-${owner}`,
  owner,
  kind,
  title,
  feature: "Dashboard",
  sections,
  summary: sections[0].body,
  version: "1.0",
  status: "Draft · awaiting publication",
  ...extra,
});
export const DASHBOARD_DOCUMENTS = [
  doc(
    "nour",
    "Feature PRD",
    "Dashboard — a clear starting point for every journey",
    [
      section(
        "Purpose and product connection",
        "This feature implements the daily overview described in the Global Concierge B2B portal master brief. Travel agents, corporate travel desks and similar travel partners need a reliable answer to three questions: what is booked, what has changed and how much corporate credit remains. The dashboard provides this orientation without pretending to be an airport operations feed or a consumer checkout.",
      ),
      section(
        "Users and decisions",
        "Sarah represents an agency operator arranging services for travellers. A supervisor may use the same view to understand activity and negotiated savings. The dashboard helps the operator decide whether to start a booking, inspect a saved reservation or review account usage. Traveller identity is distinct from the signed-in demo agency identity; the welcome name is a fictional demonstration persona, not authenticated personalisation.",
      ),
      section(
        "Scope of this release",
        "Four logical containers share the established header and sidebar. The shell is retained from Login & workspace; it is not rebuilt. A saved draft, when present, remains visible as a secondary welcome-area item.",
        [
          "Welcome: agency context and an introduction appropriate to existing bookings.",
          "Overview: saved active booking count, corporate savings and available credit.",
          "Active services: the most recent two saved bookings or an intentional empty state.",
          "Notifications: up to four latest saved booking confirmations or an all-caught-up message.",
        ],
      ),
      section(
        "DASH-F01 — welcome",
        "Show Welcome back, Sarah and useful supporting copy. Do not claim that a booking exists in a fresh session. A saved draft must be described as unfinished, never counted as a confirmed booking. Resuming it is available only when the booking feature is released.",
      ),
      section(
        "DASH-F02 — metric definitions",
        "Active bookings counts the session's currently returned bookings. Corporate savings sums their persisted discount snapshots; it does not reprice old purchases against today's catalogue. Available credit comes directly from the backend ledger snapshot. Amounts use AED and integer fils internally. A fresh facility is AED 100,000 with zero opening usage and AED 0 savings. The dashboard does not reserve or spend credit.",
      ),
      section(
        "DASH-F03 — active services",
        "Render the latest saved records with their routes, travellers, confirmed status and total. Where no record exists, show No active bookings yet and explain that confirmed bookings and services will appear here. Do not invent a flight time, live airport status or supplier confirmation. View all bookings and record details remain unavailable until Bookings & Manage has shipped.",
      ),
      section(
        "DASH-F04 — notifications",
        "Use saved booking events available in this PoC. A confirmation message states the route and the discounted charge deducted from corporate credit, with the persisted creation time. With no records, show You’re all caught up. No fake unread counter, sample notification or background alert is required.",
      ),
      section(
        "DASH-F05 — feature availability",
        "Dashboard navigation becomes active when its scene reaches navigation testing and remains active after release. Booking creation, draft resume, search and booking management are conditional on their own released feature. The dashboard must not use a clickable control that silently does nothing. Disabled controls explain the product's incremental availability; later features can enable them without rebuilding this page.",
      ),
      section(
        "Empty and populated acceptance",
        "For an empty session the three metrics must be 0, AED 0 and AED 100,000. For a populated session every value must match the saved snapshot and the services list must show genuine records. The scripted missing-empty-state finding is a presentation-only exercise. When bookings exist, label the temporary blank-services view QA preview and restore the real list before approval.",
      ),
      section(
        "State preservation",
        "Reading, inspecting and releasing Dashboard must not create, amend, cancel or remove a booking or draft. It must not change credit. Publishing dashboard documents appends to the same visitor run: the master brief and opening PRD remain readable. Reset archives the visitor session through the existing backend boundary before a new visitor starts.",
      ),
      section(
        "Acceptance and release",
        "Release requires observed correct metrics, an intentional services state, truthful notifications, working Dashboard navigation, correct action gating, closed scripted findings and a usable final dashboard. Keyboard and screen-reader testing must be reported separately from scripted visual inspection. No generated pass should replace a missing execution result.",
      ),
      section(
        "Out of scope and next connections",
        "This release does not implement booking creation, changes/cancellations, payment processing, live supplier status or a new credit ledger. It consumes existing product records. New Booking provides booking creation when released, whether before or after Dashboard; Bookings & Manage will enable View all; Financials will provide the detailed account view. These scenes have independent release records.",
      ),
    ],
  ),
  doc(
    "ellie",
    "Feature design specification",
    "Dashboard — layout, states and decisions",
    [
      section(
        "Experience intent",
        "Make a first visit feel ready and a returning visit feel informed. Preserve the dnata shell, typography and spacing established in the opening. Four complete containers create hierarchy: welcome, overview metrics, active services and notifications. The three metrics read as one comparative group; notifications are secondary to the user's bookings.",
      ),
      section(
        "Actual design reference",
        "The attached empty and populated previews render the same React Dashboard component as the product. The populated preview is explicitly labelled illustrative QA data and is not a saved visitor record. The live stage uses the current session. This avoids old exported designs diverging from what Engineering implements.",
      ),
      section(
        "Container and responsive rules",
        "Use the existing content gutter and card rhythm. Welcome spans the content width, metrics form a three-tile row, and Active services and Notifications form the next row. Existing responsive CSS stacks these groups on smaller screens. Bot overlays must not alter the underlying document layout. The developer outline measures the live container, including scroll position.",
      ),
      section(
        "Empty state",
        "A blank card is ambiguous: it could signal loading or failure. The corrected services panel includes a title and explanation. If booking creation is unavailable, do not expose a working-looking Create button. Notifications still contain meaningful all-caught-up text. Zero metrics are valid information, not missing data.",
      ),
      section(
        "Populated state",
        "Saved bookings use consistent route, traveller and commercial formatting. The list shows recent records, while View all is enabled only when its destination is released. Notifications use the same underlying records. Do not place test data in the real list simply to make the screen visually fuller.",
      ),
      section(
        "Visual semantics",
        "Use dnata blue for branding and active navigation, lime for primary action fills, and neutral surfaces/text. Error treatment is temporary and confined to the QA finding. The welcome alignment finding is an eight-pixel presentation offset, never a modification to the shared navigation or an actual production defect.",
      ),
      section(
        "Review and hand-back",
        "Inspect each complete container while Engineering continues elsewhere. Record the welcome alignment issue, then retest the finished correction. Verify the final page against both the PRD and design. The released screen is the dashboard itself, with the reference preview hidden and normal user interactions restored.",
      ),
      section(
        "Accessibility follow-up",
        "The visible hierarchy uses real headings, buttons, disabled states and labelled navigation. Visual inspection alone does not certify keyboard order, screen-reader understanding, motion preferences or contrast at every display size. These remain explicit manual checks.",
      ),
    ],
    {
      previews: [
        { view: "dashboard", label: "Empty Dashboard — actual component" },
        {
          view: "dashboard-populated",
          label: "Populated Dashboard — labelled illustrative preview",
        },
      ],
    },
  ),
  doc(
    "omar",
    "Feature implementation record",
    "Dashboard — data, containers and feature connections",
    [
      section(
        "Implementation boundary",
        "Reuse the product Dashboard and Shell components. The choreography owns staged visibility, the temporary alignment offset and the missing empty-state exercise. Product components own layout, formatting and available actions. The bots continue using generic movement and build actions; no dashboard-specific method is added to the bot engine.",
      ),
      section(
        "Data and arithmetic",
        "Load a current session snapshot before the build. dashboardValues derives count and savings from saved booking snapshots and uses the backend available-credit value. No write to bookings, draft or credit is needed to render Dashboard. A before/after comparison verifies that release changes only the feature list.",
      ),
      section(
        "Construction model",
        "Four selectors identify whole containers. One continuous hammer sequence reveals each container's contents together. Design and QA have separate review queues; neither blocks the next unrelated construction group. Pending findings are corrected after Notifications is completed. All asynchronous work uses the scene cancellation signal.",
      ),
      section(
        "Feature availability contract",
        "A supplied availableFeatures list restricts the staged product; omission preserves the standalone product's existing behaviour. Check availability both in disabled controls and navigation handlers. Dashboard is the initial sidebar stub; other entries appear only when released. The same contract applies to create, resume, details, search and View all actions.",
      ),
      section(
        "QA presentation isolation",
        "The missing services state uses a display-only override with an empty services collection; metrics and the underlying session remain untouched. When real bookings exist the preview is labelled. Clear the override before final acceptance, restore saved records and compare persisted values. The alignment offset is likewise a scene class rather than a changed design token.",
      ),
      section(
        "Release and cancellation",
        "Complete the feature through the idempotent session API after checks succeed. The timer is informational and is never awaited. Restore interactive Dashboard and set the counter to Shipped at completion, then celebrate. Manual reset aborts construction, reviews, dialogue and held props before cleanup; stale callbacks cannot publish a late release.",
      ),
      section(
        "Future integrations",
        "The shell and dashboard accept feature availability without assuming a scene order. Future booking and management scenes must provide their real navigation/actions before enabling their controls. No code path should fabricate records or send the attendee into an unimplemented scene.",
      ),
    ],
  ),
  doc(
    "priya",
    "Feature test plan & results",
    "Dashboard — acceptance evidence and findings",
    [
      section(
        "Test objective",
        "Verify a useful, accurate dashboard while preserving all existing visitor data. Distinguish the theatrical finding from an actual failed release: intentionally observe a blank services presentation, retain that finding, and record its retest after the repair. Cases below begin Not run and acquire timestamps only when executed.",
      ),
      section(
        "Preconditions and data",
        "Use the current visitor session after Login & workspace. Read the initial bookings, draft and credit snapshot. Fresh-session expectations are zero bookings, zero savings and AED 100,000 credit; populated expectations are derived from saved records. Never create a reservation solely to test this scene.",
      ),
      section(
        "Inspection boundaries",
        "Start inspection after an entire container has completed its reveal. Design owns the welcome alignment finding; QA owns the missing empty state. Review activity may overlap construction elsewhere, but two actions cannot concurrently control the same bot. Release waits for required checks, not for decorative timing.",
      ),
      section(
        "Findings and retest policy",
        "Findings are appended to this run's document when observed. Resolved findings remain visible with their repair and retest evidence. A deliberately staged missing empty state is recorded as found, not silently counted as a pass. The release checks pass only once the corrected UI and restored live data are observed.",
      ),
      section(
        "Limitations",
        "These checks exercise the actual rendered component and session boundary. They do not prove live supplier availability, production authentication, browser-wide accessibility or all future scene-order combinations. Manual keyboard/screen-reader work stays Not run until someone performs it.",
      ),
    ],
    {
      tests: [
        [
          "DASH-01",
          "Compare all three rendered metrics with the session snapshot.",
          "Count, discount savings and backend available credit match exactly.",
        ],
        [
          "DASH-02",
          "Inspect the completed services container before its scripted repair.",
          "The missing empty-state content is detected and recorded as a finding.",
        ],
        [
          "DASH-03",
          "Reinspect after the repair and restore the real services collection.",
          "The empty message or saved booking rows are visible and correct.",
        ],
        [
          "DASH-04",
          "Inspect the completed notifications container.",
          "Truthful all-caught-up copy or saved booking notifications are visible.",
        ],
        [
          "DASH-05",
          "Jump onto the real Dashboard navigation button.",
          "The navigation handler runs and Dashboard becomes the active page.",
        ],
        [
          "DASH-06",
          "Inspect booking creation, search, resume and management controls.",
          "Unreleased destinations cannot be activated.",
        ],
        [
          "DASH-07",
          "Compare saved bookings, draft and credit before and after release.",
          "Dashboard release has not mutated business data.",
        ],
        [
          "DASH-08",
          "Inspect the released page and corrected welcome alignment.",
          "The four completed containers are visible, QA overrides removed and Dashboard interactive.",
        ],
        [
          "DASH-A11Y",
          "Traverse the page with keyboard and screen reader.",
          "Navigation, labels, disabled controls and focus order are understandable.",
        ],
      ].map(([id, action, expected]) => ({ id, steps: action, expected })),
    },
  ),
  doc(
    "sami",
    "Feature release report",
    "Dashboard — delivery, dependencies and approvals",
    [
      section(
        "Release scope",
        "Ship four dashboard containers and activate the Dashboard sidebar entry. Retain the existing Login & workspace release, its documents and visitor session. The final page is the completed Dashboard so the attendee can explore before choosing another feature.",
      ),
      section(
        "Milestones",
        "Requirements approval → design handoff → welcome and metrics → services and notifications → corrections and retests → real navigation → five-role approval → saved feature completion. Independent reviews overlap engineering. The critical path includes genuine dependencies only.",
      ),
      section(
        "Timekeeping",
        "Restart the countdown at selection of Dashboard. Milestones update the remaining estimate; document reading and service-save pauses stop its active clock. The scene never waits for spare estimated seconds. When work finishes, the counter reaches Shipped · 00:00 immediately and the measured duration is recorded here.",
      ),
      section(
        "Dependencies",
        "Login & workspace must exist. Booking creation and management may be absent; their actions remain unavailable without blocking this release. Existing bookings can still populate the dashboard. Later scenes introduce their own connections and acceptance evidence.",
      ),
      section(
        "Approvals",
        "Design signs off the corrected layout. QA closes the services finding and verifies data, navigation and gates. Product accepts the daily-overview purpose. Engineering confirms implementation and preservation of existing data. Delivery saves completion only after these checks and does not invent a passed result.",
      ),
      section(
        "Budget and risks",
        "No approved software-project budget or measured engineering cost has been supplied. AED 100,000 is the agency booking facility, not development expenditure. Production authentication, supplier integrations and comprehensive accessibility testing remain separate work. A failed service save or check must stop release and expose recovery rather than show a false success.",
      ),
    ],
  ),
];
