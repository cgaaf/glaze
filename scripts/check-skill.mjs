// Check the agent skill the package ships (skills/glaze-ui/SKILL.md) against the Agent Skills specification
// (https://agentskills.io/specification) and against the source, so it can't drift from the components.
// pnpm links a dependency's skills/<name>/ into an app's agent skill directories (https://pnpm.io/agent-skills).
// Runs after prepare:source, which fills src/bisque.
import assert from "node:assert/strict";
import { existsSync, globSync, readFileSync } from "node:fs";
import { basename } from "node:path";

const skillName = "glaze-ui";
const path = `skills/${skillName}/SKILL.md`;
const skill = readFileSync(path, "utf8");

// Frontmatter: `name` matches the directory, 1-64 of a-z, 0-9 and single inner hyphens; `description` 1-1024
// characters. pnpm links a skill under its directory name, so the two must agree.
const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1];
assert.ok(frontmatter, `${path}: missing YAML frontmatter`);
const field = (/** @type {string} */ key) =>
  new RegExp(`^${key}:\\s*(.*)$`, "m")
    .exec(frontmatter)?.[1]
    ?.trim()
    .replace(/^"(.*)"$/, "$1") ?? "";
const name = field("name");
const description = field("description");
assert.equal(name, skillName, `${path}: name must match its directory`);
assert.match(name, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${path}: invalid name`);
assert.ok(name.length <= 64, `${path}: name is longer than 64 characters`);
assert.ok(
  description.length >= 1 && description.length <= 1024,
  `${path}: description must be 1-1024 characters, is ${description.length}`,
);
assert.ok(skill.split("\n").length <= 500, `${path}: keep it under 500 lines`);

// The package ships the skill and every package path it points an agent to.
/** @type {{ files: string[] }} */
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const shipped = (/** @type {string} */ file) =>
  pkg.files.some((entry) => file === entry || file.startsWith(`${entry}/`));
assert.ok(shipped(path), `package.json files must include ${path}`);
for (const [, target] of skill.matchAll(/node_modules\/glaze-ui\/([^`\s)]+)/g)) {
  const file = target.replace(/\/?<[^>]+>.*$/, "").replace(/\/$/, "");
  assert.ok(
    existsSync(file),
    `${path} points to node_modules/glaze-ui/${target}, but ${file} doesn't exist`,
  );
  assert.ok(
    shipped(file),
    `${path} points to node_modules/glaze-ui/${target}, but package.json doesn't ship ${file}`,
  );
}

// Every `.rx` file the skill names is a Glaze family or a docs example.
const files = new Set([
  ...globSync("src/glaze/*.rx").map((file) => basename(file)),
  ...globSync("docs/examples/*/*.rx").map((file) => basename(file)),
]);
for (const [, file] of skill.matchAll(/`([\w-]+\.rx)`/g))
  assert.ok(files.has(file), `${path} names ${file}, which isn't a Glaze family or docs example`);

// Every part Glaze adds beyond Bisque's is named in the skill: an agent knows Bisque's parts from the skill's
// "same name" rule, but only the skill tells it about Icon, Textarea or a footer.
const exportsOf = (/** @type {string} */ glob) =>
  globSync(glob).flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(/^export component (\w+)\(/gm)].map((m) => m[1]),
  );
const bisque = new Set(exportsOf("src/bisque/*/*.rx"));
assert.ok(bisque.size > 0, "src/bisque is empty: run pnpm prepare:source first");
const additions = exportsOf("src/glaze/*.rx").filter((part) => !bisque.has(part));
const missing = additions.filter((part) => !new RegExp(`\\b${part}\\b`).test(skill));
assert.deepEqual(missing, [], `${path} doesn't mention these Glaze parts`);

console.log(`${path}: ok (${additions.length} Glaze additions named)`);
