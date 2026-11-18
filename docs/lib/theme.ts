export const themes = {
  porcelain: { name: "Porcelain", light: "#272b29", dark: "#e8ebe7" },
  celadon: { name: "Celadon", light: "#27654d", dark: "#94d2ab" },
  terracotta: { name: "Terracotta", light: "#9c4a34", dark: "#f1ae94" },
  cobalt: { name: "Cobalt", light: "#3e569c", dark: "#aebff7" },
};
type Palette = keyof typeof themes;
const root = document.documentElement;
export function setupTheme() {
  const palette = document.querySelector<HTMLSelectElement>("#palette")!;
  const mode = document.querySelector<HTMLSelectElement>("#mode")!;
  for (const [id, { name }] of Object.entries(themes)) palette.add(new Option(name, id));
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  function update() {
    const theme = root.dataset.glazeTheme as Palette;
    const current = themes[theme] ?? themes.celadon;
    palette.value = theme;
    mode.value = root.dataset.glazeMode ?? "system";
    document.querySelectorAll<HTMLButtonElement>("[data-pick]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.pick === theme));
    });
    document.querySelectorAll("[data-theme-name]").forEach((el) => {
      el.textContent = current.name;
    });
    document.querySelectorAll("[data-theme-code]").forEach((el) => {
      const dark = mode.value === "dark" || (mode.value === "system" && systemDark.matches);
      el.textContent = (dark ? current.dark : current.light).toUpperCase();
    });
  }
  function set(key: "Theme" | "Mode", value: string) {
    root.dataset["glaze" + key] = value;
    try {
      localStorage.setItem("glaze" + key, value);
    } catch {
      /* Private browsing can disable storage. */
    }
    update();
  }
  palette.addEventListener("change", () => set("Theme", palette.value));
  systemDark.addEventListener("change", update);
  mode.addEventListener("change", () => set("Mode", mode.value));
  document.querySelectorAll<HTMLButtonElement>("[data-pick]").forEach((button) => {
    button.addEventListener("click", () => set("Theme", button.dataset.pick!));
  });
  update();
}
