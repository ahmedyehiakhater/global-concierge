import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  createBot,
  BOT_PRESETS,
  BotEffects,
  BotScreen,
  EXPRESSIONS,
  STATUS_GRAPHICS,
} from "../src/bots/index.js";
const step = (bots, effects, n = 600) => {
  for (let i = 0; i < n; i++) {
    for (const bot of bots) bot.update(1 / 60);
    effects?.update(1 / 60);
  }
};
function setup(name = "priya") {
  const scene = new THREE.Scene(),
    effects = new BotEffects(scene),
    bot = createBot(BOT_PRESETS[name], { effects, screen: false });
  scene.add(bot.root);
  return { scene, effects, bot };
}
function finite(bot) {
  bot.root.traverse((n) =>
    assert.ok(
      [...n.position, ...n.quaternion, ...n.scale].every(Number.isFinite),
      n.name,
    ),
  );
}
test("all presets have permanent tools and finish finite actions without changing part dimensions", async () => {
  for (const name of Object.keys(BOT_PRESETS)) {
    const { bot, effects } = setup(name),
      tool = bot.rig.tool;
    assert.equal(tool.parent, bot.rig.arms.right.socket);
    for (const action of [
      "inspect",
      "present",
      "beckon",
      "celebrate",
      "react",
    ]) {
      const promise = bot.play(action);
      step([bot], effects, 240);
      assert.equal((await promise).status, "completed");
      finite(bot);
      assert.equal(tool.parent, bot.rig.arms.right.socket);
    }
    for (const action of ["idle", "build", "type", "sweep"]) {
      const p = bot.play(action);
      step([bot], effects, 180);
      assert.ok(bot.active);
      bot.stop();
      assert.equal((await p).status, "completed");
    }
    step([bot], effects, 120);
    assert.equal(effects.emitters.size, 0);
    bot.dispose();
    effects.dispose();
  }
});
test("walking supports all floor directions, per-call speed, and visible turns", async () => {
  const { bot } = setup();
  for (const [x, z] of [
    [2, 0],
    [2, -2],
    [-2, -2],
    [0, 0],
  ]) {
    const p = bot.walkTo(x, z, { speed: 1.4 });
    step([bot], null, 600);
    assert.equal((await p).status, "completed");
    assert.ok(bot.root.position.distanceTo(new THREE.Vector3(x, 0, z)) < 1e-5);
  }
  const p = bot.turnTo(Math.PI);
  bot.update(0.05);
  assert.notEqual(bot.root.rotation.y, Math.PI);
  step([bot], null, 60);
  await p;
  const slow = bot.walkTo(3, 0, { speed: 0.5 });
  const duration = bot.motion.queue.find((s) => s.kind === "walk").duration;
  bot.cancel();
  await slow;
  const fast = bot.walkTo(3, 0, { speed: 2 });
  assert.ok(
    bot.motion.queue.find((s) => s.kind === "walk").duration < duration,
  );
  bot.cancel();
  await fast;
  assert.throws(() => bot.walkTo(1, 0, { speed: 0 }));
  bot.dispose();
});
test("cancel resolves old promises, can chain, supports AbortSignal and simultaneous bots", async () => {
  const a = setup().bot,
    b = setup("nour").bot;
  const old = a.play("build");
  step([a, b], null, 40);
  const next = a.play("react");
  assert.equal((await old).status, "cancelled");
  step([a, b], null, 120);
  await next;
  const controller = new AbortController(),
    p = a.walkTo(5, 2, { signal: controller.signal });
  controller.abort();
  assert.equal((await p).status, "cancelled");
  assert.equal(a.active, null);
  const ps = [a.play("celebrate"), b.play("inspect")];
  step([a, b], null, 300);
  assert.deepEqual(
    (await Promise.all(ps)).map((r) => r.status),
    ["completed", "completed"],
  );
  a.dispose();
  b.dispose();
});
test("free hand picks, carries in multiple directions and releases; tool stays attached", async () => {
  const { bot, scene, effects } = setup();
  const prop = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshBasicMaterial(),
  );
  prop.position.set(0, 0.15, 0.62);
  scene.add(prop);
  const tool = bot.rig.tool,
    pick = bot.pickUp(prop);
  step([bot], effects, 150);
  await pick;
  assert.equal(prop.parent, bot.rig.arms.left.socket);
  assert.equal(tool.parent, bot.rig.arms.right.socket);
  const walk = bot.walkTo(2, -1);
  step([bot], effects, 500);
  await walk;
  const turn = bot.turnTo(0);
  step([bot], effects, 80);
  await turn;
  const place = bot.place(2, 0.15, -0.38);
  step([bot], effects, 200);
  await place;
  assert.equal(prop.parent, scene);
  assert.ok(prop.position.distanceTo(new THREE.Vector3(2, 0.15, -0.38)) < 1e-6);
  assert.equal(bot.held, null);
  assert.ok(prop.scale.distanceTo(new THREE.Vector3(1, 1, 1)) < 1e-10);
  assert.equal(tool.parent, bot.rig.arms.right.socket);
  bot.dispose();
  effects.dispose();
});
test("cancel while carrying preserves attachment; disposing preserves external prop", async () => {
  const { bot, scene } = setup();
  const prop = new THREE.Object3D();
  prop.position.set(0, 0.15, 0.62);
  scene.add(prop);
  const p = bot.pickUp(prop);
  step([bot], null, 60);
  bot.cancel();
  assert.equal((await p).status, "cancelled");
  assert.equal(prop.parent, bot.rig.arms.left.socket);
  bot.dispose();
  assert.equal(prop.parent, scene);
});
test("effects are bounded, expire, and stopped trails emit no new particles", () => {
  const scene = new THREE.Scene(),
    fx = new BotEffects(scene, { maxParticles: 30 });
  for (const effect of [
    "dust",
    "sparks",
    "ring",
    "confetti",
    "error",
    "success",
  ])
    fx.emit(effect, new THREE.Vector3());
  assert.ok(fx.items.length <= 30);
  const trail = fx.emit("dustTrail", new THREE.Vector3());
  fx.update(0.1);
  trail.stop();
  for (let i = 0; i < 200; i++) fx.update(0.016);
  assert.equal(fx.items.length, 0);
  assert.equal(fx.emitters.size, 0);
  fx.dispose();
  assert.equal(scene.children.length, 0);
});
test("screen expressions/status are independent, immediate, blink and dispose cleanly", () => {
  let draws = 0;
  const ctx = new Proxy(
    {},
    {
      get: (_, key) => (key === "fillRect" ? () => draws++ : () => {}),
      set: () => true,
    },
  );
  const canvasFactory = () => ({ getContext: () => ctx });
  const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new THREE.MeshBasicMaterial(),
    ),
    original = mesh.material;
  const s = new BotScreen(mesh, { canvasFactory, random: () => 0 });
  for (const e of EXPRESSIONS) s.setExpression(e);
  for (const name of STATUS_GRAPHICS) s.setStatus(name, 75);
  assert.ok(draws >= 12);
  s.setStatus("progress", 200);
  assert.equal(s.progress, 100);
  s.setExpression("happy");
  assert.equal(s.status, null);
  s.update(2.01);
  assert.ok(s.blinkEnd > s.time);
  assert.throws(() => s.setExpression("bogus"));
  s.dispose();
  assert.equal(mesh.material, original);
});
test("automatic effects fire at strikes, release and landing, and loops clean up", async () => {
  const { bot, effects } = setup();
  const events = [];
  const original = effects.emit.bind(effects);
  effects.emit = (type, p, o) => {
    events.push(type);
    return original(type, p, o);
  };
  const build = bot.play("build");
  step([bot], effects, 160);
  bot.stop();
  await build;
  assert.ok(events.includes("dust") && events.includes("sparks"));
  events.length = 0;
  const celebrate = bot.play("celebrate");
  step([bot], effects, 180);
  await celebrate;
  assert.ok(
    events.includes("confetti") &&
      events.includes("ring") &&
      events.includes("dust"),
  );
  const sweep = bot.play("sweep");
  step([bot], effects, 30);
  assert.equal(effects.emitters.size, 1);
  bot.cancel();
  await sweep;
  assert.equal(effects.emitters.size, 0);
  bot.dispose();
  effects.dispose();
});

test("cartoon screens fit within every head with a generous shell border", () => {
  for (const key of Object.keys(BOT_PRESETS)) {
    const { bot } = setup(key),
      r = bot.rig;
    r.screenMesh.geometry.computeBoundingBox();
    const size = r.screenMesh.geometry.boundingBox.getSize(new THREE.Vector3());
    assert.ok(size.x < r.config.head.width * 0.7);
    assert.ok(size.y < r.config.head.height * 0.6);
    assert.ok(r.config.head.height > r.config.torso.height);
    bot.dispose();
  }
});
test("build winds overhead and strikes down; react nods without raising arms", () => {
  const { bot } = setup();
  bot.play("build");
  let raised = 0,
    lowered = -10,
    lowest = 5;
  for (let i = 0; i < 100; i++) {
    bot.update(1 / 60);
    raised = Math.min(raised, bot.rig.arms.right.shoulder.rotation.x);
    lowered = Math.max(lowered, bot.rig.arms.right.shoulder.rotation.x);
    lowest = Math.min(lowest, bot.rig.torso.position.y);
  }
  assert.ok(raised < -2.7);
  assert.ok(lowered > -0.5);
  assert.ok(lowest < bot.config.hipHeight - 0.2);
  bot.stop();
  step([bot], null, 20);
  bot.play("react");
  let lo = 1,
    hi = -1,
    arms = 0;
  for (let i = 0; i < 70; i++) {
    bot.update(1 / 60);
    lo = Math.min(lo, bot.rig.head.rotation.x);
    hi = Math.max(hi, bot.rig.head.rotation.x);
    arms = Math.max(arms, Math.abs(bot.rig.arms.right.shoulder.rotation.x));
  }
  assert.ok(hi - lo > 0.6);
  assert.ok(arms < 0.1);
  bot.dispose();
});
test("construction effect can be placed from screen coordinates without a bot", () => {
  const scene = new THREE.Scene(),
    fx = new BotEffects(scene),
    camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
  camera.position.set(0, 6, 8);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  const p = fx.emitAtScreen("construction", { x: 0.3, y: 0 }, camera);
  assert.ok(p);
  assert.ok(Math.abs(p.y) < 1e-8);
  assert.ok(p.x > 1);
  assert.ok(fx.items.length >= 40);
  assert.ok(
    fx.items.filter((p) => p.type === "dust").every((p) => p.size > 0.3),
  );
  fx.dispose();
});
test("angry expression instantly fills the screen red and preserves status independence", () => {
  const fills = [];
  let fillStyle;
  const ctx = new Proxy(
    {},
    {
      get: (_, key) =>
        key === "fillRect" ? () => fills.push(fillStyle) : () => {},
      set: (_, key, value) => {
        if (key === "fillStyle") fillStyle = value;
        return true;
      },
    },
  );
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(),
    new THREE.MeshBasicMaterial(),
  );
  const s = new BotScreen(mesh, {
    canvasFactory: () => ({ getContext: () => ctx }),
  });
  s.setExpression("angry");
  assert.equal(fills.at(-1), "#af162e");
  s.setStatus("progress", 40);
  assert.equal(fills.at(-2), "#080b0e");
  s.setStatus(null);
  assert.equal(fills.at(-1), "#af162e");
  s.dispose();
});

test("soft-body pickup reaches the prop before attachment on every preset", () => {
  for (const name of Object.keys(BOT_PRESETS)) {
    const { bot, scene } = setup(name),
      object = new THREE.Object3D();
    object.position.set(0, 0.15, bot.config.reach.approach);
    scene.add(object);
    bot.pickUp(object);
    while (bot.active.time / bot.active.duration < 0.45) bot.update(1 / 240);
    const hand = bot.rig.arms.left.hand.getWorldPosition(new THREE.Vector3());
    assert.ok(
      hand.distanceTo(object.position) < 0.025,
      `${name}: hand missed prop`,
    );
    for (const leg of Object.values(bot.rig.legs)) {
      const ankle = leg.ankle.getWorldPosition(new THREE.Vector3());
      assert.ok(
        Math.abs(ankle.y - 0.085) < 0.025,
        `${name}: planted foot lifted`,
      );
    }
    bot.dispose();
  }
});
test("vest is a curved torso wrap with two bands and no box panels", () => {
  for (const name of Object.keys(BOT_PRESETS)) {
    const { bot } = setup(name);
    assert.equal(bot.rig.vest.parent, bot.rig.torso);
    assert.deepEqual(
      bot.rig.vest.children.map((n) => n.name),
      ["vest-wrap", "reflective-band", "reflective-band"],
    );
    for (const part of bot.rig.vest.children) {
      assert.equal(part.geometry.type, "BufferGeometry");
      assert.ok(part.geometry.attributes.position.count > 500);
    }
    assert.equal(bot.rig.neck.children.length, 1); // head only; no exposed neck cylinder
    bot.dispose();
  }
});

test("throw releases once after wind-up for every rig, and cancelled wind-up never releases", async () => {
  for (const name of Object.keys(BOT_PRESETS)) {
    const { bot, effects } = setup(name);
    let releases = 0;
    const action = bot.play("throw", { onRelease: () => releases++ });
    step([bot], effects, 10);
    assert.equal(releases, 0);
    step([bot], effects, 160);
    await action;
    assert.equal(releases, 1);
    finite(bot);
    const controller = new AbortController();
    const cancelled = bot.play("throw", {
      signal: controller.signal,
      onRelease: () => releases++,
    });
    const result = cancelled.catch((e) => e);
    controller.abort();
    step([bot], effects, 100);
    await result;
    assert.equal(releases, 1);
    bot.dispose();
    effects.dispose();
  }
});
