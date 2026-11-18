import catalog from "../catalog.json";
import { themes } from "./theme";
import { highlight, languageOf } from "./highlight";
export const families: Record<string, { name: string; description: string }> = catalog;
export const groups: Record<string, string[]> = {
  "Inputs & forms":
    "button checkbox checkbox-group combobox autocomplete field fieldset file-upload form input listbox number-field otp-field radio segmented-control select slider switch tags-input toggle toggle-group".split(
      " ",
    ),
  Navigation:
    "accordion collapsible menu menubar navigation-menu pagination table-of-contents tabs toolbar".split(
      " ",
    ),
  Overlays: "alert-dialog context-menu dialog drawer popover preview-card tooltip".split(" "),
  "Date & time":
    "calendar date-field date-picker date-range-picker time-field time-picker time-range-picker".split(
      " ",
    ),
  "Display & layout": "avatar meter progress scroll-area separator sortable splitter toast".split(
    " ",
  ),
};
export function escape(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
export function icon(name: string) {
  return `<span data-glaze="icon" data-icon="${name}" aria-hidden="true"></span>`;
}
export function heading(section: string, title: string, description: string) {
  return `<div class="breadcrumb"><a href="?">Docs</a>${icon("chevron-right")}${escape(section)}</div><h1>${escape(title)}</h1><p class="lede">${escape(description)}</p>`;
}
type CodeFile = { label: string; text: string };
let blocks = 0;
/** One or more files behind a shared header: tabs when there are several, and one copy button for the file shown. */
export function codeFiles(files: CodeFile[], className = "") {
  const id = "code-" + ++blocks;
  const name =
    files.length > 1
      ? `<div class="code-tabs" role="tablist" aria-label="Files">${files
          .map(
            (file, index) =>
              `<button role="tab" id="${id}-tab-${index}" aria-controls="${id}-panel-${index}" aria-selected="${index === 0}" tabindex="${index ? -1 : 0}">${escape(file.label)}</button>`,
          )
          .join("")}</div>`
      : `<span class="code-name">${escape(files[0].label)}</span>`;
  const panels = files
    .map(
      (file, index) =>
        `<pre id="${id}-panel-${index}" data-label="${escape(file.label)}"${files.length > 1 ? ` role="tabpanel" aria-labelledby="${id}-tab-${index}"` : ""}${index ? " hidden" : ""}><code translate="no">${highlight(file.text.trimEnd(), languageOf(file.label))}</code></pre>`,
    )
    .join("");
  return `<div class="code-block ${className}"><div class="code-head">${name}<button class="code-copy" data-copy aria-label="Copy ${escape(files[0].label)}" title="Copy">${icon("copy")}${icon("check")}</button><span class="visually-hidden" role="status"></span></div><div class="code-body">${panels}</div><button class="code-expand" aria-expanded="false" hidden><span></span>${icon("chevron-down")}</button></div>`;
}
export function codeBlock(text: string, label: string, className = "") {
  return codeFiles([{ label, text }], className);
}
export function directory() {
  return `<section class="directory" id="components"><h2>Components</h2><div class="family-index">${Object.entries(
    groups,
  )
    .map(
      ([group, ids]) =>
        `<section><h3>${group}</h3>${ids.map((id) => `<a href="?component=${id}">${families[id].name}${icon("arrow-up-right")}</a>`).join("")}</section>`,
    )
    .join("")}</div></section>`;
}
export function overview() {
  return (
    '<header class="hero">' +
    heading(
      "Overview",
      "Component library",
      "Styled, accessible components for ReactiveScript. Built on Bisque, with Tailwind CSS and a theme you can make your own.",
    ) +
    `<div class="intro-actions"><a data-glaze="button" data-variant="default" href="?page=installation">Get started ${icon("arrow-right")}</a><a href="#components" class="browse-link">Browse components</a></div></header>
    <section class="studio" id="studio"><div class="studio-heading"><h2>Theme studio</h2><span>${icon("swatch-book")} 4 palettes, 4 tokens</span></div>
    <div class="studio-body"><div class="samples"><div class="sample-fan" role="group" aria-label="Select a theme palette">${Object.entries(
      themes,
    )
      .map(
        ([id, { name }]) =>
          `<button class="sample sample-${id}" data-pick="${id}" aria-label="Apply ${name} theme"><span class="sample-tints"><i></i><i></i><i></i></span><span class="sample-paper"><strong>${name}</strong></span></button>`,
      )
      .join("")}</div>
    <div class="sample-caption"><div><span class="active-dot"></span><strong data-theme-name></strong></div><code data-theme-code></code></div></div>
    <div class="live-example" id="demo"></div></div>
    <div id="studio-tokens"></div>
    <div class="studio-css" data-theme-css>${codeBlock("", "app.css")}</div>
    <div class="studio-footer"><span>${icon("circle-dot")} Changes apply to the whole site and are saved in this browser.</span><span class="studio-links"><button data-design-reset>Reset tokens</button><a href="?page=theming">Theming guide ${icon("arrow-up-right")}</a></span></div></section>` +
    directory()
  );
}
export function installation() {
  return (
    heading(
      "Getting started",
      "Installation",
      "Add the component source to a ReactiveScript app and load the Glaze stylesheet once.",
    ) +
    `<article class="guide"><h2>Install the package</h2><p>From the Glaze checkout, create a package tarball with <code translate="no">pnpm pack</code>. In your application, install that file along with the runtime and build tools.</p>` +
    codeBlock(
      "pnpm add /path/to/glaze-ui-0.1.0.tgz @reactivescript/runtime solid-js @solidjs/web\npnpm add -D vite @solidjs/vite-plugin @reactivescript/compiler @reactivescript/language-server tailwindcss @tailwindcss/vite\npnpm exec glaze copy src/ui",
      "Terminal",
    ) +
    `<h2>Configure Vite</h2>` +
    codeBlock(
      'import { defineConfig } from "vite"\nimport solid from "@solidjs/vite-plugin"\nimport tailwind from "@tailwindcss/vite"\n\nexport default defineConfig({ plugins: [tailwind(), solid()] })',
      "vite.config.ts",
    ) +
    `<p>Import your stylesheet from the app entry. In the tsconfig used by <code translate="no">rx-tsc</code>, exclude <code translate="no">**/*.d.rx</code>. Date and time components use the browser’s Temporal API. The docs load <code translate="no">temporal-polyfill/full/global</code> on browsers that need it.</p>` +
    codeBlock('@import "tailwindcss";\n@import "glaze-ui/styles.css";', "app.css") +
    `<h2>Use a component</h2>` +
    codeBlock(
      'import { Button } from "./ui/glaze/button.rx"\n\nexport default component App() {\n  <Button variant="outline">Hello, Glaze</Button>\n}',
      "src/app.rx",
    ) +
    `<p>Both Glaze and Bisque live in <code translate="no">src/ui</code> so relative ReactiveScript imports resolve. To upgrade, copy a new version to a fresh directory and merge your changes.</p></article>`
  );
}
export function theming() {
  return (
    heading(
      "Getting started",
      "Theming",
      "Change a few semantic tokens to update controls, overlays, and focus states together.",
    ) +
    `<article class="guide"><h2>Choose a palette</h2><p>Porcelain is the library default. The docs open in Celadon. Pick a swatch to apply a preset, try radius, font, elevation and density in the <a href="?#studio">theme studio</a>, or use Theme in the header to change the palette, color mode and tokens from any page.</p><div class="palette-options">${Object.entries(
      themes,
    )
      .map(
        ([id, v]) =>
          `<button data-pick="${id}" class="palette-choice sample-${id}"><i></i>${v.name}</button>`,
      )
      .join("")}</div>` +
    codeBlock('<html data-glaze-theme="celadon" data-glaze-mode="dark">', "HTML") +
    `<h2>Define your own theme</h2><p>Apply a theme attribute to the page or a containing element. Define both appearances with CSS <code translate="no">light-dark()</code>. Radius and font are inherited by the components.</p>` +
    codeBlock(
      '[data-glaze-theme="plum"] {\n  --primary: light-dark(#6a365e, #e0afd2);\n  --primary-foreground: light-dark(white, #32172d);\n  --ring: var(--primary);\n  --radius: 0.65rem;\n}',
      "app.css",
    ) +
    `<h2>Semantic tokens</h2><dl class="tokens">${Object.entries({
      "--background, --foreground": "Page surface and body text.",
      "--card, --border, --input": "Control surfaces, dividers, and input borders.",
      "--muted, --muted-foreground": "Secondary surfaces and supporting text.",
      "--primary, --primary-foreground": "Selected controls and primary actions.",
      "--ring, --destructive": "Keyboard focus, error messages, and destructive actions.",
      "--radius, --glaze-font, --glaze-shadow": "Corner radius, font stack, and overlay elevation.",
      "--spacing":
        "Tailwind’s spacing unit. Component sizes and gaps are multiples of it, so it sets density.",
    })
      .map(([name, desc]) => `<dt><code translate="no">${name}</code></dt><dd>${desc}</dd>`)
      .join(
        "",
      )}</dl><p>Each rendered part exposes a <code translate="no">data-glaze</code> attribute. Component rules use Tailwind’s components layer, so utility classes on a part can override its defaults.</p></article>`
  );
}
