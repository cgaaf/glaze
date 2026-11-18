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
    "--accent",
    "--accent-foreground",
    "--glow-1",
    "--glow-2",
    "--glow-3",
    "--radius",
    "--glaze-font",
    "--glaze-shadow",
  ];
  // A finish is six numbers. Matte is the library default, so only another finish is written out.
  if (root.dataset.glazeFinish)
    names.push(
      "--tint-strength",
      "--glass-opacity",
      "--glass-blur",
      "--surface-opacity",
      "--wash",
      "--sheen",
    );
  if (root.dataset.glazeDensity) names.push("--spacing");
  return `:root {\n${names.map((name) => `  ${name}: ${style.getPropertyValue(name).trim()};`).join("\n")}\n}`;
}
/**
 * Keeps the page chrome and the studio's palette fan, caption and CSS in step with the theme. The controls
 * (theme-menu.rx, studio-tokens.rx) change it through theme-state.js, which announces each change.
 */
export function setupTheme() {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  // The theme's CSS is only known here, so it is the one block the build can't highlight. The highlighter is
  // fetched when a page has that block, which shows plain until it arrives.
  let highlight: typeof import("./highlight").highlight | undefined;
  function showCss() {
    const css = themeCss();
    document.querySelectorAll("[data-theme-css] code").forEach((el) => {
      if (highlight) el.innerHTML = highlight(css, "css");
      else el.textContent = css;
    });
  }
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
    showCss();
  }
  document.addEventListener("glaze-theme-change", update);
  systemDark.addEventListener("change", update);
  document.querySelectorAll<HTMLButtonElement>("[data-pick]").forEach((button) => {
    button.addEventListener("click", () => setTheme("Theme", button.dataset.pick!));
  });
  document.querySelector("[data-design-reset]")?.addEventListener("click", resetTokens);
  update();
  if (document.querySelector("[data-theme-css]"))
    void import("./highlight").then((module) => {
      highlight = module.highlight;
      // The theme as it is now, which may have changed while the highlighter was on its way.
      showCss();
    });
}
