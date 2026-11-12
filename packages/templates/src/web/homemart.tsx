/** @jsxRuntime automatic @jsxImportSource react */
// "HomeMart": a home-goods shop in burgundy and cream, rebuilt from the user's own earlier shop.
// Burgundy gradient header, hero, best sellers with category pills, wide and paired banners,
// timed offers with a countdown, customer comments, a chosen-category showcase, newsletter and a
// four-column footer; shop page with filters, product page with gallery and options, cart and
// checkout. Published pages run without scripts: pills, sliders and gallery use radio buttons.

import type { ReactNode } from "react";
import { emptyVisitor, formatToman, priceCart, saleEnded, unitPrice, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { FormMeta, Icon, Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { AccountPage, CouponBox, InfoLinks, InfoPage, OptionPicker, Reviews, SORTS, Stars, filterProducts, infoPages, onSale, percentOff, shopkitCss, timeLeft } from "./shopkit";

/** Home page sections the user can switch off. */
export const HOMEMART_BLOCKS = [
  { key: "best", label: "پرفروش‌ترین محصولات" },
  { key: "banners", label: "بنرهای تبلیغاتی" },
  { key: "offers", label: "تخفیف‌های ویژه" },
  { key: "testimonials", label: "نظرات مشتریان" },
  { key: "showcase", label: "محصولات یک دسته‌ی منتخب" },
  { key: "newsletter", label: "خبرنامه" },
] as const;

const visible = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());

export function homemartPages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const products = visible(shop);
  const cats = (shop?.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
  return ["/", "/shop", ...cats.map((c) => `/category/${c.id}`), ...products.map((p) => `/product/${p.id}`), "/cart", "/wishlist", "/search", "/checkout", "/thanks", "/account", ...infoPages(shop)];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; visitor: Visitor; page: string };

export function HomeMartShop(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = homemartPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), visitor: props.visitor ?? emptyVisitor(), page };
  const [kind, id] = page.split("/").filter(Boolean);
  let body: ReactNode;
  if (page === "/") body = <Home {...view} />;
  else if (kind === "shop") body = <Listing {...view} />;
  else if (kind === "category") body = <Listing {...view} categoryId={id} />;
  else if (kind === "product") body = <ProductPage {...view} id={id!} />;
  else if (kind === "cart") body = <Cart {...view} />;
  else if (kind === "wishlist") body = <Wishlist {...view} />;
  else if (kind === "search") body = <Search {...view} />;
  else if (kind === "checkout") body = <Checkout {...view} />;
  else if (kind === "account") body = <Account {...view} />;
  else if (kind === "thanks") body = <Thanks {...view} />;
  else
    body = (
      <div className="hm-wrap">
        <InfoPage data={ctx.data} page={page} link={view.link} editing={view.editing} visitor={view.visitor} />
      </div>
    );
  return (
    <WebPage ctx={ctx} className="hm" css={partsCss + shopkitCss + css}>
      <Header {...view} />
      <main className={`hm-main${page === "/" ? " home" : ""}`} key={page}>
        {body}
      </main>
      <Footer {...view} />
      <BottomNav {...view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const SVG: Record<string, string> = {
  cart: "M3 4h2l2.4 11h10.2L20 7H6.3 M9 20a1.2 1.2 0 1 0 0-.1 M17 20a1.2 1.2 0 1 0 0-.1",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M16 16l4.5 4.5",
  heart: "M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.4 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z",
  user: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4.5 20.5a7.5 7.5 0 0 1 15 0",
  chat: "M4 5h16v11H9l-5 4z M8 9.5h8 M8 12.5h5",
  home: "M4 11l8-7 8 7 M6 9.5V20h12V9.5 M10 20v-5h4v5",
  bag: "M5.5 8h13l-1 12h-11z M9 8V6.5a3 3 0 0 1 6 0V8",
  trash: "M5 7h14 M10 7V5h4v2 M7 7l1 13h8l1-13",
  clock: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 8v4l3 2",
  left: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  shield: "M12 3l7.5 3v5.5c0 4.6-3.2 7.9-7.5 9.5-4.3-1.6-7.5-4.9-7.5-9.5V6z M9 12l2 2 4-4",
  truck: "M3 7h11v9H3z M14 10h4l3 3v3h-7 M7 19a1.5 1.5 0 1 0 0-.1 M17 19a1.5 1.5 0 1 0 0-.1",
  phone: "M6 3h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z",
  mail: "M4 6h16v12H4z M4 7l8 6 8-6",
  pin: "M12 21s-7-6-7-11a7 7 0 1 1 14 0c0 5-7 11-7 11z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  quote: "M7 7h4v5H8c0 2 1 3 3 3v2c-3 0-5-2-5-5V8z M14 7h4v5h-3c0 2 1 3 3 3v2c-3 0-5-2-5-5V8z",
  down: "M6 9l6 6 6-6",
};

function Svg({ name, className = "hm-ico" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={SVG[name] ?? ""} />
    </svg>
  );
}

const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
const money = (view: View, n: number) => formatToman(n, view.ctx.data.locale);
const pic = (p: Product) => safeUrl(p.images[0]);
const productPath = (p: Product) => `/product/${p.id}`;
const P = (id: string) => item("site.shop.products", id);

/** A small form that sends one cart or wishlist change and comes back to this page. */
function Act({ view, op, id, children, className, qty, size, label }: { view: View; op: "add" | "remove" | "wish" | "set"; id: string; children: ReactNode; className?: string; qty?: number; size?: string; label?: string }) {
  return (
    <form method="post" action={view.link("/_cart")} className="hm-act">
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="back" value={view.page} />
      {qty !== undefined && <input type="hidden" name="qty" value={qty} />}
      {size !== undefined && <input type="hidden" name="size" value={size} />}
      <button type="submit" className={className} aria-label={label} title={label}>
        {children}
      </button>
    </form>
  );
}

/** Section heading as in the reference: the last word in the brand colour, a line underneath. */
function Title({ title, text, path, textPath }: { title?: string; text?: string; path?: string; textPath?: string }) {
  if (!title) return null;
  const words = title.trim().split(/\s+/);
  const last = words.length > 1 ? words.pop() : undefined;
  return (
    <div className="hm-title">
      <h2 {...(path ? ed(path, "text", "عنوان بخش") : {})}>
        {words.join(" ")} {last && <em>{last}</em>}
      </h2>
      {text && <p {...(textPath ? ed(textPath, "text", "زیرعنوان") : {})}>{text}</p>}
    </div>
  );
}

function Price({ view, p, big }: { view: View; p: Product; big?: boolean }) {
  return (
    <span className={`hm-price${big ? " big" : ""}`}>
      {onSale(p) && <s>{money(view, p.price)}</s>}
      <b>{money(view, unitPrice(p))}</b>
    </span>
  );
}

function ProductCard({ view, p, cat }: { view: View; p: Product; cat?: number }) {
  const img = pic(p);
  const wished = view.visitor.wishlist.includes(p.id);
  const soldOut = p.stock === 0;
  return (
    <article className="hm-card" data-c={cat} data-product={p.id}>
      <div className="hm-card-pic">
        <PageLink to={productPath(p)} link={view.link}>
          <span className="hm-img">
            {img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}
          </span>
        </PageLink>
        <Act view={view} op="wish" id={p.id} className={`hm-wish${wished ? " on" : ""}`} label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
          <Svg name="heart" />
        </Act>
        {soldOut ? <span className="hm-tag dark">ناموجود</span> : onSale(p) ? <span className="hm-tag red">{fa(percentOff(p))}٪ تخفیف</span> : p.badge ? <span className="hm-tag">{p.badge}</span> : null}
      </div>
      <div className="hm-card-body">
        <PageLink to={productPath(p)} link={view.link} className="hm-card-name">
          <span>{p.name}</span>
        </PageLink>
        {p.description && <p className="hm-card-desc">{p.description}</p>}
        {view.visitor.ratings?.[p.id] && <Stars value={view.visitor.ratings[p.id]!.avg} count={view.visitor.ratings[p.id]!.count} />}
        <div className="hm-card-foot">
          <Price view={view} p={p} />
          {p.stock !== undefined && <small>موجودی: {fa(p.stock)}</small>}
        </div>
      </div>
    </article>
  );
}

function Empty({ view, text }: { view: View; text: string }) {
  return (
    <div className="hm-box hm-empty">
      <Svg name="bag" className="hm-empty-ico" />
      <p>{text}</p>
      <PageLink to="/shop" link={view.link} className="hm-btn">
        رفتن به فروشگاه
      </PageLink>
    </div>
  );
}

function Trail({ view, items }: { view: View; items: { label: string; to?: string }[] }) {
  return (
    <nav className="hm-trail">
      <PageLink to="/" link={view.link}>
        خانه
      </PageLink>
      {items.map((t, k) => (
        <span key={k}>
          <i>/</i>
          {t.to ? (
            <PageLink to={t.to} link={view.link}>
              {t.label}
            </PageLink>
          ) : (
            t.label
          )}
        </span>
      ))}
    </nav>
  );
}

/* ───────────── Header, footer, phone bar ───────────── */

function Header(view: View) {
  const { ctx, link, visitor, shop } = view;
  const count = priceCart(shop, visitor.cart).count;
  const wishes = visitor.wishlist.filter((id) => visible(shop).some((p) => p.id === id)).length;
  return (
    <header className="hm-head">
      <div className="hm-wrap hm-head-in">
        <nav className="hm-nav">
          <PageLink to="/" link={link} current={view.page === "/"}>
            خانه
          </PageLink>
          <PageLink to="/shop" link={link} current={view.page === "/shop"}>
            فروشگاه
          </PageLink>
          <PageLink to="/contact" link={link} current={view.page === "/contact"}>
            تماس با ما
          </PageLink>
          <PageLink to="/support" link={link} current={view.page.startsWith("/support")}>
            پشتیبانی
          </PageLink>
          <PageLink to="/cart" link={link} current={view.page === "/cart"}>
            سبد خرید
          </PageLink>
        </nav>
        <PageLink to="/" link={link} className="hm-logo">
          <b {...ed("basics.fullName", "text", "نام فروشگاه")}>{ctx.data.basics.fullName}</b>
          <Opt value={ctx.data.site?.tagline} editing={view.editing} edit={ed("site.tagline", "text", "شعار زیر نام")}>
            <small {...ed("site.tagline", "text", "شعار زیر نام")}>{ctx.data.site?.tagline}</small>
          </Opt>
        </PageLink>
        <div className="hm-tools">
          <form method="get" action={link("/search")} className="hm-search">
            <Svg name="search" />
            <input name="q" placeholder="جستجوی محصول..." aria-label="جستجوی محصول" defaultValue={view.page === "/search" ? visitor.query.q : undefined} />
          </form>
          <PageLink to="/wishlist" link={link} className="hm-icon">
            <Svg name="heart" />
            {wishes > 0 && <b>{fa(wishes)}</b>}
            <span className="sr-only">علاقه‌مندی‌ها</span>
          </PageLink>
          <PageLink to="/account" link={link} className="hm-icon hm-hide-sm">
            <Svg name="user" />
            <span className="sr-only">{visitor.customer ? `حساب ${visitor.customer.name}` : "ورود / ثبت‌نام"}</span>
          </PageLink>
          <PageLink to="/cart" link={link} className="hm-icon">
            <Svg name="cart" />
            {count > 0 && <b>{fa(count)}</b>}
            <span className="sr-only">سبد خرید</span>
          </PageLink>
        </div>
      </div>
    </header>
  );
}

function Footer({ ctx, link, editing, shop, page }: View) {
  const b = ctx.data.basics;
  const site = ctx.data.site;
  return (
    <footer className="hm-foot" id="hm-contact">
      {blockOn(ctx.data, "newsletter") && (
        <div className="hm-news">
          <div className="hm-wrap hm-news-in">
            <div>
              <Opt value={shop.newsletterTitle} editing={editing} edit={ed("site.shop.newsletterTitle", "text", "عنوان خبرنامه")}>
                <h3 {...ed("site.shop.newsletterTitle", "text", "عنوان خبرنامه")}>{shop.newsletterTitle}</h3>
              </Opt>
              <Opt value={shop.newsletterText} editing={editing} edit={ed("site.shop.newsletterText", "text", "متن خبرنامه")}>
                <p {...ed("site.shop.newsletterText", "text", "متن خبرنامه")}>{shop.newsletterText}</p>
              </Opt>
            </div>
            <form method="post" action={link("/_form")} className="hm-news-form">
<FormMeta kind="newsletter" back={page} />
              <input name="email" type="email" required placeholder="ایمیل خود را وارد کنید..." aria-label="ایمیل" dir="ltr" />
              <button type="submit">عضویت</button>
            </form>
          </div>
        </div>
      )}
      <div className="hm-wrap hm-foot-cols">
        <div className="hm-foot-brand">
          <PageLink to="/" link={link} className="hm-foot-logo">
            <span>
              <Svg name="bag" />
            </span>
            {b.fullName}
          </PageLink>
          <Opt value={site?.aboutText} editing={editing} edit={ed("site.aboutText", "multiline", "درباره‌ی فروشگاه")}>
            <p {...ed("site.aboutText", "multiline", "درباره‌ی فروشگاه")}>{site?.aboutText}</p>
          </Opt>
          <Socials ctx={ctx} editing={editing} className="hm-socials" />
        </div>
        <div>
          <h4>لینک‌های سریع</h4>
          <PageLink to="/" link={link}>
            صفحه‌ی اصلی
          </PageLink>
          <PageLink to="/shop" link={link}>
            فروشگاه
          </PageLink>
          <PageLink to="/cart" link={link}>
            سبد خرید
          </PageLink>
          <PageLink to="/wishlist" link={link}>
            علاقه‌مندی‌ها
          </PageLink>
          <InfoLinks shop={shop} link={link} />
        </div>
        <div>
          <h4>خدمات مشتریان</h4>
          {(shop.perks ?? []).map((x) => (
            <span key={x.id} {...ed(`${item("site.shop.perks", x.id)}.title`, "text", "خدمت")}>
              {x.title}
            </span>
          ))}
        </div>
        <div className="hm-foot-contact">
          <h4>تماس با ما</h4>
          <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <span {...ed("site.address", "text", "نشانی")}>
              <Svg name="pin" /> {site?.address}
            </span>
          </Opt>
          {b.phone && (
            <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} {...ed("basics.phone", "text", "تلفن")}>
              <Svg name="phone" /> <bdi dir="ltr">{b.phone}</bdi>
            </a>
          )}
          {b.email && (
            <a href={`mailto:${b.email}`} {...ed("basics.email", "text", "ایمیل")}>
              <Svg name="mail" /> <bdi dir="ltr">{b.email}</bdi>
            </a>
          )}
          <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "text", "ساعت کاری")}>
            <span {...ed("site.contactNote", "text", "ساعت کاری")}>
              <Svg name="clock" /> {site?.contactNote}
            </span>
          </Opt>
        </div>
      </div>
      <div className="hm-wrap hm-foot-end">
        <span>
          © {fa(new Date().getFullYear())} {b.fullName}. تمامی حقوق محفوظ است.
        </span>
        <span>
          <a href="#">حریم خصوصی</a>
          <i>|</i>
          <a href="#">قوانین و مقررات</a>
        </span>
      </div>
    </footer>
  );
}

/** The phone tab bar of the reference (only on narrow screens). */
function BottomNav({ link, page, visitor, shop }: View) {
  const count = priceCart(shop, visitor.cart).count;
  const items: [string, string, string][] = [
    ["/", "home", "خانه"],
    ["/shop", "bag", "فروشگاه"],
    ["/cart", "cart", "سبد خرید"],
    ["/support", "chat", "پشتیبانی"],
    ["/account", "user", "حساب"],
  ];
  return (
    <nav className="hm-tabbar" aria-label="منوی پایین">
      {items.map(([to, icon, label]) => (
        <PageLink key={to} to={to} link={link} current={page === to || (to === "/support" && page.startsWith("/support"))}>
          <Svg name={icon} />
          {to === "/cart" && count > 0 && <b>{fa(count)}</b>}
          <span>{label}</span>
        </PageLink>
      ))}
    </nav>
  );
}

/* ───────────── Home ───────────── */

function Home(view: View) {
  const { ctx, shop, link, editing } = view;
  const data = ctx.data;
  const on = (k: string) => blockOn(data, k);
  const products = visible(shop);
  const cats = (shop.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id)).slice(0, 11);
  const best = products.slice(0, 10);
  const offers = products.filter((p) => onSale(p) && p.saleEndsAt && !saleEnded(p)).slice(0, 5);
  const banners = (shop.banners ?? []).filter((x) => !x.hidden && safeUrl(x.image));
  const wide = banners.filter((x) => x.wide);
  const halves = banners.filter((x) => !x.wide);
  const showcaseCat = shop.categories.find((c) => c.id === shop.showcaseCategoryId);
  const showcase = showcaseCat ? products.filter((p) => p.categoryId === showcaseCat.id).slice(0, 4) : [];
  const testimonials = (data.site?.testimonials ?? []).filter((t) => !t.hidden && t.text.trim());
  const hero = safeUrl(shop.heroImage);
  return (
    <>
      <section className="hm-hero">
        <div className="hm-wrap hm-hero-in">
          <div className="hm-hero-text">
            <Opt value={shop.heroKicker} editing={editing} edit={ed("site.shop.heroKicker", "text", "جمله‌ی بالای تیتر")}>
              <p className="hm-kicker" {...ed("site.shop.heroKicker", "text", "جمله‌ی بالای تیتر")}>
                {shop.heroKicker}
              </p>
            </Opt>
            <Opt value={shop.heroTitle} editing={editing} edit={ed("site.shop.heroTitle", "text", "تیتر اصلی")}>
              <h1 {...ed("site.shop.heroTitle", "text", "تیتر اصلی")}>{shop.heroTitle}</h1>
            </Opt>
            <Opt value={shop.heroText} editing={editing} edit={ed("site.shop.heroText", "multiline", "متن زیر تیتر")}>
              <p className="hm-hero-sub" {...ed("site.shop.heroText", "multiline", "متن زیر تیتر")}>
                {shop.heroText}
              </p>
            </Opt>
            <div className="hm-hero-btns">
              <PageLink to="/shop" link={link} className="hm-btn">
                مشاهده‌ی محصولات
              </PageLink>
              <a href="#hm-best" className="hm-btn ghost">
                پرفروش‌ترین‌ها
              </a>
            </div>
          </div>
          <span className="hm-hero-pic" {...ed("site.shop.heroImage", "image", "عکس بالای صفحه")}>
            {hero && <img src={hero} alt="" />}
          </span>
        </div>
      </section>

      {on("best") && best.length > 0 && (
        <section className="hm-sec hm-best" id="hm-best">
          <div className="hm-wrap">
            <Title title={shop.bestTitle} text={shop.bestText} path="site.shop.bestTitle" textPath="site.shop.bestText" />
            {/* Category pills: each holds its own radio button, so picking one never scrolls the page. */}
            <div className="hm-pills" role="radiogroup" aria-label="دسته‌ها">
              <label className="hm-pill">
                <input type="radio" name="hm-cat" defaultChecked />
                همه
              </label>
              {cats.map((c) => (
                <label key={c.id} className="hm-pill">
                  <input type="radio" name="hm-cat" />
                  {c.name}
                </label>
              ))}
            </div>
            <div className="hm-grid five">
              {best.map((p) => (
                <ProductCard key={p.id} view={view} p={p} cat={cats.findIndex((c) => c.id === p.categoryId) + 1} />
              ))}
            </div>
          </div>
        </section>
      )}

      {on("banners") && wide[0] && <Banners view={view} list={[wide[0]]} wide />}

      {on("offers") && offers.length > 0 && <Offers view={view} offers={offers} />}

      {on("banners") && halves.length > 0 && <Banners view={view} list={halves.slice(0, 2)} />}

      {on("testimonials") && testimonials.length > 0 && (
        <section className="hm-sec hm-quotes">
          <div className="hm-wrap">
            <Title title="نظرات مشتریان" text="نظرات خریداران واقعی" />
            {testimonials.length > 1 && testimonials.map((t, k) => <input key={t.id} type="radio" name="hm-quote" id={`hm-quote-${k}`} className="hm-dot" defaultChecked={k === 0} aria-label={t.name} />)}
            <div className="hm-quote-stack">
              {testimonials.map((t, k) => {
                const at = item("site.testimonials", t.id);
                return (
                  <figure key={t.id} className="hm-quote">
                    <span className="hm-avatar">{safeUrl(t.image) ? <img src={safeUrl(t.image)} alt="" /> : t.name.charAt(0)}</span>
                    <figcaption>
                      <b {...ed(`${at}.name`, "text", "نام")}>{t.name}</b>
                    </figcaption>
                    <span className="hm-stars" aria-label={`${t.rating ?? 5} از ۵`}>
                      {Array.from({ length: t.rating ?? 5 }, (_, s) => (
                        <Svg key={s} name="star" />
                      ))}
                    </span>
                    <blockquote {...ed(`${at}.text`, "multiline", "متن نظر")}>{t.text}</blockquote>
                    {t.role && (
                      <small className="hm-chip" {...ed(`${at}.role`, "text", "توضیح")}>
                        {t.role}
                      </small>
                    )}
                    {testimonials.length > 1 && (
                      <div className="hm-dots">
                        {testimonials.map((x, j) => (
                          <label key={x.id} htmlFor={`hm-quote-${j}`} className={j === k ? "on" : undefined} title={x.name} />
                        ))}
                      </div>
                    )}
                  </figure>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {on("showcase") && showcase.length > 0 && showcaseCat && (
        <section className="hm-sec hm-showcase">
          <div className="hm-wrap">
            <Title title={shop.showcaseTitle || showcaseCat.name} text={shop.showcaseText} path="site.shop.showcaseTitle" textPath="site.shop.showcaseText" />
            <div className="hm-grid four">
              {showcase.map((p) => (
                <article key={p.id} className="hm-wide-card" data-product={p.id}>
                  <PageLink to={productPath(p)} link={link} className="hm-wide-pic">
                    <span className="hm-img">
                      {pic(p) && <img src={pic(p)} alt={p.name} loading="lazy" />}
                    </span>
                  </PageLink>
                  <div className="hm-wide-body">
                    <b>{p.name}</b>
                    {p.description && <p>{p.description}</p>}
                    <div className="hm-card-foot">
                      <Price view={view} p={p} />
                      <PageLink to={productPath(p)} link={link} className="hm-more">
                        ادامه <Svg name="down" />
                      </PageLink>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="hm-center">
              <PageLink to={`/category/${showcaseCat.id}`} link={link} className="hm-btn ghost">
                مشاهده‌ی همه‌ی {showcaseCat.name}
              </PageLink>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Banners({ view, list, wide }: { view: View; list: NonNullable<Shop["banners"]>; wide?: boolean }) {
  return (
    <section className={wide ? "hm-banner-wide" : "hm-sec hm-banners"}>
      <div className={wide ? undefined : "hm-wrap hm-banner-pair"}>
        {list.map((x) => {
          const href = safeUrl(x.link);
          const img = <img src={safeUrl(x.image)} alt={x.title ?? ""} loading="lazy" />;
          const at = `${item("site.shop.banners", x.id)}.image`;
          return href ? (
            <a key={x.id} href={href} className="hm-banner" {...outside(href)} {...ed(at, "image", "عکس بنر")}>
              {img}
            </a>
          ) : (
            <PageLink key={x.id} to="/shop" link={view.link} className="hm-banner">
              <span {...ed(at, "image", "عکس بنر")}>{img}</span>
            </PageLink>
          );
        })}
      </div>
    </section>
  );
}

/** Time left of a sale, as whole days, hours and minutes at the moment the page is made. */

function Offers({ view, offers }: { view: View; offers: Product[] }) {
  const n = offers.length;
  return (
    <section className="hm-sec hm-offers">
      <div className="hm-wrap">
        <Title title={view.shop.discountTitle} text="فرصت‌های استثنایی خرید" path="site.shop.discountTitle" />
        {n > 1 && offers.map((p, k) => <input key={p.id} type="radio" name="hm-offer" id={`hm-offer-${k}`} className="hm-dot" defaultChecked={k === 0} aria-label={p.name} />)}
        <div className="hm-offer-stack">
          {offers.map((p, k) => {
            const left = timeLeft(p.saleEndsAt!);
            return (
              <article key={p.id} className="hm-offer" data-product={p.id}>
                <PageLink to={productPath(p)} link={view.link} className="hm-offer-pic">
                  {pic(p) && <img src={pic(p)} alt={p.name} loading="lazy" />}
                  <span className="hm-tag red">{fa(percentOff(p))}٪</span>
                </PageLink>
                <div className="hm-offer-info">
                  <PageLink to={productPath(p)} link={view.link}>
                    <h3>{p.name}</h3>
                  </PageLink>
                  <span className="hm-chip green">
                    <Svg name="check" /> تضمین اصالت
                  </span>
                  {(p.specs ?? []).length > 0 && (
                    <div className="hm-specs-chips">
                      {p.specs!.slice(0, 4).map((s, j) => (
                        <span key={j}>{s.value}</span>
                      ))}
                    </div>
                  )}
                  <div className="hm-offer-price">
                    <s>{money(view, p.price)}</s>
                    <span>
                      <b>{money(view, unitPrice(p))}</b>
                      <i>{fa(percentOff(p))}٪ تخفیف</i>
                    </span>
                  </div>
                  <div className="hm-timer" title="زمان باقی‌مانده تا پایان تخفیف">
                    <span className="hm-timer-label">
                      <Svg name="clock" /> باقی‌مانده:
                    </span>
                    {(
                      [
                        [left.m, "دقیقه"],
                        [left.h, "ساعت"],
                        [left.d, "روز"],
                      ] as [number, string][]
                    ).map(([v, l]) => (
                      <span key={l} className="hm-timer-box">
                        <b>{fa(v)}</b>
                        <small>{l}</small>
                      </span>
                    ))}
                  </div>
                </div>
                {n > 1 && (
                  <>
                    <label htmlFor={`hm-offer-${(k + n - 1) % n}`} className="hm-arrow prev" title="قبلی">
                      <Svg name="right" />
                    </label>
                    <label htmlFor={`hm-offer-${(k + 1) % n}`} className="hm-arrow next" title="بعدی">
                      <Svg name="left" />
                    </label>
                    <div className="hm-dots">
                      {offers.map((x, j) => (
                        <label key={x.id} htmlFor={`hm-offer-${j}`} className={j === k ? "on" : undefined} title={x.name} />
                      ))}
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Shop page with filters ───────────── */


function Listing(view: View & { categoryId?: string }) {
  const { shop, link, visitor } = view;
  const q = visitor.query;
  const { list, cats, cat } = filterProducts(visible(shop), shop.categories ?? [], q, view.categoryId);
  const here = view.categoryId ? `/category/${view.categoryId}` : "/shop";
  return (
    <section className="hm-wrap hm-shop">
      <Trail view={view} items={cat ? [{ label: "فروشگاه", to: "/shop" }, { label: cat.name }] : [{ label: "فروشگاه" }]} />
      <div className="hm-shop-in">
        <form method="get" action={link(here)} className="hm-box hm-filters">
          <h2>فیلترها</h2>
          <label>
            مرتب‌سازی
            <select name="sort" defaultValue={q.sort ?? "new"}>
              {SORTS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            جستجو
            <input name="q" defaultValue={q.q} placeholder="نام محصول..." />
          </label>
          {!view.categoryId && (
            <label>
              دسته‌بندی
              <select name="cat" defaultValue={q.cat ?? ""}>
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
            <input name="min" inputMode="numeric" defaultValue={q.min} placeholder="از" aria-label="کمترین قیمت" />
            <input name="max" inputMode="numeric" defaultValue={q.max} placeholder="تا" aria-label="بیشترین قیمت" />
          </fieldset>
          <label className="hm-check">
            <input type="checkbox" name="sale" value="1" defaultChecked={Boolean(q.sale)} /> فقط تخفیف‌دارها
          </label>
          <label className="hm-check">
            <input type="checkbox" name="stock" value="1" defaultChecked={Boolean(q.stock)} /> فقط کالاهای موجود
          </label>
          <button type="submit" className="hm-btn">
            اعمال فیلترها
          </button>
          <PageLink to={here} link={link} className="hm-btn ghost">
            حذف همه‌ی فیلترها
          </PageLink>
        </form>
        <div>
          <div className="hm-shop-head">
            <h1>{cat?.name ?? "همه‌ی محصولات"}</h1>
            <small>{fa(list.length)} محصول</small>
          </div>
          {list.length ? (
            <div className="hm-grid three">
              {list.map((p) => (
                <ProductCard key={p.id} view={view} p={p} />
              ))}
            </div>
          ) : (
            <p className="hm-box hm-notice">محصولی با این فیلترها وجود ندارد؛ فیلترها را تغییر دهید.</p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Product ───────────── */

function ProductPage(view: View & { id: string }) {
  const { shop, link, visitor, editing } = view;
  const p = visible(shop).find((x) => x.id === view.id)!;
  const cat = shop.categories.find((c) => c.id === p.categoryId);
  const related = visible(shop)
    .filter((x) => x.id !== p.id && (!cat || x.categoryId === cat.id))
    .slice(0, 4);
  const soldOut = p.stock === 0;
  const wished = visitor.wishlist.includes(p.id);
  const imgs = p.images.map((u) => safeUrl(u)).filter((u): u is string => Boolean(u));
  const share = encodeURIComponent(p.name);
  return (
    <>
      <section className="hm-wrap hm-product">
        <Trail view={view} items={[{ label: "فروشگاه", to: "/shop" }, ...(cat ? [{ label: cat.name, to: `/category/${cat.id}` }] : []), { label: p.name }]} />
        <div className="hm-product-in" data-product={p.id}>
          {/* Gallery: the thumbnails pick the large picture; the large picture opens full screen. */}
          <div className="hm-box hm-gallery">
            <div className="hm-gallery-main">
              {(imgs.length ? imgs : [undefined]).map((src, k) =>
                src ? (
                  <ZoomOpen key={k} id={`${p.id}-${k}`} className="hm-gal">
                    <span>
                      <img src={src} alt={p.name} />
                    </span>
                  </ZoomOpen>
                ) : (
                  <span key={k} className="hm-gal" />
                ),
              )}
            </div>
            {imgs.length > 1 && (
              <div className="hm-thumbs">
                {imgs.map((src, k) => (
                  <label key={k} className="hm-thumb">
                    <input type="radio" name="hm-gal" defaultChecked={k === 0} aria-label={`عکس ${fa(k + 1)}`} />
                    <img src={src} alt="" />
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="hm-box hm-pinfo">
            <h1>{p.name}</h1>
            {p.stock !== undefined && <small className="hm-muted">موجودی: {fa(p.stock)}</small>}
            <div className="hm-pprice">
              {onSale(p) && (
                <span>
                  <s>{money(view, p.price)}</s>
                  <i className="hm-tag red static">{fa(percentOff(p))}٪ تخفیف</i>
                </span>
              )}
              <b>{money(view, unitPrice(p))}</b>
              {onSale(p) && <small className="hm-green">قیمت ویژه</small>}
            </div>
            {p.description && (
              <p className="hm-pdesc">
                {p.description}
              </p>
            )}
            {(p.specs ?? []).length > 0 && (
              <dl className="hm-specs">
                {p.specs!.map((s, k) => (
                  <div key={k}>
                    <dt>{s.label}:</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {soldOut ? (
              <p className="hm-stock out">این محصول فعلاً ناموجود است.</p>
            ) : (
              <form method="post" action={link("/_cart")} className="hm-buy">
                <input type="hidden" name="op" value="add" />
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="back" value="/cart" />
                <OptionPicker p={p} />
                <p className="hm-stock">
                  <Svg name="check" /> موجود{p.stock !== undefined && !p.variants?.length && ` — ${fa(p.stock)} عدد`}
                </p>
                <div className="hm-buy-row">
                  <label className="hm-qty">
                    تعداد:
                    <input type="number" name="qty" min={1} max={p.stock ?? 20} defaultValue={1} />
                  </label>
                </div>
                <button type="submit" className="hm-btn wide">
                  <Svg name="cart" /> افزودن به سبد خرید
                </button>
              </form>
            )}
            <Act view={view} op="wish" id={p.id} className={`hm-wish-line${wished ? " on" : ""}`} label="علاقه‌مندی">
              <Svg name="heart" /> {wished ? "در فهرست علاقه‌مندی‌های شماست" : "افزودن به علاقه‌مندی‌ها"}
            </Act>
            <div className="hm-share">
              اشتراک‌گذاری:
              <a href={`https://t.me/share/url?text=${share}`} target="_blank" rel="noopener noreferrer" aria-label="تلگرام">
                <Icon name="telegram" />
              </a>
              <a href={`https://wa.me/?text=${share}`} target="_blank" rel="noopener noreferrer" aria-label="واتس‌اپ">
                <Icon name="whatsapp" />
              </a>
            </div>
            {cat && (
              <p className="hm-muted">
                دسته‌بندی:{" "}
                <PageLink to={`/category/${cat.id}`} link={link}>
                  {cat.name}
                </PageLink>
              </p>
            )}
            <ul className="hm-assure">
              <li>
                <Svg name="truck" /> ارسال به سراسر کشور
              </li>
              <li>
                <Svg name="shield" /> ضمانت اصالت کالا
              </li>
            </ul>
          </div>
        </div>
        <div className="hm-reviews-wrap">
          <Reviews p={p} link={link} page={view.page} visitor={visitor} />
        </div>
      </section>
      {related.length > 0 && (
        <section className="hm-sec">
          <div className="hm-wrap">
            <Title title="محصولات مشابه" />
            <div className="hm-grid four">
              {related.map((x) => (
                <ProductCard key={x.id} view={view} p={x} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── Cart, wishlist, search ───────────── */

function PageHead({ title, view, trail }: { title: string; view: View; trail?: { label: string; to?: string }[] }) {
  return (
    <div className="hm-page-head">
      <Trail view={view} items={trail ?? [{ label: title }]} />
      <h1>{title}</h1>
    </div>
  );
}

function Cart(view: View) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  return (
    <section className="hm-wrap hm-inner">
      <PageHead view={view} title="سبد خرید" />
      {cart.lines.length === 0 ? (
        <Empty view={view} text="سبد خرید شما خالی است." />
      ) : (
        <div className="hm-cart">
          <div className="hm-box hm-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="hm-line">
                <PageLink to={productPath(l.product)} link={link} className="hm-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div className="hm-line-info">
                  <PageLink to={productPath(l.product)} link={link}>
                    <b>{l.product.name}</b>
                  </PageLink>
                  {l.size && (
                    <small>
                      {l.product.optionLabel || "انتخاب"}: {l.size}
                    </small>
                  )}
                  <small>{money(view, l.unit)}</small>
                </div>
                <div className="hm-stepper">
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                    +
                  </Act>
                  <span>{fa(l.qty)}</span>
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                    −
                  </Act>
                </div>
                <b className="hm-line-total">{money(view, l.total)}</b>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="hm-remove" label="حذف از سبد">
                  <Svg name="trash" />
                </Act>
              </div>
            ))}
          </div>
          <aside className="hm-box hm-sum">
            <h2>خلاصه‌ی سفارش</h2>
            <dl>
              <dt>جمع کالاها ({fa(cart.count)})</dt>
              <dd>{money(view, cart.subtotal)}</dd>
              {cart.discount > 0 && (
                <>
                  <dt>کد تخفیف</dt>
                  <dd className="hm-off">− {money(view, cart.discount)}</dd>
                </>
              )}
              <dt>هزینه‌ی ارسال</dt>
              <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
              <dt className="total">مبلغ قابل پرداخت</dt>
              <dd className="total">{money(view, cart.total)}</dd>
            </dl>
            {shop.freeShippingFrom && cart.shipping > 0 ? <small>برای خریدهای بالای {money(view, shop.freeShippingFrom)} ارسال رایگان است.</small> : null}
            {(shop.coupons ?? []).length > 0 && <CouponBox link={link} page={view.page} visitor={visitor} applied={cart.coupon} error={cart.couponError} />}
            <PageLink to="/checkout" link={link} className="hm-btn wide">
              ادامه‌ی فرایند خرید
            </PageLink>
          </aside>
        </div>
      )}
    </section>
  );
}

function Wishlist(view: View) {
  const items = visible(view.shop).filter((p) => view.visitor.wishlist.includes(p.id));
  return (
    <section className="hm-wrap hm-inner">
      <PageHead view={view} title="علاقه‌مندی‌ها" />
      {items.length === 0 ? (
        <Empty view={view} text="فهرست علاقه‌مندی‌های شما خالی است." />
      ) : (
        <div className="hm-grid four">
          {items.map((p) => (
            <ProductCard key={p.id} view={view} p={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function Search(view: View) {
  const q = (view.visitor.query.q ?? "").trim();
  const words = q.split(/\s+/).filter(Boolean);
  const found = words.length ? visible(view.shop).filter((p) => words.every((w) => `${p.name} ${p.description ?? ""}`.includes(w))) : [];
  return (
    <section className="hm-wrap hm-inner">
      <PageHead view={view} title="جستجو" />
      <form method="get" action={view.link("/search")} className="hm-box hm-search-big">
        <input name="q" defaultValue={q} placeholder="نام محصول را بنویسید..." aria-label="جستجو" />
        <button type="submit" className="hm-btn">
          <Svg name="search" /> جستجو
        </button>
      </form>
      {words.length > 0 &&
        (found.length ? (
          <div className="hm-grid four">
            {found.map((p) => (
              <ProductCard key={p.id} view={view} p={p} />
            ))}
          </div>
        ) : (
          <p className="hm-box hm-notice">محصولی با «{q}» یافت نشد.</p>
        ))}
    </section>
  );
}

/* ───────────── Checkout and confirmation ───────────── */

function Checkout(view: View) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  const me = visitor.customer;
  const addr = visitor.account?.addresses[0];
  const error = visitor.query.error;
  if (cart.lines.length === 0)
    return (
      <section className="hm-wrap hm-inner">
        <PageHead view={view} title="ثبت سفارش" />
        <Empty view={view} text="سبد خرید شما خالی است؛ اول چند محصول اضافه کنید." />
      </section>
    );
  return (
    <section className="hm-wrap hm-inner">
      <PageHead view={view} title="ثبت سفارش" trail={[{ label: "سبد خرید", to: "/cart" }, { label: "ثبت سفارش" }]} />
      <div className="hm-cart">
        <form method="post" action={link("/_order")} className="hm-box hm-checkout">
          <h2>اطلاعات ارسال</h2>
          {error && <p className="hm-error">{error}</p>}
          {!me && (
            <p className="full hm-muted">
              مشتری قبلی هستید؟{" "}
              <PageLink to="/account" link={link}>
                وارد شوید
              </PageLink>{" "}
              تا سفارش در حسابتان ثبت شود.
            </p>
          )}
          <label>
            نام و نام خانوادگی *
            <input name="name" required maxLength={80} autoComplete="name" defaultValue={me?.name} />
          </label>
          <label>
            شماره‌ی موبایل *
            <input name="phone" required inputMode="tel" dir="ltr" maxLength={14} autoComplete="tel" placeholder="09xx xxx xxxx" defaultValue={me?.phone} />
          </label>
          <label>
            شهر
            <input name="city" maxLength={60} autoComplete="address-level2" defaultValue={addr?.city} />
          </label>
          <label>
            کد پستی
            <input name="postalCode" maxLength={20} inputMode="numeric" dir="ltr" autoComplete="postal-code" defaultValue={addr?.postalCode} />
          </label>
          <label className="full">
            نشانی کامل *
            <textarea name="address" required maxLength={400} rows={3} autoComplete="street-address" defaultValue={addr?.address} />
          </label>
          <label className="full">
            توضیحات سفارش
            <textarea name="note" maxLength={400} rows={2} />
          </label>
          {/* Left empty by people; filled only by spam robots. */}
          <input name="website" tabIndex={-1} autoComplete="off" className="hm-trap" aria-hidden="true" />
          <button type="submit" className="hm-btn full">
            ثبت سفارش
          </button>
        </form>
        <aside className="hm-box hm-sum">
          <h2>سفارش شما</h2>
          <ul className="hm-sum-lines">
            {cart.lines.map((l) => (
              <li key={l.id + (l.size ?? "")}>
                <span>
                  {l.product.name}
                  {l.size && ` (${l.size})`} × {fa(l.qty)}
                </span>
                <b>{money(view, l.total)}</b>
              </li>
            ))}
          </ul>
          <dl>
            {cart.discount > 0 && (
              <>
                <dt>کد تخفیف «{cart.coupon}»</dt>
                <dd className="hm-off">− {money(view, cart.discount)}</dd>
              </>
            )}
            <dt>هزینه‌ی ارسال</dt>
            <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
            <dt className="total">مبلغ قابل پرداخت</dt>
            <dd className="total">{money(view, cart.total)}</dd>
          </dl>
          {shop.paymentNote && (
            <p className="hm-pay" {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>
              {shop.paymentNote}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

function Account(view: View) {
  return (
    <section className="hm-wrap hm-inner">
      <PageHead view={view} title={view.visitor.customer ? "حساب کاربری" : "ورود یا ثبت‌نام"} />
      <AccountPage link={view.link} page={view.page} visitor={view.visitor} />
    </section>
  );
}

function Thanks(view: View) {
  const code = view.visitor.query.code;
  const shop = view.shop;
  return (
    <section className="hm-wrap hm-inner">
      <div className="hm-box hm-thanks">
        <span className="hm-done" aria-hidden="true">
          <Svg name="check" />
        </span>
        <h1>سفارش شما ثبت شد</h1>
        {code && (
          <p>
            کد پیگیری سفارش: <b dir="ltr">{code}</b>
          </p>
        )}
        {shop.orderNote && <p {...ed("site.shop.orderNote", "multiline", "پیام بعد از ثبت سفارش")}>{shop.orderNote}</p>}
        {shop.paymentNote && <p className="hm-pay">{shop.paymentNote}</p>}
        <PageLink to="/shop" link={view.link} className="hm-btn">
          بازگشت به فروشگاه
        </PageLink>
      </div>
    </section>
  );
}

/* ───────────── Example content (from the user's own HomeMart shop) ───────────── */

export function homemartSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`hm-${n}`);
  const soon = (days: number) => new Date(Date.now() + days * 86400000 + 5 * 3600000).toISOString();
  const products: Product[] = [
    { id: "h1", name: "لپ‌تاپ ایسوس", categoryId: "k4", price: 80000000, salePrice: 56000000, saleEndsAt: soon(13), stock: 79, images: [img("asus"), img("asus3")], description: "لپ‌تاپ ایسوس نسل جدید با کیفیت بالا؛ مناسب کار، تحصیل و سرگرمی.", options: [{ name: "رنگ", values: [{ label: "نقره‌ای", color: "#C3C6CC" }, { label: "مشکی", color: "#1F2937" }] }, { name: "رم", values: [{ label: "16GB" }, { label: "8GB" }] }], variants: [{ key: "نقره‌ای / 8GB", price: 68000000 }, { key: "مشکی / 8GB", price: 68000000, stock: 0 }, { key: "مشکی / 16GB", stock: 12 }], specs: [{ label: "برند", value: "ASUS" }, { label: "مدل", value: "MN-22" }, { label: "وزن", value: "۲ کیلوگرم" }, { label: "اندازه", value: "14 Inch" }] },
    { id: "h2", name: "یخچال ساید بای ساید", categoryId: "k1", price: 46500000, stock: 3, images: [img("fridge")], description: "یخچال ساید بای ساید با ظرفیت بالا و سیستم خنک‌کننده‌ی چندگانه." },
    { id: "h3", name: "میز ناهارخوری چوبی", categoryId: "k6", price: 6125000, stock: 5, images: [img("table")], description: "میز ناهارخوری با طراحی مدرن و جنس چوب گردو با کیفیت بالا، مناسب برای ۶ نفر." },
    { id: "h4", name: "کیف چرمی", categoryId: "k3", price: 3000000, stock: 4, images: [img("bag")], description: "کیف چرمی قهوه‌ای دست‌دوز با جای مناسب برای وسایل روزانه.", specs: [{ label: "جنس", value: "چرم طبیعی" }, { label: "وزن", value: "۱ کیلوگرم" }] },
    { id: "h5", name: "ماشین لباسشویی ۱۲ کیلویی", categoryId: "k1", price: 23500000, stock: 11, images: [img("washer")], description: "ماشین لباسشویی دوازده کیلویی با موتور اینورتر و خشک‌کن." },
    { id: "h6", name: "مایکروویو دیجیتال", categoryId: "k2", price: 12000000, stock: 20, images: [img("microwave")], description: "مایکروویو دیجیتال با گریل و برنامه‌های پخت هوشمند." },
    { id: "h7", name: "هود آشپزخانه", categoryId: "k2", price: 7300000, stock: 10, images: [img("hood")], description: "هود آشپزخانه با مکش قوی و سیستم فیلتراسیون پیشرفته." },
    { id: "h8", name: "سینک استیل دوطرفه", categoryId: "k2", price: 2736000, stock: 24, images: [img("sink")], description: "سینک استیل دوطرفه با جنس ضدزنگ و طراحی مدرن." },
    { id: "h9", name: "جاروبرقی رباتیک", categoryId: "k4", price: 12500000, stock: 7, images: [img("robot")], description: "جاروبرقی رباتیک هوشمند با نقشه‌برداری و کنترل از طریق موبایل." },
    { id: "h10", name: "اتو بخار", categoryId: "k4", price: 2100000, stock: 0, images: [img("iron")], description: "اتو بخار با کف سرامیکی و قدرت بخار بالا." },
    { id: "h11", name: "پنکه ایستاده", categoryId: "k4", price: 1450000, stock: 0, images: [img("fan")], description: "پنکه ایستاده با قدرت باد بالا و صدای کم." },
    { id: "h12", name: "آینه دیواری طرح کلاسیک", categoryId: "k3", price: 2400000, stock: 18, images: [img("mirror")], description: "آینه دیواری با قاب چوبی کلاسیک و طرح‌های برجسته." },
    { id: "h13", name: "گلدان سرامیکی", categoryId: "k3", price: 890000, stock: 30, images: [img("vase")], description: "گلدان سرامیکی دست‌ساز با طرح‌های زیبا." },
    { id: "h14", name: "تابلو نقاشی مدرن", categoryId: "k3", price: 1850000, stock: 11, images: [img("painting")], description: "تابلو نقاشی مدرن با طرح‌های انتزاعی و رنگ‌های شاد." },
    { id: "h15", name: "ست روتختی", categoryId: "k5", price: 3200000, stock: 20, images: [img("bedding")], description: "ست روتختی شامل ملحفه، روبالشی و لحاف، جنس نخ پنبه‌ای." },
    { id: "h16", name: "بالش طبی", categoryId: "k5", price: 980000, stock: 40, images: [img("pillow")], description: "بالش طبی با فوم خنک‌کننده و طراحی ارگونومیک." },
    { id: "h17", name: "چراغ خواب دکوری", categoryId: "k5", price: 420000, stock: 49, images: [img("lamp")], description: "چراغ خواب دکوری با طراحی زیبا و نور ملایم." },
    { id: "h18", name: "تخت خواب چوبی دو نفره", categoryId: "k6", price: 18750000, stock: 8, images: [img("bed")], description: "تخت خواب با طراحی مینیمال و جنس چوب راش، مقاوم و بادوام." },
    { id: "h19", name: "قفسه کتاب چوبی", categoryId: "k6", price: 4200000, stock: 19, images: [img("shelf")], description: "قفسه کتاب با ۵ طبقه و جنس چوب گردو." },
    { id: "h20", name: "ست مبلمان پذیرایی", categoryId: "k6", price: 25000000, salePrice: 12500000, saleEndsAt: soon(29), stock: 5, images: [img("sofa")], description: "ست مبلمان شامل مبل ۳ نفره و ۲ صندلی با پایه‌های چوبی و رویه‌ی پارچه‌ای.", specs: [{ label: "جنس پایه", value: "چوب راش" }, { label: "تعداد", value: "۳ تکه" }] },
    { id: "h21", name: "گوشی موبایل S23 FE", categoryId: "k7", price: 39500000, stock: 4, images: [img("s23")], description: "گوشی با دوربین پنجاه مگاپیکسلی و نمایشگر روشن.", options: [{ name: "رنگ", values: [{ label: "سبز نعنایی", color: "#A8D5BA" }, { label: "مشکی", color: "#111827" }] }] },
    { id: "h22", name: "گوشی موبایل A55", categoryId: "k7", price: 21500000, stock: 0, images: [img("a55")], description: "گوشی میان‌رده با باتری پرقدرت و طراحی شیشه‌ای." },
    { id: "h23", name: "گوشی موبایل Redmi Note 13 Pro", categoryId: "k7", price: 18900000, stock: 18, images: [img("redmi")], description: "گوشی با نمایشگر ۱۲۰ هرتز و شارژ سریع." },
    { id: "h24", name: "هدفون بلوتوثی", categoryId: "k4", price: 2800000, stock: 25, images: [img("headphone")], description: "هدفون بلوتوثی با کیفیت صدای عالی و نویزگیر." },
    { id: "h25", name: "ماوس بی‌سیم", categoryId: "k4", price: 1200000, stock: 40, images: [img("mouse")], description: "ماوس بی‌سیم با طراحی ارگونومیک و دقت بالا." },
    { id: "h26", name: "کیبورد مکانیکی", categoryId: "k4", price: 3150000, stock: 15, images: [img("keyboard")], description: "کیبورد مکانیکی با کلیدهای باکیفیت و نورپردازی. مناسب برای بازی، تایپ حرفه‌ای و استفاده‌ی طولانی‌مدت با دوام بالا." },
    { id: "h27", name: "گاز رومیزی ۴ شعله", categoryId: "k2", price: 10400000, stock: 15, images: [img("stove")], description: "گاز رومیزی چهار شعله با صفحه‌ی شیشه‌ای و شعله‌های پرقدرت. مناسب برای پخت‌وپز روزمره با ایمنی بالا و طراحی مدرن." },
  ];
  return {
    ...base,
    basics: { ...base.basics, fullName: "HomeMart" },
    site: {
      ...base.site,
      gallery: [],
      tagline: "EVERYTHING FOR HOME",
      aboutText: "فروشگاه تخصصی لوازم خانگی با بهترین کیفیت و قیمت‌های منصفانه. خرید آسان، تحویل سریع و ضمانت اصالت کالا.",
      address: "تهران، خیابان اصلی، پلاک ۱۲۳",
      contactNote: "شنبه تا پنجشنبه ۹ الی ۲۰",
      testimonials: [
        { id: "q1", name: "رضا رضایی", text: "کیفیت کالاها خیلی خوبه.", role: "خرید: لپ‌تاپ ایسوس", rating: 5 },
        { id: "q2", name: "سارا کریمی", text: "از خرید مبل چوبی راضی هستم، فقط رنگش کمی با عکس فرق داشت ولی کیفیت خوبه.", role: "خرید: ست مبلمان پذیرایی", rating: 4 },
        { id: "q3", name: "رضا احمدی", text: "خیلی سریع تحویل گرفتند، قیمت‌ها منصفانه و کالاها اصل هستند. حتماً دوباره خرید می‌کنم.", role: "خرید: یخچال ساید بای ساید" },
      ],
      contactText: "خوشحال می‌شویم نظرات، پیشنهادات و سؤالات شما را بشنویم. با ما در ارتباط باشید.",
      shop: {
        heroKicker: "اصالت و کیفیت و تنوع نزد ماست",
        faqTitle: "سؤالات متداول",
        faq: [
          { id: "f1", q: "چگونه می‌توانم سفارش خود را پیگیری کنم؟", a: "وارد «حساب من» شوید؛ وضعیت همه‌ی سفارش‌هایتان در بخش «سفارش‌های من» نمایش داده می‌شود. برای سؤال درباره‌ی یک سفارش هم می‌توانید از همان‌جا تیکت بفرستید." },
          { id: "f2", q: "هزینه‌ی ارسال چقدر است؟", a: "هزینه‌ی ارسال در سبد خرید نمایش داده می‌شود. برای سفارش‌های بالای ۵ میلیون تومان، ارسال رایگان است." },
          { id: "f3", q: "چند روز طول می‌کشد تا سفارش به دستم برسد؟", a: "زمان تحویل بسته به شهر شما بین ۱ تا ۳ روز کاری است. برای شهرهای بزرگ معمولاً ۱ روز کاری و برای سایر شهرها حداکثر ۳ روز کاری." },
          { id: "f4", q: "آیا امکان بازگشت کالا وجود دارد؟", a: "بله، اگر کالا ایراد داشته باشد یا با مشخصات اعلام‌شده مطابقت نداشته باشد، می‌توانید ظرف ۷ روز کاری آن را بازگردانید. هزینه‌ی بازگشت به عهده‌ی فروشگاه است." },
        ],
        pages: [
          { id: "pg1", slug: "about", title: "درباره‌ی ما", text: "هوم‌مارت با هدف ساده کردن خرید لوازم خانه راه افتاد: کالای اصل، قیمت منصفانه و ارسال سریع به سراسر ایران.\n\nهمه‌ی کالاها پیش از ارسال بررسی و با بسته‌بندی مطمئن فرستاده می‌شوند و تیم پشتیبانی ما برای هر سؤالی کنار شماست." },
          { id: "pg2", slug: "terms", title: "قوانین و مقررات", text: "ثبت سفارش در این فروشگاه به معنی پذیرش این قوانین است.\n\nقیمت‌ها به تومان است و در لحظه‌ی ثبت سفارش ثابت می‌شود. موجودی کالاها به‌روز نمایش داده می‌شود؛ اگر کالایی پس از ثبت سفارش تمام شده باشد، با شما تماس می‌گیریم و مبلغ آن بازگردانده می‌شود.\n\nکالای معیوب یا مغایر با توضیحات تا ۷ روز کاری پس از تحویل پس گرفته می‌شود." },
          { id: "pg3", slug: "privacy", title: "حریم خصوصی", text: "اطلاعاتی که هنگام ثبت‌نام و خرید وارد می‌کنید (نام، تلفن و نشانی) فقط برای ارسال سفارش و پشتیبانی استفاده می‌شود و در اختیار دیگران قرار نمی‌گیرد.\n\nرمز حساب شما رمزنگاری‌شده نگه‌داری می‌شود و هیچ‌کس، حتی فروشگاه، آن را نمی‌بیند." },
        ],
        heroTitle: "خانه‌ای زیباتر با ما",
        heroText: "لوازم خانگی مدرن - دکوری شیک و کاربردی",
        heroImage: img("hero"),
        bestTitle: "پرفروش‌ترین محصولات",
        bestText: "محصولات محبوب و پرطرفدار",
        discountTitle: "تخفیف‌های ویژه",
        showcaseTitle: "محصولات چوبی",
        showcaseText: "لوازم خانگی چوبی با کیفیت بالا",
        showcaseCategoryId: "k6",
        newsletterTitle: "عضویت در خبرنامه",
        newsletterText: "با عضویت در خبرنامه، از تخفیف‌های ویژه باخبر شوید.",
        banners: [
          { id: "b1", image: img("banner"), wide: true },
          { id: "b2", image: img("half1") },
          { id: "b3", image: img("half2") },
        ],
        perks: [
          { id: "f1", title: "پرسش‌های متداول" },
          { id: "f2", title: "گارانتی و ضمانت" },
          { id: "f3", title: "بازگشت کالا" },
          { id: "f4", title: "روش‌های ارسال" },
        ],
        categories: [
          { id: "k1", name: "لوازم خانگی", image: "" },
          { id: "k2", name: "آشپزخانه", image: "" },
          { id: "k3", name: "تزئینی", image: "" },
          { id: "k4", name: "برقی", image: "" },
          { id: "k5", name: "خواب", image: "" },
          { id: "k6", name: "مبلمان چوبی", image: "" },
          { id: "k7", name: "موبایل", image: "" },
          // The rest of the old shop's categories (no products yet; empty ones stay out of the shop's filters).
          { id: "k8", name: "لپ‌تاپ‌های ایسوس", image: "" },
          { id: "k9", name: "قاشق و چنگال", image: "" },
          { id: "k10", name: "مرکبات", image: "" },
          { id: "k11", name: "دسته", image: "" },
        ],
        products,
        shippingFee: 90000,
        freeShippingFrom: 5000000,
        coupons: [
          { id: "d1", code: "HOME10", percent: 10, maxDiscount: 2000000, active: true },
          { id: "d2", code: "LAPTOP", percent: 10, maxDiscount: 400000, usageLimit: 2, endsAt: "2027-03-20T20:30:00.000Z", active: true },
        ],
        paymentNote: "پس از ثبت سفارش، برای هماهنگی پرداخت (کارت به کارت یا پرداخت در محل) با شما تماس می‌گیریم.",
        orderNote: "سفارش شما ثبت شد و به‌زودی برای هماهنگی ارسال با شما تماس می‌گیریم.",
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.hm {
  --hm-red: var(--color-primary);
  --hm-red-dark: color-mix(in srgb, var(--color-primary) 70%, #000);
  --hm-ink: #1F2937;
  --hm-muted: #6B7280;
  --hm-cream: #FEFCF9;
  --hm-cream-2: #F8F4EE;
  --hm-cream-3: #F5F0E8;
  --hm-beige: #E8DCC8;
  --hm-line: #ECE5DA;
  --hm-wrap: min(1280px, 100% - 2 * clamp(16px, 3cqi, 32px));
  --hm-radius: 16px;
  --hm-shadow: 0 1px 2px rgb(0 0 0 / .04), 0 6px 18px -8px rgb(60 20 30 / .14);
  --sk-accent: var(--hm-red);
  --sk-card: #fff;
  --sk-line: #F1ECE4;
  --sk-soft: var(--hm-cream-2);
  --sk-muted: var(--hm-muted);
  --sk-card-radius: var(--hm-radius);
  background: var(--hm-cream);
  color: var(--hm-ink);
  font-size: 15px;
}
.hm .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.hm h1, .hm h2, .hm h3, .hm h4 { line-height: 1.5; }
.hm-wrap { width: var(--hm-wrap); margin-inline: auto; }
.hm-ico { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.hm-act { display: contents; }
.hm-act button { font: inherit; cursor: pointer; }
.hm-muted { color: var(--hm-muted); }
.hm-green { color: #15803D; font-weight: 600; }
.hm-center { display: flex; justify-content: center; margin-top: 28px; }
.hm-box { background: #fff; border-radius: var(--hm-radius); box-shadow: var(--hm-shadow); }
.hm-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 28px; border: 1.5px solid var(--hm-red); border-radius: 999px; background: var(--hm-red); color: #fff !important; font: inherit; font-weight: 700; font-size: .95em; cursor: pointer; box-shadow: 0 8px 18px -8px color-mix(in srgb, var(--hm-red) 70%, transparent); transition: transform .2s, background .2s, box-shadow .2s; }
.hm-btn:hover { background: var(--hm-red-dark); transform: translateY(-2px); }
.hm-btn.ghost { background: #fff; color: var(--hm-red) !important; border-color: color-mix(in srgb, var(--hm-red) 30%, #fff); box-shadow: none; }
.hm-btn.ghost:hover { background: color-mix(in srgb, var(--hm-red) 6%, #fff); }
.hm-btn.wide, .hm-btn.full { width: 100%; }
.hm-tag { position: absolute; bottom: 10px; inset-inline-end: 10px; padding: 3px 10px; border-radius: 999px; background: #fff; color: var(--hm-ink); font-size: .74em; font-weight: 700; font-style: normal; box-shadow: 0 2px 6px rgb(0 0 0 / .1); }
.hm-tag.dark { background: #374151; color: #fff; }
.hm-tag.red { background: #EF4444; color: #fff; }
.hm-tag.static { position: static; box-shadow: none; }
.hm-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 999px; background: var(--hm-cream-3); color: var(--hm-muted); font-size: .8em; }
.hm-chip.green { background: #ECFDF5; color: #15803D; border: 1px solid #A7F3D0; }
.hm-chip .hm-ico { width: 14px; height: 14px; }

/* Header: burgundy gradient, menu, centred name, search and icons */
.hm-head { position: relative; z-index: 30; background: linear-gradient(90deg, color-mix(in srgb, var(--hm-red) 94%, #fff), var(--hm-red) 45%, color-mix(in srgb, var(--hm-red) 64%, #000)); color: #fff; box-shadow: 0 8px 24px -10px rgb(80 10 30 / .5); }
.hm-head-in { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 20px; min-height: 66px; }
.hm-nav { display: flex; gap: clamp(16px, 2.4cqi, 30px); font-weight: 700; font-size: .92em; }
.hm-nav a { position: relative; padding: 6px 0; opacity: .92; }
.hm-nav a::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 2px; border-radius: 2px; background: #fff; transform: scaleX(0); transition: transform .25s; }
.hm-nav a:hover::after, .hm-nav a[aria-current="page"]::after { transform: none; }
.hm-logo { display: grid; justify-items: center; line-height: 1.1; }
.hm-logo b { font-size: 1.75em; font-weight: 800; letter-spacing: .01em; }
.hm-logo small { margin-top: 3px; color: color-mix(in srgb, #fff 70%, var(--hm-red)); font-size: .6em; letter-spacing: .28em; direction: ltr; }
.hm-tools { display: flex; align-items: center; justify-content: flex-end; gap: 16px; }
.hm-search { display: flex; align-items: center; gap: 6px; width: min(210px, 100%); padding: 0 12px; border: 1px solid rgb(255 255 255 / .25); border-radius: 999px; background: rgb(255 255 255 / .1); }
.hm-search .hm-ico { width: 16px; height: 16px; opacity: .8; }
.hm-search input { width: 100%; min-width: 0; padding: 8px 0; border: none; background: none; color: #fff; font: inherit; font-size: .85em; outline: none; }
.hm-search input::placeholder { color: rgb(255 255 255 / .75); }
.hm-icon { position: relative; display: grid; place-items: center; width: 30px; height: 30px; }
.hm-icon b { position: absolute; top: -6px; inset-inline-end: -8px; min-width: 18px; height: 18px; padding: 0 4px; display: grid; place-items: center; border-radius: 999px; background: #fff; color: var(--hm-red); font-size: 11px; font-weight: 800; }
.hm-icon:hover { opacity: .8; }

/* Hero */
.hm-hero { background: radial-gradient(60% 80% at 15% 50%, color-mix(in srgb, var(--hm-red) 4%, transparent), transparent), var(--hm-cream); overflow: hidden; }
.hm-hero-in { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: 30px; min-height: clamp(420px, 38cqi, 560px); padding-block: 30px; }
.hm-hero-text { display: grid; justify-items: start; gap: 18px; animation: hm-up .8s both; }
.hm-kicker { display: flex; align-items: center; gap: 14px; color: color-mix(in srgb, var(--hm-red) 75%, #fff); font-style: italic; font-size: 1.02em; }
.hm-kicker::before, .hm-kicker::after { content: ""; width: 40px; height: 1px; background: currentColor; opacity: .5; }
.hm-hero h1 { font-size: clamp(2em, 4cqi, 3.3em); font-weight: 800; line-height: 1.35; color: var(--hm-ink); }
.hm-hero-sub { padding-inline-start: 14px; border-inline-start: 3px solid var(--hm-red); color: var(--hm-muted); font-size: 1.08em; }
.hm-hero-btns { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; }
/* As on the original shop: the picture on the right, the text on the left. */
.hm-hero-pic { order: -1; display: flex; justify-content: center; align-items: center; min-height: 0; mix-blend-mode: multiply; animation: hm-in 1s .1s both; }
.hm-hero-pic img { max-width: min(440px, 100%); max-height: 460px; object-fit: contain; }
@keyframes hm-up { from { opacity: 0; transform: translateY(24px); } }
@keyframes hm-in { from { opacity: 0; transform: scale(.94); } }

/* Sections and titles */
.hm-sec { padding-block: clamp(36px, 5cqi, 64px); }
.hm-best { background: #FCF9F5; }
.hm-offers { background: var(--hm-cream-2); }
.hm-quotes, .hm-showcase { background: var(--hm-cream-3); }
.hm-banners { padding-block: clamp(24px, 3cqi, 40px); background: var(--hm-cream-2); }
.hm-title { display: grid; justify-items: center; gap: 4px; margin-bottom: clamp(20px, 2.6cqi, 32px); text-align: center; }
.hm-title h2 { position: relative; padding-bottom: 6px; font-size: clamp(1.4em, 2.3cqi, 1.9em); font-weight: 800; }
.hm-title h2::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 2px; border-radius: 2px; background: color-mix(in srgb, var(--hm-red) 70%, #fff); }
.hm-title em { color: var(--hm-red); font-style: normal; }
.hm-title p { color: var(--hm-muted); font-size: .85em; }

/* Category pills: each pill holds its radio; the grid hides products of other categories */
.hm-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 26px; }
.hm-pill { position: relative; padding: 7px 18px; border: 1px solid var(--hm-line); border-radius: 999px; background: #fff; color: var(--hm-ink); font-size: .85em; cursor: pointer; transition: background .2s, color .2s, border-color .2s; }
.hm-pill:hover { border-color: var(--hm-red); color: var(--hm-red); }
.hm-pill input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer; }
.hm-pill:has(input:checked) { background: var(--hm-red); border-color: var(--hm-red); color: #fff; box-shadow: 0 6px 14px -6px color-mix(in srgb, var(--hm-red) 70%, transparent); }
.hm-pill:has(input:focus-visible) { outline: 2px solid var(--hm-red); outline-offset: 2px; }
${Array.from({ length: 11 }, (_, k) => `.hm-best:has(.hm-pill:nth-child(${k + 2}) input:checked) .hm-grid > :not([data-c="${k + 1}"])`).join(", ")} { display: none; }

/* Product grid and cards */
.hm-grid { display: grid; gap: clamp(12px, 1.6cqi, 20px); }
.hm-grid.five { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.hm-grid.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.hm-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.hm-card { position: relative; display: flex; flex-direction: column; overflow: hidden; background: #fff; border: 1px solid #F1ECE4; border-radius: 14px; box-shadow: var(--hm-shadow); transition: transform .3s, box-shadow .3s; animation: hm-up .6s both; }
.hm-card:hover { transform: translateY(-4px); box-shadow: 0 16px 30px -14px rgb(80 10 30 / .3); }
.hm-card-pic { position: relative; }
.hm-img { position: relative; display: block; aspect-ratio: 1; overflow: hidden; background: #fff; }
.hm-img img { position: absolute; inset: 8%; width: 84%; height: 84%; object-fit: contain; transition: transform .6s; }
.hm-img > b { position: absolute; inset: 0; display: grid; place-items: center; color: var(--hm-red); font-size: 2.4em; }
.hm-card:hover .hm-img img { transform: scale(1.06); }
.hm-wish { position: absolute; top: 10px; inset-inline-end: 10px; width: 32px; height: 32px; display: grid; place-items: center; border: none; border-radius: 50%; background: rgb(255 255 255 / .9); color: #9CA3AF; box-shadow: 0 2px 8px rgb(0 0 0 / .08); transition: color .2s, transform .2s; }
.hm-wish .hm-ico { width: 18px; height: 18px; }
.hm-wish:hover, .hm-wish.on { color: var(--hm-red); transform: scale(1.1); }
.hm-wish.on .hm-ico { fill: currentColor; }
.hm-card-body { display: grid; gap: 6px; padding: 12px 14px 14px; flex: 1; align-content: start; }
.hm-card-name { font-weight: 700; font-size: .95em; line-height: 1.6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hm-card-name:hover { color: var(--hm-red); }
.hm-card-desc { color: var(--hm-muted); font-size: .78em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hm-card-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 4px; }
.hm-card-foot small { color: var(--hm-muted); font-size: .74em; white-space: nowrap; }
.hm-price { display: grid; line-height: 1.4; }
.hm-price b { color: var(--hm-red); font-weight: 800; font-size: .98em; }
.hm-price s { color: #9CA3AF; font-size: .74em; }

/* Banners */
.hm-banner-wide .hm-banner { display: block; }
.hm-banner-wide img { display: block; width: 100%; max-height: 420px; object-fit: cover; }
.hm-banner-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.hm-banner-pair .hm-banner { display: block; overflow: hidden; border-radius: var(--hm-radius); box-shadow: var(--hm-shadow); }
.hm-banner-pair img { display: block; width: 100%; aspect-ratio: 820 / 328; object-fit: cover; transition: transform .6s; }
.hm-banner-pair .hm-banner:hover img { transform: scale(1.03); }

/* Sliders (offers, comments): radios sit mid-section so picking one never scrolls */
.hm-offers .hm-wrap, .hm-quotes .hm-wrap { position: relative; }
.hm-dot { position: absolute; top: 50%; left: 50%; width: 1px; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.hm-offer-stack, .hm-quote-stack { display: grid; }
.hm-offer, .hm-quote { grid-area: 1 / 1; opacity: 0; visibility: hidden; transform: translateY(12px); transition: opacity .6s, visibility .6s, transform .6s; }
.hm-offer:only-child, .hm-quote:only-child, ${[1, 2, 3, 4, 5].map((n) => `.hm-dot:nth-of-type(${n}):checked ~ .hm-offer-stack > :nth-child(${n}), .hm-dot:nth-of-type(${n}):checked ~ .hm-quote-stack > :nth-child(${n})`).join(", ")} { opacity: 1; visibility: visible; transform: none; }
.hm-dots { display: flex; justify-content: center; gap: 6px; }
.hm-dots label { width: 8px; height: 8px; border-radius: 999px; background: #D6CDC2; cursor: pointer; transition: width .3s, background .3s; }
.hm-dots label.on { width: 26px; background: var(--hm-red); }

/* Timed offers */
.hm-offer { position: relative; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 26px; align-items: center; width: min(860px, 100%); margin-inline: auto; padding: 22px 26px 46px; background: #fff; border-radius: 20px; box-shadow: var(--hm-shadow); }
.hm-offer-pic { position: relative; order: 2; display: block; aspect-ratio: 4 / 3; border-radius: 14px; overflow: hidden; background: #FAFAFA; }
.hm-offer-pic img { width: 100%; height: 100%; object-fit: contain; }
.hm-offer-pic .hm-tag { top: 10px; bottom: auto; inset-inline-start: 10px; inset-inline-end: auto; }
.hm-offer-info { display: grid; justify-items: start; gap: 12px; }
.hm-offer-info h3 { font-size: 1.45em; font-weight: 800; }
.hm-specs-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.hm-specs-chips span { padding: 3px 12px; border: 1px solid var(--hm-line); border-radius: 999px; font-size: .78em; color: var(--hm-muted); }
.hm-offer-price { display: grid; gap: 2px; }
.hm-offer-price s { color: #9CA3AF; font-size: .9em; }
.hm-offer-price span { display: flex; align-items: center; gap: 10px; }
.hm-offer-price b { color: var(--hm-red); font-size: 1.75em; font-weight: 800; }
.hm-offer-price i { padding: 2px 10px; border-radius: 999px; background: #FEE2E2; color: #DC2626; font-size: .78em; font-style: normal; font-weight: 700; }
.hm-timer { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border: 1px solid #F3D9DF; border-radius: 14px; background: #FFF7F8; }
.hm-timer-label { display: inline-flex; align-items: center; gap: 4px; color: var(--hm-red); font-size: .8em; font-weight: 700; }
.hm-timer-label .hm-ico { width: 16px; height: 16px; }
.hm-timer-box { display: grid; justify-items: center; min-width: 44px; padding: 3px 6px; border-radius: 10px; background: #fff; box-shadow: 0 1px 4px rgb(0 0 0 / .08); }
.hm-timer-box b { font-size: 1.05em; }
.hm-timer-box small { color: var(--hm-muted); font-size: .66em; }
.hm-arrow { position: absolute; top: 50%; width: 38px; height: 38px; margin-top: -19px; display: grid; place-items: center; border-radius: 50%; background: #fff; color: var(--hm-ink); box-shadow: 0 4px 12px rgb(0 0 0 / .12); cursor: pointer; transition: background .2s, color .2s; }
.hm-arrow:hover { background: var(--hm-red); color: #fff; }
.hm-arrow.prev { right: -19px; }
.hm-arrow.next { left: -19px; }
.hm-offer .hm-dots { position: absolute; bottom: 16px; inset-inline: 0; }

/* Customer comments */
.hm-quote { display: grid; justify-items: center; gap: 10px; width: min(560px, 100%); margin-inline: auto; padding: 30px 30px 24px; background: #fff; border-radius: 20px; box-shadow: var(--hm-shadow); text-align: center; }
.hm-avatar { display: grid; place-items: center; width: 64px; height: 64px; overflow: hidden; border-radius: 50%; background: color-mix(in srgb, var(--hm-red) 12%, #fff); color: var(--hm-red); font-size: 1.4em; font-weight: 800; }
.hm-avatar img { width: 100%; height: 100%; object-fit: cover; }
.hm-stars { display: flex; gap: 2px; color: #F59E0B; }
.hm-stars .hm-ico { width: 18px; height: 18px; fill: currentColor; stroke: none; }
.hm-quote blockquote { margin: 0; color: #374151; line-height: 2; }

/* Chosen-category showcase */
.hm-wide-card { display: flex; flex-direction: column; overflow: hidden; background: #fff; border-radius: 14px; box-shadow: var(--hm-shadow); transition: transform .3s, box-shadow .3s; }
.hm-wide-card:hover { transform: translateY(-4px); box-shadow: 0 16px 30px -14px rgb(80 10 30 / .3); }
.hm-wide-pic .hm-img { aspect-ratio: 4 / 3; }
.hm-wide-pic .hm-img img { inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hm-wide-body { display: grid; gap: 6px; padding: 14px 16px 16px; flex: 1; align-content: start; }
.hm-wide-body > b { font-size: 1em; }
.hm-wide-body > p { color: var(--hm-muted); font-size: .82em; line-height: 1.9; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.hm-more { display: inline-flex; align-items: center; gap: 2px; color: var(--hm-red); font-size: .82em; font-weight: 700; }
.hm-more .hm-ico { width: 15px; height: 15px; }

/* Footer: newsletter band, four columns, closing line */
.hm-foot { margin-top: 0; background: var(--hm-red); color: rgb(255 255 255 / .86); font-size: .9em; }
.hm-news { border-bottom: 1px solid rgb(255 255 255 / .12); }
.hm-news-in { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; padding-block: 26px; }
.hm-news h3 { color: #fff; font-size: 1.1em; }
.hm-news p { font-size: .9em; opacity: .85; }
.hm-news-form { display: flex; gap: 8px; width: min(440px, 100%); }
.hm-news-form input { flex: 1; min-width: 0; padding: 10px 16px; border: 1px solid rgb(255 255 255 / .25); border-radius: 10px; background: rgb(255 255 255 / .08); color: #fff; font: inherit; outline: none; }
.hm-news-form input::placeholder { color: rgb(255 255 255 / .6); }
.hm-news-form button { padding: 10px 22px; border: 1px solid rgb(255 255 255 / .35); border-radius: 10px; background: rgb(255 255 255 / .14); color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
.hm-news-form button:hover { background: rgb(255 255 255 / .24); }
.hm-foot-cols { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1.2fr; padding-block: 36px; }
.hm-foot-cols > div { display: grid; align-content: start; justify-items: start; gap: 10px; padding-inline: clamp(14px, 2.4cqi, 30px); border-inline-start: 1px solid rgb(255 255 255 / .14); }
.hm-foot-cols > div:first-child { padding-inline-start: 0; border: none; }
.hm-foot h4 { position: relative; margin-bottom: 6px; padding-bottom: 6px; color: #fff; font-size: 1.02em; }
.hm-foot h4::after { content: ""; position: absolute; inset-inline-start: 0; bottom: 0; width: 100%; height: 2px; border-radius: 2px; background: rgb(255 255 255 / .55); }
.hm-foot a:hover { color: #fff; }
.hm-foot-logo { display: inline-flex; align-items: center; gap: 10px; color: #fff; font-size: 1.2em; font-weight: 800; }
.hm-foot-logo span { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; background: rgb(255 255 255 / .14); }
.hm-foot-brand p { line-height: 2; font-size: .92em; }
.hm-foot-contact a, .hm-foot-contact span { display: inline-flex; align-items: center; gap: 8px; }
.hm-foot-contact .hm-ico { width: 17px; height: 17px; opacity: .8; }
.hm-socials { gap: 8px; }
.hm-socials a, .hm-socials .p-ghost { width: 34px; height: 34px; border-radius: 50%; background: rgb(255 255 255 / .12); color: #fff; }
.hm-foot-end { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding-block: 16px; border-top: 1px solid rgb(255 255 255 / .12); font-size: .82em; opacity: .85; }
.hm-foot-end span { display: inline-flex; gap: 10px; }

/* Shop page */
.hm-main:not(.home) { background: #F9FAFB; }
.hm-shop, .hm-inner, .hm-product { padding-block: 22px clamp(36px, 5cqi, 64px); }
.hm-trail { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 16px; color: var(--hm-muted); font-size: .84em; }
.hm-trail i { margin-inline-end: 6px; font-style: normal; opacity: .6; }
.hm-trail a:hover { color: var(--hm-red); }
.hm-shop-in { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: 24px; align-items: start; }
.hm-filters { position: sticky; top: 16px; display: grid; gap: 14px; padding: 18px; font-size: .88em; }
.hm-filters h2 { display: flex; align-items: center; gap: 8px; font-size: 1.05em; }
.hm-filters h2::before { content: ""; width: 4px; height: 18px; border-radius: 4px; background: var(--hm-red); }
.hm-filters label { display: grid; gap: 6px; color: var(--hm-muted); }
.hm-filters fieldset { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0; padding: 0; border: none; color: var(--hm-muted); }
.hm-filters legend { grid-column: 1 / -1; margin-bottom: 6px; }
.hm-filters input:not([type="checkbox"]), .hm-filters select { width: 100%; padding: 9px 12px; border: 1px solid #E5E7EB; border-radius: 10px; background: #fff; color: var(--hm-ink); font: inherit; }
.hm-filters input:focus, .hm-filters select:focus { outline: none; border-color: var(--hm-red); box-shadow: 0 0 0 3px color-mix(in srgb, var(--hm-red) 12%, transparent); }
.hm-check { display: flex !important; grid-template-columns: none; align-items: center; gap: 8px !important; color: var(--hm-ink) !important; cursor: pointer; }
.hm-check input { width: 17px; height: 17px; accent-color: var(--hm-red); }
.hm-filters .hm-btn { padding: 10px; }
.hm-shop-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
.hm-shop-head h1 { font-size: 1.35em; }
.hm-shop-head small { color: var(--hm-muted); }
.hm-notice { padding: 30px; text-align: center; color: var(--hm-muted); }

/* Product page: beige background, gallery card and information card */
.hm-main:has(.hm-product) { background: var(--hm-beige); }
.hm-product-in { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; align-items: start; }
.hm-gallery { padding: 16px; }
.hm-gallery-main { display: grid; }
.hm-gal { grid-area: 1 / 1; display: block; aspect-ratio: 1; border-radius: 12px; overflow: hidden; background: #fff; cursor: zoom-in; }
.hm-gal img, .hm-gal > span { display: block; width: 100%; height: 100%; object-fit: contain; }
${[1, 2, 3, 4, 5, 6].map((n) => `.hm-gallery:has(.hm-thumb:nth-child(${n}) input:checked) .hm-gallery-main > :not(:nth-child(${n}))`).join(", ")} { visibility: hidden; opacity: 0; }
.hm-gallery-main > * { transition: opacity .4s; }
.hm-thumbs { display: flex; justify-content: center; gap: 10px; margin-top: 14px; }
.hm-thumb { position: relative; width: 70px; height: 70px; overflow: hidden; border: 2px solid transparent; border-radius: 10px; background: #fff; box-shadow: 0 1px 4px rgb(0 0 0 / .1); cursor: pointer; }
.hm-thumb img { width: 100%; height: 100%; object-fit: cover; }
.hm-thumb input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer; }
.hm-thumb:has(input:checked) { border-color: var(--hm-red); }
.hm-pinfo { display: grid; gap: 14px; padding: 24px; }
.hm-pinfo h1 { font-size: 1.6em; font-weight: 800; }
.hm-pprice { display: grid; justify-items: start; gap: 4px; }
.hm-pprice span { display: flex; align-items: center; gap: 8px; }
.hm-pprice s { color: #9CA3AF; }
.hm-pprice > b { color: var(--hm-red); font-size: 1.7em; font-weight: 800; }
.hm-pdesc { color: #4B5563; line-height: 2; }
.hm-specs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 0; padding: 14px 16px; border: 1px solid #EEF0F2; border-radius: 12px; background: #FAFAFA; font-size: .88em; }
.hm-specs div { display: flex; gap: 6px; }
.hm-specs dt { color: var(--hm-muted); }
.hm-specs dd { margin: 0; font-weight: 700; }
.hm-buy { display: grid; gap: 14px; }
.hm-options { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0; padding: 0; border: none; }
.hm-options legend { float: inline-start; margin-inline-end: 6px; color: var(--hm-muted); font-size: .9em; }
.hm-options label { position: relative; cursor: pointer; }
.hm-options input { position: absolute; opacity: 0; }
.hm-options span { display: inline-block; padding: 7px 16px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: .88em; font-weight: 700; transition: all .2s; }
.hm-options input:checked + span { background: var(--hm-red); border-color: var(--hm-red); color: #fff; }
.hm-options input:focus-visible + span { outline: 2px solid var(--hm-red); outline-offset: 2px; }
.hm-stock { display: flex; align-items: center; gap: 6px; padding: 10px 14px; border: 1px solid #BBF7D0; border-radius: 10px; background: #F0FDF4; color: #15803D; font-size: .88em; font-weight: 600; }
.hm-stock .hm-ico { width: 16px; height: 16px; }
.hm-stock.out { border-color: #FECACA; background: #FEF2F2; color: #B91C1C; }
.hm-qty { display: inline-flex; align-items: center; gap: 10px; color: var(--hm-muted); font-size: .9em; }
.hm-qty input { width: 80px; padding: 8px 10px; border: 1px solid #E5E7EB; border-radius: 10px; font: inherit; text-align: center; }
.hm-wish-line { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: none; background: none; color: var(--hm-muted); font-size: .9em; }
.hm-wish-line:hover, .hm-wish-line.on { color: var(--hm-red); }
.hm-wish-line.on .hm-ico { fill: currentColor; }
.hm-share { display: flex; align-items: center; gap: 8px; color: var(--hm-muted); font-size: .88em; }
.hm-share a { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: #F3F4F6; color: var(--hm-ink); }
.hm-share a:hover { background: var(--hm-red); color: #fff; }
.hm-share .p-ico { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; }
.hm-pinfo .hm-muted a { color: var(--hm-red); }
.hm-assure { display: flex; flex-wrap: wrap; gap: 18px; padding-top: 12px; border-top: 1px solid #F1F1F1; color: var(--hm-muted); font-size: .84em; }
.hm-assure li { display: inline-flex; align-items: center; gap: 6px; }

/* Cart, checkout and the rest */
.hm-page-head { margin-bottom: 18px; }
.hm-page-head h1 { font-size: 1.5em; font-weight: 800; }
.hm-empty { display: grid; justify-items: center; gap: 14px; padding: 50px 20px; text-align: center; color: var(--hm-muted); }
.hm-empty-ico { width: 54px; height: 54px; color: color-mix(in srgb, var(--hm-red) 40%, #fff); stroke-width: 1.3; }
.hm-cart { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 22px; align-items: start; }
.hm-lines { padding: 6px 20px; }
.hm-line { display: grid; grid-template-columns: 84px minmax(0, 1fr) auto auto auto; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid #F1F1F1; }
.hm-line:last-child { border-bottom: none; }
.hm-line-pic { display: block; aspect-ratio: 1; overflow: hidden; border-radius: 12px; background: #FAFAFA; }
.hm-line-pic img { width: 100%; height: 100%; object-fit: contain; }
.hm-line-info { display: grid; gap: 3px; }
.hm-line-info small { color: var(--hm-muted); }
.hm-stepper { display: inline-flex; align-items: center; gap: 4px; padding: 4px; border: 1px solid #E5E7EB; border-radius: 12px; }
.hm-stepper button { width: 30px; height: 30px; border: none; border-radius: 8px; background: #F3F4F6; font-weight: 800; }
.hm-stepper button:hover { background: var(--hm-red); color: #fff; }
.hm-stepper span { min-width: 26px; text-align: center; font-weight: 700; }
.hm-line-total { min-width: 8em; text-align: end; color: var(--hm-red); }
.hm-remove { display: grid; place-items: center; width: 36px; height: 36px; border: none; border-radius: 10px; background: #FEF2F2; color: #DC2626; }
.hm-remove .hm-ico { width: 18px; height: 18px; }
.hm-sum { position: sticky; top: 16px; display: grid; gap: 14px; padding: 22px; }
.hm-sum h2 { font-size: 1.1em; }
.hm-sum dl { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin: 0; font-size: .92em; }
.hm-sum dt { color: var(--hm-muted); }
.hm-sum dd { margin: 0; font-weight: 700; }
.hm-sum .total { padding-top: 12px; border-top: 1px dashed #E5E7EB; color: var(--hm-ink); font-weight: 800; }
.hm-sum dd.total { color: var(--hm-red); font-size: 1.15em; }
.hm-sum small { color: var(--hm-muted); }
.hm-sum dd.hm-off { color: #15803D; }
.hm-reviews-wrap { margin-top: 24px; }
.hm-reviews-wrap .sk-reviews { box-shadow: var(--hm-shadow); border: none; }
.hm-card .sk-stars svg { width: 13px; height: 13px; }
.hm-sum-lines { display: grid; gap: 8px; font-size: .88em; }
.hm-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.hm-pay { padding: 12px 14px; border-radius: 12px; background: var(--hm-cream-2); color: #4B5563; font-size: .86em; line-height: 1.9; }
.hm-checkout { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 22px; }
.hm-checkout h2, .hm-checkout .full, .hm-checkout .hm-error { grid-column: 1 / -1; }
.hm-checkout label { display: grid; gap: 6px; color: var(--hm-muted); font-size: .9em; }
.hm-checkout input, .hm-checkout textarea { width: 100%; padding: 11px 14px; border: 1px solid #E5E7EB; border-radius: 12px; font: inherit; color: var(--hm-ink); }
.hm-checkout input:focus, .hm-checkout textarea:focus { outline: none; border-color: var(--hm-red); box-shadow: 0 0 0 3px color-mix(in srgb, var(--hm-red) 12%, transparent); }
.hm-error { padding: 10px 14px; border-radius: 10px; background: #FEF2F2; color: #B91C1C; }
.hm-trap { position: absolute; inset-inline-start: 0; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }
.hm-search-big { display: flex; gap: 10px; margin-bottom: 22px; padding: 14px; }
.hm-search-big input { flex: 1; min-width: 0; padding: 12px 16px; border: 1px solid #E5E7EB; border-radius: 12px; font: inherit; }
.hm-thanks { display: grid; justify-items: center; gap: 14px; max-width: 560px; margin: 20px auto; padding: 40px 24px; text-align: center; }
.hm-done { display: grid; place-items: center; width: 70px; height: 70px; border-radius: 50%; background: #DCFCE7; color: #15803D; animation: hm-in .6s both; }
.hm-done .hm-ico { width: 36px; height: 36px; stroke-width: 2.4; }
.hm-thanks h1 { font-size: 1.4em; }

/* Phone tab bar (narrow screens only); sticky so it stays at the bottom of the screen */
.hm-tabbar { display: none; }

@container (max-width: 1100px) {
  .hm-grid.five { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .hm-nav { display: none; }
  .hm-head-in { grid-template-columns: auto 1fr; }
  .hm-logo { justify-items: start; }
}
@container (max-width: 860px) {
  .hm-grid.five, .hm-grid.four, .hm-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .hm-shop-in, .hm-product-in, .hm-cart { grid-template-columns: 1fr; }
  .hm-filters, .hm-sum { position: static; }
  .hm-foot-cols { grid-template-columns: 1fr 1fr; gap: 26px 0; }
  .hm-foot-cols > div:nth-child(3) { padding-inline-start: 0; border: none; }
  .hm-offer { grid-template-columns: 1fr; }
  .hm-offer-pic { order: 0; }
  .hm-arrow.prev { right: 6px; }
  .hm-arrow.next { left: 6px; }
}
@container (max-width: 640px) {
  .hm { font-size: 14px; }
  .hm-head-in { min-height: 58px; gap: 10px; }
  .hm-search, .hm-hide-sm { display: none; }
  .hm-logo b { font-size: 1.45em; }
  .hm-hero-in { grid-template-columns: 1fr 1fr; min-height: 0; gap: 10px; padding-block: 24px; }
  .hm-hero h1 { font-size: 1.6em; }
  .hm-kicker::after { display: none; }
  .hm-hero-sub { font-size: .92em; }
  .hm-hero-btns .hm-btn { padding: 10px 18px; }
  /* Product rows scroll sideways on phones, as in the reference */
  .hm-grid.five, .hm-grid.four { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; scrollbar-width: none; }
  .hm-grid.five > *, .hm-grid.four > * { flex: 0 0 46%; scroll-snap-align: start; }
  .hm-grid.three { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hm-showcase .hm-grid.four { display: grid; grid-template-columns: 1fr; }
  .hm-pills { flex-wrap: nowrap; justify-content: flex-start; overflow-x: auto; scrollbar-width: none; }
  .hm-pill { flex: none; }
  .hm-banner-pair { grid-template-columns: 1fr; }
  .hm-foot-cols { grid-template-columns: 1fr 1fr; gap: 24px 16px; }
  .hm-foot-cols > div { padding-inline: 0; border: none; }
  .hm-foot-brand, .hm-foot-contact { grid-column: 1 / -1; }
  .hm-arrow { top: auto; bottom: 8px; margin-top: 0; width: 32px; height: 32px; }
  .hm-arrow.prev { right: 16px; }
  .hm-arrow.next { left: 16px; }
  .hm-offer { padding: 16px 16px 50px; }
  .hm-news-in { flex-direction: column; align-items: stretch; }
  .hm-news-form { width: 100%; }
  .hm-line { grid-template-columns: 70px minmax(0, 1fr) auto; }
  .hm-line .hm-stepper { grid-column: 2; }
  .hm-line-total { grid-column: 2 / -1; grid-row: 3; justify-self: end; min-width: 0; }
  .hm-checkout { grid-template-columns: 1fr; }
  .hm-specs { grid-template-columns: 1fr; }
  .hm-timer { flex-wrap: wrap; }
  .hm-tabbar { position: sticky; bottom: 0; z-index: 40; display: grid; grid-template-columns: repeat(5, 1fr); padding: 6px 4px calc(6px + env(safe-area-inset-bottom)); border-top: 1px solid #EEE; background: #fff; box-shadow: 0 -6px 18px -10px rgb(0 0 0 / .2); }
  .hm-tabbar a { position: relative; display: grid; justify-items: center; gap: 2px; color: var(--hm-muted); font-size: .7em; }
  .hm-tabbar a[aria-current="page"] { color: var(--hm-red); }
  .hm-tabbar .hm-ico { width: 21px; height: 21px; }
  .hm-tabbar b { position: absolute; top: -4px; left: calc(50% - 18px); min-width: 16px; height: 16px; padding: 0 3px; display: grid; place-items: center; border-radius: 999px; background: var(--hm-red); color: #fff; font-size: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .hm-hero-text, .hm-hero-pic, .hm-card, .hm-done { animation: none !important; }
  .hm-offer, .hm-quote, .hm-gallery-main > * { transition: none !important; }
}
`;
