import { useState } from "react";
import type { ResumeData, Theme } from "@rb/schema";
import { getTemplate } from "@rb/templates";

type Device = "desktop" | "mobile";

const MOBILE_WIDTH = 390;

/** Live template preview. Mobile mode narrows the frame; templates adapt via container queries. */
export function Preview({ data, theme }: { data: ResumeData; theme: Theme }) {
  const [device, setDevice] = useState<Device>("desktop");
  const { component: Template, name } = getTemplate(theme.templateId);

  return (
    <div className="preview">
      <div className="preview-toolbar">
        <span className="muted small">پیش‌نمایش · قالب {name}</span>
        <div className="segmented" role="group" aria-label="اندازه‌ی نمایش">
          <button aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>
            دسکتاپ
          </button>
          <button aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>
            موبایل
          </button>
        </div>
      </div>
      <div className="preview-viewport">
        <div className="preview-frame" style={{ width: device === "mobile" ? MOBILE_WIDTH : "100%" }}>
          <Template data={data} theme={theme} />
        </div>
      </div>
    </div>
  );
}
