import test from "node:test";
import assert from "node:assert/strict";
import { ArtifactProduction } from "../src/artifacts/production.js";
import { DeliveryTimer } from "../src/opening/delivery.js";
import { ARTIFACTS } from "../src/artifacts/catalog.js";
test("product foundation and feature documents publish incrementally, with observed evidence separate from authored cases", () => {
  const storage = new Map();
  storage.setItem = storage.set.bind(storage);
  const p = new ArtifactProduction();
  let changes = 0;
  p.subscribe(() => changes++);
  p.begin("one", storage);
  p.publish("master-nour", "Product direction established");
  assert.equal(p.forOwner("nour").length, 1);
  assert.equal(p.forOwner("priya").length, 0);
  p.publish("gate-nour", "Requirements drafted");
  p.status("gate-nour", "Approved");
  assert.equal(p.forOwner("nour").length, 2);
  assert.equal(p.forOwner("nour")[1].history.length, 2);
  p.publish("gate-priya", "Testing");
  assert.ok(p.forOwner("priya")[0].tests.every((t) => !t.result));
  p.evidence("gate-priya", "LOGIN-01", true, "Observed disabled form");
  assert.equal(p.forOwner("priya")[0].tests[0].result, "Passed");
  assert.ok(
    p
      .forOwner("priya")[0]
      .tests.slice(1)
      .every((t) => !t.result),
  );
  assert.ok(
    ARTIFACTS.find((a) => a.id === "gate-priya").tests.every((t) => !t.result),
    "authored cases remain untouched",
  );
  p.clear();
  assert.equal(p.forOwner("nour").length, 0);
  assert.ok([...storage.keys()].some((k) => k.includes(":archive:")));
  assert.ok(changes > 5);
});
test("delivery countdown pauses, reaches the release moment, and never claims shipping before real completion", () => {
  const t = new DeliveryTimer(3);
  t.start();
  t.tick(1);
  assert.equal(t.remaining, 2);
  t.hold = true;
  t.tick(50);
  assert.equal(t.remaining, 2);
  assert.match(t.label, /Saving/);
  t.hold = false;
  t.tick(2);
  assert.equal(t.remaining, 0);
  assert.equal(t.shipped, false);
  t.finish();
  assert.match(t.label, /Shipped/);
  t.tick(50);
  assert.equal(t.elapsed, 3);
  t.start();
  t.tick(5);
  assert.match(t.label, /Finishing release/);
  assert.equal(t.shipped, false);
  t.reset();
  assert.equal(t.running, false);
});

test("finishing 17 seconds early releases immediately and clears all remaining time", () => {
  const t = new DeliveryTimer(100);
  t.start();
  t.tick(83);
  assert.equal(t.remaining, 17);
  t.finish();
  assert.equal(t.remaining, 0);
  assert.equal(t.elapsed, 83);
  assert.equal(t.label, "Shipped · 00:00");
  t.tick(17);
  assert.equal(t.elapsed, 83);
  t.start();
  t.tick(20);
  t.estimateRemaining(9);
  assert.equal(t.remaining, 9);
  assert.equal(t.elapsed, 20);
  t.reset();
  assert.equal(t.remaining, 100);
});

test("the opening sequence never awaits countdown time and restores login before celebration", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../src/opening/main.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /await\s+clock\.(wait|tween)\(delivery\./);
  const release = source.slice(source.indexOf("  delivery.finish();"), source.indexOf("function interrupt()"));
  assert.ok(release.indexOf("ready: true") < release.indexOf('act(o.id, "celebrate"'));
});
