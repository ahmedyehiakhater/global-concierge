import * as THREE from "three";
/** Small rigid accessories, entirely primitive geometry. Hand-local origin is grip. */
export function createTool(kind) {
  const root = new THREE.Group();
  root.name = `tool:${kind}`;
  const dark = new THREE.MeshStandardMaterial({
    color: "#37444c",
    roughness: 0.7,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: "#bbc9cc",
    roughness: 0.45,
    metalness: 0.3,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: "#61bfd2",
    roughness: 0.7,
  });
  const paper = new THREE.MeshStandardMaterial({
    color: "#eff1df",
    roughness: 0.9,
  });
  const add = (g, m, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    root.add(o);
    return o;
  };
  const box = (w, h, d, m, x = 0, y = 0, z = 0) =>
    add(new THREE.BoxGeometry(w, h, d), m, x, y, z);
  const stem = (h, r, m = dark) =>
    add(new THREE.CylinderGeometry(r, r, h, 12), m, 0, h / 2 - 0.05);
  if (kind === "tablet" || kind === "clipboard") {
    box(0.27, 0.36, 0.035, dark, 0, 0.13, 0);
    box(0.235, 0.29, 0.009, kind === "tablet" ? accent : paper, 0, 0.13, 0.023);
    if (kind === "clipboard") box(0.11, 0.04, 0.025, metal, 0, 0.31, 0.03);
  } else if (kind === "stylus") {
    stem(0.4, 0.019);
    add(new THREE.ConeGeometry(0.019, 0.065, 12), accent, 0, 0.38);
  } else if (kind === "wrench") {
    stem(0.33, 0.028, metal);
    box(0.15, 0.045, 0.055, metal, 0, 0.3);
    box(0.04, 0.12, 0.055, metal, -0.065, 0.345);
    box(0.04, 0.12, 0.055, metal, 0.065, 0.345);
  } else if (kind === "magnifier") {
    stem(0.24, 0.027);
    add(new THREE.TorusGeometry(0.105, 0.022, 10, 28), metal, 0, 0.29);
    const lens = add(
      new THREE.CircleGeometry(0.084, 28),
      new THREE.MeshStandardMaterial({
        color: "#9fe5ea",
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        roughness: 0.2,
      }),
      0,
      0.29,
    );
    lens.name = "glass";
  } else throw new Error(`Unknown tool: ${kind}`);
  root.userData.tipHeight = new THREE.Box3().setFromObject(root).max.y;
  return root;
}
