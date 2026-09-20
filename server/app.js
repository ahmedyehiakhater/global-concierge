import { createServer } from "node:http";
import { Problem, catalog } from "./store.js";
const cookieName = "gc_session";
export function createApi(store) {
  return createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const send = (code, value) => {
      res.writeHead(code);
      res.end(JSON.stringify(value));
    };
    try {
      const path = new URL(req.url, "http://localhost").pathname;
      if (req.method === "GET" && path === "/api/health")
        return send(200, { ok: true });
      const id = req.headers.cookie
        ?.split(";")
        .map((x) => x.trim())
        .find((x) => x.startsWith(cookieName + "="))
        ?.slice(cookieName.length + 1);
      const setCookie = (value) =>
        res.setHeader(
          "Set-Cookie",
          `${cookieName}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`,
        );
      if (req.method === "GET" && path === "/api/catalog")
        return send(200, {
          currency: "AED",
          minorUnits: true,
          discountPercent: 10,
          services: catalog,
        });
      if (req.method === "GET" && path === "/api/session") {
        const current = store.resume(id);
        setCookie(current);
        return send(200, store.snapshot(current));
      }
      if (req.method !== "POST") throw new Problem(404, "Endpoint not found.");
      // Same-origin writes only; a custom JSON request header also prevents cross-site form posts.
      const origin = req.headers.origin;
      const allowed = new Set([
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:8787",
      ]);
      if (
        (origin && !allowed.has(origin)) ||
        req.headers["x-gc-demo"] !== "1" ||
        !req.headers["content-type"]?.startsWith("application/json")
      )
        throw new Problem(403, "Use the local demo client.");
      if (!id) throw new Problem(401, "Start a session first.");
      if (req.headers["x-gc-session"] && req.headers["x-gc-session"] !== id)
        throw new Problem(
          409,
          "The visitor session changed in another tab. Reload before continuing.",
        );
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 1048576)
          throw new Problem(413, "Request too large.");
      }
      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        throw new Problem(400, "Invalid JSON.");
      }
      if (!payload || typeof payload !== "object" || Array.isArray(payload))
        throw new Problem(400, "Expected an object.");
      const key = req.headers["idempotency-key"];
      if (
        ["/api/bookings", "/api/session/reset"].includes(path) &&
        (typeof key !== "string" || !/^[a-zA-Z0-9-]{8,80}$/.test(key))
      )
        throw new Problem(400, "A valid idempotency key is required.");
      if (path === "/api/session/features")
        return send(200, store.feature(id, payload.feature));
      if (path === "/api/session/draft")
        return send(200, store.draft(id, payload));
      if (path === "/api/bookings")
        return send(200, store.book(id, key, payload));
      if (path === "/api/session/reset") {
        const next = store.reset(id, key);
        setCookie(next);
        return send(200, store.snapshot(next));
      }
      throw new Problem(404, "Endpoint not found.");
    } catch (e) {
      if (!e.status) console.error(e);
      send(e.status || 500, {
        error: e.status
          ? e.message
          : "Unable to save. Please try again; your session has not been intentionally reset.",
      });
    }
  });
}
