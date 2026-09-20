export class DeliveryTimer {
  constructor(seconds = 100) {
    this.planned = seconds;
    this.elapsed = 0;
    this.deadline = this.planned;
    this.running = false;
    this.hold = false;
    this.shipped = false;
  }
  start(seconds = this.planned) {
    this.planned = seconds;
    this.elapsed = 0;
    this.deadline = this.planned;
    this.running = true;
    this.shipped = false;
    this.hold = false;
  }
  tick(dt) {
    if (this.running && !this.hold) this.elapsed += dt;
  }
  get remaining() {
    return this.shipped ? 0 : Math.max(0, this.deadline - this.elapsed);
  }
  // Read-only presentation estimate: never used to schedule or delay the scene.
  estimateRemaining(seconds) {
    if (this.running) this.deadline = this.elapsed + Math.max(0, seconds);
  }
  finish() {
    this.running = false;
    this.shipped = true;
  }
  reset() {
    this.running = false;
    this.shipped = false;
    this.elapsed = 0;
    this.deadline = this.planned;
    this.hold = false;
  }
  get label() {
    if (this.shipped) return "Shipped · 00:00";
    if (this.hold) return "Saving release…";
    if (this.remaining === 0) return "Finishing release…";
    const n = Math.ceil(this.remaining);
    return `Ships in ~${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
  }
}
