import type { ResumeData } from "@rb/schema";
import { sampleResume } from "./sample";

/**
 * Editor-preview only: fills what the user has not written yet with sample text, so a fresh
 * resume already looks like a finished one. Empty basics fields are filled one by one; a section
 * with no items gets the sample items. Never used for the downloaded PDF or a published site.
 */
export function withPlaceholders(data: ResumeData, sample: ResumeData = sampleResume(data.locale)): ResumeData {
  const b = data.basics;
  const s = sample.basics;
  // Fields the user emptied on purpose stay empty instead of showing sample content.
  const cleared = new Set(data.site?.clearedFields ?? []);
  const fill = <T,>(value: T | undefined, fallback: T | undefined) =>
    typeof value === "string" ? (value.trim() ? value : fallback) : (value ?? fallback);
  const pick = <T,>(value: T | undefined, fallback: T | undefined, path?: string) => (path && cleared.has(path) ? value : fill(value, fallback));
  const keep = <T,>(list: T[], filled: (x: T) => boolean, fallback: T[]) => (list.some(filled) ? list : fallback);

  return {
    ...data,
    basics: {
      ...b,
      fullName: pick(b.fullName, s.fullName) ?? "",
      jobTitle: pick(b.jobTitle, s.jobTitle, "basics.jobTitle"),
      email: pick(b.email, s.email, "basics.email"),
      phone: pick(b.phone, s.phone, "basics.phone"),
      location: pick(b.location, s.location, "basics.location"),
      summary: pick(b.summary, s.summary, "basics.summary"),
      avatarUrl: pick(b.avatarUrl, s.avatarUrl, "basics.avatarUrl"),
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
      ...Object.fromEntries(Object.entries(sample.site ?? {}).filter(([k]) => !cleared.has(`site.${k}`))),
      ...Object.fromEntries(Object.entries(data.site ?? {}).filter(([, v]) => (typeof v === "string" ? v.trim() : v))),
      gallery: keep(data.site?.gallery ?? [], (x) => Boolean(x.image.trim()), sample.site?.gallery ?? []),
      testimonials: keep(data.site?.testimonials ?? [], (x) => Boolean(x.text.trim()), sample.site?.testimonials ?? []),
      clients: keep(data.site?.clients ?? [], (x) => Boolean(x.image.trim()), sample.site?.clients ?? []),
      // A shop without products yet shows the sample shop (its own texts stay where filled in).
      ...(data.site?.shop || sample.site?.shop
        ? { shop: data.site?.shop?.products?.length ? data.site.shop : sample.site?.shop && { ...sample.site.shop, ...Object.fromEntries(Object.entries(data.site?.shop ?? {}).filter(([k, v]) => k !== "products" && k !== "categories" && (typeof v === "string" ? v.trim() : Array.isArray(v) ? v.length : v !== undefined))) } }
        : {}),
    },
    customSections: keep(data.customSections, (x) => Boolean(x.title && x.items.some((i) => i.title)), sample.customSections),
  };
}
