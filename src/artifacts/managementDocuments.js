const section = (title, body) => ({ title, body });
const doc = (owner, kind, title, sections, extra = {}) => ({
  id: `bookings-${owner}`,
  owner,
  kind,
  title,
  feature: "Bookings & Manage",
  sections,
  summary: sections[0].body,
  version: "1.0",
  status: "Draft · awaiting publication",
  ...extra,
});
const common = section(
  "Product context and build order",
  "Global Concierge serves travel agents, travel desks and corporate travel partners arranging airport services. Management consumes the same saved bookings and corporate credit as the creation flow. It can ship before or after creation and Dashboard. The normal Booking scene already saves a reservation; that record must be acknowledged when management follows. A labelled temporary QA example is used only if no usable record exists. No example enters the ledger.",
);
export const MANAGEMENT_DOCUMENTS = [
  doc("nour", "Feature PRD", "Bookings & Manage — control after confirmation", [
    common,
    section(
      "User outcomes",
      "Find a reservation by reference, route or traveller; inspect its itinerary and services; change permitted details with informed approval; cancel with a visible credit return. Status and history remain discoverable. A cancelled reservation must not silently disappear from the agency’s records.",
    ),
    section(
      "List and details",
      "The list uses saved session data, text search and All / Confirmed / Cancelled filters. Details expose stable reference, journey, travellers, contact information, selected services and the corporate-discounted charge. Empty and unmatched results are distinct. Booking creation is enabled only once that feature ships.",
    ),
    section(
      "Amendment scope",
      "Keep reference, route, flight count and party size fixed. Permit flight date and number changes, traveller names, contact information and eligible airport services. Validate the whole proposal. A review shows old/new information and the price difference before a real confirmation. Sample contact data edits only the draft. Discard leaves the booking untouched.",
    ),
    section(
      "Commercial contract",
      "All money uses AED and integer fils. The backend calculates current catalogue prices with the corporate discount; browser prices are never authoritative. An increase consumes only the difference; a decrease returns the difference. Reject unaffordable changes atomically. Keep the previous and revised details in history.",
    ),
    section(
      "Cancellation",
      "Show the reference, itinerary, service count, exact return and balance afterwards before confirmation. This PoC uses an explicitly illustrative full return of the current net charge. Keep booking makes no write. Confirm marks Cancelled, retains history and returns credit once. There is no real supplier cancellation.",
    ),
    section(
      "Release criteria",
      "Both scripted findings must be retained with retests. The QA rehearsal changes no persisted booking, draft or credit. Product controls after release execute real local backend amendments and cancellations. Reset archives the visitor; late replies must not restore their UI. Keyboard and screen-reader coverage is separately reported, not fabricated.",
    ),
  ]),
  doc(
    "ellie",
    "Feature design specification",
    "Bookings & Manage — list, decisions and states",
    [
      common,
      section(
        "Information hierarchy",
        "Group search, filter and results as one complete list container. Details group itinerary, travellers, services and pricing; actions and history are separate containers. Modification is a complete form, followed by a complete change review. Cancellation has one clear decision with Keep booking and Confirm cancellation.",
      ),
      section(
        "Status differentiation",
        "Confirmed and Cancelled have explicit text and distinct visual treatments. The design comparison is labelled and does not imply a real cancellation. Retain cancelled entries for audit. Avoid reliance on colour alone.",
      ),
      section(
        "Review clarity",
        "Show old and new flight/contact details and selected service changes alongside original/revised charges, additional credit or return, and resulting availability. An insufficient-credit proposal remains editable and cannot be confirmed.",
      ),
      section(
        "Staging and motion",
        "Use actual components for thumbnails. Omar builds complete groups continuously; review starts after each group completes and does not block independent construction. Priya presses real controls. QA preview labels remain visible throughout theatrical defects. Return to the real list at handback.",
      ),
    ],
    {
      previews: ["list", "detail", "edit", "review", "cancel"].map((v) => ({
        label: `Management · ${v}`,
        view: `manage-${v}`,
      })),
    },
  ),
  doc(
    "omar",
    "Implementation notes",
    "Bookings & Manage — versioned transactions",
    [
      common,
      section(
        "Persistence",
        "Keep original booking creation immutable for creation-request retries. A separate current-state record stores amended payload, status, version and history. Request receipts bind each session/key to one exact operation. Snapshot merges current state with the original record.",
      ),
      section(
        "Transaction boundary",
        "Validate expected version and active session under a SQLite write transaction. Reprice on the server, check available credit, update state and write the request receipt atomically. Identical retries return the current snapshot; conflicting key reuse and stale versions are rejected. Repeated cancellation cannot generate a second return.",
      ),
      section(
        "Client boundary",
        "ManagementController owns drafts, server quote, review and pending request recovery independently of scene choreography. Pending mutations retain their key and payload across retry/reload. Reset invalidates a controller epoch so late responses cannot repopulate the new scene. A preview controller is read-only with no booking writes.",
      ),
      section(
        "Integration",
        "Dashboard active counts and savings exclude cancelled records; booking history preserves all states. Financials uses current active value and available credit. Feature navigation is enabled only as scenes build it. No management rehearsal changes the confirmed booking used by later scenes.",
      ),
    ],
  ),
  doc(
    "priya",
    "Feature test plan & results",
    "Bookings & Manage — acceptance evidence",
    [
      common,
      section(
        "Scene evidence",
        "Observe real list/empty state, exact-reference search, distinct statuses, proposed price difference, discarded changes, the staged disappearance, cancellation confirmation and Keep booking. Compare the complete business snapshot before and after rehearsal. Each result below begins Not run and is populated by observed checks.",
      ),
      section(
        "Backend regression",
        "Exercise amendment increases and decreases, insufficient credit rollback, stale versions, duplicate/colliding request keys, cancelled-record mutation rejection, full credit return exactly once, original creation retry after amendment, archival rejection and late client response suppression.",
      ),
      section(
        "Manual checks",
        "Keyboard focus and screen-reader announcement coverage must be performed separately. Do not infer accessibility or supplier integrations from the animated scene.",
      ),
    ],
    {
      tests: Array.from({ length: 10 }, (_, i) => ({
        id: `MAN-${String(i + 1).padStart(2, "0")}`,
        steps: [
          "Inspect saved list",
          "Search exact reference",
          "Inspect status repair",
          "Review amendment difference",
          "Discard amendment",
          "Observe preview disappearance",
          "Inspect cancellation review",
          "Keep booking",
          "Compare business snapshots",
          "Verify real-list handback",
        ][i],
        expected: [
          "Matches saved data or deliberate empty state",
          "One matching preview record",
          "Distinct text and appearance",
          "Correct proposed credit difference",
          "No saved change",
          "No API cancellation",
          "Exact return with explicit decision",
          "Same booking remains",
          "No mutation of bookings, draft or credit",
          "QA example removed and links connected",
        ][i],
        status: "Not run",
      })),
    },
  ),
  doc("sami", "Delivery plan", "Bookings & Manage — release and dependencies", [
    common,
    section(
      "Scope and sequencing",
      "Release list, details, modification/review and cancellation. Reuse the established shell and bot rig. Start a fresh progress estimate; update from work milestones and finish immediately with actual completion, never waiting for unused countdown seconds.",
    ),
    section(
      "Dependencies and connections",
      "New Booking supplies records when available. Dashboard receives working View all and detail links when already released. Management can ship alone with an empty list. Backend changes and credit returns must work before scene approval. Financials choreography remains a separate feature.",
    ),
    section(
      "Budget and acceptance",
      "No approved project budget has been supplied; do not invent one. Record actual active duration, observed findings, retests and release state. The scripted preview leaves the real ledger unchanged. The visitor receives the real list after celebration; manual reset remains available throughout.",
    ),
  ]),
];
