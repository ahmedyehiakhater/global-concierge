import { spawn } from "node:child_process";
import { mkdirSync, openSync, closeSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
const base = resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  data = resolve(process.env.GC_DATA_DIR || resolve(base, "data"));
const url = `http://127.0.0.1:${Number(process.env.GC_PORT || 8787)}`;
async function running() {
  try {
    const state = JSON.parse(readFileSync(resolve(data, "running.json")));
    const r = await fetch(url + "/__gc/status", {
      headers: { "X-GC-Control": state.token },
      signal: AbortSignal.timeout(1000),
    });
    return r.ok && (await r.json()).app === "global-concierge" ? state : null;
  } catch {
    return null;
  }
}
function browser() {
  if (process.env.GC_NO_BROWSER === "1") return;
  const child = spawn(
    "cmd.exe",
    ["/d", "/c", "start", "", url + "/opening.html"],
    { windowsHide: true, stdio: "ignore" },
  );
  child.on("error", () =>
    console.log("Open " + url + "/opening.html in your browser."),
  );
  child.unref();
}
try {
  mkdirSync(data, { recursive: true });
  let state = await running();
  if (process.argv[2] === "stop") {
    if (!state) console.log("No running copy of this demo was found.");
    else {
      await fetch(url + "/__gc/stop", {
        method: "POST",
        headers: { "X-GC-Control": state.token },
        signal: AbortSignal.timeout(3000),
      });
      console.log("Demo stopped. Saved sessions are retained.");
    }
  } else {
    if (!state) {
      const log = openSync(resolve(data, "server.log"), "a");
      const child = spawn(
        process.execPath,
        [resolve(base, "packaging/run.js")],
        {
          cwd: base,
          detached: true,
          windowsHide: true,
          stdio: ["ignore", log, log],
        },
      );
      let failed = null;
      child.on("error", (e) => (failed = e));
      child.unref();
      closeSync(log);
      for (let i = 0; i < 40 && !state; i++) {
        await delay(250);
        if (failed) throw failed;
        state = await running();
      }
      if (!state)
        throw Error(
          "The demo could not start. Check data\\server.log. Port 8787 may already be in use, or this PC may block the runtime.",
        );
    }
    browser();
    console.log("Ready: " + url + "/opening.html");
    console.log(
      "Use Stop Global Concierge when finished. Closing the browser alone does not stop the backend.",
    );
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
