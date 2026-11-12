// Shop management for shop templates: products, categories, orders and shop settings, in a
// full-screen window over the site editor. Products, categories and settings are part of the
// site's content, so they save with the editor's autosave and reach the site on the next publish;
// orders, customers, comments and tickets come from the server. Until the shop has a customer or an
// order of its own, those tabs show sample activity instead (sampleData.ts), kept in this browser
// tab only.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { type Product, type ResumeData, type Shop } from "@rb/schema";
import { api, type ShopSummary } from "../../api";
import { newId } from "../editor/list";
import { Field, ImagePicker, MoneyInput, readNumber, showNumber } from "./fields";
import { AdBanners, Coupons } from "./ShopManagerMore";
import { TrashTabs } from "./ShopTrash";
import { Reports } from "./ShopReports";
import { Pages, Quotes } from "./ShopPages";
import { Blog } from "./ShopBlog";
import { Extras } from "./ShopExtras";
import { SiteInbox } from "./SiteInbox";
import { MenuQr } from "./MenuQr";
import { Customers, Reviews, Tickets } from "./ShopPeople";
import { Dashboard, Orders } from "./ShopOrders";
import { Products, stockOf } from "./ShopProducts";
import { resetSample, sampleShopApi, sampleShopFor } from "./sampleData";
import { ShopApiContext } from "./shopApi";

type Tab = "inbox" | "qr" | "dashboard" | "quotes" | "pages" | "blog" | "extras" | "products" | "categories" | "banners" | "coupons" | "orders" | "reports" | "reviews" | "tickets" | "customers" | "trash" | "settings";

type Props = {
  data: ResumeData;
  /** The template's sample content, offered as a starting point for an empty shop. */
  sample?: ResumeData;
  onData: (data: ResumeData) => void;
  /** Saved resume id; orders can only be listed for a saved (and published) site. */
  resumeId?: string;
  /** Opens the products tab on this product (a click on a product in the site preview). */
  focusProductId?: string;
  /** Whether the site's template has a blog page (the blog tab says so when it has not). */
  hasBlog?: boolean;
  /** A menu site (cafe): only the menu, the page texts and pictures and the QR code; no orders or accounts. */
  menu?: boolean;
  /** A menu site that also sells some categories online: the full shop tabs, plus the QR code. */
  sells?: boolean;
  /** A service business (salon): services with price lists, plus products sold online; no menu QR code. */
  services?: boolean;
  /** The site has a booking form: the inbox opens on the bookings. */
  bookings?: boolean;
  onClose: () => void;
};

/** Tabs of a menu site, in this order. */
const MENU_TABS: Tab[] = ["products", "categories", "inbox", "qr", "banners", "extras", "quotes", "pages", "trash"];

const EMPTY_SHOP: Shop = { categories: [], products: [] };

export function ShopManager({ data, sample, onData, resumeId, focusProductId, hasBlog, menu: menuSite, sells: sellsMenu, services, bookings, onClose }: Props) {
  const sells = sellsMenu || services;
  // Only a menu site that sells nothing gets the short menu panel.
  const menu = menuSite && !sells;
  const [tab, setTab] = useState<Tab>(focusProductId || menu ? "products" : "dashboard");
  // Counts for the "new" marks on the tabs; read again after changes in those tabs.
  const [counts, setCounts] = useState<Pick<ShopSummary, "newOrders" | "openTickets" | "waitingReviews"> | null>(null);
  const shop = data.site?.shop ?? EMPTY_SHOP;

  // Sample activity while the shop has none of its own (no site yet, or no customer and no order).
  const [mode, setMode] = useState<"loading" | "real" | "sample">(resumeId ? "loading" : "sample");
  useEffect(() => {
    if (!resumeId) return setMode("sample");
    api.shopSummary(resumeId).then(
      (r) => setMode(!r.summary || (r.summary.orders === 0 && r.summary.customers === 0) ? "sample" : "real"),
      () => setMode("real"),
    );
  }, [resumeId]);
  // The sample sells the shop's own products, or the template's sample products while it has none.
  const sampleShop = sampleShopFor(shop, sample?.site?.shop);
  const sampleKey = sampleShop.products.map((p) => p.id).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sampleApi = useMemo(() => sampleShopApi(sampleShop), [sampleKey]);
  const source = mode === "sample" ? sampleApi : api;
  // "Start again" builds a new sample; the tabs are drawn anew to read it.
  const [round, setRound] = useState(0);
  const rid = mode === "sample" ? `sample-${round}` : resumeId;
  // Comments and reports name the products the orders were made of.
  const namesShop = mode === "sample" ? { ...shop, products: sampleShop.products, categories: sampleShop.categories } : shop;

  // New bookings, messages and sign-ups sent through the site's forms (always the real site, never the sample).
  const [inboxNew, setInboxNew] = useState(0);
  const refreshInbox = () => {
    if (resumeId) api.siteMessages(resumeId).then((r) => setInboxNew(r.newCounts.booking + r.newCounts.contact + r.newCounts.newsletter), () => undefined);
  };
  useEffect(refreshInbox, [resumeId, tab]);
  const refreshCounts = () => {
    if (rid && mode !== "loading") source.shopSummary(rid).then((r) => setCounts(r.summary), () => undefined);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refreshCounts, [rid, mode, tab]);
  const setShop = (next: Partial<Shop>) => onData({ ...data, site: { gallery: [], ...data.site, shop: { ...shop, ...next } } });
  const live = shop.products.filter((p) => !p.trashed);
  const trashCount = shop.products.length - live.length;
  const outOfStock = live.filter((p) => stockOf(p) === 0).length;
  const lowStock = live.filter((p) => { const n = stockOf(p); return n !== undefined && n > 0 && n <= 5; }).length;
  const badge = (n?: number) => (n ? <i className="shm-badge">{showNumber(n)}</i> : null);

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
    <div className="shm" dir="rtl" role="dialog" aria-label={menu ? "مدیریت سایت" : "مدیریت فروشگاه"}>
      <header className="shm-head">
        <h2>{menu ? "☕ مدیریت سایت" : "🛍 مدیریت فروشگاه"}</h2>
        <button type="button" className="btn small" onClick={onClose}>
          بستن و برگشت به سایت
        </button>
      </header>
      <div className="shm-main">
        <nav className="shm-tabs" role="tablist" aria-label="بخش‌های مدیریت فروشگاه">
          {(
            [
              ["dashboard", "📊 داشبورد"],
              ["products", menu ? "☕ منو" : services ? "💇 خدمات و محصولات" : menuSite ? "☕ منو و محصولات" : "📦 محصولات", <i key="n" className="shm-count">{showNumber(live.length)}</i>],
              ["qr", "▦ QR کد منو"],
              ["categories", "📂 دسته‌ها"],
              ["orders", "📋 سفارش‌ها", badge(counts?.newOrders)],
              ["inbox", "📥 پیام‌ها و نوبت‌ها", badge(inboxNew)],
              ["customers", "👥 مشتریان"],
              ["reviews", "💬 نظرات", badge(counts?.waitingReviews)],
              ["tickets", "🎫 تیکت‌ها", badge(counts?.openTickets)],
              ["coupons", "🏷 کدهای تخفیف"],
              ["banners", "🖼 بنرها و اسلایدها"],
              ["quotes", "⭐ نظرات صفحه‌ی اول"],
              ["extras", "✨ ویژگی‌ها، برندها و آرم‌ها"],
              ["pages", "📄 صفحه‌ها و تماس"],
              ["blog", "📰 بلاگ", shop.posts?.length ? <i key="n" className="shm-count">{showNumber(shop.posts.length)}</i> : null],
              ["reports", "📈 گزارش‌ها"],
              ["trash", "🗑 سطل زباله", trashCount ? <i key="n" className="shm-count">{showNumber(trashCount)}</i> : null],
              ["settings", "⚙️ تنظیمات فروشگاه"],
            ] as [Tab, string, ReactNode?][]
          )
            .filter(([id]) => (menu ? MENU_TABS.includes(id) : (menuSite && !services) || id !== "qr"))
            .sort(([a], [b]) => (menu ? MENU_TABS.indexOf(a) - MENU_TABS.indexOf(b) : 0))
            .map(([id, label, extra]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              <span>{label}</span>
              {extra}
            </button>
          ))}
        </nav>
      <ShopApiContext.Provider value={source}>
      <div className="shm-body">
        {mode === "sample" && !["products", "categories", "banners", "coupons", "quotes", "pages", "blog", "extras", "trash", "settings", "qr", "inbox"].includes(tab) && (
          <p className="shm-sample">
            <span>
              🧪 <b>این‌ها اطلاعات نمونه است</b> تا ببینید پنل چه کارهایی می‌کند. تغییرهای شما فقط در همین مرورگر است و کاربر دیگری آن‌ها را نمی‌بیند؛ بعد از ۳۰ دقیقه دوری خودش تازه می‌شود. با اولین سفارش یا مشتری واقعی، اطلاعات خود فروشگاه‌تان این‌جا می‌آید.
            </span>
            <button
              type="button"
              className="btn ghost small"
              onClick={() => {
                if (!window.confirm("همه‌ی تغییرهای شما روی اطلاعات نمونه پاک شود و نمونه‌ها از اول ساخته شوند؟")) return;
                resetSample(sampleShop);
                setRound((n) => n + 1);
              }}
            >
              ↺ شروع دوباره‌ی نمونه
            </button>
          </p>
        )}
        {mode === "loading" && <p className="muted shm-hint">در حال بارگذاری…</p>}
        {mode !== "loading" && (
          <>
        {tab === "dashboard" && <Dashboard resumeId={rid} products={live.length} outOfStock={outOfStock} lowStock={lowStock} onTab={(t) => setTab(t as Tab)} />}
        {tab === "products" && <Products shop={shop} setShop={setShop} onSample={sample?.site?.shop ? startFromSample : undefined} focus={focusProductId} resumeId={rid} />}
        {tab === "categories" && <Categories shop={shop} setShop={setShop} sells={sells} services={services} />}
        {tab === "banners" && <Banners shop={shop} setShop={setShop} />}
        {tab === "coupons" && <Coupons shop={shop} setShop={setShop} />}
        {tab === "orders" && <Orders resumeId={rid} onChanged={refreshCounts} />}
        {tab === "inbox" && <SiteInbox resumeId={resumeId} onChanged={refreshInbox} bookings={bookings} />}
        {tab === "quotes" && <Quotes data={data} onData={onData} />}
        {tab === "extras" && <Extras data={data} onData={onData} shop={shop} setShop={setShop} menu={menu} />}
        {tab === "blog" && <Blog shop={shop} setShop={setShop} hasBlog={Boolean(hasBlog)} />}
        {tab === "pages" && <Pages data={data} onData={onData} shop={shop} setShop={setShop} />}
        {tab === "reports" && <Reports resumeId={rid} shop={namesShop} />}
        {tab === "reviews" && <Reviews resumeId={rid} shop={namesShop} setShop={setShop} onChanged={refreshCounts} />}
        {tab === "tickets" && <Tickets resumeId={rid} onChanged={refreshCounts} />}
        {tab === "customers" && <Customers resumeId={rid} />}
        {tab === "trash" && <TrashTabs shop={shop} setShop={setShop} resumeId={rid} onChanged={refreshCounts} productsOnly={menu} />}
        {tab === "qr" && <MenuQr resumeId={resumeId} name={data.basics.fullName} />}
        {tab === "settings" && <Settings shop={shop} setShop={setShop} />}
          </>
        )}
      </div>
      </ShopApiContext.Provider>
      </div>
      <footer className="shm-foot muted">تغییرات خودکار ذخیره می‌شوند و بعد از «انتشار» در سایت دیده می‌شوند.</footer>
    </div>
  );
}

/* ───────────── Categories ───────────── */

function Categories({ shop, setShop, sells, services }: { shop: Shop; setShop: (s: Partial<Shop>) => void; sells?: boolean; services?: boolean }) {
  const count = (id: string) => shop.products.filter((p) => p.categoryId === id && !p.trashed).length;
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
      {sells && (
        <p className="muted">
          {services
            ? "هر دسته یک خدمت است و آیتم‌هایش لیست قیمت آن؛ برای دسته‌هایی که محصولشان را آنلاین می‌فروشید (مثل لاک ناخن) «فروش آنلاین» را روشن کنید."
            : "«فروش آنلاین» را برای دسته‌هایی روشن کنید که مشتری می‌تواند از سایت بخرد (مثل دانه‌ی قهوه)؛ بقیه‌ی منو فقط برای دیدن است."}
        </p>
      )}
      {shop.categories.map((c, k) => (
        <div key={c.id} className="shm-cat">
          <span className="shm-thumb">{c.image ? <img src={c.image} alt="" /> : "🗂"}</span>
          <input value={c.name} maxLength={60} onChange={(e) => update(c.id, { name: e.target.value })} aria-label="نام دسته" />
          <small className="muted">{showNumber(count(c.id))} محصول</small>
          <ImagePicker value={c.image} onChange={(url) => update(c.id, { image: url })} />
          {services && !c.sell && (
            <textarea className="shm-cat-text" value={c.text ?? ""} maxLength={1500} rows={2} placeholder="توضیح این خدمت (در صفحه‌ی خدمت نمایش داده می‌شود)" onChange={(e) => update(c.id, { text: e.target.value || undefined })} />
          )}
          {sells && (
            <label className="shm-sell">
              <input type="checkbox" checked={Boolean(c.sell)} onChange={(e) => update(c.id, { sell: e.target.checked || undefined })} />
              فروش آنلاین
            </label>
          )}
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
      {(shop.bandItems !== undefined || shop.lookTitle !== undefined) && (
        <>
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
        </>
      )}
      {/* Each template uses some of these sections; show only the ones this shop has. */}
      {(shop.banners !== undefined || shop.showcaseTitle !== undefined || shop.bestTitle !== undefined) && (
        <>
          <h3>بنرهای تبلیغاتی و ویترین</h3>
          <AdBanners shop={shop} setShop={setShop} />
        </>
      )}
      {(shop.lookTitle !== undefined || shop.lookImage !== undefined || shop.lookSpots !== undefined) && (
        <>
          <h3>بخش عکس با نقطه‌های محصول</h3>
          <LookSpots shop={shop} setShop={setShop} />
        </>
      )}
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
            {shop.products.filter((p) => !p.trashed).map((p) => (
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
            {shop.products.filter((p) => !p.trashed).map((p) => (
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
