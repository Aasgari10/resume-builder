// Shared pieces of site build orders: status labels, the order form (opened from the editor) and the
// message thread used by the customer's "my orders" page, the admin's orders tab and support tickets.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, api, type SiteOrderLine, type SiteOrderStatus, type SiteOrderSummary } from "../api";
import { useAuth } from "../auth";
import { formatDate } from "../format";

export const SITE_ORDER_STATUS: Record<SiteOrderStatus, { label: string; tone: "ok" | "wait" | "fail" | "new" }> = {
  NEW: { label: "ثبت شد", tone: "new" },
  REVIEWING: { label: "در حال بررسی", tone: "wait" },
  BUILDING: { label: "در حال ساخت", tone: "wait" },
  DELIVERED: { label: "تحویل شد", tone: "ok" },
  CANCELED: { label: "لغو شد", tone: "fail" },
};

export function StatusPill({ status }: { status: SiteOrderStatus }) {
  const s = SITE_ORDER_STATUS[status];
  return <span className={`status-pill so-${s.tone}`}>{s.label}</span>;
}

const time = (at: string) => new Date(at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });

/** The order's conversation: messages from both sides and the status changes, oldest first, with a box to write. */
export function OrderThread({
  lines,
  me,
  onSend,
  closed,
  minLength = 1,
}: {
  lines: SiteOrderLine[];
  me: "customer" | "admin";
  onSend: (text: string) => Promise<void>;
  /** When set, the conversation is closed: this note shows instead of the box to write. */
  closed?: string;
  minLength?: number;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [lines.length]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSend(text.trim());
      setText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "پیام فرستاده نشد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="so-thread">
      <div className="so-lines">
        {lines.length === 0 && <p className="muted small center">هنوز پیامی نیست.</p>}
        {lines.map((l, i) =>
          l.from === "system" ? (
            <p key={i} className="so-sys">
              وضعیت: {l.status ? SITE_ORDER_STATUS[l.status].label : "—"} · {formatDate(l.at)}
            </p>
          ) : (
            <div key={i} className={`so-msg ${l.from === me ? "mine" : ""}`}>
              <b>{l.from === "admin" ? "پشتیبانی site4site" : me === "admin" ? "مشتری" : "شما"}</b>
              <p>{l.text}</p>
              <small>
                {formatDate(l.at)} · {time(l.at)}
              </small>
            </div>
          ),
        )}
        <div ref={end} />
      </div>
      {closed ? (
        <p className="so-closed muted small center">{closed}</p>
      ) : (
        <form className="so-write" onSubmit={submit}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} minLength={minLength} maxLength={2000} placeholder="پیامتان را بنویسید…" aria-label="پیام" />
          <button className="btn" disabled={busy || text.trim().length < minLength}>
            {busy ? "…" : "فرستادن"}
          </button>
        </form>
      )}
      {error && <p className="error small">{error}</p>}
    </div>
  );
}

/**
 * The order form of the editor. `save` saves the editor first and returns the document id, so the order
 * always carries the latest design.
 */
export function OrderDialog({ title, save, onClose, onDone }: { title: string; save: () => Promise<string | null>; onClose: () => void; onDone: (order: SiteOrderSummary) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [business, setBusiness] = useState(title);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const resumeId = await save();
      if (!resumeId) throw new ApiError(0, "SAVE", "طرح ذخیره نشد؛ دوباره تلاش کنید");
      const { order } = await api.siteOrders.create({ resumeId, name, phone, business: business || undefined, note: note || undefined });
      onDone(order);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "سفارش ثبت نشد");
      setBusy(false);
    }
  }

  return (
    <div className="so-modal" role="dialog" aria-modal="true" aria-label="ثبت سفارش" onClick={() => !busy && onClose()}>
      <form className="so-box stack" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div>
          <h2>ثبت سفارش سایت</h2>
          <p className="muted small">همین طرحی که ساخته‌اید برای ما فرستاده می‌شود. بعد از بررسی با شما تماس می‌گیریم و پیام‌ها را در «سفارش‌های من» می‌بینید.</p>
        </div>
        <label className="field">
          <span>نام و نام خانوادگی</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" />
        </label>
        <label className="field">
          <span>شماره‌ی موبایل</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} inputMode="tel" dir="ltr" autoComplete="tel" placeholder="09…" />
        </label>
        <label className="field">
          <span>نام کسب‌وکار</span>
          <input value={business} onChange={(e) => setBusiness(e.target.value)} maxLength={120} />
        </label>
        <label className="field">
          <span>توضیحات (اختیاری)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} placeholder="مثلاً دامنه‌ی دلخواه، بخش‌هایی که لازم دارید یا زمان تحویل" />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="row gap so-actions">
          <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>
            انصراف
          </button>
          <button className="btn" disabled={busy}>
            {busy ? "در حال ثبت…" : "ثبت سفارش"}
          </button>
        </div>
      </form>
    </div>
  );
}
