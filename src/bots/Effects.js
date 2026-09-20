import * as THREE from "three";
export const EFFECTS = [
  "dust",
  "construction",
  "sparks",
  "ring",
  "dustTrail",
  "confetti",
  "error",
  "success",
];
/** Owns a group in a supplied scene; all positions are world-space. */
export class BotEffects {
  constructor(parent, { random = Math.random, maxParticles = 500 } = {}) {
    this.root = new THREE.Group();
    this.root.name = "bot-effects";
    parent.add(this.root);
    this.random = random;
    this.maxParticles = maxParticles;
    this.items = [];
    this.emitters = new Set();
    const pixels = new Uint8Array(32 * 32 * 4);
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const i = (y * 32 + x) * 4,
          d = Math.hypot((x - 15.5) / 15.5, (y - 15.5) / 15.5);
        pixels[i] = pixels[i + 1] = pixels[i + 2] = 255;
        pixels[i + 3] = Math.round(Math.max(0, 1 - d) ** 0.65 * 255);
      }
    this.dustTexture = new THREE.DataTexture(pixels, 32, 32);
    this.dustTexture.needsUpdate = true;
    this.geometry = new THREE.SphereGeometry(1, 8, 6);
    this.ringGeometry = new THREE.RingGeometry(0.84, 1, 48);
  }
  emit(type, position, { count, scale = 1 } = {}) {
    if (!EFFECTS.includes(type)) throw new Error(`Unknown effect: ${type}`);
    const p = position.isVector3
      ? position.clone()
      : new THREE.Vector3(position.x, position.y, position.z);
    if (type === "construction") {
      this.emit("dust", p, { count: count ?? 32, scale: scale * 1.25 });
      this.emit("sparks", p, { count: 16, scale });
      this.emit("ring", p, { scale });
      return;
    }
    if (type === "dustTrail") return this.startTrail(() => p, { scale });
    const ring = ["ring", "error", "success"].includes(type),
      n = ring ? 1 : (count ?? (type === "confetti" ? 24 : 12));
    for (let i = 0; i < n; i++) {
      if (this.items.length >= this.maxParticles) this.remove(this.items[0]);
      const rnd = this.random,
        color =
          type === "sparks"
            ? "#ffc660"
            : type === "error"
              ? "#ff475f"
              : type === "success"
                ? "#58e98c"
                : type === "confetti"
                  ? ["#b3f25c", "#72cfe2", "#f5c558", "#dc9beb"][
                      Math.floor(rnd() * 4)
                    ]
                  : "#a9b2a5";
      const material =
        type === "dust"
          ? new THREE.SpriteMaterial({
              map: this.dustTexture,
              color,
              transparent: true,
              depthWrite: false,
            })
          : new THREE.MeshBasicMaterial({
              color,
              transparent: true,
              opacity: 1,
              depthWrite: false,
              side: THREE.DoubleSide,
            });
      const mesh =
        type === "dust"
          ? new THREE.Sprite(material)
          : new THREE.Mesh(ring ? this.ringGeometry : this.geometry, material);
      this.root.add(mesh);
      mesh.position.copy(this.root.worldToLocal(p.clone()));
      if (ring) {
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y += 0.018;
      }
      const velocity = new THREE.Vector3(
        (rnd() - 0.5) * 2,
        0.3 + rnd() * 1.4,
        (rnd() - 0.5) * 2,
      ).multiplyScalar(scale);
      const size =
        (ring
          ? 0.2
          : type === "dust"
            ? 0.36
            : type === "sparks"
              ? 0.018
              : 0.028) * scale;
      mesh.scale.setScalar(size);
      if (type === "dust") {
        velocity.multiplyScalar(0.55);
        mesh.position.x += (rnd() - 0.5) * 0.4 * scale;
        mesh.position.z += (rnd() - 0.5) * 0.4 * scale;
        mesh.position.y += 0.1 * scale;
      }
      this.items.push({
        mesh,
        type,
        age: 0,
        life: ring
          ? 0.65
          : type === "sparks"
            ? 0.35
            : type === "confetti"
              ? 1.3
              : 1.15,
        velocity,
        size,
      });
    }
  }
  /** Convert a viewport-normalized point (-1..1) to any horizontal world plane. */
  emitAtScreen(type, ndc, camera, { planeY = 0, ...options } = {}) {
    camera.updateMatrixWorld();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera);
    const hit = ray.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY),
      new THREE.Vector3(),
    );
    if (!hit) return null;
    this.emit(type, hit, options);
    return hit;
  }
  startTrail(position, { scale = 1 } = {}) {
    const e = { position, scale, t: 0 };
    this.emitters.add(e);
    return { stop: () => this.emitters.delete(e) };
  }
  update(dt) {
    dt = Math.min(dt, 0.1);
    for (const e of this.emitters) {
      e.t += dt;
      if (e.t >= 0.08) {
        e.t %= 0.08;
        this.emit("dust", e.position(), { count: 2, scale: e.scale });
      }
    }
    for (const p of [...this.items]) {
      p.age += dt;
      if (p.age >= p.life) {
        this.remove(p);
        continue;
      }
      const u = p.age / p.life;
      p.mesh.material.opacity = (1 - u) * (p.type === "dust" ? 0.85 : 1);
      if (["ring", "error", "success"].includes(p.type))
        p.mesh.scale.setScalar(p.size + u * 1.1);
      else {
        p.mesh.position.addScaledVector(p.velocity, dt);
        p.velocity.y -= dt * (p.type === "dust" ? 0.2 : 2.8);
        p.mesh.scale.setScalar(p.size * (p.type === "dust" ? 1 + u * 2.5 : 1));
      }
    }
  }
  remove(p) {
    p.mesh.removeFromParent();
    p.mesh.material.dispose();
    this.items.splice(this.items.indexOf(p), 1);
  }
  dispose() {
    this.emitters.clear();
    for (const p of [...this.items]) this.remove(p);
    this.dustTexture.dispose();
    this.geometry.dispose();
    this.ringGeometry.dispose();
    this.root.removeFromParent();
  }
}
