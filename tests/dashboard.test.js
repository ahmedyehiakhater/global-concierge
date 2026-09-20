import test from "node:test";
import assert from "node:assert/strict";
import {
  featureAvailable,
  dashboardValues,
  routeFeature,
} from "../shared/features.js";
import {
  businessSnapshot,
  DASHBOARD_GROUPS,
} from "../src/opening/dashboard.js";
import { ArtifactProduction } from "../src/artifacts/production.js";
import { DeliveryTimer } from "../src/opening/delivery.js";

test("dashboard reads the live ledger and discounts without inventing opening usage or mutating data", () => {
  const session = {
    bookings: [],
    draft: null,
    credit: { available: 10000000 },
  };
  assert.deepEqual(dashboardValues(session), {
    bookings: 0,
    savings: 0,
    credit: 10000000,
  });
  session.bookings = [{ discount: 6400, total: 57600 }];
  session.credit.available -= 57600;
  const before = businessSnapshot(session);
  assert.deepEqual(dashboardValues(session), {
    bookings: 1,
    savings: 6400,
    credit: 9942400,
  });
  session.features = ["workspace", "dashboard"];
  assert.equal(businessSnapshot(session), before);
});
test("feature gates preserve standalone behaviour and restrict unreleased routes in staged mode", () => {
  assert.equal(featureAvailable(undefined, "booking"), true);
  assert.equal(featureAvailable(["workspace"], "dashboard"), false);
  assert.equal(featureAvailable(["workspace", "dashboard"], "booking"), false);
  assert.equal(
    featureAvailable(["workspace", "dashboard", "booking"], "booking"),
    true,
  );
  assert.equal(routeFeature("detail"), "bookings");
});
test("dashboard publishes append-only feature work and retains findings and opening artefacts", () => {
  const p = new ArtifactProduction();
  p.publish("master-nour");
  p.publish("gate-nour", "Released");
  p.publish("dashboard-nour", "Draft");
  assert.equal(p.forOwner("nour").length, 3);
  assert.equal(p.forOwner("priya").length, 0);
  p.publish("dashboard-priya", "Testing");
  p.append("dashboard-priya", "QA-01 Found", "Blank services panel");
  p.append("dashboard-priya", "QA-01 Resolved", "Empty state now visible");
  p.evidence("dashboard-priya", "DASH-03", false, "Before repair");
  p.evidence("dashboard-priya", "DASH-03", true, "After repair");
  const doc = p.forOwner("priya")[0];
  assert.equal(doc.tests.find((t) => t.id === "DASH-03").history.length, 2);
  assert.equal(doc.tests.at(-1).result, undefined);
  assert.equal(
    doc.sections.filter((s) => s.title.startsWith("QA-01")).length,
    2,
  );
  assert.equal(p.forOwner("nour")[1].status, "Released");
});
test("a new feature restarts the counter and early completion never waits for the estimate", () => {
  const t = new DeliveryTimer(100);
  t.start();
  t.tick(83);
  t.finish();
  t.start(75);
  assert.equal(t.shipped, false);
  assert.equal(t.elapsed, 0);
  assert.equal(t.remaining, 75);
  t.tick(30);
  t.finish();
  assert.equal(t.remaining, 0);
  assert.equal(t.elapsed, 30);
  assert.equal(DASHBOARD_GROUPS.length, 4);
});
