// Placeholder text for the form inputs, taken from the same sample resume the preview uses,
// so an empty input hints exactly what will appear in its place on the resume.

import { sampleResume } from "@rb/templates";

const S = sampleResume("fa");

/** First non-empty value of a field across the sample items. */
const first = <T,>(list: readonly T[], get: (x: T) => string | undefined) => list.map(get).find((v) => v?.trim()) ?? "";

export const PH = {
  basics: {
    fullName: S.basics.fullName,
    jobTitle: S.basics.jobTitle ?? "",
    email: S.basics.email ?? "",
    phone: S.basics.phone ?? "",
    location: S.basics.location ?? "",
    summary: S.basics.summary ?? "",
    link: first(S.basics.links, (l) => l.url),
  },
  experience: {
    position: first(S.experience, (x) => x.position),
    company: first(S.experience, (x) => x.company),
    location: first(S.experience, (x) => x.location),
    description: first(S.experience, (x) => x.description),
    highlights: S.experience.find((x) => x.highlights.length)?.highlights.join("\n") ?? "",
  },
  education: {
    institution: first(S.education, (x) => x.institution),
    degree: first(S.education, (x) => x.degree),
    field: first(S.education, (x) => x.field),
    grade: first(S.education, (x) => x.grade),
    description: first(S.education, (x) => x.description),
  },
  skills: {
    name: first(S.skills, (x) => x.name),
    category: first(S.skills, (x) => x.category),
  },
  projects: {
    title: first(S.projects, (x) => x.title),
    role: first(S.projects, (x) => x.role),
    url: first(S.projects, (x) => x.url),
    repoUrl: first(S.projects, (x) => x.repoUrl),
    description: first(S.projects, (x) => x.description),
    technologies: S.projects[0]?.technologies.join("، ") ?? "",
  },
  languages: { name: first(S.languages, (x) => x.name) },
  certificates: {
    title: first(S.certificates, (x) => x.title),
    issuer: first(S.certificates, (x) => x.issuer),
    url: first(S.certificates, (x) => x.url),
  },
  custom: {
    section: first(S.customSections, (x) => x.title),
    title: first(S.customSections.flatMap((x) => x.items), (x) => x.title),
    subtitle: first(S.customSections.flatMap((x) => x.items), (x) => x.subtitle),
    description: first(S.customSections.flatMap((x) => x.items), (x) => x.description),
    url: first(S.customSections.flatMap((x) => x.items), (x) => x.url),
  },
};
