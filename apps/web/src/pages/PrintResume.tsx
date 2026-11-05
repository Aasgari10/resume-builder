// Printable resume page. The browser's "Save as PDF" turns it into a PDF with selectable text.
// Uses the portfolio theme's colors and section order with the PDF template.

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { applyHiddenFields, checkPublishable, defaultTheme, themeSchema, type ResumeData, type Theme } from "@rb/schema";
import { getPdfTemplate } from "@rb/templates";
import { ApiError, api } from "../api";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "incomplete"; count: number }
  | { status: "ready"; data: ResumeData; theme: Theme };

export function PrintResume() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!id) return;
    api
      .getResume(id)
      .then(({ resume }) => {
        const check = checkPublishable(resume.data);
        if (!check.ok) {
          setState({ status: "incomplete", count: check.issues.length });
          return;
        }
        const saved = themeSchema.safeParse(resume.portfolioTheme);
        const pdfId = getPdfTemplate(saved.success ? saved.data.pdfTemplateId : undefined).id;
        const theme = saved.success ? { ...saved.data, templateId: pdfId } : defaultTheme(pdfId, check.data.locale);
        setState({ status: "ready", data: check.data, theme });
      })
      .catch((e) => setState({ status: "error", message: e instanceof ApiError ? e.message : "خطا در بارگذاری" }));
  }, [id]);

  // The document title becomes the default PDF file name.
  useEffect(() => {
    if (state.status !== "ready") return;
    const previous = document.title;
    document.title = state.data.locale === "fa" ? `رزومه - ${state.data.basics.fullName}` : `${state.data.basics.fullName} - Resume`;
    return () => {
      document.title = previous;
    };
  }, [state]);

  if (state.status === "loading") return <p className="center muted">در حال آماده‌سازی…</p>;
  if (state.status === "error") return <p className="center error">{state.message}</p>;
  if (state.status === "incomplete") {
    return (
      <div className="card narrow center">
        <p>رزومه هنوز برای خروجی کامل نیست ({state.count.toLocaleString("fa-IR")} مورد).</p>
        <Link to={`/resumes/${id}/pdf`} className="btn">
          بازگشت به ویرایش
        </Link>
      </div>
    );
  }

  const { component: Template } = getPdfTemplate(state.theme.templateId);
  return (
    <>
      <div className="print-toolbar">
        <Link to={`/resumes/${id}/pdf`} className="btn ghost">
          → بازگشت
        </Link>
        <span className="muted small grow">در پنجره‌ی چاپ، مقصد را «Save as PDF» انتخاب کنید.</span>
        <button className="btn" onClick={() => window.print()}>
          ذخیره به پی‌دی‌اف
        </button>
      </div>
      <Template data={applyHiddenFields(state.data, state.theme.hiddenFields)} theme={state.theme} />
    </>
  );
}
