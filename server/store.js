import { amendment } from "../shared/management.js";
import {
  validateDetails,
  cleanDetails,
  normalizeDraft,
  CREDIT_LIMIT,
  DISCOUNT_PERCENT,
  SERVICES,
  quote,
} from "../shared/product.js";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
export const catalog = Object.freeze(
  Object.fromEntries(Object.entries(SERVICES).map(([id, s]) => [id, s.price])),
);
export class Problem extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function openStore(path) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, created TEXT NOT NULL, archived TEXT, features TEXT NOT NULL DEFAULT '[]');
    CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id), request_key TEXT NOT NULL, payload TEXT NOT NULL, subtotal INTEGER NOT NULL, discount INTEGER NOT NULL, total INTEGER NOT NULL, created TEXT NOT NULL, UNIQUE(session_id,request_key));
    CREATE TABLE IF NOT EXISTS drafts(session_id TEXT PRIMARY KEY REFERENCES sessions(id), payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS rehearsal_drafts(session_id TEXT PRIMARY KEY REFERENCES sessions(id), payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS booking_state(booking_id TEXT PRIMARY KEY REFERENCES bookings(id), payload TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL, history TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS management_requests(session_id TEXT NOT NULL REFERENCES sessions(id), request_key TEXT NOT NULL, signature TEXT NOT NULL, PRIMARY KEY(session_id, request_key));
    CREATE TABLE IF NOT EXISTS resets(request_key TEXT PRIMARY KEY, old_id TEXT NOT NULL, new_id TEXT NOT NULL);
  `);
  const now = () => new Date().toISOString();
  const transaction = (fn) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const value = fn();
      db.exec("COMMIT");
      return value;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  };
  const create = () => {
    const id = randomUUID();
    db.prepare("INSERT INTO sessions(id,created) VALUES(?,?)").run(id, now());
    return id;
  };
  const active = (id) => {
    const row = db.prepare("SELECT * FROM sessions WHERE id=?").get(id);
    if (!row || row.archived)
      throw new Problem(
        409,
        "Session is no longer active. Reload to recover the current session.",
      );
    return row;
  };
  const snapshot = (id) => {
    const row = active(id);
    const bookings = db
      .prepare("SELECT * FROM bookings WHERE session_id=? ORDER BY created,id")
      .all(id)
      .map((b) => {
        const current = db
          .prepare("SELECT * FROM booking_state WHERE booking_id=?")
          .get(b.id);
        return {
          id: b.id,
          requestKey: b.request_key,
          ...JSON.parse(b.payload),
          subtotal: b.subtotal,
          discount: b.discount,
          total: b.total,
          created: b.created,
          status: current?.status || "confirmed",
          version: current?.version || 1,
          history: current
            ? JSON.parse(current.history)
            : [
                {
                  kind: "confirmed",
                  at: b.created,
                  delta: b.total,
                  total: b.total,
                },
              ],
          ...(current ? JSON.parse(current.payload) : {}),
        };
      });
    const booked = bookings.reduce(
      (sum, b) => sum + (b.status === "cancelled" ? 0 : b.total),
      0,
    );
    return {
      id,
      created: row.created,
      features: JSON.parse(row.features),
      draft: JSON.parse(
        db.prepare("SELECT payload FROM drafts WHERE session_id=?").get(id)
          ?.payload || "null",
      ),
      rehearsalDraft: JSON.parse(
        db
          .prepare("SELECT payload FROM rehearsal_drafts WHERE session_id=?")
          .get(id)?.payload || "null",
      ),
      bookings,
      currency: "AED",
      minorUnits: true,
      credit: {
        limit: CREDIT_LIMIT,
        openingUsed: 0,
        used: booked,
        available: CREDIT_LIMIT - booked,
      },
      discountPercent: DISCOUNT_PERCENT,
    };
  };
  return {
    db,
    create,
    snapshot,
    resume(id) {
      if (!id) return create();
      const row = db
        .prepare("SELECT id,archived FROM sessions WHERE id=?")
        .get(id);
      if (!row) return create();
      while (row.archived) {
        const next = db
          .prepare("SELECT new_id FROM resets WHERE old_id=?")
          .get(row.id);
        if (!next)
          throw new Problem(409, "Archived session cannot be resumed.");
        Object.assign(
          row,
          db
            .prepare("SELECT id,archived FROM sessions WHERE id=?")
            .get(next.new_id),
        );
      }
      return row.id;
    },
    feature(id, feature) {
      if (
        ![
          "workspace",
          "dashboard",
          "booking",
          "bookings",
          "financials",
        ].includes(feature)
      )
        throw new Problem(400, "Unknown feature.");
      return transaction(() => {
        const row = active(id);
        const features = [...new Set([...JSON.parse(row.features), feature])];
        db.prepare("UPDATE sessions SET features=? WHERE id=?").run(
          JSON.stringify(features),
          id,
        );
        return snapshot(id);
      });
    },
    draft(id, payload, rehearsal = false) {
      const table = rehearsal ? "rehearsal_drafts" : "drafts";
      payload = normalizeDraft(payload);
      const error = validateDetails(payload, false);
      if (error) throw new Problem(400, error);
      if (
        !Number.isInteger(payload.step) ||
        payload.step < 0 ||
        payload.step > 4
      )
        throw new Problem(400, "Invalid booking step.");
      // Limit drafts to the same known fields as confirmed bookings.
      const clean = {
        schemaVersion: 2,
        mode: payload.mode,
        adults: payload.adults,
        services: payload.services,
        travellers: payload.travellers.map((t) => ({
          firstName: t.firstName,
          lastName: t.lastName,
        })),
        email: payload.email,
        phone: payload.phone,
        legs: payload.legs.map((l) => ({
          id: l.id,
          from: l.from,
          to: l.to,
          date: l.date,
          flight: l.flight,
        })),
        step: payload.step,
      };
      return transaction(() => {
        active(id);
        db.prepare(
          `INSERT INTO ${table} VALUES(?,?) ON CONFLICT(session_id) DO UPDATE SET payload=excluded.payload`,
        ).run(id, JSON.stringify(clean));
        return snapshot(id);
      });
    },
    book(id, key, payload, rehearsal = false) {
      if (
        !payload ||
        !["single", "multi"].includes(payload.mode) ||
        !Number.isInteger(payload.adults) ||
        payload.adults < 1 ||
        payload.adults > 20 ||
        !Array.isArray(payload.services) ||
        !payload.services.length ||
        new Set(payload.services).size !== payload.services.length
      )
        throw new Problem(
          400,
          "Choose a journey, 1–20 adults and unique airport services.",
        );
      const allowed =
        payload.mode === "single"
          ? ["dxb_departure", "cai_arrival"]
          : ["dxb_departure", "cai_arrival", "cai_departure", "lhr_arrival"];
      if (
        payload.travellers === undefined &&
        payload.services.some((s) => !allowed.includes(s))
      )
        throw new Problem(400, "A service does not belong to this journey.");
      // Persist only known fields; never accept browser-supplied prices or credit amounts.
      const clean = {
        mode: payload.mode,
        adults: payload.adults,
        services: [...payload.services].sort(),
      };
      if (payload.travellers !== undefined) {
        const error = validateDetails(payload, true);
        if (error) throw new Problem(400, error);
        Object.assign(clean, cleanDetails(payload));
      }
      const serialized = JSON.stringify(clean);
      return transaction(() => {
        active(id);
        const existing = db
          .prepare(
            "SELECT payload FROM bookings WHERE session_id=? AND request_key=?",
          )
          .get(id, key);
        if (existing) {
          if (existing.payload !== serialized)
            throw new Problem(
              409,
              "This request key was already used for a different booking.",
            );
          return snapshot(id);
        }
        const { subtotal, discount, total } = quote(
          clean.services,
          clean.adults,
        );
        if (total > snapshot(id).credit.available)
          throw new Problem(409, "Insufficient available corporate credit.");
        db.prepare("INSERT INTO bookings VALUES(?,?,?,?,?,?,?,?)").run(
          randomUUID(),
          id,
          key,
          serialized,
          subtotal,
          discount,
          total,
          now(),
        );
        db.prepare(
          `DELETE FROM ${rehearsal ? "rehearsal_drafts" : "drafts"} WHERE session_id=?`,
        ).run(id);
        return snapshot(id);
      });
    },
    previewAmend(id, bookingId, version, payload) {
      const s = snapshot(id),
        b = s.bookings.find((b) => b.id === bookingId);
      if (!b) throw new Problem(404, "Booking not found.");
      if (b.version !== version)
        throw new Problem(
          409,
          "This booking changed. Reopen it before making changes.",
        );
      try {
        return amendment(b, payload, s.credit.available);
      } catch (e) {
        throw new Problem(400, e.message);
      }
    },
    manage(id, key, action, body) {
      return transaction(() => {
        active(id);
        if (!["amend", "cancel"].includes(action))
          throw new Problem(400, "Unknown booking action.");
        const signature = JSON.stringify({
          action,
          bookingId: body.bookingId,
          version: body.version,
          payload: action === "amend" ? body.payload : null,
        });
        const prior = db
          .prepare(
            "SELECT signature FROM management_requests WHERE session_id=? AND request_key=?",
          )
          .get(id, key);
        if (prior) {
          if (prior.signature !== signature)
            throw new Problem(
              409,
              "This request key belongs to a different change.",
            );
          return snapshot(id);
        }
        const s = snapshot(id),
          b = s.bookings.find((b) => b.id === body.bookingId);
        if (!b) throw new Problem(404, "Booking not found.");
        if (b.status === "cancelled")
          throw new Problem(
            409,
            "This booking is already cancelled. No further credit is returned.",
          );
        if (b.version !== body.version)
          throw new Problem(
            409,
            "This booking changed. Reopen it before making changes.",
          );
        let updated = {
          mode: b.mode,
          adults: b.adults,
          services: b.services,
          ...(b.legs?.length ? cleanDetails(b) : {}),
          subtotal: b.subtotal,
          discount: b.discount,
          total: b.total,
        };
        let delta = -b.total;
        if (action === "amend") {
          let change;
          try {
            change = amendment(b, body.payload, s.credit.available);
          } catch (e) {
            throw new Problem(400, e.message);
          }
          if (!change.affordable)
            throw new Problem(409, "Insufficient available corporate credit.");
          updated = {
            ...change.payload,
            subtotal: change.subtotal,
            discount: change.discount,
            total: change.total,
          };
          delta = change.difference;
        }
        const history = [
          ...b.history,
          {
            kind: action === "amend" ? "amended" : "cancelled",
            at: now(),
            delta,
            total: updated.total,
            previousTotal: b.total,
            before: {
              mode: b.mode,
              adults: b.adults,
              services: b.services,
              ...(b.legs?.length ? cleanDetails(b) : {}),
            },
            after: updated,
          },
        ];
        db.prepare(
          "INSERT INTO booking_state VALUES(?,?,?,?,?) ON CONFLICT(booking_id) DO UPDATE SET payload=excluded.payload,status=excluded.status,version=excluded.version,history=excluded.history",
        ).run(
          b.id,
          JSON.stringify(updated),
          action === "cancel" ? "cancelled" : "confirmed",
          b.version + 1,
          JSON.stringify(history),
        );
        db.prepare("INSERT INTO management_requests VALUES(?,?,?)").run(
          id,
          key,
          signature,
        );
        return snapshot(id);
      });
    },
    reset(id, key) {
      return transaction(() => {
        const previous = db
          .prepare("SELECT * FROM resets WHERE request_key=?")
          .get(key);
        if (previous) {
          if (![previous.old_id, previous.new_id].includes(id))
            throw new Problem(409, "Reset key belongs to another session.");
          active(previous.new_id);
          return previous.new_id;
        }
        active(id);
        db.prepare("UPDATE sessions SET archived=? WHERE id=?").run(now(), id);
        const next = create();
        db.prepare("INSERT INTO resets VALUES(?,?,?)").run(key, id, next);
        return next;
      });
    },
    close() {
      db.close();
    },
  };
}
