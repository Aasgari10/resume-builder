// Colors used to present each template in the galleries, so the grid looks varied.
// The user changes the color later in the editor.

export const SHOWCASE_COLORS: Record<string, string> = {
  "sidebar-pdf": "#1E3A5F",
  "soft-pdf": "#0E7C86",
  "banner-pdf": "#7A2332",
  "card-pdf": "#2F6B4F",
  "column-pdf": "#5B3E96",
  "timeline-pdf": "#B7832F",
  "diagonal-pdf": "#1E5AA8",
  "night-pdf": "#0E7C86",
  "line-pdf": "#C2551F",
  "classic-pdf": "#2B2F36",
  "minimal-portfolio": "#1E5AA8",
  "studio-portfolio": "#C2551F",
  "split-portfolio": "#2F6B4F",
  "bento-portfolio": "#5B3E96",
  "vitrine-portfolio": "#2B2F36",
  "aseman-portfolio": "#A8916A",
  "grid-portfolio": "#5B6CF0",
};

export const showcaseColor = (id: string) => SHOWCASE_COLORS[id] ?? "#1E3A5F";
