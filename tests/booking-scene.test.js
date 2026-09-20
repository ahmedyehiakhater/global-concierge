import test from "node:test";
import assert from "node:assert/strict";
import { openStore } from "../server/store.js";
import { BookingFlow } from "../src/opening/bookingFlow.js";
import { sampleDraft, newDraft } from "../shared/product.js";
const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
const apiFor = (store, id) => ({
  saveDraft: async (d) => store.draft(id, d),
  saveRehearsalDraft: async (d) => store.draft(id, d, true),
  book: async (d, k) => store.book(id, k, d),
  bookRehearsal: async (d, k) => store.book(id, k, d, true),
});

test("rehearsal draft and confirmation preserve the attendee draft and charge once across retry", async () => {
  const store = openStore(":memory:");
  try {
    const id = store.create(),
      original = sampleDraft(2);
    original.travellers[0].firstName = "Existing";
    store.draft(id, original);
    const before = store.snapshot(id).draft;
    const flow = new BookingFlow(apiFor(store, id), storage(), () => {});
    flow.begin(store.snapshot(id), true);
    flow.change({ ...flow.seed, step: 4 });
    await flow.save(flow.draft);
    assert.deepEqual(store.snapshot(id).draft, before);
    const detail = await flow.confirm();
    assert.equal(detail.total, 57600);
    assert.equal(store.snapshot(id).credit.used, 57600);
    assert.deepEqual(store.snapshot(id).draft, before);
    assert.equal(store.snapshot(id).rehearsalDraft, null);
    flow.begin(store.snapshot(id), true);
    flow.change({ ...flow.seed, step: 4 });
    await flow.confirm();
    assert.equal(store.snapshot(id).bookings.length, 1);
    assert.equal(store.snapshot(id).credit.used, 57600);
  } finally {
    store.close();
  }
});
test("lost confirmation response retries the exact payload/key without a second deduction", async () => {
  const store = openStore(":memory:");
  try {
    const id = store.create(),
      api = apiFor(store, id);
    let lost = true;
    const book = api.bookRehearsal;
    api.bookRehearsal = async (d, k) => {
      const result = await book(d, k);
      if (lost) {
        lost = false;
        throw Error("Connection lost");
      }
      return result;
    };
    const flow = new BookingFlow(api, storage(), () => {});
    flow.begin(store.snapshot(id), true);
    flow.change({ ...flow.seed, step: 4 });
    await assert.rejects(flow.confirm(), /Connection lost/);
    await flow.confirm();
    assert.equal(store.snapshot(id).bookings.length, 1);
    assert.equal(store.snapshot(id).credit.used, 57600);
  } finally {
    store.close();
  }
});
test("reset during an in-flight confirmation prevents late UI publication and keeps the next session clean", async () => {
  const store = openStore(":memory:");
  try {
    const id = store.create(),
      updates = [];
    let release;
    const api = apiFor(store, id);
    api.bookRehearsal = async (d, k) => {
      const saved = store.book(id, k, d, true);
      await new Promise((r) => (release = r));
      return saved;
    };
    const flow = new BookingFlow(api, storage(), (v, s) =>
      updates.push({ v, s }),
    );
    flow.begin(store.snapshot(id), true);
    flow.change({ ...flow.seed, step: 4 });
    const pending = flow.confirm();
    flow.cancel();
    const count = updates.length;
    const next = store.reset(id, "reset-during-save");
    release();
    await assert.rejects(pending, { name: "AbortError" });
    assert.equal(updates.length, count);
    assert.equal(store.snapshot(next).bookings.length, 0);
    assert.equal(store.snapshot(next).credit.available, 10000000);
    assert.throws(
      () => store.book(id, "late-save-key", sampleDraft(), true),
      /no longer active/,
    );
  } finally {
    store.close();
  }
});
test("delivered visitor flow starts empty, saves drafts, and gives each new confirmation its own key", async () => {
  const store = openStore(":memory:");
  try {
    const id = store.create(),
      flow = new BookingFlow(apiFor(store, id), storage(), () => {});
    for (let i = 0; i < 2; i++) {
      flow.begin(store.snapshot(id), false, true);
      assert.equal(flow.draft.services.length, 0);
      assert.equal(flow.draft.step, 0);
      flow.change({ ...sampleDraft(), step: 4 });
      await flow.save(flow.draft);
      await flow.confirm();
    }
    assert.equal(store.snapshot(id).bookings.length, 2);
    assert.equal(store.snapshot(id).credit.used, 115200);
  } finally {
    store.close();
  }
});


test("booking may ship first; Dashboard is unlocked only by its own release and preserves the ledger", () => {
  const store = openStore(":memory:");
  try {
    const id = store.create();
    store.feature(id, "workspace");
    store.book(id, "booking-before-dashboard", sampleDraft(1, 2), true);
    const booking = store.feature(id, "booking");
    assert.deepEqual(booking.features, ["workspace", "booking"]);
    const dashboard = store.feature(id, "dashboard");
    assert.deepEqual(dashboard.features, ["workspace", "booking", "dashboard"]);
    assert.deepEqual(dashboard.bookings, booking.bookings);
    assert.deepEqual(dashboard.credit, booking.credit);
  } finally { store.close(); }
});
