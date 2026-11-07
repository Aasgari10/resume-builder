// Designed page colors of the website templates (background, cards, text, secondary text).
// A site shows these until the user picks other page colors for that template; the primary and
// accent colors always come from the user's theme. Kept apart from index.ts so the shared web
// kit can use it without importing every template.

import { luminance, mixHex, type Colors, type Theme } from "@rb/schema";

export type PageColors = Pick<Colors, "background" | "surface" | "text" | "mutedText">;

export const SITE_PALETTES: Record<string, PageColors> = {
  "vitrine-portfolio": { background: "#FFFFFF", surface: "#F4F7FB", text: "#1F2937", mutedText: "#6B7280" },
  "aseman-portfolio": { background: "#FFFFFF", surface: "#F4F7FB", text: "#1F2937", mutedText: "#6B7280" },
  "grid-portfolio": { background: "#0F0F10", surface: "#18181A", text: "#F4F4F5", mutedText: "#8E8E95" },
  "vcard-portfolio": { background: "#EDEFF3", surface: "#FFFFFF", text: "#1E2230", mutedText: "#6B7080" },
  "code-portfolio": { background: "#0B1222", surface: "#111B30", text: "#F1F5F9", mutedText: "#8C9AB3" },
  "simple-portfolio": { background: "#F7F7F5", surface: "#FFFFFF", text: "#1A1A1A", mutedText: "#737373" },
  "sepid-portfolio": { background: "#FFFFFF", surface: "#FCFCFC", text: "#333333", mutedText: "#8A8A8A" },
  "boutique-shop": { background: "#FFFFFF", surface: "#F4F4F4", text: "#111111", mutedText: "#6F6F6F" },
};

/** Ready-made page color sets for the editor (the template's own colors come first). */
export const PAGE_PRESETS: { key: string; label: string; colors: PageColors }[] = [
  { key: "white", label: "سفید", colors: { background: "#FFFFFF", surface: "#F5F6F8", text: "#1E2230", mutedText: "#6B7080" } },
  { key: "cream", label: "کرم", colors: { background: "#F4EFE6", surface: "#FFFDF8", text: "#2A241C", mutedText: "#7A7064" } },
  { key: "gray", label: "طوسی", colors: { background: "#E9EBEF", surface: "#FFFFFF", text: "#1C2028", mutedText: "#646B78" } },
  { key: "navy", label: "سرمه‌ای", colors: { background: "#0B1222", surface: "#131D33", text: "#F1F5F9", mutedText: "#8C9AB3" } },
  { key: "black", label: "مشکی", colors: { background: "#0F0F10", surface: "#1A1A1C", text: "#F4F4F5", mutedText: "#8E8E95" } },
];

/** Page colors built from one background color: cards, text and secondary text follow it. */
export function pageColorsFrom(background: string): PageColors {
  const dark = luminance(background) < 0.3;
  const text = dark ? "#F4F4F5" : "#1E2230";
  return {
    background: background.toUpperCase(),
    surface: dark ? mixHex(background, "#FFFFFF", 0.06) : mixHex(background, "#FFFFFF", 0.7),
    text,
    mutedText: mixHex(text, background, 0.45),
  };
}

/** Whether the theme's page colors were chosen for its current website template. */
export const ownColors = (theme: Theme) => theme.colorsFor === theme.templateId;

/** The theme a website template is drawn with: its designed page colors unless the user chose others. */
export function siteTheme(theme: Theme): Theme {
  const palette = SITE_PALETTES[theme.templateId];
  if (!palette || ownColors(theme)) return theme;
  return { ...theme, colors: { ...theme.colors, ...palette } };
}
