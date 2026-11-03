// Live preview: the portfolio site, or the printable resume with a template picker.
// The resume page is rendered at its real A4 width and scaled down to fit the pane.

import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import type { ResumeData, Theme } from "@rb/schema";
import { PDF_TEMPLATES, getPdfTemplate, getTemplate, type TemplateDefinition } from "@rb/templates";

type Device = "desktop" | "mobile";
type Mode = "site" | "resume";

const MOBILE_WIDTH = 390;
const A4_WIDTH = 794; // 210mm at 96 dpi

type Props = { data: ResumeData; theme: Theme; onThemeChange: (theme: Theme) => void };

export function Preview({ data, theme, onThemeChange }: Props) {
  const [mode, setMode] = useState<Mode>("site");
  const [device, setDevice] = useState<Device>("desktop");
  const site = getTemplate(theme.templateId);
  const pdf = getPdfTemplate(theme.pdfTemplateId);

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
        <div className="preview-viewport">
          <div className="preview-frame" style={{ width: device === "mobile" ? MOBILE_WIDTH : "100%" }}>
            <site.component data={data} theme={theme} />
          </div>
        </div>
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

/** Renders A4 content at full width and scales it to the available width. */
function Scaled({ children, width }: { children: ReactNode; width?: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(width ? width / A4_WIDTH : 1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!outer.current || !inner.current) return;
    const update = () => {
      const available = width ?? outer.current?.clientWidth ?? A4_WIDTH;
      setScale(Math.min(1, available / A4_WIDTH));
      setHeight(inner.current?.offsetHeight ?? 0);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(outer.current);
    observer.observe(inner.current);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={outer} className="scaled" style={{ height: height * scale || undefined }}>
      <div ref={inner} className="scaled-inner" style={{ width: A4_WIDTH, transform: `scale(${scale})` }}>
        {children}
      </div>
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
