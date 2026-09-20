import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApi } from "../server/app.js";
import { openStore } from "../server/store.js";
import { staticFiles } from "../packaging/serve.js";
test("packaged server serves compiled files and the real API without exposing database paths", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gc-static-"));
  await writeFile(join(dir, "opening.html"), "<h1>Demo</h1>");
  await writeFile(join(dir, "app.js"), "console.log(1)");
  const store = openStore(":memory:"),
    server = createApi(store, { serveStatic: staticFiles(dir) });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const root = `http://127.0.0.1:${server.address().port}`;
  try {
    const home = await fetch(root + "/");
    assert.equal(home.status, 200);
    assert.match(home.headers.get("content-type"), /text\/html/);
    assert.match(await home.text(), /Demo/);
    const head = await fetch(root + "/app.js", { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    assert.equal((await fetch(root + "/%2e%2e%2fserver/store.js")).status, 403);
    assert.equal((await fetch(root + "/data/concierge.sqlite")).status, 404);
    assert.equal((await fetch(root + "/", { method: "POST" })).status, 405);
    const session = await fetch(root + "/api/session");
    assert.equal((await session.json()).credit.available, 10000000);
    assert.equal((await fetch(root + "/api/unknown")).status, 404);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    store.close();
    await rm(dir, { recursive: true, force: true });
  }
});
