// Live preview: the portfolio site, or the printable resume with a template picker.
// The resume page is rendered at its real A4 width and scaled down to fit the pane.

import { memo, useState } from "react";
import { applyHiddenFields, type ResumeData, type Theme } from "@rb/schema";
import { PDF_TEMPLATES, PORTFOLIO_TEMPLATES, getPdfTemplate, getTemplate, type TemplateDefinition } from "@rb/templates";
import { Scaled } from "./Scaled";

type Device = "desktop" | "mobile";
type Mode = "site" | "resume";

const MOBILE_WIDTH = 390;

type Props = { data: ResumeData; theme: Theme; onThemeChange: (theme: Theme) => void; initialMode?: Mode };

export function Preview({ data: raw, theme, onThemeChange, initialMode = "site" }: Props) {
  const data = applyHiddenFields(raw, theme.hiddenFields);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [device, setDevice] = useState<Device>("desktop");
  const site = getTemplate(theme.templateId);
  const pdf = getPdfTemplate(theme.pdfTemplateId);

  const pickSite = (id: string) => onThemeChange({ ...theme, templateId: id });

  const pickPdf = (id: string) => {
    onThemeChange({ ...theme, pdfTemplateId: id });
    setMode("resume");
  };

  return (
    <div className="preview">
      <div className="preview-toolbar">
        <div className="segmented" role="group" aria-label="نوع پیش‌نمایش">
          <button aria-pressed={mode === "site"} onClick={() => setMode("site")}>
            سایت
          </button>
          <button aria-pressed={mode === "resume"} onClick={() => setMode("resume")}>
            رزومه‌ی پی‌دی‌اف
          </button>
        </div>
        <span className="muted small grow">قالب {mode === "site" ? site.name : pdf.name}</span>
        {mode === "site" && (
          <div className="segmented" role="group" aria-label="اندازه‌ی نمایش">
            <button aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>
              دسکتاپ
            </button>
            <button aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>
              موبایل
            </button>
          </div>
        )}
      </div>

      {mode === "site" ? (
        <>
        <div className="pdf-picker" role="listbox" aria-label="قالب سایت">
          {PORTFOLIO_TEMPLATES.map((t) => (
            <button key={t.id} role="option" aria-selected={t.id === site.id} className="pdf-thumb site-thumb" onClick={() => pickSite(t.id)}>
              <div className="site-thumb-page" aria-hidden="true">
                <Scaled width={128} base={1280}>
                  <t.component data={data} theme={{ ...theme, templateId: t.id }} />
                </Scaled>
              </div>
              <span>{t.name}</span>
            </button>
          ))}
        </div>
        <div className="preview-viewport">
          <div className="preview-frame" style={{ width: device === "mobile" ? MOBILE_WIDTH : "100%" }}>
            <site.component data={data} theme={theme} />
          </div>
        </div>
        </>
      ) : (
        <>
          <div className="pdf-picker" role="listbox" aria-label="قالب رزومه">
            {PDF_TEMPLATES.map((t) => (
              <button key={t.id} role="option" aria-selected={t.id === pdf.id} className="pdf-thumb" onClick={() => pickPdf(t.id)}>
                <Thumb template={t} data={data} theme={theme} />
                <span>{t.name}</span>
              </button>
            ))}
          </div>
          <div className="preview-viewport">
            <Scaled>
              <pdf.component data={data} theme={{ ...theme, templateId: pdf.id }} />
            </Scaled>
          </div>
        </>
      )}
    </div>
  );
}

/** Small first-page preview of a template with the user's own content and colors. */
const Thumb = memo(function Thumb({ template, data, theme }: { template: TemplateDefinition; data: ResumeData; theme: Theme }) {
  return (
    <div className="pdf-thumb-page" aria-hidden="true">
      <Scaled width={96}>
        <template.component data={data} theme={{ ...theme, templateId: template.id }} />
      </Scaled>
    </div>
  );
});
