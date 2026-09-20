import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  buildBot,
  BOT_PRESETS,
  BotMotion,
  legAngles,
  footCycle,
} from "../src/bots/index.js";
test("one builder creates all configurations with complete pivot hierarchy", () => {
  for (const config of Object.values(BOT_PRESETS)) {
    const b = buildBot(config);
    assert.equal(b.vest.parent, b.torso);
    for (const side of ["left", "right"]) {
      assert.equal(b.arms[side].elbow.parent, b.arms[side].shoulder);
      assert.equal(b.legs[side].knee.parent, b.legs[side].hip);
      assert.equal(b.arms[side].socket.parent, b.arms[side].hand);
    }
    b.dispose();
  }
});
test("leg IK reconstructs grounded targets without stretching", () => {
  for (const z of [-0.3, 0, 0.3]) {
    const a = 0.43,
      b = 0.43,
      d = 0.76;
    const r = legAngles(z, d, a, b);
    assert.ok(
      Math.abs(-a * Math.sin(r.hip) - b * Math.sin(r.hip + r.knee) - z) < 1e-6,
    );
    assert.ok(
      Math.abs(a * Math.cos(r.hip) + b * Math.cos(r.hip + r.knee) - d) < 1e-6,
    );
  }
});
test("feet alternate stance and swing; stance cancels root displacement", () => {
  assert.equal(footCycle(0.2).stance, true);
  assert.equal(footCycle(0.7).stance, false);
  assert.ok(footCycle(0.7).lift > 0);
  assert.ok(Math.abs(footCycle(0.3).z - footCycle(0.2).z + 0.105) < 1e-9);
});
function advance(m, n = 1600) {
  for (let i = 0; i < n; i++) m.update(1 / 60);
}
test("walk completes at requested point and all transforms remain finite", () => {
  const b = buildBot(BOT_PRESETS.priya);
  const scene = new THREE.Scene();
  scene.add(b.root);
  const m = new BotMotion(b);
  m.walkTo(new THREE.Vector3(2, 0, 0));
  assert.equal(m.walkTo(new THREE.Vector3()), false);
  advance(m);
  assert.ok(b.root.position.distanceTo(new THREE.Vector3(2, 0, 0)) < 0.001);
  assert.equal(m.busy, false);
  b.root.traverse((o) => assert.ok(o.matrix.elements.every(Number.isFinite)));
  b.dispose();
});
test("pickup attaches to hand and placement releases at destination", () => {
  const b = buildBot(BOT_PRESETS.priya),
    scene = new THREE.Scene();
  scene.add(b.root);
  const prop = new THREE.Group();
  scene.add(prop);
  prop.position.set(-1, 0.18, 1);
  const target = new THREE.Vector3(1, 0.18, 1);
  let attached = false;
  const m = new BotMotion(b);
  m.fetchAndPlace(prop, target);
  for (let i = 0; i < 2400; i++) {
    m.update(1 / 60);
    if (prop.parent === b.arms.right.socket) attached = true;
  }
  assert.ok(attached);
  assert.equal(prop.parent, scene);
  assert.ok(prop.position.distanceTo(target) < 0.001);
  assert.equal(m.held, null);
  assert.equal(m.busy, false);
  assert.equal(prop.scale.y, 1);
  b.dispose();
});
