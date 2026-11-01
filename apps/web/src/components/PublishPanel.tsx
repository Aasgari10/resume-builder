// Site address, SEO settings and publishing for one resume.

import { useEffect, useMemo, useRef, useState } from "react";
import type { ResumeData } from "@rb/schema";
import { buildSeo } from "@rb/templates";
import { ApiError, api, type Availability, type FieldIssue, type Site } from "../api";
import { Checkbox, Field, SectionCard, TextArea } from "./editor/fields";

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" });

type Props = {
  resumeId: string;
  data: ResumeData;
  /** Increments after every successful autosave, so publish state can be refreshed. */
  version: number;
  /** Flushes pending edits; resolves false if saving failed. */
  saveNow: () => Promise<boolean>;
  /** Shows strict validation issues in the editor when publishing is blocked. */
  onIssues: (issues: FieldIssue[]) => void;
};

export function PublishPanel({ resumeId, data, version, saveNow, onIssues }: Props) {
  const [site, setSite] = useState<Site | null | undefined>(undefined);
  const [subdomain, setSubdomain] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [noindex, setNoindex] = useState(false);
  const [availability, setAvailability] = useState<Availability | "checking" | null>(null);
  const [busy, setBusy] = useState<"save" | "publish" | "unpublish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Responses older than the latest load or action are discarded, so a slow refresh
  // cannot overwrite the result of a publish that finished after it started.
  const requestSeq = useRef(0);

  /* Load settings once; refresh publish state after each autosave. */
  useEffect(() => {
    const seq = ++requestSeq.current;
    api
      .getSite(resumeId)
      .then(({ site }) => {
        if (seq !== requestSeq.current) return;
        setSite(site);
        if (site && site.subdomain && subdomain === "") {
          setSubdomain(site.subdomain);
          setSeoTitle(site.seoTitle ?? "");
          setSeoDescription(site.seoDescription ?? "");
          setNoindex(site.noindex);
        }
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "خطا در دریافت اطلاعات سایت"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId, version]);

  /* Live address check, 400 ms after typing stops. */
  const normalized = subdomain.trim().toLowerCase();
  useEffect(() => {
    if (!normalized || normalized === site?.subdomain) {
      setAvailability(null);
      return;
    }
    setAvailability("checking");
    const timer = setTimeout(() => {
      api
        .checkSubdomain(resumeId, normalized)
        .then(setAvailability)
        .catch(() => setAvailability(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [normalized, resumeId, site?.subdomain]);

  const generated = useMemo(() => buildSeo(data), [data]);

  const settingsChanged =
    !site ||
    normalized !== site.subdomain ||
    seoTitle.trim() !== (site.seoTitle ?? "") ||
    seoDescription.trim() !== (site.seoDescription ?? "") ||
    noindex !== site.noindex;

  const canSave = normalized.length > 0 && settingsChanged && availability !== "checking" && (availability === null || availability.available);

  async function run(kind: "save" | "publish" | "unpublish", action: () => Promise<{ site: Site }>) {
    setError(null);
    setBusy(kind);
    try {
      const { site } = await action();
      requestSeq.current++;
      setSite(site);
      setAvailability(null);
    } catch (e) {
      if (e instanceof ApiError && e.code === "NOT_PUBLISHABLE" && Array.isArray(e.details)) {
        onIssues(e.details as FieldIssue[]);
        setError("رزومه هنوز کامل نیست؛ موارد مشخص‌شده در بالای صفحه را کامل کنید.");
      } else {
        setError(e instanceof ApiError ? e.message : "خطای ناشناخته");
      }
    } finally {
      setBusy(null);
    }
  }

  const saveSettings = () =>
    run("save", () =>
      api.saveSite(resumeId, { subdomain: normalized, seoTitle: seoTitle.trim() || null, seoDescription: seoDescription.trim() || null, noindex })
    );

  const publish = () =>
    run("publish", async () => {
      if (!(await saveNow())) throw new ApiError(0, "SAVE_FAILED", "ذخیره‌ی تغییرات انجام نشد؛ دوباره تلاش کنید");
      if (settingsChanged) await api.saveSite(resumeId, { subdomain: normalized, seoTitle: seoTitle.trim() || null, seoDescription: seoDescription.trim() || null, noindex });
      return api.publishSite(resumeId);
    });

  const unpublish = () => {
    if (!confirm("سایت از دسترس عموم خارج شود؟ تنظیمات و آدرس حفظ می‌شوند.")) return;
    void run("unpublish", () => api.unpublishSite(resumeId));
  };

  const link = site ? (site.url ?? site.path) : null;

  return (
    <SectionCard title="انتشار سایت">
      {site === undefined ? (
        <p className="muted">در حال بارگذاری…</p>
      ) : (
        <>
          {site?.isPublished && link && (
            <div className="notice success publish-status">
              <span>
                ✅ منتشر شده
                {site.publishedAt && <span className="muted small"> · {dateFormatter.format(new Date(site.publishedAt))}</span>}
              </span>
              <a href={link} target="_blank" rel="noopener noreferrer" className="ltr">
                {link.replace(/^https?:\/\//, "")}
              </a>
              {site.hasUnpublishedChanges && <span className="badge">تغییرات منتشرنشده دارید</span>}
            </div>
          )}

          <div className="field">
            <span>آدرس سایت *</span>
            <div className="address-input ltr">
              <span className="muted">/s/</span>
              <input
                value={subdomain}
                maxLength={30}
                placeholder="sara-mohammadi"
                autoCapitalize="off"
                spellCheck={false}
                onChange={(e) => setSubdomain(e.target.value)}
              />
            </div>
            <small className={availability && availability !== "checking" && !availability.available ? "error" : "muted"}>
              {availability === "checking"
                ? "در حال بررسی…"
                : availability?.available
                  ? "✓ این آدرس آزاد است"
                  : availability
                    ? availability.message
                    : "حروف انگلیسی کوچک، عدد و خط تیره؛ ۳ تا ۳۰ کاراکتر"}
            </small>
          </div>

          <details className="seo-details">
            <summary>تنظیمات سئو (اختیاری)</summary>
            <div className="stack">
              <SearchSnippet
                title={seoTitle.trim() || generated.title}
                description={seoDescription.trim() || generated.description}
                address={link?.replace(/^https?:\/\//, "") ?? `/s/${normalized || "..."}`}
              />
              <Field label="عنوان در نتایج جستجو" value={seoTitle} onChange={setSeoTitle} max={70} placeholder={generated.title} />
              <TextArea
                label="توضیحات در نتایج جستجو"
                rows={2}
                max={160}
                value={seoDescription}
                onChange={setSeoDescription}
                hint={generated.description ? `خالی بگذارید تا خودکار ساخته شود: ${generated.description}` : undefined}
              />
              <Checkbox label="در موتورهای جستجو نمایش داده نشود" checked={noindex} onChange={setNoindex} />
            </div>
          </details>

          {error && <p className="error">{error}</p>}

          <div className="row gap wrap">
            {settingsChanged && (
              <button type="button" className="btn ghost" disabled={!canSave || busy !== null} onClick={saveSettings}>
                {busy === "save" ? "در حال ذخیره…" : site ? "ذخیره‌ی تنظیمات" : "ثبت آدرس"}
              </button>
            )}
            <button
              type="button"
              className="btn"
              disabled={busy !== null || !normalized || (settingsChanged && !canSave) || (site?.isPublished && !site.hasUnpublishedChanges && !settingsChanged)}
              onClick={publish}
            >
              {busy === "publish" ? "در حال انتشار…" : site?.isPublished ? "به‌روزرسانی سایت" : "انتشار سایت"}
            </button>
            {site?.isPublished && (
              <button type="button" className="btn danger ghost" disabled={busy !== null} onClick={unpublish}>
                {busy === "unpublish" ? "…" : "لغو انتشار"}
              </button>
            )}
          </div>
          <p className="muted small">
            سایت از نسخه‌ای که منتشر می‌کنید ساخته می‌شود؛ تغییرات بعدی تا «به‌روزرسانی سایت» روی آن اعمال نمی‌شوند.
          </p>
        </>
      )}
    </SectionCard>
  );
}

/** Approximation of how the page appears in search results. */
function SearchSnippet({ title, description, address }: { title: string; description: string; address: string }) {
  return (
    <div className="search-snippet" aria-label="پیش‌نمایش در نتایج جستجو">
      <div className="snippet-address ltr">{address}</div>
      <div className="snippet-title">{title || "—"}</div>
      <div className="snippet-description">{description || "—"}</div>
    </div>
  );
}
