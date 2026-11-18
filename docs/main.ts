import { createApp } from "@reactivescript/runtime";
import {
  codeBlock,
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
import { setupTheme } from "./lib/theme";
import "./site.css";

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
const programs = import.meta.glob<Program>("./examples/*.rx");
const sources = import.meta.glob<string>("./examples/*.rx", {
  query: "?source",
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
  return `<a href="${url}" ${active ? 'aria-current="page"' : ""}>${glyph ? icon(glyph) : ""}${escape(name)}</a>`;
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
  document.body.classList.toggle("nav-open", open);
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}
menu.onclick = () => toggleMenu(menu.getAttribute("aria-expanded") !== "true");
search.oninput = navigation;
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
navigation();
function inline(text: string) {
  return escape(text).replace(/`([^`]+)`/g, "<code>$1</code>");
}
function api(parts: Part[]) {
  return (
    '<section class="api"><h2>API reference</h2>' +
    parts
      .map((part) => {
        const rows = [...part.props, ...part.dataAttributes, ...part.cssVariables]
          .map(
            (a) =>
              `<div class="api-row"><div><code>${escape(a.name)}</code>${a.type ? ` <small>${escape(a.type)}</small>` : ""}${a.required ? " · required" : ""}</div><p>${inline(a.description)}${a.default ? " Default: <code>" + escape(a.default) + "</code>." : ""}</p></div>`,
          )
          .join("");
        return `<details><summary><code>${escape(part.name)}</code>${icon("chevron-down")}</summary><p>${inline(part.description)}</p>${rows}</details>`;
      })
      .join("") +
    "</section>"
  );
}
async function mount(program: Program) {
  if (typeof globalThis.Temporal === "undefined") await import("temporal-polyfill/full/global");
  const app = createApp({ root: document.querySelector("#demo")! });
  app.mount(program.default(app));
}
if (component && Object.hasOwn(families, component)) {
  const meta = families[component];
  const file = "./examples/" + component + ".rx";
  const [program, source, reference] = await Promise.all([
    programs[file](),
    sources[file](),
    references["./api/" + component + ".json"](),
  ]);
  main.innerHTML =
    heading("Components", meta.name, meta.description) +
    '<section class="example-stage"><div class="stage-title">' +
    icon("eye") +
    ' Live preview</div><div id="demo"></div></section>' +
    '<details class="source"><summary>' +
    icon("code-xml") +
    " Example source " +
    icon("chevron-down") +
    "</summary>" +
    codeBlock(
      source.replaceAll("../../src/", "./ui/").replace("../lib/form-server.js", "./form-server.js"),
      component + ".rx",
    ) +
    (component === "form"
      ? codeBlock((await import("./lib/form-server.js?raw")).default, "form-server.js") +
        codeBlock("export fn createAccount(values: any): Promise<any>", "form-server.d.rx")
      : "") +
    "</details>" +
    api(reference.parts);
  await mount(program);
} else if (component || !["overview", "installation", "theming"].includes(page)) {
  main.innerHTML =
    heading("Documentation", "Page not found", "Choose a component from the catalog.") +
    directory();
} else if (page === "overview") {
  main.innerHTML = overview();
  await mount((await import("./overview.rx")) as Program);
} else {
  main.innerHTML = page === "installation" ? installation() : theming();
}
document.title = main.querySelector("h1")!.textContent + " · Glaze";
setupTheme();
document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => {
  button.onclick = async () => {
    const code = button.closest(".code-block")!.querySelector("code")!;
    try {
      await navigator.clipboard.writeText(code.textContent!);
      button.textContent = "Copied";
    } catch {
      const range = new Range();
      range.selectNodeContents(code);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      button.textContent = "Selected";
    }
  };
});
