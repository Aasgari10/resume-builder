// Resume editor: section forms on one side, live template preview on the other, with debounced autosave.

import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { ResumeData } from "@rb/schema";
import { getTemplate, sampleResume } from "@rb/templates";
import { ApiError, api, type FieldIssue } from "../api";
import { Preview } from "../components/Preview";
import { PublishPanel } from "../components/PublishPanel";
import { AssistantChat } from "../components/AssistantChat";
import { ThemePanel } from "../components/ThemePanel";
import { BasicsForm } from "../components/editor/BasicsForm";
import { CertificatesForm } from "../components/editor/CertificatesForm";
import { CustomSectionsForm } from "../components/editor/CustomSectionsForm";
import { EducationForm } from "../components/editor/EducationForm";
import { ExperienceForm } from "../components/editor/ExperienceForm";
import { LanguagesForm } from "../components/editor/LanguagesForm";
import { ProjectsForm } from "../components/editor/ProjectsForm";
import { SiteContentForm } from "../components/editor/SiteContentForm";
import { SkillsForm } from "../components/editor/SkillsForm";
import { SAVE_LABELS, useResumeDoc } from "../components/editor/useResumeDoc";

export function Editor() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get("view") === "resume" ? "resume" : "site";
  const doc = useResumeDoc(id, (savedId) => `/resumes/${savedId}${initialView === "site" ? "?view=site" : ""}`);
  const { isDraft, title, setTitle, data, setData, theme, setTheme, loadError, saveState, saveError, savedVersion, save } = doc;
  const [issues, setIssues] = useState<FieldIssue[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<"form" | "preview">("form");

  // A previous check result is stale after an edit.
  useEffect(() => setIssues(null), [data]);

  async function checkPublish() {
    setChecking(true);
    const savedId = await save();
    if (savedId) {
      try {
        const r = await api.checkResume(savedId);
        setIssues(r.ok ? [] : r.issues);
      } catch (e) {
        setCheckError(describeError(e));
      }
    }
    setChecking(false);
  }

  if (loadError) return <p className="error">{loadError}</p>;
  if (!data || !theme) return <p className="muted">در حال بارگذاری…</p>;

  const set = <K extends keyof ResumeData>(key: K) => (value: ResumeData[K]) => setData({ ...data, [key]: value });

  // Opens the window before awaiting the save, so popup blockers treat it as a direct user action.
  const openPdf = async () => {
    const win = window.open("", "_blank");
    const savedId = await save();
    if (!savedId) return win?.close();
    const url = `/resumes/${savedId}/print`;
    if (win) win.location.href = url;
    else window.location.href = url;
  };

  const fillSample = () => {
    if (!confirm("همه‌ی اطلاعات این رزومه با یک نمونه‌ی کامل جایگزین شود؟")) return;
    setData(sampleResume(data.locale));
  };

  /* ───────────── Render ───────────── */
  return (
    <div className="stack" dir={data.locale === "fa" ? "rtl" : "ltr"}>
      <div className="row gap wrap sticky-bar">
        <Link to="/resume/mine" className="btn ghost">
          → بازگشت
        </Link>
        <input className="grow title-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
        <span className={`save-badge ${saveState}`}>{SAVE_LABELS[saveState]}</span>
        {isDraft && (
          <button className="btn" onClick={() => void save()} disabled={saveState === "saving"}>
            ذخیره در رزومه‌های من
          </button>
        )}
        <button className="btn ghost" onClick={openPdf}>
          دانلود پی‌دی‌اف
        </button>
        <button className="btn ghost" onClick={fillSample}>
          پر کردن با نمونه
        </button>
        <button className="btn" onClick={checkPublish} disabled={checking}>
          {checking ? "در حال بررسی…" : "بررسی آمادگی انتشار"}
        </button>
      </div>

      {(saveError ?? checkError) && <p className="error">ذخیره نشد: {saveError ?? checkError}</p>}

      {issues !== null &&
        (issues.length === 0 ? (
          <div className="notice success">✅ رزومه کامل است و آماده‌ی انتشار یا خروجی است.</div>
        ) : (
          <div className="notice warn">
            <strong>برای انتشار، این موارد را کامل کنید:</strong>
            <ul>
              {issues.map((i) => (
                <li key={i.path + i.message}>
                  {pathLabel(i.path)}: {i.message}
                </li>
              ))}
            </ul>
          </div>
        ))}

      <div className="pane-switch" role="tablist">
        <button role="tab" aria-selected={mobilePane === "form"} onClick={() => setMobilePane("form")}>
          ویرایش
        </button>
        <button role="tab" aria-selected={mobilePane === "preview"} onClick={() => setMobilePane("preview")}>
          پیش‌نمایش
        </button>
      </div>

      <div className="editor-layout" data-pane={mobilePane}>
        <div className="editor-form stack">
          <BasicsForm value={data.basics} onChange={set("basics")} />
          <ExperienceForm value={data.experience} onChange={set("experience")} />
          <EducationForm value={data.education} onChange={set("education")} />
          <SkillsForm value={data.skills} onChange={set("skills")} />
          <ProjectsForm value={data.projects} onChange={set("projects")} />
          <LanguagesForm value={data.languages} onChange={set("languages")} />
          <CertificatesForm value={data.certificates} onChange={set("certificates")} />
          <CustomSectionsForm value={data.customSections} onChange={set("customSections")} />
          {getTemplate(theme.templateId).pages && <SiteContentForm value={data.site} onChange={(site) => setData({ ...data, site })} />}
          <AssistantChat theme={theme} locale={data.locale} onChange={setTheme} />
          <ThemePanel theme={theme} onChange={setTheme} />
          {!isDraft && <PublishPanel resumeId={id!} templateId={theme.templateId} data={data} version={savedVersion} saveNow={async () => Boolean(await save())} onIssues={setIssues} />}
        </div>

        <aside className="editor-preview">
          <Preview data={data} theme={theme} onThemeChange={setTheme} initialMode={initialView} />
        </aside>
      </div>
    </div>
  );
}

/* ───────────── Components ───────────── */

/* ───────────── Field path labels ───────────── */

const SECTION_LABELS: Record<string, string> = {
  basics: "اطلاعات پایه",
  experience: "سابقه‌ی کاری",
  education: "تحصیلات",
  skills: "مهارت",
  projects: "پروژه",
  languages: "زبان",
  certificates: "گواهینامه",
  customSections: "بخش آزاد",
  site: "محتوای سایت",
};

const FIELD_LABELS: Record<string, string> = {
  fullName: "نام و نام خانوادگی",
  jobTitle: "عنوان شغلی",
  email: "ایمیل",
  phone: "تلفن",
  location: "محل",
  avatarUrl: "لینک عکس",
  summary: "درباره‌ی من",
  links: "لینک",
  label: "عنوان لینک",
  company: "شرکت",
  position: "سمت",
  start: "تاریخ شروع",
  end: "تاریخ پایان",
  description: "توضیحات",
  highlights: "دستاورد",
  institution: "مؤسسه",
  degree: "مقطع",
  field: "رشته",
  grade: "معدل",
  name: "نام",
  category: "دسته",
  level: "سطح",
  title: "عنوان",
  role: "نقش",
  technologies: "تکنولوژی",
  images: "تصویر",
  repoUrl: "لینک سورس کد",
  issuer: "صادرکننده",
  date: "تاریخ",
  subtitle: "زیرعنوان",
  items: "آیتم",
  url: "لینک",
  gallery: "گالری",
  image: "تصویر",
  aboutImage: "عکس درباره‌ی من",
};

function pathLabel(path: string): string {
  return path
    .split(".")
    .map((part, i) => {
      if (i === 0) return SECTION_LABELS[part] ?? part;
      if (/^\d+$/.test(part)) return String(Number(part) + 1);
      if (part === "period") return null;
      return FIELD_LABELS[part] ?? part;
    })
    .filter(Boolean)
    .join(" › ");
}

function describeError(e: unknown): string {
  if (e instanceof ApiError) {
    if (Array.isArray(e.details) && e.details.length > 0) {
      const first = e.details[0] as FieldIssue;
      return `${e.message} (${pathLabel(first.path.replace(/^data\./, ""))}: ${first.message})`;
    }
    return e.message;
  }
  return "خطای ناشناخته";
}
