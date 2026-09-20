// App-level stage geometry: pixels, independent of Three.js and product components.
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function crosses(a, b, c, d) {
  const orient = (p, q, r) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return (
    orient(a, b, c) * orient(a, b, d) < 0 &&
    orient(c, d, a) * orient(c, d, b) < 0
  );
}
const pointDistance = (p, a, b) => {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const t = Math.max(
    0,
    Math.min(
      1,
      ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
    ),
  );
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
};
export const pathsConflict = (a, b, c, d, gap = 65) =>
  crosses(a, b, c, d) ||
  Math.min(
    pointDistance(a, c, d),
    pointDistance(b, c, d),
    pointDistance(c, a, b),
    pointDistance(d, a, b),
  ) < gap;
export function routeAround(start, end, obstacles, bounds) {
  const boxes = obstacles.map((p) => ({
    left: p.x - 72,
    right: p.x + 72,
    top: p.y - 115,
    bottom: p.y + 115,
  }));
  const inside = (p, b) =>
    p.x > b.left && p.x < b.right && p.y > b.top && p.y < b.bottom;
  const usable = boxes.filter((b) => !inside(start, b));
  const clear = (a, b) =>
    !usable.some(
      (r) =>
        inside(b, r) ||
        crosses(a, b, { x: r.left, y: r.top }, { x: r.right, y: r.top }) ||
        crosses(a, b, { x: r.right, y: r.top }, { x: r.right, y: r.bottom }) ||
        crosses(
          a,
          b,
          { x: r.right, y: r.bottom },
          { x: r.left, y: r.bottom },
        ) ||
        crosses(a, b, { x: r.left, y: r.bottom }, { x: r.left, y: r.top }),
    );
  const corners = usable
    .flatMap((r) => [
      { x: r.left - 4, y: r.top - 4 },
      { x: r.right + 4, y: r.top - 4 },
      { x: r.left - 4, y: r.bottom + 4 },
      { x: r.right + 4, y: r.bottom + 4 },
    ])
    .filter(
      (p) =>
        p.x >= bounds.left &&
        p.x <= bounds.right &&
        p.y >= bounds.top &&
        p.y <= bounds.bottom &&
        !usable.some((r) => inside(p, r)),
    );
  const nodes = [start, end, ...corners],
    cost = nodes.map(() => Infinity),
    prev = nodes.map(() => -1),
    done = new Set();
  cost[0] = 0;
  for (let n = 0; n < nodes.length; n++) {
    let i = -1;
    for (let j = 0; j < nodes.length; j++)
      if (!done.has(j) && (i < 0 || cost[j] < cost[i])) i = j;
    if (i < 0 || !Number.isFinite(cost[i])) break;
    if (i === 1) {
      const path = [];
      for (let k = 1; k !== 0; k = prev[k]) path.unshift(nodes[k]);
      return path;
    }
    done.add(i);
    for (let j = 0; j < nodes.length; j++) {
      if (done.has(j) || !clear(nodes[i], nodes[j])) continue;
      const d = cost[i] + distance(nodes[i], nodes[j]);
      if (d < cost[j]) {
        cost[j] = d;
        prev[j] = i;
      }
    }
  }
  return null; // Yield to traffic and try again; never cut through a bot.
}
// Review queues run independently of construction, with errors observed immediately.
export class ReviewQueue {
  constructor() {
    this.tail = Promise.resolve();
    this.error = null;
  }
  add(work) {
    this.tail = this.tail
      .then(() => {
        if (!this.error) return work();
      })
      .catch((e) => {
        this.error ??= e;
      });
    return this.tail;
  }
  async drain() {
    await this.tail;
    if (this.error) throw this.error;
  }
}
