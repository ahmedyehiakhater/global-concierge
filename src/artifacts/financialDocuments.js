const section = (title, body) => ({ title, body });
const doc = (owner, kind, title, sections, extra = {}) => ({
  id: `financials-${owner}`,
  owner,
  kind,
  title,
  feature: "Financials & Insights",
  sections,
  summary: sections[0].body,
  version: "1.0",
  status: "Draft · awaiting publication",
  ...extra,
});
const context = section(
  "Product context",
  "Global Concierge gives travel agents, travel desks and corporate travel partners a shared airport-services workspace. Purchases use a corporate credit facility, not card checkout. Financials explains the available balance and every saved change behind it. It is a read-only view of the same backend used by Booking and Management, with no sample opening usage.",
);
export const FINANCIAL_DOCUMENTS = [
  doc(
    "nour",
    "Feature PRD",
    "Financials & Insights — explain every credit movement",
    [
      context,
      section(
        "User decisions",
        "An operator needs to understand whether the facility can fund another booking, how much value remains active, what corporate discount was earned on those active bookings, and which services are most often selected. The transaction trail supports explaining a changed balance without deleting earlier activity.",
      ),
      section(
        "Facility and metrics",
        "The facility starts at AED 100,000, zero usage. Display backend limit, used and available values. Active booking value is the current subtotal of non-cancelled records; savings sum their persisted discounts; active bookings exclude cancelled records. These current-state metrics differ from cumulative historical charges and returns, and their labels must make that distinction explicit.",
      ),
      section(
        "Trend definition",
        "The chart is cumulative net credit used in saved transaction order, starting at zero. Each booking adds its original charge, an amendment adds its signed difference, and cancellation returns the current charge. A full return can bring the line to zero without erasing its previous peak. The horizontal sequence is transactions, not equally spaced calendar days. No historical curve is fabricated.",
      ),
      section(
        "History and insight definitions",
        "Retain confirmed, amended and cancelled events with reference, recorded time and signed amount. Zero-price amendments are labelled No charge change. A transaction can open its retained booking only when Management is available. Popular services count service selections across active bookings, not travellers or lifetime revenue; cancelled bookings do not contribute.",
      ),
      section(
        "Build-order behaviour",
        "With no events, ship a flat zero trend, full facility and intentional empty history/insights. With saved bookings, show actual totals from first reveal. With returns, acknowledge both charges and returns; zero current usage does not mean no activity. Financials can be built before creation or management. Subsequent successful writes refresh it through shared session state.",
      ),
      section(
        "Acceptance and boundaries",
        "The scene may stage an incorrect currency label, never an incorrect stored amount or fake conversion. Repair labels to AED and compare rendered values to the backend. No ledger, booking or draft is modified by this scene. No payment processing, live supplier settlement, credit underwriting or real financial advice is included.",
      ),
    ],
  ),
  doc(
    "ellie",
    "Feature design specification",
    "Financials — overview, trend and transaction trail",
    [
      context,
      section(
        "Complete build groups",
        "Build heading/facility/overview together; then trend; active-service insights; transaction history and charge-return totals. Each is a complete meaningful container. Omar continuously builds at the element location. Priya reviews completed groups independently. Reading artefacts pauses the scene; reset remains available.",
      ),
      section(
        "Hierarchy and labels",
        "Lead with credit availability. Place the trend alongside active-service insights. The history below supplies the detail behind both charges and returns. State AED, transaction-order axis and active-only insight scope directly. A cancellation leaves history visible even when active metrics are zero.",
      ),
      section(
        "Currency finding",
        "Ellie observes the deliberately staged USD axis labels while the ledger remains AED. Omar repairs both labels. The finding and observed retest stay in the artefact. Distinguish this display error from repricing or currency conversion.",
      ),
      section(
        "Reference screens",
        "The previews render the actual Financials component with explicitly illustrative empty or populated data. They are not screenshots of private session records. Accessible headings, text summaries and native buttons accompany the chart; keyboard/screen-reader verification is reported separately.",
      ),
    ],
    {
      previews: [
        {
          view: "financials-empty",
          label: "Empty facility — actual component",
        },
        {
          view: "financials-populated",
          label: "Saved activity — actual component",
        },
      ],
    },
  ),
  doc(
    "omar",
    "Implementation notes",
    "Financials — one ledger, derived views",
    [
      context,
      section(
        "Data boundary",
        "financialValues derives active metrics, chronologically ordered transaction events, cumulative net usage and service-selection counts. Amounts remain integer fils until formatting. Older records without a history array contribute one original confirmation event. The result reports whether event totals and backend credit reconcile.",
      ),
      section(
        "Shared updates",
        "Booking confirmation, amendment and cancellation return an authoritative session snapshot. Financials consumes that same snapshot; its next mount has current values. A Booking scene running after Financials visibly revisits its credit/history containers and verifies the saved deduction. Management exposes a Financials link and an actual delta notice after confirmed changes.",
      ),
      section(
        "Isolation and cancellation",
        "The scene uses shared buildPiece, review queues, direct movement, handoff, jumpPress and SceneClock. It reads session state and records feature completion only. Reset invalidates the active scene token; no timer or delayed navigation is awaited after real completion. The bot rig remains independent of product logic.",
      ),
      section(
        "Integrity",
        "Transaction history is retained after full credit return. Popularity excludes cancelled records. Financials must not interpret a flat final balance as an empty account when past events exist. Rendered facility, history totals and chart endpoint are checked against the same saved snapshot.",
      ),
    ],
  ),
  doc(
    "priya",
    "Feature test plan & results",
    "Financials — reconciliation evidence",
    [
      context,
      section(
        "Visible checks",
        "Inspect facility values, observe and retest the currency finding, count saved history entries, compare charges minus returns with credit used, verify the final chart value and service insights, then press the real navigation and eligible booking link. Compare before/after business snapshots.",
      ),
      section(
        "Regression states",
        "Cover empty facility, a first booking, an increase and decrease, a full cancellation, mixed active/cancelled records, unchanged-price amendments and legacy single-event records. Build Financials before and after other features. No test may manufacture an event to make the chart look busy.",
      ),
      section(
        "Evidence limits",
        "Scripted reconciliation is not a substitute for manual accessibility testing or supplier settlement verification. Tests start Not run. Status changes require observed results; the authored design defect and retest remain distinct.",
      ),
    ],
    {
      tests: [
        [
          "FIN-01",
          "Inspect facility values",
          "Backend values and credit equation match.",
        ],
        [
          "FIN-02",
          "Observe incorrect axis currency",
          "USD labels are a display-only defect.",
        ],
        ["FIN-03", "Retest repaired labels", "Both labels read AED."],
        [
          "FIN-04",
          "Reconcile transaction history",
          "All events present; charges minus returns equal credit used.",
        ],
        [
          "FIN-05",
          "Inspect trend endpoint",
          "Saved net usage, or a genuinely flat empty chart.",
        ],
        [
          "FIN-06",
          "Inspect service insights",
          "Only active service selections counted.",
        ],
        [
          "FIN-07",
          "Press Financials navigation",
          "Correct route and active navigation.",
        ],
        [
          "FIN-08",
          "Inspect transaction link availability",
          "Open actual booking only if Management is built.",
        ],
        [
          "FIN-09",
          "Compare saved business state",
          "No bookings, drafts or credit changed.",
        ],
      ].map(([id, steps, expected]) => ({ id, steps, expected })),
    },
  ),
  doc("sami", "Delivery plan", "Financials — release scope and handback", [
    context,
    section(
      "Milestones",
      "Brief → actual design → credit overview → trend and insights → currency repair → history and reconciliation → eligible links → approval → immediate release and celebration. Reviews overlap independent construction. The estimate resets for this scene; reading and server waits pause it. There is no waiting for spare countdown seconds.",
    ),
    section(
      "Dependencies and connections",
      "There is no prerequisite to build Booking or Management. Their absence produces intentional empty data or disabled links. When they already exist, use their records and reveal the connection. If all other feature scenes are built, Product acknowledges completion of the platform; otherwise invite the visitor to continue.",
    ),
    section(
      "Budget and evidence",
      "No approved software budget has been supplied; do not confuse the AED 100,000 corporate credit facility with project cost. Record active scene duration and verified results at release. Hand back the completed Financials page with manual reset still accessible. No inactivity reset is introduced.",
    ),
  ]),
];
