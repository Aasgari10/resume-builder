// Resume editor: form on one side, live template preview on the other, with debounced autosave.

import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { defaultTheme, type Experience, type ResumeData, type Skill, type Theme } from "@rb/schema";
import { DEFAULT_PORTFOLIO_TEMPLATE_ID, sampleResume } from "@rb/templates";
import { ApiError, api, type FieldIssue } from "../api";
import { Preview } from "../components/Preview";
import { ThemePanel } from "../components/ThemePanel";

type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

const newId = () => crypto.randomUUID();

export function Editor() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [data, setData] = useState<ResumeData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [issues, setIssues] = useState<FieldIssue[] | null>(null);
  const [checking, setChecking] = useState(false);
  // Theme is preview-only for now; it will be persisted with the published site.
  const [theme, setTheme] = useState<Theme | null>(null);
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
        setTheme(defaultTheme(DEFAULT_PORTFOLIO_TEMPLATE_ID, resume.data.locale));
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
  }, [data, title]);

  async function save(): Promise<boolean> {
    if (!id || !data) return false;
    const seq = ++saveSeq.current;
    setSaveState("saving");
    try {
      await api.updateResume(id, { title: title.trim() || "بدون عنوان", data });
      if (seq === saveSeq.current) {
        setSaveState("saved");
        setSaveError(null);
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

  /* ───────────── Edit helpers ───────────── */
  const isFa = data.locale === "fa";
  const setBasics = (patch: Partial<ResumeData["basics"]>) =>
    setData({ ...data, basics: { ...data.basics, ...patch } });

  const setExperience = (index: number, patch: Partial<Experience>) =>
    setData({
      ...data,
      experience: data.experience.map((x, i) => (i === index ? { ...x, ...patch } : x)),
    });

  const addExperience = () =>
    setData({
      ...data,
      experience: [
        ...data.experience,
        { id: newId(), company: "", position: "", period: { start: "", current: false }, highlights: [] },
      ],
    });

  const removeExperience = (index: number) =>
    setData({ ...data, experience: data.experience.filter((_, i) => i !== index) });

  const addSkill = (name: string) => {
    const clean = name.trim();
    if (!clean || data.skills.some((s) => s.name === clean)) return;
    setData({ ...data, skills: [...data.skills, { id: newId(), name: clean } satisfies Skill] });
  };

  const removeSkill = (skillId: string) =>
    setData({ ...data, skills: data.skills.filter((s) => s.id !== skillId) });

  const fillSample = () => {
    if (!confirm("همه‌ی اطلاعات این رزومه با یک نمونه‌ی کامل جایگزین شود؟")) return;
    setData(sampleResume(data.locale));
  };

  /* ───────────── Render ───────────── */
  return (
    <div className="stack" dir={isFa ? "rtl" : "ltr"}>
      <div className="row gap wrap sticky-bar">
        <Link to="/dashboard" className="btn ghost">
          → بازگشت
        </Link>
        <input className="grow title-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
        <SaveBadge state={saveState} />
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
          {/* Basics */}
          <section className="card stack">
            <h2>اطلاعات پایه</h2>
            <div className="grid2">
              <Field label="نام و نام خانوادگی *" value={data.basics.fullName} onChange={(v) => setBasics({ fullName: v })} max={80} />
              <Field label="عنوان شغلی" value={data.basics.jobTitle ?? ""} onChange={(v) => setBasics({ jobTitle: v })} max={100} />
              <Field label="ایمیل" value={data.basics.email ?? ""} onChange={(v) => setBasics({ email: v })} ltr type="email" max={200} />
              <Field label="تلفن" value={data.basics.phone ?? ""} onChange={(v) => setBasics({ phone: v })} ltr max={20} />
              <Field label="شهر" value={data.basics.location ?? ""} onChange={(v) => setBasics({ location: v })} max={100} />
            </div>
            <label className="field">
              <span>درباره‌ی من</span>
              <textarea
                rows={4}
                maxLength={1500}
                value={data.basics.summary ?? ""}
                onChange={(e) => setBasics({ summary: e.target.value })}
              />
            </label>
          </section>

          {/* Work experience */}
          <section className="card stack">
            <div className="row gap">
              <h2 className="grow">سوابق کاری</h2>
              <button className="btn ghost" onClick={addExperience} disabled={data.experience.length >= 30}>
                + افزودن
              </button>
            </div>

            {data.experience.length === 0 && <p className="muted">هنوز سابقه‌ای اضافه نشده.</p>}

            {data.experience.map((x, i) => (
              <div key={x.id} className="sub-card stack">
                <div className="grid2">
                  <Field label="شرکت *" value={x.company} onChange={(v) => setExperience(i, { company: v })} max={100} />
                  <Field label="سمت *" value={x.position} onChange={(v) => setExperience(i, { position: v })} max={100} />
                  <Field
                    label="شروع *"
                    type="month"
                    ltr
                    value={x.period.start}
                    onChange={(v) => setExperience(i, { period: { ...x.period, start: v } })}
                  />
                  <Field
                    label="پایان"
                    type="month"
                    ltr
                    disabled={x.period.current}
                    value={x.period.end ?? ""}
                    onChange={(v) => setExperience(i, { period: { ...x.period, end: v || undefined } })}
                  />
                </div>
                <label className="row gap">
                  <input
                    type="checkbox"
                    checked={x.period.current}
                    onChange={(e) =>
                      setExperience(i, {
                        period: { ...x.period, current: e.target.checked, end: e.target.checked ? undefined : x.period.end },
                      })
                    }
                  />
                  هنوز اینجا کار می‌کنم
                </label>
                <label className="field">
                  <span>توضیحات</span>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={x.description ?? ""}
                    onChange={(e) => setExperience(i, { description: e.target.value })}
                  />
                </label>
                <button className="btn danger ghost self-start" onClick={() => removeExperience(i)}>
                  حذف این سابقه
                </button>
              </div>
            ))}
          </section>

          {/* Skills */}
          <section className="card stack">
            <h2>مهارت‌ها</h2>
            <SkillInput onAdd={addSkill} disabled={data.skills.length >= 60} />
            <div className="chips">
              {data.skills.map((s) => (
                <span key={s.id} className="chip">
                  {s.name}
                  <button aria-label={`حذف ${s.name}`} onClick={() => removeSkill(s.id)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>

          <ThemePanel theme={theme} onChange={setTheme} />

          <p className="muted small">
            فرم تحصیلات، پروژه‌ها، زبان‌ها و گواهینامه‌ها در گام بعد اضافه می‌شود. برای دیدن همه‌ی بخش‌های قالب، «پر کردن با نمونه» را بزنید.
          </p>
        </div>

        <aside className="editor-preview">
          <Preview data={data} theme={theme} />
        </aside>
      </div>
    </div>
  );
}

/* ───────────── Components ───────────── */

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  ltr?: boolean;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input
        type={props.type ?? "text"}
        className={props.ltr ? "ltr" : undefined}
        value={props.value}
        maxLength={props.max}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

function SkillInput({ onAdd, disabled }: { onAdd: (name: string) => void; disabled: boolean }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="row gap"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(value);
        setValue("");
      }}
    >
      <input
        className="grow"
        placeholder="مثلاً React، و Enter بزنید"
        value={value}
        maxLength={50}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />
      <button className="btn ghost" disabled={disabled || !value.trim()}>
        افزودن
      </button>
    </form>
  );
}

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
  email: "ایمیل",
  company: "شرکت",
  position: "سمت",
  start: "تاریخ شروع",
  end: "تاریخ پایان",
  name: "نام",
  title: "عنوان",
  institution: "مؤسسه",
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
