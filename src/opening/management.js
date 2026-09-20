import { sampleDraft, quote, money } from "../../shared/product.js";
import { reference } from "../../shared/management.js";
import { businessSnapshot } from "./dashboard.js";
import { ReviewQueue } from "./staging.js";
export async function runManagement(c, signal) {
  const {
    patch,
    say,
    act,
    clock,
    production: p,
    delivery,
    buildPiece,
    inspectModule,
    jumpPress,
    bots,
    management: m,
  } = c;
  const source = await c.loadSession(signal),
    baseline = businessSnapshot(source);
  const saved = source.bookings.find(
    (b) => b.status !== "cancelled" && b.legs?.length,
  );
  const seed = sampleDraft(1, 2);
  const example = saved || {
    ...seed,
    ...quote(seed.services, seed.adults),
    id: "qa-example",
    qaFixture: true,
    version: 1,
    status: "confirmed",
    created: new Date().toISOString(),
    history: [],
  };
  const wait = (n = 0.15) => clock.wait(n, signal);
  const pub = (owner, status) => {
    p.publish(`bookings-${owner}`, status);
    p.append(
      `bookings-${owner}`,
      "Run context",
      `${source.bookings.length} saved records. ${saved ? "QA uses a presentation copy of " + reference(saved) : "QA uses a temporary labelled example"}. Ledger unchanged by the scripted tests.`,
    );
  };
  const check = (id, ok, detail) => {
    c.assertLive(signal);
    p.evidence("bookings-priya", id, !!ok, detail);
    if (!ok) throw Error(`Management acceptance failed: ${id}`);
  };
  const q = (s) => document.querySelector(s);
  const target = (s) => `.manage-stage ${s}`;
  const build = (id, label, selector, builder = "omar") =>
    buildPiece(".manage-stage", { id, label, selector }, signal, 0, builder);
  const press = async (label) => {
    const el = [...document.querySelectorAll(".manage-stage button")].find(
      (e) => e.textContent.trim() === label,
    );
    if (!el) throw Error(`Missing management control: ${label}`);
    await jumpPress("priya", el, signal);
    while (m.state.busy) await wait();
    if (m.state.error) throw Error(m.state.error);
  };
  const inspect = (who, part) =>
    inspectModule(who, target(`[data-manage="${part}"]`), part, signal);
  m.begin(source);
  patch({
    feature: "bookings",
    page: "empty",
    ready: false,
    phase: "Requirements",
    timer: true,
    brief: true,
    board: false,
    manageComplete: false,
    statusFault: true,
    unsafeCancel: false,
    managePreview: false,
  });
  delivery.start(210);
  pub("nour", "Requirements drafted");
  pub("sami", "Release in progress");
  c.setBrief("bookings-nour");
  await say(
    "nour",
    source.bookings.length
      ? "We’ve made bookings. Now let’s give the travel desk control over them."
      : c.getState().built.includes("booking")
        ? "Our booking flow is ready. Let’s build the place to manage reservations."
        : "Let’s build the workspace for managing reservations. Booking creation can follow.",
    signal,
    3.2,
  );
  if (!c.getState().entered) {
    await jumpPress("priya", q(".opening-login button[type=button]"), signal);
    await jumpPress("priya", q(".opening-login button[type=submit]"), signal);
  }
  patch({ shell: true, login: false, entered: true });
  await c.passBrief(signal);
  await say(
    "nour",
    "Find the booking. Review every change before committing.",
    signal,
    2.3,
  );
  pub("ellie", "Design prepared");
  patch({ phase: "Design", brief: false, board: true });
  await say(
    "ellie",
    "List, details, changes and cancellation. Every action needs a clear outcome.",
    signal,
    3,
  );
  await say("sami", "And no surprises on the credit balance.", signal, 1.8);
  await say("omar", "Especially that kind.", signal, 1.2);
  c.setBrief("bookings-ellie");
  await c.passBrief(signal, "ellie", "omar");
  c.clearBrief();
  await c.disperse(signal);
  pub("omar", "Implementation in progress");
  pub("priya", "Testing in progress");
  patch({ page: "bookings", phase: "Build" });
  await wait();
  await build(
    "list",
    "Booking list, search and status filters",
    '[data-manage="list"]',
  );
  check(
    "MAN-01",
    source.bookings.length
      ? q(".manage-stage").textContent.includes(reference(source.bookings[0]))
      : q(".manage-stage").textContent.includes("Your bookings start here"),
    "The initial list reflects the saved session, including a deliberate empty state when needed.",
  );
  await say(
    "priya",
    saved
      ? "I’ll test a preview of our saved booking. The real record stays safe."
      : "No saved booking yet. I’m adding a labelled QA example, just for this test.",
    signal,
    3,
  );
  m.begin(source, structuredClone(example));
  patch({ managePreview: true });
  await wait();
  const input = q(".manage-stage input");
  input.focus();
  for (let i = 1; i <= reference(example).length; i++) {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(input, reference(example).slice(0, i));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(0.06);
  }
  await wait(1);
  check(
    "MAN-02",
    q(".manage-stage").textContent.includes("1 bookings found"),
    "Search finds the exact preview reference.",
  );
  await press("View booking");
  await build(
    "details",
    "Journey, travellers, services and price breakdown",
    '[data-manage="details"], [data-manage="history"]',
  );
  const reviews = new ReviewQueue();
  reviews.add(() => inspect("ellie", "details"));
  await build("actions", "Management actions", '[data-manage="actions"]');
  await reviews.drain();
  await say(
    "ellie",
    "Confirmed and cancelled need to look different at a glance.",
    signal,
    2.5,
  );
  // A labelled design comparison avoids inventing a cancelled ledger record.
  patch({ statusComparison: true });
  await wait();
  await say("omar", "The labels are different.", signal, 1.5);
  await say("ellie", "Make the difference obvious.", signal, 1.5);
  p.append(
    "bookings-ellie",
    "DESIGN-01 · Found",
    "Status comparison lacks a distinct cancelled treatment. No booking status is changed.",
  );
  await build(
    "status",
    "Distinct confirmed and cancelled status treatments",
    '[data-manage="comparison"]',
  );
  patch({ statusFault: false });
  await wait();
  check(
    "MAN-03",
    !c.getState().statusFault,
    "Cancelled status has distinct text and visual treatment.",
  );
  p.append(
    "bookings-ellie",
    "DESIGN-01 · Resolved",
    "Distinct labelled status treatments restored.",
  );
  patch({ statusComparison: false });
  await press("Modify booking");
  await build("edit", "Complete modification form", '[data-manage="edit"]');
  await say("priya", "Changing a service. Show me what changes.", signal, 2);
  const option = [
    ...document.querySelectorAll(".manage-stage [data-manage-service]"),
  ].find((el) => !el.checked);
  const selectedOption =
    option ||
    document.querySelector(".manage-stage [data-manage-service]:checked");
  if (!selectedOption) throw Error("The QA example needs a service.");
  await jumpPress("priya", selectedOption, signal);
  await press("Review changes");
  await build(
    "review",
    "Change review and credit difference",
    '[data-manage="review"]',
  );
  check(
    "MAN-04",
    m.state.quote.difference !== 0 &&
      m.state.quote.availableAfter ===
        m.session.credit.available - m.state.quote.difference,
    "Server-equivalent preview shows the extra credit and resulting balance before approval.",
  );
  await say("nour", "The extra cost—and the balance afterwards.", signal, 2);
  await say("priya", "Nothing moves until I confirm.", signal, 1.6);
  await press("Discard changes");
  await build(
    "details-return",
    "Original booking and management controls",
    '[data-manage="details"], [data-manage="actions"], [data-manage="history"]',
  );
  check(
    "MAN-05",
    m.state.selected.total === example.total && !m.state.draft,
    "Discarding the draft retains the original price and services.",
  );
  patch({ unsafeCancel: true });
  await say(
    "priya",
    "Testing cancellation on a preview. The saved booking stays safe.",
    signal,
    2.7,
  );
  await press("Cancel booking");
  check(
    "MAN-06",
    m.state.hidden,
    "The deliberate visual defect hides the preview without a cancellation request.",
  );
  await Promise.all(
    ["nour", "omar", "sami"].map((id) =>
      act(id, "react", signal, { duration: 0.7 }),
    ),
  );
  await say("nour", "That disappeared before we agreed.", signal, 1.8);
  await say("priya", "One click. No warning.", signal, 1.5);
  await say("omar", "It cancelled.", signal, 1);
  await say("priya", "That’s the problem.", signal, 1.2);
  bots.omar.setExpression("angry");
  p.append(
    "bookings-priya",
    "QA-01 · Found",
    "The preview disappeared without confirmation. No API mutation was made.",
  );
  await say("sami", "Put the decision back in the user’s hands.", signal, 2);
  m.emit({ hidden: false });
  await build("restore", "Restore preview booking", '[data-manage="details"]');
  patch({ unsafeCancel: false });
  await press("Cancel booking");
  await build(
    "cancel",
    "Cancellation decision and credit return",
    '[data-manage="cancel"]',
  );
  await say("omar", "Now it asks.", signal, 1.1);
  await say("priya", "And tells me what happens.", signal, 1.5);
  check(
    "MAN-07",
    m.state.view === "cancel" &&
      q(".manage-stage").textContent.includes(money(example.total)),
    "Cancellation displays the exact current charge to return and retains a Keep booking option.",
  );
  await press("Keep booking");
  await build(
    "kept",
    "Booking retained after cancellation review",
    '[data-manage="details"], [data-manage="actions"], [data-manage="history"]',
  );
  check(
    "MAN-08",
    !m.state.hidden && m.state.selected.id === example.id,
    "Keep booking returns to the same record.",
  );
  p.append(
    "bookings-priya",
    "QA-01 · Resolved",
    "Confirmation and credit-return summary inspected; Keep booking leaves the record unchanged.",
  );
  await say("priya", "Booking retained. Credit unchanged.", signal, 1.8);
  const fresh = await c.loadSession(signal);
  check(
    "MAN-09",
    businessSnapshot(fresh) === baseline,
    "Saved bookings, draft and credit are unchanged by the complete QA rehearsal.",
  );
  m.begin(fresh);
  patch({
    managePreview: false,
    manageComplete: true,
    manageNav: true,
    phase: "Build",
    board: false,
  });
  await wait();
  await buildPiece(
    ".opening-shell",
    {
      id: "manage-nav",
      label: "Bookings navigation",
      selector: '.sidebar nav button[data-page="bookings"]',
    },
    signal,
    0,
    "sami",
  );
  patch({ manageNav: true });
  await wait();
  await jumpPress(
    "priya",
    q('.sidebar nav button[data-page="bookings"]'),
    signal,
  );
  if (c.getState().built.includes("dashboard")) {
    await say(
      "sami",
      "Connecting the Dashboard to these saved booking details.",
      signal,
      2.3,
    );
    patch({ page: "dashboard", manageNav: true });
    await wait();
    await buildPiece(
      ".dashboard-stage",
      {
        id: "manage-link",
        label: "Dashboard booking links",
        selector: '[data-dashboard="services"]',
      },
      signal,
      0,
      "sami",
    );
    await jumpPress("priya", q('[data-dashboard="services"] button'), signal);
  }
  check(
    "MAN-10",
    c.getState().page === "bookings" && !c.getState().managePreview,
    "Real list restored, navigation connected, and QA example removed.",
  );
  if (c.getState().built.includes("financials")) {
    await say(
      "sami",
      "Changes and credit returns will appear in the Financials view we already built.",
      signal,
      3,
    );
    c.navigate("financials");
    await wait();
    await buildPiece(
      ".financial-stage",
      {
        id: "manage-finance-link",
        label: "Booking history connection",
        selector: '[data-financial="history"]',
      },
      signal,
      0,
      "sami",
    );
    c.openManagement();
    await wait();
  }
  patch({ phase: "Review", checks: 0 });
  await Promise.all(
    c.owners.map((o) => act(o.id, "inspect", signal, { duration: 0.8 })),
  );
  await say("ellie", "The states and actions are clear.", signal, 1.8);
  patch({ checks: 1 });
  await say(
    "priya",
    "Changes are reviewed. Cancellation asks. Saved data is intact.",
    signal,
    2.7,
  );
  patch({ checks: 2 });
  await say("nour", "The travel desk is in control.", signal, 1.7);
  patch({ checks: 3 });
  delivery.hold = true;
  try {
    await c.completeFeature("bookings", signal);
  } finally {
    delivery.hold = false;
  }
  c.assertLive(signal);
  patch({ built: [...new Set([...c.getState().built, "bookings"])] });
  await Promise.all(c.owners.map((o, i) => c.walk(o.id, c.mark(i), signal)));
  delivery.finish();
  patch({ phase: "Deliver" });
  for (const owner of c.owners)
    p.status(
      `bookings-${owner.id}`,
      owner.id === "priya"
        ? "Scene checks passed · backend regression tested separately"
        : "Approved · released",
    );
  p.append(
    "bookings-sami",
    "This release",
    `Completed in ${delivery.elapsed.toFixed(1)} active seconds. No countdown wait. No business-data mutations in the scripted review. No approved budget supplied.`,
  );
  await say("sami", "Bookings management shipped.", signal, 1.5);
  await Promise.all(
    c.owners.map((o) => act(o.id, "celebrate", signal, { duration: 1.1 })),
  );
  patch({ ready: true, page: "bookings", jobs: {} });
  bots.nour.say(
    source.bookings.length
      ? "Your bookings are ready to manage. Choose a record to try it."
      : "Your bookings workspace is ready. Build New Booking when you want to create a reservation.",
  );
}
