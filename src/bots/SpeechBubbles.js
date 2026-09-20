import * as THREE from "three";
/** Optional DOM adapter: project rig anchors into the renderer's container. */
export class SpeechBubbles {
  constructor({ container, camera }) {
    if (!container || !camera)
      throw new Error("SpeechBubbles requires a container and camera");
    this.container = container;
    this.camera = camera;
    this.entries = new Map();
    this.doc = container.ownerDocument;
    this.oldPosition = container.style.position;
    if (
      this.doc.defaultView.getComputedStyle(container).position === "static"
    ) {
      container.style.position = "relative";
      this.changedPosition = true;
    }
    this.layer = this.doc.createElement("div");
    this.layer.className = "gc-bubbles";
    this.layer.style.cssText =
      "position:absolute;inset:0;pointer-events:none;z-index:10;overflow:hidden";
    container.append(this.layer);
    const style = this.doc.createElement("style");
    style.textContent = `
.gc-bubbles .gc-bubble{position:absolute;box-sizing:border-box;width:250px;max-width:calc(100% - 16px);max-height:calc(100% - 16px);overflow:auto;pointer-events:auto;background:#fffefb;color:#293b32;border:1px solid #ccd9c4;border-radius:17px;padding:14px 16px;box-shadow:0 8px 22px #23342120;font:12px/1.5 system-ui,sans-serif;transform:translate(-50%,-100%)}
.gc-bubbles .gc-speaker{font-size:10px;font-weight:750;letter-spacing:.07em;color:#668452;margin-right:22px}.gc-bubbles .gc-text{white-space:pre-wrap;overflow-wrap:anywhere;margin:7px 0 0}.gc-bubbles .gc-choices{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}.gc-bubbles button{font:inherit;cursor:pointer}.gc-bubbles .gc-choice{border:1px solid #c8d9b7;background:#edf5e5;color:#36502c;border-radius:9px;padding:7px 10px;text-align:left}.gc-bubbles .gc-choice:hover{background:#dceccf}.gc-bubbles button:focus-visible{outline:2px solid #547d3c;outline-offset:2px}.gc-bubbles .gc-close{position:absolute;top:8px;right:8px;border:0;background:transparent;color:#7b8973;padding:3px 7px;font-size:18px}.gc-bubbles [hidden]{display:none!important}
`;
    this.layer.append(style);
  }
  track(bot) {
    if (this.entries.has(bot)) return () => this.untrack(bot);
    const card = this.doc.createElement("section");
    card.className = "gc-bubble";
    card.hidden = true;
    card.setAttribute("aria-label", `${bot.config.name} speech`);
    this.layer.append(card);
    const entry = { card, unsubscribe: null };
    this.entries.set(bot, entry);
    entry.unsubscribe = bot.dialogue.subscribe((state) => {
      const hadFocus = card.contains(this.doc.activeElement);
      card.replaceChildren();
      card.hidden = !state;
      if (!state) {
        if (hadFocus && entry.returnFocus?.isConnected)
          entry.returnFocus.focus({ preventScroll: true });
        return;
      }
      if (!hadFocus) entry.returnFocus = this.doc.activeElement;
      const speaker = this.doc.createElement("div");
      speaker.className = "gc-speaker";
      speaker.textContent = bot.config.name;
      const close = this.doc.createElement("button");
      close.className = "gc-close";
      close.type = "button";
      close.textContent = "×";
      close.setAttribute("aria-label", `Dismiss ${bot.config.name}'s message`);
      close.onclick = () => bot.dismissSpeech();
      const text = this.doc.createElement("p");
      text.className = "gc-text";
      text.setAttribute("role", "status");
      text.setAttribute("aria-live", "polite");
      text.textContent = state.text;
      card.append(speaker, close, text);
      if (state.choices) {
        const row = this.doc.createElement("div");
        row.className = "gc-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", `Reply to ${bot.config.name}`);
        for (const choice of state.choices) {
          const button = this.doc.createElement("button");
          button.type = "button";
          button.className = "gc-choice";
          button.textContent = choice.label;
          button.disabled = !!choice.disabled;
          button.onclick = () => bot.dialogue.choose(choice.id, state.id);
          row.append(button);
        }
        card.append(row);
      }
      card.onkeydown = (e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          bot.dismissSpeech();
        }
      };
      this.update();
      if (state.focus && state.choices)
        (card.querySelector(".gc-choice:not(:disabled)") || close).focus({
          preventScroll: true,
        });
      else if (hadFocus) close.focus({ preventScroll: true });
    });
    return () => this.untrack(bot);
  }
  update() {
    this.camera.updateMatrixWorld();
    const w = this.container.clientWidth,
      h = this.container.clientHeight;
    for (const [bot, { card }] of this.entries) {
      if (!bot.dialogue.current) {
        card.hidden = true;
        continue;
      }
      bot.root.updateMatrixWorld(true);
      const p = bot.rig.head
        .localToWorld(
          new THREE.Vector3(0, bot.config.head.height / 2 + 0.13, 0),
        )
        .project(this.camera);
      card.hidden =
        !bot.root.visible ||
        p.z < -1 ||
        p.z > 1 ||
        Math.abs(p.x) > 1.15 ||
        Math.abs(p.y) > 1.15;
      if (card.hidden) continue;
      const half = card.offsetWidth / 2,
        x = THREE.MathUtils.clamp(
          (p.x * 0.5 + 0.5) * w,
          half + 8,
          Math.max(half + 8, w - half - 8),
        );
      const y = THREE.MathUtils.clamp(
        (-p.y * 0.5 + 0.5) * h,
        card.offsetHeight + 8,
        Math.max(card.offsetHeight + 8, h - 8),
      );
      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
    }
  }
  untrack(bot) {
    const e = this.entries.get(bot);
    if (!e) return;
    e.unsubscribe();
    bot.dismissSpeech();
    e.card.remove();
    this.entries.delete(bot);
  }
  dispose() {
    for (const bot of [...this.entries.keys()]) this.untrack(bot);
    this.layer.remove();
    if (this.changedPosition) this.container.style.position = this.oldPosition;
  }
}
