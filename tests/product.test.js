import test from "node:test";
import assert from "node:assert/strict";
import { openStore } from "../server/store.js";
import {
  newDraft,
  sampleDraft,
  validateDetails,
  quote,
  selectionKey,
  servicesFor,
  validSelections,
  stepError,
} from "../shared/product.js";
import { createProductController } from "../src/product/controller.js";
const memory = () => {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
};
test("saved traveller draft survives confirmation, while backend calculates the multi-leg charge", () => {
  const store = openStore(":memory:");
  try {
    const id = store.create(),
      d = sampleDraft(2);
    d.travellers[0].firstName = "Alex";
    d.step = 4;
    store.draft(id, d);
    assert.equal(store.snapshot(id).draft.travellers[0].firstName, "Alex");
    const confirmed = store.book(id, "product-key", { ...d, total: 1 });
    assert.equal(confirmed.bookings[0].total, 93600);
    assert.equal(confirmed.bookings[0].legs.length, 2);
    assert.equal(confirmed.bookings[0].travellers[0].firstName, "Alex");
    assert.equal(confirmed.draft, null);
    assert.equal(confirmed.credit.available, 9906400);
    const next = store.reset(id, "reset-product");
    assert.equal(store.snapshot(next).draft, null);
    assert.equal(
      store.db
        .prepare("SELECT COUNT(*) n FROM bookings WHERE session_id=?")
        .get(id).n,
      1,
    );
  } finally {
    store.close();
  }
});
test("server rejects invalid traveller dates and contact details without charging", () => {
  const store = openStore(":memory:");
  try {
    const id = store.create(),
      d = sampleDraft();
    d.legs[0].date = "2026-02-31";
    assert.throws(() => store.book(id, "invalid-date", d), /valid flight date/);
    d.legs[0].date = "2026-11-12";
    d.email = "invalid";
    assert.throws(() => store.book(id, "invalid-email", d), /valid contact/);
    d.email = "alex@example.com";
    d.travellers = [];
    assert.throws(() => store.book(id, "invalid-people", d), /each traveller/);
    assert.equal(store.snapshot(id).bookings.length, 0);
  } finally {
    store.close();
  }
});
test("blank new traveller is allowed in draft but rejected for confirmation; service estimate is consistent", () => {
  const d = sampleDraft();
  d.adults = 3;
  d.travellers.push({ firstName: "", lastName: "" });
  assert.equal(validateDetails(d, false), null);
  assert.match(validateDetails(d, true), /every traveller/);
  assert.deepEqual(quote(d.services, 2), {
    subtotal: 64000,
    discount: 6400,
    total: 57600,
  });
});
test("controller retries a lost confirmation response with its original key after reload", async () => {
  const store = openStore(":memory:"),
    storage = memory();
  try {
    const id = store.create();
    let attempts = 0;
    const api = {
      load: async () => store.snapshot(id),
      saveDraft: async (d) => store.draft(id, d),
      book: async (d, k) => {
        const s = store.book(id, k, d);
        if (++attempts === 1) throw new Error("Response lost");
        return s;
      },
      reset: async (k) => store.snapshot(store.reset(id, k)),
    };
    const first = createProductController(api, storage);
    await first.load();
    first.enter();
    await first.saveDraft({ ...sampleDraft(), step: 4 });
    await first.confirm();
    assert.equal(store.snapshot(id).bookings.length, 1);
    assert.equal(first.getSnapshot().page, "dashboard");
    const resumed = createProductController(api, storage);
    await resumed.load();
    assert.equal(resumed.getSnapshot().page, "booking");
    await resumed.confirm();
    assert.equal(resumed.getSnapshot().page, "confirmation");
    assert.equal(store.snapshot(id).bookings.length, 1);
    assert.equal(store.snapshot(id).credit.available, 9942400);
  } finally {
    store.close();
  }
});
test("failed reset preserves the active product state", async () => {
  const store = openStore(":memory:");
  try {
    const id = store.create(),
      c = createProductController(
        {
          load: async () => store.snapshot(id),
          reset: async () => {
            throw new Error("Offline");
          },
        },
        memory(),
      );
    await c.load();
    c.enter();
    await c.reset();
    assert.equal(c.getSnapshot().session.id, id);
    assert.equal(c.getSnapshot().signedIn, true);
    assert.equal(c.getSnapshot().error, "Offline");
  } finally {
    store.close();
  }
});

test("arbitrary airports, five legs and separate services at repeated airports persist and charge correctly", () => {
  const store = openStore(":memory:");
  try {
    const id = store.create(),
      d = sampleDraft(5, 1);
    d.legs[0].from = "SIN";
    d.services = d.legs.map((l) => selectionKey(l, "chauffeur", "arrival"));
    assert.equal(validateDetails(d), null);
    const saved = store.book(id, "five-legs", d);
    assert.equal(saved.bookings[0].legs.length, 5);
    assert.equal(saved.credit.used, 126000);
    assert.equal(saved.credit.available, 9874000);
    assert.equal(saved.credit.openingUsed, 0);
  } finally {
    store.close();
  }
});
test("service eligibility rejects check-in on arrival or outside DXB, and airport changes invalidate selections", () => {
  const d = sampleDraft();
  d.services = [selectionKey(d.legs[0], "home_checkin", "arrival")];
  assert.match(validateDetails(d), /does not belong/);
  d.services = [selectionKey(d.legs[0], "home_checkin", "departure")];
  assert.equal(validateDetails(d), null);
  d.legs[0].from = "LHR";
  assert.equal(validSelections(d).length, 0);
  assert.equal(
    servicesFor(d.legs[0], "arrival").some(([id]) => id === "lounge"),
    false,
  );
  const store = openStore(":memory:");
  try {
    const id = store.create();
    assert.throws(
      () => store.book(id, "invalid-service", d),
      /does not belong/,
    );
    assert.equal(store.snapshot(id).credit.used, 0);
  } finally {
    store.close();
  }
});
test("price units distinguish adults, vehicles and bookings; incomplete forms cannot proceed", () => {
  assert.deepEqual(quote(["lounge", "chauffeur", "home_checkin"], 5), {
    subtotal: 201000,
    discount: 20100,
    total: 180900,
  });
  const d = newDraft();
  assert.match(stepError(d), /airport/);
  const ready = sampleDraft();
  ready.email = "bad";
  assert.equal(stepError(ready, 0), null);
  assert.match(stepError(ready, 1), /email/);
  ready.legs[0].flight = "invalid";
  assert.match(stepError(ready, 0), /flight number/);
});

test("a definite rejected confirmation can be edited and resubmitted with a fresh key", async () => {
  const store = openStore(":memory:"),
    storage = memory(),
    keys = [];
  try {
    const id = store.create();
    const c = createProductController(
      {
        load: async () => store.snapshot(id),
        saveDraft: async (d) => store.draft(id, d),
        book: async (d, key) => {
          keys.push(key);
          if (keys.length === 1) {
            const e = new Error("Insufficient available corporate credit.");
            e.status = 409;
            throw e;
          }
          return store.book(id, key, d);
        },
      },
      storage,
    );
    await c.load();
    await c.saveDraft({ ...sampleDraft(), step: 4 });
    await c.confirm();
    assert.match(c.getSnapshot().error, /Insufficient/);
    c.changeDraft({
      ...c.getSnapshot().draft,
      services: c.getSnapshot().draft.services.slice(0, 1),
    });
    await c.confirm();
    assert.notEqual(keys[0], keys[1]);
    assert.equal(c.getSnapshot().page, "confirmation");
    assert.equal(store.snapshot(id).bookings.length, 1);
  } finally {
    store.close();
  }
});

test("adding and removing flights derives journey type and retains only services for remaining flights", async () => {
  const { withFlights, blankLeg } = await import("../shared/product.js");
  const initial = sampleDraft(1);
  const second = blankLeg(initial.legs[0].to);
  const added = withFlights(initial, [...initial.legs, second]);
  assert.equal(added.mode, "multi");
  assert.equal(added.legs[1].from, "CAI");
  assert.deepEqual(added.services, initial.services);
  const populated = sampleDraft(2);
  const reduced = withFlights(populated, [populated.legs[1]]);
  assert.equal(reduced.mode, "single");
  assert.equal(reduced.legs.length, 1);
  assert.equal(reduced.services.length, 2);
  assert.ok(
    reduced.services.every((k) => k.startsWith(populated.legs[1].id + ":")),
  );
  assert.equal(validateDetails(reduced), null);
  const store = openStore(":memory:");
  try {
    const id = store.create();
    store.draft(id, reduced);
    assert.equal(store.snapshot(id).draft.mode, "single");
    assert.equal(
      store.book(id, "reduced-flight", reduced).bookings[0].legs.length,
      1,
    );
  } finally {
    store.close();
  }
  assert.throws(() => withFlights(initial, []), /at least one flight/);
});
