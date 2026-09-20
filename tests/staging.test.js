import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  routeAround,
  pathsConflict,
  ReviewQueue,
} from "../src/opening/staging.js";
import { BriefHandoff } from "../src/opening/handoff.js";
import { createBot, BOT_PRESETS } from "../src/bots/index.js";
test("stage routes detour around occupied bot silhouettes and detect crossing traffic", () => {
  const start = { x: 80, y: 350 },
    end = { x: 720, y: 350 },
    obstacle = { x: 400, y: 350 };
  const path = routeAround(start, end, [obstacle], {
    left: 50,
    right: 750,
    top: 100,
    bottom: 600,
  });
  assert.ok(path.length > 1);
  assert.deepEqual(path.at(-1), end);
  let from = start;
  for (const to of path) {
    for (let t = 0; t <= 1; t += 0.02) {
      const x = from.x + (to.x - from.x) * t,
        y = from.y + (to.y - from.y) * t;
      assert.ok(Math.abs(x - 400) >= 72 || Math.abs(y - 350) >= 115);
    }
    from = to;
  }
  assert.equal(
    pathsConflict(
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
      { x: 100, y: 0 },
    ),
    true,
  );
  assert.equal(
    pathsConflict(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 200 },
      { x: 100, y: 200 },
    ),
    false,
  );
});
test("review queues preserve reviewer order without blocking construction; failures drain safely", async () => {
  const q = new ReviewQueue(),
    events = [];
  let release;
  const gate = new Promise((r) => (release = r));
  q.add(async () => {
    events.push("header review");
    await gate;
    events.push("header approved");
  });
  q.add(() => events.push("sidebar review"));
  await Promise.resolve();
  events.push("sidebar built");
  assert.deepEqual(events, ["header review", "sidebar built"]);
  release();
  await q.drain();
  assert.deepEqual(events, [
    "header review",
    "sidebar built",
    "header approved",
    "sidebar review",
  ]);
  const failed = new ReviewQueue();
  failed.add(() => {
    throw new DOMException("Reset", "AbortError");
  });
  await assert.rejects(failed.drain(), { name: "AbortError" });
});
test("brief stays at hand height, outside the torso, and transfers between grip sockets without a drop", () => {
  const bots = {
    nour: createBot(BOT_PRESETS.nour, { screen: false }),
    ellie: createBot(BOT_PRESETS.ellie, { screen: false }),
  };
  const scene = new THREE.Scene();
  Object.values(bots).forEach((b) => scene.add(b.root));
  bots.nour.root.position.x = -1;
  bots.ellie.root.position.x = 1;
  const prop = new THREE.Mesh(
    new THREE.PlaneGeometry(0.48, 0.6),
    new THREE.MeshBasicMaterial(),
  );
  scene.add(prop);
  const h = new BriefHandoff(bots, prop);
  h.attach("nour", "right");
  h.update();
  assert.equal(prop.parent, bots.nour.rig.arms.right.socket);
  const held = prop.getWorldPosition(new THREE.Vector3());
  assert.ok(held.y > 1);
  assert.ok(held.z > 0.35);
  const grip = new THREE.Vector3(0, 0.94, 0.45);
  h.reach.set("nour", { side: "right", target: grip });
  h.reach.set("ellie", { side: "left", target: grip });
  h.update();
  const before = prop.getWorldPosition(new THREE.Vector3());
  h.attach("ellie", "left");
  h.update();
  const after = prop.getWorldPosition(new THREE.Vector3());
  assert.equal(prop.parent, bots.ellie.rig.arms.left.socket);
  assert.ok(
    before.distanceTo(after) < 0.09,
    `transfer moved ${before.distanceTo(after)}`,
  );
  assert.ok(after.y > 1);
  assert.equal(bots.nour.rig.tool.visible, false);
  h.reach.clear();
  h.update();
  assert.equal(bots.nour.rig.tool.visible, true);
  h.clear(scene);
  assert.equal(prop.parent, scene);
  assert.equal(prop.visible, false);
  assert.equal(bots.nour.rig.tool.visible, true);
  Object.values(bots).forEach((b) => b.dispose());
  prop.geometry.dispose();
  prop.material.dispose();
});
