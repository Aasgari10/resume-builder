/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Boutique": an online clothing shop. Home page with a hero, categories, product grids, a look
// book, newest trends, customer words and shop perks; plus the shop pages: all products, a
// category, a product, cart, wishlist, search, checkout and the order confirmation.
// The page works without scripts: cart and wishlist buttons are small forms the server answers
// (see apps/api/src/routes/shop.ts); in the editor the preview answers them itself.

import type { CSSProperties, ReactNode } from "react";
import { emptyVisitor, formatToman, priceCart, unitPrice, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { Icon, Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";

export const BOUTIQUE_BLOCKS = [
  { key: "announcements", label: "نوار اطلاعیه‌ی بالا" },
  { key: "categories", label: "دسته‌ها و پیشنهاد ویژه" },
  { key: "products", label: "محصولات صفحه‌ی اول" },
  { key: "band", label: "نوار متحرک" },
  { key: "look", label: "بخش «کمد لباست را تازه کن»" },
  { key: "brands", label: "کادرهای دسته‌ها" },
  { key: "trends", label: "جدیدترین‌ها" },
  { key: "testimonials", label: "نظر مشتری‌ها" },
  { key: "perks", label: "مزیت‌های فروشگاه" },
] as const;

const visible = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && p.name.trim());

/** Every page this shop has: the fixed shop pages, one per category and one per product. */
export function boutiquePages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const products = visible(shop);
  const cats = (shop?.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
  return ["/", "/shop", ...cats.map((c) => `/category/${c.id}`), ...products.map((p) => `/product/${p.id}`), "/cart", "/wishlist", "/search", "/checkout", "/thanks"];
}

type BView = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; visitor: Visitor; page: string };

export function BoutiqueShop(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = boutiquePages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: BView = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), visitor: props.visitor ?? emptyVisitor(), page };
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
  else body = <Thanks {...view} />;
  return (
    <WebPage ctx={ctx} className="bq" css={partsCss + css}>
      {blockOn(ctx.data, "announcements") && <Announcements {...view} />}
      <Header {...view} />
      <main className="bq-main" key={page}>
        {body}
      </main>
      <Footer {...view} />
      <Floating {...view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const SVG: Record<string, string> = {
  bag: "M6 8h12l-1 12H7z M9 8V6a3 3 0 0 1 6 0v2",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4-4",
  heart: "M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z",
  user: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4 21c1-4 4-6 8-6s7 2 8 6",
  menu: "M3 7h18 M3 12h18 M3 17h18",
  trash: "M5 7h14 M10 7V5h4v2 M7 7l1 13h8l1-13",
  truck: "M3 7h11v9H3z M14 10h4l3 3v3h-7 M7 19a1.5 1.5 0 1 0 0-.1 M17 19a1.5 1.5 0 1 0 0-.1",
  tag: "M3 12V4h8l10 10-8 8z M8 8.5v.01",
  chat: "M4 5h16v11H9l-5 4z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
  store: "M4 10l2-6h12l2 6 M4 10h16v10H4z M9 20v-5h6v5",
  chevron: "M15 5l-7 7 7 7",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
};
const PERK_ICONS = ["store", "tag", "chat", "shield"];

function Svg({ name, className = "bq-ico" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={SVG[name] ?? ""} />
    </svg>
  );
}

const money = (view: BView, n: number) => formatToman(n, view.ctx.data.locale);
const pic = (p: Product) => safeUrl(p.images[0]);
const productPath = (p: Product) => `/product/${p.id}`;
const P = (id: string) => item("site.shop.products", id);

/** A small form that sends one cart or wishlist change and comes back to this page. */
function Act({ view, op, id, children, className, qty, size, label }: { view: BView; op: "add" | "remove" | "wish" | "set"; id: string; children: ReactNode; className?: string; qty?: number; size?: string; label?: string }) {
  return (
    <form method="post" action={view.link("/_cart")} className="bq-act">
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

function Price({ view, p }: { view: BView; p: Product }) {
  const now = unitPrice(p);
  return (
    <span className="bq-price">
      <b>{money(view, now)}</b>
      {now < p.price && <s>{money(view, p.price)}</s>}
    </span>
  );
}

function ProductCard({ view, p, i = 0 }: { view: BView; p: Product; i?: number }) {
  const img = pic(p);
  const wished = view.visitor.wishlist.includes(p.id);
  const soldOut = p.stock === 0;
  return (
    <article className="bq-card" style={{ "--i": i } as CSSProperties}>
      <div className="bq-card-pic">
        <PageLink to={productPath(p)} link={view.link}>
          <span className="bq-img" {...ed(`${P(p.id)}.images.0`, "image", "عکس محصول")}>
            {img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}
          </span>
        </PageLink>
        {(p.badge || soldOut) && <span className="bq-badge">{soldOut ? "ناموجود" : p.badge}</span>}
        <div className="bq-card-acts">
          <Act view={view} op="wish" id={p.id} className={`bq-round${wished ? " on" : ""}`} label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
            <Svg name="heart" />
          </Act>
          {!soldOut &&
            (p.sizes?.length ? (
              <PageLink to={productPath(p)} link={view.link} className="bq-round" current={false}>
                <Svg name="bag" />
              </PageLink>
            ) : (
              <Act view={view} op="add" id={p.id} className="bq-round" label="افزودن به سبد خرید">
                <Svg name="bag" />
              </Act>
            ))}
        </div>
      </div>
      <PageLink to={productPath(p)} link={view.link} className="bq-card-name">
        <span {...ed(`${P(p.id)}.name`, "text", "نام محصول")}>{p.name}</span>
      </PageLink>
      <Price view={view} p={p} />
    </article>
  );
}

function Title({ title, text, path, editKind = "text" }: { title?: string; text?: string; path?: string; editKind?: "text" | "multiline" }) {
  return (
    <div className="bq-title">
      <h2 {...(path ? ed(path, editKind, "عنوان") : {})}>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

/** Wide picture with the page name and a "home / page" trail, at the top of inner pages. */
function Banner({ view, title, trail }: { view: BView; title: string; trail?: { label: string; to?: string }[] }) {
  const img = safeUrl(view.ctx.data.site?.accentImage);
  return (
    <section className="bq-banner">
      <span className="bq-banner-pic" {...ed("site.accentImage", "image", "تصویر سربرگ صفحه‌ها")}>
        {img && <img src={img} alt="" />}
      </span>
      <div>
        <h1>{title}</h1>
        <nav className="bq-trail">
          <PageLink to="/" link={view.link}>
            خانه
          </PageLink>
          {(trail ?? [{ label: title }]).map((t, k) => (
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
      </div>
    </section>
  );
}

function Empty({ view, text }: { view: BView; text: string }) {
  return (
    <div className="bq-wrap bq-empty">
      <p className="bq-notice">{text}</p>
      <PageLink to="/shop" link={view.link} className="bq-btn">
        بازگشت به فروشگاه
      </PageLink>
    </div>
  );
}

/* ───────────── Frame: top strip, header, footer ───────────── */

function Announcements({ shop, link }: BView) {
  const items = (shop.announcements ?? []).filter((a) => a.trim());
  if (!items.length) return null;
  return (
    <div className="bq-ann" {...ed("site.shop.announcements", "lines", "اطلاعیه‌ها (هر خط یکی)")}>
      {items.map((a, k) => (
        <span key={k}>
          {k > 0 && <i aria-hidden="true" />}
          {a}{" "}
          <PageLink to="/shop" link={link}>
            خرید کنید
          </PageLink>
        </span>
      ))}
    </div>
  );
}

function Header(view: BView) {
  const { ctx, link, visitor, shop, editing } = view;
  const b = ctx.data.basics;
  const count = priceCart(shop, visitor.cart).count;
  const cats = (shop.categories ?? []).filter((c) => visible(shop).some((p) => p.categoryId === c.id)).slice(0, 4);
  return (
    <>
      <div className="bq-info bq-wrap">
        <Opt value={ctx.data.site?.tagline} editing={editing} edit={ed("site.tagline", "text", "شعار فروشگاه")}>
          <span {...ed("site.tagline", "text", "شعار فروشگاه")}>{ctx.data.site?.tagline}</span>
        </Opt>
        <PageLink to="/shop" link={link} className="bq-strong">
          مشاهده‌ی محصولات
        </PageLink>
        <span className="bq-info-end">
          {b.phone && (
            <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
              {b.phone}
            </a>
          )}
          {b.email && (
            <a href={`mailto:${b.email}`} dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
              {b.email}
            </a>
          )}
        </span>
      </div>
      <header className="bq-head bq-wrap">
        <PageLink to="/" link={link} className="bq-logo">
          <span {...ed("basics.fullName", "text", "نام فروشگاه")}>{b.fullName}</span>
          <i>.</i>
        </PageLink>
        <nav className="bq-nav">
          <PageLink to="/" link={link} current={view.page === "/"}>
            خانه
          </PageLink>
          <PageLink to="/shop" link={link} current={view.page === "/shop"}>
            فروشگاه
          </PageLink>
          {cats.map((c) => (
            <PageLink key={c.id} to={`/category/${c.id}`} link={link} current={view.page === `/category/${c.id}`}>
              {c.name}
            </PageLink>
          ))}
        </nav>
        <div className="bq-icons">
          <PageLink to="/cart" link={link} className="bq-icon">
            <Svg name="bag" />
            {count > 0 && <b>{new Intl.NumberFormat("fa-IR").format(count)}</b>}
            <span className="sr-only">سبد خرید</span>
          </PageLink>
          <PageLink to="/search" link={link} className="bq-icon">
            <Svg name="search" />
            <span className="sr-only">جست‌وجو</span>
          </PageLink>
          <PageLink to="/wishlist" link={link} className="bq-icon">
            <Svg name="heart" />
            <b className={visitor.wishlist.length ? "" : "zero"}>{new Intl.NumberFormat("fa-IR").format(visitor.wishlist.length)}</b>
            <span className="sr-only">علاقه‌مندی‌ها</span>
          </PageLink>
        </div>
      </header>
    </>
  );
}

function Footer({ ctx, link, editing }: BView) {
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const rows: { icon: string; label: string; value?: string; path: string; href?: string }[] = [
    { icon: "pin", label: "نشانی", value: site?.address || b.location, path: "site.address" },
    { icon: "mail", label: "ایمیل", value: b.email, path: "basics.email", href: b.email ? `mailto:${b.email}` : undefined },
    { icon: "phone", label: "تماس", value: b.phone, path: "basics.phone", href: b.phone ? `tel:${b.phone.replace(/[^\d+]/g, "")}` : undefined },
  ];
  return (
    <footer className="bq-foot">
      <div className="bq-wrap">
        <PageLink to="/" link={link} className="bq-logo">
          {b.fullName}
          <i>.</i>
        </PageLink>
        <Opt value={b.summary} editing={editing} edit={ed("basics.summary", "multiline", "معرفی کوتاه فروشگاه")}>
          <p className="bq-foot-text" {...ed("basics.summary", "multiline", "معرفی کوتاه فروشگاه")}>
            {b.summary}
          </p>
        </Opt>
        <div className="bq-foot-rows">
          {rows.map((r) => (
            <div key={r.path}>
              <span className="bq-circle">
                <Icon name={r.icon} />
              </span>
              <span>
                <small>{r.label}</small>
                <Opt value={r.value} editing={editing} edit={ed(r.path, "text", r.label)}>
                  {r.href ? (
                    <a href={r.href} dir="auto" {...ed(r.path, "text", r.label)}>
                      {r.value}
                    </a>
                  ) : (
                    <b {...ed(r.path, "text", r.label)}>{r.value}</b>
                  )}
                </Opt>
              </span>
            </div>
          ))}
        </div>
        <nav className="bq-foot-nav">
          <PageLink to="/" link={link}>
            خانه
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
        </nav>
        <Socials ctx={ctx} editing={editing} className="bq-foot-socials" />
        <small className="bq-copy">© همه‌ی حقوق برای {b.fullName} محفوظ است.</small>
      </div>
    </footer>
  );
}

function Floating({ ctx }: BView) {
  const wa = ctx.data.basics.links.find((l) => l.type === "whatsapp" && safeUrl(l.url));
  const phone = ctx.data.basics.phone?.replace(/[^\d+]/g, "");
  const href = wa ? safeUrl(wa.url) : phone ? `tel:${phone}` : undefined;
  return (
    <div className="bq-float">
      {href && (
        <a href={href} {...outside(href)} className="bq-chat">
          <span>گفت‌وگو با ما 👋</span>
          <i>
            <Svg name="chat" />
          </i>
        </a>
      )}
      <a href="#" className="bq-top" aria-label="بالای صفحه">
        <Svg name="chevron" />
      </a>
    </div>
  );
}

/* ───────────── Home ───────────── */

function Home(view: BView) {
  const { ctx, shop, link, editing } = view;
  const data = ctx.data;
  const on = (k: string) => blockOn(data, k);
  const products = visible(shop);
  const cats = (shop.categories ?? []).map((c) => ({ ...c, count: products.filter((p) => p.categoryId === c.id).length })).filter((c) => c.count > 0);
  const featured = products.filter((p) => p.featured).slice(0, 3);
  const trendPics = featured.length ? featured : products.slice(0, 3);
  const look = products.find((p) => p.featured) ?? products[0];
  const hero = safeUrl(shop.heroImage);
  const tall = safeUrl(data.site?.aboutImage);
  const testimonials = data.site?.testimonials ?? [];
  return (
    <>
      <section className="bq-hero">
        <span className="bq-hero-pic" {...ed("site.shop.heroImage", "image", "تصویر اصلی")}>
          {hero && <img src={hero} alt="" />}
        </span>
        <div className="bq-hero-text">
          <Opt value={shop.heroTitle} editing={editing} edit={ed("site.shop.heroTitle", "text", "تیتر اصلی")}>
            <h1 {...ed("site.shop.heroTitle", "text", "تیتر اصلی")}>{shop.heroTitle}</h1>
          </Opt>
          <Opt value={shop.heroText} editing={editing} edit={ed("site.shop.heroText", "multiline", "متن زیر تیتر")}>
            <p {...ed("site.shop.heroText", "multiline", "متن زیر تیتر")}>{shop.heroText}</p>
          </Opt>
          <PageLink to="/shop" link={link} className="bq-btn">
            مشاهده‌ی مجموعه
          </PageLink>
        </div>
      </section>

      {on("categories") && cats.length > 0 && (
        <section className="bq-wrap bq-cats">
          <div className="bq-cats-main">
            <div>
              <h2>تازه‌ها</h2>
              <p>هر هفته لباس‌های تازه به فروشگاه اضافه می‌شود؛ دسته‌ی دلخواهتان را انتخاب کنید.</p>
              <ul>
                {cats.map((c) => (
                  <li key={c.id}>
                    <PageLink to={`/category/${c.id}`} link={link}>
                      <span {...ed(`${item("site.shop.categories", c.id)}.name`, "text", "نام دسته")}>{c.name}</span>
                      <sup>{new Intl.NumberFormat("fa-IR").format(c.count)}</sup>
                    </PageLink>
                  </li>
                ))}
              </ul>
              <PageLink to="/shop" link={link} className="bq-btn">
                همه‌ی محصولات
              </PageLink>
            </div>
            <span className="bq-cats-pic" {...ed("site.aboutImage", "image", "عکس کنار دسته‌ها")}>
              {tall && <img src={tall} alt="" loading="lazy" />}
            </span>
          </div>
          <div className="bq-cats-side">
            <div className="bq-promo">
              <small>پیشنهاد ویژه</small>
              <Opt value={shop.promoTitle} editing={editing} edit={ed("site.shop.promoTitle", "text", "متن پیشنهاد ویژه")}>
                <h3 {...ed("site.shop.promoTitle", "text", "متن پیشنهاد ویژه")}>{shop.promoTitle}</h3>
              </Opt>
              <Opt value={shop.promoText} editing={editing} edit={ed("site.shop.promoText", "text", "توضیح پیشنهاد")}>
                <p {...ed("site.shop.promoText", "text", "توضیح پیشنهاد")}>{shop.promoText}</p>
              </Opt>
              <b className="bq-promo-logo">
                {data.basics.fullName}
                <i>.</i>
              </b>
            </div>
            {cats.slice(0, 2).map((c, k) => {
              const first = products.find((p) => p.categoryId === c.id);
              const img = safeUrl(c.image) ?? (first ? pic(first) : undefined);
              return (
                <PageLink key={c.id} to={`/category/${c.id}`} link={link} className={`bq-catcard${k ? " alt" : ""}`}>
                  <span>
                    <h3>{c.name}</h3>
                    <small>{new Intl.NumberFormat("fa-IR").format(c.count)} محصول</small>
                  </span>
                  <span className="bq-catcard-pic" {...ed(`${item("site.shop.categories", c.id)}.image`, "image", "عکس دسته")}>
                    {img && <img src={img} alt="" loading="lazy" />}
                  </span>
                </PageLink>
              );
            })}
          </div>
        </section>
      )}

      {on("products") && products.length > 0 && (
        <section className="bq-wrap bq-sec">
          <Title title="لباس‌های روزمره" text="تکه‌هایی که هر روز می‌پوشید؛ راحت، شیک و با قیمت منصفانه." />
          <div className="bq-grid">
            {products.slice(0, 8).map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        </section>
      )}

      {on("band") && (shop.bandItems ?? []).length > 0 && (
        <div className="bq-band" aria-hidden="true">
          <div className="bq-band-track" {...ed("site.shop.bandItems", "lines", "متن‌های نوار متحرک (هر خط یکی)")}>
            {[0, 1, 2, 3].flatMap((r) =>
              (shop.bandItems ?? []).map((t, k) => (
                <span key={`${r}-${k}`}>
                  {t} <i>◐</i>
                </span>
              )),
            )}
          </div>
        </div>
      )}

      {on("look") && look && (
        <section className="bq-look">
          <div className="bq-look-text">
            <Opt value={shop.lookTitle} editing={editing} edit={ed("site.shop.lookTitle", "text", "عنوان بخش")}>
              <h2 {...ed("site.shop.lookTitle", "text", "عنوان بخش")}>{shop.lookTitle}</h2>
            </Opt>
            <p>یک ترکیب آماده برای روزهای کاری و دورهمی‌ها.</p>
            <div className="bq-look-card">
              <ProductCard view={view} p={products.find((p) => p.id !== look.id && /کت|بلیزر/.test(p.name)) ?? look} />
            </div>
          </div>
          <span className="bq-look-pic" {...ed("site.shop.lookImage", "image", "عکس بزرگ")}>
            {safeUrl(shop.lookImage) && <img src={safeUrl(shop.lookImage)} alt="" loading="lazy" />}
          </span>
        </section>
      )}

      {on("brands") && cats.length > 0 && (
        <section className="bq-wrap bq-brands">
          {cats.slice(0, 3).map((c) => (
            <PageLink key={c.id} to={`/category/${c.id}`} link={link}>
              <b>{c.name}</b>
              <small>({new Intl.NumberFormat("fa-IR").format(c.count)} محصول)</small>
            </PageLink>
          ))}
        </section>
      )}

      {on("trends") && trendPics.length > 0 && (
        <section className="bq-wrap bq-sec">
          <Title title="جدیدترین‌ها" text="تازه‌ترین انتخاب‌های این فصل را از دست ندهید." />
          <div className="bq-trends">
            <span className="bq-trends-pic" {...ed("site.shop.trendImage", "image", "عکس جدیدترین‌ها")}>
              {safeUrl(shop.trendImage) && <img src={safeUrl(shop.trendImage)} alt="" loading="lazy" />}
            </span>
            <div className="bq-trends-list">
              {trendPics.map((p) => (
                <div key={p.id} className="bq-row">
                  <PageLink to={productPath(p)} link={view.link} className="bq-row-pic">
                    <span {...ed(`${P(p.id)}.images.0`, "image", "عکس محصول")}>{pic(p) && <img src={pic(p)} alt={p.name} loading="lazy" />}</span>
                  </PageLink>
                  <div>
                    <PageLink to={productPath(p)} link={view.link} className="bq-row-name">
                      <span {...ed(`${P(p.id)}.name`, "text", "نام محصول")}>{p.name}</span>
                    </PageLink>
                    <Price view={view} p={p} />
                  </div>
                  <PageLink to={productPath(p)} link={view.link} className="bq-under">
                    انتخاب گزینه‌ها
                  </PageLink>
                </div>
              ))}
              <PageLink to="/shop" link={link} className="bq-bar">
                همه‌ی جدیدترین‌ها را ببینید
              </PageLink>
            </div>
          </div>
        </section>
      )}

      {on("testimonials") && testimonials.length > 0 && (
        <section className="bq-wrap bq-sec">
          <Title title="مشتری‌ها چه می‌گویند" text="نظر چند نفر از کسانی که از ما خرید کرده‌اند." />
          <div className="bq-quotes">
            {testimonials.slice(0, 2).map((t, k) => {
              const at = item("site.testimonials", t.id);
              const prod = products[(k * 3 + 2) % Math.max(products.length, 1)];
              return (
                <div key={t.id} className="bq-quote">
                  <div className="bq-quote-box">
                    <span className="bq-stars" aria-label="۵ ستاره">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Svg key={s} name="star" className="bq-star" />
                      ))}
                    </span>
                    <Opt value={t.role} editing={editing} edit={ed(`${at}.role`, "text", "عنوان نظر")}>
                      <h3 {...ed(`${at}.role`, "text", "عنوان نظر")}>«{t.role}»</h3>
                    </Opt>
                    <p {...ed(`${at}.text`, "multiline", "متن نظر")}>{t.text}</p>
                    <b {...ed(`${at}.name`, "text", "نام مشتری")}>– {t.name}</b>
                  </div>
                  {prod && (
                    <PageLink to={productPath(prod)} link={link} className="bq-mini">
                      <span>{pic(prod) && <img src={pic(prod)} alt="" loading="lazy" />}</span>
                      <span>
                        <b>{prod.name}</b>
                        <Price view={view} p={prod} />
                      </span>
                    </PageLink>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {on("perks") && (shop.perks ?? []).length > 0 && (
        <section className="bq-wrap bq-perks">
          {(shop.perks ?? []).map((x, k) => {
            const at = item("site.shop.perks", x.id);
            return (
              <div key={x.id}>
                <span className="bq-perk-ico">
                  <Svg name={PERK_ICONS[k % 4]!} />
                </span>
                <h3 {...ed(`${at}.title`, "text", "عنوان")}>{x.title}</h3>
                <Opt value={x.text} editing={editing} edit={ed(`${at}.text`, "text", "توضیح")}>
                  <p {...ed(`${at}.text`, "text", "توضیح")}>{x.text}</p>
                </Opt>
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}

/* ───────────── All products / a category ───────────── */

function Listing(view: BView & { categoryId?: string }) {
  const { shop, link, categoryId } = view;
  const products = visible(shop);
  const cats = (shop.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
  const cat = cats.find((c) => c.id === categoryId);
  const list = cat ? products.filter((p) => p.categoryId === cat.id) : products;
  const title = cat?.name ?? "فروشگاه";
  return (
    <>
      <Banner view={view} title={title} trail={cat ? [{ label: "فروشگاه", to: "/shop" }, { label: cat.name }] : undefined} />
      <section className="bq-wrap bq-sec">
        <nav className="bq-chips">
          <PageLink to="/shop" link={link} current={!cat}>
            همه
          </PageLink>
          {cats.map((c) => (
            <PageLink key={c.id} to={`/category/${c.id}`} link={link} current={cat?.id === c.id}>
              {c.name}
            </PageLink>
          ))}
        </nav>
        {list.length ? (
          <div className="bq-grid">
            {list.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        ) : (
          <p className="bq-notice">هنوز محصولی اضافه نشده است.</p>
        )}
      </section>
    </>
  );
}

/* ───────────── Product ───────────── */

function ProductPage(view: BView & { id: string }) {
  const { shop, link, visitor, editing } = view;
  const p = visible(shop).find((x) => x.id === view.id)!;
  const cat = shop.categories.find((c) => c.id === p.categoryId);
  const related = visible(shop)
    .filter((x) => x.id !== p.id && (!cat || x.categoryId === cat.id))
    .slice(0, 4);
  const soldOut = p.stock === 0;
  const wished = visitor.wishlist.includes(p.id);
  const imgs = p.images.map((u) => safeUrl(u)).filter((u): u is string => Boolean(u));
  return (
    <>
      <section className="bq-wrap bq-product">
        <div className="bq-gallery">
          {(imgs.length ? imgs : [undefined]).map((src, k) =>
            src ? (
              <ZoomOpen key={k} id={`${p.id}-${k}`} className={`bq-gal${k === 0 ? " first" : ""}`}>
                <span {...ed(`${P(p.id)}.images.${k}`, "image", "عکس محصول")}>
                  <img src={src} alt={p.name} />
                </span>
              </ZoomOpen>
            ) : (
              <span key={k} className="bq-gal first" {...ed(`${P(p.id)}.images.0`, "image", "عکس محصول")} />
            ),
          )}
        </div>
        <div className="bq-info-col">
          <nav className="bq-trail dark">
            <PageLink to="/" link={link}>
              خانه
            </PageLink>
            <i>/</i>
            <PageLink to={cat ? `/category/${cat.id}` : "/shop"} link={link}>
              {cat?.name ?? "فروشگاه"}
            </PageLink>
          </nav>
          <h1 {...ed(`${P(p.id)}.name`, "text", "نام محصول")}>{p.name}</h1>
          <Price view={view} p={p} />
          <Opt value={p.description} editing={editing} edit={ed(`${P(p.id)}.description`, "multiline", "توضیح محصول")}>
            <p className="bq-desc" {...ed(`${P(p.id)}.description`, "multiline", "توضیح محصول")}>
              {p.description}
            </p>
          </Opt>
          {soldOut ? (
            <p className="bq-notice">این محصول فعلاً ناموجود است.</p>
          ) : (
            <form method="post" action={link("/_cart")} className="bq-buy">
              <input type="hidden" name="op" value="add" />
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="back" value="/cart" />
              {p.sizes?.length ? (
                <fieldset className="bq-sizes">
                  <legend>سایز</legend>
                  {p.sizes.map((s, k) => (
                    <label key={s}>
                      <input type="radio" name="size" value={s} defaultChecked={k === 0} />
                      <span>{s}</span>
                    </label>
                  ))}
                </fieldset>
              ) : null}
              <div className="bq-buy-row">
                <label className="bq-qty">
                  <span className="sr-only">تعداد</span>
                  <input type="number" name="qty" min={1} max={p.stock ?? 20} defaultValue={1} />
                </label>
                <button type="submit" className="bq-btn">
                  افزودن به سبد خرید
                </button>
              </div>
            </form>
          )}
          <Act view={view} op="wish" id={p.id} className="bq-under" label="علاقه‌مندی">
            <Svg name="heart" /> {wished ? "در فهرست علاقه‌مندی‌های شماست" : "افزودن به علاقه‌مندی‌ها"}
          </Act>
          <ul className="bq-assure">
            <li>
              <Svg name="truck" /> ارسال به سراسر کشور
            </li>
            <li>
              <Svg name="shield" /> ضمانت اصل بودن کالا
            </li>
          </ul>
        </div>
      </section>
      {related.length > 0 && (
        <section className="bq-wrap bq-sec">
          <Title title="محصولات مشابه" />
          <div className="bq-grid">
            {related.map((x, k) => (
              <ProductCard key={x.id} view={view} p={x} i={k} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── Cart, wishlist, search ───────────── */

function Cart(view: BView) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart);
  return (
    <>
      <Banner view={view} title="سبد خرید" />
      {cart.lines.length === 0 ? (
        <Empty view={view} text="سبد خرید شما خالی است." />
      ) : (
        <section className="bq-wrap bq-cart">
          <div className="bq-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="bq-line">
                <PageLink to={productPath(l.product)} link={link} className="bq-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div className="bq-line-info">
                  <PageLink to={productPath(l.product)} link={link}>
                    <b>{l.product.name}</b>
                  </PageLink>
                  {l.size && <small>سایز: {l.size}</small>}
                  <small>{money(view, l.unit)}</small>
                </div>
                <div className="bq-stepper">
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                    −
                  </Act>
                  <span>{new Intl.NumberFormat("fa-IR").format(l.qty)}</span>
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                    +
                  </Act>
                </div>
                <b className="bq-line-total">{money(view, l.total)}</b>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="bq-remove" label="حذف از سبد">
                  <Svg name="trash" />
                </Act>
              </div>
            ))}
          </div>
          <aside className="bq-sum">
            <h2>جمع سبد خرید</h2>
            <dl>
              <dt>جمع کالاها</dt>
              <dd>{money(view, cart.subtotal)}</dd>
              <dt>هزینه‌ی ارسال</dt>
              <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
              <dt className="total">مبلغ قابل پرداخت</dt>
              <dd className="total">{money(view, cart.total)}</dd>
            </dl>
            {shop.freeShippingFrom && cart.shipping > 0 ? (
              <small>برای خریدهای بالای {money(view, shop.freeShippingFrom)} ارسال رایگان است.</small>
            ) : null}
            <PageLink to="/checkout" link={link} className="bq-btn wide">
              ادامه و ثبت سفارش
            </PageLink>
          </aside>
        </section>
      )}
    </>
  );
}

function Wishlist(view: BView) {
  const items = visible(view.shop).filter((p) => view.visitor.wishlist.includes(p.id));
  return (
    <>
      <Banner view={view} title="علاقه‌مندی‌ها" />
      {items.length === 0 ? (
        <>
          <h2 className="bq-wrap bq-big">فهرست علاقه‌مندی‌ها</h2>
          <Empty view={view} text="فهرست علاقه‌مندی‌های شما خالی است." />
        </>
      ) : (
        <section className="bq-wrap bq-sec">
          <h2 className="bq-big">فهرست علاقه‌مندی‌ها</h2>
          <div className="bq-grid">
            {items.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Search(view: BView) {
  const q = (view.visitor.query.q ?? "").trim();
  const words = q.split(/\s+/).filter(Boolean);
  const found = words.length ? visible(view.shop).filter((p) => words.every((w) => `${p.name} ${p.description ?? ""}`.includes(w))) : [];
  return (
    <section className="bq-wrap bq-search">
      <form method="get" action={view.link("/search")} className="bq-search-box">
        <input name="q" defaultValue={q} placeholder="چه چیزی می‌خواهید؟" aria-label="جست‌وجو" />
        <button type="submit" aria-label="جست‌وجو">
          <Svg name="search" />
        </button>
      </form>
      {words.length > 0 &&
        (found.length ? (
          <div className="bq-grid">
            {found.map((p, k) => (
              <ProductCard key={p.id} view={view} p={p} i={k} />
            ))}
          </div>
        ) : (
          <p className="bq-notice">محصولی با «{q}» پیدا نشد.</p>
        ))}
    </section>
  );
}

/* ───────────── Checkout and confirmation ───────────── */

function Checkout(view: BView) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart);
  const error = visitor.query.error;
  if (cart.lines.length === 0)
    return (
      <>
        <Banner view={view} title="ثبت سفارش" />
        <Empty view={view} text="سبد خرید شما خالی است؛ اول چند محصول اضافه کنید." />
      </>
    );
  return (
    <>
      <Banner view={view} title="ثبت سفارش" trail={[{ label: "سبد خرید", to: "/cart" }, { label: "ثبت سفارش" }]} />
      <section className="bq-wrap bq-cart">
        <form method="post" action={link("/_order")} className="bq-checkout">
          <h2>اطلاعات ارسال</h2>
          {error && <p className="bq-error">{error}</p>}
          <label>
            نام و نام خانوادگی *
            <input name="name" required maxLength={80} autoComplete="name" />
          </label>
          <label>
            شماره‌ی موبایل *
            <input name="phone" required inputMode="tel" dir="ltr" maxLength={14} autoComplete="tel" placeholder="09xx xxx xxxx" />
          </label>
          <label>
            شهر
            <input name="city" maxLength={60} autoComplete="address-level2" />
          </label>
          <label>
            کد پستی
            <input name="postalCode" maxLength={20} inputMode="numeric" dir="ltr" autoComplete="postal-code" />
          </label>
          <label className="full">
            نشانی کامل *
            <textarea name="address" required maxLength={400} rows={3} autoComplete="street-address" />
          </label>
          <label className="full">
            توضیحات سفارش
            <textarea name="note" maxLength={400} rows={2} />
          </label>
          {/* Left empty by people; filled only by spam robots. */}
          <input name="website" tabIndex={-1} autoComplete="off" className="bq-trap" aria-hidden="true" />
          <button type="submit" className="bq-btn full">
            ثبت سفارش
          </button>
        </form>
        <aside className="bq-sum">
          <h2>سفارش شما</h2>
          <ul className="bq-sum-lines">
            {cart.lines.map((l) => (
              <li key={l.id + (l.size ?? "")}>
                <span>
                  {l.product.name}
                  {l.size && ` (${l.size})`} × {new Intl.NumberFormat("fa-IR").format(l.qty)}
                </span>
                <b>{money(view, l.total)}</b>
              </li>
            ))}
          </ul>
          <dl>
            <dt>هزینه‌ی ارسال</dt>
            <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
            <dt className="total">مبلغ قابل پرداخت</dt>
            <dd className="total">{money(view, cart.total)}</dd>
          </dl>
          {shop.paymentNote && <p className="bq-pay" {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>{shop.paymentNote}</p>}
        </aside>
      </section>
    </>
  );
}

function Thanks(view: BView) {
  const code = view.visitor.query.code;
  const shop = view.shop;
  return (
    <>
      <Banner view={view} title="سفارش ثبت شد" />
      <section className="bq-wrap bq-thanks">
        <span className="bq-check" aria-hidden="true">
          ✓
        </span>
        <h2>ممنون از خرید شما!</h2>
        {code && (
          <p>
            کد پیگیری سفارش: <b dir="ltr">{code}</b>
          </p>
        )}
        {shop.orderNote && <p {...ed("site.shop.orderNote", "multiline", "پیام بعد از ثبت سفارش")}>{shop.orderNote}</p>}
        {shop.paymentNote && <p className="bq-pay">{shop.paymentNote}</p>}
        <PageLink to="/shop" link={view.link} className="bq-btn">
          بازگشت به فروشگاه
        </PageLink>
      </section>
    </>
  );
}

/* ───────────── Example content ───────────── */

export function boutiqueSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`shop-${n}`);
  const cats = [
    { id: "c1", name: "کت و کاپشن" },
    { id: "c2", name: "تاپ و بلوز" },
    { id: "c3", name: "دامن و شلوار" },
    { id: "c4", name: "لباس مجلسی" },
    { id: "c5", name: "کیف و کفش" },
  ];
  const d = "پارچه‌ی باکیفیت، دوخت تمیز و قالب استاندارد. برای انتخاب سایز، جدول سایز را در توضیحات ببینید یا از ما بپرسید.";
  const products: Product[] = [
    { id: "s1", name: "کت جلیقه‌ای کمربنددار", categoryId: "c1", price: 2450000, salePrice: 1890000, badge: "حراج", sizes: ["S", "M", "L"], images: [img("p1")], description: d },
    { id: "s2", name: "پیراهن کوتاه سرمه‌ای", categoryId: "c4", price: 1980000, salePrice: 1490000, badge: "حراج", sizes: ["S", "M", "L"], images: [img("p2")], description: d },
    { id: "s3", name: "سرهمی براق مهمانی", categoryId: "c4", price: 2650000, sizes: ["S", "M"], images: [img("p3")], description: d },
    { id: "s4", name: "تاپ مشکی و ژاکت", categoryId: "c2", price: 1350000, images: [img("p4")], description: d },
    { id: "s5", name: "پالتو خزدار کرم", categoryId: "c1", price: 4200000, badge: "جدید", sizes: ["M", "L", "XL"], images: [img("p5")], description: d },
    { id: "s6", name: "تاپ کبریتی کرم", categoryId: "c2", price: 690000, images: [img("p6")], description: d },
    { id: "s7", name: "کت تک بژ", categoryId: "c1", price: 3100000, sizes: ["S", "M", "L"], images: [img("p7")], description: d },
    { id: "s8", name: "دامن جین کلوش", categoryId: "c3", price: 980000, featured: true, images: [img("p8")], description: d },
    { id: "s9", name: "بوت چرم قهوه‌ای", categoryId: "c5", price: 2900000, featured: true, sizes: ["37", "38", "39", "40"], images: [img("p9")], description: d },
    { id: "s10", name: "کت جین کلاسیک", categoryId: "c1", price: 1750000, featured: true, images: [img("p10")], description: d },
  ];
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "کوشا",
      jobTitle: "فروشگاه لباس زنانه",
      email: "info@example.com",
      phone: "021 1234 5678",
      location: "تهران، خیابان ولیعصر، پلاک ۵۸",
      summary: "لباس‌های روزمره و مجلسی زنانه با دوخت خوب و قیمت منصفانه؛ ارسال سریع به سراسر کشور.",
      links: [{ id: "bl1", type: "instagram", url: "https://instagram.com/example" }],
    },
    site: {
      ...base.site,
      gallery: [],
      tagline: "استایل‌های ضروری با قیمت‌های استثنایی",
      aboutImage: img("tall"),
      accentImage: img("trend"),
      address: "تهران، خیابان ولیعصر، پلاک ۵۸",
      testimonials: [
        { id: "bt1", name: "لیلا، شیراز", role: "خوش‌دوخت و زیبا", text: "جنس پارچه دقیقاً همان بود که در عکس دیدم و سایزش هم کاملاً اندازه شد. بسته‌بندی هم خیلی مرتب بود." },
        { id: "bt2", name: "سارا، تبریز", role: "حتماً پیشنهادش می‌کنم", text: "دو روزه به دستم رسید و وقتی سؤالی داشتم خیلی زود جواب دادند. باز هم از همین فروشگاه خرید می‌کنم." },
      ],
      shop: {
        categories: cats.map((c) => ({ ...c, image: c.id === "c5" ? img("bag") : "" })),
        products,
        announcements: ["تا ۴۰٪ تخفیف تابستانه", "ارسال رایگان خریدهای بالای ۲ میلیون تومان", "حراج ویژه‌ی ۲۴ ساعته"],
        heroTitle: "استایل‌های امروزی برای خانم‌های خوش‌پوش",
        heroText: "مجموعه‌ی تازه‌ی فصل با رنگ‌های ملایم و طراحی ساده؛ برای کار، دورهمی و هر روز.",
        heroImage: img("hero"),
        promoTitle: "۱۵٪ تخفیف ویژه‌ی تعطیلات",
        promoText: "فقط برای خریدهای این هفته",
        lookTitle: "کمد لباست را تازه کن",
        lookImage: img("hero"),
        trendImage: img("p5"),
        bandItems: ["استایل برای هر سفر", "خوش‌پوش، بدون زحمت", "استایل مناسب خودت را پیدا کن"],
        perks: [
          { id: "k1", title: "تحویل حضوری", text: "سفارش را از فروشگاه تحویل بگیرید." },
          { id: "k2", title: "قیمت منصفانه", text: "کیفیت خوب با قیمتی که ارزشش را دارد." },
          { id: "k3", title: "پشتیبانی همه‌روزه", text: "هر روز هفته پاسخگوی سؤال‌های شما هستیم." },
          { id: "k4", title: "خرید مطمئن", text: "تا ۷ روز امکان تعویض کالا." },
        ],
        shippingFee: 80000,
        freeShippingFrom: 2000000,
        paymentNote: "پرداخت فعلاً کارت‌به‌کارت است: پس از ثبت سفارش، با شما تماس می‌گیریم و شماره‌ی کارت را اعلام می‌کنیم.",
        orderNote: "سفارش شما ثبت شد و به‌زودی برای هماهنگی ارسال با شما تماس می‌گیریم.",
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.bq { --bq-ink: var(--color-text); --bq-line: var(--color-line); --bq-dark: #0B0B0C; --bq-red: var(--color-primary); --bq-wrap: min(1480px, 100% - 2 * clamp(14px, 3cqi, 44px));
  background: var(--color-bg); color: var(--color-text); min-height: 100%; }
.bq a { color: inherit; }
.bq button { font: inherit; color: inherit; }
.bq .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.bq-wrap { width: var(--bq-wrap); margin-inline: auto; }
.bq-ico { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.bq-act { display: contents; }
.bq-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 30px; border: none; border-radius: 999px; background: var(--bq-dark); color: #fff !important; font-weight: 700; font-size: .92em; cursor: pointer; transition: transform .2s, background .2s; }
.bq-btn:hover { background: var(--bq-red); transform: translateY(-2px); }
.bq-btn.wide, .bq-btn.full { width: 100%; }
.bq-under { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: none; background: none; text-decoration: underline; text-underline-offset: 5px; font-size: .86em; cursor: pointer; }
.bq-notice { padding: 22px 30px; border-top: 3px solid var(--bq-red); background: var(--color-soft); }
.bq-error { padding: 12px 16px; border-radius: 10px; background: color-mix(in srgb, #E5484D 12%, var(--color-bg)); color: #C62A2F; }
.bq-sec { padding-block: clamp(40px, 6cqi, 80px); }
.bq-title { display: grid; justify-items: center; gap: 10px; margin-bottom: clamp(24px, 4cqi, 44px); text-align: center; }
.bq-title h2 { font-size: clamp(1.7em, 3.6cqi, 2.5em); font-weight: 600; }
.bq-title p { max-width: 34em; color: var(--color-muted); line-height: 1.9; }

/* Top strip, info line and header */
.bq-ann { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px 26px; padding: 11px 16px; background: var(--bq-dark); color: #E7E7E7; font-size: .84em; }
.bq-ann span { display: inline-flex; align-items: center; gap: 8px; }
.bq-ann i { width: 50px; height: 1px; margin-inline-end: 18px; background: #555; }
.bq-ann a { color: #fff; font-weight: 700; text-decoration: underline; }
.bq-info { display: flex; align-items: center; justify-content: center; gap: 10px 14px; flex-wrap: wrap; padding: 12px 0; border-bottom: 1px solid var(--bq-line); color: var(--color-muted); font-size: .9em; }
.bq-strong { color: var(--bq-ink); font-weight: 600; }
.bq-info-end { margin-inline-start: auto; display: flex; gap: 20px; color: var(--bq-ink); }
.bq-head { display: flex; align-items: center; gap: 24px; padding: 20px 0; }
.bq-logo { font-size: 2.3em; font-weight: 800; letter-spacing: -.02em; line-height: 1; }
.bq-logo i { font-style: normal; color: var(--bq-red); }
.bq-nav { display: flex; gap: clamp(14px, 2.4cqi, 30px); margin-inline: auto; font-weight: 500; }
.bq-nav a { position: relative; padding: 6px 0; }
.bq-nav a::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 2px; background: var(--bq-red); transform: scaleX(0); transition: transform .25s; }
.bq-nav a:hover::after, .bq-nav a[aria-current="page"]::after { transform: none; }
.bq-icons { display: flex; gap: 18px; }
.bq-icon { position: relative; display: grid; place-items: center; width: 34px; height: 34px; }
.bq-icon .bq-ico { width: 25px; height: 25px; }
.bq-icon b { position: absolute; top: -4px; inset-inline-end: -6px; min-width: 18px; height: 18px; padding: 0 4px; display: grid; place-items: center; border-radius: 999px; background: var(--bq-red); color: #fff; font-size: 10px; }

/* Hero */
.bq-hero { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; min-height: clamp(420px, 44cqi, 640px); background: var(--color-soft); overflow: hidden; }
.bq-hero-pic { position: relative; align-self: stretch; }
.bq-hero-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: bq-zoom 1.6s cubic-bezier(.2, 1, .3, 1) backwards; }
@keyframes bq-zoom { from { transform: scale(1.1); opacity: 0; } }
.bq-hero-text { display: grid; gap: 18px; justify-items: start; padding: 40px clamp(20px, 6cqi, 90px); animation: bq-up .9s .2s cubic-bezier(.2, 1, .3, 1) backwards; }
@keyframes bq-up { from { opacity: 0; transform: translateY(30px); } }
.bq-hero-text h1 { font-size: clamp(2em, 4.4cqi, 3.4em); font-weight: 600; line-height: 1.35; }
.bq-hero-text p { max-width: 30em; color: var(--color-muted); line-height: 1.9; }

/* Categories block */
.bq-cats { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 22px; padding-block: clamp(40px, 6cqi, 80px) 0; }
.bq-cats-main { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); background: var(--color-soft); min-height: 540px; }
.bq-cats-main > div { display: grid; align-content: center; gap: 16px; padding: 34px; }
.bq-cats-main h2 { font-size: 1.8em; font-weight: 600; }
.bq-cats-main p { color: var(--color-muted); font-size: .9em; line-height: 1.9; }
.bq-cats-main ul { list-style: none; margin: 4px 0 10px; padding: 0; display: grid; gap: 12px; }
.bq-cats-main li a { display: inline-flex; align-items: flex-start; gap: 4px; }
.bq-cats-main li a::before { content: "•"; margin-inline-end: 10px; color: var(--bq-red); }
.bq-cats-main li a:hover { color: var(--bq-red); }
.bq-cats-main sup { font-size: .7em; color: var(--color-muted); }
.bq-cats-main .bq-btn { justify-self: start; }
.bq-cats-pic { position: relative; overflow: hidden; }
.bq-cats-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bq-cats-side { display: grid; gap: 22px; grid-template-rows: auto 1fr 1fr; }
.bq-promo { position: relative; display: grid; gap: 10px; padding: 28px 30px; background: var(--bq-dark); color: #fff; overflow: hidden; }
.bq-promo small { justify-self: start; padding: 5px 14px; border: 1px solid #444; border-radius: 999px; font-size: .78em; }
.bq-promo h3 { font-size: 1.6em; font-weight: 500; line-height: 1.5; }
.bq-promo p { color: #B9B9B9; font-size: .9em; }
.bq-promo-logo { font-size: 1.4em; letter-spacing: .1em; }
.bq-promo-logo i { font-style: normal; color: var(--bq-red); }
.bq-catcard { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 10px; min-height: 180px; padding-inline-start: 30px; background: var(--color-soft); overflow: hidden; transition: background .3s; }
.bq-catcard.alt { background: color-mix(in srgb, var(--color-text) 6%, var(--color-bg)); }
.bq-catcard h3 { font-size: 1.5em; font-weight: 500; }
.bq-catcard small { color: var(--color-muted); }
.bq-catcard-pic { position: relative; align-self: stretch; min-height: 180px; overflow: hidden; }
.bq-catcard-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .6s; }
.bq-catcard:hover .bq-catcard-pic img { transform: scale(1.06); }

/* Product cards */
.bq-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 30px 22px; }
.bq-card { display: grid; gap: 8px; align-content: start; animation: bq-up .7s calc(var(--i) * 60ms) cubic-bezier(.2, 1, .3, 1) backwards; }
.bq-card-pic { position: relative; aspect-ratio: 3 / 4; overflow: hidden; background: var(--color-soft); }
.bq-img, .bq-img img { position: absolute; inset: 0; width: 100%; height: 100%; }
.bq-img img { object-fit: cover; transition: transform .7s cubic-bezier(.2, 1, .3, 1); }
.bq-img b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 3em; color: var(--color-muted); }
.bq-card:hover .bq-img img { transform: scale(1.06); }
.bq-badge { position: absolute; top: 12px; inset-inline-start: 12px; padding: 3px 12px; border-radius: 999px; background: #fff; color: #111; font-size: .78em; }
.bq-card-acts { position: absolute; top: 12px; inset-inline-end: 12px; display: grid; gap: 8px; opacity: 0; transform: translateX(10px); transition: opacity .3s, transform .3s; }
.bq-card:hover .bq-card-acts, .bq-card-acts:focus-within { opacity: 1; transform: none; }
.bq-round { width: 40px; height: 40px; display: grid; place-items: center; border: none; border-radius: 50%; background: #fff; color: #111 !important; box-shadow: 0 6px 16px -8px rgb(0 0 0 / .4); cursor: pointer; transition: background .2s, color .2s; }
.bq-round:hover, .bq-round.on { background: var(--bq-red); color: #fff !important; }
.bq-round .bq-ico { width: 19px; height: 19px; }
.bq-card-name { margin-top: 6px; font-weight: 500; }
.bq-card-name:hover { color: var(--bq-red); }
.bq-price { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; font-size: .92em; }
.bq-price b { font-weight: 700; }
.bq-price s { color: var(--color-muted); font-size: .9em; }

/* Moving band */
.bq-band { overflow: hidden; padding: 16px 0; background: var(--bq-dark); color: #fff; }
.bq-band-track { display: flex; width: max-content; gap: 40px; font-size: clamp(1.1em, 2.2cqi, 1.6em); white-space: nowrap; animation: bq-slide 40s linear infinite; }
.bq-band-track i { font-style: normal; margin-inline-start: 34px; opacity: .8; }
.bq[dir="rtl"] .bq-band-track { animation-name: bq-slide-rtl; }
@keyframes bq-slide { to { transform: translateX(-50%); } }
@keyframes bq-slide-rtl { to { transform: translateX(50%); } }

/* Look book */
.bq-look { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: stretch; background: var(--color-soft); }
.bq-look-text { display: grid; align-content: center; justify-items: center; gap: 12px; padding: clamp(30px, 6cqi, 70px); text-align: center; }
.bq-look-text h2 { font-size: clamp(1.7em, 3.6cqi, 2.6em); font-weight: 600; }
.bq-look-text > p { color: var(--color-muted); }
.bq-look-card { width: min(240px, 100%); margin-top: 16px; text-align: start; }
.bq-look-pic { position: relative; min-height: clamp(420px, 44cqi, 640px); overflow: hidden; }
.bq-look-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* Category boxes */
.bq-brands { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; padding-block: clamp(40px, 6cqi, 70px) 0; }
.bq-brands a { display: grid; justify-items: center; gap: 6px; padding: 30px 14px; border: 1px solid var(--bq-line); transition: border-color .3s, transform .3s; }
.bq-brands a:hover { border-color: var(--bq-ink); transform: translateY(-3px); }
.bq-brands b { font-size: 1.5em; font-weight: 800; letter-spacing: .06em; }
.bq-brands small { color: var(--color-muted); }

/* Newest trends */
.bq-trends { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 26px; }
.bq-trends-pic { position: relative; min-height: 520px; overflow: hidden; background: var(--color-soft); }
.bq-trends-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bq-trends-list { display: grid; gap: 18px; align-content: start; }
.bq-row { display: grid; grid-template-columns: 140px 1fr auto; align-items: center; gap: 22px; }
.bq-row-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; background: var(--color-soft); }
.bq-row-pic span, .bq-row-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.bq-row-pic img { object-fit: cover; transition: transform .5s; }
.bq-row:hover .bq-row-pic img { transform: scale(1.06); }
.bq-row-name { display: block; margin-bottom: 6px; font-weight: 500; }
.bq-bar { display: block; padding: 15px; border-radius: 999px; background: var(--bq-dark); color: #fff !important; text-align: center; font-weight: 700; }

/* Testimonials */
.bq-quotes { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; }
.bq-quote { display: grid; gap: 0; border: 1px solid var(--bq-line); }
.bq-quote-box { display: grid; justify-items: center; gap: 12px; padding: 34px 30px; text-align: center; }
.bq-stars { display: flex; gap: 4px; color: #F5A524; }
.bq-star { width: 16px; height: 16px; fill: currentColor; stroke: none; }
.bq-quote h3 { font-size: 1.3em; font-weight: 500; }
.bq-quote p { color: var(--color-muted); line-height: 1.95; }
.bq-mini { display: flex; align-items: center; gap: 18px; padding: 18px 30px; border-top: 1px solid var(--bq-line); }
.bq-mini > span:first-child { position: relative; width: 90px; height: 90px; flex: none; overflow: hidden; background: var(--color-soft); }
.bq-mini img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bq-mini > span:last-child { display: grid; gap: 6px; }

/* Perks */
.bq-perks { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 26px; padding-block: clamp(40px, 6cqi, 80px); text-align: center; }
.bq-perks > div { display: grid; justify-items: center; gap: 10px; }
.bq-perk-ico { width: 74px; height: 74px; display: grid; place-items: center; border-radius: 50%; background: var(--color-soft); transition: background .3s, color .3s; }
.bq-perk-ico .bq-ico { width: 32px; height: 32px; stroke-width: 1.4; }
.bq-perks > div:hover .bq-perk-ico { background: var(--bq-red); color: #fff; }
.bq-perks h3 { font-size: 1.1em; font-weight: 600; }
.bq-perks p { max-width: 16em; color: var(--color-muted); font-size: .88em; line-height: 1.8; }

/* Footer and floating buttons */
.bq-foot { margin-top: clamp(40px, 6cqi, 80px); padding: clamp(46px, 6cqi, 80px) 0 26px; background: var(--bq-dark); color: #fff; text-align: center; }
.bq-foot .bq-wrap { display: grid; justify-items: center; gap: 26px; }
.bq-foot-text { max-width: 36em; color: #CFCFCF; line-height: 2; }
.bq-foot-rows { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; width: 100%; padding-block: 26px; border-block: 1px solid #262626; text-align: start; }
.bq-foot-rows > div { display: flex; align-items: center; justify-content: center; gap: 16px; }
.bq-foot-rows small { display: block; margin-bottom: 4px; color: #BDBDBD; }
.bq-circle { width: 70px; height: 70px; flex: none; display: grid; place-items: center; border: 1px solid #4A4A4A; border-radius: 50%; }
.bq-circle .p-ico { width: 28px; height: 28px; }
.bq-foot-nav { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px 40px; font-weight: 600; }
.bq-foot-nav a:hover { color: var(--bq-red); }
.bq-foot-socials a { border: 1px solid #4A4A4A; color: #fff; }
.bq-foot-socials a:hover { background: #fff; color: #111; }
.bq-copy { justify-self: stretch; text-align: start; color: #BDBDBD; }
.bq-float { position: sticky; bottom: 18px; z-index: 20; display: flex; justify-content: flex-end; align-items: center; gap: 12px; width: var(--bq-wrap); margin: -76px auto 18px; pointer-events: none; }
.bq-float > * { pointer-events: auto; }
.bq-chat { display: flex; align-items: center; gap: 12px; }
.bq-chat span { padding: 10px 18px; border-radius: 12px; background: #fff; color: #111; box-shadow: 0 10px 24px -12px rgb(0 0 0 / .35); }
.bq-chat i { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 50%; background: var(--bq-red); color: #fff; animation: bq-pulse 2.4s ease-in-out infinite; }
@keyframes bq-pulse { 50% { box-shadow: 0 0 0 10px color-mix(in srgb, var(--bq-red) 20%, transparent); } }
.bq-chat .bq-ico { fill: currentColor; stroke: none; }
.bq-top { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 50%; background: #fff; color: #111; box-shadow: 0 8px 20px -10px rgb(0 0 0 / .4); }
.bq-top .bq-ico { transform: rotate(90deg); }

/* Inner pages */
.bq-banner { position: relative; display: grid; place-items: center; min-height: clamp(200px, 22cqi, 310px); overflow: hidden; color: #fff; text-align: center; }
.bq-banner-pic, .bq-banner-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.bq-banner-pic img { object-fit: cover; object-position: center 30%; filter: brightness(.6); }
.bq-banner > div { position: relative; display: grid; gap: 12px; }
.bq-banner h1 { font-size: clamp(2em, 5cqi, 3.4em); font-weight: 600; }
.bq-trail { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; font-weight: 600; }
.bq-trail i { font-style: normal; margin-inline: 8px; opacity: .6; }
.bq-trail.dark { justify-content: flex-start; color: var(--color-muted); font-weight: 400; font-size: .9em; }
.bq-empty { display: grid; justify-items: start; gap: 30px; padding-block: clamp(40px, 6cqi, 80px); }
.bq-empty .bq-notice { justify-self: stretch; }
.bq-big { padding-top: clamp(30px, 5cqi, 60px); font-size: clamp(1.8em, 4cqi, 2.8em); font-weight: 500; }
.bq-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 34px; }
.bq-chips a { padding: 9px 20px; border: 1px solid var(--bq-line); border-radius: 999px; transition: background .2s, color .2s, border-color .2s; }
.bq-chips a:hover { border-color: var(--bq-ink); }
.bq-chips a[aria-current="page"] { background: var(--bq-dark); border-color: var(--bq-dark); color: #fff; }

.bq-product { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: clamp(24px, 5cqi, 70px); padding-block: clamp(30px, 5cqi, 60px); }
.bq-gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-content: start; }
.bq-gal { position: relative; aspect-ratio: 3 / 4; overflow: hidden; background: var(--color-soft); cursor: zoom-in; }
.bq-gal.first { grid-column: 1 / -1; }
.bq-gal span, .bq-gal img { position: absolute; inset: 0; width: 100%; height: 100%; }
.bq-gal img { object-fit: cover; }
.bq-info-col { display: grid; align-content: start; gap: 18px; position: sticky; top: 20px; align-self: start; }
.bq-info-col h1 { font-size: clamp(1.6em, 3.4cqi, 2.4em); font-weight: 600; }
.bq-info-col > .bq-price { font-size: 1.25em; }
.bq-desc { color: var(--color-muted); line-height: 2; }
.bq-buy { display: grid; gap: 18px; padding-block: 18px; border-block: 1px solid var(--bq-line); }
.bq-sizes { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; border: none; }
.bq-sizes legend { margin-bottom: 10px; font-weight: 600; }
.bq-sizes label { cursor: pointer; }
.bq-sizes input { position: absolute; opacity: 0; }
.bq-sizes span { display: grid; place-items: center; min-width: 48px; height: 44px; padding: 0 10px; border: 1px solid var(--bq-line); border-radius: 10px; transition: background .2s, color .2s, border-color .2s; }
.bq-sizes input:checked + span { background: var(--bq-dark); border-color: var(--bq-dark); color: #fff; }
.bq-sizes input:focus-visible + span { outline: 2px solid var(--bq-red); }
.bq-buy-row { display: flex; gap: 12px; }
.bq-qty input { width: 80px; height: 100%; padding: 0 12px; border: 1px solid var(--bq-line); border-radius: 999px; background: var(--color-bg); color: var(--bq-ink); font: inherit; text-align: center; }
.bq-buy-row .bq-btn { flex: 1; }
.bq-assure { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; color: var(--color-muted); font-size: .9em; }
.bq-assure li { display: flex; align-items: center; gap: 10px; }

.bq-cart { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); gap: clamp(20px, 4cqi, 50px); align-items: start; padding-block: clamp(30px, 5cqi, 60px); }
.bq-lines { display: grid; border-top: 1px solid var(--bq-line); }
.bq-line { display: grid; grid-template-columns: 90px minmax(0, 1fr) auto auto auto; align-items: center; gap: 18px; padding: 18px 0; border-bottom: 1px solid var(--bq-line); }
.bq-line-pic { position: relative; display: block; aspect-ratio: 3 / 4; overflow: hidden; background: var(--color-soft); }
.bq-line-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bq-line-info { display: grid; gap: 4px; }
.bq-line-info small { color: var(--color-muted); }
.bq-stepper { display: flex; align-items: center; border: 1px solid var(--bq-line); border-radius: 999px; }
.bq-stepper button { width: 36px; height: 36px; border: none; background: none; font-size: 1.2em; cursor: pointer; }
.bq-stepper span { min-width: 24px; text-align: center; }
.bq-line-total { min-width: 8em; text-align: end; }
.bq-remove { width: 36px; height: 36px; display: grid; place-items: center; border: none; border-radius: 50%; background: none; color: var(--color-muted) !important; cursor: pointer; }
.bq-remove:hover { background: var(--color-soft); color: #C62A2F !important; }
.bq-sum { display: grid; gap: 16px; padding: 26px; background: var(--color-soft); position: sticky; top: 20px; }
.bq-sum h2 { font-size: 1.3em; font-weight: 600; }
.bq-sum dl { display: grid; grid-template-columns: 1fr auto; gap: 12px; margin: 0; }
.bq-sum dd { margin: 0; text-align: end; }
.bq-sum .total { padding-top: 12px; border-top: 1px solid var(--bq-line); font-weight: 700; font-size: 1.05em; }
.bq-sum small { color: var(--color-muted); }
.bq-sum-lines { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; font-size: .9em; }
.bq-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.bq-pay { padding: 14px 16px; border-radius: 12px; background: var(--color-bg); border: 1px dashed var(--bq-line); font-size: .88em; line-height: 1.9; }
.bq-checkout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-content: start; }
.bq-checkout h2, .bq-checkout .full, .bq-checkout .bq-error { grid-column: 1 / -1; }
.bq-checkout h2 { font-size: 1.3em; font-weight: 600; }
.bq-checkout label { display: grid; gap: 8px; font-size: .9em; font-weight: 600; }
.bq-checkout input, .bq-checkout textarea { width: 100%; padding: 13px 16px; border: 1px solid var(--bq-line); border-radius: 12px; background: var(--color-bg); color: var(--bq-ink); font: inherit; font-weight: 400; transition: border-color .2s; }
.bq-checkout input:focus, .bq-checkout textarea:focus { outline: none; border-color: var(--bq-ink); }
.bq-trap { position: absolute; inset-inline-start: -9999px; width: 1px; height: 1px; }
.bq-thanks { display: grid; justify-items: center; gap: 16px; padding-block: clamp(40px, 6cqi, 80px); text-align: center; }
.bq-thanks p { max-width: 34em; line-height: 2; }
.bq-check { width: 76px; height: 76px; display: grid; place-items: center; border-radius: 50%; background: color-mix(in srgb, #16A34A 15%, var(--color-bg)); color: #16A34A; font-size: 2.2em; animation: bq-pop .7s cubic-bezier(.2, 1.5, .4, 1) backwards; }
@keyframes bq-pop { from { transform: scale(.3); opacity: 0; } }
.bq-search { display: grid; gap: 40px; padding-block: clamp(50px, 8cqi, 110px); }
.bq-search-box { display: flex; width: min(460px, 100%); margin-inline: auto; border: 1px solid var(--bq-line); }
.bq-search-box input { flex: 1; min-width: 0; padding: 20px 24px; border: none; background: var(--color-bg); color: var(--bq-ink); font: inherit; }
.bq-search-box input:focus { outline: none; }
.bq-search-box button { width: 64px; border: none; background: none; cursor: pointer; }

.bq-main > * { animation: bq-up .7s cubic-bezier(.2, 1, .3, 1) backwards; }

@container (max-width: 1100px) {
  .bq-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .bq-cats { grid-template-columns: 1fr; }
  .bq-nav { display: none; }
  .bq-icons { margin-inline-start: auto; }
}
@container (max-width: 820px) {
  .bq-hero, .bq-look, .bq-trends, .bq-product, .bq-cart, .bq-quotes { grid-template-columns: 1fr; }
  .bq-hero-pic { min-height: 380px; }
  .bq-look-pic { min-height: 380px; }
  .bq-trends-pic { min-height: 380px; }
  .bq-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 14px; }
  .bq-perks { grid-template-columns: 1fr 1fr; }
  .bq-foot-rows { grid-template-columns: 1fr; }
  .bq-foot-rows > div { justify-content: flex-start; }
  .bq-info { justify-content: space-between; }
  .bq-info-end { display: none; }
  .bq-info-col, .bq-sum { position: static; }
  .bq-card-acts { opacity: 1; transform: none; }
}
@container (max-width: 560px) {
  .bq-cats-main { grid-template-columns: 1fr; min-height: 0; }
  .bq-cats-pic { min-height: 320px; }
  .bq-brands { grid-template-columns: 1fr; }
  .bq-row { grid-template-columns: 90px 1fr; }
  .bq-row .bq-under { grid-column: 2; justify-self: start; }
  .bq-line { grid-template-columns: 72px minmax(0, 1fr) auto; }
  .bq-line .bq-stepper { grid-column: 2; }
  .bq-line-total { grid-column: 3; grid-row: 2; min-width: 0; }
  .bq-checkout { grid-template-columns: 1fr; }
  .bq-chat span { display: none; }
  .bq-ann i { display: none; }
  .bq-logo { font-size: 1.9em; }
}
@media (prefers-reduced-motion: reduce) {
  .bq-hero-pic img, .bq-hero-text, .bq-card, .bq-band-track, .bq-chat i, .bq-check, .bq-main > * { animation: none !important; }
}
`;
