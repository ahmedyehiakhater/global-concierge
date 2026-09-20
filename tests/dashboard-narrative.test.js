import test from "node:test";
import assert from "node:assert/strict";
import { dashboardNarrative } from "../src/opening/dashboardNarrative.js";

test("Dashboard first keeps the truthful empty-account script", () => {
  const n = dashboardNarrative({ bookings: [] }, ["workspace"]);
  assert.equal(n.mode, "dashboard-first");
  assert.equal(n.qaIntro, null);
  assert.equal(n.defence, "There are no bookings.");
});
test("Booking released without transactions does not invent a booking", () => {
  const n = dashboardNarrative({ bookings: [] }, ["workspace", "booking"]);
  assert.equal(n.mode, "booking-ready");
  assert.match(n.design, /No confirmed bookings yet/);
  assert.match(n.handback, /flow we built/);
});
test("Saved bookings select a preview-only finding and acknowledge the existing ledger", () => {
  const session = { bookings: [{ id: "one" }, { id: "two" }] };
  const before = JSON.stringify(session);
  const n = dashboardNarrative(session, ["workspace", "booking"]);
  assert.equal(n.mode, "saved-bookings");
  assert.match(n.context, /2 saved booking/);
  assert.match(n.qaIntro, /test preview/);
  assert.match(n.defence, /still saved/);
  assert.match(n.restored, /credit is unchanged/);
  assert.match(n.handback, /already made/);
  assert.doesNotMatch(
    Object.values(n).join(" "),
    /There are no bookings|Zero bookings/,
  );
  assert.equal(JSON.stringify(session), before);
});
test("Persisted records, not only feature flags, determine populated dialogue", () => {
  assert.equal(
    dashboardNarrative({ bookings: [{ id: "one" }] }, ["workspace"]).mode,
    "saved-bookings",
  );
});
