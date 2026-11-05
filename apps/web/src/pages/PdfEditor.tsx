// Step-by-step editor for the printable resume: section menu, one form at a time, and a large
// live preview that stays in place while the form scrolls. Changes are saved automatically.

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { applyHiddenFields, type ResumeData, type Theme } from "@rb/schema";
import { PDF_TEMPLATES, getPdfTemplate, withPlaceholders } from "@rb/templates";
import { ColorPicker } from "../components/ColorPicker";
import { Scaled } from "../components/Scaled";
import { BasicsInfoForm, LinksForm } from "../components/editor/BasicsForm";
import { CertificatesForm } from "../components/editor/CertificatesForm";
import { CustomSectionsForm } from "../components/editor/CustomSectionsForm";
import { HiddenFieldsContext } from "../components/editor/Hideable";
import { SAVE_LABELS, useResumeDoc } from "../components/editor/useResumeDoc";
import { EducationForm } from "../components/editor/EducationForm";
import { ExperienceForm } from "../components/editor/ExperienceForm";
import { LanguagesForm } from "../components/editor/LanguagesForm";
import { ProjectsForm } from "../components/editor/ProjectsForm";
import { SkillsForm } from "../components/editor/SkillsForm";
import { Icon, type IconName } from "../hub/Icons";
import "./pdf-editor.css";

type Setter = <K extends keyof ResumeData>(key: K) => (value: ResumeData[K]) => void;

type Step = { key: string; label: string; icon: IconName; done: (d: ResumeData) => boolean; render: (d: ResumeData, set: Setter) => ReactNode };

const STEPS: Step[] = [
  { key: "basics", label: "اطلاعات پایه", icon: "user", done: (d) => Boolean(d.basics.fullName && d.basics.jobTitle), render: (d, set) => <BasicsInfoForm value={d.basics} onChange={set("basics")} /> },
  { key: "links", label: "شبکه‌های اجتماعی", icon: "at", done: (d) => d.basics.links.length > 0, render: (d, set) => <LinksForm value={d.basics} onChange={set("basics")} /> },
  { key: "education", label: "سوابق تحصیلی", icon: "cap", done: (d) => d.education.length > 0, render: (d, set) => <EducationForm value={d.education} onChange={set("education")} /> },
  { key: "experience", label: "سوابق شغلی", icon: "briefcase", done: (d) => d.experience.length > 0, render: (d, set) => <ExperienceForm value={d.experience} onChange={set("experience")} /> },
  { key: "skills", label: "مهارت‌ها", icon: "star", done: (d) => d.skills.length > 0, render: (d, set) => <SkillsForm value={d.skills} onChange={set("skills")} /> },
  { key: "languages", label: "زبان‌ها", icon: "translate", done: (d) => d.languages.length > 0, render: (d, set) => <LanguagesForm value={d.languages} onChange={set("languages")} /> },
  { key: "certificates", label: "دوره‌ها و گواهینامه‌ها", icon: "award", done: (d) => d.certificates.length > 0, render: (d, set) => <CertificatesForm value={d.certificates} onChange={set("certificates")} /> },
  { key: "projects", label: "پروژه‌ها", icon: "folder", done: (d) => d.projects.length > 0, render: (d, set) => <ProjectsForm value={d.projects} onChange={set("projects")} /> },
  { key: "custom", label: "افتخارات و بخش‌های دیگر", icon: "layers", done: (d) => d.customSections.length > 0, render: (d, set) => <CustomSectionsForm value={d.customSections} onChange={set("customSections")} /> },
];

/** Rough completeness of the resume, 0–100, for the progress ring. */
function completion(d: ResumeData): number {
  const b = d.basics;
  const parts: [boolean, number][] = [
    [Boolean(b.fullName), 10],
    [Boolean(b.jobTitle), 5],
    [Boolean(b.email), 5],
    [Boolean(b.phone), 5],
    [Boolean(b.avatarUrl), 5],
    [Boolean(b.summary && b.summary.length > 40), 10],
    [b.links.length > 0, 5],
    [d.experience.length > 0, 15],
    [d.education.length > 0, 10],
    [d.skills.length >= 3, 10],
    [d.languages.length > 0, 5],
    [d.projects.length > 0, 10],
    [d.certificates.length > 0, 5],
  ];
  return parts.reduce((sum, [ok, w]) => sum + (ok ? w : 0), 0);
}

const fa = (n: number) => n.toLocaleString("fa-IR");

export function PdfEditor() {
  const { id } = useParams<{ id: string }>();
  const doc = useResumeDoc(id, (savedId) => `/resumes/${savedId}/pdf`);
  const { isDraft, title, setTitle, data, setData, theme, setTheme, loadError, saveState, saveError, save } = doc;
  const [step, setStep] = useState(0);
  const [picker, setPicker] = useState(false);
  const formTop = useRef<HTMLDivElement>(null);

  // What the preview shows: sample text where the user has not written yet, minus switched-off fields.
  const previewData = useMemo(
    () => (data && theme ? applyHiddenFields(withPlaceholders(data), theme.hiddenFields) : null),
    [data, theme],
  );
  const hiddenFields = useMemo(
    () =>
      theme && {
        isHidden: (key: string) => Boolean(theme.hiddenFields?.includes(key)),
        toggle: (key: string) => {
          const list = theme.hiddenFields ?? [];
          setTheme({ ...theme, hiddenFields: list.includes(key) ? list.filter((k) => k !== key) : [...list, key] });
        },
      },
    [theme],
  );

  // Opens the window first so popup blockers treat it as a direct user action.
  const download = async () => {
    const win = window.open("", "_blank");
    const savedId = await save();
    if (!savedId) return win?.close();
    const url = `/resumes/${savedId}/print`;
    if (win) win.location.href = url;
    else window.location.href = url;
  };

  if (loadError) return <p className="pe-message error">{loadError}</p>;
  if (!data || !theme || !previewData || !hiddenFields) return <p className="pe-message muted">در حال بارگذاری…</p>;

  const set: Setter = (key) => (value) => setData({ ...data, [key]: value });
  const pdf = getPdfTemplate(theme.pdfTemplateId);
  const progress = completion(data);
  const current = STEPS[step]!;
  const go = (i: number) => {
    setStep(i);
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="pe" dir="rtl">
      <header className="pe-top">
        <Link to="/resume/mine" className="pe-back">
          <Icon name="arrowBack" />
          پنل کاربری
        </Link>
        <input className="pe-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} aria-label="عنوان رزومه" />
        <span className={`pe-save ${saveState}`}>
          {SAVE_LABELS[saveState]}
        </span>
        <div className="pe-actions">
          <span className="pe-ring" style={{ "--p": progress } as CSSProperties} title="میزان تکمیل رزومه">
            <b>{fa(progress)}٪</b>
          </span>
          <button type="button" className="pe-btn" onClick={() => setPicker(true)}>
            <Icon name="layout" />
            قالب
          </button>
          <button type="button" className="pe-btn primary" onClick={() => void download()}>
            <Icon name="download" />
            دریافت
          </button>
          {!isDraft && (
            <Link to={`/resumes/${id}`} className="pe-btn ghost">
              نسخه‌ی سایت
            </Link>
          )}
        </div>
      </header>

      <div className="pe-grid">
        <nav className="pe-steps" aria-label="بخش‌ها">
          {STEPS.map((s, i) => (
            <button key={s.key} type="button" className={i === step ? "active" : ""} onClick={() => go(i)}>
              <Icon name={s.icon} />
              <span>{s.label}</span>
              {s.done(data) && i !== step && <span className="pe-done" aria-label="تکمیل شده">✓</span>}
            </button>
          ))}
        </nav>

        <section className="pe-form" ref={formTop}>
          <HiddenFieldsContext.Provider value={hiddenFields}>
            <div className="pe-form-body">{current.render(data, set)}</div>
          </HiddenFieldsContext.Provider>
          {saveError && <p className="error">ذخیره نشد: {saveError}</p>}
          <footer className="pe-form-foot">
            <button type="button" className="pe-btn ghost" disabled={step === 0} onClick={() => go(step - 1)}>
              قبلی
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" className="pe-btn" onClick={() => go(step + 1)}>
                بعدی
              </button>
            ) : (
              <button type="button" className="pe-btn" onClick={() => void download()}>
                دریافت پی‌دی‌اف
              </button>
            )}
            <button type="button" className="pe-btn primary" disabled={saveState === "saving"} onClick={() => void save()}>
              {isDraft ? "ذخیره در رزومه‌های من" : "ذخیره‌ی تغییرات"}
            </button>
          </footer>
        </section>

        <aside className="pe-preview">
          <div className="pe-paper">
            <Scaled>
              <pdf.component data={previewData} theme={{ ...theme, templateId: pdf.id }} />
            </Scaled>
          </div>
        </aside>
      </div>

      {picker && (
        <TemplatePicker
          data={previewData}
          theme={theme}
          currentId={pdf.id}
          onPick={(pdfTemplateId) => {
            setTheme({ ...theme, pdfTemplateId });
            setPicker(false);
          }}
          onColor={(primary) => setTheme({ ...theme, colors: { ...theme.colors, primary } })}
          onClose={() => setPicker(false)}
        />
      )}
    </div>
  );
}

/** Popup with every resume template rendered with the user's own content. */
function TemplatePicker({
  data,
  theme,
  currentId,
  onPick,
  onColor,
  onClose,
}: {
  data: ResumeData;
  theme: Theme;
  currentId: string;
  onPick: (id: string) => void;
  onColor: (color: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="pe-modal" role="dialog" aria-modal="true" aria-label="انتخاب قالب" onClick={onClose}>
      <div className="pe-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="pe-modal-head">
          <h2>انتخاب قالب</h2>
          <div className="pe-colors">
            <ColorPicker value={theme.colors.primary} onChange={onColor} forPrint />
          </div>
          <button type="button" className="pe-close" onClick={onClose} aria-label="بستن">
            <Icon name="close" />
          </button>
        </div>
        <div className="pe-modal-grid">
          {PDF_TEMPLATES.map((t) => (
            <button key={t.id} type="button" className={`pe-tpl ${t.id === currentId ? "active" : ""}`} onClick={() => onPick(t.id)}>
              <div className="pe-tpl-page">
                <Scaled>
                  <t.component data={data} theme={{ ...theme, templateId: t.id }} />
                </Scaled>
              </div>
              <span>
                {t.id === currentId && <Icon name="check" />}
                {t.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
