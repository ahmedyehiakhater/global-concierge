import { sessionApi } from "../api/client.js";
import {
  newDraft,
  validateDetails,
  normalizeDraft,
} from "../../shared/product.js";
// Product state boundary. The scene controller can call these same actions later.
export function createProductController(
  api = sessionApi,
  storage = sessionStorage,
) {
  let state = {
    session: null,
    draft: newDraft(),
    page: "dashboard",
    detail: null,
    signedIn: false,
    busy: false,
    error: "",
    notice: "",
  };
  const listeners = new Set();
  const emit = (patch) => {
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn());
  };
  async function run(fn) {
    if (state.busy) return;
    emit({ busy: true, error: "", notice: "" });
    try {
      return await fn();
    } catch (e) {
      emit({ error: e.message });
    } finally {
      emit({ busy: false });
    }
  }
  const pendingKey = (id) => "gc-product-confirm:" + id;
  const controller = {
    replaceSession(session) { emit({session, detail: state.detail ? session.bookings.find(b=>b.id===state.detail.id) : null}); },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getSnapshot: () => state,
    load() {
      return run(async () => {
        const session = await api.load();
        const pending = storage.getItem(pendingKey(session.id));
        emit({
          session,
          draft: pending
            ? JSON.parse(pending).payload
            : normalizeDraft(session.draft),
          signedIn: storage.getItem("gc-product-login") === session.id,
          ...(pending
            ? {
                page: "booking",
                notice:
                  "An unfinished confirmation was recovered. Retry to safely check its result.",
              }
            : {}),
        });
      });
    },
    enter() {
      storage.setItem("gc-product-login", state.session.id);
      emit({ signedIn: true, page: "dashboard" });
    },
    navigate(page, search = "") {
      return run(async () => {
        if (state.page === "booking") {
          const session = await api.saveDraft(state.draft);
          emit({ session });
        }
        emit({ page, search, error: "", notice: "" });
      });
    },
    openBooking(booking) {
      emit({ page: "detail", detail: booking });
    },
    changeDraft(draft) {
      emit({ draft, notice: "" });
    },
    startBooking() {
      if (state.page === "booking") return;
      emit({
        page: "booking",
        draft: normalizeDraft(state.session.draft),
        error: "",
        notice: "",
      });
    },
    saveDraft(draft) {
      return run(async () => {
        const session = await api.saveDraft(draft);
        emit({ session, draft, notice: "Draft saved on this laptop." });
      });
    },
    confirm() {
      return run(async () => {
        const problem = validateDetails(state.draft, true);
        if (problem) throw new Error(problem);
        const slot = pendingKey(state.session.id);
        const prior = storage.getItem(slot);
        const pending = prior
          ? JSON.parse(prior)
          : { key: crypto.randomUUID(), payload: state.draft };
        if (
          prior &&
          JSON.stringify(pending.payload) !== JSON.stringify(state.draft)
        )
          throw new Error(
            "An earlier confirmation is unresolved. Restore the saved draft or reload, then retry it before changing this booking.",
          );
        storage.setItem(slot, JSON.stringify(pending));
        let session;
        try {
          session = await api.book(pending.payload, pending.key);
        } catch (e) {
          if (e.status >= 400 && e.status < 500) storage.removeItem(slot);
          throw e;
        }
        const detail =
          session.bookings.find((b) => b.requestKey === pending.key) ||
          session.bookings.at(-1);
        storage.removeItem(slot);
        emit({
          session,
          detail,
          page: "confirmation",
          draft: newDraft(),
          notice: "Booking saved. Corporate credit updated.",
        });
      });
    },
    reset() {
      return run(async () => {
        const key = storage.getItem("gc-product-reset") || crypto.randomUUID();
        storage.setItem("gc-product-reset", key);
        const old = state.session.id;
        const session = await api.reset(key);
        storage.removeItem("gc-product-reset");
        storage.removeItem(pendingKey(old));
        storage.removeItem("gc-product-login");
        emit({
          session,
          draft: newDraft(),
          detail: null,
          signedIn: false,
          page: "dashboard",
          notice: "Previous visitor archived. Ready for a fresh start.",
        });
      });
    },
  };
  return controller;
}
