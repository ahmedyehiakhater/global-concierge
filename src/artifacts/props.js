import * as THREE from "three";
import { artifactCard } from "./catalog.js";
// A carried card references the same document ID opened by the readable viewer.
export function createArtifactProp(id, title) {
  const a = artifactCard(id),
    canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 512, 640);
  ctx.fillStyle = "#0285ca";
  ctx.fillRect(0, 0, 512, 18);
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(a.kind.toUpperCase(), 35, 80);
  ctx.fillStyle = "#202c35";
  ctx.font = "bold 32px sans-serif";
  let line = "",
    y = 155;
  for (const word of (title || a.title).split(" ")) {
    if (ctx.measureText(line + word).width > 430) {
      ctx.fillText(line, 35, y);
      y += 42;
      line = "";
    }
    line += word + " ";
  }
  ctx.fillText(line, 35, y);
  ctx.font = "20px sans-serif";
  ctx.fillStyle = "#5b6973";
  ctx.fillText(`v${a.version} · ${a.owner}`, 35, 560);
  ctx.fillText("DRAFT", 35, 597);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.PlaneGeometry(0.48, 0.6),
    material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
  const prop = new THREE.Mesh(geometry, material);
  prop.userData.artifactId = id;
  prop.userData.dispose = () => {
    texture.dispose();
    material.dispose();
    geometry.dispose();
  };
  return prop;
}
