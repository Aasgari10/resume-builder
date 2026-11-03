// The only theme changes the assistant may make. Anything outside this schema
// (template, content, raw CSS) is dropped before it reaches the theme.

import { z } from "zod";
import { FONTS, SECTION_KEYS, colorsSchema, layoutSchema, themeSchema, typographySchema, type FontKey, type SectionKey, type Theme } from "@rb/schema";

const sectionKey = z.enum(SECTION_KEYS);

export const themePatchSchema = z.object({
  colors: colorsSchema.partial().optional(),
  typography: typographySchema.partial().optional(),
  layout: layoutSchema.partial().optional(),
  /** Listed sections move to the top in this order; the rest keep their relative order. */
  sectionOrder: z.array(sectionKey).max(SECTION_KEYS.length).optional(),
  sectionVisibility: z.record(sectionKey, z.boolean()).optional(),
  /** Custom headings; an empty string restores the template's default heading. */
  sectionTitles: z.record(sectionKey, z.string().max(60)).optional(),
  display: z.object({ showAvatar: z.boolean(), showSkillLevel: z.boolean() }).partial().optional(),
});

export type ThemePatch = z.infer<typeof themePatchSchema>;

/** Expected model output: a short reply for the user and an optional patch. */
export const assistantReplySchema = z.object({
  reply: z.string().trim().min(1).max(500),
  changes: themePatchSchema.nullish(),
});

export type AssistantReply = z.infer<typeof assistantReplySchema>;

export const FONT_KEYS = Object.keys(FONTS) as FontKey[];

/** Applies a patch; templateId and fields outside the patch are kept as they are. */
export function applyThemePatch(theme: Theme, patch: ThemePatch): Theme {
  let sections = theme.sections.map((s) => ({ ...s }));

  if (patch.sectionOrder?.length) {
    const first = [...new Set(patch.sectionOrder)];
    sections = [
      ...first.map((key) => sections.find((s) => s.key === key)!).filter(Boolean),
      ...sections.filter((s) => !first.includes(s.key)),
    ];
  }
  for (const [key, visible] of Object.entries(patch.sectionVisibility ?? {}) as [SectionKey, boolean][]) {
    sections = sections.map((s) => (s.key === key ? { ...s, visible } : s));
  }
  for (const [key, title] of Object.entries(patch.sectionTitles ?? {}) as [SectionKey, string][]) {
    const customTitle = title.trim() || undefined;
    sections = sections.map((s) => (s.key === key ? { ...s, customTitle } : s));
  }

  return themeSchema.parse({
    ...theme,
    colors: { ...theme.colors, ...patch.colors },
    typography: { ...theme.typography, ...patch.typography },
    layout: { ...theme.layout, ...patch.layout },
    sections,
    display: { ...theme.display, ...patch.display },
    templateId: theme.templateId,
  });
}

/* ───────────── Readability ───────────── */

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #RRGGBB colors (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

function mix(hex: string, target: "#000000" | "#FFFFFF", amount: number): string {
  const t = target === "#000000" ? 0 : 255;
  const out = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(c + (t - c) * amount)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${out.join("")}`.toUpperCase();
}

/** Moves a foreground color toward black or white until it reaches the minimum contrast on both backgrounds. */
function readable(fg: string, backgrounds: string[], min: number): string {
  const ok = (c: string) => backgrounds.every((bg) => contrastRatio(c, bg) >= min);
  if (ok(fg)) return fg.toUpperCase();
  const darkBg = luminance(backgrounds[0]!) < 0.4;
  const target = darkBg ? "#FFFFFF" : "#000000";
  for (let step = 1; step <= 20; step++) {
    const candidate = mix(fg, target, step / 20);
    if (ok(candidate)) return candidate;
  }
  return target;
}

/** Fixes text colors that would be hard to read; returns whether anything changed. */
export function ensureReadable(theme: Theme): { theme: Theme; adjusted: boolean } {
  const { colors } = theme;
  const bgs = [colors.background, colors.surface];
  const fixed = {
    ...colors,
    text: readable(colors.text, bgs, 4.5),
    mutedText: readable(colors.mutedText, bgs, 3),
    primary: readable(colors.primary, [colors.background], 3),
  };
  const adjusted =
    fixed.text !== colors.text.toUpperCase() ||
    fixed.mutedText !== colors.mutedText.toUpperCase() ||
    fixed.primary !== colors.primary.toUpperCase();
  return { theme: adjusted ? { ...theme, colors: fixed } : theme, adjusted };
}

/* ───────────── Model output parsing ───────────── */

/** Extracts and validates the JSON object from a model reply (tolerates code fences and surrounding text). */
export function parseAssistantReply(content: string): AssistantReply | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = assistantReplySchema.safeParse(JSON.parse(content.slice(start, end + 1)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
