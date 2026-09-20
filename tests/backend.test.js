import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../server/store.js";
import { createApi } from "../server/app.js";
const booking = {
  mode: "single",
  adults: 2,
  services: ["dxb_departure", "cai_arrival"],
};
test("sessions survive reopening; retry cannot double-charge; reset archives instead of deleting", () => {
  const dir = mkdtempSync(join(tmpdir(), "gc-backend-"));
  let store = openStore(join(dir, "test.sqlite"));
  try {
    const id = store.create();
    store.feature(id, "dashboard");
    const saved = store.book(id, "booking-key", { ...booking, total: 1 });
    assert.equal(saved.bookings[0].total, 57600);
    assert.equal(saved.credit.available, 9942400);
    assert.equal(store.book(id, "booking-key", booking).bookings.length, 1);
    assert.throws(
      () => store.book(id, "booking-key", { ...booking, adults: 3 }),
      /different booking/,
    );
    store.close();
    store = openStore(join(dir, "test.sqlite"));
    assert.deepEqual(store.snapshot(id).features, ["dashboard"]);
    assert.equal(store.snapshot(id).bookings.length, 1);
    const next = store.reset(id, "reset-key");
    assert.equal(store.reset(id, "reset-key"), next);
    assert.equal(store.reset(next, "reset-key"), next);
    assert.equal(store.resume(id), next);
    assert.equal(store.snapshot(next).bookings.length, 0);
    assert.equal(store.snapshot(next).credit.available, 10000000);
    assert.ok(
      store.db.prepare("SELECT archived FROM sessions WHERE id=?").get(id)
        .archived,
    );
    assert.equal(
      store.db
        .prepare("SELECT COUNT(*) AS n FROM bookings WHERE session_id=?")
        .get(id).n,
      1,
    );
    assert.throws(() => store.book(id, "old-key", booking), /no longer active/);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("invalid services and insufficient credit leave no partial booking", () => {
  const store = openStore(":memory:");
  try {
    const id = store.create();
    assert.throws(
      () =>
        store.book(id, "bad-key", { ...booking, services: ["lhr_arrival"] }),
      /does not belong/,
    );
    assert.throws(
      () => store.book(id, "bad-key", { ...booking, adults: -1 }),
      /1–20/,
    );
    for (let i = 0; i < 17; i++)
      store.book(id, `bulk-key-${i}`, { ...booking, adults: 20 });
    const before = store.snapshot(id);
    assert.throws(
      () => store.book(id, "over-limit", { ...booking, adults: 20 }),
      /Insufficient/,
    );
    assert.deepEqual(store.snapshot(id), before);
  } finally {
    store.close();
  }
});
test("HTTP cookie, origin validation, duplicate submissions and archive reset", async () => {
  const store = openStore(":memory:"),
    server = createApi(store);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const start = await fetch(base + "/api/session");
    let cookie = start.headers.get("set-cookie").split(";")[0];
    const initial = await start.json();
    const post = (path, body, key, origin = "http://127.0.0.1:5173") =>
      fetch(base + path, {
        method: "POST",
        headers: {
          cookie,
          origin,
          "Content-Type": "application/json",
          "X-GC-Demo": "1",
          "Idempotency-Key": key,
        },
        body: JSON.stringify(body),
      });
    assert.equal(
      (
        await post(
          "/api/bookings",
          booking,
          "http-book",
          "https://untrusted.example",
        )
      ).status,
      403,
    );
    const responses = await Promise.all([
      post("/api/bookings", booking, "http-book"),
      post("/api/bookings", booking, "http-book"),
    ]);
    for (const r of responses) {
      assert.equal(r.status, 200);
      assert.equal((await r.json()).bookings.length, 1);
    }
    const reset = await post("/api/session/reset", {}, "http-reset");
    const fresh = await reset.json();
    assert.notEqual(fresh.id, initial.id);
    assert.equal(fresh.bookings.length, 0);
    assert.equal(
      (
        await post(
          "/api/session/features",
          { feature: "dashboard" },
          "unused-key",
        )
      ).status,
      409,
    );
    cookie = reset.headers.get("set-cookie").split(";")[0];
    assert.equal(
      (
        await (
          await fetch(base + "/api/session", { headers: { cookie } })
        ).json()
      ).id,
      fresh.id,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    store.close();
  }
});
