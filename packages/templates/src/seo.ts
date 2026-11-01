import type { ResumeData } from "@rb/schema";
import { safeUrl } from "./format";

export type SeoOverrides = {
  title?: string | null;
  description?: string | null;
  noindex?: boolean;
};

export type SeoMeta = {
  title: string;
  description: string;
  image?: string;
  url?: string;
  lang: ResumeData["locale"];
  dir: "rtl" | "ltr";
  noindex: boolean;
  /** schema.org Person, serialized by the caller into application/ld+json. */
  jsonLd: Record<string, unknown>;
};

const DESCRIPTION_LIMIT = 160;

/** Shortens text at a word boundary, collapsing whitespace. */
export function truncate(text: string, limit: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Builds page metadata from resume content. User overrides win when non-empty;
 * otherwise title is "Name – Job title" and description comes from the summary.
 */
export function buildSeo(data: ResumeData, overrides: SeoOverrides = {}, url?: string): SeoMeta {
  const { basics } = data;
  const name = basics.fullName.trim();
  const separator = data.locale === "fa" ? "، " : " – ";

  const generatedTitle = [name, basics.jobTitle?.trim()].filter(Boolean).join(separator);
  const generatedDescription = basics.summary?.trim()
    ? truncate(basics.summary, DESCRIPTION_LIMIT)
    : [basics.jobTitle, basics.location].filter(Boolean).join(separator);

  const image = safeUrl(basics.avatarUrl);
  const sameAs = basics.links.map((l) => safeUrl(l.url)).filter((u): u is string => Boolean(u));

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    ...(basics.jobTitle ? { jobTitle: basics.jobTitle } : {}),
    ...(basics.summary ? { description: truncate(basics.summary, 300) } : {}),
    ...(image ? { image } : {}),
    ...(url ? { url } : {}),
    ...(basics.location ? { address: { "@type": "PostalAddress", addressLocality: basics.location } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(data.skills.length ? { knowsAbout: data.skills.map((s) => s.name).filter(Boolean) } : {}),
  };

  return {
    title: overrides.title?.trim() || generatedTitle || name,
    description: overrides.description?.trim() || generatedDescription,
    image,
    url,
    lang: data.locale,
    dir: data.locale === "fa" ? "rtl" : "ltr",
    noindex: overrides.noindex ?? false,
    jsonLd,
  };
}
