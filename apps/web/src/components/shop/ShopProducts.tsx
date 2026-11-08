// The products tab: a filterable list with actions on many products at once, and the product form.
// Products are part of the site content, so every change saves with the editor's autosave.

import { useEffect, useState } from "react";
import { allVariantKeys, formatToman, unitPrice, type Product, type Shop } from "@rb/schema";
import { type ShopProductStat } from "../../api";
import { useShopApi } from "./shopApi";
import { newId } from "../editor/list";
import { Field, ImagePicker, MoneyInput, readNumber, showNumber } from "./fields";
import { DateTimeInput, OptionsEditor, SaleEndField, SpecsEditor } from "./ProductExtras";
import { Pager, SelectAll, useSelection } from "./ShopOrders";

type Props = { shop: Shop; setShop: (s: Partial<Shop>) => void; onSample?: () => void; focus?: string; resumeId?: string };

type Sort = "new" | "best" | "cheap" | "dear" | "stock" | "rating" | "name";
type StockFilter = "" | "out" | "low" | "in";
type Filters = { q: string; cat: string; min?: number; max?: number; sale: boolean; stock: StockFilter; stars: number; hidden: boolean };
const NO_FILTERS: Filters = { q: "", cat: "", sale: false, stock: "", stars: 0, hidden: false };
const LOW = 5;
const PAGE = 30;

/** Units left: the sum over combinations when they have their own stock; undefined = not tracked. */
export function stockOf(p: Product): number | undefined {
  const keys = allVariantKeys(p);
  if (keys.length && p.variants?.some((v) => v.stock !== undefined)) {
    return keys.reduce((n, k) => n + (p.variants?.find((v) => v.key === k)?.stock ?? p.stock ?? 0), 0);
  }
  return p.stock;
}
const onSale = (p: Product) => unitPrice(p) < p.price;
/** Rounds a price to whole thousands of tomans. */
const roundPrice = (n: number) => Math.max(0, Math.round(n / 1000) * 1000);

export function Products({ shop, setShop, onSample, focus, resumeId }: Props) {
  const api = useShopApi();
  const [editing, setEditing] = useState<string | null>(focus ?? null);
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const [more, setMore] = useState(false);
  const [sort, setSort] = useState<Sort>("new");
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState<Record<string, ShopProductStat>>({});
  const sel = useSelection();
  useEffect(() => {
    if (resumeId) api.shopProductStats(resumeId).then((r) => setStats(r.stats), () => undefined);
  }, [resumeId]);

  const cats = new Map(shop.categories.map((c) => [c.id, c.name]));
  const update = (id: string, patch: Partial<Product>) => setShop({ products: shop.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const updateMany = (ids: Set<string>, change: (p: Product) => Partial<Product>) => setShop({ products: shop.products.map((p) => (ids.has(p.id) ? { ...p, ...change(p) } : p)) });
  const add = () => {
    const id = newId();
    setShop({ products: [{ id, name: "محصول جدید", price: 0, images: [], categoryId: f.cat && f.cat !== "-" ? f.cat : shop.categories[0]?.id }, ...shop.products] });
    setEditing(id);
  };
  const live = shop.products.filter((p) => !p.trashed);
  const current = live.find((p) => p.id === editing);

  if (live.length === 0)
    return (
      <div className="shm-empty">
        <h3>هنوز محصولی اضافه نکرده‌اید</h3>
        <p className="muted">تا وقتی محصولی نباشد، پیش‌نمایش محصولات نمونه را نشان می‌دهد. سایت منتشرشده فقط محصولات خودتان را دارد.</p>
        <div className="row gap">
          <button type="button" className="btn" onClick={add}>
            + افزودن اولین محصول
          </button>
          {onSample && (
            <button type="button" className="btn ghost" onClick={onSample}>
              شروع با محصولات نمونه (بعداً عوضشان کنید)
            </button>
          )}
        </div>
      </div>
    );

  if (current) {
    const index = live.indexOf(current);
    return (
      <div className="shm-edit shm-edit-page">
        <div className="shm-toolbar">
          <button type="button" className="btn ghost small" onClick={() => setEditing(null)}>
            → همه‌ی محصولات
          </button>
          <div className="row gap">
            <button type="button" className="btn ghost small" disabled={index <= 0} onClick={() => setEditing(live[index - 1]!.id)}>
              محصول قبلی
            </button>
            <button type="button" className="btn ghost small" disabled={index >= live.length - 1} onClick={() => setEditing(live[index + 1]!.id)}>
              محصول بعدی
            </button>
          </div>
        </div>
        <ProductForm
          key={current.id}
          p={current}
          categories={shop.categories}
          stat={stats[current.id]}
          onChange={(patch) => update(current.id, patch)}
          onCopy={() => {
            const id = newId();
            setShop({ products: [{ ...structuredClone(current), id, name: `${current.name} (کپی)`, hidden: true }, ...shop.products] });
            setEditing(id);
          }}
          onRemove={() => {
            if (!window.confirm(`«${current.name}» به سطل زباله برود؟ (از بخش «سطل زباله» برمی‌گردد)`)) return;
            update(current.id, { trashed: true });
            setEditing(null);
          }}
        />
      </div>
    );
  }

  /* Filtering and sorting */
  const q = f.q.trim();
  const list = live.filter((p) => {
    const price = unitPrice(p);
    const left = stockOf(p);
    const rating = stats[p.id]?.rating ?? 0;
    return (
      (!q || p.name.includes(q) || p.id === q || (p.description ?? "").includes(q)) &&
      (!f.cat || (f.cat === "-" ? !p.categoryId || !cats.has(p.categoryId) : p.categoryId === f.cat)) &&
      (f.min === undefined || price >= f.min) &&
      (f.max === undefined || price <= f.max) &&
      (!f.sale || onSale(p)) &&
      (!f.stock || (f.stock === "out" ? left === 0 : f.stock === "low" ? left !== undefined && left > 0 && left <= LOW : left !== 0)) &&
      (!f.stars || rating >= f.stars) &&
      (!f.hidden || p.hidden)
    );
  });
  const order = new Map(live.map((p, i) => [p.id, i]));
  const by: Record<Sort, (a: Product, b: Product) => number> = {
    new: (a, b) => order.get(a.id)! - order.get(b.id)!,
    best: (a, b) => (stats[b.id]?.sold ?? 0) - (stats[a.id]?.sold ?? 0),
    cheap: (a, b) => unitPrice(a) - unitPrice(b),
    dear: (a, b) => unitPrice(b) - unitPrice(a),
    stock: (a, b) => (stockOf(a) ?? Infinity) - (stockOf(b) ?? Infinity),
    rating: (a, b) => (stats[b.id]?.rating ?? 0) - (stats[a.id]?.rating ?? 0),
    name: (a, b) => a.name.localeCompare(b.name, "fa"),
  };
  list.sort(by[sort]);
  const pages = Math.ceil(list.length / PAGE);
  const shown = list.slice(page * PAGE, (page + 1) * PAGE);
  const set = (patch: Partial<Filters>) => {
    setF((x) => ({ ...x, ...patch }));
    setPage(0);
  };
  const filtered = JSON.stringify(f) !== JSON.stringify(NO_FILTERS);

  return (
    <div className="shm-products">
      <div className="shm-toolbar">
        <input placeholder="جست‌وجوی نام یا توضیحات…" value={f.q} onChange={(e) => set({ q: e.target.value })} />
        <select value={f.cat} aria-label="دسته" onChange={(e) => set({ cat: e.target.value })}>
          <option value="">همه‌ی دسته‌ها</option>
          {shop.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="-">بدون دسته</option>
        </select>
        <select value={sort} aria-label="مرتب‌سازی" onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="new">جدیدترین</option>
          <option value="best">پرفروش‌ترین</option>
          <option value="cheap">ارزان‌ترین</option>
          <option value="dear">گران‌ترین</option>
          <option value="stock">کمترین موجودی</option>
          <option value="rating">بیشترین امتیاز</option>
          <option value="name">نام (الفبا)</option>
        </select>
        <button type="button" className="btn ghost small" aria-expanded={more} onClick={() => setMore(!more)}>
          فیلترهای بیشتر{filtered ? " •" : ""}
        </button>
        <button type="button" className="btn small" onClick={add}>
          + محصول جدید
        </button>
      </div>
      {more && (
        <div className="shm-filters">
          <Field label="قیمت از">
            <MoneyInput value={f.min} placeholder="۰" onChange={(n) => set({ min: n || undefined })} />
          </Field>
          <Field label="قیمت تا">
            <MoneyInput value={f.max} placeholder="نامحدود" onChange={(n) => set({ max: n || undefined })} />
          </Field>
          <Field label="موجودی">
            <select value={f.stock} onChange={(e) => set({ stock: e.target.value as StockFilter })}>
              <option value="">همه</option>
              <option value="in">موجود</option>
              <option value="low">رو به اتمام ({showNumber(LOW)} یا کمتر)</option>
              <option value="out">ناموجود</option>
            </select>
          </Field>
          <Field label="امتیاز مشتری‌ها">
            <select value={f.stars} onChange={(e) => set({ stars: Number(e.target.value) })}>
              <option value={0}>همه</option>
              {[4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {showNumber(n)} ستاره و بیشتر
                </option>
              ))}
            </select>
          </Field>
          <label className="shm-inline">
            <input type="checkbox" checked={f.sale} onChange={(e) => set({ sale: e.target.checked })} />
            🔥 فقط حراجی‌ها
          </label>
          <label className="shm-inline">
            <input type="checkbox" checked={f.hidden} onChange={(e) => set({ hidden: e.target.checked })} />
            فقط پنهان‌ها
          </label>
          {filtered && (
            <button type="button" className="btn ghost small" onClick={() => set(NO_FILTERS)}>
              حذف فیلترها
            </button>
          )}
        </div>
      )}
      <div className="shm-batch">
        <SelectAll ids={list.map((p) => p.id)} sel={sel} />
        <span className="muted">
          {showNumber(list.length)} از {showNumber(live.length)} محصول
        </span>
      </div>
      {sel.picked.size > 0 && <BatchBar shop={shop} picked={sel.picked} updateMany={updateMany} onDone={sel.clear} />}
      {list.length === 0 ? (
        <p className="muted shm-hint">محصولی با این مشخصات نیست.</p>
      ) : (
        <ul className="shm-prows">
          {shown.map((p) => {
            const left = stockOf(p);
            const st = stats[p.id];
            return (
              <li key={p.id} className={p.hidden ? "off" : ""}>
                <input type="checkbox" aria-label={`انتخاب ${p.name}`} checked={sel.has(p.id)} onChange={() => sel.toggle(p.id)} />
                <button type="button" className="shm-prow" onClick={() => setEditing(p.id)}>
                  <span className="shm-thumb">{p.images[0] ? <img src={p.images[0]} alt="" /> : "🖼"}</span>
                  <span className="shm-prow-name">
                    <b>{p.name || "بدون نام"}</b>
                    <small className="muted">{cats.get(p.categoryId ?? "") ?? "بدون دسته"}</small>
                  </span>
                  <span className="shm-prow-price">
                    {onSale(p) && <s className="muted">{formatToman(p.price)}</s>}
                    <b>{formatToman(unitPrice(p))}</b>
                  </span>
                  <span className={`shm-prow-stock${left === 0 ? " red" : left !== undefined && left <= LOW ? " warn" : ""}`}>
                    <small className="muted">موجودی</small>
                    {left === undefined ? "نامحدود" : left === 0 ? "ناموجود" : showNumber(left)}
                  </span>
                  <span className="shm-prow-sold">
                    <small className="muted">فروش</small>
                    {showNumber(st?.sold ?? 0)}
                  </span>
                  <span className="shm-prow-rate">{st?.rating ? `★ ${showNumber(st.rating)}` : "—"}</span>
                  <span className="shm-tags">
                    {p.hidden && <i className="gray">پنهان</i>}
                    {onSale(p) && <i className="green">حراج</i>}
                    {p.featured && <i>ویژه</i>}
                    {allVariantKeys(p).length ? <i className="gray">{showNumber(allVariantKeys(p).length)} ترکیب</i> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {pages > 1 && <Pager page={page} pages={pages} onPage={setPage} />}
    </div>
  );
}

/* ───────────── Changing many products at once ───────────── */

type BatchAction = "" | "category" | "price" | "percent" | "stock" | "sale" | "unsale" | "hide" | "show" | "feature" | "unfeature" | "trash";

function BatchBar({ shop, picked, updateMany, onDone }: { shop: Shop; picked: Set<string>; updateMany: (ids: Set<string>, change: (p: Product) => Partial<Product>) => void; onDone: () => void }) {
  const [action, setAction] = useState<BatchAction>("");
  const [cat, setCat] = useState(shop.categories[0]?.id ?? "");
  const [price, setPrice] = useState<number | undefined>();
  const [percent, setPercent] = useState("");
  const [stock, setStock] = useState("");
  const [ends, setEnds] = useState<string | undefined>();
  const n = showNumber(picked.size);
  const pct = Number(readNumber(percent.replace(/^[-−]/, "")) ?? NaN) * (/^[-−]/.test(percent.trim()) ? -1 : 1);

  const apply = () => {
    switch (action) {
      case "category":
        updateMany(picked, () => ({ categoryId: cat || undefined }));
        break;
      case "price":
        if (price === undefined) return;
        updateMany(picked, () => ({ price, salePrice: undefined, saleEndsAt: undefined }));
        break;
      case "percent":
        if (!Number.isFinite(pct) || pct === 0 || pct <= -100) return;
        // Raises or lowers every price, combinations included; a running sale moves with it.
        updateMany(picked, (p) => ({
          price: roundPrice(p.price * (1 + pct / 100)),
          salePrice: p.salePrice === undefined ? undefined : roundPrice(p.salePrice * (1 + pct / 100)),
          variants: p.variants?.map((v) => (v.price === undefined ? v : { ...v, price: roundPrice(v.price * (1 + pct / 100)) })),
        }));
        break;
      case "stock": {
        const s = readNumber(stock);
        updateMany(picked, () => ({ stock: s === undefined ? undefined : Math.min(s, 100000) }));
        break;
      }
      case "sale":
        if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return;
        updateMany(picked, (p) => ({ salePrice: roundPrice(p.price * (1 - pct / 100)), saleEndsAt: ends }));
        break;
      case "unsale":
        updateMany(picked, () => ({ salePrice: undefined, saleEndsAt: undefined }));
        break;
      case "hide":
      case "show":
        updateMany(picked, () => ({ hidden: action === "hide" || undefined }));
        break;
      case "feature":
      case "unfeature":
        updateMany(picked, () => ({ featured: action === "feature" || undefined }));
        break;
      case "trash":
        if (!window.confirm(`${n} محصول به سطل زباله برود؟`)) return;
        updateMany(picked, () => ({ trashed: true }));
        break;
      default:
        return;
    }
    setAction("");
    onDone();
  };

  return (
    <div className="shm-batchbar">
      <b>{n} محصول انتخاب شده:</b>
      <select value={action} aria-label="کار گروهی" onChange={(e) => setAction(e.target.value as BatchAction)}>
        <option value="">یک کار انتخاب کنید…</option>
        <option value="category">تغییر دسته</option>
        <option value="price">تعیین قیمت</option>
        <option value="percent">افزایش یا کاهش درصدی قیمت</option>
        <option value="stock">تعیین موجودی</option>
        <option value="sale">حراج با درصد تخفیف</option>
        <option value="unsale">برداشتن حراج</option>
        <option value="feature">ویژه کردن (صفحه‌ی اول)</option>
        <option value="unfeature">برداشتن از ویژه‌ها</option>
        <option value="hide">پنهان کردن از سایت</option>
        <option value="show">نمایش در سایت</option>
        <option value="trash">انتقال به سطل زباله</option>
      </select>
      {action === "category" && (
        <select value={cat} aria-label="دسته‌ی تازه" onChange={(e) => setCat(e.target.value)}>
          {shop.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="">بدون دسته</option>
        </select>
      )}
      {action === "price" && <MoneyInput value={price} placeholder="قیمت تازه" onChange={setPrice} />}
      {(action === "percent" || action === "sale") && (
        <span className="shm-pct">
          <input inputMode="numeric" value={percent} placeholder={action === "sale" ? "مثلاً ۲۰" : "مثلاً ۱۵ یا ‎-۱۰"} aria-label="درصد" onChange={(e) => setPercent(e.target.value)} />
          <i>٪</i>
        </span>
      )}
      {action === "sale" && (
        <label className="shm-inline">
          پایان حراج: <DateTimeInput value={ends} onChange={setEnds} />
        </label>
      )}
      {action === "stock" && <input inputMode="numeric" value={stock} placeholder="خالی: نامحدود" aria-label="موجودی تازه" onChange={(e) => setStock(e.target.value)} />}
      {action && (
        <button type="button" className={`btn small${action === "trash" ? " danger" : ""}`} onClick={apply}>
          اعمال
        </button>
      )}
      {action === "percent" && <small className="muted">عدد مثبت قیمت‌ها را بالا می‌برد و منفی پایین؛ به هزار تومان گرد می‌شود.</small>}
      {action === "price" && <small className="muted">حراج این محصولات برداشته می‌شود.</small>}
    </div>
  );
}

/* ───────────── The product form ───────────── */

function ProductForm({
  p,
  categories,
  stat,
  onChange,
  onCopy,
  onRemove,
}: {
  p: Product;
  categories: Shop["categories"];
  stat?: ShopProductStat;
  onChange: (patch: Partial<Product>) => void;
  onCopy: () => void;
  onRemove: () => void;
}) {
  const move = (from: number, to: number) => {
    const images = [...p.images];
    const [img] = images.splice(from, 1);
    images.splice(to, 0, img!);
    onChange({ images });
  };
  return (
    <div className="shm-form">
      {stat && (stat.sold > 0 || stat.reviews) ? (
        <p className="shm-pstat muted">
          {showNumber(stat.sold)} عدد فروخته شده · {formatToman(stat.revenue)}
          {stat.rating ? ` · ★ ${showNumber(stat.rating)} از ${showNumber(stat.reviews ?? 0)} نظر` : ""}
        </p>
      ) : null}
      <div className="shm-images">
        {p.images.map((src, k) => (
          <figure key={src + k}>
            <img src={src} alt="" />
            <button type="button" className="shm-img-x" aria-label="حذف عکس" onClick={() => onChange({ images: p.images.filter((_, i) => i !== k) })}>
              ×
            </button>
            {k === 0 ? (
              <figcaption>عکس اصلی</figcaption>
            ) : (
              <figcaption className="shm-img-tools">
                <button type="button" title="جلوتر" aria-label="جلوتر" onClick={() => move(k, k - 1)}>
                  →
                </button>
                <button type="button" title="عکس اصلی شود" onClick={() => move(k, 0)}>
                  اصلی
                </button>
                {k < p.images.length - 1 && (
                  <button type="button" title="عقب‌تر" aria-label="عقب‌تر" onClick={() => move(k, k + 1)}>
                    ←
                  </button>
                )}
              </figcaption>
            )}
          </figure>
        ))}
        {p.images.length < 6 && (
          <div className="shm-add-img">
            <ImagePicker label="+ افزودن عکس" onChange={(url) => onChange({ images: [...p.images, url] })} />
          </div>
        )}
      </div>
      <div className="shm-grid">
        <Field label="نام محصول" wide>
          <input value={p.name} maxLength={120} onChange={(e) => onChange({ name: e.target.value })} onBlur={(e) => !e.target.value.trim() && onChange({ name: "محصول بدون نام" })} />
        </Field>
        <Field label="دسته">
          <select value={p.categoryId ?? ""} onChange={(e) => onChange({ categoryId: e.target.value || undefined })}>
            <option value="">بدون دسته</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="برچسب روی عکس" hint="مثلاً «جدید» یا «حراج»؛ خالی بگذارید تا نمایش داده نشود.">
          <input value={p.badge ?? ""} maxLength={20} onChange={(e) => onChange({ badge: e.target.value || undefined })} />
        </Field>
        <Field label="قیمت">
          <MoneyInput value={p.price} onChange={(n) => onChange({ price: n ?? 0 })} />
        </Field>
        <Field label="قیمت حراج" hint="اگر پر شود، قیمت اصلی خط‌خورده نمایش داده می‌شود.">
          <MoneyInput value={p.salePrice} placeholder="بدون حراج" onChange={(n) => onChange({ salePrice: n, saleEndsAt: n === undefined ? undefined : p.saleEndsAt })} />
        </Field>
        <Field label="موجودی" hint="خالی: نامحدود · ۰: ناموجود">
          <input
            inputMode="numeric"
            key={p.stock ?? ""}
            defaultValue={p.stock === undefined ? "" : String(p.stock)}
            onBlur={(e) => {
              const n = readNumber(e.target.value);
              onChange({ stock: n === undefined ? undefined : Math.min(n, 100000) });
            }}
          />
        </Field>
        <SaleEndField p={p} onChange={onChange} />
        <Field label="توضیحات" wide>
          <textarea rows={4} maxLength={3000} value={p.description ?? ""} onChange={(e) => onChange({ description: e.target.value || undefined })} />
        </Field>
      </div>
      <OptionsEditor p={p} onChange={onChange} />
      <SpecsEditor p={p} onChange={onChange} />
      <details className="shm-seo">
        <summary>تنظیمات سئو (نمایش در گوگل)</summary>
        <p className="muted">اگر خالی بماند، از نام و توضیحات محصول ساخته می‌شود.</p>
        <Field label={`عنوان در نتایج جست‌وجو (${showNumber((p.seoTitle ?? "").length)} از ۷۰)`}>
          <input value={p.seoTitle ?? ""} maxLength={70} placeholder={p.name} onChange={(e) => onChange({ seoTitle: e.target.value || undefined })} />
        </Field>
        <Field label={`توضیح در نتایج جست‌وجو (${showNumber((p.seoDescription ?? "").length)} از ۱۶۰)`}>
          <textarea rows={2} maxLength={160} value={p.seoDescription ?? ""} placeholder={(p.description ?? "").slice(0, 160)} onChange={(e) => onChange({ seoDescription: e.target.value || undefined })} />
        </Field>
        <div className="shm-serp" aria-hidden>
          <b>{p.seoTitle || p.name}</b>
          <span>{p.seoDescription || (p.description ?? "").slice(0, 160)}</span>
        </div>
      </details>
      <div className="shm-checks">
        <label>
          <input type="checkbox" checked={Boolean(p.featured)} onChange={(e) => onChange({ featured: e.target.checked || undefined })} />
          محصول ویژه (در بخش ویژه‌ی صفحه‌ی اول نمایش داده شود)
        </label>
        <label>
          <input type="checkbox" checked={Boolean(p.hidden)} onChange={(e) => onChange({ hidden: e.target.checked || undefined })} />
          فعلاً در سایت نمایش داده نشود
        </label>
      </div>
      <div className="row gap wrap">
        <button type="button" className="btn ghost" onClick={onCopy}>
          کپی از این محصول
        </button>
        <button type="button" className="btn ghost danger" onClick={onRemove}>
          انتقال به سطل زباله
        </button>
      </div>
    </div>
  );
}
