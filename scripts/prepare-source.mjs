import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  rmdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function filesIn(directory) {
  try {
    return readdirSync(directory, { recursive: true, withFileTypes: true })
      .filter((entry) => !entry.isDirectory())
      .map((entry) => join(entry.parentPath, entry.name).slice(directory.length + 1));
  } catch {
    return [];
  }
}

function read(file) {
  try {
    return readFileSync(file);
  } catch {
    return undefined;
  }
}

/**
 * Copy the pinned upstream source into the relative import tree used by both Glaze and its consumers.
 *
 * Bisque's own copy deletes the target and writes it again. A dev server that compiles a page in that
 * moment sees missing modules, and the ReactiveScript compiler keeps that failed build until one of the
 * files it names changes. So the copy goes to a staging directory, and only the files that differ are
 * written to the target: a file that hasn't changed is never missing and keeps its modification time.
 */
function copyBisque(target) {
  const cli = fileURLToPath(
    new URL("bin/bisque.mjs", import.meta.resolve("bisque-ui/package.json")),
  );
  mkdirSync("node_modules/.cache", { recursive: true });
  const staging = mkdtempSync("node_modules/.cache/bisque-");
  try {
    const result = spawnSync(process.execPath, [cli, "copy", staging], { encoding: "utf8" });
    if (result.error || result.status !== 0) throw result.error ?? new Error(result.stderr);
    const next = new Set(filesIn(staging));
    for (const file of next) {
      const content = readFileSync(join(staging, file));
      if (read(join(target, file))?.equals(content)) continue;
      mkdirSync(dirname(join(target, file)), { recursive: true });
      writeFileSync(join(target, file), content);
    }
    for (const file of filesIn(target)) {
      if (next.has(file) || file.endsWith(".DS_Store")) continue;
      rmSync(join(target, file));
      try {
        rmdirSync(dirname(join(target, file)));
      } catch {
        /* The directory still holds other files. */
      }
    }
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

copyBisque("src/bisque");
