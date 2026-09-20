import { mkdirSync, writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createApi } from "../server/app.js";
import { openStore } from "../server/store.js";
import { staticFiles } from "./serve.js";
const base = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const data = resolve(process.env.GC_DATA_DIR || resolve(base, "data"));
mkdirSync(data, { recursive: true });
const stateFile = resolve(data, "running.json"),
  token = randomUUID();
const port = Number(process.env.GC_PORT || 8787);
const store = openStore(resolve(data, "concierge.sqlite"));
const files = staticFiles(resolve(base, "dist"));
let stopping = false;
const server = createApi(store, {
  localOrigin: `http://127.0.0.1:${port}`,
  serveStatic(req, res) {
    if (req.url === "/__gc/status" || req.url === "/__gc/stop") {
      if (req.headers["x-gc-control"] !== token) {
        res.writeHead(403);
        return res.end();
      }
      if (req.url === "/__gc/status" && req.method === "GET") {
        res.setHeader("Content-Type", "application/json");
        return res.end(
          JSON.stringify({ app: "global-concierge", pid: process.pid }),
        );
      }
      if (req.url === "/__gc/stop" && req.method === "POST") {
        res.end("Stopped");
        stop();
        return;
      }
      res.writeHead(405);
      return res.end();
    }
    return files(req, res);
  },
});
server.requestTimeout = 15000;
server.on("error", (e) => {
  console.error(
    e.code === "EADDRINUSE"
      ? "Port 8787 is already in use. Close the other demo/server and try again."
      : e,
  );
  store.close();
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  writeFileSync(stateFile, JSON.stringify({ token, pid: process.pid }));
  console.log(`Global Concierge ready: http://127.0.0.1:${port}/opening.html`);
});
function stop() {
  if (stopping) return;
  stopping = true;
  server.close(() => {
    store.close();
    try {
      if (JSON.parse(readFileSync(stateFile)).token === token)
        unlinkSync(stateFile);
    } catch {}
  });
  server.closeIdleConnections();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
