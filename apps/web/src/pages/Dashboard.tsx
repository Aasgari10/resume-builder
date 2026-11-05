import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, api, type ResumeSummary } from "../api";

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" });

export function Dashboard() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sitesOnly = Boolean(params.get("sites"));
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
      <h1>{sitesOnly ? "سایت‌های منتشرشده" : "رزومه‌های من"}</h1>

      {!sitesOnly && (
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
      )}
      {!sitesOnly && (
        <p className="muted small">
          یا از <Link to="/resume">گالری قالب‌ها</Link> یک قالب انتخاب کنید تا رزومه با همان قالب ساخته شود.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      {(() => {
        const list = sitesOnly ? resumes?.filter((r) => r.site?.isPublished) ?? null : resumes;
        return list === null ? (
        <p className="muted">در حال بارگذاری…</p>
      ) : list.length === 0 ? (
        <p className="muted">{sitesOnly ? "هنوز سایتی منتشر نکرده‌اید." : "هنوز رزومه‌ای نساخته‌اید."}</p>
      ) : (
        <ul className="list">
          {list.map((r) => (
            <li key={r.id} className="card row gap">
              <div className="grow">
                <Link to={`/resumes/${r.id}`} className="title-link">
                  {r.title}
                </Link>
                <div className="muted small">
                  {r.locale === "fa" ? "فارسی" : "English"} · آخرین ویرایش {dateFormatter.format(new Date(r.updatedAt))}
                </div>
                {r.site?.isPublished && (
                  <a className="small ltr" href={r.site.url ?? r.site.path} target="_blank" rel="noopener noreferrer">
                    {(r.site.url ?? r.site.path).replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
              <Link to={`/resumes/${r.id}/pdf`} className="btn ghost">
                رزومه
              </Link>
              <Link to={`/resumes/${r.id}`} className="btn ghost">
                سایت
              </Link>
              <button className="btn danger ghost" onClick={() => remove(r)}>
                حذف
              </button>
            </li>
          ))}
        </ul>
      );
      })()}
    </div>
  );
}
