import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  ARTIFACTS,
  OWNERS,
  forOwner,
  artifactCard,
} from "../src/artifacts/catalog.js";
import { bindBotArtifacts } from "../src/artifacts/bindBots.js";
import { createBot, BOT_PRESETS } from "../src/bots/index.js";
test("every owner has a readable document and prop metadata resolves to the same version", () => {
  assert.equal(new Set(ARTIFACTS.map((a) => a.id)).size, ARTIFACTS.length);
  for (const o of OWNERS) {
    assert.ok(forOwner(o.id).length);
    for (const a of forOwner(o.id)) {
      assert.ok(a.sections.length);
      assert.equal(artifactCard(a.id).title, a.title);
      assert.equal(artifactCard(a.id).version, a.version);
      assert.match(a.status, /Draft/);
    }
  }
  assert.throws(() => artifactCard("missing"), /Unknown/);
});
test("robot ray hit opens its owner; disabled interaction and cleanup prevent activation", () => {
  const bot = createBot(BOT_PRESETS.priya, { screen: false });
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 1.2, 8);
  camera.lookAt(0, 1.2, 0);
  camera.updateMatrixWorld();
  bot.root.updateMatrixWorld(true);
  let enabled = true,
    opened = [];
  const handlers = {};
  const element = {
    style: {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500 }),
    addEventListener: (n, h) => (handlers[n] = h),
    removeEventListener: (n) => delete handlers[n],
  };
  const dispose = bindBotArtifacts({
    element,
    camera,
    bots: [bot],
    viewer: { open: (id) => opened.push(id) },
    enabled: () => enabled,
  });
  handlers.click({ clientX: 250, clientY: 250 });
  assert.deepEqual(opened, ["priya"]);
  enabled = false;
  handlers.click({ clientX: 250, clientY: 250 });
  assert.equal(opened.length, 1);
  dispose();
  assert.equal(Object.keys(handlers).length, 0);
  bot.dispose();
});
