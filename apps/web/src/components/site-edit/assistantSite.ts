// What the AI assistant may change on a site besides its look: optional pages, template blocks and
// new items. The editor tells the assistant what the current template allows, and applies the
// assistant's answer here (the server has already dropped anything the template does not allow).

import type { ResumeData } from "@rb/schema";
import type { TemplateDefinition } from "@rb/templates";
import { newId } from "../editor/list";

export type AddKind = "project" | "experience" | "education" | "certificate" | "skill" | "testimonial";

export type Capabilities = {
  templateName: string;
  shop: boolean;
  sections: boolean;
  pages: { path: string; label: string; visible: boolean }[];
  blocks: { key: string; label: string; visible: boolean }[];
  add: { kind: AddKind; label: string }[];
  contactVia: boolean;
};

export type SiteChanges = {
  pages?: Record<string, boolean>;
  blocks?: Record<string, boolean>;
  add?: { kind: AddKind; count: number }[];
  contactVia?: "email" | "whatsapp" | "telegram" | "phone" | "about";
};

const ADD_LABELS: Record<AddKind, string> = {
  project: "پروژه",
  experience: "سابقه‌ی کاری",
  education: "تحصیلات",
  certificate: "دوره",
  skill: "مهارت",
  testimonial: "نظر مشتری",
};

/** Short template name, without the description in parentheses. */
export const shortName = (name: string) => name.replace(/\s*\(.*\)\s*$/, "");

export function capabilitiesFor(template: TemplateDefinition, data: ResumeData): Capabilities {
  const hiddenPages = data.site?.hiddenPages ?? [];
  const hiddenBlocks = data.site?.hiddenBlocks ?? [];
  const blocks = template.blocks ?? [];
  // A shop's goods, quotes and banners live in the shop manager; resume items do not belong there.
  const kinds: AddKind[] = template.shop
    ? []
    : ["project", "experience", "education", "certificate", "skill", ...(blocks.some((b) => b.key === "testimonials") ? (["testimonial"] as const) : [])];
  return {
    templateName: shortName(template.name),
    shop: Boolean(template.shop),
    sections: !template.shop,
    pages: (template.optionalPages ?? []).map((p) => ({ path: p.path, label: p.label, visible: !hiddenPages.includes(p.path) })),
    blocks: blocks.map((b) => ({ key: b.key, label: b.label, visible: !hiddenBlocks.includes(b.key) })),
    add: kinds.map((kind) => ({ kind, label: ADD_LABELS[kind] })),
    contactVia: template.id === "vitrine-portfolio",
  };
}

/** Current month as YYYY-MM, the start date of newly added items. */
const thisMonth = () => new Date().toISOString().slice(0, 7);

function addItem(data: ResumeData, kind: AddKind): ResumeData {
  const site = data.site ?? { gallery: [] };
  switch (kind) {
    case "project":
      return { ...data, projects: [...data.projects, { id: newId(), title: "پروژه‌ی جدید", technologies: [], images: [] }] };
    case "experience":
      return { ...data, experience: [...data.experience, { id: newId(), position: "سمت جدید", company: "نام شرکت", period: { start: thisMonth(), current: true }, highlights: [] }] };
    case "education":
      return { ...data, education: [...data.education, { id: newId(), institution: "نام دانشگاه", degree: "کارشناسی", period: { start: thisMonth(), current: false } }] };
    case "certificate":
      return { ...data, certificates: [...data.certificates, { id: newId(), title: "دوره‌ی جدید" }] };
    case "skill":
      return { ...data, skills: [...data.skills, { id: newId(), name: "مهارت جدید" }] };
    case "testimonial":
      return { ...data, site: { ...site, testimonials: [...(site.testimonials ?? []), { id: newId(), name: "نام مشتری", text: "نظر مشتری درباره‌ی کار شما" }] } };
  }
}

export function applySiteChanges(data: ResumeData, changes: SiteChanges): ResumeData {
  let next = data;
  const site = () => next.site ?? { gallery: [] };
  const toggle = (list: string[], key: string, visible: boolean) => (visible ? list.filter((k) => k !== key) : list.includes(key) ? list : [...list, key]);
  for (const [path, visible] of Object.entries(changes.pages ?? {})) {
    next = { ...next, site: { ...site(), hiddenPages: toggle(site().hiddenPages ?? [], path, visible) } };
  }
  for (const [key, visible] of Object.entries(changes.blocks ?? {})) {
    next = { ...next, site: { ...site(), hiddenBlocks: toggle(site().hiddenBlocks ?? [], key, visible) } };
  }
  for (const { kind, count } of changes.add ?? []) {
    for (let k = 0; k < Math.min(count, 5); k++) next = addItem(next, kind);
  }
  if (changes.contactVia) next = { ...next, site: { ...site(), contactVia: changes.contactVia } };
  return next;
}

/** Opening message: what the assistant can do in this template. */
export function welcomeFor(caps: Capabilities): string {
  const can = ["رنگ‌ها و فونت", "اندازه‌ی نوشته‌ها، فاصله‌ها و گردی گوشه‌ها"];
  if (caps.blocks.length || caps.pages.length || caps.sections) can.push(caps.shop ? "نمایش یا حذف بخش‌های صفحه" : "نمایش، حذف یا جابه‌جایی بخش‌ها و صفحه‌ها");
  if (caps.add.length) can.push(`افزودن ${caps.add.map((a) => a.label).join("، ")}`);
  const tail = caps.shop ? " محصولات، سفارش‌ها و تخفیف‌ها از «مدیریت فروشگاه» تغییر می‌کنند." : "";
  return `سلام! هر تغییری در سایتت بخواهی کافی است بنویسی. در قالب ${caps.templateName} این کارها را برایت انجام می‌دهم: ${can.join("؛ ")}. متن و عکس‌ها را هم با کلیک روی خودشان در صفحه عوض کن.${tail}`;
}

/** Ready-made requests that fit this template. */
export function suggestionsFor(caps: Capabilities): string[] {
  const out = ["حالت تیره", "رنگ‌ها گرم‌تر"];
  const shown = caps.blocks.find((b) => b.visible);
  if (shown) out.push(`${shown.label.replace(/^بخش\s+/, "")} را حذف کن`);
  const page = caps.pages.find((p) => p.visible);
  if (page) out.push(`${page.label} را حذف کن`);
  if (caps.add.some((a) => a.kind === "project")) out.push("یک پروژه اضافه کن");
  out.push("چه کارهایی می‌توانی بکنی؟");
  return out.slice(0, 5);
}
