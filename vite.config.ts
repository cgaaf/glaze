import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";
import tailwind from "@tailwindcss/vite";
import { highlight, languageOf } from "./docs/lib/highlight.ts";

export default defineConfig({
  root: "docs",
  base: process.env.DOCS_BASE || "./",
  plugins: [
    {
      // `import html, { helpers } from "./file.rx?highlighted"`: a file highlighted as HTML, here and not in
      // the browser, so a page is sent neither Shiki nor its grammars. A name ending `.txt` is a snippet in the
      // language its name ends with before that (`install.sh.txt`). `helpers` names the docs/lib modules the
      // file imports, whose source the page shows beside it.
      name: "glaze-highlighted-source",
      enforce: "pre",
      resolveId(id, importer) {
        // The suffix keeps other plugins from treating the module as the kind of file it quotes.
        if (id.endsWith("?highlighted") && importer)
          return "\0glaze-highlighted:" + resolve(importer, "..", id.slice(0, -12)) + ".mjs";
      },
      load(id) {
        if (!id.startsWith("\0glaze-highlighted:")) return;
        const file = id.slice(19, -4);
        this.addWatchFile(file);
        // An example imports the library by its path in this repository; a reader's copy is in ./ui.
        const text = readFileSync(file, "utf8")
          .replaceAll(/"(?:\.\.\/)+src\//g, '"./ui/')
          .replaceAll(/"(?:\.\.\/)+lib\//g, '"./');
        const helpers = Array.from(text.matchAll(/from "\.\/([\w-]+)\.js"/g), (match) => match[1]);
        const html = highlight(text.trimEnd(), languageOf(file.replace(/\.txt$/, "")));
        return `export default ${JSON.stringify(html)};\nexport const helpers = ${JSON.stringify(helpers)};`;
      },
    },
    tailwind(),
    solid(),
  ],
  build: { outDir: "../dist/docs", emptyOutDir: true, target: "esnext" },
});
