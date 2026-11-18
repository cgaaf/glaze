export type ThemeChoices = {
  theme: string;
  mode: string;
  radius: number;
  font: string;
  shadow: string;
  density: string;
};
export type ThemeOption = { value: string; label: string };
export type ThemeKey = "Theme" | "Mode" | DesignToken;
export type DesignToken = "Font" | "Shadow" | "Density";
export declare const themes: Record<
  "porcelain" | "celadon" | "terracotta" | "cobalt",
  { name: string; light: string; dark: string }
>;
export declare const modes: Record<"system" | "light" | "dark", string>;
export declare const design: {
  Font: Record<"geist" | "system" | "serif" | "mono", string>;
  Shadow: Record<"soft" | "flat" | "raised", string>;
  Density: Record<"regular" | "compact" | "roomy", string>;
};
export declare function readTheme(): ThemeChoices;
// As ReactiveScript sees it: `ref ThemeChoices` reads as the current value.
export declare function createThemeChoices(): ThemeChoices;
export declare function setTheme(key: ThemeKey, value: string): void;
export declare function setRadius(value: number | number[]): void;
export declare function resetTokens(): void;
export type PaletteOption = ThemeOption & { color: string };
export declare function paletteOptions(): PaletteOption[];
export declare function modeOptions(): ThemeOption[];
export declare function tokenOptions(key: DesignToken): ThemeOption[];
