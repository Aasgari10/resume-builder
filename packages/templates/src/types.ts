import type { ComponentType } from "react";
import type { ResumeData, Theme } from "@rb/schema";

/**
 * Templates render resume data with a theme. They must be pure (no data fetching,
 * no browser-only APIs) so the same component can render in the editor preview
 * and on the server for published sites and HTML export.
 */
export type TemplateProps = {
  data: ResumeData;
  theme: Theme;
};

/** Style tags used to filter the template gallery. */
export type TemplateTag = "formal" | "creative" | "sidebar" | "dark" | "photo";

export type TemplateDefinition = {
  id: string;
  name: string;
  kind: "PDF" | "PORTFOLIO";
  component: ComponentType<TemplateProps>;
  tags?: readonly TemplateTag[];
};
