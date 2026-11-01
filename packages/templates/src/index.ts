// Public entry point of @rb/templates.
import { MinimalPortfolio } from "./minimal-portfolio";
import type { TemplateDefinition } from "./types";

export type { TemplateDefinition, TemplateProps } from "./types";
export { sampleResume } from "./sample";
export { formatPeriod, formatYearMonth, safeUrl } from "./format";

const minimalPortfolio: TemplateDefinition = {
  id: "minimal-portfolio",
  name: "مینیمال",
  kind: "PORTFOLIO",
  component: MinimalPortfolio,
};

/** Registry of available templates, keyed by Template.id in the database. */
export const TEMPLATES: Readonly<Record<string, TemplateDefinition>> = {
  [minimalPortfolio.id]: minimalPortfolio,
};

export const DEFAULT_PORTFOLIO_TEMPLATE_ID = minimalPortfolio.id;

/** Looks up a template, falling back to the default portfolio template for unknown ids. */
export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES[id] ?? minimalPortfolio;
}
