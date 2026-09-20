import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig({
  server: { proxy: { "/api": "http://127.0.0.1:8787" } },
  build: {
    rollupOptions: {
      input: {
        studio: resolve("index.html"),
        entry: resolve("entry.html"),
        product: resolve("product.html"),
        session: resolve("session.html"),
      },
    },
  },
});
