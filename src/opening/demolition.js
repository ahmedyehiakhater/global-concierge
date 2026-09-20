import * as THREE from "three";

// Scene-only props and page fragments; the generic rig owns the throwing gesture.
export function createBomb() {
  const root = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x29333f,
    roughness: 0.85,
  });
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 24, 16),
    material,
  );
  sphere.position.y = 0.22;
  root.add(sphere);
  const fuse = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.24, 8),
    new THREE.MeshStandardMaterial({ color: 0xc9af75 }),
  );
  fuse.position.set(0, 0.59, 0);
  fuse.rotation.z = -0.25;
  root.add(fuse);
  const spark = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.075),
    new THREE.MeshBasicMaterial({ color: 0xffd966 }),
  );
  spark.position.set(0.03, 0.72, 0);
  root.add(spark);
  return root;
}
function dispose(root) {
  root.removeFromParent();
  root.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
}
function fragments(target, layer) {
  const r = target.getBoundingClientRect(),
    pieces = [];
  if (!r.width || !r.height) return pieces;
  // Clone only visible viewport tiles, with no live controls or duplicate IDs.
  for (
    let y = Math.max(0, r.top);
    y < Math.min(innerHeight, r.bottom);
    y += 130
  )
    for (
      let x = Math.max(0, r.left);
      x < Math.min(innerWidth, r.right);
      x += 170
    ) {
      const tile = document.createElement("div");
      tile.className = "demolition-piece";
      tile.style.cssText = `left:${x}px;top:${y}px;width:${Math.min(170, r.right - x)}px;height:${Math.min(130, r.bottom - y)}px;`;
      const copy = target.cloneNode(true);
      copy.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
      copy.removeAttribute("id");
      copy.style.cssText += `;position:absolute!important;margin:0!important;left:${r.left - x}px!important;top:${r.top - y}px!important;width:${r.width}px!important;height:${r.height}px!important;opacity:1!important;visibility:visible!important;transform:none!important;`;
      tile.append(copy);
      layer.append(tile);
      pieces.push(tile);
    }
  return pieces;
}
export async function demolish({
  bots,
  scene,
  effects,
  clock,
  screenPoint,
  signal,
  owners,
}) {
  const layer = document.createElement("div");
  layer.className = "demolition-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.inert = true;
  document.body.append(layer);
  const targets = [
    ...document.querySelectorAll(
      ".opening-shell .topbar,.opening-shell .sidebar,.opening-shell .main,.opening-login,.arrive-banner",
    ),
  ];
  const props = [],
    animations = [],
    hidden = [],
    tools = [];
  try {
    // Short, direct staging. No collision detours during teardown.
    await Promise.all(
      owners.map(async (o, i) => {
        const b = bots[o.id],
          dest = screenPoint(
            innerWidth * (0.12 + i * 0.19),
            innerHeight * 0.83,
          );
        if (!b.root.visible)
          b.motion.reset(
            screenPoint(innerWidth * (0.12 + i * 0.19), innerHeight + 100),
          );
        b.root.visible = true;
        b.setExpression("happy");
        await b.walkTo(dest.x, dest.z, { speed: 20, signal });
        await b.turnTo(Math.PI, { duration: 0.18, signal });
      }),
    );
    const impacts = owners.map((o, i) => {
      const r = targets[i]?.getBoundingClientRect();
      return screenPoint(
        r
          ? Math.max(40, Math.min(innerWidth - 40, r.left + r.width / 2))
          : innerWidth * (0.15 + i * 0.17),
        r
          ? Math.max(40, Math.min(innerHeight - 80, r.top + r.height / 2))
          : innerHeight * 0.45,
      );
    });
    owners.forEach((o) => {
      const b = bots[o.id];
      if (b.rig.tool) {
        tools.push([b.rig.tool, b.rig.tool.visible]);
        b.rig.tool.visible = false;
      }
      const bomb = createBomb();
      b.rig.arms.right.socket.add(bomb);
      props.push(bomb);
    });
    bots.nour.say("Team… make room for the next big idea!", { duration: 1.25 });
    await clock.tween(
      targets.length ? 0.9 : 0.35,
      (u) => {
        props.forEach((bomb, i) => {
          const spark = bomb.children.at(-1);
          spark.scale.setScalar(0.8 + 0.4 * Math.sin(u * 45 + i));
          spark.rotation.z = u * 18;
        });
      },
      signal,
    );
    await Promise.all(
      owners.map(async (o, i) => {
        await clock.wait(i * 0.12, signal);
        const bomb = props[i];
        let flight = Promise.resolve();
        await bots[o.id].play("throw", {
          duration: 1.1,
          signal,
          onRelease: () => {
            scene.attach(bomb);
            const from = bomb.position.clone();
            flight = clock
              .tween(
                0.68,
                (u) => {
                  bomb.position.copy(from).lerp(impacts[i], u);
                  bomb.position.y += Math.sin(Math.PI * u) * 2.3;
                  bomb.rotation.z = u * 6;
                },
                signal,
              )
              .then(async () => {
                bomb.visible = false;
                effects.emit("construction", impacts[i], { scale: 2.4 });
                effects.emit("confetti", impacts[i], { count: 32, scale: 2 });
                const surface = document.querySelector(".build-area");
                if (surface)
                  animations.push(
                    surface.animate(
                      [
                        { transform: "translate(0,0)" },
                        { transform: "translate(3px,-2px)" },
                        { transform: "translate(-2px,2px)" },
                        { transform: "translate(0,0)" },
                      ],
                      { duration: 220 },
                    ),
                  );
                const target = targets[i];
                if (target) {
                  const pieces = fragments(target, layer);
                  hidden.push([target, target.style.opacity]);
                  target.style.opacity = "0";
                  for (const [j, piece] of pieces.entries())
                    animations.push(
                      piece.animate(
                        [
                          { transform: "translate(0,0) rotate(0)", opacity: 1 },
                          {
                            transform: `translate(${((j % 5) - 2) * 95}px,${100 + (j % 3) * 80}px) rotate(${(j % 2 ? 1 : -1) * 35}deg) scale(.35)`,
                            opacity: 0,
                          },
                        ],
                        {
                          duration: 1050,
                          easing: "cubic-bezier(.2,.6,.4,1)",
                          fill: "forwards",
                        },
                      ),
                    );
                }
              });
            // The parent awaits this promise below; prevent early unhandled rejection on cancellation.
            flight.catch(() => {});
          },
        });
        await flight;
      }),
    );
    await clock.wait(1.15, signal);
    await Promise.all(
      owners
        .filter((o) => o.id !== "nour")
        .map(async (o, i) => {
          const b = bots[o.id],
            dest = screenPoint(
              i < 2 ? -100 : innerWidth + 100,
              innerHeight * 0.83,
            );
          await b.walkTo(dest.x, dest.z, { speed: 24, signal });
          b.root.visible = false;
        }),
    );
  } finally {
    animations.forEach((a) => a.cancel());
    layer.remove();
    props.forEach(dispose);
    hidden.forEach(([t, v]) => (t.style.opacity = v));
    tools.forEach(([t, v]) => (t.visible = v));
  }
}
