import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};
export function staticFiles(directory) {
  const root = resolve(directory);
  return async (req, res) => {
    try {
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405);
        return res.end();
      }
      const path = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const file = resolve(root, "." + (path === "/" ? "/opening.html" : path));
      if (!file.startsWith(root + sep)) {
        res.writeHead(403);
        return res.end();
      }
      const info = await stat(file);
      if (!info.isFile()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Content-Length": info.size,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
      });
      if (req.method === "HEAD") return res.end();
      const stream = createReadStream(file);
      stream.on("error", () => res.destroy());
      stream.pipe(res);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  };
}
