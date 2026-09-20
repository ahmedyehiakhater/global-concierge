import { ReviewQueue } from "./staging.js";
import { quote, money, stepError, servicesFor } from "../../shared/product.js";

export async function runBooking(c, signal) {
  const {
    patch,
    say,
    act,
    clock,
    bots,
    production: p,
    delivery,
    buildPiece,
    inspectModule,
    jumpPress,
    assertLive,
  } = c;
  const root = ".booking-stage";
  const q = (s) => document.querySelector(s);
  const wait = (seconds = 0.12) => clock.wait(seconds, signal);
  const pub = (owner, status) => p.publish(`booking-${owner}`, status);
  const status = (owner, text) => p.status(`booking-${owner}`, text);
  const check = (id, ok, detail) => {
    assertLive(signal);
    p.evidence("booking-priya", id, !!ok, detail);
    if (!ok) throw Error(`Booking acceptance check failed: ${id}`);
  };
  const build = (id, label, selector, builder = "omar") =>
    buildPiece(root, { id, label, selector }, signal, 0, builder);
  const inspect = (id, selector, label) =>
    inspectModule(id, `${root} ${selector}`, label, signal);
  const press = async (selector) => {
    await jumpPress("priya", q(selector), signal);
    await c.awaitBooking(signal);
  };
  const body = '[data-booking="body"]';
  const snapshot = await c.loadSession(signal);
  const before = {
    credit: snapshot.credit.available,
    count: snapshot.bookings.length,
    draft: JSON.stringify(snapshot.draft),
  };
  c.beginBooking();
  const flow = c.getBooking();
  const existing = snapshot.bookings.find(
    (b) => b.requestKey === flow.fixedKey,
  );
  delivery.start(300);
  patch({
    ready: false,
    feature: "booking",
    phase: "Requirements",
    timer: true,
    brief: true,
    board: false,
    checks: 0,
    bookingStage: true,
    bookingComplete: false,
    missingTotals: true,
    missingTicks: true,
    bookingView: "journey",
    error: "",
  });
  pub("nour", "Requirements drafted");
  pub("sami", "Release in progress");
  c.setBrief("booking-nour");
  await say(
    "nour",
    "Let’s turn an itinerary into a complete airport experience.",
    signal,
    2.5,
  );
  await say("sami", "How many steps?", signal, 1.2);
  await say("nour", "Five.", signal, 0.8);
  await say("sami", "Four?", signal, 0.8);
  await say("nour", "Five.", signal, 0.8);
  await say("sami", "Five.", signal, 0.8);
  if (!c.getState().entered) {
    await jumpPress("priya", q(".opening-login button[type=button]"), signal);
    await jumpPress("priya", q(".opening-login button[type=submit]"), signal);
  }
  patch({ shell: true, login: false, entered: true });
  await c.passBrief(signal);
  await say(
    "nour",
    "Flights, travellers, services, review—and confirmation against corporate credit.",
    signal,
    2.8,
  );
  status("nour", "Requirements approved");
  pub("ellie", "Design prepared");
  patch({ phase: "Design", brief: false, board: true });
  await say(
    "ellie",
    "One journey. Services at both ends. A summary that stays with you.",
    signal,
    2.7,
  );
  await say(
    "ellie",
    "The steps guide you. The summary explains the cost.",
    signal,
    2,
  );
  c.setBrief("booking-ellie");
  await c.passBrief(signal, "ellie", "omar");
  c.clearBrief();
  await c.disperse(signal);
  pub("omar", "Implementation in progress");
  pub("priya", "Testing in progress");
  status("ellie", "Handed to engineering");
  await buildPiece(
    ".opening-shell",
    {
      id: "booking-entry",
      label: "New Booking entry point",
      selector: ".topbar .header-actions > .button",
    },
    signal,
    0,
    "sami",
  );
  patch({ bookingNav: true });
  await wait();
  await press(".topbar .header-actions > .button");
  await build(
    "frame",
    "Wizard heading and five-step navigation",
    '[data-booking="heading"], [data-booking="steps"]',
  );
  await build("journey", "Flight details and travelling party", body);
  const design = new ReviewQueue();
  design.add(() => inspect("ellie", body, "complete journey form"));
  const qaJourney = (async () => {
    check(
      "BOOK-01",
      !!q("[data-booking-next]")?.disabled &&
        !!q(".booking-stage input[required]"),
      "Blank required fields keep Continue disabled.",
    );
    await say("priya", "First, make it testable.", signal, 1.5);
    // This helper is built after the independent summary reveal to avoid two simultaneous outline owners.
  })().then(
    () => null,
    (e) => e,
  );
  await build(
    "summary",
    "Persistent booking summary",
    '[data-booking="summary"]',
  );
  const earlyError = await qaJourney;
  if (earlyError) throw earlyError;
  await build(
    "sample",
    "QA sample-data helper",
    '[data-booking="sample"]',
    "priya",
  );
  await c.typeField("Adults", "2", signal);
  await press(".booking-stage .sample-toolbar button");
  check(
    "BOOK-02",
    flow.draft.adults === 2 &&
      flow.draft.legs[0].from === "DXB" &&
      flow.draft.legs[0].to === "CAI",
    "Sample Journey is DXB to CAI for two adults, with a future date and editable fields.",
  );
  await say("priya", "Repeatable data. Still editable.", signal, 1.5);
  await c.typeField("Flight number", "", signal);
  check(
    "BOOK-03",
    q("[data-booking-next]").disabled,
    "Clearing the flight number blocks progression.",
  );
  await say(
    "priya",
    "No flight number. Continue is blocked. Let’s put it back.",
    signal,
    2.5,
  );
  await c.typeField("Flight number", flow.seed.legs[0].flight, signal);
  await say("priya", "Required means required.", signal, 1.2);
  await design.drain();
  await press("[data-booking-next]");
  patch({ bookingView: "travellers" });
  delivery.estimateRemaining(210);
  await build("travellers", "Travellers and contact details", body);
  await build(
    "sample-travellers",
    "Traveller sample-data helper",
    '[data-booking="sample"]',
    "priya",
  );
  await press(".booking-stage .sample-toolbar button");
  await say("priya", "Two travellers. One contact.", signal, 1.5);
  await say(
    "nour",
    "The travel desk is arranging it on their behalf.",
    signal,
    1.8,
  );
  await c.typeField("Lead traveller email", "invalid-email", signal);
  check(
    "BOOK-04",
    q("[data-booking-next]").disabled &&
      q(".booking-stage input[type=email]").validity.typeMismatch,
    "Malformed email is rejected before progression.",
  );
  await say(
    "priya",
    "That is not an email address. Continue stays disabled until I fix it.",
    signal,
    2.8,
  );
  await c.typeField("Lead traveller email", flow.seed.email, signal);
  await inspect("ellie", '[data-booking="steps"]', "completed-step indicators");
  p.append(
    "booking-ellie",
    "DESIGN-01 · Found",
    "Journey is complete but its step marker still shows a number. Completed steps must communicate progress.",
  );
  await say(
    "ellie",
    "Journey is finished. The steps should show it.",
    signal,
    1.8,
  );
  await say("omar", "Noted.", signal, 0.8);
  await build("ticks", "Completed-step indicators", '[data-booking="steps"]');
  patch({ missingTicks: false });
  await wait();
  check(
    "BOOK-05",
    q(".booking-stage .steps button span").textContent === "✓",
    "The completed Journey now shows its check mark.",
  );
  p.append(
    "booking-ellie",
    "DESIGN-01 · Resolved",
    "Observed the completed Journey tick after correction. The current and future steps retain their own states.",
  );
  await press("[data-booking-next]");
  patch({ bookingView: "services" });
  await build("services", "Airport service planner", body);
  await build(
    "sample-services",
    "Service sample-data helper",
    '[data-booking="sample"]',
    "priya",
  );
  await say(
    "ellie",
    "Before departure here. After arrival there.",
    signal,
    1.8,
  );
  await press('[data-direction="departure"]');
  await press('input[data-service="dxb_departure"]');
  await press('[data-direction="arrival"]');
  await press('input[data-service="cai_arrival"]');
  const calculated = quote(flow.draft.services, flow.draft.adults);
  check(
    "BOOK-06",
    flow.draft.services.length === 2 &&
      calculated.total === 57600 &&
      !servicesFor(flow.draft.legs[0], "arrival").some(
        ([id]) => id === "home_checkin",
      ),
    "Selected two direction-appropriate services; two-adult net total is AED 576.",
  );
  await say(
    "priya",
    "Right service. Right airport. Right direction.",
    signal,
    1.8,
  );
  await inspect("nour", '[data-booking="summary"]', "commercial acceptance");
  await say("nour", "Two services selected.", signal, 1.2);
  await say("nour", "The total still says nothing.", signal, 1.4);
  status("nour", "Commercial acceptance pending");
  p.append(
    "booking-priya",
    "PRODUCT-01 · Found",
    "Services are selected but the visible summary displays dashes. This is a scene-only presentation defect; the calculator and backend have not been changed.",
  );
  await say("omar", "It’s a layout.", signal, 1.1);
  await say("nour", "It’s a calculator.", signal, 1.3);
  bots.omar.setExpression("angry");
  await wait(0.5);
  await say("priya", "Logged it.", signal, 1);
  await say("sami", "Close the finding. Then we can confirm.", signal, 1.7);
  delivery.estimateRemaining(100);
  await build(
    "totals",
    "Corporate discount and credit calculation",
    '[data-booking="summary"]',
  );
  patch({ missingTotals: false });
  await wait();
  check(
    "BOOK-07",
    calculated.subtotal === 64000 &&
      calculated.discount === 6400 &&
      calculated.total === 57600 &&
      [...document.querySelectorAll(".summary-money b")]
        .map((e) => e.textContent)
        .join("|") === [money(64000), money(-6400), money(57600)].join("|"),
    "Observed subtotal AED 640, discount AED 64, charge AED 576 in the actual summary.",
  );
  p.append(
    "booking-priya",
    "PRODUCT-01 · Resolved",
    "Revealed the real calculator results and observed correct quantity, subtotal, corporate discount and charge. Projected available credit uses the live balance.",
  );
  status("nour", "Commercial acceptance approved");
  await say("omar", "Now it calculates.", signal, 1.2);
  await say("nour", "And the corporate discount is clear.", signal, 1.5);
  await say(
    "priya",
    "Six hundred and forty, less sixty-four. Five hundred and seventy-six.",
    signal,
    2.6,
  );
  await press("[data-booking-next]");
  patch({ bookingView: "review" });
  await build(
    "review",
    "Journey, travellers and selected-service review",
    body,
  );
  await inspect("priya", body, "complete booking review");
  check(
    "BOOK-08",
    !stepError(flow.draft) &&
      q(".wizard-step-body").textContent.includes("James"),
    "Review contains the selected journey and travellers; all required details validate.",
  );
  await say("priya", "The review matches the selections.", signal, 1.4);
  await press("[data-booking-next]");
  patch({ bookingView: "credit" });
  await build("credit", "Credit facility and confirmation controls", body);
  await say(
    "nour",
    "The travel desk uses corporate credit. There’s no card payment here.",
    signal,
    2.5,
  );
  check(
    "BOOK-09",
    q("[data-booking-confirm]").disabled &&
      !q("[data-booking-consent]").checked,
    "Confirmation is disabled until explicit credit acknowledgement.",
  );
  await jumpPress("sami", q("[data-booking-consent]"), signal);
  await say("sami", "Confirming against the facility.", signal, 1.5);
  delivery.hold = true;
  try {
    await jumpPress("sami", q("[data-booking-confirm]"), signal);
    await c.awaitBooking(signal);
  } finally {
    delivery.hold = false;
  }
  assertLive(signal);
  const result = c.getSession(),
    detail = c.getState().bookingDetail;
  check(
    "BOOK-10",
    !!detail &&
      result.bookings.filter((b) => b.requestKey === flow.fixedKey).length ===
        1 &&
      result.bookings.length === before.count + (existing ? 0 : 1) &&
      result.credit.available === before.credit - (existing ? 0 : 57600) &&
      JSON.stringify(result.draft) === before.draft,
    "Exactly one scripted booking exists. Credit changed once; the attendee’s original draft was preserved.",
  );
  patch({ bookingView: "confirmation" });
  await buildPiece(
    ".booking-confirmation",
    {
      id: "confirmation",
      label: "Saved booking confirmation",
      selector: '[data-booking="confirmation"]',
    },
    signal,
  );
  await say("nour", "That’s a booking.", signal, 1.1);
  await say("priya", "Saved once. Credit deducted once.", signal, 1.5);
  p.append(
    "booking-sami",
    "Saved transaction",
    `GC-${detail.id.slice(0, 8).toUpperCase()} · ${money(detail.total)}. Request ${detail.requestKey}. Existing visitor draft retained.`,
  );
  if (c.getState().built.includes("financials")) {
    await say(
      "nour",
      "That booking updated our credit. Let’s check the financial view we already built.",
      signal,
      3,
    );
    c.navigate("financials");
    await clock.wait(0.15, signal);
    await buildPiece(
      ".financial-stage",
      {
        id: "booking-credit",
        label: "Saved charge and current credit",
        selector: '[data-financial="credit"], [data-financial="history"]',
      },
      signal,
    );
    await inspectModule(
      "priya",
      '[data-financial="credit"]',
      "credit reconciliation",
      signal,
    );
    if (
      !q('[data-financial="credit"]').textContent.includes(
        money(result.credit.available),
      )
    )
      throw Error("Financial credit did not update after booking.");
    await say("priya", "Reconciled. One charge.", signal, 1.5);
    patch({ page: "confirmation" });
    await clock.wait(0.15, signal);
  }
  if (c.getState().built.includes("bookings")) {
    await say(
      "sami",
      "Connecting this confirmation to the booking workspace we already built.",
      signal,
      2.7,
    );
    const link = [
      ...document.querySelectorAll(".booking-confirmation button"),
    ].find((el) => el.textContent.trim() === "View booking");
    await jumpPress("priya", link, signal);
    c.assertLive(signal);
    patch({ page: "confirmation" });
    await clock.wait(0.15, signal);
  }
  if (c.getState().built.includes("dashboard")) {
    c.setConfirmationProp(detail);
    await c.passBrief(signal, "nour", "sami");
    c.clearBrief();
    await say("sami", "This belongs on the dashboard.", signal, 1.5);
    await press(".sidebar button:first-child");
    await buildPiece(
      ".dashboard-stage",
      {
        id: "dashboard-link",
        label: "Saved booking and live credit",
        selector:
          '[data-dashboard="metrics"], [data-dashboard="services"], [data-dashboard="notifications"]',
        primary: '[data-dashboard="metrics"]',
      },
      signal,
    );
    await inspectModule(
      "priya",
      '[data-dashboard="metrics"]',
      "booking reconciliation",
      signal,
    );
    check(
      "BOOK-11",
      q('[data-dashboard="metrics"]').textContent.includes(
        money(result.credit.available),
      ) &&
        q('[data-dashboard="services"]').textContent.includes(
          `GC-${detail.id.slice(0, 8).toUpperCase()}`,
        ),
      "Dashboard contains the actual saved reference and backend available credit. No second booking was submitted.",
    );
    await say(
      "nour",
      "One booking. The whole workspace stays in sync.",
      signal,
      1.9,
    );
    await say("priya", "Reconciled.", signal, 1);
  } else
    p.append(
      "booking-priya",
      "Dashboard connection deferred",
      "Dashboard is not yet built. Its connection check remains Not run; the saved booking will be available to its scene.",
    );
  patch({ phase: "Review", checks: 0 });
  await Promise.all(
    c.owners.map((o) => act(o.id, "inspect", signal, { duration: 0.8 })),
  );
  await say("ellie", "Matches the journey.", signal, 1.2);
  patch({ checks: 1 });
  await say("priya", "Validation, totals and saved data checked.", signal, 1.8);
  patch({ checks: 2 });
  await say("nour", "Ready for the travel desk.", signal, 1.4);
  patch({ checks: 3 });
  delivery.hold = true;
  try {
    await c.completeFeature("booking", signal);
  } finally {
    delivery.hold = false;
  }
  assertLive(signal);
  patch({
    built: [...new Set([...c.getState().built, "booking"])],
    bookingComplete: true,
    board: false,
    missingTotals: false,
    missingTicks: false,
    phase: "Deliver",
  });
  delivery.estimateRemaining(2);
  await Promise.all(c.owners.map((o, i) => c.walk(o.id, c.mark(i), signal)));
  delivery.finish();
  for (const id of ["nour", "ellie", "omar"]) status(id, "Approved · released");
  status(
    "priya",
    "Scene checks passed · additional regression/manual coverage recorded separately",
  );
  status("sami", "Shipped");
  p.append(
    "booking-sami",
    "This release run",
    `Completed in ${delivery.elapsed.toFixed(1)} seconds of active scene time. Reading and save pauses excluded. No wait for unused countdown time. Two findings resolved. No project budget has been supplied.`,
  );
  await say("sami", "New Booking shipped.", signal, 1.2);
  await Promise.all(
    c.owners.map((o) => act(o.id, "celebrate", signal, { duration: 1.1 })),
  );
  c.prepareFreshBooking();
  await press(".topbar .header-actions > .button");
  patch({ ready: true, bookingStage: false, jobs: {} });
  check(
    "BOOK-12",
    c.getState().page === "booking" &&
      c.getState().bookingDraft.step === 0 &&
      !c.getState().bookingDraft.services.length &&
      c.getSession().bookings.some((b) => b.id === detail.id),
    "Fresh editable Journey form handed back; the demonstrated booking remains saved.",
  );
  bots.nour.say("Your turn. Plan a journey—or use sample data to try it.");
}
