/** @jsxRuntime automatic @jsxImportSource react */
// Shop pieces shared by every shop template: choosing colour/size, the discount-code box, star
// ratings, product comments and the customer account page. They work without scripts (plain
// forms posting to the server). Each template sets the --sk-* colours so they match its look.

import { SHOP_ORDER_STATUS_LABELS, allVariantKeys, formatToman, productOptions, saleEnded, unitPrice, variantOf, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { safeUrl } from "../format";
import { Opt, PageLink, ed, item, outside } from "./parts";

type Link = (p: string) => string;
type Base = { link: Link; page: string; visitor: Visitor };

const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
const date = (iso: string) => new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(iso));

/** Radio groups for the product's options (colour swatches or labels), named opt0 / opt1 for the cart form. */
export function OptionPicker({ p }: { p: Product }) {
  const opts = productOptions(p);
  if (!opts.length) return null;
  // Start on the first combination that is still in stock.
  const first = allVariantKeys(p).find((k) => variantOf(p, k).stock !== 0)?.split(" / ") ?? [];
  return (
    <>
      {opts.map((o, k) => {
        const swatch = o.values.some((v) => v.color);
        return (
          <fieldset key={o.name + k} className={`sk-opt${swatch ? " swatch" : ""}`}>
            <legend>{o.name}:</legend>
            {o.values.map((v, j) => (
              <label key={v.label} title={v.label}>
                <input type="radio" name={`opt${k}`} value={v.label} defaultChecked={first[k] ? first[k] === v.label : j === 0} />
                {swatch ? (
                  <>
                    <i style={{ background: v.color ?? "#ddd" }} />
                    <small>{v.label}</small>
                  </>
                ) : (
                  <span>{v.label}</span>
                )}
              </label>
            ))}
          </fieldset>
        );
      })}
      <VariantTable p={p} />
    </>
  );
}

/** When combinations have their own prices or stock, a small table shows them. */
function VariantTable({ p }: { p: Product }) {
  const keys = allVariantKeys(p);
  const rows = keys.map((k) => ({ k, ...variantOf(p, k) }));
  if (!p.variants?.length || rows.every((r) => r.unit === rows[0]!.unit && r.stock === undefined)) return null;
  return (
    <table className="sk-variants">
      <tbody>
        {rows.map((r) => (
          <tr key={r.k} className={r.stock === 0 ? "out" : undefined}>
            <td>{r.k}</td>
            <td>{formatToman(r.unit)}</td>
            <td>{r.stock === 0 ? "ناموجود" : r.stock !== undefined ? `${fa(r.stock)} عدد` : "موجود"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Products with choices are added from their own page (the visitor picks first). */
export const hasChoices = (p: Product) => productOptions(p).length > 0;

/** Discount-code box of the cart: apply, see the result, or remove it. */
export function CouponBox({ link, page, visitor, applied, error }: Base & { applied?: string; error?: string | null }) {
  return (
    <form method="post" action={link("/_cart")} className="sk-coupon">
      <input type="hidden" name="op" value="coupon" />
      <input type="hidden" name="back" value={page} />
      {applied ? (
        <>
          <span className="sk-ok">کد «{applied}» اعمال شد.</span>
          <input type="hidden" name="code" value="" />
          <button type="submit">حذف کد</button>
        </>
      ) : (
        <>
          <input name="code" defaultValue={visitor.coupon} placeholder="کد تخفیف دارید؟" aria-label="کد تخفیف" dir="ltr" />
          <button type="submit">اعمال</button>
          {error && <span className="sk-err">{error}</span>}
        </>
      )}
    </form>
  );
}

const STAR = "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z";

/** Five stars filled up to `value` (rounded to halves). */
export function Stars({ value, count }: { value: number; count?: number }) {
  const v = Math.round(value * 2) / 2;
  return (
    <span className="sk-stars" title={`${fa(Math.round(value * 10) / 10)} از ۵`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} viewBox="0 0 24 24" aria-hidden="true" className={s <= v ? "on" : s - 0.5 === v ? "half" : undefined}>
          <path d={STAR} />
        </svg>
      ))}
      {count !== undefined && <small>({fa(count)})</small>}
    </span>
  );
}

/** Comments under a product: summary, approved comments, and a form for signed-in customers. */
export function Reviews({ p, link, visitor }: Base & { p: Product }) {
  const list = visitor.reviews ?? [];
  const r = visitor.ratings?.[p.id];
  const msg = visitor.query.msg;
  const error = visitor.query.error;
  return (
    <section className="sk-reviews" id="sk-reviews">
      <h2>
        نظرات کاربران {r && <Stars value={r.avg} count={r.count} />}
      </h2>
      {msg && <p className="sk-ok">{msg}</p>}
      {error && <p className="sk-err">{error}</p>}
      {list.length === 0 && <p className="sk-muted">هنوز نظری برای این محصول ثبت نشده است.</p>}
      {list.map((x) => (
        <article key={x.id} className="sk-review">
          <header>
            <b>{x.name}</b>
            <Stars value={x.rating} />
            <small>{date(x.at)}</small>
          </header>
          <p>{x.text}</p>
          {x.reply && (
            <p className="sk-reply">
              <b>پاسخ فروشگاه:</b> {x.reply}
            </p>
          )}
        </article>
      ))}
      {visitor.customer ? (
        <form method="post" action={link("/_account")} className="sk-form">
          <input type="hidden" name="op" value="review" />
          <input type="hidden" name="productId" value={p.id} />
          <fieldset className="sk-rate">
            <legend>امتیاز شما:</legend>
            {[5, 4, 3, 2, 1].map((n) => (
              <label key={n} title={`${fa(n)} ستاره`}>
                <input type="radio" name="rating" value={n} defaultChecked={n === 5} />
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={STAR} />
                </svg>
              </label>
            ))}
          </fieldset>
          <textarea name="text" required minLength={3} maxLength={1000} rows={3} placeholder="نظر خود را درباره‌ی این محصول بنویسید..." aria-label="متن نظر" />
          <button type="submit" className="sk-btn">
            ثبت نظر
          </button>
        </form>
      ) : (
        <p className="sk-muted">
          برای ثبت نظر{" "}
          <PageLink to="/account" link={link}>
            وارد حساب خود شوید
          </PageLink>
          .
        </p>
      )}
    </section>
  );
}

/** Customer account: sign in / sign up, or the customer's orders, addresses and support tickets. */
export function AccountPage({ link, visitor }: Base) {
  const c = visitor.customer;
  const msg = visitor.query.msg;
  const error = visitor.query.error;
  const notes = (
    <>
      {msg && <p className="sk-ok">{msg}</p>}
      {error && <p className="sk-err">{error}</p>}
    </>
  );
  if (!c)
    return (
      <div className="sk-account">
        {notes}
        <div className="sk-two">
          <form method="post" action={link("/_account")} className="sk-card sk-form">
            <h2>ورود</h2>
            <input type="hidden" name="op" value="login" />
            <label>
              شماره‌ی موبایل
              <input name="phone" required inputMode="tel" dir="ltr" autoComplete="tel" placeholder="09xx xxx xxxx" />
            </label>
            <label>
              رمز عبور
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
            <button type="submit" className="sk-btn">
              ورود
            </button>
          </form>
          <form method="post" action={link("/_account")} className="sk-card sk-form">
            <h2>ثبت‌نام</h2>
            <input type="hidden" name="op" value="register" />
            <label>
              نام و نام خانوادگی
              <input name="name" required maxLength={80} autoComplete="name" />
            </label>
            <label>
              شماره‌ی موبایل
              <input name="phone" required inputMode="tel" dir="ltr" autoComplete="tel" placeholder="09xx xxx xxxx" />
            </label>
            <label>
              رمز عبور (دست‌کم ۶ نویسه)
              <input name="password" type="password" required minLength={6} autoComplete="new-password" />
            </label>
            <button type="submit" className="sk-btn">
              ساخت حساب
            </button>
          </form>
        </div>
      </div>
    );
  const acc = visitor.account ?? { orders: [], addresses: [], tickets: [] };
  const open = visitor.query.t;
  return (
    <div className="sk-account">
      {notes}
      <div className="sk-card sk-hello">
        <div>
          <h2>سلام، {c.name}</h2>
          <small dir="ltr">{c.phone}</small>
        </div>
        <form method="post" action={link("/_account")}>
          <input type="hidden" name="op" value="logout" />
          <button type="submit" className="sk-link">
            خروج از حساب
          </button>
        </form>
      </div>

      <section className="sk-card">
        <h2>سفارش‌های من</h2>
        {acc.orders.length === 0 ? (
          <p className="sk-muted">هنوز سفارشی ثبت نکرده‌اید.</p>
        ) : (
          <table className="sk-orders">
            <thead>
              <tr>
                <th>کد پیگیری</th>
                <th>تاریخ</th>
                <th>کالاها</th>
                <th>مبلغ</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {acc.orders.map((o) => (
                <tr key={o.code}>
                  <td dir="ltr">#{o.code}</td>
                  <td>{date(o.at)}</td>
                  <td>{o.items.map((i) => `${i.name}${i.size ? ` (${i.size})` : ""} × ${fa(i.qty)}`).join("، ")}</td>
                  <td>{formatToman(o.total)}</td>
                  <td>
                    <span className={`sk-status st-${o.status.toLowerCase()}`}>{SHOP_ORDER_STATUS_LABELS[o.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="sk-card">
        <h2>نشانی‌های من</h2>
        {acc.addresses.map((a) => (
          <div key={a.id} className="sk-address">
            <p>
              {a.title && <b>{a.title}: </b>}
              {[a.city, a.address].filter(Boolean).join("، ")}
              {a.postalCode && ` · کد پستی ${a.postalCode}`}
            </p>
            <form method="post" action={link("/_account")}>
              <input type="hidden" name="op" value="address-remove" />
              <input type="hidden" name="id" value={a.id} />
              <button type="submit" className="sk-link">
                حذف
              </button>
            </form>
          </div>
        ))}
        <details className="sk-more">
          <summary>+ افزودن نشانی</summary>
          <form method="post" action={link("/_account")} className="sk-form sk-grid">
            <input type="hidden" name="op" value="address-add" />
            <label>
              عنوان (مثلاً خانه)
              <input name="title" maxLength={40} />
            </label>
            <label>
              شهر
              <input name="city" maxLength={60} />
            </label>
            <label className="full">
              نشانی کامل
              <textarea name="address" required maxLength={400} rows={2} />
            </label>
            <label>
              کد پستی
              <input name="postalCode" maxLength={20} inputMode="numeric" dir="ltr" />
            </label>
            <button type="submit" className="sk-btn">
              ذخیره‌ی نشانی
            </button>
          </form>
        </details>
      </section>

      <section className="sk-card">
        <h2>پشتیبانی</h2>
        {acc.tickets.map((t) => (
          <details key={t.id} className="sk-ticket" open={open === t.id}>
            <summary>
              <b>{t.subject}</b>
              <span className={`sk-status tk-${t.status.toLowerCase()}`}>{t.status === "OPEN" ? "در انتظار پاسخ" : t.status === "ANSWERED" ? "پاسخ داده شد" : "بسته شد"}</span>
            </summary>
            {t.messages.map((m, k) => (
              <p key={k} className={`sk-msg ${m.from}`}>
                {m.text}
                <small>
                  {m.from === "shop" ? "فروشگاه" : "شما"} · {date(m.at)}
                </small>
              </p>
            ))}
            {t.status !== "CLOSED" && (
              <form method="post" action={link("/_account")} className="sk-form">
                <input type="hidden" name="op" value="ticket-reply" />
                <input type="hidden" name="ticketId" value={t.id} />
                <textarea name="text" required maxLength={2000} rows={2} placeholder="پاسخ شما..." aria-label="پاسخ" />
                <button type="submit" className="sk-btn">
                  ارسال
                </button>
              </form>
            )}
          </details>
        ))}
        <details className="sk-more">
          <summary>+ تیکت جدید</summary>
          <form method="post" action={link("/_account")} className="sk-form">
            <input type="hidden" name="op" value="ticket-new" />
            <label>
              موضوع
              <input name="subject" required maxLength={120} />
            </label>
            <label>
              پیام
              <textarea name="text" required maxLength={2000} rows={3} />
            </label>
            <button type="submit" className="sk-btn">
              ارسال تیکت
            </button>
          </form>
        </details>
      </section>
    </div>
  );
}

/** Styles of the shared pieces; colours come from the template (--sk-accent, --sk-card, --sk-line…). */
/* ───────────── Sales, filters and specifications ───────────── */

export const onSale = (p: Product) => unitPrice(p) < p.price;
/** Whole percent off the regular price. */
export const percentOff = (p: Product) => Math.round((1 - unitPrice(p) / p.price) * 100);

/** Days, hours and minutes until a time (zero once it has passed). */
export function timeLeft(end: string) {
  const ms = Math.max(0, Date.parse(end) - Date.now());
  const m = Math.floor(ms / 60000);
  return { d: Math.floor(m / 1440), h: Math.floor((m % 1440) / 60), m: m % 60 };
}
/** Products on sale, the ones ending soonest first. */
export function saleProducts(products: Product[]): Product[] {
  const end = (p: Product) => (p.saleEndsAt && !saleEnded(p) ? Date.parse(p.saleEndsAt) : Infinity);
  return products.filter(onSale).sort((a, b) => end(a) - end(b) || percentOff(b) - percentOff(a));
}

export const SORTS: [string, string][] = [
  ["new", "جدیدترین"],
  ["cheap", "ارزان‌ترین"],
  ["dear", "گران‌ترین"],
  ["sale", "بیشترین تخفیف"],
];

/** A whole number typed with Persian or Latin digits and separators. */
const readAmount = (v?: string) => {
  const d = (v ?? "").replace(/[۰-۹]/g, (x) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(x))).replace(/\D/g, "");
  return d ? Number(d) : undefined;
};

/**
 * The shop page's filters from the address (?q, cat, min, max, sale, stock, sort): the products that
 * match, the categories that have products, and the chosen category.
 */
export function filterProducts(products: Product[], categories: Shop["categories"], query: Record<string, string>, categoryId?: string) {
  const cats = categories.filter((c) => products.some((p) => p.categoryId === c.id));
  const cat = cats.find((c) => c.id === (categoryId ?? query.cat));
  const min = readAmount(query.min);
  const max = readAmount(query.max);
  const words = (query.q ?? "").trim().split(/\s+/).filter(Boolean);
  let list = products.filter(
    (p) =>
      (!cat || p.categoryId === cat.id) &&
      (min === undefined || unitPrice(p) >= min) &&
      (max === undefined || unitPrice(p) <= max) &&
      (!query.sale || onSale(p)) &&
      (!query.stock || p.stock !== 0) &&
      words.every((w) => `${p.name} ${p.description ?? ""}`.includes(w)),
  );
  if (query.sort === "cheap") list = [...list].sort((a, b) => unitPrice(a) - unitPrice(b));
  else if (query.sort === "dear") list = [...list].sort((a, b) => unitPrice(b) - unitPrice(a));
  else if (query.sort === "sale") list = [...list].sort((a, b) => (onSale(b) ? percentOff(b) : 0) - (onSale(a) ? percentOff(a) : 0));
  const active = ["q", "min", "max", "sale", "stock"].some((k) => query[k]) || Boolean(!categoryId && query.cat) || (query.sort ?? "new") !== "new";
  return { list, cats, cat, active };
}

/**
 * The filter form of a shop page (no script: it sends a normal GET form to the same page).
 * `className` styles it per template; the fields share the --sk-* colors.
 */
export function FilterForm({ link, here, query, cats, fixedCategory, className, submitClass, resetClass }: { link: Link; here: string; query: Record<string, string>; cats: Shop["categories"]; fixedCategory?: boolean; className?: string; submitClass?: string; resetClass?: string }) {
  return (
    <form method="get" action={link(here)} className={`sk-filters ${className ?? ""}`}>
      <label>
        مرتب‌سازی
        <select name="sort" defaultValue={query.sort ?? "new"}>
          {SORTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label>
        جست‌وجو
        <input name="q" defaultValue={query.q} placeholder="نام محصول..." />
      </label>
      {!fixedCategory && cats.length > 0 && (
        <label>
          دسته‌بندی
          <select name="cat" defaultValue={query.cat ?? ""}>
            <option value="">همه</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <fieldset>
        <legend>محدوده‌ی قیمت (تومان)</legend>
        <input name="min" inputMode="numeric" defaultValue={query.min} placeholder="از" aria-label="کمترین قیمت" />
        <input name="max" inputMode="numeric" defaultValue={query.max} placeholder="تا" aria-label="بیشترین قیمت" />
      </fieldset>
      <label className="sk-check">
        <input type="checkbox" name="sale" value="1" defaultChecked={Boolean(query.sale)} /> فقط تخفیف‌دارها
      </label>
      <label className="sk-check">
        <input type="checkbox" name="stock" value="1" defaultChecked={Boolean(query.stock)} /> فقط کالاهای موجود
      </label>
      <button type="submit" className={submitClass ?? "sk-btn"}>
        اعمال فیلترها
      </button>
      <PageLink to={here} link={link} className={resetClass ?? "sk-link"}>
        حذف همه‌ی فیلترها
      </PageLink>
    </form>
  );
}

/** The specification table of a product page (brand, size, weight…). */
export function SpecsTable({ p, className }: { p: Product; className?: string }) {
  const specs = (p.specs ?? []).filter((s) => s.label.trim() && s.value.trim());
  if (!specs.length) return null;
  return (
    <section className={`sk-specs ${className ?? ""}`}>
      <h2>مشخصات</h2>
      <dl>
        {specs.map((s, k) => (
          <div key={k}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ───────────── Contact, questions and text pages ───────────── */

const visiblePages = (shop: Shop | undefined) => (shop?.pages ?? []).filter((p) => !p.hidden && p.title.trim());
const answered = (shop: Shop | undefined) => (shop?.faq ?? []).filter((x) => x.q.trim() && x.a.trim());

/** The extra pages a shop has: contact always, questions and text pages when written. */
export function infoPages(shop: Shop | undefined): string[] {
  return ["/contact", ...(answered(shop).length ? ["/faq"] : []), ...visiblePages(shop).map((p) => `/page/${p.slug}`)];
}

/** Footer links to the questions and text pages. */
export function InfoLinks({ shop, link }: { shop: Shop | undefined; link: Link }) {
  return (
    <>
      <PageLink to="/contact" link={link}>
        تماس با ما
      </PageLink>
      {answered(shop).length > 0 && (
        <PageLink to="/faq" link={link}>
          سؤالات متداول
        </PageLink>
      )}
      {visiblePages(shop).map((p) => (
        <PageLink key={p.id} to={`/page/${p.slug}`} link={link}>
          {p.title}
        </PageLink>
      ))}
    </>
  );
}

/** Paragraphs from plain text; blank lines separate them. */
const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x, k) => <p key={k}>{x}</p>);

/** The contact page, the questions page or a text page; null for other paths. */
export function InfoPage({ data, page, link, editing }: { data: ResumeData; page: string; link: Link; editing: boolean }) {
  const shop = data.site?.shop;
  const site = data.site;
  const b = data.basics;
  if (page === "/contact") {
    const map = safeUrl(site?.mapUrl);
    const phone = b.phone?.replace(/[^\d+]/g, "");
    return (
      <div className="sk-info">
        <h1>تماس با ما</h1>
        <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن صفحه‌ی تماس")}>
          <p className="sk-muted" {...ed("site.contactText", "multiline", "متن صفحه‌ی تماس")}>
            {site?.contactText}
          </p>
        </Opt>
        <div className="sk-contact">
          <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <div className="sk-card">
              <small className="sk-muted">نشانی</small>
              <b {...ed("site.address", "text", "نشانی")}>{site?.address}</b>
              {map && (
                <a className="sk-btn" href={map} {...outside(map)}>
                  مسیریابی روی نقشه
                </a>
              )}
            </div>
          </Opt>
          {b.phone && (
            <div className="sk-card">
              <small className="sk-muted">تلفن</small>
              <a href={`tel:${phone}`} {...ed("basics.phone", "text", "تلفن")}>
                <b dir="ltr">{b.phone}</b>
              </a>
            </div>
          )}
          {b.email && (
            <div className="sk-card">
              <small className="sk-muted">ایمیل</small>
              <a href={`mailto:${b.email}`} {...ed("basics.email", "text", "ایمیل")}>
                <b dir="ltr">{b.email}</b>
              </a>
            </div>
          )}
          <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "text", "ساعت کاری")}>
            <div className="sk-card">
              <small className="sk-muted">ساعت کاری</small>
              <b {...ed("site.contactNote", "text", "ساعت کاری")}>{site?.contactNote}</b>
            </div>
          </Opt>
        </div>
        <div className="sk-card sk-help">
          <b>پیگیری سفارش یا سؤال درباره‌ی خرید؟</b>
          <span className="sk-muted">از صفحه‌ی «حساب من» تیکت پشتیبانی بفرستید تا پاسخ را همان‌جا ببینید.</span>
          <PageLink to="/account" link={link} className="sk-btn">
            حساب من و تیکت‌ها
          </PageLink>
          {answered(shop).length > 0 && (
            <PageLink to="/faq" link={link} className="sk-link">
              شاید جواب‌تان در سؤالات متداول باشد
            </PageLink>
          )}
        </div>
      </div>
    );
  }
  if (page === "/faq") {
    return (
      <div className="sk-info">
        <h1>{shop?.faqTitle?.trim() || "سؤالات متداول"}</h1>
        <div className="sk-faq">
          {answered(shop).map((x, k) => (
            <details key={x.id} open={k === 0}>
              <summary {...ed(`${item("site.shop.faq", x.id)}.q`, "text", "سؤال")}>{x.q}</summary>
              <div {...ed(`${item("site.shop.faq", x.id)}.a`, "multiline", "پاسخ")}>{paragraphs(x.a)}</div>
            </details>
          ))}
        </div>
        <p className="sk-muted">
          جوابتان را پیدا نکردید؟{" "}
          <PageLink to="/contact" link={link} className="sk-link">
            با ما تماس بگیرید
          </PageLink>
        </p>
      </div>
    );
  }
  const textPage = visiblePages(shop).find((p) => `/page/${p.slug}` === page);
  if (textPage) {
    return (
      <article className="sk-info sk-text">
        <h1 {...ed(`${item("site.shop.pages", textPage.id)}.title`, "text", "عنوان صفحه")}>{textPage.title}</h1>
        <div {...ed(`${item("site.shop.pages", textPage.id)}.text`, "multiline", "متن صفحه")}>{paragraphs(textPage.text)}</div>
      </article>
    );
  }
  return null;
}

export const shopkitCss = /* css */ `
/* Filters and specifications */
.sk-filters { display: grid; gap: 14px; align-content: start; }
.sk-filters label, .sk-filters fieldset { display: grid; gap: 6px; font-size: .9em; font-weight: 600; }
.sk-filters fieldset { grid-template-columns: 1fr 1fr; margin: 0; padding: 0; border: 0; }
.sk-filters legend { grid-column: 1 / -1; margin-bottom: 6px; padding: 0; }
.sk-filters input:not([type=checkbox]), .sk-filters select { width: 100%; min-width: 0; padding: 10px 12px; border: 1px solid var(--sk-line, #E5E5E5); border-radius: var(--sk-radius, 10px); background: var(--sk-card, #fff); color: inherit; font: inherit; font-weight: 400; }
.sk-filters .sk-check { display: flex; align-items: center; gap: 8px; font-weight: 400; cursor: pointer; }
.sk-filters .sk-check input { width: 17px; height: 17px; accent-color: var(--sk-accent, #111); }
.sk-specs h2 { margin: 0 0 10px; font-size: 1.1em; }
.sk-specs dl { display: grid; margin: 0; border: 1px solid var(--sk-line, #EEE); border-radius: var(--sk-card-radius, 12px); overflow: hidden; }
.sk-specs dl > div { display: grid; grid-template-columns: minmax(110px, 34%) 1fr; }
.sk-specs dl > div:nth-child(odd) { background: var(--sk-soft, #F7F7F7); }
.sk-specs dt, .sk-specs dd { margin: 0; padding: 11px 14px; font-size: .92em; }
.sk-specs dt { color: var(--sk-muted, #6B7280); }

/* Contact, questions and text pages */
.sk-info { display: grid; gap: 18px; max-width: 880px; margin-inline: auto; padding-block: clamp(18px, 3cqi, 36px); }
.sk-info h1 { margin: 0; font-size: clamp(1.4em, 3cqi, 2em); }
.sk-info p { margin: 0; line-height: 2; }
.sk-contact { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
.sk-info .sk-btn { color: #fff !important; text-decoration: none; }
.sk-contact .sk-card { display: grid; gap: 8px; align-content: start; }
.sk-contact a { color: inherit; text-decoration: none; }
.sk-contact .sk-btn { color: #fff; margin-top: 4px; }
.sk-help { display: grid; gap: 10px; justify-items: start; }
.sk-faq { display: grid; gap: 10px; }
.sk-faq details { border: 1px solid var(--sk-line, #EEE); border-radius: var(--sk-card-radius, 14px); background: var(--sk-card, #fff); overflow: hidden; }
.sk-faq summary { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px 18px; font-weight: 700; cursor: pointer; list-style: none; }
.sk-faq summary::-webkit-details-marker { display: none; }
.sk-faq summary::after { content: "+"; flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--sk-soft, #F5F5F5); color: var(--sk-accent, #111); font-size: 1.1em; transition: transform .25s; }
.sk-faq details[open] summary::after { transform: rotate(45deg); }
.sk-faq details > div { display: grid; gap: 10px; padding: 0 18px 18px; color: var(--sk-muted, #6B7280); }
.sk-text > div { display: grid; gap: 14px; }

.sk-muted { color: var(--sk-muted, #6B7280); }
.sk-ok { padding: 10px 14px; border-radius: 10px; background: #F0FDF4; color: #15803D; }
.sk-err { padding: 10px 14px; border-radius: 10px; background: #FEF2F2; color: #B91C1C; }
.sk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 11px 22px; border: none; border-radius: var(--sk-radius, 999px); background: var(--sk-accent, #111); color: #fff; font: inherit; font-weight: 700; cursor: pointer; justify-self: start; }
.sk-btn:hover { filter: brightness(1.1); }
.sk-link { padding: 0; border: none; background: none; color: var(--sk-accent, #111); font: inherit; text-decoration: underline; cursor: pointer; }
.sk-card { padding: 20px; border: 1px solid var(--sk-line, #EEE); border-radius: var(--sk-card-radius, 14px); background: var(--sk-card, #fff); }
.sk-card h2 { margin-bottom: 12px; font-size: 1.1em; }
.sk-form { display: grid; gap: 12px; }
.sk-form label { display: grid; gap: 6px; color: var(--sk-muted, #6B7280); font-size: .9em; }
.sk-form input:not([type="radio"]), .sk-form textarea, .sk-coupon input { width: 100%; padding: 10px 12px; border: 1px solid var(--sk-line, #E5E7EB); border-radius: 10px; background: #fff; color: inherit; font: inherit; }
.sk-form input:focus, .sk-form textarea:focus, .sk-coupon input:focus { outline: none; border-color: var(--sk-accent, #111); }
.sk-grid { grid-template-columns: 1fr 1fr; }
.sk-grid .full { grid-column: 1 / -1; }

/* Options: colour swatches or labels */
.sk-opt { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0; padding: 0; border: none; }
.sk-opt legend { float: inline-start; margin-inline-end: 6px; color: var(--sk-muted, #6B7280); font-size: .9em; }
.sk-opt label { position: relative; display: grid; justify-items: center; gap: 4px; cursor: pointer; }
.sk-opt input { position: absolute; opacity: 0; pointer-events: none; }
.sk-opt span { padding: 7px 16px; border: 1.5px solid var(--sk-line, #E5E7EB); border-radius: 10px; font-size: .88em; font-weight: 700; transition: all .2s; }
.sk-opt input:checked + span { border-color: var(--sk-accent, #111); background: var(--sk-accent, #111); color: #fff; }
.sk-opt.swatch i { width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgb(0 0 0 / .15); box-shadow: inset 0 0 0 3px #fff; transition: box-shadow .2s; }
.sk-opt.swatch input:checked ~ i { box-shadow: inset 0 0 0 3px #fff, 0 0 0 2px var(--sk-accent, #111); }
.sk-opt.swatch small { color: var(--sk-muted, #6B7280); font-size: .74em; }
.sk-opt.swatch input:checked ~ small { color: var(--sk-accent, #111); font-weight: 700; }
.sk-opt input:focus-visible + span, .sk-opt input:focus-visible ~ i { outline: 2px solid var(--sk-accent, #111); outline-offset: 2px; }
.sk-variants { width: 100%; border-collapse: collapse; font-size: .82em; }
.sk-variants td { padding: 6px 8px; border-bottom: 1px solid var(--sk-line, #EEE); }
.sk-variants tr.out { color: #9CA3AF; text-decoration: line-through; }

/* Discount code */
.sk-coupon { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.sk-coupon input { flex: 1; min-width: 0; }
.sk-coupon button { padding: 10px 16px; border: 1px solid var(--sk-accent, #111); border-radius: 10px; background: #fff; color: var(--sk-accent, #111); font: inherit; font-weight: 700; cursor: pointer; }
.sk-coupon .sk-ok, .sk-coupon .sk-err { flex-basis: 100%; padding: 6px 10px; font-size: .85em; }

/* Stars */
.sk-stars { display: inline-flex; align-items: center; gap: 1px; color: #F59E0B; vertical-align: middle; }
.sk-stars svg { width: 15px; height: 15px; fill: #E5E7EB; }
.sk-stars svg.on { fill: currentColor; }
.sk-stars svg.half { fill: currentColor; opacity: .5; }
.sk-stars small { margin-inline-start: 4px; color: var(--sk-muted, #6B7280); font-size: .8em; }

/* Comments */
.sk-reviews { display: grid; gap: 14px; padding: 22px; border-radius: var(--sk-card-radius, 14px); background: var(--sk-card, #fff); border: 1px solid var(--sk-line, #EEE); }
.sk-reviews h2 { display: flex; align-items: center; gap: 10px; font-size: 1.15em; }
.sk-review { padding: 12px 0; border-top: 1px solid var(--sk-line, #EEE); }
.sk-review header { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 6px; }
.sk-review header small { color: var(--sk-muted, #6B7280); }
.sk-review p { line-height: 1.9; }
.sk-reply { margin-top: 8px; padding: 10px 12px; border-radius: 10px; background: var(--sk-soft, #F7F7F7); font-size: .92em; }
.sk-rate { display: flex; flex-direction: row-reverse; justify-content: flex-end; gap: 2px; margin: 0; padding: 0; border: none; }
.sk-rate legend { float: inline-start; margin-inline-end: 8px; color: var(--sk-muted, #6B7280); font-size: .9em; }
.sk-rate label { position: relative; cursor: pointer; }
.sk-rate input { position: absolute; opacity: 0; }
.sk-rate svg { width: 26px; height: 26px; fill: #E5E7EB; transition: fill .15s; }
.sk-rate label:has(input:checked) svg, .sk-rate label:has(input:checked) ~ label svg, .sk-rate label:hover svg, .sk-rate label:hover ~ label svg { fill: #F59E0B; }

/* Account */
.sk-account { display: grid; gap: 18px; }
.sk-two { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.sk-hello { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sk-hello h2 { margin: 0; }
.sk-orders { width: 100%; border-collapse: collapse; font-size: .88em; }
.sk-orders th { padding: 8px; color: var(--sk-muted, #6B7280); font-weight: 600; text-align: start; border-bottom: 1px solid var(--sk-line, #EEE); }
.sk-orders td { padding: 10px 8px; border-bottom: 1px solid var(--sk-line, #EEE); vertical-align: top; }
.sk-status { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #EEF2FF; color: #3730A3; font-size: .85em; white-space: nowrap; }
.sk-status.st-new, .sk-status.tk-open { background: #FEF3C7; color: #92400E; }
.sk-status.st-done, .sk-status.tk-answered { background: #DCFCE7; color: #166534; }
.sk-status.st-canceled, .sk-status.tk-closed { background: #F3F4F6; color: #6B7280; }
.sk-address { display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--sk-line, #EEE); }
.sk-more { margin-top: 12px; }
.sk-more > summary { color: var(--sk-accent, #111); font-weight: 700; cursor: pointer; }
.sk-more > form { margin-top: 12px; }
.sk-ticket { padding: 10px 0; border-bottom: 1px solid var(--sk-line, #EEE); }
.sk-ticket > summary { display: flex; justify-content: space-between; gap: 10px; cursor: pointer; }
.sk-msg { margin: 8px 0; padding: 10px 12px; border-radius: 12px; background: var(--sk-soft, #F7F7F7); line-height: 1.9; }
.sk-msg.shop { background: color-mix(in srgb, var(--sk-accent, #111) 8%, #fff); }
.sk-msg small { display: block; color: var(--sk-muted, #6B7280); font-size: .78em; }
@container (max-width: 700px) {
  .sk-two, .sk-grid { grid-template-columns: 1fr; }
  .sk-orders thead { display: none; }
  .sk-orders tr { display: grid; grid-template-columns: 1fr auto; gap: 4px 10px; padding: 10px 0; border-bottom: 1px solid var(--sk-line, #EEE); }
  .sk-orders td { padding: 0; border: none; }
  .sk-orders td:nth-child(3) { grid-column: 1 / -1; color: var(--sk-muted, #6B7280); }
}
`;

