// The docs theme: the palette, color mode and design tokens, kept as `data-glaze-*` attributes and `--radius` on
// the root element and saved in localStorage under "glaze" + key. index.html restores the saved choices before
// the first paint with the same keys and values. Every change dispatches `glaze-theme-change` on the document.
import { createSignal, onCleanup } from "solid-js";

export const themes = {
  porcelain: { name: "Porcelain", light: "#272b29", dark: "#e8ebe7" },
  celadon: { name: "Celadon", light: "#27654d", dark: "#94d2ab" },
  terracotta: { name: "Terracotta", light: "#9c4a34", dark: "#f1ae94" },
  cobalt: { name: "Cobalt", light: "#3e569c", dark: "#aebff7" },
};
export const modes = { system: "System", light: "Light", dark: "Dark" };
// Tokens besides the palette. The first choice of each is the library default; the values live in site.css.
export const design = {
  Font: { geist: "Geist", system: "System", serif: "Serif", mono: "Mono" },
  Shadow: { soft: "Soft", flat: "Flat", raised: "Raised" },
  Density: { regular: "Regular", compact: "Compact", roomy: "Roomy" },
};

const root = document.documentElement;
const fallback = (key) => Object.keys(design[key])[0];

function save(key, value) {
  try {
    if (value === undefined) localStorage.removeItem("glaze" + key);
    else localStorage.setItem("glaze" + key, value);
  } catch {
    /* Private browsing can disable storage. */
  }
}
function changed() {
  document.dispatchEvent(new Event("glaze-theme-change"));
}

/** The choices as the page holds them now. */
export function readTheme() {
  const radius = parseFloat(getComputedStyle(root).getPropertyValue("--radius"));
  return {
    theme: root.dataset.glazeTheme ?? "celadon",
    mode: root.dataset.glazeMode ?? "system",
    radius: Number.isFinite(radius) ? radius : 0.6,
    font: root.dataset.glazeFont ?? fallback("Font"),
    shadow: root.dataset.glazeShadow ?? fallback("Shadow"),
    density: root.dataset.glazeDensity ?? fallback("Density"),
  };
}

/** The choices as a signal for ReactiveScript: it follows every change, from any control on the page. */
export function createThemeChoices() {
  const [choices, setChoices] = createSignal(readTheme());
  const sync = () => setChoices(readTheme());
  document.addEventListener("glaze-theme-change", sync);
  onCleanup(() => document.removeEventListener("glaze-theme-change", sync));
  return choices;
}

/** Sets the palette ("Theme"), "Mode" or a design token. A token's default removes its attribute. */
export function setTheme(key, value) {
  const standard = key in design && value === fallback(key);
  if (standard) delete root.dataset["glaze" + key];
  else root.dataset["glaze" + key] = value;
  save(key, standard ? undefined : value);
  changed();
}

/** Sets the radius in rem, rounded to the slider's 0.05 steps so no float noise is saved. */
export function setRadius(value) {
  const rem = Math.round((Array.isArray(value) ? value[0] : value) * 20) / 20;
  root.style.setProperty("--radius", rem + "rem");
  save("Radius", String(rem));
  changed();
}

/** Puts radius, font, elevation and density back to the library defaults. Palette and mode stay. */
export function resetTokens() {
  root.style.removeProperty("--radius");
  save("Radius", undefined);
  for (const key of Object.keys(design)) {
    delete root.dataset["glaze" + key];
    save(key, undefined);
  }
  changed();
}

const entries = (record) => Object.entries(record).map(([value, label]) => ({ value, label }));
/** Each palette with its primary as a `light-dark()` color, so a swatch follows the page's color mode. */
export function paletteOptions() {
  return Object.entries(themes).map(([value, { name, light, dark }]) => ({
    value,
    label: name,
    color: `light-dark(${light}, ${dark})`,
  }));
}
export function modeOptions() {
  return entries(modes);
}
export function tokenOptions(key) {
  return entries(design[key]);
}
