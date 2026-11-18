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
// Layout parts Glaze adds to a Bisque family. Every other part keeps its Bisque name.
/** @type {Record<string, string[]>} */
const additions = {
  dialog: ["DialogFooter"],
  "alert-dialog": ["AlertDialogFooter"],
  drawer: ["DrawerFooter"],
  popover: ["PopoverFooter"],
  input: ["Textarea"],
};
let count = 0;
for (const file of families) {
  const family = basename(file, ".rx");
  const upstream = exportsOf(file);
  assert.deepEqual(
    exportsOf(`src/glaze/${family}.rx`),
    [...upstream, ...(additions[family] ?? [])].sort(),
    `Glaze parts for ${family}`,
  );
  assert.ok(catalog[family], family);
  count += upstream.length;
}
// Families with no Bisque family of their own: composed from Bisque parts, or drawn by Glaze itself.
const composed = {
  "segmented-control": ["SegmentedControlItem", "SegmentedControlRoot"],
  "thinking-orb": ["ThinkingOrb", "ThinkingStatus"],
  "voice-glow": ["VoiceGlow"],
  "voice-ring": ["VoiceRing"],
};
for (const [family, parts] of Object.entries(composed)) {
  assert.deepEqual(exportsOf(`src/glaze/${family}.rx`), parts, `Glaze parts for ${family}`);
  assert.ok(catalog[family], family);
  count += parts.length;
}
assert.equal(Object.keys(catalog).length, families.length + Object.keys(composed).length);
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
/** @type {Record<string, { id: string }[]>} */
const examples = JSON.parse(readFileSync("docs/examples.json", "utf8"));
assert.deepEqual(Object.keys(examples).sort(), Object.keys(catalog).sort());
assert.deepEqual(
  globSync("docs/examples/*/*.rx").sort(),
  Object.entries(examples)
    .flatMap(([family, entries]) => entries.map(({ id }) => `docs/examples/${family}/${id}.rx`))
    .sort(),
);
for (const file of globSync("styles/icons/*.svg")) {
  assert.deepEqual(
    readFileSync(file),
    readFileSync("node_modules/lucide-static/icons/" + basename(file)),
    file,
  );
}
console.log(
  `Verified ${count} components across ${families.length} Bisque and ${Object.keys(composed).length} composed families.`,
);
