// Website template gallery. Cards are framed like a browser window and show the live template;
// on hover the site scrolls. Choosing one creates a resume that uses it, opened on the site preview.

import { memo, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ResumeData } from "@rb/schema";
import { PORTFOLIO_TEMPLATES, sampleResume, type TemplateDefinition } from "@rb/templates";
import { Scaled } from "../components/Scaled";
import { themeFor } from "./Gallery";
import { showcaseColor } from "./showcase";

const fa = (n: number) => n.toLocaleString("fa-IR");

export function SiteGallery() {
  const navigate = useNavigate();
  const data = useMemo(() => sampleResume("fa"), []);
  const use = (t: TemplateDefinition) =>
    navigate(`/resume/new?site=${t.id}&color=${encodeURIComponent(showcaseColor(t.id))}`);

  return (
    <div className="gallery">
      <section className="gallery-top">
        <h1>{fa(PORTFOLIO_TEMPLATES.length)} قالب سایت شخصی</h1>
        <p>رزومه‌تان را به یک سایت واقعی روی آدرس اختصاصی تبدیل کنید؛ با سئوی خودکار و نمایش درست روی موبایل. روی کارت‌ها بروید تا سایت را ببینید.</p>
      </section>

      <section className="site-grid">
        {PORTFOLIO_TEMPLATES.map((t) => (
          <button key={t.id} type="button" className="g-card s-card" onClick={() => use(t)}>
            <div className="s-window">
              <div className="s-bar">
                <i />
                <i />
                <i />
                <span className="ltr">sara.example.ir</span>
              </div>
              <div className="s-view">
                <div className="s-scroll">
                  <Site template={t} data={data} />
                </div>
              </div>
              <span className="g-hint">استفاده از این قالب</span>
            </div>
            <div className="g-meta">
              <span className="g-badge" style={{ background: showcaseColor(t.id) }} />
              <span className="g-name">{t.name}</span>
            </div>
          </button>
        ))}
      </section>

      <p className="gallery-foot muted small">
        فقط رزومه‌ی پی‌دی‌اف می‌خواهید؟ <Link to="/resume">قالب‌های رزومه</Link>
      </p>
    </div>
  );
}

const Site = memo(function Site({ template, data }: { template: TemplateDefinition; data: ResumeData }) {
  return (
    <Scaled base={1280}>
      <template.component data={data} theme={themeFor(template.id)} />
    </Scaled>
  );
});
