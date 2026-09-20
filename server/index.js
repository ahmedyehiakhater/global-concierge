import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { openStore } from "./store.js";
import { createApi } from "./app.js";
const file = resolve(process.env.GC_DATABASE || "data/concierge.sqlite");
mkdirSync(dirname(file), { recursive: true });
const store = openStore(file),
  server = createApi(store);
server.requestTimeout = 15000;
server.listen(8787, "127.0.0.1", () =>
  console.log("Global Concierge API: http://127.0.0.1:8787"),
);
function stop() {
  server.close(() => {
    store.close();
    process.exit(0);
  });
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
