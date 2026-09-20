import { money } from "../../shared/product.js";
import {
  financialValues,
  financialNarrative,
} from "../../shared/financials.js";
import { businessSnapshot } from "./dashboard.js";
import { ReviewQueue } from "./staging.js";
export async function runFinancials(c, signal) {
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
  } = c;
  const source = await c.loadSession(signal),
    baseline = businessSnapshot(source),
    v = financialValues(source),
    narrative = financialNarrative(source, c.getState().built);
  const q = (s) => document.querySelector(s),
    wait = (n = 0.15) => clock.wait(n, signal);
  const pub = (id, status) => {
    p.publish(`financials-${id}`, status);
    p.append(
      `financials-${id}`,
      "Run context",
      `${narrative.mode}: ${v.events.length} saved transactions, ${v.active} active bookings. Net ${money(v.net)}, available ${money(source.credit.available)}. No ledger writes in this scene.`,
    );
  };
  const check = (id, ok, detail) => {
    c.assertLive(signal);
    p.evidence("financials-priya", id, !!ok, detail);
    if (!ok) throw Error(`Financial acceptance failed: ${id}`);
  };
  const build = (id, label, selector = `[data-financial="${id}"]`) =>
    buildPiece(".financial-stage", { id, label, selector }, signal);
  const inspect = (id, part) =>
    inspectModule(
      id,
      `.financial-stage [data-financial="${part}"]`,
      part,
      signal,
    );
  patch({
    feature: "financials",
    page: "empty",
    ready: false,
    phase: "Requirements",
    timer: true,
    brief: true,
    board: false,
    financialComplete: false,
    axisFault: true,
    checks: 0,
  });
  delivery.start(120);
  pub("nour", "Requirements drafted");
  pub("sami", "Release in progress");
  c.setBrief("financials-nour");
  await say("nour", narrative.opening, signal, 3);
  await say("sami", "How much new machinery?", signal, 1.4);
  await say("omar", "Same ledger. Clearer view.", signal, 1.5);
  await say("sami", "I like that estimate.", signal, 1.5);
  if (!c.getState().entered) {
    await jumpPress("priya", q(".opening-login button[type=button]"), signal);
    await jumpPress("priya", q(".opening-login button[type=submit]"), signal);
  }
  patch({ shell: true, login: false, entered: true });
  await c.passBrief(signal);
  await say(
    "nour",
    "Show the balance, explain every movement, and make the services easy to compare.",
    signal,
    3,
  );
  pub("ellie", "Design prepared");
  patch({ phase: "Design", brief: false, board: true });
  await say(
    "ellie",
    "Credit first. Then the trend, service insights and the transaction trail.",
    signal,
    2.6,
  );
  c.setBrief("financials-ellie");
  await c.passBrief(signal, "ellie", "omar");
  c.clearBrief();
  await c.disperse(signal);
  pub("omar", "Implementation in progress");
  pub("priya", "Testing in progress");
  patch({ page: "financials", phase: "Build" });
  await wait();
  await build(
    "credit",
    "Credit facility and overview",
    '[data-financial="heading"], [data-financial="credit"], [data-financial="metrics"]',
  );
  const qa = new ReviewQueue();
  qa.add(async () => {
    await inspect("priya", "credit");
    const shown = [
      ...document.querySelectorAll('[data-financial="credit"] .metric strong'),
    ].map((e) => e.textContent);
    const text = q('[data-financial="credit"]').textContent;
    check(
      "FIN-01",
      v.reconciled &&
        [
          source.credit.limit,
          source.credit.used,
          source.credit.available,
        ].every((n) => text.includes(money(n))),
      "Rendered facility values match the backend; limit minus usage equals available credit.",
    );
    await say("priya", narrative.inspection, signal, 2.7);
  });
  await build("trend", "Transaction-based trend");
  await build("insights", "Active-service insights");
  await inspect("ellie", "trend");
  check(
    "FIN-02",
    [...document.querySelectorAll("[data-financial-axis]")].every((el) =>
      el.textContent.includes("USD"),
    ),
    "Observed the deliberately incorrect display-only currency labels. Stored amounts remain AED.",
  );
  p.append(
    "financials-ellie",
    "DESIGN-01 · Found",
    "Chart labels show USD although the facility and all stored values are AED. This is a formatting-only scene defect, with no currency conversion or ledger change.",
  );
  await say("ellie", "That axis is dollars.", signal, 1.5);
  bots.omar.setExpression("angry");
  await say("omar", "…Fine.", signal, 1);
  await build("axis-repair", "AED chart labels", '[data-financial="trend"]');
  patch({ axisFault: false });
  await wait();
  check(
    "FIN-03",
    [...document.querySelectorAll("[data-financial-axis]")].every(
      (el) => el.textContent.includes("AED") && !el.textContent.includes("USD"),
    ),
    "Both chart labels now use AED.",
  );
  p.append(
    "financials-ellie",
    "DESIGN-01 · Resolved",
    "Observed AED on both labels; the transaction values are unchanged.",
  );
  await build("history", "Transaction history and charge/return totals");
  await qa.drain();
  delivery.estimateRemaining(35);
  await inspect("priya", "history");
  check(
    "FIN-04",
    document.querySelectorAll("[data-transaction]").length ===
      v.events.length && v.charges - v.returns === source.credit.used,
    "All saved transactions are represented; charges minus returns reconcile with credit used.",
  );
  await inspect("priya", "trend");
  check(
    "FIN-05",
    v.values.at(-1) === source.credit.used &&
      (!v.events.length
        ? q('[data-financial="trend"] polyline').getAttribute("points") ===
          "40,220 600,220"
        : q('[data-financial="trend"]').textContent.includes(money(v.net))),
    "Trend ends at actual credit usage; a fresh session is flat at zero.",
  );
  check(
    "FIN-06",
    document.querySelectorAll('[data-financial="insights"] .notification')
      .length === v.popular.length,
    "Service insights use current active selections and exclude cancelled bookings.",
  );
  await say("priya", "Nothing new.", signal, 1.1);
  await say("omar", "Nothing new?", signal, 1.1);
  await say("priya", "No new findings. The numbers reconcile.", signal, 1.9);
  patch({ financialNav: true, financialComplete: true });
  await wait();
  await buildPiece(
    ".opening-shell",
    {
      id: "financial-nav",
      label: "Financials navigation",
      selector: '.sidebar nav button[data-page="financials"]',
    },
    signal,
    0,
    "sami",
  );
  await jumpPress(
    "priya",
    q('.sidebar nav button[data-page="financials"]'),
    signal,
  );
  check(
    "FIN-07",
    c.getState().page === "financials" &&
      !!q('.sidebar [data-page="financials"][aria-current="page"]'),
    "The real Financials navigation works.",
  );
  if (v.events.length && c.getState().built.includes("bookings")) {
    await say("sami", "Every movement leads back to its booking.", signal, 2);
    await jumpPress("priya", q("[data-transaction] button"), signal);
    check(
      "FIN-08",
      c.getState().page === "bookings" &&
        c.management.state.selected?.id === v.events.at(-1).bookingId,
      "Transaction link opens the saved booking, without another charge.",
    );
    await jumpPress("priya", q('.sidebar [data-page="financials"]'), signal);
  } else {
    check(
      "FIN-08",
      [...document.querySelectorAll("[data-transaction] button")].every(
        (el) => el.disabled,
      ),
      "No link opens an unbuilt booking-management feature.",
    );
  }
  const fresh = await c.loadSession(signal);
  check(
    "FIN-09",
    businessSnapshot(fresh) === baseline,
    "Bookings, drafts and credit are unchanged by construction and review.",
  );
  patch({ phase: "Review", board: false, checks: 0 });
  await Promise.all(
    c.owners.map((o) => act(o.id, "inspect", signal, { duration: 0.8 })),
  );
  await say("ellie", "Clear, consistent, and in AED.", signal, 1.7);
  patch({ checks: 1 });
  await say("priya", "Balance, history and services checked.", signal, 1.8);
  patch({ checks: 2 });
  await say(
    "nour",
    ["dashboard", "booking", "bookings"].every((id) =>
      c.getState().built.includes(id),
    )
      ? "That’s the platform. The numbers match."
      : "The numbers match. Ready for what we build next.",
    signal,
    2,
  );
  patch({ checks: 3 });
  delivery.hold = true;
  try {
    await c.completeFeature("financials", signal);
  } finally {
    delivery.hold = false;
  }
  c.assertLive(signal);
  patch({
    financialComplete: true,
    axisFault: false,
    built: [...new Set([...c.getState().built, "financials"])],
    page: "financials",
  });
  await Promise.all(c.owners.map((o, i) => c.walk(o.id, c.mark(i), signal)));
  delivery.finish();
  patch({ phase: "Deliver" });
  for (const owner of c.owners)
    p.status(
      `financials-${owner.id}`,
      owner.id === "priya"
        ? "Scene checks passed · manual accessibility pending"
        : "Approved · released",
    );
  p.append(
    "financials-sami",
    "This release",
    `Completed in ${delivery.elapsed.toFixed(1)} active seconds. Currency finding resolved; no ledger writes or countdown wait. No approved development budget supplied.`,
  );
  await say("sami", "Financials shipped.", signal, 1.3);
  await Promise.all(
    c.owners.map(async (o) => {
      if (o.id === "priya") await wait(0.25);
      await act(o.id, "celebrate", signal, { duration: 1.1 });
    }),
  );
  patch({ ready: true, jobs: {} });
  bots.nour.say(narrative.handback);
}
