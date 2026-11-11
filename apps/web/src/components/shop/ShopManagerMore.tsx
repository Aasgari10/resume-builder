// More tabs of the shop manager: discount codes, ad banners and the products trash. All of them are
// part of the site content, so they save with the editor's autosave.

import { useState } from "react";
import { formatToman, type Product, type Shop } from "@rb/schema";
import { newId } from "../editor/list";
import { Field, ImagePicker, MoneyInput, readNumber, showNumber } from "./fields";
import { DateTimeInput } from "./ProductExtras";

type ShopProps = { shop: Shop; setShop: (s: Partial<Shop>) => void };

const faDate = (iso: string, time = false) => new Date(iso).toLocaleString("fa-IR", time ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });

/* ───────────── Discount codes ───────────── */

type Coupon = NonNullable<Shop["coupons"]>[number];

export function Coupons({ shop, setShop }: ShopProps) {
  const coupons = shop.coupons ?? [];
  const [open, setOpen] = useState<string | null>(null);
  const save = (next: Coupon[]) => setShop({ coupons: next.length ? next : undefined });
  const update = (id: string, patch: Partial<Coupon>) => save(coupons.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const add = () => {
    const id = newId();
    const code = `OFF${Math.floor(Math.random() * 900 + 100)}`;
    save([{ id, code, percent: 10, active: true }, ...coupons]);
    setOpen(id);
  };
  const state = (c: Coupon) => {
    if (c.active === false) return ["gray", "غیرفعال"];
    if (c.startsAt && Date.parse(c.startsAt) > Date.now()) return ["gray", "هنوز شروع نشده"];
    if (c.endsAt && Date.parse(c.endsAt) <= Date.now()) return ["gray", "تمام‌شده"];
    if (c.usageLimit !== undefined && (c.used ?? 0) >= c.usageLimit) return ["gray", "سقف استفاده پر شد"];
    return ["green", "فعال"];
  };
  return (
    <div className="shm-cats">
      <div className="shm-toolbar">
        <p className="muted">مشتری کد را در سبد خرید وارد می‌کند. هر کد یا درصدی است یا مبلغ ثابت. تعداد استفاده با هر سفارش خودکار شمرده می‌شود.</p>
        {coupons.length < 50 && (
          <button type="button" className="btn small" onClick={add}>
            + کد تخفیف جدید
          </button>
        )}
      </div>
      {coupons.length === 0 && <p className="muted shm-hint">هنوز کد تخفیفی نساخته‌اید.</p>}
      <ul className="shm-order-list">
        {coupons.map((c) => {
          const [tone, label] = state(c);
          return (
            <li key={c.id}>
              <button type="button" className="shm-order" aria-expanded={open === c.id} onClick={() => setOpen(open === c.id ? null : c.id)}>
                <b dir="ltr">{c.code}</b>
                <span>{c.percent ? `${showNumber(c.percent)}٪` : c.amount ? formatToman(c.amount) : "—"}</span>
                <span>
                  {showNumber(c.used ?? 0)}
                  {c.usageLimit ? ` از ${showNumber(c.usageLimit)}` : ""} بار استفاده
                </span>
                <span>{c.endsAt ? `تا ${faDate(c.endsAt)}` : "بدون تاریخ پایان"}</span>
                <i className={`shm-status ${tone}`}>{label}</i>
              </button>
              {open === c.id && <CouponForm shop={shop} c={c} onChange={(patch) => update(c.id, patch)} onRemove={() => window.confirm(`کد «${c.code}» حذف شود؟`) && save(coupons.filter((x) => x.id !== c.id))} taken={coupons.filter((x) => x.id !== c.id).map((x) => x.code.toUpperCase())} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CouponForm({ shop, c, onChange, onRemove, taken }: { shop: Shop; c: Coupon; onChange: (patch: Partial<Coupon>) => void; onRemove: () => void; taken: string[] }) {
  const [code, setCode] = useState(c.code);
  const kind = c.amount !== undefined && !c.percent ? "amount" : "percent";
  const clash = taken.includes(code.trim().toUpperCase());
  return (
    <div className="shm-order-more shm-form">
      <div className="shm-grid">
        <Field label="کد" hint={clash ? "این کد را قبلاً ساخته‌اید." : "حروف انگلیسی و عدد، بدون فاصله"}>
          <input
            dir="ltr"
            value={code}
            maxLength={30}
            onChange={(e) => setCode(e.target.value.replace(/\s+/g, "").toUpperCase())}
            onBlur={() => (code.trim().length >= 2 && !clash ? onChange({ code: code.trim() }) : setCode(c.code))}
          />
        </Field>
        <Field label="نوع تخفیف">
          <select value={kind} onChange={(e) => onChange(e.target.value === "amount" ? { percent: undefined, maxDiscount: undefined, amount: c.amount ?? 100000 } : { amount: undefined, percent: c.percent ?? 10 })}>
            <option value="percent">درصدی</option>
            <option value="amount">مبلغ ثابت</option>
          </select>
        </Field>
        {kind === "percent" ? (
          <>
            <Field label="درصد">
              <input
                inputMode="numeric"
                key={c.percent}
                defaultValue={showNumber(c.percent)}
                onBlur={(e) => onChange({ percent: Math.max(1, Math.min(100, readNumber(e.target.value) ?? 10)) })}
              />
            </Field>
            <Field label="سقف مبلغ تخفیف" hint="خالی: بدون سقف">
              <MoneyInput value={c.maxDiscount} onChange={(n) => onChange({ maxDiscount: n || undefined })} />
            </Field>
          </>
        ) : (
          <Field label="مبلغ تخفیف">
            <MoneyInput value={c.amount} onChange={(n) => onChange({ amount: n || 1000 })} />
          </Field>
        )}
        <Field label="حداقل مبلغ سبد" hint="خالی: برای هر خریدی">
          <MoneyInput value={c.minTotal} onChange={(n) => onChange({ minTotal: n || undefined })} />
        </Field>
        <Field label="تعداد دفعات مجاز" hint="خالی: نامحدود">
          <input
            inputMode="numeric"
            key={c.usageLimit ?? ""}
            defaultValue={showNumber(c.usageLimit)}
            onBlur={(e) => {
              const n = readNumber(e.target.value);
              onChange({ usageLimit: n ? Math.min(n, 100000) : undefined });
            }}
          />
        </Field>
        <Field label="تاریخ شروع" hint="خالی: از همین حالا">
          <DateTimeInput value={c.startsAt} onChange={(startsAt) => onChange({ startsAt })} />
        </Field>
        <Field label="تاریخ پایان">
          <DateTimeInput value={c.endsAt} onChange={(endsAt) => onChange({ endsAt })} />
        </Field>
      </div>
      <CouponScope shop={shop} c={c} onChange={onChange} />
      <div className="row gap wrap">
        <label className="shm-inline">
          <input type="checkbox" checked={c.active !== false} onChange={(e) => onChange({ active: e.target.checked })} />
          فعال
        </label>
        {(c.used ?? 0) > 0 && (
          <button type="button" className="btn ghost small" onClick={() => onChange({ used: 0 })}>
            صفر کردن شمارش استفاده
          </button>
        )}
        <button type="button" className="btn ghost small danger" onClick={onRemove}>
          حذف کد
        </button>
      </div>
    </div>
  );
}

/** Which products a code covers: the whole cart, some categories or some products. */
function CouponScope({ shop, c, onChange }: { shop: Shop; c: Coupon; onChange: (patch: Partial<Coupon>) => void }) {
  const [query, setQuery] = useState("");
  const scope = c.productIds?.length ? "products" : c.categoryIds?.length ? "categories" : c.productIds || c.categoryIds ? (c.productIds ? "products" : "categories") : "all";
  const toggle = (list: string[] | undefined, id: string) => {
    const next = list?.includes(id) ? list.filter((x) => x !== id) : [...(list ?? []), id];
    return next;
  };
  const live = shop.products.filter((p) => !p.trashed && (!query.trim() || p.name.includes(query.trim())));
  return (
    <div className="shm-scope">
      <Field label="این کد برای">
        <select
          value={scope}
          onChange={(e) => onChange(e.target.value === "products" ? { productIds: [], categoryIds: undefined } : e.target.value === "categories" ? { categoryIds: [], productIds: undefined } : { productIds: undefined, categoryIds: undefined })}
        >
          <option value="all">همه‌ی محصولات</option>
          <option value="categories">فقط بعضی دسته‌ها</option>
          <option value="products">فقط بعضی محصولات</option>
        </select>
      </Field>
      {scope === "categories" && (
        <div className="shm-picklist">
          {shop.categories.map((cat) => (
            <label key={cat.id} className="shm-inline">
              <input type="checkbox" checked={Boolean(c.categoryIds?.includes(cat.id))} onChange={() => onChange({ categoryIds: toggle(c.categoryIds, cat.id) })} />
              {cat.name}
            </label>
          ))}
        </div>
      )}
      {scope === "products" && (
        <>
          <input className="shm-scope-search" placeholder="جست‌وجوی محصول…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="shm-picklist">
            {live.map((p) => (
              <label key={p.id} className="shm-inline">
                <input type="checkbox" checked={Boolean(c.productIds?.includes(p.id))} onChange={() => onChange({ productIds: toggle(c.productIds, p.id) })} />
                {p.name}
              </label>
            ))}
          </div>
        </>
      )}
      {scope !== "all" && <small className="muted">{scope === "products" ? `${showNumber(c.productIds?.length ?? 0)} محصول انتخاب شده` : `${showNumber(c.categoryIds?.length ?? 0)} دسته انتخاب شده`}؛ تخفیف فقط روی همین کالاهای سبد حساب می‌شود.</small>}
    </div>
  );
}

/* ───────────── Ad banners and the showcase category ───────────── */

type Banner = NonNullable<Shop["banners"]>[number];

export function AdBanners({ shop, setShop }: ShopProps) {
  const banners = shop.banners ?? [];
  const save = (next: Banner[]) => setShop({ banners: next.length ? next : undefined });
  const update = (id: string, patch: Partial<Banner>) => save(banners.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  return (
    <div className="shm-spots">
      <p className="muted">عکس‌های تبلیغاتی بین بخش‌های صفحه‌ی اول. بنر «پهن» یک ردیف کامل است؛ بقیه دوتا دوتا کنار هم می‌نشینند.</p>
      {banners.map((b, k) => (
        <div key={b.id} className="shm-slide">
          <span className="shm-thumb wide">{b.image ? <img src={b.image} alt="" /> : "🖼"}</span>
          <div className="shm-slide-fields">
            <input value={b.title ?? ""} maxLength={80} placeholder="عنوان بنر (در بعضی قالب‌ها روی عکس نوشته می‌شود؛ اختیاری)" aria-label="عنوان بنر" onChange={(e) => update(b.id, { title: e.target.value || undefined })} />
            <div className="row gap wrap">
              <input value={b.kicker ?? ""} maxLength={40} placeholder="خط کوچک روی بنر (اختیاری)" aria-label="خط کوچک روی بنر" onChange={(e) => update(b.id, { kicker: e.target.value || undefined })} />
              <input value={b.text ?? ""} maxLength={160} placeholder="متن زیر عنوان (اختیاری)" aria-label="متن روی بنر" onChange={(e) => update(b.id, { text: e.target.value || undefined })} />
            </div>
            <input dir="ltr" value={b.link ?? ""} maxLength={500} placeholder="https://… (لینک بنر، اختیاری)" aria-label="لینک بنر" onChange={(e) => update(b.id, { link: e.target.value || undefined })} />
            <div className="row gap wrap">
              <ImagePicker value={b.image} onChange={(url) => update(b.id, { image: url })} />
              <label className="shm-inline">
                <input type="checkbox" checked={Boolean(b.wide)} onChange={(e) => update(b.id, { wide: e.target.checked || undefined })} />
                پهن
              </label>
              <label className="shm-inline">
                <input type="checkbox" checked={!b.hidden} onChange={(e) => update(b.id, { hidden: e.target.checked ? undefined : true })} />
                فعال
              </label>
              <button
                type="button"
                className="btn ghost small"
                disabled={k === 0}
                aria-label="جلوتر"
                onClick={() => {
                  const next = [...banners];
                  [next[k - 1], next[k]] = [next[k]!, next[k - 1]!];
                  save(next);
                }}
              >
                ↑
              </button>
              <button type="button" className="btn ghost small danger" onClick={() => window.confirm("این بنر حذف شود؟") && save(banners.filter((x) => x.id !== b.id))}>
                حذف
              </button>
            </div>
          </div>
        </div>
      ))}
      {banners.length < 12 && (
        <button type="button" className="btn small" onClick={() => save([...banners, { id: newId(), image: "", wide: banners.length === 0 || undefined }])}>
          + بنر جدید
        </button>
      )}
      <Field label="دسته‌ی بخش «ویترین» صفحه‌ی اول">
        <select value={shop.showcaseCategoryId ?? ""} onChange={(e) => setShop({ showcaseCategoryId: e.target.value || undefined })}>
          <option value="">بخش ویترین نمایش داده نشود</option>
          {shop.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

/* ───────────── Trash ───────────── */

export function Trash({ shop, setShop }: ShopProps) {
  const trashed = shop.products.filter((p) => p.trashed);
  const restore = (p: Product) => setShop({ products: shop.products.map((x) => (x.id === p.id ? { ...x, trashed: undefined } : x)) });
  const purge = (ids: string[]) => setShop({ products: shop.products.filter((x) => !ids.includes(x.id)), lookSpots: shop.lookSpots?.filter((s) => !ids.includes(s.productId)) });
  return (
    <div className="shm-cats">
      <div className="shm-toolbar">
        <p className="muted">محصولات حذف‌شده این‌جا می‌مانند تا برگردانید یا برای همیشه پاکشان کنید. در سایت نمایش داده نمی‌شوند.</p>
        {trashed.length > 0 && (
          <button type="button" className="btn ghost small danger" onClick={() => window.confirm(`همه‌ی ${showNumber(trashed.length)} محصول سطل زباله برای همیشه پاک شوند؟`) && purge(trashed.map((p) => p.id))}>
            خالی کردن سطل زباله
          </button>
        )}
      </div>
      {trashed.length === 0 && <p className="muted shm-hint">سطل زباله خالی است.</p>}
      {trashed.map((p) => (
        <div key={p.id} className="shm-cat">
          <span className="shm-thumb">{p.images[0] ? <img src={p.images[0]} alt="" /> : "🖼"}</span>
          <b>{p.name}</b>
          <small className="muted">{formatToman(p.price)}</small>
          <button type="button" className="btn small" onClick={() => restore(p)}>
            برگرداندن
          </button>
          <button type="button" className="btn ghost small danger" onClick={() => window.confirm(`«${p.name}» برای همیشه پاک شود؟`) && purge([p.id])}>
            پاک کردن همیشگی
          </button>
        </div>
      ))}
    </div>
  );
}
