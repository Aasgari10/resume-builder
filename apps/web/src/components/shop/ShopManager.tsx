// Shop management for shop templates: products, categories, orders and shop settings, in a
// full-screen window over the site editor. Products, categories and settings are part of the
// site's content, so they save with the editor's autosave and reach the site on the next publish;
// orders come from the server.

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  SHOP_ORDER_STATUSES,
  SHOP_ORDER_STATUS_LABELS,
  formatToman,
  type Product,
  type ResumeData,
  type Shop,
  type ShopOrderStatus,
} from "@rb/schema";
import { ApiError, api, type ShopOrder } from "../../api";
import { newId } from "../editor/list";
import { uploadPicture } from "../site-edit/uploadImage";

type Tab = "products" | "categories" | "banners" | "orders" | "settings";

type Props = {
  data: ResumeData;
  /** The template's sample content, offered as a starting point for an empty shop. */
  sample?: ResumeData;
  onData: (data: ResumeData) => void;
  /** Saved resume id; orders can only be listed for a saved (and published) site. */
  resumeId?: string;
  onClose: () => void;
};

const EMPTY_SHOP: Shop = { categories: [], products: [] };

/** Reads a whole number typed with Persian or Latin digits and separators; empty stays empty. */
function readNumber(text: string): number | undefined {
  const digits = text.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d]/g, "");
  return digits ? Math.min(Number(digits), 10_000_000_000) : undefined;
}
const showNumber = (n: number | undefined) => (n === undefined ? "" : new Intl.NumberFormat("fa-IR").format(n));

export function ShopManager({ data, sample, onData, resumeId, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("products");
  const shop = data.site?.shop ?? EMPTY_SHOP;
  const setShop = (next: Partial<Shop>) => onData({ ...data, site: { gallery: [], ...data.site, shop: { ...shop, ...next } } });

  // Esc closes the window.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  /** Copies the sample shop (products, categories, texts) into the user's own content. */
  const startFromSample = () => {
    const s = sample?.site?.shop;
    if (!s) return;
    onData({ ...data, site: { gallery: [], ...data.site, shop: { ...s, ...Object.fromEntries(Object.entries(shop).filter(([, v]) => (Array.isArray(v) ? v.length : v !== undefined && v !== ""))), products: s.products, categories: s.categories } } });
  };

  return (
    <div className="shm" dir="rtl" role="dialog" aria-label="مدیریت فروشگاه">
      <header className="shm-head">
        <h2>🛍 مدیریت فروشگاه</h2>
        <nav className="shm-tabs" role="tablist">
          {(
            [
              ["products", `محصولات (${showNumber(shop.products.length)})`],
              ["categories", "دسته‌ها"],
              ["banners", "بنرها و اسلایدها"],
              ["orders", "سفارش‌ها"],
              ["settings", "تنظیمات فروشگاه"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
        <button type="button" className="btn small" onClick={onClose}>
          بستن و برگشت به سایت
        </button>
      </header>
      <div className="shm-body">
        {tab === "products" && <Products shop={shop} setShop={setShop} onSample={sample?.site?.shop ? startFromSample : undefined} />}
        {tab === "categories" && <Categories shop={shop} setShop={setShop} />}
        {tab === "banners" && <Banners shop={shop} setShop={setShop} />}
        {tab === "orders" && <Orders resumeId={resumeId} />}
        {tab === "settings" && <Settings shop={shop} setShop={setShop} />}
      </div>
      <footer className="shm-foot muted">تغییرات خودکار ذخیره می‌شوند و بعد از «انتشار» در سایت دیده می‌شوند.</footer>
    </div>
  );
}

/* ───────────── Shared bits ───────────── */

function Field({ label, children, hint, wide }: { label: string; children: ReactNode; hint?: string; wide?: boolean }) {
  return (
    <label className={`shm-field${wide ? " wide" : ""}`}>
      <span>{label}</span>
      {children}
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
}

function MoneyInput({ value, onChange, placeholder }: { value: number | undefined; onChange: (n: number | undefined) => void; placeholder?: string }) {
  const [text, setText] = useState(showNumber(value));
  useEffect(() => setText(showNumber(value)), [value]);
  return (
    <span className="shm-money">
      <input inputMode="numeric" value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} onBlur={() => onChange(readNumber(text))} />
      <i>تومان</i>
    </span>
  );
}

function ImagePicker({ value, onChange, label = "انتخاب عکس" }: { value?: string; onChange: (url: string) => void; label?: string }) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="shm-pick">
      <button type="button" className="btn ghost small" disabled={busy} onClick={() => file.current?.click()}>
        {busy ? "در حال آپلود…" : value ? "عوض کردن عکس" : label}
      </button>
      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          setError(null);
          try {
            onChange(await uploadPicture(f));
          } catch (err) {
            setError(err instanceof Error ? err.message : "آپلود انجام نشد");
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      {error && <small className="error">{error}</small>}
    </span>
  );
}

/* ───────────── Products ───────────── */

function Products({ shop, setShop, onSample }: { shop: Shop; setShop: (s: Partial<Shop>) => void; onSample?: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const cats = new Map(shop.categories.map((c) => [c.id, c.name]));
  const update = (id: string, patch: Partial<Product>) => setShop({ products: shop.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const add = () => {
    const id = newId();
    setShop({ products: [{ id, name: "محصول جدید", price: 0, images: [], categoryId: shop.categories[0]?.id }, ...shop.products] });
    setEditing(id);
  };
  const remove = (p: Product) => {
    if (!window.confirm(`«${p.name}» حذف شود؟`)) return;
    setShop({ products: shop.products.filter((x) => x.id !== p.id) });
    if (editing === p.id) setEditing(null);
  };
  const list = shop.products.filter((p) => !query.trim() || p.name.includes(query.trim()));
  const current = shop.products.find((p) => p.id === editing);

  if (shop.products.length === 0)
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

  return (
    <div className={`shm-split${current ? " editing" : ""}`}>
      <section className="shm-list">
        <div className="shm-toolbar">
          <input placeholder="جست‌وجو در محصولات…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="button" className="btn small" onClick={add}>
            + محصول جدید
          </button>
        </div>
        <ul>
          {list.map((p) => (
            <li key={p.id} className={editing === p.id ? "on" : ""}>
              <button type="button" className="shm-item" onClick={() => setEditing(p.id)}>
                <span className="shm-thumb">{p.images[0] ? <img src={p.images[0]} alt="" /> : "🖼"}</span>
                <span className="shm-item-text">
                  <b>{p.name || "بدون نام"}</b>
                  <small className="muted">
                    {cats.get(p.categoryId ?? "") ?? "بدون دسته"} · {formatToman(p.salePrice ?? p.price)}
                  </small>
                </span>
                <span className="shm-tags">
                  {p.hidden && <i className="gray">پنهان</i>}
                  {p.stock === 0 && <i className="red">ناموجود</i>}
                  {p.salePrice !== undefined && p.salePrice < p.price && <i className="green">حراج</i>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="shm-edit">
        {current && (
          <button type="button" className="btn ghost small shm-back" onClick={() => setEditing(null)}>
            → برگشت به فهرست محصولات
          </button>
        )}
        {current ? (
          <ProductForm key={current.id} p={current} categories={shop.categories} onChange={(patch) => update(current.id, patch)} onRemove={() => remove(current)} />
        ) : (
          <p className="muted shm-hint">یک محصول را از فهرست انتخاب کنید تا ویرایشش کنید.</p>
        )}
      </section>
    </div>
  );
}

function ProductForm({ p, categories, onChange, onRemove }: { p: Product; categories: Shop["categories"]; onChange: (patch: Partial<Product>) => void; onRemove: () => void }) {
  const [sizes, setSizes] = useState((p.sizes ?? []).join("، "));
  const saveSizes = () => {
    const list = sizes.split(/[,،\s]+/).map((s) => s.trim()).filter(Boolean).slice(0, 12);
    onChange({ sizes: list.length ? list : undefined });
  };
  return (
    <div className="shm-form">
      <div className="shm-images">
        {p.images.map((src, k) => (
          <figure key={src + k}>
            <img src={src} alt="" />
            <button type="button" aria-label="حذف عکس" onClick={() => onChange({ images: p.images.filter((_, i) => i !== k) })}>
              ×
            </button>
            {k === 0 && <figcaption>عکس اصلی</figcaption>}
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
          <MoneyInput value={p.salePrice} placeholder="بدون حراج" onChange={(n) => onChange({ salePrice: n })} />
        </Field>
        <Field label="موجودی" hint="خالی: نامحدود · ۰: ناموجود">
          <input
            inputMode="numeric"
            defaultValue={p.stock === undefined ? "" : String(p.stock)}
            onBlur={(e) => {
              const n = readNumber(e.target.value);
              onChange({ stock: n === undefined ? undefined : Math.min(n, 100000) });
            }}
          />
        </Field>
        <Field label="سایزها" hint="با ویرگول جدا کنید، مثلاً S، M، L یا ۳۸، ۴۰">
          <input value={sizes} onChange={(e) => setSizes(e.target.value)} onBlur={saveSizes} />
        </Field>
        <Field label="توضیحات" wide>
          <textarea rows={4} maxLength={3000} value={p.description ?? ""} onChange={(e) => onChange({ description: e.target.value || undefined })} />
        </Field>
      </div>
      <div className="shm-checks">
        <label>
          <input type="checkbox" checked={Boolean(p.featured)} onChange={(e) => onChange({ featured: e.target.checked || undefined })} />
          در بخش «جدیدترین‌ها»ی صفحه‌ی اول نمایش داده شود
        </label>
        <label>
          <input type="checkbox" checked={Boolean(p.hidden)} onChange={(e) => onChange({ hidden: e.target.checked || undefined })} />
          فعلاً در سایت نمایش داده نشود
        </label>
      </div>
      <button type="button" className="btn ghost danger" onClick={onRemove}>
        حذف این محصول
      </button>
    </div>
  );
}

/* ───────────── Categories ───────────── */

function Categories({ shop, setShop }: { shop: Shop; setShop: (s: Partial<Shop>) => void }) {
  const count = (id: string) => shop.products.filter((p) => p.categoryId === id).length;
  const update = (id: string, patch: Partial<Shop["categories"][number]>) => setShop({ categories: shop.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const remove = (id: string) => {
    if (count(id) && !window.confirm("محصولات این دسته بدون دسته می‌مانند. ادامه می‌دهید؟")) return;
    setShop({ categories: shop.categories.filter((c) => c.id !== id), products: shop.products.map((p) => (p.categoryId === id ? { ...p, categoryId: undefined } : p)) });
  };
  const move = (k: number, by: number) => {
    const next = [...shop.categories];
    const [c] = next.splice(k, 1);
    next.splice(Math.max(0, Math.min(next.length, k + by)), 0, c!);
    setShop({ categories: next });
  };
  return (
    <div className="shm-cats">
      <p className="muted">دسته‌ها در منو و صفحه‌ی اول نمایش داده می‌شوند؛ دسته‌ی بدون محصول خودش پنهان می‌شود.</p>
      {shop.categories.map((c, k) => (
        <div key={c.id} className="shm-cat">
          <span className="shm-thumb">{c.image ? <img src={c.image} alt="" /> : "🗂"}</span>
          <input value={c.name} maxLength={60} onChange={(e) => update(c.id, { name: e.target.value })} aria-label="نام دسته" />
          <small className="muted">{showNumber(count(c.id))} محصول</small>
          <ImagePicker value={c.image} onChange={(url) => update(c.id, { image: url })} />
          <button type="button" className="btn ghost small" disabled={k === 0} onClick={() => move(k, -1)} aria-label="بالاتر">
            ↑
          </button>
          <button type="button" className="btn ghost small" disabled={k === shop.categories.length - 1} onClick={() => move(k, 1)} aria-label="پایین‌تر">
            ↓
          </button>
          <button type="button" className="btn ghost small danger" onClick={() => remove(c.id)}>
            حذف
          </button>
        </div>
      ))}
      <button type="button" className="btn small" onClick={() => setShop({ categories: [...shop.categories, { id: newId(), name: "دسته‌ی جدید", image: "" }] })}>
        + دسته‌ی جدید
      </button>
    </div>
  );
}

/* ───────────── Banners ───────────── */

type Slide = NonNullable<Shop["slides"]>[number];

function Banners({ shop, setShop }: { shop: Shop; setShop: (s: Partial<Shop>) => void }) {
  // A shop made before slides existed has one hero; it becomes the first slide when slides are edited.
  const slides: Slide[] = shop.slides?.length ? shop.slides : shop.heroTitle || shop.heroImage ? [{ id: "hero", title: shop.heroTitle, text: shop.heroText, image: shop.heroImage ?? "" }] : [];
  const save = (next: Slide[]) => setShop({ slides: next });
  const update = (id: string, patch: Partial<Slide>) => save(slides.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const move = (k: number, by: number) => {
    const next = [...slides];
    const [x] = next.splice(k, 1);
    next.splice(Math.max(0, Math.min(next.length, k + by)), 0, x!);
    save(next);
  };
  const remove = (id: string) => window.confirm("این اسلاید حذف شود؟") && save(slides.filter((x) => x.id !== id));
  return (
    <div className="shm-cats">
      <p className="muted">اسلایدهای بالای صفحه‌ی اول (حداکثر ۵). بازدیدکننده با فلش‌ها بینشان جابه‌جا می‌شود. عکس با پس‌زمینه‌ی روشن و ساده بهترین نتیجه را می‌دهد.</p>
      {slides.map((x, k) => (
        <div key={x.id} className="shm-slide">
          <span className="shm-thumb wide">{x.image ? <img src={x.image} alt="" /> : "🖼"}</span>
          <div className="shm-slide-fields">
            <input value={x.title ?? ""} maxLength={120} placeholder="تیتر اسلاید" onChange={(e) => update(x.id, { title: e.target.value || undefined })} aria-label="تیتر اسلاید" />
            <textarea rows={2} value={x.text ?? ""} maxLength={400} placeholder="متن کوتاه زیر تیتر" onChange={(e) => update(x.id, { text: e.target.value || undefined })} aria-label="متن اسلاید" />
            <div className="row gap wrap">
              <ImagePicker value={x.image} onChange={(url) => update(x.id, { image: url })} />
              <button type="button" className="btn ghost small" disabled={k === 0} onClick={() => move(k, -1)} aria-label="جلوتر">
                ↑
              </button>
              <button type="button" className="btn ghost small" disabled={k === slides.length - 1} onClick={() => move(k, 1)} aria-label="عقب‌تر">
                ↓
              </button>
              <button type="button" className="btn ghost small danger" onClick={() => remove(x.id)}>
                حذف
              </button>
            </div>
          </div>
        </div>
      ))}
      {slides.length < 5 && (
        <button type="button" className="btn small" onClick={() => save([...slides, { id: newId(), title: "تیتر اسلاید جدید", image: "" }])}>
          + اسلاید جدید
        </button>
      )}
      <h3>نوار متحرک وسط صفحه</h3>
      <Field label="متن‌ها (هر خط یکی، حداکثر ۶)" wide>
        <textarea
          rows={4}
          defaultValue={(shop.bandItems ?? []).join("\n")}
          onBlur={(e) => {
            const list = e.target.value.split("\n").map((t) => t.trim().slice(0, 60)).filter(Boolean).slice(0, 6);
            setShop({ bandItems: list.length ? list : undefined });
          }}
        />
      </Field>
      <h3>بخش «کمد لباست را تازه کن»</h3>
      <LookSpots shop={shop} setShop={setShop} />
      <p className="muted">عکس‌ها و متن‌های بقیه‌ی بخش‌ها را مستقیم روی خود سایت ویرایش کنید؛ روی هر کدام بزنید.</p>
    </div>
  );
}

type Spot = NonNullable<Shop["lookSpots"]>[number];

/** Points on the big look-book photo; each opens one product in the card beside it. */
function LookSpots({ shop, setShop }: { shop: Shop; setShop: (s: Partial<Shop>) => void }) {
  const spots = shop.lookSpots ?? [];
  const save = (next: Spot[]) => setShop({ lookSpots: next.length ? next : undefined });
  const update = (id: string, patch: Partial<Spot>) => save(spots.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  // Percent with an optional decimal point, typed with Persian or Latin digits.
  const percent = (v: string) => {
    const n = Number.parseFloat(v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٫,]/g, "."));
    return Number.isFinite(n) ? Math.round(Math.max(0, Math.min(100, n)) * 10) / 10 : 50;
  };
  return (
    <div className="shm-spots">
      <p className="muted">
        روی عکس بزرگ این بخش نقطه‌هایی هست که با کلیک روی هر کدام، محصول همان نقطه در کارت کنار عکس نمایش داده می‌شود. جای هر نقطه را با درصد فاصله از چپ و از بالای عکس تعیین کنید.
      </p>
      {spots.map((x, k) => (
        <div key={x.id} className="shm-spot">
          <b>نقطه‌ی {new Intl.NumberFormat("fa-IR").format(k + 1)}</b>
          <select value={x.productId} onChange={(e) => update(x.id, { productId: e.target.value })} aria-label="محصول این نقطه">
            {shop.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <label>
            از چپ ٪
            <input inputMode="numeric" defaultValue={String(x.x)} onBlur={(e) => update(x.id, { x: percent(e.target.value) })} />
          </label>
          <label>
            از بالا ٪
            <input inputMode="numeric" defaultValue={String(x.y)} onBlur={(e) => update(x.id, { y: percent(e.target.value) })} />
          </label>
          <button type="button" className="btn ghost small danger" onClick={() => save(spots.filter((y) => y.id !== x.id))}>
            حذف
          </button>
        </div>
      ))}
      {spots.length < 4 && shop.products.length > 0 && (
        <button type="button" className="btn small" onClick={() => save([...spots, { id: newId(), productId: shop.products[0]!.id, x: 50, y: 50 }])}>
          + نقطه‌ی جدید
        </button>
      )}
      {spots.length < 2 && (
        <Field label="محصول کارت (وقتی کمتر از دو نقطه دارید)">
          <select value={shop.lookProductId ?? ""} onChange={(e) => setShop({ lookProductId: e.target.value || undefined })}>
            <option value="">خودکار (اولین محصول ویژه)</option>
            {shop.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      )}
    </div>
  );
}

/* ───────────── Orders ───────────── */

function Orders({ resumeId }: { resumeId?: string }) {
  const [orders, setOrders] = useState<ShopOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const load = () => {
    if (!resumeId) return;
    setError(null);
    api
      .shopOrders(resumeId)
      .then((r) => setOrders(r.orders))
      .catch((e) => setError(e instanceof ApiError ? e.message : "سفارش‌ها دریافت نشد"));
  };
  useEffect(load, [resumeId]);

  if (!resumeId) return <p className="muted">برای دیدن سفارش‌ها، اول سایت را ذخیره و منتشر کنید.</p>;
  if (error) return <p className="error">{error}</p>;
  if (!orders) return <p className="muted">در حال دریافت سفارش‌ها…</p>;

  const setStatus = async (o: ShopOrder, status: ShopOrderStatus) => {
    try {
      const { order } = await api.setShopOrderStatus(resumeId, o.id, status);
      setOrders((list) => list?.map((x) => (x.id === order.id ? order : x)) ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "وضعیت ذخیره نشد");
    }
  };
  const waiting = orders.filter((o) => o.status === "NEW").length;
  return (
    <div className="shm-orders">
      <div className="shm-toolbar">
        <span>
          {showNumber(orders.length)} سفارش{waiting > 0 && <b className="shm-new"> · {showNumber(waiting)} سفارش تازه</b>}
        </span>
        <button type="button" className="btn ghost small" onClick={load}>
          به‌روزرسانی
        </button>
      </div>
      {orders.length === 0 ? (
        <p className="muted shm-hint">هنوز سفارشی ثبت نشده است. سفارش‌هایی که مشتری‌ها در سایت منتشرشده ثبت کنند این‌جا می‌آیند.</p>
      ) : (
        <ul className="shm-order-list">
          {orders.map((o) => (
            <li key={o.id} className={`st-${o.status.toLowerCase()}`}>
              <button type="button" className="shm-order" onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}>
                <b dir="ltr">#{o.code}</b>
                <span>{o.customerName}</span>
                <span dir="ltr">{o.phone}</span>
                <span>{new Date(o.createdAt).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" })}</span>
                <b>{formatToman(o.total)}</b>
                <i className="shm-status">{SHOP_ORDER_STATUS_LABELS[o.status]}</i>
              </button>
              {open === o.id && (
                <div className="shm-order-more">
                  <table>
                    <tbody>
                      {o.items.map((it, k) => (
                        <tr key={k}>
                          <td>
                            {it.name}
                            {it.size && ` (سایز ${it.size})`}
                          </td>
                          <td>× {showNumber(it.qty)}</td>
                          <td>{formatToman(it.total)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td>هزینه‌ی ارسال</td>
                        <td />
                        <td>{o.shipping ? formatToman(o.shipping) : "رایگان"}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p>
                    <b>نشانی:</b> {[o.city, o.address].filter(Boolean).join("، ")}
                    {o.postalCode && ` · کد پستی ${o.postalCode}`}
                  </p>
                  {o.note && (
                    <p>
                      <b>توضیح مشتری:</b> {o.note}
                    </p>
                  )}
                  <div className="row gap wrap">
                    <span>وضعیت:</span>
                    {SHOP_ORDER_STATUSES.map((s) => (
                      <button key={s} type="button" className="btn ghost small" aria-pressed={o.status === s} onClick={() => void setStatus(o, s)}>
                        {SHOP_ORDER_STATUS_LABELS[s]}
                      </button>
                    ))}
                    <a className="btn ghost small" href={`tel:${o.phone}`}>
                      تماس با مشتری
                    </a>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ───────────── Settings ───────────── */

function Settings({ shop, setShop }: { shop: Shop; setShop: (s: Partial<Shop>) => void }) {
  return (
    <div className="shm-form shm-settings">
      <h3>ارسال</h3>
      <div className="shm-grid">
        <Field label="هزینه‌ی ارسال هر سفارش" hint="خالی یا صفر: ارسال رایگان">
          <MoneyInput value={shop.shippingFee} onChange={(n) => setShop({ shippingFee: n })} />
        </Field>
        <Field label="ارسال رایگان برای خریدهای بالای" hint="خالی: همیشه هزینه‌ی ارسال گرفته می‌شود">
          <MoneyInput value={shop.freeShippingFrom} onChange={(n) => setShop({ freeShippingFrom: n })} />
        </Field>
      </div>
      <h3>پرداخت و پیام‌ها</h3>
      <div className="shm-grid">
        <Field label="روش پرداخت (در صفحه‌ی ثبت سفارش نمایش داده می‌شود)" wide hint="درگاه پرداخت اختصاصی فروشگاه در مرحله‌ی بعد اضافه می‌شود. فعلاً روش پرداخت را توضیح دهید.">
          <textarea rows={3} maxLength={600} value={shop.paymentNote ?? ""} onChange={(e) => setShop({ paymentNote: e.target.value || undefined })} />
        </Field>
        <Field label="پیام بعد از ثبت سفارش" wide>
          <textarea rows={2} maxLength={300} value={shop.orderNote ?? ""} onChange={(e) => setShop({ orderNote: e.target.value || undefined })} />
        </Field>
        <Field label="اطلاعیه‌های نوار بالای سایت (هر خط یکی، حداکثر ۴)" wide>
          <textarea
            rows={4}
            defaultValue={(shop.announcements ?? []).join("\n")}
            onBlur={(e) => {
              const list = e.target.value.split("\n").map((s) => s.trim().slice(0, 100)).filter(Boolean).slice(0, 4);
              setShop({ announcements: list.length ? list : undefined });
            }}
          />
        </Field>
      </div>
      <p className="muted">تیترها، عکس‌ها و متن‌های صفحه‌ی اول را مستقیم روی خود سایت ویرایش کنید.</p>
    </div>
  );
}
