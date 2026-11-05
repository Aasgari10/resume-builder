// Fields the user can switch off in the editor. Hidden fields are removed from the data
// right before rendering, so every template respects them without knowing about the setting.

import type { ResumeData } from "./resume.schema";

export const HIDEABLE_FIELDS = [
  "basics.jobTitle",
  "basics.email",
  "basics.phone",
  "basics.location",
  "basics.avatar",
  "basics.summary",
  "basics.birthDate",
  "basics.marital",
  "basics.military",
  "experience.location",
  "experience.description",
  "experience.highlights",
  "education.degree",
  "education.field",
  "education.grade",
  "education.description",
  "skills.level",
  "projects.role",
  "projects.url",
  "projects.repoUrl",
  "projects.images",
  "projects.description",
  "projects.technologies",
  "languages.level",
  "certificates.issuer",
  "certificates.date",
  "certificates.url",
  "customSections.subtitle",
  "customSections.date",
  "customSections.url",
  "customSections.description",
] as const;

export type HideableField = (typeof HIDEABLE_FIELDS)[number];

/** Returns a copy of the resume without the hidden fields. */
export function applyHiddenFields(data: ResumeData, hidden: readonly string[] | undefined): ResumeData {
  if (!hidden?.length) return data;
  const off = (key: HideableField) => hidden.includes(key);
  const b = data.basics;
  const personal = b.personal && {
    ...b.personal,
    birthDate: off("basics.birthDate") ? undefined : b.personal.birthDate,
    marital: off("basics.marital") ? undefined : b.personal.marital,
    military: off("basics.military") ? undefined : b.personal.military,
  };
  return {
    ...data,
    basics: {
      ...b,
      jobTitle: off("basics.jobTitle") ? undefined : b.jobTitle,
      email: off("basics.email") ? undefined : b.email,
      phone: off("basics.phone") ? undefined : b.phone,
      location: off("basics.location") ? undefined : b.location,
      avatarUrl: off("basics.avatar") ? undefined : b.avatarUrl,
      summary: off("basics.summary") ? undefined : b.summary,
      personal,
    },
    experience: data.experience.map((x) => ({
      ...x,
      location: off("experience.location") ? undefined : x.location,
      description: off("experience.description") ? undefined : x.description,
      highlights: off("experience.highlights") ? [] : x.highlights,
    })),
    education: data.education.map((x) => ({
      ...x,
      degree: off("education.degree") ? undefined : x.degree,
      field: off("education.field") ? undefined : x.field,
      grade: off("education.grade") ? undefined : x.grade,
      description: off("education.description") ? undefined : x.description,
    })),
    skills: data.skills.map((x) => ({ ...x, level: off("skills.level") ? undefined : x.level })),
    projects: data.projects.map((x) => ({
      ...x,
      role: off("projects.role") ? undefined : x.role,
      url: off("projects.url") ? undefined : x.url,
      repoUrl: off("projects.repoUrl") ? undefined : x.repoUrl,
      images: off("projects.images") ? [] : x.images,
      description: off("projects.description") ? undefined : x.description,
      technologies: off("projects.technologies") ? [] : x.technologies,
    })),
    certificates: data.certificates.map((x) => ({
      ...x,
      issuer: off("certificates.issuer") ? undefined : x.issuer,
      date: off("certificates.date") ? undefined : x.date,
      url: off("certificates.url") ? undefined : x.url,
    })),
    customSections: data.customSections.map((s) => ({
      ...s,
      items: s.items.map((i) => ({
        ...i,
        subtitle: off("customSections.subtitle") ? undefined : i.subtitle,
        date: off("customSections.date") ? undefined : i.date,
        url: off("customSections.url") ? undefined : i.url,
        description: off("customSections.description") ? undefined : i.description,
      })),
    })),
  };
}

/** Whether language levels should be printed (the level itself is required data). */
export const showLanguageLevel = (hidden: readonly string[] | undefined) => !hidden?.includes("languages.level");
