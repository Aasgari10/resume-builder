// Loads and saves one resume for an editor page. The id "new" is a draft: nothing is stored
// until the user presses Save, so browsing templates never fills "My resumes" with empty items.
// After the first save the draft becomes a normal resume and changes are saved automatically.

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PRIMARY_SWATCHES, defaultTheme, emptyResume, themeSchema, type ResumeData, type Theme } from "@rb/schema";
import { DEFAULT_PORTFOLIO_TEMPLATE_ID, TEMPLATES, getPdfTemplate } from "@rb/templates";
import { ApiError, api } from "../../api";

export type SaveState = "idle" | "draft" | "pending" | "saving" | "saved" | "error";

export const DRAFT_ID = "new";
const HEX = /^#[0-9A-F]{6}$/;

/** Theme and title for a draft, from the template and color chosen in the gallery (?template, ?site, ?color). */
function draftFromParams(params: URLSearchParams) {
  const siteId = params.get("site");
  const site = siteId && TEMPLATES[siteId]?.kind === "PORTFOLIO" ? TEMPLATES[siteId]! : null;
  const pdf = getPdfTemplate(params.get("template") ?? undefined);
  const requested = params.get("color")?.toUpperCase() ?? "";
  const color = HEX.test(requested) ? requested : PRIMARY_SWATCHES[0].value;
  const base = defaultTheme(site?.id ?? DEFAULT_PORTFOLIO_TEMPLATE_ID, "fa");
  return {
    // A site starts with its template's short name ("بوتیک", not "سایت با قالب بوتیک (فروشگاه)").
    title: site ? site.name.replace(/\s*\(.*\)\s*$/, "") : `رزومه با قالب ${pdf.name}`,
    theme: { ...base, pdfTemplateId: pdf.id, colors: { ...base.colors, primary: color } } satisfies Theme,
  };
}

/**
 * @param editorPath where the editor lives for a saved resume, e.g. (id) => `/resumes/${id}/pdf`;
 *   used to replace the draft URL after the first save.
 */
export function useResumeDoc(id: string | undefined, editorPath: (id: string) => string) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isDraft = id === DRAFT_ID;
  const [title, setTitle] = useState("");
  const [data, setData] = useState<ResumeData | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedVersion, setSavedVersion] = useState(0);
  const skipNextSave = useRef(false); // the state update from loading is not a user edit
  const saveSeq = useRef(0); // only the latest save may update the status

  /* Load, or start a draft */
  useEffect(() => {
    if (!id) return;
    skipNextSave.current = true;
    if (isDraft) {
      const draft = draftFromParams(params);
      setTitle(draft.title);
      setData(emptyResume("fa"));
      setTheme(draft.theme);
      setSaveState("draft");
      return;
    }
    api
      .getResume(id)
      .then(({ resume }) => {
        setTitle(resume.title);
        setData(resume.data);
        const saved = themeSchema.safeParse(resume.portfolioTheme);
        setTheme(saved.success ? saved.data : defaultTheme(DEFAULT_PORTFOLIO_TEMPLATE_ID, resume.data.locale));
      })
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : "خطا در بارگذاری"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* Autosave 800 ms after the last change; drafts wait for the Save button */
  useEffect(() => {
    if (!id || !data) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (isDraft) return;
    setSaveState("pending");
    const timer = setTimeout(() => void save(), 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, title, theme]);

  /* Warn before leaving with unsaved work */
  useEffect(() => {
    const unsaved = isDraft || saveState === "pending" || saveState === "saving" || saveState === "error";
    if (!unsaved) return;
    const onLeave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [isDraft, saveState]);

  /** Saves and returns the resume id; a draft is created first. Null when saving failed. */
  async function save(): Promise<string | null> {
    if (!id || !data || !theme) return null;
    const seq = ++saveSeq.current;
    setSaveState("saving");
    try {
      const body = { title: title.trim() || "بدون عنوان", data, portfolioTheme: theme };
      let savedId = id;
      if (isDraft) {
        const { resume } = await api.createResume(body.title, data.locale);
        await api.updateResume(resume.id, body);
        savedId = resume.id;
        skipNextSave.current = true; // reloading under the new id is not an edit
        navigate(editorPath(savedId), { replace: true });
      } else {
        await api.updateResume(id, body);
      }
      if (seq === saveSeq.current) {
        setSaveState("saved");
        setSaveError(null);
        setSavedVersion((v) => v + 1);
      }
      return savedId;
    } catch (e) {
      if (seq === saveSeq.current) {
        setSaveState(isDraft ? "draft" : "error");
        setSaveError(e instanceof ApiError ? e.message : "خطای ناشناخته");
      }
      return null;
    }
  }

  return { isDraft, title, setTitle, data, setData, theme, setTheme, loadError, saveState, saveError, savedVersion, save };
}

export const SAVE_LABELS: Record<SaveState, string> = {
  idle: "",
  draft: "",
  pending: "تغییرات ذخیره نشده",
  saving: "در حال ذخیره…",
  saved: "✓ ذخیره شد",
  error: "⚠ خطا در ذخیره",
};
