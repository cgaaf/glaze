#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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
  const bisque = fileURLToPath(
    new URL("bin/bisque.mjs", import.meta.resolve("bisque-ui/package.json")),
  );
  const copy = spawnSync(process.execPath, [bisque, "copy", join(stage, "bisque")], {
    encoding: "utf8",
  });
  if (copy.error || copy.status !== 0) throw copy.error ?? new Error(copy.stderr);
  cpSync(new URL("../src/glaze/", import.meta.url), join(stage, "glaze"), { recursive: true });
  renameSync(stage, dest);
  console.log(
    `Copied Glaze and Bisque to ${target}. Import glaze-ui/styles.css after Tailwind in your stylesheet.`,
  );
} finally {
  rmSync(stage, { recursive: true, force: true });
}
