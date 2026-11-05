// Public entry point of @rb/templates.
import { ClassicResume } from "./classic-resume";
import { MinimalPortfolio } from "./minimal-portfolio";
import { BannerResume } from "./pdf/banner";
import { CardResume } from "./pdf/card";
import { DiagonalResume } from "./pdf/diagonal";
import { NightResume } from "./pdf/night";
import { TimelineResume } from "./pdf/timeline";
import { ColumnResume } from "./pdf/column";
import { LineResume } from "./pdf/line";
import { SidebarResume } from "./pdf/sidebar";
import { SoftResume } from "./pdf/soft";
import { BentoPortfolio } from "./web/bento";
import { SplitPortfolio } from "./web/split";
import { StudioPortfolio } from "./web/studio";
import type { TemplateDefinition, TemplateTag } from "./types";

export type { TemplateDefinition, TemplateProps, TemplateTag } from "./types";
export { sampleResume } from "./sample";
export { Silhouette } from "./avatar";
export { formatPeriod, formatYearMonth, safeUrl } from "./format";
export { buildSeo, truncate, type SeoMeta, type SeoOverrides } from "./seo";

const minimalPortfolio: TemplateDefinition = {
  id: "minimal-portfolio",
  name: "مینیمال",
  kind: "PORTFOLIO",
  component: MinimalPortfolio,
};

const classicResume: TemplateDefinition = {
  id: "classic-pdf",
  name: "کلاسیک",
  kind: "PDF",
  component: ClassicResume,
};

const pdf = (
  id: string,
  name: string,
  component: TemplateDefinition["component"],
  tags: readonly TemplateTag[]
): TemplateDefinition => ({ id, name, kind: "PDF", component, tags });

/** Printable resume templates, in the order shown to users. */
export const PDF_TEMPLATES: readonly TemplateDefinition[] = [
  pdf("sidebar-pdf", "ستون رنگی", SidebarResume, ["sidebar", "creative", "photo"]),
  pdf("soft-pdf", "ستون روشن", SoftResume, ["sidebar", "formal", "photo"]),
  pdf("banner-pdf", "سربرگ", BannerResume, ["creative", "photo"]),
  pdf("card-pdf", "کارت", CardResume, ["creative", "photo"]),
  pdf("column-pdf", "ستون عکس‌دار", ColumnResume, ["sidebar", "creative", "photo"]),
  pdf("timeline-pdf", "مسیر", TimelineResume, ["sidebar", "creative", "photo"]),
  pdf("diagonal-pdf", "مورب", DiagonalResume, ["formal", "photo"]),
  pdf("night-pdf", "شب", NightResume, ["dark", "creative", "photo"]),
  pdf("line-pdf", "خطی", LineResume, ["formal", "photo"]),
  { ...classicResume, tags: ["formal"] },
];

const web = (id: string, name: string, component: TemplateDefinition["component"]): TemplateDefinition => ({
  id,
  name,
  kind: "PORTFOLIO",
  component,
});

/** Website templates, in the order shown to users. */
export const PORTFOLIO_TEMPLATES: readonly TemplateDefinition[] = [
  minimalPortfolio,
  web("studio-portfolio", "استودیو", StudioPortfolio),
  web("split-portfolio", "دوستونه", SplitPortfolio),
  web("bento-portfolio", "کارت‌ها", BentoPortfolio),
];

/** Registry of available templates, keyed by Template.id in the database. */
export const TEMPLATES: Readonly<Record<string, TemplateDefinition>> = Object.fromEntries(
  [...PORTFOLIO_TEMPLATES, ...PDF_TEMPLATES].map((t) => [t.id, t])
);

export const DEFAULT_PORTFOLIO_TEMPLATE_ID = minimalPortfolio.id;
export const DEFAULT_PDF_TEMPLATE_ID = "sidebar-pdf";

/** The printable template with this id, or the default one. */
export function getPdfTemplate(id: string | undefined): TemplateDefinition {
  const found = id ? TEMPLATES[id] : undefined;
  return found?.kind === "PDF" ? found : TEMPLATES[DEFAULT_PDF_TEMPLATE_ID]!;
}

/** Looks up a template, falling back to the default portfolio template for unknown ids. */
export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES[id] ?? minimalPortfolio;
}
