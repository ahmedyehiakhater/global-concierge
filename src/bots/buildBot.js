import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createTool } from "./tools.js";
import { resolveConfig } from "./presets.js";

/** Self-contained articulated rigid-part rig. Forward is +Z, up is +Y.
 * No renderer, DOM, application state or external model assets required.
 */
export function buildBot(input) {
  const config = resolveConfig(input),
    root = new THREE.Group();
  root.name = config.name ?? "Bot";
  const materials = {};
  for (const [key, color] of Object.entries(config.colors))
    materials[key] =
      key === "screen"
        ? new THREE.MeshBasicMaterial({ color })
        : new THREE.MeshLambertMaterial({ color });
  const dark = new THREE.MeshStandardMaterial({
    color: "#282f35",
    roughness: 1,
  });
  const silver = new THREE.MeshStandardMaterial({
    color: "#c3c9cc",
    roughness: 1,
    metalness: 0,
  });
  function mesh(geometry, material, parent, pos = [0, 0, 0]) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(...pos);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function box(parent, size, pos, material, r = 0.1) {
    return mesh(
      new RoundedBoxGeometry(
        ...size,
        4,
        Math.min(r, ...size.map((v) => v * 0.45)),
      ),
      material,
      parent,
      pos,
    );
  }
  function group(parent, name, pos = [0, 0, 0]) {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(...pos);
    parent.add(g);
    return g;
  }
  function capsule(parent, length, radius, pos, material) {
    return mesh(
      new THREE.CapsuleGeometry(
        radius,
        Math.max(0.01, length - radius * 2),
        10,
        20,
      ),
      material,
      parent,
      pos,
    );
  }
  // Rigid sleeve shells overlap at the pivots. No exposed gaps or joint hardware.
  function sleeve(parent, length, radius) {
    const shell = new THREE.Group();
    shell.name = "soft-sleeve";
    parent.add(shell);
    const tube = mesh(
      new THREE.CylinderGeometry(radius, radius, length, 20),
      materials.body,
      shell,
      [0, -length / 2, 0],
    );
    tube.receiveShadow = false;
    for (const y of [0, -length]) {
      const cap = mesh(
        new THREE.SphereGeometry(radius, 20, 12),
        materials.body,
        shell,
        [0, y, 0],
      );
      cap.receiveShadow = false;
    }
    return shell;
  }
  function softOval(parent, size, pos) {
    const oval = mesh(
      new THREE.SphereGeometry(1, 24, 16),
      materials.body,
      parent,
      pos,
    );
    oval.scale.set(size[0] / 2, size[1] / 2, size[2] / 2);
    oval.receiveShadow = false;
    return oval;
  }
  const torso = group(root, "torso", [0, config.hipHeight, 0]);
  const t = config.torso,
    h = config.head,
    l = config.limbs;
  box(
    torso,
    [t.width, t.height + 0.12, t.depth],
    [0, t.height * 0.5 - 0.045, 0],
    materials.body,
    t.roundness ?? 0.21,
  );
  const neck = group(torso, "neck", [0, t.height - 0.07, 0]);
  // Neck pivot stays in the rig, enclosed by overlapping head and torso shells.
  const head = group(neck, "head", [0, h.height * 0.5 + 0.015, 0]);
  // All silhouettes are generated from the same rounded primitive pipeline.
  const headGeo = new RoundedBoxGeometry(
    h.width,
    h.height,
    h.depth,
    6,
    h.radius ?? (h.shape === "box" ? 0.14 : 0.28),
  );
  if (h.shape === "teardrop" || h.shape === "dome" || h.shape === "hood") {
    const p = headGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / h.height + 0.5;
      const taper =
        h.shape === "teardrop"
          ? 1 - 0.23 * Math.pow(y, 3)
          : 1 - 0.09 * Math.pow(y, 3);
      p.setX(i, p.getX(i) * taper);
    }
    headGeo.computeVertexNormals();
  }
  mesh(headGeo, materials.body, head);
  // A rounded 2D face avoids the almost-square corners produced by a thin box.
  const sw = h.width * config.screen.width,
    sh = h.height * config.screen.height;
  const radius = Math.min(config.screen.radius, sw / 2, sh / 2),
    shape = new THREE.Shape();
  shape.moveTo(-sw / 2 + radius, -sh / 2);
  shape.lineTo(sw / 2 - radius, -sh / 2);
  shape.quadraticCurveTo(sw / 2, -sh / 2, sw / 2, -sh / 2 + radius);
  shape.lineTo(sw / 2, sh / 2 - radius);
  shape.quadraticCurveTo(sw / 2, sh / 2, sw / 2 - radius, sh / 2);
  shape.lineTo(-sw / 2 + radius, sh / 2);
  shape.quadraticCurveTo(-sw / 2, sh / 2, -sw / 2, sh / 2 - radius);
  shape.lineTo(-sw / 2, -sh / 2 + radius);
  shape.quadraticCurveTo(-sw / 2, -sh / 2, -sw / 2 + radius, -sh / 2);
  const screenGeometry = new THREE.ShapeGeometry(shape, 16);
  const positions = screenGeometry.attributes.position,
    uv = screenGeometry.attributes.uv;
  for (let i = 0; i < positions.count; i++)
    uv.setXY(i, positions.getX(i) / sw + 0.5, positions.getY(i) / sh + 0.5);
  const screenMesh = mesh(screenGeometry, materials.screen, head, [
    0,
    config.screen.offsetY,
    h.depth * 0.5 + 0.012,
  ]);
  if (config.accessories.rings) {
    for (const side of [-1, 1]) {
      const ring = group(head, `ring-${side}`, [
        side * (h.width * 0.5 + 0.027),
        0,
        0,
      ]);
      ring.rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.08, 32), dark, ring);
      const tor = mesh(
        new THREE.TorusGeometry(0.135, 0.026, 10, 32),
        silver,
        ring,
      );
      tor.rotation.x = Math.PI / 2;
      tor.position.y = side * 0.05;
      const lens = mesh(
        new THREE.CylinderGeometry(0.105, 0.105, 0.085, 32),
        dark,
        ring,
      );
      lens.position.y = side * 0.01;
    }
  }
  if (config.accessories.antenna) {
    capsule(head, 0.22, 0.027, [0, h.height * 0.5 + 0.1, 0], materials.body);
    mesh(new THREE.SphereGeometry(0.065, 16, 12), materials.body, head, [
      0,
      h.height * 0.5 + 0.25,
      0,
    ]);
  }
  if (config.accessories.chestPanel)
    box(
      torso,
      [0.24, 0.23, 0.028],
      [0, t.height * 0.58, t.depth / 2 + 0.025],
      dark,
      0.035,
    );
  // One thin, curved wrap. Sample the actual rounded torso surface with a
  // signed-distance ray solve, so the vest fits all config proportions.
  const vest = group(torso, "vest");
  const torsoRadius = Math.min(
    t.roundness ?? 0.21,
    t.width * 0.45,
    (t.height + 0.12) * 0.45,
    t.depth * 0.45,
  );
  function wrap(y0, y1, material, name, offset = 0.014) {
    const positions = [],
      uvs = [],
      indices = [],
      columns = 96,
      rows = 12;
    const half = [t.width / 2, (t.height + 0.12) / 2, t.depth / 2],
      centerY = t.height * 0.5 - 0.045;
    for (let row = 0; row <= rows; row++) {
      const y = THREE.MathUtils.lerp(y0, y1, row / rows);
      for (let col = 0; col <= columns; col++) {
        const theta =
          Math.PI / 2 + 0.14 + ((Math.PI * 2 - 0.28) * col) / columns;
        const dx = Math.cos(theta),
          dz = Math.sin(theta);
        let lo = 0,
          hi = Math.hypot(half[0], half[2]) + offset;
        for (let i = 0; i < 22; i++) {
          const distance = (lo + hi) / 2;
          const qx = Math.abs(dx * distance) - half[0] + torsoRadius;
          const qy = Math.abs(y - centerY) - half[1] + torsoRadius;
          const qz = Math.abs(dz * distance) - half[2] + torsoRadius;
          const sdf =
            Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) +
            Math.min(Math.max(qx, qy, qz), 0) -
            torsoRadius;
          if (sdf < offset) lo = distance;
          else hi = distance;
        }
        positions.push((dx * (lo + hi)) / 2, y, (dz * (lo + hi)) / 2);
        uvs.push(col / columns, row / rows);
        if (row < rows && col < columns) {
          const a = row * (columns + 1) + col,
            b = a + columns + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const part = mesh(geo, material, vest);
    part.name = name;
    return part;
  }
  materials.vest.side = THREE.DoubleSide;
  materials.stripe.side = THREE.DoubleSide;
  wrap(0.045, t.height * 0.91, materials.vest, "vest-wrap");
  for (const y of [t.height * 0.34, t.height * 0.62])
    wrap(y - 0.024, y + 0.024, materials.stripe, "reflective-band", 0.02);
  const arms = {},
    legs = {};
  for (const [name, side] of [
    ["left", -1],
    ["right", 1],
  ]) {
    const shoulder = group(torso, `${name}-shoulder`, [
      side * (t.width / 2 + l.armRadius * 0.65),
      t.height * 0.77,
      0,
    ]);
    sleeve(shoulder, l.upperArm, l.armRadius);
    const elbow = group(shoulder, `${name}-elbow`, [0, -l.upperArm, 0]);
    sleeve(elbow, l.forearm, l.armRadius);
    const hand = group(elbow, `${name}-hand`, [0, -l.forearm, 0]);
    softOval(hand, [l.armRadius * 2.25, 0.23, 0.24], [0, -0.025, 0.012]);
    const socket = group(hand, `${name}-grip`);
    arms[name] = { shoulder, elbow, hand, socket, side };
    const hip = group(torso, `${name}-hip`, [side * t.width * 0.26, 0, 0]);
    sleeve(hip, l.thigh, l.legRadius);
    const knee = group(hip, `${name}-knee`, [0, -l.thigh, 0]);
    sleeve(knee, l.shin, l.legRadius);
    const ankle = group(knee, `${name}-ankle`, [0, -l.shin, 0]);
    softOval(ankle, [l.legRadius * 2.65, 0.17, 0.39], [0, 0.005, 0.085]);
    legs[name] = { hip, knee, ankle, side };
  }
  const tool = config.tool ? createTool(config.tool) : null;
  if (tool) arms.right.socket.add(tool);
  function dispose() {
    const geos = new Set(),
      mats = new Set();
    root.traverse((o) => {
      if (o.isMesh) {
        geos.add(o.geometry);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
          mats.add(m),
        );
      }
    });
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    root.removeFromParent();
  }
  return {
    root,
    torso,
    head,
    neck,
    vest,
    arms,
    legs,
    screenMesh,
    tool,
    config,
    dispose,
  };
}
