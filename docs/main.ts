import { createApp } from "@reactivescript/runtime";
import {
  codeFiles,
  directory,
  escape,
  families,
  groups,
  heading,
  icon,
  installation,
  overview,
  theming,
} from "./lib/content";
import { setupCodeBlocks } from "./lib/code";
import { setupTheme } from "./lib/theme";
import examples from "./examples.json";
import * as contentsProgram from "./page-contents.rx";
import * as themeMenuProgram from "./theme-menu.rx";

type Program = { default: (app: ReturnType<typeof createApp>) => () => unknown };
type Attribute = {
  name: string;
  description: string;
  type?: string;
  default?: string | null;
  required?: boolean;
};
type Part = {
  name: string;
  description: string;
  props: Attribute[];
  dataAttributes: Attribute[];
  cssVariables: Attribute[];
};
const programs = import.meta.glob<Program>("./examples/**/*.rx");
// Each file a page shows, as the HTML the build highlighted it to (vite.config.ts).
type Highlighted = { default: string; helpers: string[] };
const sources = import.meta.glob<Highlighted>("./examples/**/*.rx", { query: "?highlighted" });
const helperSources = import.meta.glob<string>("./lib/*.js", {
  query: "?highlighted",
  import: "default",
});
const declarations = import.meta.glob<string>("./lib/*.d.rx", {
  query: "?highlighted",
  import: "default",
});
const references = import.meta.glob<{ parts: Part[] }>("./api/*.json", { import: "default" });
const query = new URLSearchParams(location.search);
const component = query.get("component");
const page = query.get("page") ?? "overview";
const main = document.querySelector<HTMLElement>("#main")!;
const search = document.querySelector<HTMLInputElement>("#search")!;
const nav = document.querySelector<HTMLElement>("#navigation")!;
const menu = document.querySelector<HTMLButtonElement>(".mobile-menu")!;
function link(url: string, name: string, active: boolean, glyph = "") {
  const target = new URL(url, location.href);
  if (search.value) target.searchParams.set("q", search.value);
  return `<a href="${escape(target.search || "?")}" ${active ? 'aria-current="page"' : ""}>${glyph ? icon(glyph) : ""}${escape(name)}</a>`;
}
function navigation() {
  const term = search.value.trim().toLowerCase();
  const lists = Object.entries(groups)
    .map(([group, items]) => {
      const found = items.filter(
        (id) => families[id].name.toLowerCase().includes(term) || id.includes(term),
      );
      return found.length
        ? `<h3>${group}</h3>${found.map((id) => link("?component=" + id, families[id].name, id === component)).join("")}`
        : "";
    })
    .join("");
  nav.innerHTML =
    (term
      ? ""
      : `<h3>Getting started</h3>${link("?", "Overview", !component && page === "overview", "panels-top-left")}${link("?page=installation", "Installation", !component && page === "installation", "download")}${link("?page=theming", "Theming", !component && page === "theming", "palette")}`) +
    (lists || '<p role="status">No matching components.</p>');
}
function toggleMenu(open: boolean) {
  main.inert = open;
  document.body.classList.toggle("nav-open", open);
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}
matchMedia("(max-width: 760px)").addEventListener("change", () => toggleMenu(false));
document.querySelector(".skip")!.addEventListener("click", () => toggleMenu(false));
menu.onclick = () => toggleMenu(menu.getAttribute("aria-expanded") !== "true");
function restoreSearch() {
  search.value = new URL(location.href).searchParams.get("q") ?? "";
  navigation();
}
search.oninput = () => {
  const url = new URL(location.href);
  if (search.value) url.searchParams.set("q", search.value);
  else url.searchParams.delete("q");
  history.replaceState(history.state, "", url);
  navigation();
};
window.addEventListener("pageshow", restoreSearch);
window.addEventListener("popstate", restoreSearch);
document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !event.ctrlKey &&
    !event.metaKey &&
    !(
      event.target instanceof HTMLElement &&
      (event.target.matches("input,textarea,select") || event.target.isContentEditable)
    )
  ) {
    event.preventDefault();
    if (getComputedStyle(menu).display !== "none") toggleMenu(true);
    search.focus();
  } else if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
    toggleMenu(false);
    menu.focus();
  }
});
restoreSearch();
function inline(text: string) {
  return escape(text).replace(/`([^`]+)`/g, '<code translate="no">$1</code>');
}
function api(parts: Part[]) {
  return (
    '<section class="api"><h2 id="api-reference" data-page-section>API reference</h2>' +
    parts
      .map((part) => {
        const rows = [...part.props, ...part.dataAttributes, ...part.cssVariables]
          .map(
            (a) =>
              `<div class="api-row"><div><code translate="no">${escape(a.name)}</code>${a.type ? ` <small>${escape(a.type)}</small>` : ""}${a.required ? " · required" : ""}</div><p>${inline(a.description)}${a.default ? " Default: <code translate='no'>" + escape(a.default) + "</code>." : ""}</p></div>`,
          )
          .join("");
        return `<details><summary><code translate="no">${escape(part.name)}</code>${icon("chevron-down")}</summary><p>${inline(part.description)}</p>${rows}</details>`;
      })
      .join("") +
    "</section>"
  );
}
async function mount(program: Program, root: Element) {
  if (typeof globalThis.Temporal === "undefined") await import("temporal-polyfill/full/global");
  const app = createApp({ root });
  app.mount(program.default(app));
}
// The header's theme menu is on every page; it mounts while the page renders.
const themeMenu = mount(themeMenuProgram, document.querySelector("#theme-menu")!);

type Example = { id: string; title: string; description: string };
async function loadExample(family: string, example?: Example) {
  const name = example?.id ?? family;
  const file = "./examples/" + (example ? family + "/" : "") + name + ".rx";
  const id = example?.id ?? "preview";
  const title = example?.title ?? "Live preview";
  const stageTitle = example
    ? ""
    : `<h2 class="stage-title" id="preview" data-page-section>${icon("eye")} Live preview</h2>`;
  const introduction = example
    ? `<h2 id="${id}" data-page-section>${escape(title)}</h2><p class="example-description">${inline(example.description)}</p>`
    : "";
  // One example that fails to compile or load shouldn't take the rest of the page with it.
  const [program, source] = await Promise.all([
    programs[file]().catch((error: unknown) => {
      console.error(error);
      return undefined;
    }),
    sources[file](),
  ]);
  const helpers = await Promise.all(
    source.helpers.map(async (helper) => {
      const [js, rx] = await Promise.all([
        helperSources["./lib/" + helper + ".js"](),
        declarations["./lib/" + helper + ".d.rx"](),
      ]);
      return [
        { label: helper + ".js", html: js },
        { label: helper + ".d.rx", html: rx },
      ];
    }),
  );
  const stage = program
    ? `<div class="demo" id="${example ? "demo-" + id : "demo"}"></div>`
    : `<p class="demo-error" role="alert">This example failed to load. The browser console has the error.</p>`;
  const html = `<section class="doc-example">
    ${introduction}
    <div class="example-stage">${stageTitle}${stage}</div>
    ${codeFiles([{ label: name + ".rx", html: source.default }, ...helpers.flat()], "source")}
  </section>`;
  return { program, html };
}

if (component && Object.hasOwn(families, component)) {
  const meta = families[component];
  const [demos, reference] = await Promise.all([
    Promise.all([
      loadExample(component),
      ...examples[component as keyof typeof examples].map((item) => loadExample(component, item)),
    ]),
    references["./api/" + component + ".json"](),
  ]);
  main.classList.add("component-page");
  main.innerHTML =
    '<header class="component-intro">' +
    heading("Components", meta.name, meta.description) +
    "</header>" +
    '<aside class="page-contents"><div id="contents"></div></aside>' +
    '<article class="component-article">' +
    demos.map((demo) => demo.html).join("") +
    api(reference.parts) +
    "</article>";
  const loaded = demos.flatMap((demo) => (demo.program ? [demo.program] : []));
  const roots = main.querySelectorAll(".demo");
  await Promise.all(loaded.map((program, index) => mount(program, roots[index])));
  await mount(contentsProgram, main.querySelector("#contents")!);
} else if (component || !["overview", "installation", "theming"].includes(page)) {
  main.innerHTML =
    heading("Documentation", "Page not found", "Choose a component from the catalog.") +
    directory();
} else if (page === "overview") {
  main.innerHTML = overview();
  await Promise.all([
    mount(await import("./overview.rx"), document.querySelector("#demo")!),
    mount(await import("./studio-tokens.rx"), document.querySelector("#studio-tokens")!),
  ]);
} else {
  main.innerHTML = page === "installation" ? installation() : theming();
}
document.title = main.querySelector("h1")!.textContent + " · Glaze";
setupCodeBlocks();
setupTheme();
await themeMenu;
// The page is rendered after the browser looked for the fragment, so go to it now, without the animation.
if (location.hash)
  document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "instant" });
