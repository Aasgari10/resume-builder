// Comments on a site template: newest first, each with likes and dislikes and the team's answer. Signed-in
// users write and vote; an admin answers or removes a comment right here.

import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ApiError, api, type TemplateComment } from "../api";
import { useAuth } from "../auth";
import { formatDate } from "../format";

const fa = (n: number) => n.toLocaleString("fa-IR");

export function Comments({ templateId, onCount }: { templateId: string; onCount?: (n: number) => void }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const admin = user?.role === "ADMIN";
  const [list, setList] = useState<TemplateComment[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setList(null);
    api.comments.list(templateId).then(
      (r) => setList(r.comments),
      (e) => setError(e instanceof ApiError ? e.message : "نظرها بارگذاری نشد"),
    );
  }, [templateId, user]);

  const put = (c: TemplateComment) => setList((l) => l?.map((x) => (x.id === c.id ? c : x)) ?? l);

  async function write(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { comment } = await api.comments.write(templateId, text.trim());
      const next = [comment, ...(list ?? [])];
      setList(next);
      onCount?.(next.length);
      setText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "نظر فرستاده نشد");
    } finally {
      setBusy(false);
    }
  }

  async function vote(c: TemplateComment, v: 1 | -1) {
    if (!user) return;
    try {
      put((await api.comments.vote(c.id, c.myVote === v ? 0 : v)).comment);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ثبت نشد");
    }
  }

  return (
    <div className="cm">
      {user ? (
        <form className="cm-write" onSubmit={write}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} minLength={3} maxLength={1000} placeholder="نظرتان درباره‌ی این قالب چیست؟" aria-label="نظر شما" />
          <button className="s4-btn main" disabled={busy || text.trim().length < 3}>
            {busy ? "…" : "ثبت نظر"}
          </button>
        </form>
      ) : (
        <p className="cm-login">
          برای نوشتن نظر یا پسندیدن نظرها{" "}
          <Link to="/login" state={{ from: pathname }}>
            وارد شوید
          </Link>
          .
        </p>
      )}
      {error && <p className="sp-error">{error}</p>}

      {!list ? (
        <p className="sp-hint center">…</p>
      ) : list.length === 0 ? (
        <p className="sp-hint center">هنوز نظری برای این قالب نیست؛ اولین نفر باشید.</p>
      ) : (
        <ul className="cm-list">
          {list.map((c) => (
            <li key={c.id}>
              <div className="cm-top">
                <b>{c.author}</b>
                <small>{formatDate(c.createdAt)}</small>
              </div>
              <p className="cm-text">{c.text}</p>
              <div className="cm-votes">
                <button type="button" aria-pressed={c.myVote === 1} disabled={!user} onClick={() => void vote(c, 1)} aria-label="پسندیدم" title={user ? "پسندیدم" : "برای رأی دادن وارد شوید"}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 10v10H4V10z M7 10l4-7c1.5 0 2.5 1 2.2 2.6L12.6 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7" />
                  </svg>
                  {fa(c.likes)}
                </button>
                <button type="button" aria-pressed={c.myVote === -1} disabled={!user} onClick={() => void vote(c, -1)} aria-label="نپسندیدم" title={user ? "نپسندیدم" : "برای رأی دادن وارد شوید"}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17 14V4h3v10z M17 14l-4 7c-1.5 0-2.5-1-2.2-2.6l.6-3.4H5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 6.2 4H17" />
                  </svg>
                  {fa(c.dislikes)}
                </button>
              </div>
              {c.reply && (
                <div className="cm-reply">
                  <b>پاسخ site4site</b>
                  <p>{c.reply}</p>
                </div>
              )}
              {admin && (
                <AdminTools
                  c={c}
                  onChange={put}
                  onRemoved={() => {
                    const next = list.filter((x) => x.id !== c.id);
                    setList(next);
                    onCount?.(next.length);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** For admins: answer (or change the answer) and remove. */
function AdminTools({ c, onChange, onRemoved }: { c: TemplateComment; onChange: (c: TemplateComment) => void; onRemoved: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(c.reply ?? "");
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      onChange((await api.comments.reply(c.id, text.trim())).comment);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cm-admin">
      {open ? (
        <form onSubmit={save}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={1000} placeholder="پاسخ site4site (خالی: پاسخ حذف می‌شود)" aria-label="پاسخ" />
          <div>
            <button className="s4-btn main" disabled={busy}>
              ثبت پاسخ
            </button>
            <button type="button" className="s4-btn ghost" onClick={() => setOpen(false)}>
              انصراف
            </button>
          </div>
        </form>
      ) : (
        <div>
          <button type="button" className="cm-link" onClick={() => setOpen(true)}>
            {c.reply ? "ویرایش پاسخ" : "پاسخ دادن"}
          </button>
          <button
            type="button"
            className="cm-link danger"
            onClick={async () => {
              if (!window.confirm("این نظر حذف شود؟")) return;
              await api.comments.remove(c.id);
              onRemoved();
            }}
          >
            حذف نظر
          </button>
        </div>
      )}
    </div>
  );
}
