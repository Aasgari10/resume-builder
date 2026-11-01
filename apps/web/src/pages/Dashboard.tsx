import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, api, type ResumeSummary } from "../api";

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" });

export function Dashboard() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<ResumeSummary[] | null>(null);
  const [title, setTitle] = useState("");
  const [locale, setLocale] = useState<"fa" | "en">("fa");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .listResumes()
      .then((r) => setResumes(r.resumes))
      .catch((e) => setError(e instanceof ApiError ? e.message : "خطا در دریافت لیست"));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await api.createResume(title, locale);
      navigate(`/resumes/${r.resume.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در ساخت رزومه");
      setBusy(false);
    }
  }

  async function remove(resume: ResumeSummary) {
    if (!confirm(`رزومه‌ی «${resume.title}» حذف شود؟`)) return;
    try {
      await api.deleteResume(resume.id);
      setResumes((list) => list?.filter((r) => r.id !== resume.id) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در حذف");
    }
  }

  return (
    <div className="stack">
      <h1>رزومه‌های من</h1>

      <form onSubmit={create} className="card row gap wrap">
        <input
          placeholder="عنوان رزومه، مثلاً «رزومه‌ی فرانت‌اند»"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          required
          className="grow"
        />
        <select value={locale} onChange={(e) => setLocale(e.target.value as "fa" | "en")}>
          <option value="fa">فارسی</option>
          <option value="en">English</option>
        </select>
        <button className="btn" disabled={busy}>
          + رزومه‌ی جدید
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {resumes === null ? (
        <p className="muted">در حال بارگذاری…</p>
      ) : resumes.length === 0 ? (
        <p className="muted">هنوز رزومه‌ای نساخته‌اید.</p>
      ) : (
        <ul className="list">
          {resumes.map((r) => (
            <li key={r.id} className="card row gap">
              <div className="grow">
                <Link to={`/resumes/${r.id}`} className="title-link">
                  {r.title}
                </Link>
                <div className="muted small">
                  {r.locale === "fa" ? "فارسی" : "English"} · آخرین ویرایش {dateFormatter.format(new Date(r.updatedAt))}
                </div>
              </div>
              <Link to={`/resumes/${r.id}`} className="btn ghost">
                ویرایش
              </Link>
              <button className="btn danger ghost" onClick={() => remove(r)}>
                حذف
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
