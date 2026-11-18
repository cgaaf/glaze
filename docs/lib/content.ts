import catalog from "../catalog.json";
import { themes } from "./theme";
import installCommands from "../snippets/install.sh.txt?highlighted";
import viteConfig from "../snippets/vite.config.ts.txt?highlighted";
import appStylesheet from "../snippets/app.css.txt?highlighted";
import appComponent from "../snippets/app.rx.txt?highlighted";
import themeAttribute from "../snippets/theme-attribute.html.txt?highlighted";
import plumTheme from "../snippets/plum-theme.css.txt?highlighted";
import finishAttribute from "../snippets/finish.css.txt?highlighted";
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
  "AI & voice": "thinking-orb voice-glow voice-ring".split(" "),
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
/** A file to show: its name and its text as highlighted HTML (the build's `?highlighted`). */
type CodeFile = { label: string; html: string };
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
        `<pre id="${id}-panel-${index}" data-label="${escape(file.label)}"${files.length > 1 ? ` role="tabpanel" aria-labelledby="${id}-tab-${index}"` : ""}${index ? " hidden" : ""}><code translate="no">${file.html}</code></pre>`,
    )
    .join("");
  return `<div class="code-block ${className}"><div class="code-head">${name}<button class="code-copy" data-copy aria-label="Copy ${escape(files[0].label)}" title="Copy">${icon("copy")}${icon("check")}</button><span class="visually-hidden" role="status"></span></div><div class="code-body">${panels}</div><button class="code-expand" aria-expanded="false" hidden><span></span>${icon("chevron-down")}</button></div>`;
}
export function codeBlock(html: string, label: string, className = "") {
  return codeFiles([{ label, html }], className);
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
    <section class="studio" id="studio"><div class="studio-heading"><h2>Theme studio</h2><span>${icon("swatch-book")} 8 palettes, 3 finishes</span></div>
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
    codeBlock(installCommands, "Terminal") +
    `<h2>Configure Vite</h2>` +
    codeBlock(viteConfig, "vite.config.ts") +
    `<p>Import your stylesheet from the app entry. In the tsconfig used by <code translate="no">rx-tsc</code>, exclude <code translate="no">**/*.d.rx</code>. Date and time components use the browser’s Temporal API. The docs load <code translate="no">temporal-polyfill/full/global</code> on browsers that need it.</p>` +
    codeBlock(appStylesheet, "app.css") +
    `<h2>Use a component</h2>` +
    codeBlock(appComponent, "src/app.rx") +
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
    `<article class="guide"><h2>Choose a palette</h2><p>A palette is a primary color, an accent and three glow hues. Porcelain is the library default. The docs open in Celadon. Pick a swatch to apply a preset, try the finish, radius, font, elevation and density in the <a href="?#studio">theme studio</a>, or use Theme in the header to change them from any page.</p><div class="palette-options">${Object.entries(
      themes,
    )
      .map(
        ([id, v]) =>
          `<button data-pick="${id}" class="palette-choice sample-${id}"><i></i>${v.name}</button>`,
      )
      .join("")}</div>` +
    codeBlock(themeAttribute, "HTML") +
    `<h2>Choose a finish</h2><p>The finish is a second choice, independent of the palette: how much color and glass the surfaces carry. <strong>Matte</strong>, the default, keeps every surface solid. <strong>Satin</strong> turns what floats (menus, popovers, dialogs, toasts) into glass you can see through, adds a soft wash of the palette behind the page and a light sheen on the primary action. <strong>Gloss</strong> lets controls and panels show the page too, and gives primary actions a glow. Under reduced transparency, increased contrast or forced colors, every finish is solid, including numbers of your own.</p><p>A finish is six numbers. Set <code translate="no">data-glaze-finish</code> for a preset, or set the numbers yourself. The <code translate="no">glass</code> utility gives your own floating surfaces the same treatment, and <code translate="no">wash</code> paints the ambient color on the element that holds the page background.</p>` +
    codeBlock(finishAttribute, "app.css") +
    `<h2>Define your own theme</h2><p>Apply a theme attribute to the page or a containing element. Define both appearances with CSS <code translate="no">light-dark()</code>. A palette that sets only <code translate="no">--primary</code> works: the accent, the glow hues and the tint of the neutrals follow it until you set them. That holds for a rule on <code translate="no">data-glaze-theme</code>. A page with no theme attribute is Porcelain, so changing <code translate="no">--primary</code> on a bare <code translate="no">:root</code> keeps Porcelain's blue accent and glow: name your theme, or set those too.</p>` +
    codeBlock(plumTheme, "app.css") +
    `<h2>Semantic tokens</h2><dl class="tokens">${Object.entries({
      "--primary, --primary-foreground": "Selected controls and primary actions.",
      "--accent, --accent-foreground":
        "A second hue for status and secondary marks: a meter, today in a calendar. Defaults to the primary.",
      "--glow-1, --glow-2, --glow-3":
        "The hues of the thinking orb, the voice ring and glow, and the wash. They default to the primary and the accent.",
      "--tint, --tint-strength":
        "The hue the neutrals lean toward, and how far: 0 is grey, 12 is the gloss finish.",
      "--background, --foreground": "Page surface and body text.",
      "--card, --border, --input": "Solid surfaces, dividers, and input borders.",
      "--muted, --muted-foreground": "Secondary surfaces and supporting text.",
      "--surface, --surface-opacity":
        "What controls and panels are filled with: the card, as see-through as the finish says.",
      "--glass, --glass-opacity, --glass-blur":
        "What floating layers are made of: the card at an opacity, blurring what is behind it.",
      "--wash, --sheen":
        "The strength of the page's ambient color, and of the highlight on the primary action.",
      "--ring, --destructive": "Keyboard focus, error messages, and destructive actions.",
      "--radius, --glaze-font, --glaze-shadow": "Corner radius, font stack, and overlay elevation.",
      "--spacing":
        "Tailwind’s spacing unit. Component sizes and gaps are multiples of it, so it sets density.",
    })
      .map(([name, desc]) => `<dt><code translate="no">${name}</code></dt><dd>${desc}</dd>`)
      .join(
        "",
      )}</dl><p>The neutrals, the surface and the glass are mixed from the palette and the finish, so set palette tokens on <code translate="no">:root</code> or an element with <code translate="no">data-glaze-theme</code>, and finish tokens on <code translate="no">:root</code> or an element with <code translate="no">data-glaze-finish</code>. To take one out of the mix, set it directly: <code translate="no">--background: white</code>.</p><p>Each rendered part exposes a <code translate="no">data-glaze</code> attribute. Component rules use Tailwind’s components layer, so utility classes on a part can override its defaults.</p></article>`
  );
}
