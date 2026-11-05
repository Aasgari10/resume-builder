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
  /** Multi-page website templates: the path being shown ("/", "/about", "/projects/<id>"). */
  page?: string;
  /** Turns a page path into the href for this site (published sites live under a base path in development). */
  link?: (path: string) => string;
  /** Editor preview with click-to-edit on: empty optional fields show a small "+ add" button. */
  editing?: boolean;
};

/** Style tags used to filter the template gallery. */
export type TemplateTag = "formal" | "creative" | "sidebar" | "dark" | "photo";

export type TemplateDefinition = {
  id: string;
  name: string;
  kind: "PDF" | "PORTFOLIO";
  component: ComponentType<TemplateProps>;
  tags?: readonly TemplateTag[];
  /** Multi-page website templates: every page path this content has. Single-page templates leave it out. */
  pages?: (data: ResumeData) => string[];
  /** Own example content (persona, pictures) for previews; the shared sample resume otherwise. */
  sample?: (locale: ResumeData["locale"]) => ResumeData;
};
