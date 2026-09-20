import {
  newDraft,
  normalizeDraft,
  sampleDraft,
  validateDetails,
} from "../../shared/product.js";
// Cancellable transaction boundary used by both the scene and the delivered form.
export class BookingFlow {
  constructor(api, storage, publish) {
    this.api = api;
    this.storage = storage;
    this.publish = publish;
    this.busy = false;
    this.epoch = 0;
  }
  cancel() {
    this.epoch++;
    this.busy = false;
  }
  begin(session, rehearsal = false, fresh = false) {
    this.cancel();
    this.session = session;
    this.rehearsal = rehearsal;
    const key = `scene-booking-${session.id}`;
    const prior = session.bookings.find((b) => b.requestKey === key);
    this.seed = normalizeDraft(prior || sampleDraft(1, 2));
    this.fixedKey = key;
    this.slot = `gc-scene-confirm:${session.id}:${rehearsal ? "rehearsal" : "visitor"}`;
    const pending = this.storage.getItem(this.slot);
    this.draft = pending
      ? JSON.parse(pending).payload
      : rehearsal || fresh
        ? newDraft()
        : normalizeDraft(session.draft);
    this.publish({
      bookingDraft: this.draft,
      bookingBusy: false,
      bookingError: "",
      bookingDetail: null,
    });
  }
  change(draft) {
    if (this.busy) return;
    this.draft = draft;
    this.publish({ bookingDraft: draft, bookingError: "" });
  }
  async run(fn) {
    if (this.busy) return;
    const epoch = this.epoch;
    const current = () => {
      if (epoch !== this.epoch)
        throw new DOMException("Interrupted", "AbortError");
    };
    this.busy = true;
    this.publish({ bookingBusy: true, bookingError: "" });
    try {
      return await fn(current);
    } catch (e) {
      if (e.name !== "AbortError") {
        current();
        this.publish({ bookingError: e.message });
      }
      throw e;
    } finally {
      if (epoch === this.epoch) {
        this.busy = false;
        this.publish({ bookingBusy: false });
      }
    }
  }
  save(draft) {
    return this.run(async (current) => {
      const session = await (this.rehearsal
        ? this.api.saveRehearsalDraft(draft)
        : this.api.saveDraft(draft));
      current();
      this.session = session;
      this.draft = draft;
      this.publish({ bookingDraft: draft }, session);
    });
  }
  confirm() {
    return this.run(async (current) => {
      const problem = validateDetails(this.draft, true);
      if (problem) throw new Error(problem);
      const prior = this.storage.getItem(this.slot);
      const pending = prior
        ? JSON.parse(prior)
        : {
            key: this.rehearsal ? this.fixedKey : crypto.randomUUID(),
            payload: this.draft,
          };
      if (
        prior &&
        JSON.stringify(pending.payload) !== JSON.stringify(this.draft)
      )
        throw new Error(
          "A confirmation is unresolved. Retry the original details before starting another booking.",
        );
      this.storage.setItem(this.slot, JSON.stringify(pending));
      let session;
      try {
        session = await (this.rehearsal
          ? this.api.bookRehearsal(pending.payload, pending.key)
          : this.api.book(pending.payload, pending.key));
      } catch (e) {
        current();
        if (e.status >= 400 && e.status < 500)
          this.storage.removeItem(this.slot);
        throw e;
      }
      current();
      this.session = session;
      const detail = session.bookings.find((b) => b.requestKey === pending.key);
      if (!detail)
        throw new Error(
          "Confirmation response did not contain the saved booking. Retry safely.",
        );
      this.storage.removeItem(this.slot);
      this.publish({ bookingDetail: detail, page: "confirmation" }, session);
      return detail;
    });
  }
}
