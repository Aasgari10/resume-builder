// Website editor: the live site fills the screen and is edited by clicking its texts and pictures;
// the side panel holds settings, the AI assistant and publishing. Changes are saved automatically.

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DEFAULT_PORTFOLIO_TEMPLATE_ID, getTemplate } from "@rb/templates";
import type { FieldIssue } from "../api";
import { Preview } from "../components/Preview";
import { PublishPanel } from "../components/PublishPanel";
import { SAVE_LABELS, useResumeDoc } from "../components/editor/useResumeDoc";

export function Editor() {
  const { id } = useParams<{ id: string }>();
  const doc = useResumeDoc(id, (savedId) => `/resumes/${savedId}`);
  const { isDraft, title, setTitle, data, setData, theme, setTheme, loadError, saveState, saveError, savedVersion, save } = doc;
  const [issues, setIssues] = useState<FieldIssue[] | null>(null);

  // A previous check result is stale after an edit.
  useEffect(() => setIssues(null), [data]);

  // Older single-page templates have no click-to-edit; such sites move to the default editable template.
  useEffect(() => {
    if (theme && !getTemplate(theme.templateId).pages) setTheme({ ...theme, templateId: DEFAULT_PORTFOLIO_TEMPLATE_ID });
  }, [theme, setTheme]);

  if (loadError) return <p className="error">{loadError}</p>;
  if (!data || !theme) return <p className="muted">در حال بارگذاری…</p>;

  const bar = (
    <>
      <Link to="/resume/mine" className="btn small ghost">
        → رزومه‌های من
      </Link>
      <input className="ws-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} aria-label="عنوان" />
      <span className={`save-badge ${saveState}`}>{SAVE_LABELS[saveState]}</span>
      {isDraft ? (
        <button className="btn small" onClick={() => void save()} disabled={saveState === "saving"}>
          ذخیره در رزومه‌های من
        </button>
      ) : (
        <Link to={`/resumes/${id}/pdf`} className="btn small ghost">
          نسخه‌ی پی‌دی‌اف
        </Link>
      )}
    </>
  );

  const publish = isDraft ? (
    <p className="muted">برای انتشار، اول سایت را با دکمه‌ی «ذخیره در رزومه‌های من» ذخیره کنید.</p>
  ) : (
    <div className="stack">
      {issues !== null &&
        (issues.length === 0 ? (
          <div className="notice success">✅ سایت آماده‌ی انتشار است.</div>
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
      <PublishPanel resumeId={id!} templateId={theme.templateId} data={data} version={savedVersion} saveNow={async () => Boolean(await save())} onIssues={setIssues} />
    </div>
  );

  return (
    <div className="site-editor" dir={data.locale === "fa" ? "rtl" : "ltr"}>
      {saveError && <p className="error">ذخیره نشد: {saveError}</p>}
      <Preview data={data} theme={theme} onThemeChange={setTheme} onDataChange={setData} publish={publish} bar={bar} resumeId={isDraft ? undefined : id} />
    </div>
  );
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
