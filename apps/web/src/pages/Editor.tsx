// Resume editor: section forms on one side, live template preview on the other, with debounced autosave.

import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { defaultTheme, themeSchema, type ResumeData, type Theme } from "@rb/schema";
import { DEFAULT_PORTFOLIO_TEMPLATE_ID, sampleResume } from "@rb/templates";
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
import { SkillsForm } from "../components/editor/SkillsForm";

type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

export function Editor() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [data, setData] = useState<ResumeData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [issues, setIssues] = useState<FieldIssue[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [savedVersion, setSavedVersion] = useState(0); // bumps after each successful save
  const [mobilePane, setMobilePane] = useState<"form" | "preview">("form");

  const skipNextSave = useRef(false); // the state update from the initial load is not a user edit
  const saveSeq = useRef(0); // only the latest save may update save status

  /* ───────────── Load ───────────── */
  useEffect(() => {
    if (!id) return;
    api
      .getResume(id)
      .then(({ resume }) => {
        skipNextSave.current = true;
        setTitle(resume.title);
        setData(resume.data);
        const saved = themeSchema.safeParse(resume.portfolioTheme);
        setTheme(saved.success ? saved.data : defaultTheme(DEFAULT_PORTFOLIO_TEMPLATE_ID, resume.data.locale));
      })
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : "خطا در بارگذاری"));
  }, [id]);

  /* ───────────── Autosave (800 ms after the last change) ───────────── */
  useEffect(() => {
    if (!id || !data) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setSaveState("pending");
    setIssues(null); // previous check result is stale after an edit
    const timer = setTimeout(() => void save(), 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, title, theme]);

  async function save(): Promise<boolean> {
    if (!id || !data || !theme) return false;
    const seq = ++saveSeq.current;
    setSaveState("saving");
    try {
      await api.updateResume(id, { title: title.trim() || "بدون عنوان", data, portfolioTheme: theme });
      if (seq === saveSeq.current) {
        setSaveState("saved");
        setSaveError(null);
        setSavedVersion((v) => v + 1);
      }
      return true;
    } catch (e) {
      if (seq === saveSeq.current) {
        setSaveState("error");
        setSaveError(describeError(e));
      }
      return false;
    }
  }

  async function checkPublish() {
    if (!id) return;
    setChecking(true);
    if (await save()) {
      try {
        const r = await api.checkResume(id);
        setIssues(r.ok ? [] : r.issues);
      } catch (e) {
        setSaveError(describeError(e));
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
    await save();
    const url = `/resumes/${id}/print`;
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
        <Link to="/dashboard" className="btn ghost">
          → بازگشت
        </Link>
        <input className="grow title-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
        <SaveBadge state={saveState} />
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

      {saveError && <p className="error">ذخیره نشد: {saveError}</p>}

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
          <AssistantChat theme={theme} locale={data.locale} onChange={setTheme} />
          <ThemePanel theme={theme} onChange={setTheme} />
          <PublishPanel resumeId={id!} templateId={theme.templateId} data={data} version={savedVersion} saveNow={save} onIssues={setIssues} />
        </div>

        <aside className="editor-preview">
          <Preview data={data} theme={theme} />
        </aside>
      </div>
    </div>
  );
}

/* ───────────── Components ───────────── */

function SaveBadge({ state }: { state: SaveState }) {
  const text: Record<SaveState, string> = {
    idle: "",
    pending: "تغییرات ذخیره نشده",
    saving: "در حال ذخیره…",
    saved: "✓ ذخیره شد",
    error: "⚠ خطا در ذخیره",
  };
  return <span className={`save-badge ${state}`}>{text[state]}</span>;
}

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
