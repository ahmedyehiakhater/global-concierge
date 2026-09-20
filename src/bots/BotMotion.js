import * as THREE from "three";
const clamp = THREE.MathUtils.clamp;
const smooth = (t) => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};
const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const down = v(0, -1, 0);
const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const lerp = THREE.MathUtils.lerp;

/** Analytic 2-bone leg solve. Downward chains bend knees forward. */
export function legAngles(z, drop, a, b) {
  const distance = clamp(Math.hypot(z, drop), 0.025, a + b - 0.0001);
  const hip =
    Math.atan2(-z, drop) -
    Math.acos(
      clamp((a * a + distance * distance - b * b) / (2 * a * distance), -1, 1),
    );
  const knee =
    Math.PI -
    Math.acos(
      clamp((a * a + b * b - distance * distance) / (2 * a * b), -1, 1),
    );
  return { hip, knee, ankle: -hip - knee };
}
/** Stance speed exactly cancels root travel; swing returns foot to next contact. */
export function footCycle(phase) {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.6) return { z: 0.315 - p * 1.05, lift: 0, stance: true };
  const s = (p - 0.6) / 0.4;
  return {
    z: lerp(-0.315, 0.315, smooth(s)),
    lift: 0.17 * Math.sin(Math.PI * s),
    stance: false,
  };
}
export function armTo(rig, arm, target) {
  rig.root.updateMatrixWorld(true);
  const parent = arm.shoulder.parent;
  const local = parent.worldToLocal(target.clone()).sub(arm.shoulder.position);
  const a = rig.config.limbs.upperArm,
    b = rig.config.limbs.forearm;
  const d = clamp(local.length(), 0.015, a + b - 0.001),
    dir = local.clone().normalize();
  const along = (a * a + d * d - b * b) / (2 * d),
    height = Math.sqrt(Math.max(0, a * a - along * along));
  // Bend elbow down/back rather than bowing out through the object.
  let bend = v(0, -1, -0.35);
  bend.addScaledVector(dir, -bend.dot(dir));
  if (bend.lengthSq() < 0.001) bend = v(0, 0, -1);
  bend.normalize();
  const elbow = dir.clone().multiplyScalar(along).addScaledVector(bend, height);
  arm.shoulder.quaternion.setFromUnitVectors(down, elbow.clone().normalize());
  const fore = dir
    .multiplyScalar(d)
    .sub(elbow)
    .applyQuaternion(arm.shoulder.quaternion.clone().invert())
    .normalize();
  arm.elbow.quaternion.setFromUnitVectors(down, fore);
  rig.root.updateMatrixWorld(true);
  const desired = rig.root.getWorldQuaternion(new THREE.Quaternion());
  const parentQ = arm.hand.parent.getWorldQuaternion(new THREE.Quaternion());
  arm.hand.quaternion.copy(parentQ.invert().multiply(desired));
}

/** Renderer-independent finite-state motion controller. Call update(deltaSeconds).
 * Object3D props attach to the right-hand socket while carried.
 */
export class BotMotion {
  constructor(rig, { onStateChange = () => {} } = {}) {
    this.rig = rig;
    this.onStateChange = onStateChange;
    this.queue = [];
    this.step = null;
    this.elapsed = 0;
    this.clock = 0;
    this.distance = 0;
    this.held = null;
    this.prop = null;
    this.busy = false;
    this.state = "idle";
    this.lastYaw = rig.root.rotation.y;
    this.headYaw = 0;
    this.impact = null;
  }
  notify(state) {
    this.state = state;
    this.onStateChange(state);
  }
  idle() {
    if (this.busy) return false;
    this.queue = [];
    this.step = null;
    this.notify("idle");
    return true;
  }
  walkTo(point) {
    if (this.busy) return false;
    this.busy = true;
    this.queue = this.route(
      this.rig.root.position.clone(),
      point.clone(),
      this.held ? "carrying" : "walking",
    );
    this.next();
    return true;
  }
  route(from, to, label) {
    const delta = to.clone().sub(from);
    delta.y = 0;
    const dist = delta.length();
    if (dist < 0.04) return [];
    const dir = delta.normalize(),
      yaw = Math.atan2(dir.x, dir.z),
      end = to.clone().addScaledVector(dir, 0.065);
    return [
      { kind: "turn", duration: 0.4, yaw },
      { kind: "anticipate", duration: 0.38 },
      {
        kind: "walk",
        label,
        duration: Math.max(0.7, dist / 1.05),
        from: from.clone(),
        to: end,
        dir,
        distance: dist + 0.065,
      },
      { kind: "settle", duration: 0.45, from: end, to: to.clone() },
    ];
  }
  fetchAndPlace(prop, destination) {
    if (this.busy || this.held) return false;
    this.busy = true;
    this.prop = prop;
    const original = prop.getWorldPosition(v());
    const pickup = original.clone();
    pickup.y = 0;
    pickup.z -= 0.61;
    const target = destination.clone();
    const drop = target.clone();
    drop.y = 0;
    drop.z -= 0.61;
    this.queue = [
      ...this.route(this.rig.root.position.clone(), pickup, "walking"),
      { kind: "turn", duration: 0.3, yaw: 0 },
      { kind: "pick", duration: 1.65, prop, objectPosition: original.clone() },
      ...this.route(pickup, drop, "carrying"),
      { kind: "turn", duration: 0.35, yaw: 0 },
      { kind: "place", duration: 1.65, prop, objectPosition: target.clone() },
    ];
    this.next();
    return true;
  }
  next() {
    this.step = this.queue.shift() ?? null;
    this.elapsed = 0;
    if (!this.step) {
      this.busy = false;
      this.notify(this.held ? "holding" : "idle");
      return;
    }
    if (this.step.kind === "turn") this.step.fromYaw = this.rig.root.rotation.y;
    if (this.step.kind === "walk") this.step.baseDistance = this.distance;
    this.notify(this.step.label ?? this.step.kind);
  }
  reset(position) {
    this.queue = [];
    this.step = null;
    this.busy = false;
    this.held = null;
    this.prop = null;
    this.impact = null;
    this.distance = 0;
    this.headYaw = 0;
    this.rig.root.position.copy(position);
    this.rig.root.rotation.set(0, 0, 0);
    this.lastYaw = 0;
    this.notify("idle");
    this.update(0);
  }
  update(dt) {
    dt = clamp(dt, 0, 0.05);
    this.clock += dt;
    this.elapsed += dt;
    const r = this.rig,
      step = this.step;
    let walkWeight = 0,
      crouch = 0,
      lean = 0,
      reach = 0,
      gripCenter = null;
    let phase = this.distance / (1.05 * (r.config.strideScale ?? 1));
    if (step) {
      const u = clamp(this.elapsed / step.duration, 0, 1);
      if (step.kind === "turn")
        r.root.rotation.y =
          step.fromYaw + angleDiff(step.yaw, step.fromYaw) * smooth(u);
      if (step.kind === "anticipate") {
        crouch = 0.055 * Math.sin(Math.PI * u);
        lean = -0.07 * Math.sin(Math.PI * u);
      }
      if (step.kind === "walk") {
        // Smooth acceleration/deceleration; gait phase is driven by traveled distance.
        const progress = u - Math.sin(2 * Math.PI * u) / (2 * Math.PI);
        r.root.position.lerpVectors(step.from, step.to, progress);
        this.distance = step.baseDistance + step.distance * progress;
        phase = this.distance / (1.05 * (r.config.strideScale ?? 1));
        walkWeight = Math.min(smooth(u / 0.12), smooth((1 - u) / 0.14));
        lean = 0.045 * walkWeight;
      }
      if (step.kind === "settle") {
        const decay = Math.exp(-7 * u) * Math.cos(9 * u);
        r.root.position
          .copy(step.to)
          .add(step.from.clone().sub(step.to).multiplyScalar(decay));
        if (u === 1) r.root.position.copy(step.to);
        lean = -0.035 * Math.sin(Math.PI * u) * Math.exp(-2 * u);
      }
      if (step.kind === "pick") {
        if (u < 0.46) {
          crouch = 0.55 * smooth(u / 0.4);
          reach = smooth(u / 0.32);
          gripCenter = step.objectPosition.clone();
        } else {
          const rise = smooth((u - 0.46) / 0.45);
          crouch = 0.55 * (1 - rise);
          reach = 1;
          gripCenter = step.objectPosition
            .clone()
            .lerp(this.carryCenter(), rise);
        }
        lean = (0.13 * crouch) / 0.55;
      }
      if (step.kind === "place") {
        const lower = smooth(u / 0.48);
        crouch = 0.55 * lower;
        reach = 1;
        gripCenter = this.carryCenter().lerp(step.objectPosition, lower);
        lean = 0.13 * lower;
        if (u > 0.55) {
          const rise = smooth((u - 0.55) / 0.4);
          crouch = 0.55 * (1 - rise);
          lean = 0.13 * (1 - rise);
          reach = 1 - rise;
          gripCenter = step.objectPosition.clone();
        }
      }
    }
    const breathe = Math.sin(this.clock * 2.1) * 0.009;
    const bob = walkWeight * 0.024 * Math.cos(phase * Math.PI * 4);
    r.torso.position.y =
      r.config.hipHeight + breathe * (1 - walkWeight) - crouch + bob;
    r.torso.rotation.x = lean;
    r.torso.rotation.z = walkWeight * 0.018 * Math.sin(phase * Math.PI * 2);
    r.root.updateMatrixWorld(true);
    // Feet targets are world-space ground points. Torso bob/crouch is absorbed by IK.
    for (const [name, leg] of Object.entries(r.legs)) {
      const sample = footCycle(phase + (name === "left" ? 0.5 : 0));
      const p = v(
        leg.side * r.config.torso.width * 0.26,
        0.085,
        sample.z * walkWeight * (r.config.strideScale ?? 1),
      );
      p.applyMatrix4(r.root.matrixWorld);
      p.y = 0.085 + sample.lift * walkWeight * (r.config.strideScale ?? 1);
      const target = r.torso.worldToLocal(p).sub(leg.hip.position);
      const a = legAngles(
        target.z,
        -target.y,
        r.config.limbs.thigh,
        r.config.limbs.shin,
      );
      leg.hip.rotation.x = a.hip;
      leg.knee.rotation.x = a.knee;
      leg.ankle.rotation.x = a.ankle - lean;
    }
    for (const [name, arm] of Object.entries(r.arms)) {
      const sign = name === "right" ? 1 : -1;
      arm.shoulder.rotation.set(
        walkWeight * 0.48 * Math.sin(phase * Math.PI * 2) * sign,
        0,
        sign * 0.045,
      );
      arm.elbow.rotation.set(-0.08 - 0.1 * walkWeight, 0, 0);
      arm.hand.rotation.set(0, 0, 0);
    }
    if (this.held && !gripCenter) {
      reach = 1;
      gripCenter = this.carryCenter();
    }
    if (gripCenter && reach > 0) {
      r.root.updateMatrixWorld(true);
      for (const arm of Object.values(r.arms)) {
        const neutral = arm.hand.getWorldPosition(v());
        const offset = v(arm.side * 0.18, 0, 0).applyQuaternion(
          r.root.quaternion,
        );
        const target = gripCenter.clone().add(offset);
        armTo(r, arm, neutral.lerp(target, reach));
      }
    }
    // Small head follow-through during turning, plus pitch settling after body motion.
    const yaw = r.root.rotation.y,
      angular = angleDiff(yaw, this.lastYaw);
    this.lastYaw = yaw;
    this.headYaw -= angular;
    this.headYaw = THREE.MathUtils.damp(this.headYaw, 0, 7, dt);
    r.head.rotation.y = clamp(this.headYaw, -0.28, 0.28);
    r.head.rotation.x = THREE.MathUtils.damp(
      r.head.rotation.x,
      -lean * 0.6 + Math.sin(this.clock * 1.1) * 0.012,
      7,
      dt,
    );
    r.root.updateMatrixWorld(true);
    if (
      step?.kind === "pick" &&
      !this.held &&
      this.elapsed / step.duration >= 0.46
    ) {
      r.arms.right.socket.attach(step.prop);
      this.held = step.prop;
      step.prop.position.set(-0.18, 0, 0);
      step.prop.rotation.set(0, 0, 0);
    }
    if (
      step?.kind === "place" &&
      this.held &&
      this.elapsed / step.duration >= 0.5
    ) {
      const sceneParent = r.root.parent;
      sceneParent.attach(step.prop);
      step.prop.position.copy(step.objectPosition);
      step.prop.rotation.set(0, r.root.rotation.y, 0);
      this.held = null;
      this.impact = {
        prop: step.prop,
        time: 0,
        position: step.objectPosition.clone(),
      };
    }
    if (this.impact) {
      const hit = this.impact;
      hit.time += dt;
      const k =
        Math.sin(Math.min(1, hit.time / 0.34) * Math.PI) *
        Math.exp(-hit.time * 5);
      hit.prop.scale.set(1 + 0.18 * k, 1 - 0.3 * k, 1 + 0.18 * k);
      hit.prop.position.y = hit.position.y - 0.18 * 0.3 * k;
      if (hit.time >= 0.34) {
        hit.prop.scale.setScalar(1);
        hit.prop.position.copy(hit.position);
        this.impact = null;
      }
    }
    if (step && this.elapsed >= step.duration) this.next();
  }
  carryCenter() {
    return v(0, 1.05, 0.56)
      .applyQuaternion(this.rig.root.quaternion)
      .add(this.rig.root.position);
  }
}
