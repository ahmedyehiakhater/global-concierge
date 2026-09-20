export class SceneClock {
  constructor() {
    this.jobs = new Set();
  }
  tween(seconds, update, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted)
        return reject(new DOMException("Interrupted", "AbortError"));
      const job = { elapsed: 0, seconds, update, resolve, reject };
      const cancel = () => {
        this.jobs.delete(job);
        job.clean();
        reject(new DOMException("Interrupted", "AbortError"));
      };
      job.clean = () => signal?.removeEventListener("abort", cancel);
      signal?.addEventListener("abort", cancel, { once: true });
      this.jobs.add(job);
    });
  }
  wait(seconds, signal) {
    return this.tween(seconds, () => {}, signal);
  }
  tick(dt) {
    for (const j of [...this.jobs]) {
      j.elapsed += dt;
      const u = Math.min(1, j.elapsed / j.seconds);
      j.update(u);
      if (u === 1) {
        this.jobs.delete(j);
        j.clean();
        j.resolve();
      }
    }
  }
}
