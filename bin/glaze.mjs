#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const [command, target = "src/ui"] = process.argv.slice(2);
if (command !== "copy") {
  console.log("Usage: glaze copy [directory]  (default: src/ui)");
  process.exit(command ? 1 : 0);
}

const dest = resolve(target);
if (existsSync(dest)) {
  console.error(
    `Directory already exists: ${dest}. Choose a new directory to compare or merge an update.`,
  );
  process.exit(1);
}
mkdirSync(dirname(dest), { recursive: true });
const stage = mkdtempSync(join(dirname(dest), "." + basename(dest) + "-"));
try {
  cpSync(new URL("../src/bisque/", import.meta.url), join(stage, "bisque"), { recursive: true });
  cpSync(new URL("../src/glaze/", import.meta.url), join(stage, "glaze"), { recursive: true });
  renameSync(stage, dest);
  console.log(
    `Copied Glaze and Bisque to ${target}. Import glaze-ui/styles.css after Tailwind in your stylesheet.`,
  );
} finally {
  rmSync(stage, { recursive: true, force: true });
}
