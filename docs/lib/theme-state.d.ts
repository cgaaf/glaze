export type ThemeChoices = {
  theme: string;
  mode: string;
  radius: number;
  finish: string;
  translucency: number;
  translucencyLabel: string;
  font: string;
  shadow: string;
  density: string;
};
export type ThemeOption = { value: string; label: string };
export type ThemeKey = "Theme" | "Mode" | DesignToken;
export type DesignToken = "Finish" | "Font" | "Shadow" | "Density";
export declare const themes: Record<
  "porcelain" | "celadon" | "terracotta" | "cobalt" | "raku" | "oxblood" | "majolica" | "kintsugi",
  { name: string; light: string; dark: string; accent: [light: string, dark: string] }
>;
export declare const modes: Record<"system" | "light" | "dark", string>;
export declare const design: {
  Finish: Record<"matte" | "satin" | "gloss", string>;
  Font: Record<"geist" | "system" | "serif" | "mono", string>;
  Shadow: Record<"soft" | "flat" | "raised", string>;
  Density: Record<"regular" | "compact" | "roomy", string>;
};
export declare function readTheme(): ThemeChoices;
// As ReactiveScript sees it: `ref ThemeChoices` reads as the current value.
export declare function createThemeChoices(): ThemeChoices;
export declare function setTheme(key: ThemeKey, value: string): void;
export declare function setRadius(value: number | number[]): void;
export declare function setTranslucency(value: number | number[]): void;
export declare function resetTokens(): void;
export type PaletteOption = ThemeOption & { swatch: string };
export declare function paletteOptions(): PaletteOption[];
export declare function modeOptions(): ThemeOption[];
export declare function tokenOptions(key: DesignToken): ThemeOption[];
