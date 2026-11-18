// Oxlint's shadcn plugin reads JSX. Project the literal utility lists from ReactiveScript and
// Tailwind's @apply declarations into a lintable file, keeping the original lines for diagnostics.
import { globSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const dir = mkdtempSync(".glaze-design-");
try {
  const origins = [];
  const examples = [];
  for (const file of globSync(["styles/*.css", "docs/**/*.rx", "src/glaze/*.rx", "docs/*.css"])) {
    const content = readFileSync(file, "utf8");
    const pattern = file.endsWith(".css") ? /@apply\s+([^;{}]+);/g : /\bclass="([^"]+)"/g;
    for (const match of content.matchAll(pattern)) {
      origins.push(file + ":" + content.slice(0, match.index).split("\n").length);
      examples.push('<div className="' + match[1].trim().replace(/\s+/g, " ") + '" />');
    }
  }
  const input = join(dir, "rules.tsx");
  writeFileSync(input, "<>\n" + examples.join("\n") + "\n</>");
  const lint = spawnSync("oxlint", ["-c", ".oxlintrc.json", "--format", "json", input], {
    encoding: "utf8",
  });
  if (lint.error) throw lint.error;
  for (const issue of JSON.parse(lint.stdout).diagnostics) {
    console.error(origins[issue.labels[0].span.line - 2], issue.code, issue.message);
  }
  if (lint.status) process.exitCode = lint.status;
  else console.log("Checked " + examples.length + " utility lists with @shadcn/lint.");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
