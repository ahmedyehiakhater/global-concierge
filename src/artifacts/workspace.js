import * as THREE from "three";
import { createBot, BOT_PRESETS } from "../bots/index.js";
import { OWNERS } from "./catalog.js";
import { createArtifactViewer } from "./viewer.jsx";
import { bindBotArtifacts } from "./bindBots.js";
import "./workspace.css";
const stage = document.querySelector("#team-stage"),
  nav = document.querySelector("#team-roles");
const viewer = createArtifactViewer();
for (const o of OWNERS) {
  const button = document.createElement("button");
  const name = document.createElement("b"),
    role = document.createElement("span"),
    desc = document.createElement("small");
  name.textContent = o.name;
  role.textContent = o.role;
  desc.textContent = o.description;
  button.append(name, role, desc);
  button.onclick = () => viewer.open(o.id);
  nav.append(button);
}
const scene = new THREE.Scene();
scene.background = new THREE.Color("#ffffff");
const camera = new THREE.OrthographicCamera(-7, 7, 3.5, -3.5, 0.1, 100);
camera.position.set(0, 5, 13);
camera.lookAt(0, 1.2, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
stage.append(renderer.domElement);
renderer.domElement.setAttribute("aria-hidden", "true");
scene.add(new THREE.HemisphereLight(0xffffff, 0xb7bdc6, 2.8));
const light = new THREE.DirectionalLight(0xfff4df, 3);
light.position.set(-4, 8, 5);
scene.add(light);
const bots = OWNERS.map((o, i) => {
  const b = createBot(BOT_PRESETS[o.id]);
  b.root.position.set((i - 2) * 2.5, 0, 0);
  b.setExpression("happy");
  scene.add(b.root);
  return b;
});
const unbind = bindBotArtifacts({
  element: renderer.domElement,
  camera,
  bots,
  viewer,
});
const resize = () => {
  const w = stage.clientWidth,
    h = stage.clientHeight,
    halfW = 6.8,
    halfH = (halfW * h) / w;
  Object.assign(camera, {
    left: -halfW,
    right: halfW,
    top: halfH,
    bottom: -halfH,
  });
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
};
const observer = new ResizeObserver(resize);
observer.observe(stage);
resize();
let last = performance.now(),
  raf;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  bots.forEach((b) => b.update(dt));
  renderer.render(scene, camera);
  raf = requestAnimationFrame(frame);
}
raf = requestAnimationFrame(frame);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    unbind();
    viewer.dispose();
    bots.forEach((b) => b.dispose());
    renderer.dispose();
  });
