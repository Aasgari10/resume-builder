import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError, api, type ResumeSummary } from "../api";

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" });

export function Dashboard() {
  const [params] = useSearchParams();
  const sitesOnly = Boolean(params.get("sites"));
  const [resumes, setResumes] = useState<ResumeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listResumes()
      .then((r) => setResumes(r.resumes))
      .catch((e) => setError(e instanceof ApiError ? e.message : "خطا در دریافت لیست"));
  }, []);

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
        <p>
          <Link to="/resume" className="btn">
            + رزومه‌ی جدید
          </Link>{" "}
          <span className="muted small">یک قالب انتخاب کنید؛ رزومه بعد از اولین ذخیره در این فهرست می‌آید.</span>
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
