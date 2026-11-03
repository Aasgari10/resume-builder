/**
 * Visual theme settings for a resume or portfolio.
 * Kept separate from resume content so users can switch templates
 * or restyle without touching their data.
 */

import { z } from "zod";
import { SECTION_KEYS, type SectionKey } from "./resume.schema";

/* ───────────── Colors ───────────── */

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, "رنگ باید به فرمت #RRGGBB باشد");

export const colorsSchema = z.object({
  primary: hexColor, // headings, links, buttons
  accent: hexColor, // tags, icons, highlights
  background: hexColor, // page background
  surface: hexColor, // card and section background
  text: hexColor, // body text
  mutedText: hexColor, // dates, captions, secondary text
});

/* ───────────── Typography ───────────── */

// Only OFL-licensed fonts, since they are embedded in downloadable HTML exports.
export const FONTS = {
  vazirmatn: { label: "وزیرمتن", scripts: ["fa", "en"] },
  shabnam: { label: "شبنم", scripts: ["fa", "en"] },
  sahel: { label: "ساحل", scripts: ["fa", "en"] },
  inter: { label: "Inter", scripts: ["en"] },
  roboto: { label: "Roboto", scripts: ["en"] },
} as const;
export type FontKey = keyof typeof FONTS;

export const typographySchema = z.object({
  bodyFont: z.enum(Object.keys(FONTS) as [FontKey, ...FontKey[]]),
  headingFont: z.enum(Object.keys(FONTS) as [FontKey, ...FontKey[]]),
  scale: z.enum(["sm", "md", "lg"]).default("md"), // base font size
});

/* ───────────── Layout ───────────── */

export const layoutSchema = z.object({
  spacing: z.enum(["compact", "normal", "relaxed"]).default("normal"),
  radius: z.enum(["none", "sm", "md", "lg"]).default("md"), // corner rounding
});

/* ───────────── Section order and visibility ───────────── */

export const sectionConfigSchema = z.object({
  key: z.enum(SECTION_KEYS),
  visible: z.boolean().default(true),
  customTitle: z.string().max(60).optional(), // overrides the template's default heading
});

// Every section must appear exactly once; the array order is the render order.
const sectionsSchema = z
  .array(sectionConfigSchema)
  .refine(
    (list) =>
      list.length === SECTION_KEYS.length &&
      SECTION_KEYS.every((k) => list.filter((s) => s.key === k).length === 1),
    { message: "هر بخش باید دقیقاً یک بار در لیست باشد" }
  );

/* ───────────── Display options ───────────── */

export const displayOptionsSchema = z.object({
  showAvatar: z.boolean().default(true),
  showSkillLevel: z.boolean().default(false),
  dateFormat: z.enum(["jalali", "gregorian"]), // defaults from resume locale
  colorMode: z.enum(["light", "dark", "auto"]).default("light"), // portfolio templates only
});

/* ───────────── Full theme ───────────── */

export const themeSchema = z.object({
  version: z.literal(1),
  templateId: z.string().min(1),
  colors: colorsSchema,
  typography: typographySchema,
  layout: layoutSchema,
  sections: sectionsSchema,
  display: displayOptionsSchema,
  /** Template used for the printable resume (PDF); the default PDF template when missing. */
  pdfTemplateId: z.string().min(1).max(50).optional(),
});

export type Theme = z.infer<typeof themeSchema>;
export type Colors = z.infer<typeof colorsSchema>;
export type SectionConfig = z.infer<typeof sectionConfigSchema>;

/* ───────────── Color presets ───────────── */

// Starting palettes users can pick and then adjust.
// Literal keys keep COLOR_PRESETS.ocean typed as always present.
export const COLOR_PRESETS = {
  ocean: {
    label: "اقیانوسی",
    colors: {
      primary: "#1E5AA8",
      accent: "#0EA5A4",
      background: "#FFFFFF",
      surface: "#F4F7FB",
      text: "#1F2937",
      mutedText: "#6B7280",
    },
  },
  forest: {
    label: "جنگلی",
    colors: {
      primary: "#2F6B4F",
      accent: "#C08A2E",
      background: "#FFFFFF",
      surface: "#F3F6F2",
      text: "#1E2A24",
      mutedText: "#66746C",
    },
  },
  charcoal: {
    label: "زغالی",
    colors: {
      primary: "#111827",
      accent: "#E11D48",
      background: "#FFFFFF",
      surface: "#F5F5F5",
      text: "#111827",
      mutedText: "#6B7280",
    },
  },
} satisfies Record<string, { label: string; colors: Colors }>;

export type ColorPresetKey = keyof typeof COLOR_PRESETS;

/* ───────────── Defaults ───────────── */

export const defaultTheme = (
  templateId: string,
  locale: "fa" | "en" = "fa"
): Theme => ({
  version: 1,
  templateId,
  colors: COLOR_PRESETS.ocean.colors,
  typography: {
    bodyFont: locale === "fa" ? "vazirmatn" : "inter",
    headingFont: locale === "fa" ? "vazirmatn" : "inter",
    scale: "md",
  },
  layout: { spacing: "normal", radius: "md" },
  sections: SECTION_KEYS.map((key: SectionKey) => ({ key, visible: true })),
  display: {
    showAvatar: true,
    showSkillLevel: false,
    dateFormat: locale === "fa" ? "jalali" : "gregorian",
    colorMode: "light",
  },
});

/* ───────────── Derived colors ───────────── */

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

/** Relative luminance (WCAG) of a #RRGGBB color, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Blends two #RRGGBB colors; amount 0 returns `from`, 1 returns `to`. */
export function mixHex(from: string, to: string, amount: number): string {
  const a = channels(from);
  const b = channels(to);
  return `#${a.map((c, i) => Math.round(c + (b[i]! - c) * amount).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** Readable text color on top of a background: white on dark colors, near-black on light ones. */
export function onColor(background: string): string {
  // Contrast with white vs. with #111827; pick the higher one.
  const l = luminance(background);
  const withWhite = 1.05 / (l + 0.05);
  const withDark = (l + 0.05) / (luminance("#111827") + 0.05);
  return withWhite >= withDark ? "#FFFFFF" : "#111827";
}

/** Swatches for the main color picker; only the primary color changes, backgrounds stay as they are. */
export const PRIMARY_SWATCHES = [
  { label: "سرمه‌ای", value: "#1E3A5F" },
  { label: "آبی", value: "#1E5AA8" },
  { label: "فیروزه‌ای", value: "#0E7C86" },
  { label: "سبز", value: "#2F6B4F" },
  { label: "زیتونی", value: "#5B7A3A" },
  { label: "طلایی", value: "#B7832F" },
  { label: "نارنجی", value: "#C2551F" },
  { label: "زرشکی", value: "#7A2332" },
  { label: "صورتی", value: "#B83B6A" },
  { label: "بنفش", value: "#5B3E96" },
  { label: "زغالی", value: "#2B2F36" },
  { label: "مشکی", value: "#111111" },
] as const;

/* ───────────── CSS variables ───────────── */

// Templates read styling only from these variables,
// so theme changes apply without template code changes.
const SCALE = { sm: "14px", md: "16px", lg: "18px" };
const SPACING = { compact: "0.75", normal: "1", relaxed: "1.35" };
const RADIUS = { none: "0", sm: "4px", md: "8px", lg: "16px" };

export function themeToCssVars(theme: Theme): Record<string, string> {
  const { colors, typography, layout } = theme;
  return {
    "--color-primary": colors.primary,
    // Derived from the primary color, so templates stay readable for any choice.
    "--color-on-primary": onColor(colors.primary),
    "--color-primary-soft": mixHex(colors.primary, "#FFFFFF", 0.9),
    "--color-primary-tint": mixHex(colors.primary, "#FFFFFF", 0.75),
    "--color-primary-strong": mixHex(colors.primary, "#000000", 0.25),
    "--color-accent": colors.accent,
    "--color-bg": colors.background,
    "--color-surface": colors.surface,
    "--color-text": colors.text,
    "--color-muted": colors.mutedText,
    "--font-body": `"${typography.bodyFont}", sans-serif`,
    "--font-heading": `"${typography.headingFont}", sans-serif`,
    "--font-size-base": SCALE[typography.scale],
    "--space-factor": SPACING[layout.spacing],
    "--radius": RADIUS[layout.radius],
  };
}
