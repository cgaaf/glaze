// Catch a new Bisque family or part before a dependency update can silently omit it.
import assert from "node:assert/strict";
import { globSync, readFileSync } from "node:fs";
import { basename } from "node:path";

const families = globSync("src/bisque/*/*.rx").filter((file) => {
  const name = basename(file, ".rx");
  return file === `src/bisque/${name}/${name}.rx`;
});
const catalog = JSON.parse(readFileSync("docs/catalog.json", "utf8"));
const exportsOf = (file) =>
  [...readFileSync(file, "utf8").matchAll(/^export component (\w+)\(/gm)].map((m) => m[1]).sort();
let count = 0;
for (const file of families) {
  const family = basename(file, ".rx");
  const upstream = exportsOf(file);
  assert.deepEqual(exportsOf(`src/glaze/${family}.rx`), upstream, `Glaze parts for ${family}`);
  assert.ok(catalog[family], family);
  count += upstream.length;
}
assert.equal(Object.keys(catalog).length, families.length);
assert.deepEqual(
  globSync("docs/examples/*.rx")
    .map((file) => basename(file, ".rx"))
    .sort(),
  Object.keys(catalog).sort(),
);
assert.deepEqual(
  globSync("docs/api/*.json")
    .map((file) => basename(file, ".json"))
    .sort(),
  Object.keys(catalog).sort(),
);
for (const file of globSync("styles/icons/*.svg")) {
  assert.deepEqual(
    readFileSync(file),
    readFileSync("node_modules/lucide-static/icons/" + basename(file)),
    file,
  );
}
console.log(`Verified ${count} Bisque components across ${families.length} documented families.`);
