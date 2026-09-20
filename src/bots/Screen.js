import * as THREE from "three";
export const EXPRESSIONS = [
  "neutral",
  "thinking",
  "talking",
  "happy",
  "focused",
  "alarmed",
  "angry",
  "error",
  "success",
];
export const STATUS_GRAPHICS = ["progress", "loading", "cross", "tick"];
/** Canvas screen. Inject canvasFactory when running outside a browser. */
export class BotScreen {
  constructor(
    mesh,
    {
      canvasFactory = () => document.createElement("canvas"),
      random = Math.random,
    } = {},
  ) {
    this.mesh = mesh;
    this.original = mesh.material;
    this.canvas = canvasFactory();
    this.canvas.width = 256;
    this.canvas.height = 192;
    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) throw new Error("A 2D canvas is required for screens");
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.material = new THREE.MeshBasicMaterial({ map: this.texture });
    mesh.material = this.material;
    this.random = random;
    this.time = 0;
    this.nextBlink = 2 + random() * 4;
    this.blinkEnd = 0;
    this.expression = "neutral";
    this.status = null;
    this.progress = 0;
    this.draw();
  }
  setExpression(name) {
    if (!EXPRESSIONS.includes(name))
      throw new Error(`Unknown expression: ${name}`);
    this.expression = name;
    this.status = null;
    this.draw();
    return this;
  }
  setStatus(name, value = 0) {
    if (name !== null && !STATUS_GRAPHICS.includes(name))
      throw new Error(`Unknown status: ${name}`);
    if (!Number.isFinite(value)) throw new Error("Progress must be finite");
    this.status = name;
    this.progress = THREE.MathUtils.clamp(value, 0, 100);
    this.draw();
    return this;
  }
  update(dt) {
    this.time += dt;
    if (this.time >= this.nextBlink) {
      this.blinkEnd = this.time + 0.14;
      this.nextBlink = this.time + 2 + this.random() * 4;
    }
    this.draw();
  }
  draw() {
    const c = this.ctx,
      t = this.time;
    c.fillStyle =
      this.expression === "angry" && !this.status ? "#af162e" : "#080b0e";
    c.fillRect(0, 0, 256, 192);
    c.strokeStyle = c.fillStyle = "#bef4e8";
    c.lineWidth = 9;
    c.lineCap = "round";
    const line = (points) => {
      c.beginPath();
      points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.stroke();
    };
    const arc = (x, y, r, a, b) => {
      c.beginPath();
      c.arc(x, y, r, a, b);
      c.stroke();
    };
    const cross = () => {
      line([
        [105, 68],
        [151, 116],
      ]);
      line([
        [151, 68],
        [105, 116],
      ]);
    };
    const tick = () =>
      line([
        [95, 94],
        [119, 115],
        [162, 68],
      ]);
    if (this.status) {
      if (this.status === "progress") {
        c.strokeStyle = "#39524f";
        c.strokeRect(37, 78, 182, 34);
        c.fillRect(44, 85, (168 * this.progress) / 100, 20);
      }
      if (this.status === "loading") {
        arc(128, 96, 32, t * 4, t * 4 + Math.PI * 1.5);
      }
      if (this.status === "cross") {
        c.strokeStyle = "#ff6572";
        cross();
      }
      if (this.status === "tick") {
        c.strokeStyle = "#84ec90";
        tick();
      }
    } else {
      const e = this.expression;
      if (e === "angry") {
        c.strokeStyle = "#fff0d9";
        c.lineWidth = 12;
        line([
          [63, 65],
          [99, 84],
        ]);
        line([
          [157, 84],
          [193, 65],
        ]);
        line([
          [72, 99],
          [94, 99],
        ]);
        line([
          [162, 99],
          [184, 99],
        ]);
        line([
          [107, 144],
          [128, 134],
          [149, 144],
        ]);
      } else if (e === "error") {
        c.strokeStyle = "#ff6572";
        cross();
      } else if (e === "success") {
        c.strokeStyle = "#84ec90";
        tick();
      } else {
        for (const x of [82, 174]) {
          if (t < this.blinkEnd)
            line([
              [x - 16, 85],
              [x + 16, 85],
            ]);
          else if (e === "happy") arc(x, 89, 18, Math.PI, Math.PI * 2);
          else if (e === "focused")
            line([
              [x - 16, 80],
              [x + 16, 86],
            ]);
          else {
            c.beginPath();
            c.ellipse(
              x + (e === "thinking" ? 9 : 0),
              e === "thinking" ? 69 : 84,
              e === "alarmed" ? 16 : 12,
              e === "alarmed" ? 24 : 18,
              0,
              0,
              Math.PI * 2,
            );
            c.fill();
          }
        }
        if (e === "talking") {
          c.beginPath();
          c.ellipse(
            128,
            131,
            18,
            8 + 8 * (0.5 + 0.5 * Math.sin(t * 15)),
            0,
            0,
            Math.PI * 2,
          );
          c.fill();
        } else if (e === "alarmed") arc(128, 133, 12, 0, Math.PI * 2);
        else if (e === "happy") arc(128, 116, 24, 0.15, Math.PI - 0.15);
        else
          line([
            [115, 132],
            [141, 132],
          ]);
      }
    }
    this.texture.needsUpdate = true;
  }
  dispose() {
    this.mesh.material = this.original;
    this.texture.dispose();
    this.material.dispose();
  }
}
