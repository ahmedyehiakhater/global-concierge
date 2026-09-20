import test from "node:test";
import assert from "node:assert/strict";
import { openStore } from "../server/store.js";
import { sampleDraft, selectionKey, CREDIT_LIMIT } from "../shared/product.js";
import { dashboardValues } from "../shared/features.js";
import { ManagementController } from "../src/product/managementController.js";
function setup() {
  const store = openStore(":memory:"),
    id = store.create(),
    draft = sampleDraft(1, 2);
  store.book(id, "original-key", draft);
  return { store, id, draft, b: store.snapshot(id).bookings[0] };
}
function extra(b) {
  return {
    ...b,
    services: [...b.services, selectionKey(b.legs[0], "lounge", "departure")],
  };
}
test("amend up/down uses only the price difference, keeps history and original creation idempotency", () => {
  const { store, id, draft, b } = setup();
  try {
    const d = extra(b),
      q = store.previewAmend(id, b.id, 1, d);
    assert.equal(q.difference, 39600);
    const body = { bookingId: b.id, version: 1, payload: d };
    const updated = store.manage(id, "amend-key", "amend", body);
    assert.equal(updated.credit.used, b.total + 39600);
    assert.equal(updated.bookings[0].version, 2);
    assert.deepEqual(store.manage(id, "amend-key", "amend", body), updated);
    assert.deepEqual(store.book(id, "original-key", draft), updated);
    const lower = store.manage(id, "lower-key", "amend", {
      bookingId: b.id,
      version: 2,
      payload: draft,
    });
    assert.equal(lower.credit.used, b.total);
    assert.equal(lower.bookings[0].history.length, 3);
    assert.throws(
      () => store.manage(id, "stale-key", "amend", body),
      /changed/,
    );
    assert.throws(
      () =>
        store.manage(id, "amend-key", "cancel", {
          bookingId: b.id,
          version: 3,
        }),
      /different/,
    );
  } finally {
    store.close();
  }
});
test("cancel returns current charge once, retains history, excludes active metrics and rejects changes", () => {
  const { store, id, b } = setup();
  try {
    const body = { bookingId: b.id, version: 1 };
    const result = store.manage(id, "cancel-key", "cancel", body);
    assert.equal(result.credit.available, CREDIT_LIMIT);
    assert.equal(result.bookings.length, 1);
    assert.equal(result.bookings[0].status, "cancelled");
    assert.equal(result.bookings[0].history.at(-1).delta, -b.total);
    assert.equal(dashboardValues(result).bookings, 0);
    assert.equal(dashboardValues(result).savings, 0);
    assert.deepEqual(store.manage(id, "cancel-key", "cancel", body), result);
    assert.throws(
      () => store.manage(id, "another-key", "cancel", { ...body, version: 2 }),
      /already cancelled/,
    );
    assert.throws(
      () =>
        store.manage(id, "amend-key", "amend", {
          ...body,
          version: 2,
          payload: extra(b),
        }),
      /already cancelled/,
    );
  } finally {
    store.close();
  }
});
test("unaffordable or invalid amendment and cross-session access do not partially change the ledger", () => {
  const { store, id, b } = setup();
  try {
    let i = 0;
    while (store.snapshot(id).credit.available >= b.total)
      store.book(id, `fill-${i++}`, sampleDraft(1, 2));
    const before = store.snapshot(id);
    assert.throws(
      () =>
        store.manage(id, "too-much", "amend", {
          bookingId: b.id,
          version: 1,
          payload: extra(b),
        }),
      /Insufficient/,
    );
    assert.deepEqual(store.snapshot(id), before);
    assert.throws(() =>
      store.manage(id, "bad-route", "amend", {
        bookingId: b.id,
        version: 1,
        payload: { ...b, adults: 1 },
      }),
    );
    const other = store.create();
    assert.throws(
      () =>
        store.manage(other, "other-key", "cancel", {
          bookingId: b.id,
          version: 1,
        }),
      /not found/,
    );
    store.reset(id, "reset-key");
    assert.throws(
      () =>
        store.manage(id, "late-key", "cancel", { bookingId: b.id, version: 1 }),
      /active/,
    );
  } finally {
    store.close();
  }
});
const memory = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
test("client retries lost cancellation response once and suppresses late replies after reset", async () => {
  const { store, id, b } = setup();
  try {
    let lose = true;
    const api = {
      cancelBooking: async (body, key) => {
        const s = store.manage(id, key, "cancel", body);
        if (lose) {
          lose = false;
          throw Error("Connection lost");
        }
        return s;
      },
    };
    const c = new ManagementController(api, memory(), () => {});
    c.begin(store.snapshot(id));
    c.open(b);
    await assert.rejects(c.confirm("cancel"));
    assert.ok(c.pending);
    await c.retry();
    assert.equal(c.state.selected.status, "cancelled");
    assert.equal(store.snapshot(id).credit.used, 0);
    let finish;
    const slow = new ManagementController(
      { cancelBooking: () => new Promise((r) => (finish = r)) },
      memory(),
      () => {},
    );
    slow.begin({ ...store.snapshot(id), bookings: [b] });
    slow.open(b);
    const pending = slow.confirm("cancel");
    slow.cancel();
    finish(store.snapshot(id));
    await assert.rejects(pending, { name: "AbortError" });
  } finally {
    store.close();
  }
});
test("preview review/discard and cancellation never call write APIs", async () => {
  const { store, id, b } = setup();
  try {
    const c = new ManagementController(
      {
        amend: () => assert.fail("unexpected write"),
        cancelBooking: () => assert.fail("unexpected write"),
      },
      memory(),
      () => {},
    );
    c.begin(store.snapshot(id), b);
    c.open(b);
    c.edit();
    c.change(extra(b));
    await c.review();
    assert.equal(c.state.quote.difference, 39600);
    c.back();
    assert.equal(c.state.selected.total, b.total);
    await assert.rejects(c.confirm("cancel"), /preview/);
    assert.equal(store.snapshot(id).credit.used, b.total);
  } finally {
    store.close();
  }
});

test('QA fixture has a coherent illustrative credit balance but never changes the real session', async()=>{
 const {store,id,b}=setup();try{
   const source=store.snapshot(id), original=JSON.stringify(source);
   const c=new ManagementController({},memory(),()=>{});
   const fixture={...b,id:'qa-fixture',qaFixture:true};
   c.begin(source,fixture);c.open(fixture);c.edit();c.change(extra(fixture));await c.review();
   assert.equal(c.session.credit.available,source.credit.available-fixture.total);
   assert.equal(c.state.quote.availableAfter,c.session.credit.available-c.state.quote.difference);
   assert.equal(JSON.stringify(source),original);
 }finally{store.close();}
});
