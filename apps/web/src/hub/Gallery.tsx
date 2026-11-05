// Resume (PDF) template gallery. Each card is a live render of the template with sample content
// in its showcase color; on hover the page scrolls so the whole resume can be seen.
// Choosing a card creates a resume with that template.

import { memo, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { defaultTheme, type ResumeData, type Theme } from "@rb/schema";
import { PDF_TEMPLATES, sampleResume, type TemplateDefinition } from "@rb/templates";
import { Scaled } from "../components/Scaled";
import { Icon } from "./Icons";
import { STYLE_FILTERS } from "./ResumeHub";
import { showcaseColor } from "./showcase";

const fa = (n: number) => n.toLocaleString("fa-IR");

export function themeFor(templateId: string): Theme {
  const theme = defaultTheme(templateId, "fa");
  return {
    ...theme,
    colors: { ...theme.colors, primary: showcaseColor(templateId) },
    display: { ...theme.display, showSkillLevel: true },
  };
}

export function Gallery() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const style = params.get("style");
  const [query, setQuery] = useState("");
  const data = useMemo(() => sampleResume("fa"), []);

  const list = PDF_TEMPLATES.filter(
    (t) => (!style || t.tags?.includes(style as never)) && (!query.trim() || t.name.includes(query.trim()))
  );
  const styleLabel = STYLE_FILTERS.find((f) => f.key === style)?.label;
  const use = (t: TemplateDefinition) =>
    navigate(`/resume/new?template=${t.id}&color=${encodeURIComponent(showcaseColor(t.id))}`);

  return (
    <div className="gallery">
      <section className="gallery-top">
        <h1>{styleLabel ? `قالب‌های رزومه‌ی ${styleLabel}` : `${fa(PDF_TEMPLATES.length)} قالب رزومه‌ی حرفه‌ای`}</h1>
        <p>رزومه‌ی آماده‌ی چاپ و ارسال برای کارفرما، با خروجی پی‌دی‌اف. قالب را انتخاب کنید؛ رنگ و جزئیات را بعداً در ویرایشگر تغییر می‌دهید.</p>
        <div className="gallery-filters">
          <label className="g-search">
            <Icon name="search" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجو" />
          </label>
          <span className="g-sep" />
          <select
            className="g-select"
            value={style ?? ""}
            onChange={(e) => setParams(e.target.value ? { style: e.target.value } : {})}
            aria-label="سبک"
          >
            <option value="">همه‌ی سبک‌ها</option>
            {STYLE_FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {list.length === 0 ? (
        <p className="muted gallery-empty">قالبی با این مشخصات پیدا نشد.</p>
      ) : (
        <section className="gallery-grid">
          {list.map((t) => (
            <button key={t.id} type="button" className="g-card" onClick={() => use(t)}>
              <div className="g-art">
                <div className="g-pdf">
                  <div className="g-pdf-scroll">
                    <Pdf template={t} data={data} />
                  </div>
                </div>
                <span className="g-hint">استفاده از این قالب</span>
              </div>
              <div className="g-meta">
                <span className="g-badge" style={{ background: showcaseColor(t.id) }} />
                <span className="g-name">{t.name}</span>
                <span className="g-tags">
                  {t.tags
                    ?.map((k) => STYLE_FILTERS.find((f) => f.key === k)?.label)
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            </button>
          ))}
        </section>
      )}

      <p className="gallery-foot muted small">
        سایت شخصی هم می‌خواهید؟ <Link to="/resume/sites">قالب‌های سایت</Link>
      </p>
    </div>
  );
}

const Pdf = memo(function Pdf({ template, data }: { template: TemplateDefinition; data: ResumeData }) {
  return (
    <Scaled>
      <template.component data={data} theme={themeFor(template.id)} />
    </Scaled>
  );
});
