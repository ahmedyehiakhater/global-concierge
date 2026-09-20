import * as THREE from "three";
import { createBot, BOT_PRESETS, SpeechBubbles } from "../bots/index.js";
import "./style.css";
const stage = document.querySelector("#stage"),
  reset = document.querySelector("#reset"),
  start = document.querySelector("#start"),
  hint = document.querySelector("#hint");
try {
  init();
} catch (error) {
  const fallback = document.querySelector("#fallback");
  fallback.hidden = false;
  fallback.textContent =
    "The 3D scene could not start. Please reload this page.";
  console.error(error);
}
function init() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("white");
  const camera = new THREE.OrthographicCamera(-6, 6, 4, -4, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  stage.prepend(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb7bdc6, 2.8));
  const light = new THREE.DirectionalLight(0xfff4df, 3);
  light.position.set(-4, 8, 5);
  scene.add(light);
  const bot = createBot(BOT_PRESETS.priya);
  scene.add(bot.root);
  const bubbles = new SpeechBubbles({ container: stage, camera });
  bubbles.track(bot);
  let generation = 0,
    controller = null,
    disposed = false,
    raf,
    last = performance.now();
  const resize = () => {
    const w = stage.clientWidth,
      h = stage.clientHeight,
      ppu = Math.min(85, h / 7.7),
      halfH = h / ppu / 2;
    Object.assign(camera, {
      left: -w / ppu / 2,
      right: w / ppu / 2,
      top: halfH,
      bottom: -halfH,
    });
    const targetY = (h * 0.28) / ppu / Math.cos(0.38);
    camera.position.set(0, targetY + Math.sin(0.38) * 14, Math.cos(0.38) * 14);
    camera.lookAt(0, targetY, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();
  const frame = (now) => {
    if (disposed) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    bot.update(dt);
    bubbles.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  const stop = () => {
    generation++;
    controller?.abort();
    bot.dismissSpeech();
    bot.cancel();
    return generation;
  };
  const run = async () => {
    const runId = stop();
    controller = new AbortController();
    const signal = controller.signal;
    const current = () => generation === runId && !disposed;
    const ask = (text, choices) =>
      bot.ask(text, choices, { signal, focus: true });
    start.hidden = true;
    hint.textContent = "";
    bot.root.visible = true;
    bot.root.scale.setScalar(1);
    bot.motion.reset(new THREE.Vector3(camera.left - 1.5, 0, 0));
    bot.setExpression("happy");
    bot.setStatus(null);
    await bot.walkTo(0, 0, { speed: 2.4, signal });
    if (!current()) return;
    await bot.turnTo(0, { signal });
    if (!current()) return;
    await bot.play("beckon", { signal });
    if (!current()) return;
    let choice = await ask("Hi, I’m Priya. Help us build Global Concierge?", [
      { id: "build", label: "Let’s build something" },
      { id: "about", label: "What’s your role?" },
      { id: "motion", label: "Show me a move" },
    ]);
    while (current() && choice) {
      stage.dispatchEvent(
        new CustomEvent("entry:choice", {
          bubbles: true,
          detail: { choiceId: choice },
        }),
      );
      if (choice === "about") {
        bot.setExpression("thinking");
        await bot.play("inspect", { signal });
        if (!current()) return;
        choice = await ask("I test what we build. Even the buttons.", [
          { id: "build", label: "Let’s choose a feature" },
          { id: "motion", label: "Show me a move" },
        ]);
      } else if (choice === "motion") {
        bot.setExpression("happy");
        await bot.play("celebrate", { signal });
        if (!current()) return;
        choice = await ask("Motion check: passed. What shall we build?", [
          { id: "build", label: "Choose a feature" },
          { id: "about", label: "Tell me about your role" },
        ]);
      } else if (choice === "build") {
        bot.setExpression("happy");
        await bot.play("react", { signal });
        if (!current()) return;
        choice = await ask("Which part should the team build first?", [
          { id: "dashboard", label: "Dashboard" },
          { id: "booking", label: "New booking" },
          { id: "financials", label: "Financials & insights" },
        ]);
      } else {
        const names = {
          dashboard: "Dashboard",
          booking: "New booking",
          financials: "Financials & insights",
        };
        bot.setExpression("happy");
        await bot.play("present", { signal });
        if (!current()) return;
        choice = await ask(`${names[choice]} it is! This trial ends here.`, [
          { id: "build", label: "Choose another feature" },
          { id: "about", label: "Back to Priya" },
        ]);
      }
    }
    if (current()) hint.textContent = "Use Reset scene to meet Priya again.";
  };
  reset.onclick = async () => {
    if (reset.dataset.cleaning) return;
    const id = stop();
    reset.dataset.cleaning = "true";
    reset.textContent = "Clearing…";
    start.hidden = true;
    hint.textContent = "";
    bot.setExpression("focused");
    await bot.play("sweep", { duration: 1, loop: false });
    if (id !== generation) return;
    await bot.walkTo(camera.right + 1.5, 0, { speed: 3 });
    if (id !== generation) return;
    bot.root.visible = false;
    reset.textContent = "Reset scene";
    delete reset.dataset.cleaning;
    start.hidden = false;
    start.focus();
  };
  start.onclick = () => run();
  run();
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    stop();
    hint.textContent = "The scene paused. Reload to restore 3D.";
  });
  if (import.meta.hot)
    import.meta.hot.dispose(() => {
      disposed = true;
      stop();
      cancelAnimationFrame(raf);
      observer.disconnect();
      bubbles.dispose();
      bot.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      reset.onclick = null;
      start.onclick = null;
    });
}
