import { dashboardNarrative } from "./dashboardNarrative.js";
import { ReviewQueue } from "./staging.js";
import { dashboardValues } from "../../shared/features.js";
import { money } from "../../shared/product.js";

export const DASHBOARD_GROUPS = [
  {
    id: "welcome",
    label: "Welcome panel",
    selector: '[data-dashboard="welcome"], [data-dashboard="draft"]',
    primary: '[data-dashboard="welcome"]',
  },
  {
    id: "metrics",
    label: "Overview metrics",
    selector: '[data-dashboard="metrics"]',
  },
  {
    id: "services",
    label: "Active services",
    selector: '[data-dashboard="services"]',
  },
  {
    id: "notifications",
    label: "Notifications",
    selector: '[data-dashboard="notifications"]',
  },
];
export const businessSnapshot = (s) =>
  JSON.stringify({ bookings: s.bookings, draft: s.draft, credit: s.credit });

// Product-specific choreography; all motion still uses the shared scene vocabulary.
export async function runDashboard(c, signal) {
  const {
    patch,
    say,
    act,
    walk,
    clock,
    production: p,
    delivery,
    bots,
    buildPiece,
    inspectModule,
    passBrief,
    disperse,
    jumpPress,
    assertLive,
    mark,
    owners,
    job,
  } = c;
  const wait = (t = 0.1) => clock.wait(t, signal);
  const inspect = (id, group) =>
    inspectModule(id, `[data-dashboard="${group}"]`, group, signal);
  const publish = (id, status) => {
    p.publish(`dashboard-${id}`, status);
    p.append(
      `dashboard-${id}`,
      "Build-order context for this run",
      narrative.context,
    );
  };
  const status = (id, text) => p.status(`dashboard-${id}`, text);
  const check = (id, ok, detail) => {
    assertLive(signal);
    p.evidence("dashboard-priya", id, !!ok, detail);
    if (!ok) throw new Error(`Dashboard acceptance check failed: ${id}`);
  };
  const finding = (id, title, body) => p.append(`dashboard-${id}`, title, body);
  const query = (s) => document.querySelector(s);
  const source = await c.loadSession(signal);
  const baseline = businessSnapshot(source);
  const activeBookings = source.bookings.filter(
    (b) => b.status !== "cancelled",
  );
  const narrative = dashboardNarrative(source, c.getState().built);
  delivery.start(75);
  patch({
    ready: false,
    page: "empty",
    feature: "dashboard",
    timer: true,
    phase: "Requirements",
    checks: 0,
    jobs: {},
    error: "",
    brief: true,
    board: false,
  });
  publish("nour", "Requirements drafted");
  publish("sami", "Release in progress");
  p.append(
    "dashboard-sami",
    "Current release plan",
    "Initial estimate: 75 seconds of active scene time. Remaining time updates at milestones and never delays release. Bookings, draft and credit must remain unchanged.",
  );
  c.setBrief("dashboard-nour");
  await say("nour", narrative.opening, signal, 3);
  await say("sami", "What are we shipping?", signal, 1.3);
  await say("nour", "The Global Concierge dashboard.", signal, 1.6);
  await say("omar", "Four panels. I’m on it.", signal, 1.5);
  if (!c.getState().entered) {
    await jumpPress(
      "priya",
      query(".opening-login button[type=button]"),
      signal,
    );
    await jumpPress(
      "priya",
      query(".opening-login button[type=submit]"),
      signal,
    );
  }
  patch({ shell: true, login: false, entered: true });
  await passBrief(signal);
  await say("nour", narrative.brief, signal, 2.5);
  status("nour", "Approved for design");
  publish("ellie", "Design prepared");
  patch({ phase: "Design", board: true, brief: false });
  await say("ellie", narrative.design, signal, 2.6);
  await act("ellie", "inspect", signal, { duration: 0.8 });
  await say(
    "ellie",
    "Welcome, overview, active services and notifications.",
    signal,
    2.2,
  );
  await say("sami", "Four. Written down.", signal, 1.2);
  c.setBrief("dashboard-ellie");
  await passBrief(signal, "ellie", "omar");
  c.clearBrief();
  await disperse(signal);
  status("ellie", "Handed to engineering");
  publish("omar", "Implementation in progress");
  publish("priya", "Testing in progress");
  delivery.estimateRemaining(48);
  patch({
    dashboard: true,
    missingEmpty: true,
    qaPreview: false,
    alignmentIssue: true,
    phase: "Build",
  });
  await wait();
  const design = new ReviewQueue(),
    qa = new ReviewQueue();
  // Parallel queues touch different bots; dialogue in reviews never commands Omar's motion.
  const conversation = c.quietConversation(signal).then(
    () => null,
    (e) => e,
  );
  await say("omar", "Starting with the welcome.", signal, 1.3);
  await buildPiece(".dashboard-stage", DASHBOARD_GROUPS[0], signal);
  design.add(async () => {
    await inspect("ellie", "welcome");
    assertLive(signal);
    finding(
      "ellie",
      "DESIGN-01 · Found",
      "The welcome panel is offset eight pixels below the approved layout. Shared navigation is unaffected. Correction requested after the current build group.",
    );
    bots.ellie.setExpression("alarmed");
    await say("ellie", "Eight pixels low.", signal, 1.3);
    bots.omar.setExpression("angry");
    await say("omar", "On the list.", signal, 1.1);
  });
  await buildPiece(".dashboard-stage", DASHBOARD_GROUPS[1], signal);
  qa.add(async () => {
    await inspect("priya", "metrics");
    const v = dashboardValues(source);
    const rendered = [
      ...document.querySelectorAll('[data-dashboard="metrics"] strong'),
    ].map((e) => e.textContent);
    check(
      "DASH-01",
      JSON.stringify(rendered) ===
        JSON.stringify([String(v.bookings), money(v.savings), money(v.credit)]),
      `Rendered ${rendered.join("; ")}; matched the saved session.`,
    );
    await say(
      "priya",
      source.bookings.length
        ? "These match the saved bookings and credit balance."
        : "Zero bookings. Zero savings. Full credit facility.",
      signal,
      2,
    );
  });
  await buildPiece(".dashboard-stage", DASHBOARD_GROUPS[2], signal);
  qa.add(async () => {
    if (narrative.populated) {
      await say("priya", narrative.qaIntro, signal, 3);
      patch({ qaPreview: true });
      await wait();
    }
    await inspect("priya", "services");
    const heading = query('[data-dashboard="services"] .empty h2');
    const missing =
      heading && getComputedStyle(heading).visibility === "hidden";
    check(
      "DASH-02",
      missing,
      "Detected the deliberately missing empty-state content; finding QA-01 opened. No saved record was changed.",
    );
    finding(
      "priya",
      "QA-01 · Found",
      "The services container is built but the empty-state title and explanation are invisible. A visitor cannot distinguish no bookings from a broken panel. For a populated session this is a labelled QA-only preview.",
    );
    bots.priya.setExpression("alarmed");
    await say(
      "priya",
      narrative.finding,
      signal,
      narrative.populated ? 2.3 : 1.4,
    );
    await say(
      "omar",
      narrative.defence,
      signal,
      narrative.populated ? 2.5 : 1.4,
    );
    bots.omar.setExpression("angry");
    await say(
      "priya",
      narrative.challenge,
      signal,
      narrative.populated ? 3.2 : 1.5,
    );
    await say(
      "sami",
      "Finish this panel. Then close the findings.",
      signal,
      1.8,
    );
    await say(
      "nour",
      narrative.product,
      signal,
      narrative.populated ? 2.5 : 1.8,
    );
  });
  await buildPiece(".dashboard-stage", DASHBOARD_GROUPS[3], signal);
  design.add(async () => {
    await inspect("ellie", "notifications");
    const el = query('[data-dashboard="notifications"]');
    const ok = source.bookings.length
      ? el.querySelectorAll(".notification").length ===
        Math.min(4, source.bookings.length)
      : el.textContent.includes("all caught up");
    check(
      "DASH-04",
      ok,
      "Notifications use the saved booking collection; no illustrative activity was inserted.",
    );
  });
  await Promise.all([design.drain(), qa.drain()]);
  const conversationError = await conversation;
  if (conversationError) throw conversationError;
  delivery.estimateRemaining(20);
  await buildPiece(".dashboard-stage", DASHBOARD_GROUPS[0], signal);
  patch({ alignmentIssue: false });
  await buildPiece(
    ".dashboard-stage",
    {
      id: "empty-repair",
      label: "Helpful empty state",
      selector: '[data-dashboard="services"] .empty',
    },
    signal,
  );
  patch({ missingEmpty: false });
  await wait();
  await say("omar", "Fine. Now it says it.", signal, 1.3);
  await Promise.all([
    inspect("ellie", "welcome"),
    inspect("priya", "services"),
  ]);
  finding(
    "ellie",
    "DESIGN-01 · Resolved",
    "Retest: the welcome panel is back on the approved alignment; the eight-pixel scene offset is removed.",
  );
  finding(
    "priya",
    "QA-01 · Resolved",
    "Retest: No active bookings yet and its explanation are visible. The original finding is retained. The QA preview is now removed and the saved services collection restored.",
  );
  patch({ qaPreview: false, missingEmpty: false, previewFinished: true });
  await wait();
  const services = query('[data-dashboard="services"]');
  check(
    "DASH-03",
    activeBookings.length
      ? services.querySelectorAll(".booking-grid .card").length ===
          Math.min(2, activeBookings.length)
      : services.textContent.includes("No active bookings yet") &&
          getComputedStyle(services.querySelector(".empty h2")).visibility !==
            "hidden",
    "Correct services state visible after repair; live collection restored.",
  );
  await say("ellie", "Alignment approved.", signal, 1.2);
  await say("priya", narrative.restored, signal, narrative.populated ? 3 : 1.5);
  status("ellie", "Design approved · finding resolved");
  status("omar", "Implemented · fixes complete");
  // Sami visibly connects the existing stub. QA then exercises its actual handler.
  await buildPiece(
    ".opening-shell",
    {
      id: "dashboard-wire",
      label: "Dashboard navigation",
      selector: ".sidebar nav button:first-child",
    },
    signal,
    0,
    "sami",
  );
  patch({ dashboardNav: true, page: "empty" });
  await wait();
  await jumpPress("priya", query(".sidebar nav button:first-child"), signal);
  check(
    "DASH-05",
    c.getState().page === "dashboard" &&
      !!query('.sidebar button[aria-current="page"]'),
    "Priya pressed the real Dashboard navigation; handler and active state observed.",
  );
  const gated = [
    ...document.querySelectorAll(
      '.topbar .search input, .topbar .search button, .topbar .header-actions > .button, [data-dashboard="services"] button, [data-dashboard="draft"] button',
    ),
  ];
  check(
    "DASH-06",
    gated.every((el) => {
      const creation =
        el.closest(".header-actions, [data-dashboard=draft]") ||
        el.textContent.includes("Create a booking");
      return (
        el.disabled ===
        !c.getState().built.includes(creation ? "booking" : "bookings")
      );
    }),
    `New Booking and draft resume ${c.getState().built.includes("booking") ? "are enabled because Booking has shipped" : "remain disabled until Booking ships"}. Search and management remain gated by their own releases.`,
  );
  patch({ phase: "Review", checks: 0 });
  await Promise.all(
    owners.map((o) => act(o.id, "inspect", signal, { duration: 0.8 })),
  );
  await say("ellie", "Matches the design.", signal, 1.2);
  patch({ checks: 1 });
  await say("priya", "Checks passed. Findings closed.", signal, 1.5);
  patch({ checks: 2 });
  await say("nour", narrative.approval, signal, 1.6);
  patch({ checks: 3 });
  delivery.hold = true;
  try {
    const fresh = await c.loadSession(signal);
    check(
      "DASH-07",
      businessSnapshot(fresh) === baseline,
      "Bookings, draft and credit unchanged across construction and QA.",
    );
    await c.completeFeature("dashboard", signal);
    check(
      "DASH-07",
      businessSnapshot(c.getSession()) === baseline,
      "Bookings, draft and credit unchanged after feature completion was saved.",
    );
  } finally {
    delivery.hold = false;
  }
  assertLive(signal);
  delivery.estimateRemaining(2);
  await Promise.all(owners.map((o, i) => walk(o.id, mark(i), signal)));
  patch({
    phase: "Deliver",
    board: false,
    ready: true,
    dashboardComplete: true,
    page: "dashboard",
    jobs: {},
    built: [...new Set([...c.getState().built, "dashboard"])],
  });
  delivery.finish();
  await wait();
  check(
    "DASH-08",
    [...document.querySelectorAll(".dashboard-stage [data-dashboard]")].every(
      (el) => getComputedStyle(el).visibility !== "hidden",
    ) &&
      !c.getState().alignmentIssue &&
      !c.getState().qaPreview &&
      !!query(".build-area.live"),
    "All completed containers visible, no QA overrides, interactive Dashboard restored.",
  );
  for (const owner of ["nour", "ellie", "omar"])
    status(owner, "Approved · released");
  status("priya", "Scene checks passed · manual accessibility pending");
  status("sami", "Shipped");
  p.append(
    "dashboard-sami",
    "This release run",
    `Completed in ${delivery.elapsed.toFixed(1)} seconds of active scene time. Document reading and service-save pauses excluded. No countdown wait. Both scripted findings closed; business data preserved. Approved software budget remains unspecified.`,
  );
  await say("sami", "Dashboard shipped.", signal, 1.1);
  await Promise.all(
    owners.map(async (o) => {
      if (o.id === "priya") await wait(0.25);
      await act(o.id, "celebrate", signal, { duration: 1.1 });
    }),
  );
  bots.nour.say(narrative.handback);
}
