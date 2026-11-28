// Admin tab: comments on site templates, unanswered first. The admin answers (or changes the answer) and
// removes; likes and dislikes are shown, not changed.

import { useEffect, useState } from "react";
import { getTemplate } from "@rb/templates";
import { ApiError, api, type AdminTemplateComment } from "../api";
import { formatDate } from "../format";

const fa = (n: number) => n.toLocaleString("fa-IR");

function templateName(id: string): string {
  try {
    return getTemplate(id).name;
  } catch {
    return id;
  }
}

export function CommentsAdmin() {
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AdminTemplateComment[]; pages: number; total: number; unanswered: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPage(1), [onlyOpen]);
  useEffect(() => {
    api.comments
      .adminList(page, onlyOpen)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "خطا در بارگذاری"));
  }, [page, onlyOpen]);

  const put = (c: AdminTemplateComment) => setData((d) => d && { ...d, items: d.items.map((x) => (x.id === c.id ? c : x)) });

  return (
    <div className="card stack">
      <div className="row gap wrap">
        <label className="row gap small">
          <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
          فقط نظرهای بی‌پاسخ
        </label>
        {data && (
          <span className="muted small">
            {fa(data.total)} نظر · {fa(data.unanswered)} بی‌پاسخ
          </span>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      {data?.items.length === 0 && <p className="muted center">نظری نیست.</p>}
      <ul className="cma-list">
        {data?.items.map((c) => (
          <Row key={c.id} c={c} onChange={put} onRemoved={() => setData((d) => d && { ...d, items: d.items.filter((x) => x.id !== c.id), total: d.total - 1 })} />
        ))}
      </ul>
      {data && data.pages > 1 && (
        <div className="row gap">
          <button className="btn ghost small" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            قبلی
          </button>
          <span className="muted small">
            صفحه‌ی {fa(page)} از {fa(data.pages)}
          </span>
          <button className="btn ghost small" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ c, onChange, onRemoved }: { c: AdminTemplateComment; onChange: (c: AdminTemplateComment) => void; onRemoved: () => void }) {
  const [text, setText] = useState(c.reply ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const { comment } = await api.comments.reply(c.id, text.trim());
      onChange({ ...c, ...comment });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ثبت نشد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="cma-item">
      <div className="row gap wrap cma-meta">
        <b>{templateName(c.templateId)}</b>
        <span className="muted small">
          {c.author} · <span className="ltr">{c.phone}</span> · {formatDate(c.createdAt)} · 👍 {fa(c.likes)} · 👎 {fa(c.dislikes)}
        </span>
        {!c.reply && <span className="status-pill so-wait">بی‌پاسخ</span>}
      </div>
      <p className="cma-text">{c.text}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={1000} placeholder="پاسخ site4site" aria-label="پاسخ" />
      {error && <p className="error small">{error}</p>}
      <div className="row gap">
        <button className="btn small" disabled={busy || text.trim() === (c.reply ?? "")} onClick={() => void save()}>
          {c.reply ? "ذخیره‌ی پاسخ" : "پاسخ دادن"}
        </button>
        <button
          className="btn ghost danger small"
          onClick={async () => {
            if (!window.confirm("این نظر حذف شود؟")) return;
            await api.comments.remove(c.id);
            onRemoved();
          }}
        >
          حذف نظر
        </button>
      </div>
    </li>
  );
}
