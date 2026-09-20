/** Renderer-independent dialogue state. Text is data, never markup. */
export class BotDialogue {
  constructor() {
    this.current = null;
    this.listeners = new Set();
    this.serial = 0;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.current);
    return () => this.listeners.delete(listener);
  }
  notify() {
    for (const listener of this.listeners) listener(this.current);
  }
  validate(text, { duration = 0 } = {}) {
    if (typeof text !== "string" || !text.trim())
      throw new Error("Speech text must be a non-empty string");
    if (!Number.isFinite(duration) || duration < 0)
      throw new Error("Duration must be non-negative seconds");
  }
  open(text, options, choices, resolve) {
    this.dismiss();
    const state = {
      id: ++this.serial,
      text,
      choices,
      resolve,
      remaining: options.duration ?? 0,
      focus: options.focus ?? false,
      cleanup: null,
    };
    this.current = state;
    if (options.signal) {
      const abort = () => {
        if (this.current === state) this.dismiss();
      };
      options.signal.addEventListener("abort", abort, { once: true });
      state.cleanup = () => options.signal.removeEventListener("abort", abort);
      if (options.signal.aborted) {
        this.dismiss();
        return;
      }
    }
    this.notify();
  }
  say(text, options = {}) {
    this.validate(text, options);
    this.open(text, options, null, null);
  }
  ask(text, choices, options = {}) {
    this.validate(text, options);
    if (!Array.isArray(choices) || !choices.length)
      throw new Error("At least one choice is required");
    const ids = new Set();
    const copy = choices.map((c) => {
      if (
        typeof c?.id !== "string" ||
        !c.id.trim() ||
        ids.has(c.id) ||
        typeof c.label !== "string" ||
        !c.label.trim()
      )
        throw new Error(
          "Choices require unique non-empty string IDs and labels",
        );
      ids.add(c.id);
      return {
        id: c.id,
        label: c.label,
        ...(c.disabled ? { disabled: true } : {}),
      };
    });
    return new Promise((resolve) => this.open(text, options, copy, resolve));
  }
  choose(id, revision = this.current?.id) {
    const state = this.current;
    if (
      !state ||
      state.id !== revision ||
      !state.choices?.some((c) => c.id === id && !c.disabled)
    )
      return false;
    this.close(id);
    return true;
  }
  close(result) {
    const state = this.current;
    if (!state) return;
    this.current = null;
    state.cleanup?.();
    state.resolve?.(result);
    this.notify();
  }
  dismiss() {
    this.close(null);
  }
  update(dt) {
    if (!this.current || this.current.remaining === 0) return;
    this.current.remaining -= Math.max(0, dt);
    if (this.current.remaining <= 0) this.dismiss();
  }
  dispose() {
    this.dismiss();
    this.listeners.clear();
  }
}
