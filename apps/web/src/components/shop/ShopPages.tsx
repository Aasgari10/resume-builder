// Shop manager tabs for the site's own texts: customer quotes on the home page, and the contact,
// questions and text pages (about us, terms…). All of it is site content and saves with the editor.

import { useState } from "react";
import type { ResumeData, Shop } from "@rb/schema";
import { newId } from "../editor/list";
import { Field, ImagePicker, showNumber } from "./fields";

type Site = NonNullable<ResumeData["site"]>;
type Quote = NonNullable<Site["testimonials"]>[number];
type Props = { data: ResumeData; onData: (d: ResumeData) => void };

const setSiteOf = (data: ResumeData, onData: Props["onData"]) => (patch: Partial<Site>) => onData({ ...data, site: { gallery: [], ...data.site, ...patch } });

/** Moves item k of a list one place up (-1) or down (+1). */
function moved<T>(list: T[], k: number, by: -1 | 1): T[] {
  const next = [...list];
  const j = k + by;
  if (j < 0 || j >= next.length) return next;
  [next[k], next[j]] = [next[j]!, next[k]!];
  return next;
}

function OrderButtons({ k, count, onMove }: { k: number; count: number; onMove: (by: -1 | 1) => void }) {
  return (
    <>
      <button type="button" className="btn ghost small" disabled={k === 0} aria-label="بالاتر" onClick={() => onMove(-1)}>
        ↑
      </button>
      <button type="button" className="btn ghost small" disabled={k === count - 1} aria-label="پایین‌تر" onClick={() => onMove(1)}>
        ↓
      </button>
    </>
  );
}

/* ───────────── Customer quotes on the home page ───────────── */

export function Quotes({ data, onData }: Props) {
  const setSite = setSiteOf(data, onData);
  const list = data.site?.testimonials ?? [];
  const save = (next: Quote[]) => setSite({ testimonials: next.length ? next : undefined });
  const update = (id: string, patch: Partial<Quote>) => save(list.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  return (
    <div className="shm-cats">
      <div className="shm-toolbar">
        <p className="muted">نظرهایی که در اسلایدر «نظرات مشتریان» صفحه‌ی اول نمایش داده می‌شوند. (نظرهای مشتری‌ها روی هر محصول در بخش «نظرات» است.)</p>
        {list.length < 20 && (
          <button type="button" className="btn small" onClick={() => save([{ id: newId(), name: "نام مشتری", text: "متن نظر", rating: 5 }, ...list])}>
            + نظر جدید
          </button>
        )}
      </div>
      {list.length === 0 && <p className="muted shm-hint">نظری اضافه نشده است؛ تا وقتی خالی باشد، این بخش در سایت نمایش داده نمی‌شود.</p>}
      {list.map((q, k) => (
        <div key={q.id} className={`shm-slide${q.hidden ? " off" : ""}`}>
          <span className="shm-avatar">{q.image ? <img src={q.image} alt="" /> : q.name.charAt(0)}</span>
          <div className="shm-slide-fields">
            <div className="shm-grid">
              <Field label="نام">
                <input value={q.name} maxLength={80} onChange={(e) => update(q.id, { name: e.target.value })} />
              </Field>
              <Field label="محصول یا توضیح" hint="مثلاً «خرید: لپ‌تاپ ایسوس»">
                <input value={q.role ?? ""} maxLength={100} onChange={(e) => update(q.id, { role: e.target.value || undefined })} />
              </Field>
              <Field label="امتیاز">
                <select value={q.rating ?? 5} onChange={(e) => update(q.id, { rating: Number(e.target.value) })}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {"★".repeat(n)} ({showNumber(n)})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="متن نظر">
              <textarea rows={2} maxLength={600} value={q.text} onChange={(e) => update(q.id, { text: e.target.value })} />
            </Field>
            <div className="row gap wrap">
              <ImagePicker value={q.image} label={q.image ? "عوض کردن عکس" : "افزودن عکس"} onChange={(url) => update(q.id, { image: url })} />
              <label className="shm-inline">
                <input type="checkbox" checked={!q.hidden} onChange={(e) => update(q.id, { hidden: e.target.checked ? undefined : true })} />
                نمایش در سایت
              </label>
              <OrderButtons k={k} count={list.length} onMove={(by) => save(moved(list, k, by))} />
              <button type="button" className="btn ghost small danger" onClick={() => window.confirm(`نظر «${q.name}» حذف شود؟`) && save(list.filter((x) => x.id !== q.id))}>
                حذف
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────── Contact, questions and text pages ───────────── */

type Faq = NonNullable<Shop["faq"]>[number];
type Page = NonNullable<Shop["pages"]>[number];

/** A web-address part from a title: latin letters, digits and dashes. */
const slugify = (text: string, taken: string[]) => {
  let base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  if (!base) base = "page";
  let slug = base;
  for (let n = 2; taken.includes(slug); n++) slug = `${base}-${n}`;
  return slug;
};

export function Pages({ data, onData, shop, setShop, faqCategories, textPages = true }: Props & { shop: Shop; setShop: (s: Partial<Shop>) => void; faqCategories?: boolean; textPages?: boolean }) {
  const setSite = setSiteOf(data, onData);
  const site = data.site;
  const b = data.basics;
  const faq = shop.faq ?? [];
  const pages = shop.pages ?? [];
  const saveFaq = (next: Faq[]) => setShop({ faq: next.length ? next : undefined });
  const savePages = (next: Page[]) => setShop({ pages: next.length ? next : undefined });
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="shm-cats">
      <h3>📞 صفحه‌ی «تماس با ما»</h3>
      <div className="shm-grid">
        <Field label="تلفن">
          <input dir="ltr" value={b.phone ?? ""} maxLength={20} onChange={(e) => onData({ ...data, basics: { ...b, phone: e.target.value || undefined } })} />
        </Field>
        <Field label="ایمیل">
          <input dir="ltr" type="email" value={b.email ?? ""} maxLength={120} onChange={(e) => onData({ ...data, basics: { ...b, email: e.target.value || undefined } })} />
        </Field>
        <Field label="ساعت کاری">
          <input value={site?.contactNote ?? ""} maxLength={500} placeholder="مثلاً شنبه تا پنجشنبه ۹ تا ۲۰" onChange={(e) => setSite({ contactNote: e.target.value || undefined })} />
        </Field>
        <Field label="نشانی" wide>
          <input value={site?.address ?? ""} maxLength={200} onChange={(e) => setSite({ address: e.target.value || undefined })} />
        </Field>
        <Field label="لینک نقشه برای مسیریابی" hint="لینک مکان فروشگاه در گوگل‌مپ، نشان یا بلد" wide>
          <input dir="ltr" value={site?.mapUrl ?? ""} maxLength={500} placeholder="https://…" onChange={(e) => setSite({ mapUrl: e.target.value || undefined })} />
        </Field>
        <Field label="متن بالای صفحه" wide>
          <textarea rows={2} maxLength={1000} value={site?.contactText ?? ""} onChange={(e) => setSite({ contactText: e.target.value || undefined })} />
        </Field>
      </div>

      <h3>❓ سؤالات متداول</h3>
      <Field label="عنوان صفحه">
        <input value={shop.faqTitle ?? ""} maxLength={120} placeholder="سؤالات متداول" onChange={(e) => setShop({ faqTitle: e.target.value || undefined })} />
      </Field>
      {faq.length === 0 && <p className="muted">تا وقتی سؤالی ننویسید، این صفحه در سایت ساخته نمی‌شود.</p>}
      {faq.map((x, k) => (
        <div key={x.id} className="shm-faq">
          <input value={x.q} maxLength={200} placeholder="سؤال" aria-label="سؤال" onChange={(e) => saveFaq(faq.map((f) => (f.id === x.id ? { ...f, q: e.target.value } : f)))} />
          <textarea rows={2} maxLength={1500} value={x.a} placeholder="پاسخ" aria-label="پاسخ" onChange={(e) => saveFaq(faq.map((f) => (f.id === x.id ? { ...f, a: e.target.value } : f)))} />
          {faqCategories && (
            <input
              value={x.category ?? ""}
              maxLength={40}
              list="shm-faq-cats"
              placeholder="دسته (مثلاً امکانات استودیو)"
              aria-label="دسته"
              onChange={(e) => saveFaq(faq.map((f) => (f.id === x.id ? { ...f, category: e.target.value || undefined } : f)))}
            />
          )}
          <div className="row gap">
            <OrderButtons k={k} count={faq.length} onMove={(by) => saveFaq(moved(faq, k, by))} />
            <button type="button" className="btn ghost small danger" onClick={() => saveFaq(faq.filter((f) => f.id !== x.id))}>
              حذف
            </button>
          </div>
        </div>
      ))}
      {faqCategories && (
        <datalist id="shm-faq-cats">
          {[...new Set(faq.map((f) => f.category).filter(Boolean))].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      )}
      {faq.length < 30 && (
        <button type="button" className="btn small" onClick={() => saveFaq([...faq, { id: newId(), q: "", a: "" }])}>
          + سؤال جدید
        </button>
      )}

      {textPages && (
        <>
      <h3>📄 صفحه‌های متنی</h3>
      <p className="muted">مثل «درباره‌ی ما»، «قوانین و مقررات» یا «حریم خصوصی». لینکشان در پایین سایت می‌آید.</p>
      {pages.map((p, k) => (
        <div key={p.id} className={`shm-page${p.hidden ? " off" : ""}`}>
          <div className="shm-page-head">
            <button type="button" className="shm-page-title" aria-expanded={open === p.id} onClick={() => setOpen(open === p.id ? null : p.id)}>
              <b>{p.title || "بدون عنوان"}</b>
              <small className="muted" dir="ltr">
                /page/{p.slug}
              </small>
            </button>
            <OrderButtons k={k} count={pages.length} onMove={(by) => savePages(moved(pages, k, by))} />
          </div>
          {open === p.id && (
            <div className="shm-slide-fields">
              <div className="shm-grid">
                <Field label="عنوان">
                  <input value={p.title} maxLength={80} onChange={(e) => savePages(pages.map((x) => (x.id === p.id ? { ...x, title: e.target.value } : x)))} />
                </Field>
                <Field label="نشانی صفحه" hint="حروف کوچک انگلیسی، عدد و خط تیره">
                  <input
                    dir="ltr"
                    value={p.slug}
                    maxLength={30}
                    onChange={(e) => {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      if (slug && !pages.some((x) => x.id !== p.id && x.slug === slug)) savePages(pages.map((x) => (x.id === p.id ? { ...x, slug } : x)));
                    }}
                  />
                </Field>
              </div>
              <Field label="متن" hint="برای پاراگراف تازه یک خط خالی بگذارید.">
                <textarea rows={8} maxLength={8000} value={p.text} onChange={(e) => savePages(pages.map((x) => (x.id === p.id ? { ...x, text: e.target.value } : x)))} />
              </Field>
              <div className="row gap wrap">
                <label className="shm-inline">
                  <input type="checkbox" checked={!p.hidden} onChange={(e) => savePages(pages.map((x) => (x.id === p.id ? { ...x, hidden: e.target.checked ? undefined : true } : x)))} />
                  نمایش در سایت
                </label>
                <button type="button" className="btn ghost small danger" onClick={() => window.confirm(`صفحه‌ی «${p.title}» حذف شود؟`) && savePages(pages.filter((x) => x.id !== p.id))}>
                  حذف صفحه
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {pages.length < 8 && (
        <div className="row gap wrap">
          {[
            ["درباره‌ی ما", "about"],
            ["قوانین و مقررات", "terms"],
            ["حریم خصوصی", "privacy"],
            ["شرایط ارسال و مرجوعی", "shipping"],
          ]
            .filter(([, slug]) => !pages.some((p) => p.slug === slug))
            .map(([title, slug]) => (
              <button key={slug} type="button" className="btn ghost small" onClick={() => savePages([...pages, { id: newId(), slug: slug!, title: title!, text: "" }])}>
                + {title}
              </button>
            ))}
          <button
            type="button"
            className="btn small"
            onClick={() => {
              const id = newId();
              savePages([...pages, { id, slug: slugify("page", pages.map((p) => p.slug)), title: "صفحه‌ی جدید", text: "" }]);
              setOpen(id);
            }}
          >
            + صفحه‌ی دلخواه
          </button>
        </div>
      )}
        </>
      )}
    </div>
  );
}
