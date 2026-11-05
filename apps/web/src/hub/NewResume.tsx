// Creates a resume with the chosen template and color, then opens the editor.
// "template" picks a resume (PDF) template, "site" a website template. Sign-in is required
// (the route is guarded) and the user returns here after login.

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PRIMARY_SWATCHES, defaultTheme } from "@rb/schema";
import { DEFAULT_PORTFOLIO_TEMPLATE_ID, TEMPLATES, getPdfTemplate } from "@rb/templates";
import { ApiError, api } from "../api";

const HEX = /^#[0-9A-F]{6}$/;

export function NewResume() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false); // StrictMode runs effects twice in development

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const siteId = params.get("site");
    const site = siteId && TEMPLATES[siteId]?.kind === "PORTFOLIO" ? TEMPLATES[siteId]! : null;
    const pdf = getPdfTemplate(params.get("template") ?? undefined);
    const requested = params.get("color")?.toUpperCase() ?? "";
    const color = HEX.test(requested) ? requested : PRIMARY_SWATCHES[0].value;

    (async () => {
      try {
        const title = site ? `سایت با قالب ${site.name}` : `رزومه با قالب ${pdf.name}`;
        const { resume } = await api.createResume(title, "fa");
        const base = defaultTheme(site?.id ?? DEFAULT_PORTFOLIO_TEMPLATE_ID, "fa");
        await api.updateResume(resume.id, {
          portfolioTheme: { ...base, pdfTemplateId: pdf.id, colors: { ...base.colors, primary: color } },
        });
        navigate(site ? `/resumes/${resume.id}?view=site` : `/resumes/${resume.id}/pdf`, { replace: true });
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "ساخت رزومه انجام نشد");
      }
    })();
  }, [params, navigate]);

  return error ? (
    <div className="stack">
      <p className="error">{error}</p>
      <Link to="/resume">بازگشت به قالب‌ها</Link>
    </div>
  ) : (
    <p className="muted">در حال آماده‌سازی…</p>
  );
}
