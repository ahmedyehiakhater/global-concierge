import { SpeechBubbles } from "./bots/index.js";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  createBot,
  BOT_PRESETS,
  BotEffects,
  EXPRESSIONS,
  EFFECTS,
} from "./bots/index.js";
import "./style.css";
const $ = (s) => document.querySelector(s),
  mount = $("#viewport");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#f1f3ef");
const camera = new THREE.OrthographicCamera(-7, 7, 4, -4, 0.1, 100);
camera.position.set(3.2, 6, 12);
camera.lookAt(0, 1, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
mount.append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa78b, 2.8));
const light = new THREE.DirectionalLight(0xfff7e6, 3.3);
light.position.set(-3, 7, 5);
light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
Object.assign(light.shadow.camera, {
  left: -10,
  right: 10,
  top: 8,
  bottom: -8,
});
light.shadow.normalBias = 0.025;
scene.add(light);
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: "#e9ece5", roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const effects = new BotEffects(scene),
  names = ["nour", "ellie", "omar", "priya", "sami"];
const bots = names.map((name, i) => {
  const bot = createBot(BOT_PRESETS[name], { effects });
  bot.root.position.set((i - 2) * 2.05, 0, 0);
  scene.add(bot.root);
  return bot;
});
const bubbles = new SpeechBubbles({ container: mount, camera });
bots.forEach((bot) => bubbles.track(bot));
const props = bots.map((bot, i) => {
  const p = new THREE.Mesh(
    new RoundedBoxGeometry(0.3, 0.3, 0.3, 3, 0.04),
    new THREE.MeshStandardMaterial({
      color: ["#c5a75c", "#72aab1", "#8f9caa", "#98b477", "#6083aa"][i],
      roughness: 0.8,
    }),
  );
  p.castShadow = true;
  p.position.set(bot.root.position.x, 0.15, 1.5);
  scene.add(p);
  return p;
});
const marker = new THREE.Mesh(
  new THREE.RingGeometry(0.59, 0.615, 64),
  new THREE.MeshBasicMaterial({ color: "#8fab70", side: THREE.DoubleSide }),
);
marker.rotation.x = -Math.PI / 2;
marker.position.y = 0.012;
scene.add(marker);
let selected = 3,
  walkingAway = bots.map(() => false),
  generations = bots.map(() => 0),
  sequenceId = 0;
const personalities = [
  "Bouncy",
  "Floaty",
  "Heavy & deliberate",
  "Quick & precise",
  "Brisk & steady",
];
const message = (text) => ($("#message").textContent = text);
function log(text) {
  const line = document.createElement("div");
  line.textContent = text;
  $("#log").prepend(line);
  while ($("#log").children.length > 5) $("#log").lastChild.remove();
}
for (const bot of bots)
  bot.onComplete(({ action, status }) =>
    log(`${bot.config.name} · ${action} · ${status}`),
  );
function select(index) {
  selected = index;
  $("#name").textContent = bots[index].config.name;
  $("#personality").textContent = personalities[index];
  [...$("#bots").children].forEach((b, i) =>
    b.classList.toggle("active", i === index),
  );
}
names.forEach((name, i) => {
  const button = document.createElement("button");
  button.textContent = BOT_PRESETS[name].name;
  button.style.setProperty("--bot", BOT_PRESETS[name].colors.body);
  button.onclick = () => select(i);
  $("#bots").append(button);
});
select(3);
const speed = () => Number($("#speed").value);
$("#speed").oninput = () =>
  ($("#speedValue").textContent = `${speed().toFixed(1)}×`);
async function delivery(i) {
  const token = ++generations[i],
    bot = bots[i],
    p = props[i];
  if (bot.held) {
    message("Place the carried parcel before another delivery.");
    return;
  }
  const pos = p.getWorldPosition(new THREE.Vector3());
  const next = async (promise) =>
    (await promise).status === "completed" && generations[i] === token;
  if (
    !(await next(
      bot.walkTo(pos.x, pos.z - bot.config.reach.approach, {
        speed: bot.config.personality.walkSpeed * speed(),
      }),
    ))
  )
    return;
  if (!(await next(bot.turnTo(0)))) return;
  if (!(await next(bot.pickUp(p)))) return;
  const z = pos.z > 0 ? -1.1 : 1.5;
  if (
    !(await next(
      bot.walkTo(pos.x, z - bot.config.reach.approach, {
        speed: bot.config.personality.walkSpeed * 0.7 * speed(),
      }),
    ))
  )
    return;
  if (!(await next(bot.turnTo(0)))) return;
  await next(bot.place(pos.x, 0.15, z));
}
async function action(name) {
  const i = selected,
    bot = bots[i];
  generations[i]++;
  sequenceId++;
  try {
    if (name === "walk") {
      walkingAway[i] = !walkingAway[i];
      await bot.walkTo((i - 2) * 2.05, walkingAway[i] ? -1.5 : 0, {
        speed: bot.config.personality.walkSpeed * speed(),
      });
    } else if (name === "turn")
      await bot.turnTo(bot.root.rotation.y + Math.PI / 2);
    else if (name === "delivery") await delivery(i);
    else if (name === "pickUp") await bot.pickUp(props[i]);
    else if (name === "place") {
      const p = bot.root.localToWorld(
        new THREE.Vector3(-0.2, 0.15, bot.config.reach.approach),
      );
      await bot.place(p.x, p.y, p.z);
    } else await bot.play(name);
  } catch (e) {
    message(e.message);
  }
}
for (const [name, label] of Object.entries({
  idle: "Idle",
  walk: "Walk",
  turn: "Turn 90°",
  delivery: "Pick → carry → place",
  pickUp: "Pick up",
  place: "Place",
  build: "Build ↻",
  type: "Type ↻",
  inspect: "Inspect",
  present: "Present",
  beckon: "Beckon",
  sweep: "Sweep ↻",
  celebrate: "Celebrate",
  react: "React",
})) {
  const b = document.createElement("button");
  b.textContent = label;
  b.dataset.action = name;
  b.onclick = () => action(name);
  $("#actions").append(b);
}
$("#cancel").onclick = () => {
  generations[selected]++;
  sequenceId++;
  bots[selected].cancel();
  message("Action cancelled. Any carried object stays safely attached.");
};
$("#stop").onclick = () => {
  generations[selected]++;
  sequenceId++;
  bots[selected].stop();
};
for (const expression of EXPRESSIONS) {
  const b = document.createElement("button");
  b.textContent = expression;
  b.onclick = () => {
    bots[selected].setExpression(expression);
    $("#graphic").value = "";
  };
  $("#expressions").append(b);
}
function graphic() {
  bots[selected].setStatus(
    $("#graphic").value || null,
    Number($("#progress").value),
  );
}
$("#graphic").onchange = graphic;
$("#progress").oninput = graphic;
for (const effect of EFFECTS) {
  const b = document.createElement("button");
  b.textContent = effect;
  b.onclick = () => {
    const p = bots[selected].root.position.clone();
    if (effect === "confetti") p.y = 1.8;
    const result = effects.emit(effect, p);
    if (effect === "dustTrail") setTimeout(() => result.stop(), 1500);
  };
  $("#effects").append(b);
}
$("#sequence").onclick = async () => {
  const token = ++sequenceId,
    a = bots[0],
    b = bots[3];
  message("Nour presents while Priya inspects, then both celebrate.");
  const first = await Promise.all([a.play("present"), b.play("inspect")]);
  if (token !== sequenceId || first.some((x) => x.status !== "completed"))
    return;
  a.setExpression("happy");
  b.setExpression("success");
  await Promise.all([a.play("celebrate"), b.play("celebrate")]);
};
$("#reset").onclick = () => {
  sequenceId++;
  bots.forEach((bot, i) => {
    generations[i]++;
    bot.dismissSpeech();
    bot.cancel();
    bot.transition = null;
    for (const hit of bot.impacts) {
      hit.object.scale.copy(hit.scale);
    }
    bot.impacts = [];
    if (bot.held) {
      scene.attach(bot.held.object);
      bot.held = null;
    }
    bot.root.position.set((i - 2) * 2.05, 0, 0);
    bot.root.rotation.set(0, 0, 0);
    bot.motion.reset(bot.root.position.clone());
    props[i].position.set((i - 2) * 2.05, 0.15, 1.5);
    props[i].rotation.set(0, 0, 0);
    props[i].scale.setScalar(1);
    bot.setExpression("neutral");
  });
  message("All bots reset.");
};
function resize() {
  const w = mount.clientWidth,
    h = mount.clientHeight,
    aspect = w / h,
    halfW = 6.25,
    halfH = Math.max(3.1, halfW / aspect);
  Object.assign(camera, {
    left: -halfH * aspect,
    right: halfH * aspect,
    top: halfH,
    bottom: -halfH,
  });
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
new ResizeObserver(resize).observe(mount);
resize();
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  bots.forEach((b) => b.update(dt));
  effects.update(dt);
  bubbles.update();
  marker.position.x = bots[selected].root.position.x;
  marker.position.z = bots[selected].root.position.z;
  $("#state").textContent = bots[selected].active?.name ?? "Idle";
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Demo-only pointer mapping; the effects library remains independent of the page.
let placingCloud = false;
const cloudButton = document.createElement("button");
cloudButton.className = "cloud-placement";
cloudButton.textContent = "Place a construction cloud";
cloudButton.onclick = () => {
  placingCloud = !placingCloud;
  cloudButton.classList.toggle("active", placingCloud);
  message(
    placingCloud
      ? "Click anywhere in the 3D view to build there."
      : "Cloud placement off.",
  );
  renderer.domElement.style.cursor = placingCloud ? "crosshair" : "";
};
mount.parentElement.append(cloudButton);
renderer.domElement.addEventListener("pointerdown", (event) => {
  if (!placingCloud) return;
  const rect = renderer.domElement.getBoundingClientRect();
  effects.emitAtScreen(
    "construction",
    {
      x: (2 * (event.clientX - rect.left)) / rect.width - 1,
      y: 1 - (2 * (event.clientY - rect.top)) / rect.height,
    },
    camera,
    { scale: 1.4 },
  );
});

// Conversations are demo choreography; the bot library only returns choice IDs.
const talkPanel = document.createElement("section");
talkPanel.className = "talk-panel";
const heading = document.createElement("div");
heading.className = "section-heading";
heading.textContent = "Talk to the user";
const speechInput = document.createElement("textarea");
speechInput.setAttribute("aria-label", "Bot message");
speechInput.rows = 2;
speechInput.value = "What would you like me to do next?";
const talkButtons = document.createElement("div");
talkButtons.className = "transport";
for (const [label, handler] of [
  [
    "Say message",
    () => {
      bots[selected].say(speechInput.value, { duration: 8 });
      message("Speech follows the bot for eight seconds.");
    },
  ],
  [
    "Ask with choices",
    async () => {
      const bot = bots[selected];
      const choice = await bot.ask(
        speechInput.value,
        [
          { id: "build", label: "Build something" },
          { id: "inspect", label: "Take a look" },
          { id: "later", label: "Not now" },
        ],
        { focus: true },
      );
      log(`${bot.config.name} · choice · ${choice ?? "dismissed"}`);
      message(`Returned to application: ${choice ?? "null (dismissed)"}`);
      if (choice === "build" || choice === "inspect") {
        bot.say(
          choice === "build" ? "On it. Let's build!" : "I'll take a look.",
          { duration: 4 },
        );
        bot.play(choice);
      }
    },
  ],
  ["Dismiss", () => bots[selected].dismissSpeech()],
]) {
  const button = document.createElement("button");
  button.textContent = label;
  button.onclick = () =>
    Promise.resolve()
      .then(handler)
      .catch((e) => message(e.message));
  talkButtons.append(button);
}
talkPanel.append(heading, speechInput, talkButtons);
document
  .querySelector("aside")
  .insertBefore(talkPanel, document.querySelector("#sequence"));
