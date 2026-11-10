// Chat that changes the site from a Persian sentence: its look, and where the template allows,
// which pages and sections it shows and which items it has. Changes apply to the preview
// immediately and are saved by the editor's autosave; each change can be undone.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { defaultTheme, type ResumeData, type Theme } from "@rb/schema";
import { applySiteChanges, suggestionsFor, welcomeFor, type Capabilities } from "./site-edit/assistantSite";
import { ApiError, api, type AssistantQuota, type AssistantTurn } from "../api";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  /** Theme before this reply's change, for undo. */
  before?: Theme;
  /** Site content before this reply's change, for undo. */
  beforeData?: ResumeData;
  undone?: boolean;
  error?: boolean;
  /** Created in the browser (e.g. reset); not sent to the model as history. */
  local?: boolean;
};

const MAX_LENGTH = 300;
const fa = (n: number) => n.toLocaleString("fa-IR");

type Props = {
  theme: Theme;
  locale: "fa" | "en";
  onChange: (theme: Theme) => void;
  /** What the template lets the assistant show, hide or add, with the site content it changes. */
  capabilities: Capabilities;
  data: ResumeData;
  onData: (data: ResumeData) => void;
};

export function AssistantChat({ theme, locale, onChange, capabilities, data, onData }: Props) {
  const [quota, setQuota] = useState<AssistantQuota | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .assistantQuota()
      .then(setQuota)
      .catch(() => setQuota({ enabled: false, remainingPercent: 0, demo: false }));
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  if (quota && !quota.enabled)
    return (
      <section className="card stack assistant">
        <h2>دستیار هوشمند ✨</h2>
        <p className="muted">دستیار هوشمند فعلاً در دسترس نیست. متن‌ها و عکس‌ها را با کلیک روی خودشان در صفحه ویرایش کنید.</p>
      </section>
    );

  const exhausted = quota !== null && quota.remainingPercent <= 0;

  async function send(text: string) {
    const message = text.trim().slice(0, MAX_LENGTH);
    if (!message || busy || exhausted) return;

    // Successful turns only, so failed requests do not confuse the model.
    const history: AssistantTurn[] = messages.filter((m) => !m.error && !m.local).map((m) => ({ role: m.role, content: m.content }));
    const add = (m: Omit<Message, "id">) => setMessages((list) => [...list, { ...m, id: nextId.current++ }]);

    add({ role: "user", content: message });
    setInput("");
    setBusy(true);
    try {
      const before = theme;
      const beforeData = data;
      const r = await api.askAssistant({ message, history, theme, locale, capabilities });
      if (r.theme) onChange(r.theme);
      if (r.site) onData(applySiteChanges(data, r.site));
      const changed = Boolean(r.theme || r.site);
      add({ role: "assistant", content: r.reply, before: changed ? before : undefined, beforeData: r.site ? beforeData : undefined });
      setQuota((q) => (q ? { ...q, remainingPercent: r.remainingPercent } : q));
    } catch (e) {
      if (e instanceof ApiError && e.code === "AI_DAILY_LIMIT") setQuota((q) => (q ? { ...q, remainingPercent: 0 } : q));
      add({ role: "assistant", content: e instanceof ApiError ? e.message : "خطای ناشناخته", error: true });
    } finally {
      setBusy(false);
    }
  }

  function undo(id: number) {
    const target = messages.find((m) => m.id === id);
    if (!target?.before) return;
    onChange(target.before);
    // Content goes back to before the earliest undone change that touched it.
    const firstData = messages.find((m) => m.id >= id && m.beforeData && !m.undone)?.beforeData;
    if (firstData) onData(firstData);
    // Later changes were built on top of this one, so they are undone too.
    setMessages((list) => list.map((m) => (m.id >= id && m.before ? { ...m, undone: true } : m)));
  }

  // Exact defaults for the current template, without a model call; undoable like any other change.
  function reset() {
    const before = theme;
    onChange(defaultTheme(theme.templateId, locale));
    setMessages((list) => [
      ...list,
      { id: nextId.current++, role: "assistant", content: "ظاهر به حالت اولیه‌ی قالب برگشت.", before, local: true },
    ]);
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <section className="card stack assistant">
      <div className="row gap assistant-head">
        <h2 className="grow">دستیار هوشمند ✨</h2>
        {quota?.demo && <span className="badge">حالت آزمایشی</span>}
      </div>

      <div className="assistant-messages" ref={listRef}>
        <div className="bubble assistant-bubble">{welcomeFor(capabilities)}</div>
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.role === "user" ? "user-bubble" : "assistant-bubble"}${m.error ? " error-bubble" : ""}`}>
            {m.content}
            {m.before &&
              (m.undone ? (
                <span className="muted small undo-note">برگردانده شد</span>
              ) : (
                <button type="button" className="link-btn small" onClick={() => undo(m.id)}>
                  ↺ برگرداندن
                </button>
              ))}
          </div>
        ))}
        {busy && <div className="bubble assistant-bubble muted">در حال فکر کردن…</div>}
      </div>

      {messages.length === 0 && (
        <div className="row gap wrap">
          {suggestionsFor(capabilities).map((s) => (
            <button key={s} type="button" className="chip" disabled={busy || exhausted} onClick={() => void send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="row gap">
        <button type="button" className="link-btn small muted" disabled={busy} onClick={reset}>
          بازگشت به ظاهر اولیه
        </button>
      </div>

      <form className="row gap assistant-form" onSubmit={submit}>
        <input
          className="grow"
          value={input}
          maxLength={MAX_LENGTH}
          disabled={exhausted}
          placeholder={exhausted ? "اعتبار امروز تمام شده است" : "مثلاً: رنگ‌ها را سبز کن یا یک بخش را حذف کن"}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn" disabled={busy || exhausted || !input.trim()}>
          ارسال
        </button>
      </form>

      {quota && (
        <div className="quota">
          <div className="quota-bar" aria-hidden>
            <span style={{ width: `${quota.remainingPercent}%` }} />
          </div>
          <span className="muted small">اعتبار امروز: {fa(quota.remainingPercent)}٪ باقی مانده</span>
        </div>
      )}
    </section>
  );
}
