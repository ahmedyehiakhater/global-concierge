import { amendment } from "../../shared/management.js";
export class ManagementController {
  constructor(api, storage, publish) {
    this.api = api;
    this.storage = storage;
    this.publish = publish;
    this.epoch = 0;
    this.state = { view: "list", busy: false, error: "" };
  }
  emit(p) {
    this.state = { ...this.state, ...p };
    this.publish(this.state);
  }
  begin(session, preview = null) {
    this.epoch++;
    this.session = preview?.qaFixture
      ? {
          ...session,
          credit: {
            ...session.credit,
            available: session.credit.available - preview.total,
            used: session.credit.used + preview.total,
          },
        }
      : session;
    this.preview = preview;
    this.slot = `gc-manage:${session.id}`;
    const pending = preview
      ? null
      : JSON.parse(this.storage.getItem(this.slot) || "null");
    this.pending = pending;
    this.emit({
      view: pending ? "detail" : "list",
      selected: pending
        ? session.bookings.find((b) => b.id === pending.body.bookingId)
        : null,
      draft: null,
      quote: null,
      busy: false,
      error: pending ? "A previous change needs a safe retry." : "",
      pending: !!pending,
      hidden: false,
    });
  }
  reload() {
    return this.run(async live => {
      const session = await this.api.load();
      live();
      this.begin(session);
      this.onSession?.(session);
    });
  }
  cancel() {
    this.epoch++;
  }
  open(b) {
    if (this.state.busy || this.pending) return;
    this.emit({ selected: b, view: "detail", error: "", hidden: false });
  }
  list() {
    if (this.state.busy || this.pending) return;
    this.emit({
      view: "list",
      selected: null,
      error: "",
      draft: null,
      quote: null,
    });
  }
  edit() {
    if (this.state.busy || this.pending) return;
    this.emit({
      view: "edit",
      draft: structuredClone(this.state.selected),
      quote: null,
      error: "",
    });
  }
  change(draft) {
    if (!this.state.busy && !this.pending)
      this.emit({ draft, quote: null, error: "" });
  }
  showCancel(unsafe = false) {
    if (this.state.busy || this.pending) return;
    this.emit(unsafe ? { hidden: true } : { view: "cancel", error: "" });
  }
  back() {
    if (this.state.busy || this.pending) return;
    this.emit({
      view: "detail",
      draft: null,
      quote: null,
      error: "",
      hidden: false,
    });
  }
  async run(fn) {
    if (this.state.busy) return;
    const epoch = this.epoch;
    const live = () => {
      if (epoch !== this.epoch)
        throw new DOMException("Scene ended", "AbortError");
    };
    this.emit({ busy: true, error: "" });
    try {
      return await fn(live);
    } catch (e) {
      if (epoch === this.epoch) this.emit({ error: e.message });
      throw e;
    } finally {
      if (epoch === this.epoch) this.emit({ busy: false });
    }
  }
  review() {
    return this.run(async (live) => {
      const b = this.state.selected,
        draft = this.state.draft;
      const result = this.preview
        ? amendment(b, draft, this.session.credit.available)
        : await this.api.quoteAmend({
            bookingId: b.id,
            version: b.version,
            payload: draft,
          });
      live();
      this.emit({ quote: result, view: "review" });
    });
  }
  confirm(action) {
    return this.run(async (live) => {
      if (this.preview)
        throw Error("QA preview only. No saved booking will be changed.");
      const body = {
        bookingId: this.state.selected.id,
        version: this.state.selected.version,
        ...(action === "amend" ? { payload: this.state.draft } : {}),
      };
      const pending = this.pending || {
        action,
        body,
        key: crypto.randomUUID(),
      };
      this.pending = pending;
      this.storage.setItem(this.slot, JSON.stringify(pending));
      this.emit({ pending: true });
      let session;
      try {
        session = await (
          pending.action === "amend" ? this.api.amend : this.api.cancelBooking
        )(pending.body, pending.key);
      } catch (e) {
        live();
        if (e.status >= 400 && e.status < 500) {
          this.storage.removeItem(this.slot);
          this.pending = null;
          this.emit({ pending: false });
        }
        throw e;
      }
      live();
      this.storage.removeItem(this.slot);
      this.pending = null;
      this.session = session;
      this.emit({
        view: "detail",
        selected: session.bookings.find((b) => b.id === pending.body.bookingId),
        draft: null,
        quote: null,
        pending: false,
      });
      this.onSession?.(session);
      return session;
    });
  }
  retry() {
    return this.confirm(this.pending.action);
  }
}
