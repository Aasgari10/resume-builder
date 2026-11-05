import type { ResumeData } from "@rb/schema";
import { sampleResume } from "./sample";

/**
 * Editor-preview only: fills what the user has not written yet with sample text, so a fresh
 * resume already looks like a finished one. Empty basics fields are filled one by one; a section
 * with no items gets the sample items. Never used for the downloaded PDF or a published site.
 */
export function withPlaceholders(data: ResumeData): ResumeData {
  const sample = sampleResume(data.locale);
  const b = data.basics;
  const s = sample.basics;
  const pick = <T,>(value: T | undefined, fallback: T | undefined) =>
    typeof value === "string" ? (value.trim() ? value : fallback) : (value ?? fallback);
  const keep = <T,>(list: T[], filled: (x: T) => boolean, fallback: T[]) => (list.some(filled) ? list : fallback);

  return {
    ...data,
    basics: {
      ...b,
      fullName: pick(b.fullName, s.fullName) ?? "",
      jobTitle: pick(b.jobTitle, s.jobTitle),
      email: pick(b.email, s.email),
      phone: pick(b.phone, s.phone),
      location: pick(b.location, s.location),
      summary: pick(b.summary, s.summary),
      links: b.links.some((l) => l.url.trim()) ? b.links : s.links,
      personal: {
        ...b.personal,
        birthDate: pick(b.personal?.birthDate, s.personal?.birthDate),
        marital: b.personal?.marital ?? s.personal?.marital,
      },
    },
    experience: keep(data.experience, (x) => Boolean(x.position || x.company), sample.experience),
    education: keep(data.education, (x) => Boolean(x.institution), sample.education),
    skills: keep(data.skills, (x) => Boolean(x.name.trim()), sample.skills),
    projects: keep(data.projects, (x) => Boolean(x.title), sample.projects),
    languages: keep(data.languages, (x) => Boolean(x.name), sample.languages),
    certificates: keep(data.certificates, (x) => Boolean(x.title), sample.certificates),
    site: {
      ...sample.site,
      ...Object.fromEntries(Object.entries(data.site ?? {}).filter(([, v]) => (typeof v === "string" ? v.trim() : v))),
      gallery: keep(data.site?.gallery ?? [], (x) => Boolean(x.image.trim()), sample.site?.gallery ?? []),
    },
    customSections: keep(data.customSections, (x) => Boolean(x.title && x.items.some((i) => i.title)), sample.customSections),
  };
}
