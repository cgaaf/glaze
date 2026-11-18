import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Copy the pinned upstream source into the relative import tree used by both Glaze and its consumers. */
function copyBisque(target) {
  const cli = fileURLToPath(
    new URL("bin/bisque.mjs", import.meta.resolve("bisque-ui/package.json")),
  );
  const result = spawnSync(process.execPath, [cli, "copy", target], { encoding: "utf8" });
  if (result.error || result.status !== 0) throw result.error ?? new Error(result.stderr);

  // Bisque 80c4415 reads its parent menu, then provides the child menu. Solid production
  // components can share an owner. Give the provider its own reactive region so these
  // contexts remain distinct and a submenu doesn't subscribe to itself during mount.
  const file = join(target, "menu/menu.rx");
  const source = readFileSync(file, "utf8");
  const subtree = source.match(
    /^  <SubmenuProvider parent=\{parent\}[^\n]+>\n    \{props.children\}\n  <\/SubmenuProvider>$/m,
  );
  if (!subtree)
    throw new Error(
      "The Bisque submenu implementation changed. Recheck its production ownership boundary.",
    );
  const nested = subtree[0]
    .split("\n")
    .map((line) => "  " + line)
    .join("\n");
  writeFileSync(file, source.replace(subtree[0], "  if true {\n" + nested + "\n  }"));
}

copyBisque("src/bisque");
