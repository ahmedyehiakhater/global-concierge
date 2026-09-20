import { BotDialogue } from "./Dialogue.js";
import * as THREE from "three";
import { buildBot } from "./buildBot.js";
import { BotMotion, armTo } from "./BotMotion.js";
import { BotScreen } from "./Screen.js";
export const ACTIONS = [
  "idle",
  "walk",
  "turn",
  "pickUp",
  "carry",
  "place",
  "build",
  "type",
  "inspect",
  "present",
  "beckon",
  "sweep",
  "throw",
  "celebrate",
  "react",
];
const loops = new Set(["idle", "build", "type", "sweep"]);
const durations = {
  inspect: 2.3,
  present: 1.8,
  beckon: 2,
  sweep: 1.4,
  throw: 1.1,
  build: 1.1,
  type: 1.3,
  celebrate: 1.7,
  react: 1.1,
  pickUp: 1.65,
  place: 1.65,
};
const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const smooth = (t) => {
  t = THREE.MathUtils.clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};
const angle = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const point = (x, y, z) =>
  x?.isVector3
    ? x.clone()
    : typeof x === "object"
      ? v(x.x, x.y ?? y, x.z)
      : v(x, y, z);
const valid = (p) => {
  if (![p.x, p.y, p.z].every(Number.isFinite))
    throw new Error("Position must contain finite coordinates");
  return p;
};
/** Generic action facade. No knowledge of the application or demo choreography. */
export class Bot {
  constructor(
    config,
    { effects = null, screen = true, canvasFactory, random = Math.random } = {},
  ) {
    this.rig = buildBot(config);
    this.root = this.rig.root;
    this.config = this.rig.config;
    this.effects = effects;
    this.motion = new BotMotion(this.rig);
    this.screen = screen
      ? new BotScreen(this.rig.screenMesh, { canvasFactory, random })
      : null;
    this.dialogue = new BotDialogue();
    this.active = null;
    this.held = null;
    this.clock = 0;
    this.listeners = new Set();
    this.disposed = false;
    this.trail = null;
    this.impacts = [];
    this.transition = null;
  }
  say(text, options) {
    if (this.disposed) throw new Error("Bot has been disposed");
    this.dialogue.say(text, options);
    return this;
  }
  ask(text, choices, options) {
    if (this.disposed) throw new Error("Bot has been disposed");
    return this.dialogue.ask(text, choices, options);
  }
  dismissSpeech() {
    this.dialogue.dismiss();
    return this;
  }
  onComplete(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  setExpression(name) {
    this.screen?.setExpression(name);
    if (name === "error" || name === "success") this.emit(name);
    return this;
  }
  setStatus(name, value) {
    this.screen?.setStatus(name, value);
    return this;
  }
  finish(status = "completed") {
    const a = this.active;
    if (!a) return;
    this.captureTransition();
    this.active = null;
    this.trail?.stop();
    this.trail = null;
    a.cleanup?.();
    const result = { action: a.name, status };
    a.resolve(result);
    for (const listener of this.listeners) listener(result);
  }
  captureTransition() {
    const nodes = [
      this.rig.torso,
      this.rig.head,
      ...Object.values(this.rig.arms).flatMap((a) => [
        a.shoulder,
        a.elbow,
        a.hand,
      ]),
      ...Object.values(this.rig.legs).flatMap((l) => [l.hip, l.knee, l.ankle]),
    ];
    this.transition = {
      time: 0,
      y: this.root.position.y,
      poses: nodes.map((node) => ({
        node,
        q: node.quaternion.clone(),
        p: node.position.clone(),
      })),
    };
  }
  cancel() {
    this.finish("cancelled");
    this.motion.queue = [];
    this.motion.step = null;
    this.motion.busy = false;
    return this;
  }
  stop() {
    this.finish("completed");
    this.motion.queue = [];
    this.motion.step = null;
    this.motion.busy = false;
    return this;
  }
  start(name, options = {}) {
    if (this.disposed) throw new Error("Bot has been disposed");
    this.cancel();
    let resolve;
    const promise = new Promise((r) => (resolve = r));
    const a = (this.active = {
      name,
      time: 0,
      resolve,
      options,
      lastStrike: -1,
      fired: new Set(),
      duration: options.duration ?? durations[name] ?? 1,
      loop: options.loop ?? loops.has(name),
    });
    a.fromYaw = this.root.rotation.y;
    if (options.signal) {
      const abort = () => this.cancel();
      options.signal.addEventListener("abort", abort, { once: true });
      a.cleanup = () => options.signal.removeEventListener("abort", abort);
      if (options.signal.aborted) this.cancel();
    }
    return { promise, a };
  }
  walkTo(x, z, options = {}) {
    const destination = valid(v(x, 0, z));
    const speed =
      options.speed ??
      this.config.personality.walkSpeed *
        (this.held || options.carry ? 0.7 : 1);
    if (!Number.isFinite(speed) || speed <= 0)
      throw new Error("Speed must be greater than zero");
    const { promise } = this.start(this.held ? "carry" : "walk", options);
    if (!this.active) return promise;
    this.motion.walkTo(destination);
    for (const s of [this.motion.step, ...this.motion.queue].filter(Boolean)) {
      if (s.kind === "walk") s.duration = Math.max(0.3, s.distance / speed);
      if (s.kind === "turn") s.duration = this.config.personality.turnTime;
    }
    if (!this.motion.busy) this.finish();
    return promise;
  }
  turnTo(direction, options = {}) {
    const yaw =
      typeof direction === "number"
        ? direction
        : Math.atan2(direction.x, direction.z);
    if (!Number.isFinite(yaw))
      throw new Error(
        "Direction must be a yaw in radians or an x/z direction vector",
      );
    const { promise, a } = this.start("turn", options);
    a.yaw = yaw;
    a.duration = options.duration ?? this.config.personality.turnTime;
    return promise;
  }
  pickUp(object, options = {}) {
    if (this.held) throw new Error("Free hand already holds an object");
    if (!object?.isObject3D || !object.parent)
      throw new Error("Object must be in a scene");
    const pos = object.getWorldPosition(v());
    if (
      Math.hypot(pos.x - this.root.position.x, pos.z - this.root.position.z) >
      1.05
    )
      throw new Error(
        "Walk within 1.05 units of the object before picking it up",
      );
    if (object === this.root || this.root.getObjectById(object.id))
      throw new Error("Cannot pick up a part of the bot");
    const { promise, a } = this.start("pickUp", options);
    a.object = object;
    a.position = pos;
    a.originalParent = object.parent;
    return promise;
  }
  place(x, y, z, options = {}) {
    const p = valid(v(x, y, z));
    if (!this.held) throw new Error("Nothing is being carried");
    if (
      Math.hypot(p.x - this.root.position.x, p.z - this.root.position.z) > 1.05
    )
      throw new Error("Walk within 1.05 units of the placement point first");
    const { promise, a } = this.start("place", options);
    a.object = this.held.object;
    a.position = p;
    return promise;
  }
  play(name, options = {}) {
    if (
      ![
        "idle",
        "build",
        "type",
        "inspect",
        "present",
        "beckon",
        "sweep",
        "throw",
        "celebrate",
        "react",
      ].includes(name)
    )
      throw new Error(`Use a dedicated method for action: ${name}`);
    if (
      options.duration !== undefined &&
      (!Number.isFinite(options.duration) || options.duration <= 0)
    )
      throw new Error("Duration must be positive");
    const { promise, a } = this.start(name, options);
    if (options.target) {
      a.target = valid(point(options.target, 0));
      a.yaw = Math.atan2(
        a.target.x - this.root.position.x,
        a.target.z - this.root.position.z,
      );
    }
    return promise;
  }
  emit(type, p, options) {
    this.effects?.emit(type, p ?? this.root.position, options);
  }
  carryCenter() {
    return this.root.localToWorld(
      v(
        -this.config.torso.width * 0.28,
        this.config.hipHeight + this.config.reach.carryHeight,
        this.config.reach.carryForward,
      ),
    );
  }
  update(dt) {
    if (this.disposed) return;
    dt = THREE.MathUtils.clamp(dt, 0, 0.05);
    this.clock += dt;
    this.dialogue.update(dt);
    const r = this.rig,
      a = this.active,
      personality = this.config.personality;
    this.root.position.y = 0;
    r.torso.position.x = 0;
    r.torso.position.z = 0;
    for (const leg of Object.values(r.legs)) {
      leg.hip.rotation.z = 0;
      leg.ankle.rotation.z = 0;
    }
    r.torso.scale.set(1, 1, 1);
    this.motion.update(dt);
    if (a) {
      a.time +=
        dt *
        (["walk", "carry", "turn"].includes(a.name) ? 1 : personality.tempo);
    }
    let crouch = 0,
      lean = 0,
      jump = 0,
      handTarget = null;
    if (a && a.yaw !== undefined) {
      const u = smooth(a.time / (a.name === "turn" ? a.duration : 0.45));
      this.root.rotation.y = a.fromYaw + angle(a.yaw, a.fromYaw) * u;
    }
    if (a) {
      const t = a.time,
        u = Math.min(t / a.duration, 1),
        phase = (t / a.duration) % 1,
        envelope = a.loop ? Math.min(1, t / 0.2) : Math.sin(Math.PI * u),
        energy = personality.energy;
      const shoulder = (side, x, z = 0) =>
        r.arms[side].shoulder.rotation.set(x, 0, z);
      if (a.name === "pickUp") {
        const rise = smooth((u - 0.46) / 0.45);
        crouch =
          ((0.62 * this.config.hipHeight) / 0.88) *
          (u < 0.46 ? smooth(u / 0.4) : 1 - rise);
        lean = (0.13 * crouch) / 0.55;
        handTarget = a.position.clone();
        if (u >= 0.46) handTarget.lerp(this.carryCenter(), rise);
        a.reach = u < 0.46 ? smooth(u / 0.32) : 1;
      }
      if (a.name === "pickUp") {
        const dip = u < 0.46 ? smooth(u / 0.4) : 1 - smooth((u - 0.46) / 0.45);
        r.torso.position.z = 0.24 * dip;
        r.torso.position.x = 0.2 * dip;
      }
      if (a.name === "place") {
        const lower = smooth(u / 0.48),
          rise = smooth((u - 0.55) / 0.4);
        crouch = ((0.62 * this.config.hipHeight) / 0.88) * lower * (1 - rise);
        lean = 0.13 * lower * (1 - rise);
        r.torso.position.z = 0.24 * lower * (1 - rise);
        r.torso.position.x = 0.2 * lower * (1 - rise);
        handTarget = this.carryCenter().lerp(a.position, lower);
        a.reach = 1 - rise;
      }
      if (a.name === "throw") {
        const wind = smooth(u / 0.52),
          release = smooth((u - 0.52) / 0.15);
        shoulder("right", u < 0.52 ? -2.8 * wind : -2.8 + 2.4 * release, -0.15);
        r.arms.right.elbow.rotation.x = -0.8 * (1 - release);
        shoulder("left", 0.25 * Math.sin(u * Math.PI), 0.2);
        lean = -0.16 * wind + 0.28 * release * (1 - smooth((u - 0.75) / 0.25));
        if (u >= 0.6 && !a.released) {
          a.released = true;
          r.root.updateMatrixWorld(true);
          a.options.onRelease?.();
        }
      }
      if (a.name === "build") {
        // Slow overhead wind-up, fast downward strike, recoil, then recovery.
        const wind = smooth(phase / 0.48),
          hit = smooth((phase - 0.48) / 0.13),
          recover = smooth((phase - 0.72) / 0.28);
        const swing =
          phase < 0.48
            ? THREE.MathUtils.lerp(-0.35, -2.9, wind)
            : THREE.MathUtils.lerp(-2.9, -0.32, hit);
        shoulder("right", THREE.MathUtils.lerp(swing, -0.35, recover), 0.08);
        r.arms.right.elbow.rotation.x =
          phase < 0.48 ? -0.55 * wind : -0.55 * (1 - hit);
        shoulder("left", -0.3 - 0.45 * wind * (1 - hit), -0.2);
        crouch = 0.24 * hit * (1 - recover);
        lean = -0.12 * wind * (1 - hit) + 0.6 * hit * (1 - recover);
        r.head.rotation.x = -lean * 0.35;
        const strike = Math.floor(t / a.duration - 0.61);
        if (strike >= 0 && strike !== a.lastStrike) {
          a.lastStrike = strike;
          const p =
            a.target ??
            this.root.localToWorld(
              v(0.24, 0.04, this.config.reach.strikeForward),
            );
          this.emit("construction", p, { scale: 0.7 });
        }
      }
      if (a.name === "type")
        for (const [i, side] of ["left", "right"].entries()) {
          shoulder(side, -0.9 + 0.1 * Math.sin(t * 16 + i * Math.PI));
          r.arms[side].elbow.rotation.x = -0.55;
        }
      if (a.name === "inspect") {
        const hold = smooth(u / 0.25) * (1 - smooth((u - 0.75) / 0.25));
        lean = 0.22 * hold;
        shoulder("right", -1.5 * hold);
        r.arms.right.elbow.rotation.x = -0.65 * hold;
      }
      if (a.name === "present") {
        shoulder("left", -0.8 * envelope, -0.8 * envelope);
        r.arms.left.elbow.rotation.x = -0.25 * envelope;
      }
      if (a.name === "beckon") {
        shoulder("left", -2.35 * envelope, -0.35 * envelope);
        r.arms.left.elbow.rotation.z = 0.4 * Math.sin(t * 12) * envelope;
      }
      if (a.name === "sweep") {
        crouch = 0.17 * envelope;
        lean = 0.2 * envelope;
        for (const side of ["left", "right"])
          shoulder(side, -0.55 * envelope, 0.5 * Math.sin(t * 5) * envelope);
        if (!this.trail && this.effects)
          this.trail = this.effects.startTrail(() =>
            this.root.localToWorld(
              v(Math.sin(this.clock * 5) * 0.45, 0.035, 0.65),
            ),
          );
      }
      if (a.name === "celebrate") {
        shoulder("left", -2.6 * Math.sin(Math.PI * u));
        shoulder("right", -2.6 * Math.sin(Math.PI * u));
        if (u < 0.2) crouch = 0.12 * Math.sin((Math.PI * u) / 0.4);
        else if (u < 0.7) {
          jump = 0.4 * Math.sin((Math.PI * (u - 0.2)) / 0.5);
        } else {
          crouch = 0.1 * Math.sin((Math.PI * (u - 0.7)) / 0.3);
          if (!a.fired.has("land")) {
            a.fired.add("land");
            this.emit("dust");
            this.emit("ring");
          }
        }
        if (u > 0.2 && !a.fired.has("burst")) {
          a.fired.add("burst");
          this.emit("confetti", this.root.localToWorld(v(0, 2.2, 0)));
        }
      }
      if (a.name === "react") {
        // Two clear, front-readable nods with a smaller second acknowledgement.
        const nod = Math.sin(u * Math.PI * 4) * Math.sin(u * Math.PI);
        r.head.rotation.x = 0.48 * nod;
        lean = 0.045 * Math.sin(Math.PI * u);
      }
      if (["walk", "carry"].includes(a.name)) {
        const bob = r.torso.position.y - this.config.hipHeight;
        r.torso.position.y += bob * (personality.bob - 1);
        if (a.name === "carry") r.torso.rotation.x += 0.025;
      }
    }
    if (!a || a.name === "idle")
      r.torso.rotation.z +=
        0.014 * Math.sin(this.clock * 0.7) * Math.sin(this.clock * 0.23);
    if (crouch || lean) {
      r.torso.position.y -= crouch;
      r.torso.rotation.x += lean;
      // Reuse the approved leg solver after torso changes, keeping feet grounded.
      r.root.updateMatrixWorld(true);
      for (const leg of Object.values(r.legs)) {
        const target = this.root.localToWorld(
          v(leg.side * this.config.torso.width * 0.26, 0.085, 0),
        );
        const local = r.torso.worldToLocal(target).sub(leg.hip.position);
        const angles = solveLeg(
          local.z,
          Math.hypot(local.x, local.y),
          this.config.limbs.thigh,
          this.config.limbs.shin,
        );
        leg.hip.rotation.order = "ZXY";
        leg.hip.rotation.z = Math.atan2(local.x, -local.y);
        leg.hip.rotation.x = angles.hip;
        leg.knee.rotation.x = angles.knee;
        leg.ankle.rotation.x = angles.ankle - r.torso.rotation.x;
        leg.ankle.rotation.z = -leg.hip.rotation.z;
      }
    }
    this.root.position.y = jump;
    r.root.updateMatrixWorld(true);
    if (a?.name === "build") {
      const phase = (a.time / a.duration) % 1;
      const strike =
        smooth((phase - 0.48) / 0.13) * (1 - smooth((phase - 0.72) / 0.28));
      const arm = r.arms.right;
      arm.hand.rotation.x =
        -arm.shoulder.rotation.x - arm.elbow.rotation.x - r.torso.rotation.x;
      r.root.updateMatrixWorld(true);
      const ground =
        a.target?.clone() ??
        this.root.localToWorld(v(0.24, 0.04, this.config.reach.strikeForward));
      const grip = ground.clone();
      grip.y += r.tool?.userData.tipHeight ?? 0.25;
      const initial = arm.hand.getWorldPosition(v());
      if (strike > 0) {
        armTo(r, arm, initial.lerp(grip, strike));
        arm.hand.rotateX(Math.PI * strike);
      }
    }
    if (handTarget) {
      const neutral = r.arms.left.hand.getWorldPosition(v());
      armTo(r, r.arms.left, neutral.lerp(handTarget, a.reach ?? 1));
    } else if (this.held) armTo(r, r.arms.left, this.carryCenter());
    r.root.updateMatrixWorld(true);
    if (a?.name === "pickUp" && a.time / a.duration >= 0.46 && !this.held) {
      r.arms.left.socket.attach(a.object);
      a.object.position.set(0, 0, 0);
      a.object.rotation.set(0, 0, 0);
      this.held = { object: a.object, parent: a.originalParent };
    }
    if (a?.name === "place" && a.time / a.duration >= 0.5 && this.held) {
      const held = this.held;
      held.parent.attach(held.object);
      held.object.position.copy(held.parent.worldToLocal(a.position.clone()));
      this.held = null;
      const box = new THREE.Box3().setFromObject(held.object),
        height = box.getSize(v()).y;
      this.impacts.push({
        object: held.object,
        scale: held.object.scale.clone(),
        position: held.object.position.clone(),
        height,
        time: 0,
      });
      const ground = a.position.clone();
      ground.y = box.min.y;
      this.emit("dust", ground);
      this.emit("ring", ground);
    }
    for (const impact of [...this.impacts]) {
      impact.time += dt;
      const k =
        Math.sin(Math.min(1, impact.time / 0.34) * Math.PI) *
        Math.exp(-impact.time * 5);
      impact.object.scale
        .copy(impact.scale)
        .multiply(v(1 + 0.18 * k, 1 - 0.3 * k, 1 + 0.18 * k));
      impact.object.position.y = impact.position.y - impact.height * 0.15 * k;
      if (impact.time >= 0.34) {
        impact.object.scale.copy(impact.scale);
        impact.object.position.copy(impact.position);
        this.impacts.splice(this.impacts.indexOf(impact), 1);
      }
    }
    if (this.transition) {
      const b = this.transition;
      b.time += dt;
      const k = smooth(b.time / 0.18);
      for (const p of b.poses) {
        p.node.quaternion.slerpQuaternions(p.q, p.node.quaternion.clone(), k);
        if (p.node === r.torso)
          p.node.position.lerpVectors(p.p, p.node.position.clone(), k);
      }
      this.root.position.y = THREE.MathUtils.lerp(b.y, this.root.position.y, k);
      if (k === 1) this.transition = null;
    }
    this.screen?.update(dt);
    if (a && this.active === a) {
      if (["walk", "carry"].includes(a.name)) {
        if (!this.motion.busy) this.finish();
      } else if (!a.loop && a.time >= a.duration) this.finish();
    }
  }
  dispose() {
    this.dialogue.dispose();
    this.cancel();
    if (this.held) {
      this.held.parent.attach(this.held.object);
      this.held = null;
    }
    for (const p of this.impacts) {
      p.object.scale.copy(p.scale);
      p.object.position.copy(p.position);
    }
    this.impacts = [];
    this.screen?.dispose();
    this.rig.dispose();
    this.listeners.clear();
    this.disposed = true;
  }
}
import { legAngles as solveLeg } from "./BotMotion.js";
export function createBot(config, options) {
  return new Bot(config, options);
}
