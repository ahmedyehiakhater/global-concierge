import test from "node:test";
import assert from "node:assert/strict";
import { SceneClock } from "../src/opening/clock.js";
test("scene clock advances only with ticks and completes once", async () => {
  const c = new SceneClock();
  let value = 0;
  const p = c.tween(1, (u) => (value = u));
  c.tick(0.4);
  assert.equal(value, 0.4);
  c.tick(0.6);
  await p;
  assert.equal(value, 1);
  assert.equal(c.jobs.size, 0);
});
test("interruption cancels pending landing callback and later scene can run", async () => {
  const c = new SceneClock(),
    a = new AbortController();
  let clicks = 0;
  const p = c.tween(
    1,
    (u) => {
      if (u === 1) clicks++;
    },
    a.signal,
  );
  const rejection = assert.rejects(p, { name: "AbortError" });
  c.tick(0.5);
  a.abort();
  await rejection;
  c.tick(5);
  assert.equal(clicks, 0);
  const next = c.tween(1, () => {});
  c.tick(1);
  await next;
  assert.equal(c.jobs.size, 0);
});
