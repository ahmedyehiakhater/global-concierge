import * as THREE from "three";
export function bindBotArtifacts({
  element,
  camera,
  bots,
  viewer,
  enabled = () => true,
}) {
  const ray = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  const hit = (e) => {
    const r = element.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      1 - ((e.clientY - r.top) / r.height) * 2,
    );
    ray.setFromCamera(pointer, camera);
    return bots.find(
      (bot) => bot.root.visible && ray.intersectObject(bot.root, true).length,
    );
  };
  const click = (e) => {
    if (!enabled()) return;
    const bot = hit(e);
    if (bot) viewer.open(bot.config.id || bot.config.name.toLowerCase());
  };
  const move = (e) => {
    if (enabled()) element.style.cursor = hit(e) ? "pointer" : "";
  };
  element.addEventListener("click", click);
  element.addEventListener("pointermove", move);
  return () => {
    element.removeEventListener("click", click);
    element.removeEventListener("pointermove", move);
  };
}
