// Shop manager tab for blog posts (the "/blog" page of templates that have one). Posts are site
// content and save with the editor, like the text pages.

import { useState } from "react";
import type { Shop } from "@rb/schema";
import { newId } from "../editor/list";
import { Field, ImagePicker, showNumber } from "./fields";

type Post = NonNullable<Shop["posts"]>[number];

/** "1405/08/19"-style date for the list; empty when unreadable. */
const shortDate = (iso?: string) => {
  const d = iso ? new Date(iso) : undefined;
  return d && !Number.isNaN(d.getTime()) ? new Intl.DateTimeFormat("fa-IR").format(d) : "";
};
/** The value of a date input (yyyy-mm-dd) for an ISO date. */
const inputDate = (iso?: string) => (iso && !Number.isNaN(new Date(iso).getTime()) ? new Date(iso).toISOString().slice(0, 10) : "");

export function Blog({ shop, setShop, hasBlog }: { shop: Shop; setShop: (s: Partial<Shop>) => void; hasBlog: boolean }) {
  const posts = shop.posts ?? [];
  const save = (next: Post[]) => setShop({ posts: next.length ? next : undefined });
  const update = (id: string, patch: Partial<Post>) => save(posts.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const shown = q.trim() ? posts.filter((p) => `${p.title} ${p.category ?? ""}`.includes(q.trim())) : posts;

  return (
    <div className="shm-cats">
      <div className="shm-toolbar">
        <p className="muted">
          {hasBlog ? "نوشته‌های صفحه‌ی «بلاگ». جدیدترین نوشته اول نمایش داده می‌شود." : "این قالب صفحه‌ی بلاگ ندارد؛ نوشته‌ها نگه داشته می‌شوند و در قالب‌هایی که بلاگ دارند نمایش داده می‌شوند."}{" "}
          تا وقتی نوشته‌ای نباشد، صفحه‌ی بلاگ ساخته نمی‌شود.
        </p>
        {posts.length < 60 && (
          <button
            type="button"
            className="btn small"
            onClick={() => {
              const id = newId();
              save([{ id, title: "نوشته‌ی جدید", text: "", date: new Date().toISOString() }, ...posts]);
              setOpen(id);
            }}
          >
            + نوشته‌ی جدید
          </button>
        )}
      </div>
      {posts.length > 5 && <input className="shm-search" value={q} placeholder="جستجو در عنوان یا دسته…" aria-label="جستجوی نوشته" onChange={(e) => setQ(e.target.value)} />}
      {posts.length === 0 && <p className="muted shm-hint">هنوز نوشته‌ای ننوشته‌اید.</p>}
      {shown.map((p) => {
        const k = posts.indexOf(p);
        return (
          <div key={p.id} className={`shm-page${p.hidden ? " off" : ""}`}>
            <div className="shm-page-head">
              <span className="shm-thumb">{p.image ? <img src={p.image} alt="" /> : "📰"}</span>
              <button type="button" className="shm-page-title" aria-expanded={open === p.id} onClick={() => setOpen(open === p.id ? null : p.id)}>
                <b>{p.title || "بدون عنوان"}</b>
                <small className="muted">
                  {[shortDate(p.date), p.category, p.hidden ? "پنهان" : ""].filter(Boolean).join(" · ")}
                </small>
              </button>
              <button type="button" className="btn ghost small" disabled={k === 0} aria-label="بالاتر" onClick={() => save(moved(posts, k, -1))}>
                ↑
              </button>
              <button type="button" className="btn ghost small" disabled={k === posts.length - 1} aria-label="پایین‌تر" onClick={() => save(moved(posts, k, 1))}>
                ↓
              </button>
            </div>
            {open === p.id && (
              <div className="shm-slide-fields">
                <div className="shm-grid">
                  <Field label="عنوان" wide>
                    <input value={p.title} maxLength={160} onChange={(e) => update(p.id, { title: e.target.value })} />
                  </Field>
                  <Field label="تاریخ">
                    <input type="date" dir="ltr" value={inputDate(p.date)} onChange={(e) => update(p.id, { date: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
                  </Field>
                  <Field label="دسته" hint="مثلاً «اخبار» یا «آشپزی»">
                    <input value={p.category ?? ""} maxLength={40} onChange={(e) => update(p.id, { category: e.target.value || undefined })} />
                  </Field>
                  <Field label="نویسنده">
                    <input value={p.author ?? ""} maxLength={60} onChange={(e) => update(p.id, { author: e.target.value || undefined })} />
                  </Field>
                </div>
                <Field label="خلاصه" hint="در فهرست نوشته‌ها نمایش داده می‌شود؛ اگر خالی بماند، ابتدای متن می‌آید.">
                  <textarea rows={2} maxLength={400} value={p.excerpt ?? ""} onChange={(e) => update(p.id, { excerpt: e.target.value || undefined })} />
                </Field>
                <Field label="متن نوشته" hint="برای پاراگراف تازه یک خط خالی بگذارید.">
                  <textarea rows={10} maxLength={20000} value={p.text} onChange={(e) => update(p.id, { text: e.target.value })} />
                </Field>
                <small className="muted">{showNumber(p.text.length)} حرف</small>
                <div className="row gap wrap">
                  <ImagePicker value={p.image} label="افزودن عکس" onChange={(url) => update(p.id, { image: url })} />
                  {p.image && (
                    <button type="button" className="btn ghost small" onClick={() => update(p.id, { image: undefined })}>
                      حذف عکس
                    </button>
                  )}
                  <label className="shm-inline">
                    <input type="checkbox" checked={!p.hidden} onChange={(e) => update(p.id, { hidden: e.target.checked ? undefined : true })} />
                    نمایش در سایت
                  </label>
                  <button type="button" className="btn ghost small danger" onClick={() => window.confirm(`نوشته‌ی «${p.title}» حذف شود؟`) && save(posts.filter((x) => x.id !== p.id))}>
                    حذف نوشته
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function moved<T>(list: T[], k: number, by: -1 | 1): T[] {
  const next = [...list];
  const j = k + by;
  if (j < 0 || j >= next.length) return next;
  [next[k], next[j]] = [next[j]!, next[k]!];
  return next;
}
