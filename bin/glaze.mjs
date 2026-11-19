#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";

const [command, target = "src/ui"] = process.argv.slice(2);
if (command !== "copy") {
  console.log("Usage: glaze copy [directory]  (default: src/ui)");
  process.exit(command ? 1 : 0);
}

// Table is built on @tanstack/table-core, the one package a family needs beyond ReactiveScript and Solid. It
// is copied only into an app that has the package: Bisque's TypeScript for it imports the package's types, so
// a copy without it would fail the app's type check whether or not the app used a table.
const hasTableCore = (() => {
  try {
    createRequire(join(process.cwd(), "package.json")).resolve("@tanstack/table-core");
    return true;
  } catch {
    return false;
  }
})();
const isTable = (file) =>
  /[\\/]bisque[\\/]table([\\/]|$)/.test(file) ||
  /[\\/]bisque[\\/]internal[\\/](impl[\\/])?table\.[a-z.]+$/.test(file) ||
  /[\\/]glaze[\\/]table\.rx$/.test(file);
const wanted = (file) => hasTableCore || !isTable(file);

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
  cpSync(new URL("../src/bisque/", import.meta.url), join(stage, "bisque"), {
    recursive: true,
    filter: wanted,
  });
  cpSync(new URL("../src/glaze/", import.meta.url), join(stage, "glaze"), {
    recursive: true,
    filter: wanted,
  });
  renameSync(stage, dest);
  console.log(
    `Copied Glaze and Bisque to ${target}. Import glaze-ui/styles.css after Tailwind in your stylesheet.`,
  );
  if (!hasTableCore) {
    console.log(
      "Table was left out: it needs @tanstack/table-core. Install it and copy to a new directory to add Table.",
    );
  }
} finally {
  rmSync(stage, { recursive: true, force: true });
}
