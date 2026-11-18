import { highlight } from "./highlight";
import { readTheme, resetTokens, setTheme, themes } from "./theme-state.js";
export { themes };
type Palette = keyof typeof themes;
const root = document.documentElement;
/** The theme as CSS a reader can paste: the tokens as the page resolves them now. */
function themeCss() {
  const style = getComputedStyle(root);
  const names = [
    "--primary",
    "--primary-foreground",
    "--muted",
    "--radius",
    "--glaze-font",
    "--glaze-shadow",
  ];
  if (root.dataset.glazeDensity) names.push("--spacing");
  return `:root {\n${names.map((name) => `  ${name}: ${style.getPropertyValue(name).trim()};`).join("\n")}\n}`;
}
/**
 * Keeps the page chrome and the studio's palette fan, caption and CSS in step with the theme. The controls
 * (theme-menu.rx, studio-tokens.rx) change it through theme-state.js, which announces each change.
 */
export function setupTheme() {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  function update() {
    const choices = readTheme();
    const current = themes[choices.theme as Palette] ?? themes.celadon;
    const style = getComputedStyle(root);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", style.backgroundColor);
    document.querySelectorAll<HTMLButtonElement>("[data-pick]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.pick === choices.theme));
    });
    document.querySelectorAll("[data-theme-name]").forEach((el) => {
      el.textContent = current.name;
    });
    document.querySelectorAll("[data-theme-code]").forEach((el) => {
      const dark = choices.mode === "dark" || (choices.mode === "system" && systemDark.matches);
      el.textContent = (dark ? current.dark : current.light).toUpperCase();
    });
    document.querySelectorAll("[data-theme-css] code").forEach((el) => {
      el.innerHTML = highlight(themeCss(), "css");
    });
  }
  document.addEventListener("glaze-theme-change", update);
  systemDark.addEventListener("change", update);
  document.querySelectorAll<HTMLButtonElement>("[data-pick]").forEach((button) => {
    button.addEventListener("click", () => setTheme("Theme", button.dataset.pick!));
  });
  document.querySelector("[data-design-reset]")?.addEventListener("click", resetTokens);
  update();
}
