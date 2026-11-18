import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  root: "docs",
  base: process.env.DOCS_BASE || "./",
  plugins: [
    {
      name: "glaze-example-source",
      enforce: "pre",
      resolveId(id, importer) {
        if (id.endsWith(".rx?source") && importer)
          return "\0glaze-source:" + resolve(importer, "..", id.slice(0, -7)) + ".mjs";
      },
      load(id) {
        if (!id.startsWith("\0glaze-source:")) return;
        const file = id.slice(14, -4);
        this.addWatchFile(file);
        return "export default " + JSON.stringify(readFileSync(file, "utf8"));
      },
    },
    tailwind(),
    solid(),
  ],
  build: { outDir: "../dist/docs", emptyOutDir: true, target: "esnext" },
});
