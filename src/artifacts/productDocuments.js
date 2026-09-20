const section = (title, body, items) => ({
  title,
  body,
  ...(items ? { items } : {}),
});
const document = (id, owner, kind, title, feature, sections, extra = {}) => ({
  id,
  owner,
  kind,
  title,
  feature,
  sections,
  summary: sections[0].body,
  version: "1.0",
  status: "Draft · awaiting publication",
  ...extra,
});
const scope = "Global Concierge B2B portal";
export const PRODUCT_DOCUMENTS = [
  document(
    "master-nour",
    "nour",
    "Product strategy & brief",
    scope,
    "Product foundation",
    [
      section(
        "Executive brief",
        "Global Concierge brings airport services into one B2B workspace for travel agents, corporate travel desks and similar travel partners. The product should let an agent plan assistance across an entire itinerary, explain the commercial total before commitment, and manage the resulting bookings without moving between disconnected supplier channels. dnata’s airport-service proposition is the foundation: a seamless experience before departure, through the airport and on arrival.",
      ),
      section(
        "Problem and opportunity",
        "An airline ticket describes transport, but not the complete airport experience. Agents must still arrange assistance, lounge access, ground transfers and baggage support, often through separate processes with inconsistent service names and unclear eligibility. Every handoff creates an opportunity for missed details, duplicated work or an unexpected price. A single itinerary-led workflow should reduce these coordination costs while preserving the distinctions between airports, flights, travellers and service providers.",
      ),
      section(
        "Who the product serves",
        "The primary operator is a professional arranging travel for other people. The person purchasing services and the passenger receiving them may be different. The system must therefore distinguish the agency contact from the travelling party.",
        [
          "Travel agency consultant: assembles services for an individual or group and explains the final price to a customer.",
          "Corporate travel desk: arranges repeat journeys and requires transparent account-credit usage and traveller details.",
          "Agency supervisor or finance colleague: needs traceable bookings, negotiated discounts and a consistent view of the corporate facility.",
          "Travellers are beneficiaries of the booked services. A consumer self-service checkout is not the current B2B scope.",
        ],
      ),
      section(
        "Value proposition",
        "One itinerary, relevant services at each airport, one understandable commercial summary and one record that can be reviewed later. The interface should explain what is being purchased, where it is delivered, who receives it and how it affects the corporate account. It should remain useful before the first booking by showing deliberate empty states instead of fabricated activity.",
      ),
      section(
        "Core journey",
        "An agent enters the workspace, adds a flight, optionally adds further flights, chooses departure and arrival services at each airport, supplies traveller and contact details, reviews the order and confirms against the agency credit facility. Booking confirmation then feeds the bookings list, dashboard and financial view. Adding another flight extends the itinerary automatically; users should not need to understand the term “leg”.",
      ),
      section(
        "Service catalogue and eligibility",
        "The initial PoC catalogue contains Meet & Greet, lounge access, VIP assistance, chauffeur transfers, porter/baggage assistance and Dubai departure home/hotel check-in. These are illustrative offerings based on dnata service families, not a claim of live supplier inventory or universal airport availability.",
        [
          "Departure and arrival are separate service contexts, including when the same airport appears more than once.",
          "Home/hotel check-in is restricted to DXB departure in this PoC. It must never be offered as an arrival service.",
          "Show the charging unit: per adult, per vehicle or per booking. Show party totals, not just a misleading low unit price.",
          "Prices and availability require commercial validation before production. Demo estimates must remain clearly identifiable.",
        ],
      ),
      section(
        "Commercial model",
        "This is a B2B credit-facility model, not a card-payment checkout. Each new demo session begins with AED 100,000 available and zero opening usage. A confirmed booking deducts its net charge once; the same confirmed booking must also appear in financials. Corporate discounts are shown explicitly in the booking summary so the agent can reconcile gross service value, discount and the amount charged.",
        [
          "An unchanged retry must not create a second booking or a second charge.",
          "Insufficient credit prevents confirmation and leaves balances unchanged.",
          "The booking credit facility is not the software-project budget. Do not mix these two amounts.",
          "Production tax rules, invoice treatment, negotiated pricing and credit approvals remain commercial decisions.",
        ],
      ),
      section(
        "Feature roadmap",
        "The product is decomposed into independently demonstrable capabilities: access and workspace; dashboard; itinerary and service selection; traveller details and booking confirmation; bookings management; financials and insights. Each feature needs its own PRD, design specification, engineering notes, QA record and release report. These documents are published as that feature is worked on, not presented as completed work before its scenario runs.",
      ),
      section(
        "Data and validation requirements",
        "A flight needs valid departure and arrival airports, a flight date and flight number. The travelling party and contact details must be supplied before confirmation. Required fields should be marked and progression disabled until valid. Sample data is an editable convenience, never a substitute for validation. An airport change must invalidate incompatible service selections. Draft recovery should preserve user work where possible without turning incomplete data into a confirmed booking.",
      ),
      section(
        "Cross-feature consistency",
        "The dashboard, bookings and financial views must derive from the same saved booking records. Empty sessions contain zero activity, zero booking value and the full available facility. A booking added through the itinerary flow should not need separate manual entry in another view. The PoC uses persisted visitor sessions; a manual reset archives the prior session and starts a new one rather than silently mixing different visitors’ work.",
      ),
      section(
        "Experience and accessibility",
        "Use the dnata logo, primary blue for brand/navigation, green action fills with legible text and neutral surfaces. Preserve one consistent header and sidebar. Use readable labels, visible required markers, keyboard-operable controls, focused error guidance and accessible dialogs. Disabled functionality must look intentionally unavailable; it must not imply that an unfinished feature can be used. The completed entry feature should return to sign-in so a visitor can try the flow themselves.",
      ),
      section(
        "Security and privacy boundary",
        "Demo access is not production authentication. The demonstration password is neither authenticated nor stored. Production would need identity-provider integration, agency tenancy, role-based permissions, session expiry, audit logging and a retention policy for traveller data. Booth visitors should use fictional traveller/contact information. No claim of real authentication, ticketing, service fulfilment or payment settlement is made by this PoC.",
      ),
      section(
        "Success measures",
        "Product success should be assessed through completion rate, time to assemble an itinerary, validation failure rate, duplicate-confirmation prevention and successful reconciliation between booking value and credit usage. These are proposed measurement categories, not measured results. For the booth, the immediate acceptance target is a usable, coherent feature with visible requirements, design, implementation and test evidence that an attendee can inspect.",
      ),
      section(
        "Dependencies and decisions still open",
        "Production delivery requires supplier coverage and inventory contracts, service-level definitions, tax and cancellation rules, identity/agency integration, operational support ownership and data-protection review. These should be recorded as decisions and risks, not hidden behind an attractive prototype. The feature documents distinguish the implemented PoC boundary from the intended production product.",
      ),
      section(
        "Scope exclusions",
        "No live airport reservations, production identity verification, real credit underwriting, passenger fulfilment, supplier portal or consumer card payment is included in the opening release. The airport-service prices are illustrative. The animated team is a scripted explanation of a development workflow; it does not create production software or execute a complete QA suite live.",
      ),
      section(
        "Acceptance of the product direction",
        "Product approves the purpose and scope; Design approves the coherent customer journey; Engineering approves the implemented boundary; QA records evidence against actual checks; Delivery records release status and outstanding risks. Acceptance of one feature does not imply that all roadmap capabilities are complete. Later feature PRDs should link back to this brief and amend it only when the overall product direction changes.",
      ),
    ],
  ),
  document(
    "master-ellie",
    "ellie",
    "Experience strategy",
    "Global Concierge — experience principles",
    "Product foundation",
    [
      section(
        "Experience objective",
        "Make a complex, multi-airport service purchase feel like planning a clear itinerary. The interface should prioritise the agent’s decisions, while the product maintains eligibility, totals and continuity behind the scenes.",
      ),
      section(
        "Information architecture",
        "Access leads into one persistent workspace. Dashboard summarises live activity; New Booking creates an itinerary; Bookings manages saved records; Financials explains the corporate facility and booking value. Feature availability should be honest: an unbuilt area remains disabled until its release.",
      ),
      section(
        "Journey model",
        "Represent each flight by route, date and flight number. Within a flight, departure and arrival are separate service contexts. Category filters reduce scanning while maintaining an immediately visible selection summary. “Add another flight” extends the journey without a separate single/multi-flight mode.",
      ),
      section(
        "Commercial clarity",
        "The summary must distinguish unit pricing from party totals, show corporate discounts explicitly and identify the net credit charge. Do not use card-entry metaphors in this B2B facility flow. Distinguish a zero-valued empty state from missing or failed data.",
      ),
      section(
        "Visual and interaction system",
        "Use the real dnata wordmark, blue brand/navigation, green action fills with dark readable text, restrained borders and generous spacing. Required markers, inline validation, disabled progression and editable sample data should behave consistently across forms. Dialogs should be keyboard accessible and restore focus on close.",
      ),
      section(
        "Design governance",
        "Each released feature receives a concrete screen reference and its own rationale, states and acceptance checklist. Design reviews the completed module in context, not isolated fields before their surrounding flow exists. Current feature boards use the actual shared components; future boards are published when their scenario is introduced.",
      ),
    ],
  ),
  document(
    "master-omar",
    "omar",
    "Technical approach",
    "Global Concierge — product architecture",
    "Product foundation",
    [
      section(
        "System boundary",
        "The product consists of a browser interface, a local API and persisted visitor-session records. UI views share booking and commercial rules rather than maintaining separate totals. The animation layer demonstrates development and remains separate from product behaviour.",
      ),
      section(
        "Domain model",
        "A visitor session owns its draft, confirmed bookings and completed feature flags. A draft contains an ordered flight itinerary, traveller/contact data and selections tied to individual departure/arrival contexts. Confirmed records retain the pricing needed to explain the net charge. Monetary calculations use integer fils.",
      ),
      section(
        "Consistency and write safety",
        "The API validates booking payloads, eligibility and available credit. Confirmation uses an idempotency key so a lost response can be retried without duplicate charging. Draft editing and confirmation are separate operations. Reset archives the existing visitor session and creates a fresh one; it does not delete historical bookings.",
      ),
      section(
        "Integration boundaries",
        "The six-service catalogue and airport directory support the PoC journey. Production needs identity, supplier inventory, fulfilment, tax/invoicing and operational integrations. Do not present a locally persisted demonstration booking as a live airport-service reservation.",
      ),
      section(
        "Quality and operability",
        "Keep product components reusable across the application and design references. Validate server-side as well as in forms; prevent stale-session writes; preserve drafts on recoverable failures. Release notes should state what was actually built, tested and deferred. Each new feature gets an implementation record linked to its PRD.",
      ),
    ],
  ),
  document(
    "master-priya",
    "priya",
    "Quality strategy",
    "Global Concierge — quality and acceptance strategy",
    "Product foundation",
    [
      section(
        "Quality objective",
        "Protect the integrity of itinerary details, service eligibility, traveller information and the corporate credit balance. A successful-looking animation is not evidence that these business rules are correct.",
      ),
      section(
        "Risk priorities",
        "Highest-priority failures are duplicate charging, invalid airport/service combinations, incomplete traveller details reaching confirmation, inconsistent totals between views, and data leaking between visitor sessions. Access must not be represented as secure authentication when it is demo-only.",
      ),
      section(
        "Test layers",
        "Use domain and API tests for pricing, eligibility, idempotency and persistence; component/browser checks for required inputs, navigation, accessibility and error recovery; manual review for comprehension and visual quality. Scene inspections are visual demonstrations. Only instrumented checks should receive a runtime Passed status.",
      ),
      section(
        "Evidence policy",
        "Every feature keeps its authored cases separate from execution results. Unexecuted cases remain Not run. A runtime check records its observed outcome and timestamp; a visual approval is labelled as a visual review. Automated development tests and live scene checks are separate evidence sources.",
      ),
      section(
        "Release and regression",
        "Review complete modules, then test the connected flow. Add cross-feature checks as later releases connect bookings, dashboard and financials. Reset must be exercised during active work as well as when idle. Use fictional passenger data throughout booth testing.",
      ),
    ],
  ),
  document(
    "master-sami",
    "sami",
    "Delivery roadmap",
    "Global Concierge — delivery plan and governance",
    "Product foundation",
    [
      section(
        "Delivery objective",
        "Release a sequence of usable B2B capabilities that together form a coherent Global Concierge journey. A release is complete when its agreed scope is implemented, reviewed, tested within its stated boundary and available for the attendee to try.",
      ),
      section(
        "Release order and dependencies",
        "Access and workspace is the initial gate. Dashboard, booking creation, bookings management and financials follow as feature releases. A feature can be demonstrated independently where sensible, but integrations must update earlier views from the same saved records. Do not claim delivery of a future feature merely because its name appears in a menu.",
      ),
      section(
        "Roles and approvals",
        "Product owns outcomes, scope and acceptance; Design owns the journey and states; Engineering owns implementation and data integrity; QA owns observed evidence; Delivery owns readiness, timing and unresolved risks. Reviews may run concurrently with construction of another completed module.",
      ),
      section(
        "Schedule policy",
        "The visible countdown estimates remaining scene time and updates at completed milestones. Reading documents pauses it. It never controls the choreography: completion of actual work releases the feature immediately and sets the display to zero. If the estimate expires first, the display says Finishing release until work completes. This is not an engineering-effort estimate.",
      ),
      section(
        "Budget and commercial separation",
        "No actual project budget, staffing cost or supplier quote has been supplied. Those values remain unapproved, not fabricated. The AED 100,000 agency booking facility is commercial demo data and is never reported as the engineering budget. Production budgeting must include identity/integration work, hosting, support, security review and supplier onboarding.",
      ),
      section(
        "Readiness and risks",
        "A release needs usable entry/exit points, an accurate scope statement, live feature documents, acceptance evidence and a recoverable session. Outstanding production dependencies remain visible. After demonstration, return the product to the first screen of the released flow so an attendee can independently exercise it.",
      ),
    ],
  ),
  document(
    "gate-nour",
    "nour",
    "Feature PRD",
    "Login & workspace — product requirements",
    "Login & workspace",
    [
      section(
        "Outcome and parent brief",
        "This release establishes the usable entry point to the Global Concierge B2B portal. It implements the access/workspace foundation of the master product brief. An agent should recognise dnata, understand that this is their agency workspace, enter valid demo credentials and arrive in a deliberate empty shell.",
      ),
      section(
        "Personas and primary story",
        "As a travel consultant or corporate travel-desk operator, I want a clear and predictable way to enter my agency workspace so that I can begin arranging airport services without wondering whether an empty screen is broken. For the booth, I also need to try the completed flow myself after the staged team has demonstrated it.",
      ),
      section("Functional requirements", null, [
        "LOGIN-01: Show the dnata identity and Global Concierge proposition alongside a labelled sign-in form.",
        "LOGIN-02: Require a syntactically valid work email and a non-empty demo password. Keep submission disabled until the form is valid.",
        "LOGIN-03: Provide Use sample data. It fills fictional demonstration values, which remain editable.",
        "LOGIN-04: Submit through the real form handler to the workspace; do not use a screenshot or decorative button as the product.",
        "SHELL-01: Show a consistent header with identity, booking search, New Booking, notifications/settings and account context.",
        "SHELL-02: Initially expose only the disabled Dashboard stub. Other feature capabilities are not implied to be released.",
        "SHELL-03: Present Nothing here yet with a clear explanation that features will be built next.",
        "TRIAL-01: After release, restore an empty sign-in form and allow the visitor to populate, edit and submit it themselves.",
      ]),
      section(
        "Flow and state model",
        "The feature begins at sign-in. Invalid or incomplete data stays on that screen. Valid submission moves to the empty workspace. Sample data is an optional shortcut that does not bypass validation. At the end of the build presentation, return to a fresh sign-in screen rather than leaving the user at the destination of the test. The workspace is still available through the completed form.",
      ),
      section(
        "Content and accessibility",
        "Use work email and password labels, visible required markers and descriptive button text. Avoid language implying real authentication. The demo-access explanation must stay visible. Controls should be keyboard operable, focused states discernible and disabled submission understandable. The layout must adapt without clipping the form or losing the primary action.",
      ),
      section(
        "Data and privacy",
        "The password is a local demonstration value and is neither stored nor authenticated. Sample identity details are fictional. The session service owns visitor context and feature completion; it does not convert this form into an identity provider. No traveller data is required for this release.",
      ),
      section("Acceptance criteria", null, [
        "A fresh form cannot submit. A malformed email or empty password cannot submit.",
        "Sample data produces valid, editable input values and enables submission.",
        "Submitting valid demo inputs shows the actual empty workspace.",
        "The header and sidebar match the approved component references and have no broken icon placeholders.",
        "Unbuilt navigation remains unavailable.",
        "The released feature returns to sign-in and can be exercised independently of the bots.",
      ]),
      section(
        "Non-goals and production follow-up",
        "SSO, password recovery, MFA, user provisioning, role/agency permissions, session expiration and real authentication are excluded. A production release would require security-reviewed identity integration and tenant isolation. The disabled shell controls should only become functional when their corresponding feature is released.",
      ),
      section(
        "Dependencies and release decision",
        "Design approves both entry and empty-workspace states; Engineering reuses the real product form and shell; QA records the actual form checks; Delivery makes the usable flow available after those checks. The master brief remains the source of overall product direction. This PRD is the contract for the entry feature, not for the animated characters.",
      ),
    ],
  ),
  document(
    "gate-ellie",
    "ellie",
    "Feature design specification",
    "Login & workspace — screens, states and rationale",
    "Login & workspace",
    [
      section(
        "Design objective",
        "Establish trust and orientation before introducing the service-booking workflow. The screen must clearly communicate dnata, the agency context and the purpose of Global Concierge, with a single obvious entry action. The empty workspace should feel like a valid starting state.",
      ),
      section(
        "Sign-in composition",
        "The brand/proposition panel introduces the airport-services product. The form panel holds the welcome heading, agency context, optional sample-data helper, work-email/password inputs and the submit action. Keep labels close to inputs, explanatory copy subordinate and the primary action visually distinct. The helper must look like a convenience, not the main product action.",
      ),
      section(
        "Required states",
        "Design covers blank, partially completed, invalid-email, valid-ready and submitted states. Blank and invalid inputs keep submission disabled. Sample values are editable and should not be mistaken for an authenticated account. The demo-access boundary stays explicit. The live browser form supplies normal input validation semantics.",
      ),
      section(
        "Workspace composition",
        "Use a single header and sidebar, not competing navigation systems. Keep product identity, search and account controls aligned. Start with only a disabled Dashboard entry and an intentional empty-content message. The same structure will later receive actual feature navigation and live data.",
      ),
      section("Design review checklist", null, [
        "Both screens use the actual shared components shown below.",
        "The sign-in action remains discoverable at small viewport sizes.",
        "Required labels, disabled states and keyboard focus remain clear.",
        "White space communicates hierarchy; it should not make the empty workspace look like a failed load.",
        "Blue is used for branding/navigation, while green action fills retain readable contrast.",
      ]),
      section(
        "Handoff and release experience",
        "Engineering builds complete modules, and Design reviews each in context. After release, the attendee sees the completed sign-in screen with a blank form, not the last screen visited by QA. Product overlays and the cast must leave form controls usable; artefact readers open as separate accessible dialogs.",
      ),
    ],
    {
      previews: [
        { view: "login", label: "Sign-in — actual component" },
        { view: "shell", label: "Empty workspace — actual component" },
      ],
    },
  ),
  document(
    "gate-omar",
    "omar",
    "Feature implementation record",
    "Login & workspace — implementation and boundaries",
    "Login & workspace",
    [
      section(
        "Implemented capability",
        "The feature uses the product Login and Shell components. It supplies an editable demo-access form and the initial navigation structure for Global Concierge. The animation reveals those real components; the usable product does not depend on a static image or a simulated form submission.",
      ),
      section(
        "Form behaviour",
        "Email validity and a non-empty password control the submit state. Use sample data assigns fictional values through component state, after which the inputs remain editable. Submission invokes the existing form handler. The demo password is not sent to an identity service or retained as a credential.",
      ),
      section(
        "Workspace behaviour",
        "The shell uses the shared dnata logo and icon components. It exposes an intentional empty state and a disabled Dashboard stub. Search and New Booking are represented in the shell, but are not activated as released functionality by this opening feature. Future feature release hooks should enable only the functionality that has actually been built.",
      ),
      section(
        "Session boundary",
        "The local API persists visitor sessions and feature-completion flags. Completing this opening records workspace availability, not a booking or a credit charge. Manual reset archives the previous visitor context. A scene reload is not evidence that real authentication has occurred.",
      ),
      section(
        "Visitor trial",
        "After delivery, remount the Login component with empty input state and enable normal pointer/keyboard interaction. Successful user submission displays the completed shell. Keep the bots and their artefacts available without placing a duplicate Choose a feature panel over the form.",
      ),
      section(
        "Verification and remaining work",
        "The live scenario checks blank/invalid form gating, sample-data population, successful submission and initial shell visibility. Development tests provide additional regression coverage, but must not be reported as having run live at the booth. Production identity, agency tenancy, permissions, audit logging and account lifecycle remain separate implementation work.",
      ),
    ],
  ),
  document(
    "gate-priya",
    "priya",
    "Feature test plan & results",
    "Login & workspace — acceptance evidence",
    "Login & workspace",
    [
      section(
        "Test objective",
        "Verify that the attendee can use the completed entry flow and that the product accurately represents its demo-only access boundary. Protect against a form that appears usable but does not submit, a disabled state that can be bypassed or a shell that implies future features are already released.",
      ),
      section(
        "Preconditions",
        "Use a fresh visitor session, a blank login form and fictional sample credentials. The product screen must be the actual Login component. Readable artefact dialogs pause the scene, so execution must resume without dropping a pending check.",
      ),
      section(
        "Execution policy",
        "Cases below begin Not run. The scenario updates only the cases it actually observes; a theatrical inspection or tick does not constitute a passed business test. Runtime results carry their observation time. Manual accessibility and production-security work remain explicitly outside the automated scene checks.",
      ),
      section(
        "Coverage and limitations",
        "The live checks cover client-side demo validation, editable sample values, navigation to the shell and the returned visitor entry point. They do not prove authentication security, cross-browser compatibility, supplier fulfilment or real production account access. These require separate test environments and evidence.",
      ),
      section(
        "Release rule",
        "Release the entry feature only after the instrumented checks pass and the completed sign-in form is available to the attendee. Record failures rather than substituting a success animation. Re-running a scene starts fresh execution evidence, while the authored cases remain unchanged.",
      ),
    ],
    {
      tests: [
        {
          id: "LOGIN-01",
          steps: "Observe a fresh blank login form.",
          expected: "Enter demo workspace is disabled.",
        },
        {
          id: "LOGIN-02",
          steps: "Enter malformed email with a non-empty demo password.",
          expected: "Submission remains disabled.",
        },
        {
          id: "LOGIN-03",
          steps: "Use sample data and inspect both input fields.",
          expected:
            "Fictional values appear, remain editable, and enable submission.",
        },
        {
          id: "LOGIN-04",
          steps: "Submit the valid form through its real button.",
          expected: "The actual empty workspace appears.",
        },
        {
          id: "SHELL-01",
          steps: "Inspect the completed workspace header and navigation.",
          expected: "Header is visible; Dashboard exists and remains disabled.",
        },
        {
          id: "TRIAL-01",
          steps: "Observe the released feature entry point.",
          expected:
            "Sign-in returns with empty editable fields and disabled submission.",
        },
        {
          id: "ACCESS-01",
          steps:
            "Manually traverse the feature with keyboard and screen reader.",
          expected: "Labels, focus, errors and navigation are understandable.",
        },
      ],
    },
  ),
  document(
    "gate-sami",
    "sami",
    "Feature release report",
    "Login & workspace — delivery, timing and risks",
    "Login & workspace",
    [
      section(
        "Release scope",
        "Deliver the B2B portal’s demo-access flow and initial workspace. The release includes a usable sign-in form, optional sample data, shared header/sidebar, an honest empty state and a return to sign-in for independent attendee testing.",
      ),
      section(
        "Milestones",
        "Requirements and PRD publication precede the design specification. Engineering constructs the login and workspace modules. QA and Design review complete modules while Engineering continues elsewhere. Real login submission is the dependency for entering the workspace. A final cross-role review closes the release.",
      ),
      section(
        "Countdown and completion",
        "The hovering countdown estimates remaining scene time, updating at completed milestones and pausing for document reading or release saving. Real work completion triggers shipping, the return to sign-in and celebration immediately; the countdown never adds waiting time. It displays Finishing release if its estimate expires before work completes, and Shipped at actual completion. The timing record reports measured active scene time.",
      ),
      section("Release criteria", null, [
        "Required and invalid input states behave correctly.",
        "Sample data is editable and successfully submits through the real form.",
        "The shell exposes only the intended initial navigation.",
        "Feature documents reflect the current run rather than generic robot implementation notes.",
        "The attendee receives the finished sign-in entry point to try.",
      ]),
      section(
        "Budget",
        "Approved software-project budget: not supplied. Actual engineering cost: not measured. No fabricated monetary budget is reported. The agency’s AED 100,000 booking facility is unrelated to this delivery budget. A production estimate must account for identity, integrations, security, hosting, operations and support.",
      ),
      section(
        "Risks and follow-up",
        "This release does not deliver real authentication, live reservations or commercial settlement. Future booking, management and financial features require their own PRDs, designs, implementation notes, test evidence and release decisions. Published opening documents do not imply that those future releases are complete.",
      ),
    ],
  ),
];
