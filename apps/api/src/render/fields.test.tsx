/** @jsxRuntime automatic @jsxImportSource react */
// Every field the editor offers must have a place in every printable template, and a field
// the user switched off must disappear. Each field gets a unique marker that is searched for.
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { HIDEABLE_FIELDS, applyHiddenFields, defaultTheme, emptyResume, type ResumeData } from "@rb/schema";
import { PDF_TEMPLATES, sampleResume, withPlaceholders } from "@rb/templates";

const marked: ResumeData = {
  ...emptyResume("en"),
  basics: {
    fullName: "MkName",
    jobTitle: "MkJobTitle",
    email: "mkemail@example.com",
    phone: "0900111",
    location: "MkLocation",
    summary: "MkSummary",
    avatarUrl: "https://mk-avatar.example/a.jpg",
    links: [{ id: "l", type: "github", url: "https://mk-link.example" }],
    personal: { birthDate: "1370/01/02", marital: "married", military: "done" },
  },
  experience: [
    {
      id: "e",
      company: "MkCompany",
      position: "MkPosition",
      location: "MkExpLocation",
      period: { start: "2020-01", current: true },
      description: "MkExpDescription",
      highlights: ["MkHighlight"],
    },
  ],
  education: [
    {
      id: "d",
      institution: "MkInstitution",
      degree: "MkDegree",
      field: "MkField",
      grade: "MkGrade",
      period: { start: "2015-01", end: "2019-01", current: false },
      description: "MkEduDescription",
    },
  ],
  skills: [{ id: "s", name: "MkSkill", level: 4, category: "MkCategory" }],
  projects: [
    {
      id: "p",
      title: "MkProject",
      role: "MkRole",
      description: "MkProjDescription",
      technologies: ["MkTech"],
      url: "https://mk-projurl.example",
      repoUrl: "https://mk-repourl.example",
      images: ["https://mk-image.example/i.jpg"],
    },
  ],
  languages: [{ id: "g", name: "MkLanguage", level: "fluent" }],
  certificates: [{ id: "c", title: "MkCert", issuer: "MkIssuer", date: "2021-05", url: "https://mk-certurl.example" }],
  customSections: [
    {
      id: "x",
      title: "MkCustom",
      items: [{ id: "i", title: "MkItem", subtitle: "MkSubtitle", date: "2022-02", description: "MkItemDescription", url: "https://mk-itemurl.example" }],
    },
  ],
};

// Marker of each hideable field; fields without a unique text are checked separately.
const MARKERS: Partial<Record<(typeof HIDEABLE_FIELDS)[number], string>> = {
  "basics.jobTitle": "MkJobTitle",
  "basics.email": "mkemail@example.com",
  "basics.phone": "0900111",
  "basics.location": "MkLocation",
  "basics.avatar": "mk-avatar.example",
  "basics.summary": "MkSummary",
  "basics.birthDate": "1370/01/02",
  "experience.location": "MkExpLocation",
  "experience.description": "MkExpDescription",
  "experience.highlights": "MkHighlight",
  "education.degree": "MkDegree",
  "education.field": "MkField",
  "education.grade": "MkGrade",
  "education.description": "MkEduDescription",
  "projects.role": "MkRole",
  "projects.url": "mk-projurl.example",
  "projects.repoUrl": "mk-repourl.example",
  "projects.images": "mk-image.example",
  "projects.description": "MkProjDescription",
  "projects.technologies": "MkTech",
  "certificates.issuer": "MkIssuer",
  "certificates.url": "mk-certurl.example",
  "customSections.subtitle": "MkSubtitle",
  "customSections.url": "mk-itemurl.example",
  "customSections.description": "MkItemDescription",
};
const ALWAYS = ["MkName", "mk-link.example", "MkPosition", "MkCompany", "MkInstitution", "MkSkill", "MkCategory", "MkProject", "MkLanguage", "MkCert", "MkCustom", "MkItem"];

for (const { id, component: Template } of PDF_TEMPLATES) {
  test(`template ${id}: shows every field and drops switched-off ones`, () => {
    const theme = defaultTheme(id, "en");
    const html = renderToStaticMarkup(<Template data={marked} theme={theme} />);
    for (const text of [...ALWAYS, ...Object.values(MARKERS)]) assert.ok(html.includes(text), `${id} is missing ${text}`);

    const hidden = [...HIDEABLE_FIELDS];
    const off = { ...theme, hiddenFields: hidden };
    const stripped = renderToStaticMarkup(<Template data={applyHiddenFields(marked, hidden)} theme={off} />);
    for (const text of Object.values(MARKERS)) assert.ok(!stripped.includes(text), `${id} still shows ${text}`);
    for (const text of ALWAYS) assert.ok(stripped.includes(text), `${id} lost ${text}`);
  });
}

test("withPlaceholders fills only what is empty", () => {
  const sample = sampleResume("fa");
  const filled = withPlaceholders(emptyResume("fa"));
  assert.equal(filled.basics.fullName, sample.basics.fullName);
  assert.deepEqual(filled.experience, sample.experience);

  const own = withPlaceholders({ ...emptyResume("fa"), basics: { fullName: "من", links: [] }, skills: marked.skills });
  assert.equal(own.basics.fullName, "من");
  assert.deepEqual(own.skills, marked.skills);
  assert.equal(own.basics.jobTitle, sample.basics.jobTitle);
});
