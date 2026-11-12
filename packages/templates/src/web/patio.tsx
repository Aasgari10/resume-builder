/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Patio": a restaurant with online ordering, rebuilt from the PatioTime Bistro reference, in
// Persian. Black and warm orange, serif headings. Home: hero, the pizza menu (round pizzas that spin
// in and stop, a button per size), fresh pasta, the à la carte list, a photo row, about and a visit
// block; pages: menu, about us with the chefs, order online (shop), product, cart, checkout, contact.
// Published pages run without scripts: the mini cart opens on hover/focus, the phone menu is <details>.

import type { CSSProperties, ReactNode } from "react";
import { emptyVisitor, formatToman, priceCart, unitPrice, variantOf, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { ZoomOpen } from "./zoom";
import { AccountPage, CouponBox, hasChoices, InfoPage, infoPages, onSale, OptionPicker, percentOff, Reviews, SORTS, SpecsTable, Stars, filterProducts, shopkitCss } from "./shopkit";
import { mapEmbed } from "./golsara";

export const PATIO_BLOCKS = [
  { key: "pizza", label: "منوی پیتزا (پیتزاهای گرد)" },
  { key: "pasta", label: "پاستای تازه" },
  { key: "carte", label: "منوی آلاکارت" },
  { key: "about", label: "معرفی رستوران" },
  { key: "visit", label: "به رستوران ما سر بزنید" },
  { key: "newsletter", label: "خبرنامه‌ی پایین صفحه" },
] as const;

export const PATIO_OPTIONAL_PAGES = [{ path: "/about", label: "صفحه‌ی درباره‌ی ما" }] as const;

const visible = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);

export function patioPages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const products = visible(shop);
  const cats = (shop?.categories ?? []).filter((c) => products.some((p) => p.categoryId === c.id));
  const info = infoPages(shop).filter((p) => p !== "/contact");
  return ["/", "/menu", "/shop", ...(pageOn(data, "/about") ? ["/about"] : []), "/contact", ...cats.map((c) => `/category/${c.id}`), ...products.map((p) => `/product/${p.id}`), "/cart", "/wishlist", "/search", "/checkout", "/thanks", "/account", ...info];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; visitor: Visitor; page: string };

export function PatioShop(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = patioPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), visitor: props.visitor ?? emptyVisitor(), page };
  const [kind, id] = page.split("/").filter(Boolean);
  let body: ReactNode;
  if (page === "/") body = <Home {...view} />;
  else if (kind === "menu") body = <MenuPage {...view} />;
  else if (kind === "shop") body = <Listing {...view} />;
  else if (kind === "category") body = <Listing {...view} categoryId={id} />;
  else if (kind === "product") body = <ProductPage {...view} id={id!} />;
  else if (kind === "about") body = <About {...view} />;
  else if (kind === "contact") body = <Contact {...view} />;
  else if (kind === "cart") body = <Cart {...view} />;
  else if (kind === "wishlist") body = <Wishlist {...view} />;
  else if (kind === "search") body = <Search {...view} />;
  else if (kind === "checkout") body = <Checkout {...view} />;
  else if (kind === "account") body = <Account {...view} />;
  else if (kind === "thanks") body = <Thanks {...view} />;
  else
    body = (
      <div className="pt-wrap pt-inner">
        <InfoPage data={ctx.data} page={page} link={view.link} editing={view.editing} visitor={view.visitor} />
      </div>
    );
  return (
    <WebPage ctx={ctx} className={`pt${page === "/" ? " pt-home" : ""}`} css={partsCss + shopkitCss + css}>
      <Header {...view} />
      <main key={page}>{body}</main>
      <Footer {...view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const SVG: Record<string, string> = {
  bag: "M6 8.5h12l-.9 11.5H6.9z M9 8.5V7a3 3 0 0 1 6 0v1.5",
  cart: "M3 4.5h2.4l2.2 10h9.6l2-7.2H6.2 M9.4 19.3a1.1 1.1 0 1 0 0-.1 M16.8 19.3a1.1 1.1 0 1 0 0-.1",
  search: "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z M15.8 15.8 20 20",
  heart: "M12 19.5s-7.3-4.4-7.3-9.6A4 4 0 0 1 12 7.3a4 4 0 0 1 7.3 2.6c0 5.2-7.3 9.6-7.3 9.6z",
  heartBig: "M12 21s-9.5-5.8-9.5-12.6A5.3 5.3 0 0 1 12 5.2a5.3 5.3 0 0 1 9.5 3.2C21.5 15.2 12 21 12 21z",
  down: "M7 10l5 5 5-5",
  arrow: "M19 12H5 M10 7l-5 5 5 5",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  zoom: "M10.5 4.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M15 15l5 5",
  pin: "M12 21s-6.5-5.6-6.5-10.6a6.5 6.5 0 1 1 13 0C18.5 15.4 12 21 12 21z M12 7.8a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z",
  phone: "M6.5 3.5h3.2l1.6 4.2-2.2 1.5a10 10 0 0 0 5.7 5.7l1.5-2.2 4.2 1.6v3.2a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z",
  mail: "M3.5 6h17v12h-17z M3.5 7l8.5 6.2L20.5 7",
  check: "M5 12.5l4.5 4.5L19 7.5",
  trash: "M5 7h14 M10 7V5h4v2 M7 7l1 13h8l1-13",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z",
};

function Svg({ name, className = "pt-ico" }: { name: string; className?: string }) {
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

/** The orange kicker with a short line after it, then a serif heading. */
function Head({ view, kicker, title, titlePath, center }: { view: View; kicker?: string; title?: string; titlePath?: string; center?: boolean }) {
  return (
    <div className={`pt-head-block${center ? " pt-center" : ""} pt-rise`}>
      {kicker && <small className="pt-kicker">{kicker}</small>}
      <Opt value={title} editing={view.editing} edit={ed(titlePath ?? "", "text", "تیتر")}>
        <h2 {...(titlePath ? ed(titlePath, "text", "تیتر") : {})}>{title}</h2>
      </Opt>
    </div>
  );
}

function Price({ view, p }: { view: View; p: Product }) {
  return (
    <span className="pt-price">
      {onSale(p) && <s>{money(view, p.price)}</s>}
      <b>{money(view, unitPrice(p))}</b>
    </span>
  );
}

/** A picture the owner can change by clicking it in the editor. */
function Pic({ src, path, label, className }: { src?: string; path: string; label: string; className?: string }) {
  const url = safeUrl(src);
  return (
    <span className={`pt-pic ${className ?? ""}`} {...ed(path, "image", label)}>
      {url && <img src={url} alt="" loading="lazy" />}
    </span>
  );
}

const Para = ({ text }: { text?: string }) => (
  <>
    {(text ?? "")
      .split(/\n\s*\n|\n/)
      .filter((x) => x.trim())
      .map((x, k) => (
        <p key={k}>{x}</p>
      ))}
  </>
);

/** Opening hours from lines such as «شنبه تا چهارشنبه: ۹ تا ۲۳». */
function Hours({ text }: { text?: string }) {
  const rows = (text ?? "").split("\n").map((l) => l.split(/[:：|]/)).filter((x) => x[0]?.trim());
  return (
    <dl className="pt-hours">
      {rows.map((r, k) => (
        <div key={k}>
          <dt>{r[0]!.trim()}</dt>
          <dd>{r.slice(1).join(":").trim()}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ───────────── Header, mini cart, footer ───────────── */

function menuItems(view: View) {
  return [
    { to: "/", label: "خانه" },
    ...(pageOn(view.ctx.data, "/about") ? [{ to: "/about", label: "درباره‌ی ما" }] : []),
    { to: "/menu", label: "منو" },
    { to: "/contact", label: "تماس با ما" },
    { to: "/shop", label: "سفارش آنلاین" },
  ];
}

const isHere = (view: View, to: string) => (to === "/shop" ? view.page === "/shop" || view.page.startsWith("/category/") || view.page.startsWith("/product/") : view.page === to);

function Logo({ view }: { view: View }) {
  const b = view.ctx.data.basics;
  const logo = safeUrl(b.avatarUrl);
  return (
    <PageLink to="/" link={view.link} className="pt-logo">
      {logo ? <img src={logo} alt={b.fullName} {...ed("basics.avatarUrl", "image", "لوگو")} /> : <b {...ed("basics.fullName", "text", "نام رستوران")}>{b.fullName}</b>}
    </PageLink>
  );
}

/** The bag icon; hovering or focusing it opens the small cart of the reference. */
function MiniCart({ view }: { view: View }) {
  const cart = priceCart(view.shop, view.visitor.cart);
  return (
    <div className="pt-mini" tabIndex={-1}>
      <PageLink to="/cart" link={view.link} className="pt-bag">
        <Svg name="bag" />
        {cart.count > 0 && <i>{fa(cart.count)}</i>}
        <span className="sr-only">سبد خرید</span>
      </PageLink>
      <div className="pt-mini-panel">
        {cart.lines.length === 0 ? (
          <p className="pt-muted">سبد خرید شما خالی است.</p>
        ) : (
          <>
            {cart.lines.slice(0, 4).map((l) => (
              <div key={l.id + (l.size ?? "")} className="pt-mini-line">
                <span className="pt-mini-pic">{pic(l.product) && <img src={pic(l.product)} alt="" />}</span>
                <span>
                  <b>{l.product.name}</b>
                  <small>
                    {fa(l.qty)} × {money(view, l.unit)}
                  </small>
                </span>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="pt-mini-x" label="حذف">
                  <Svg name="close" />
                </Act>
              </div>
            ))}
            <p className="pt-mini-sum">
              <b>جمع:</b> {money(view, cart.subtotal)}
            </p>
            <div className="pt-mini-btns">
              <PageLink to="/cart" link={view.link} className="pt-btn light">
                مشاهده‌ی سبد
              </PageLink>
              <PageLink to="/checkout" link={view.link} className="pt-btn line">
                ثبت سفارش
              </PageLink>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Header(view: View) {
  const items = menuItems(view);
  const nav = items.map((m) => (
    <PageLink key={m.to} to={m.to} link={view.link} current={isHere(view, m.to)}>
      {m.label}
    </PageLink>
  ));
  return (
    <header className="pt-header">
      <div className="pt-wrap pt-header-in">
        <details className="pt-burger">
          <summary aria-label="منو">
            <span />
          </summary>
          <nav className="pt-drawer">{nav}</nav>
        </details>
        <nav className="pt-nav">{nav}</nav>
        <Logo view={view} />
        <div className="pt-tools">
          <Socials ctx={view.ctx} editing={view.editing} className="pt-head-socials" />
          <MiniCart view={view} />
          <PageLink to="/shop" link={view.link} className="pt-btn line pt-order">
            سفارش آنلاین
          </PageLink>
        </div>
      </div>
    </header>
  );
}

function Footer(view: View) {
  const { ctx, link, editing, shop } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const bg = safeUrl(shop.discoverImage);
  const brand = safeUrl(site?.signatureImage);
  const pages = (shop.pages ?? []).filter((p) => !p.hidden);
  return (
    <footer className="pt-foot">
      <span className="pt-foot-bg" {...ed("site.shop.discoverImage", "image", "عکس پشت پایین صفحه")}>
        {bg && <img src={bg} alt="" loading="lazy" />}
      </span>
      <div className="pt-wrap pt-foot-cols">
        <div>
          <h4>ساعات کاری</h4>
          <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "multiline", "ساعات کاری (هر روز در یک خط، مثل «شنبه تا چهارشنبه: ۹ تا ۲۳»)")}>
            <div {...ed("site.contactNote", "multiline", "ساعات کاری (هر روز در یک خط، مثل «شنبه تا چهارشنبه: ۹ تا ۲۳»)")}>
              <Hours text={site?.contactNote} />
            </div>
          </Opt>
        </div>
        <div className="pt-foot-mid">
          <span className="pt-foot-brand" {...ed("site.signatureImage", "image", "آرم پایین صفحه")}>
            {brand ? <img src={brand} alt={b.fullName} loading="lazy" /> : <b>{b.fullName}</b>}
          </span>
          <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <p {...ed("site.address", "text", "نشانی")}>{site?.address}</p>
          </Opt>
          {b.email && (
            <a href={`mailto:${b.email}`} dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
              {b.email}
            </a>
          )}
          {b.phone && (
            <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
              {b.phone}
            </a>
          )}
          <Socials ctx={ctx} editing={editing} className="pt-foot-socials" />
        </div>
        <div>
          {blockOn(ctx.data, "newsletter") && b.email && (
            <>
              <h4>خبرنامه</h4>
              <Opt value={shop.newsletterText} editing={editing} edit={ed("site.shop.newsletterText", "text", "متن خبرنامه")}>
                <p {...ed("site.shop.newsletterText", "text", "متن خبرنامه")}>{shop.newsletterText}</p>
              </Opt>
              {/* No server mailbox yet: joining opens an email to the restaurant with the visitor's address. */}
              <form method="get" action={`mailto:${b.email}`} className="pt-news">
                <input type="hidden" name="subject" value="عضویت در خبرنامه" />
                <input name="body" type="email" required placeholder="ایمیل شما" aria-label="ایمیل" dir="ltr" />
                <button type="submit" aria-label="عضویت">
                  <Svg name="arrow" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <div className="pt-wrap pt-foot-end">
        <small>{ctx.data.basics.jobTitle}</small>
        <nav>
          {menuItems(view).slice(1).map((m) => (
            <PageLink key={m.to} to={m.to} link={link}>
              {m.label}
            </PageLink>
          ))}
          {pages.map((p) => (
            <PageLink key={p.id} to={`/page/${p.slug}`} link={link}>
              {p.title}
            </PageLink>
          ))}
        </nav>
        <small>
          © {fa(new Date().getFullYear())} {b.fullName}
        </small>
      </div>
    </footer>
  );
}

/* ───────────── Home ───────────── */

/** A button per size (or one when the dish has none) that puts it straight into the cart. */
function SizeButtons({ view, p }: { view: View; p: Product }) {
  const sizes = p.options?.[0]?.values.map((v) => v.label) ?? [];
  if (p.stock === 0) return <p className="pt-soldout">تمام شد</p>;
  const list = sizes.length ? sizes : [undefined];
  return (
    <div className="pt-sizes">
      {list.map((s) => (
        <div key={s ?? "one"} className="pt-size">
          <Act view={view} op="add" id={p.id} size={s} className="pt-size-btn" label={`افزودن ${p.name}${s ? ` (${s})` : ""} به سبد`}>
            {s ?? "سفارش"}
          </Act>
          <b>{money(view, variantOf(p, s).unit)}</b>
        </div>
      ))}
    </div>
  );
}

/** One line of the menu lists: a small round picture, the name and a badge, the price and a line of text. */
function Dish({ view, p, pics = true }: { view: View; p: Product; pics?: boolean }) {
  const img = pic(p);
  return (
    <PageLink to={productPath(p)} link={view.link} className={`pt-dish${p.stock === 0 ? " pt-out" : ""}`} product={p.id}>
      {pics && <span className="pt-dish-pic">{img && <img src={img} alt="" loading="lazy" />}</span>}
      <span className="pt-dish-text">
        <span className="pt-dish-line">
          <b>{p.name}</b>
          {p.badge && <em className="pt-badge">{p.badge}</em>}
          <i aria-hidden="true" />
          {p.stock === 0 ? <span className="pt-soldout">تمام شد</span> : <Price view={view} p={p} />}
        </span>
        {p.description && <small>{p.description.split("\n")[0]}</small>}
      </span>
    </PageLink>
  );
}

function Home(view: View) {
  const { ctx, shop, link, editing } = view;
  const data = ctx.data;
  const site = data.site;
  const on = (k: string) => blockOn(data, k);
  const products = visible(shop);
  const cat = (id?: string) => (id ? products.filter((p) => p.categoryId === id) : []);
  const pizzas = cat(shop.showcaseCategoryId).slice(0, 4);
  // The pizza row shows the chosen category; the pasta row the first other one; the rest go to «à la carte».
  const pastaCat = shop.categories.find((c) => c.id !== shop.showcaseCategoryId && cat(c.id).length);
  const pasta = cat(pastaCat?.id).slice(0, 6);
  const carte = shop.categories.filter((c) => c.id !== shop.showcaseCategoryId && c.id !== pastaCat?.id && cat(c.id).length).slice(0, 3);
  const photos = (site?.gallery ?? []).filter((g) => safeUrl(g.image) && !g.description).slice(0, 4);
  const hero = safeUrl(shop.heroImage);
  return (
    <>
      <section className="pt-hero">
        <span className="pt-hero-pic" {...ed("site.shop.heroImage", "image", "عکس بالای صفحه")}>
          {hero && <img src={hero} alt="" />}
        </span>
        <div className="pt-hero-text">
          <Opt value={shop.heroKicker} editing={editing} edit={ed("site.shop.heroKicker", "text", "خط بالای تیتر")}>
            <small className="pt-kicker" {...ed("site.shop.heroKicker", "text", "خط بالای تیتر")}>
              {shop.heroKicker}
            </small>
          </Opt>
          <Opt value={shop.heroTitle} editing={editing} edit={ed("site.shop.heroTitle", "text", "تیتر اصلی")}>
            <h1 {...ed("site.shop.heroTitle", "text", "تیتر اصلی")}>{shop.heroTitle}</h1>
          </Opt>
          <Opt value={shop.heroText} editing={editing} edit={ed("site.shop.heroText", "text", "متن زیر تیتر")}>
            <p {...ed("site.shop.heroText", "text", "متن زیر تیتر")}>{shop.heroText}</p>
          </Opt>
          <div className="pt-btns">
            <PageLink to="/shop" link={link} className="pt-btn">
              سفارش آنلاین
            </PageLink>
            <PageLink to="/menu" link={link} className="pt-btn line">
              دیدن منو
            </PageLink>
          </div>
        </div>
      </section>

      {on("pizza") && pizzas.length > 0 && (
        <section className="pt-sec pt-wrap">
          <Head view={view} kicker={shop.newText} title={shop.newTitle} titlePath="site.shop.newTitle" center />
          <div className="pt-pizzas">
            {pizzas.map((p, k) => (
              <article key={p.id} className="pt-pizza" data-product={p.id}>
                <PageLink to={productPath(p)} link={link} className="pt-pizza-pic">
                  <span style={{ "--i": k } as CSSProperties}>{pic(p) && <img src={pic(p)} alt={p.name} loading="lazy" />}</span>
                </PageLink>
                <h3>{p.name}</h3>
                {p.description && <p>{p.description.split("\n")[0]}</p>}
                <SizeButtons view={view} p={p} />
              </article>
            ))}
          </div>
        </section>
      )}

      {on("pasta") && pasta.length > 0 && (
        <section className="pt-sec pt-dark">
          <div className="pt-wrap">
            <Head view={view} kicker={shop.bestText} title={shop.bestTitle} titlePath="site.shop.bestTitle" center />
            <div className="pt-pasta">
              {pasta.map((p, k) => (
                <PageLink key={p.id} to={productPath(p)} link={link} className="pt-pasta-card pt-rise" product={p.id}>
                  <span className="pt-pasta-pic" style={{ "--i": k % 3 } as CSSProperties}>
                    {pic(p) && <img src={pic(p)} alt={p.name} loading="lazy" />}
                  </span>
                  <span className="pt-dish-line">
                    <b>{p.name}</b>
                    <i aria-hidden="true" />
                    <Price view={view} p={p} />
                  </span>
                  {p.description && <small>{p.description.split("\n")[0]}</small>}
                </PageLink>
              ))}
            </div>
          </div>
        </section>
      )}

      {on("carte") && carte.length > 0 && <Carte view={view} cats={carte} />}

      {on("about") && <AboutBlock view={view} pics={photos.slice(0, 2)} />}

      {on("visit") && (
        <section className="pt-sec pt-wrap pt-split pt-split3">
          <div className="pt-split-text pt-rise">
            <small className="pt-kicker">رزرو میز</small>
            <h2>به رستوران ما سر بزنید</h2>
            <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن دعوت")}>
              <div className="pt-muted" {...ed("site.contactText", "multiline", "متن دعوت")}>
                <Para text={site?.contactText} />
              </div>
            </Opt>
            <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
              <p className="pt-contact-line">
                <Svg name="pin" /> <span {...ed("site.address", "text", "نشانی")}>{site?.address}</span>
              </p>
            </Opt>
            {data.basics.phone && (
              <p className="pt-contact-line">
                <Svg name="phone" />{" "}
                <a href={`tel:${data.basics.phone.replace(/[^\d+]/g, "")}`} dir="ltr">
                  {data.basics.phone}
                </a>
              </p>
            )}
            <PageLink to="/contact" link={link} className="pt-btn">
              راه‌های ارتباط
            </PageLink>
          </div>
          <PhotoPair view={view} pics={photos.slice(2, 4)} />
        </section>
      )}
    </>
  );
}

/** «À la carte»: two columns of short lists with small round pictures. */
function Carte({ view, cats }: { view: View; cats: Shop["categories"] }) {
  const { shop, link } = view;
  const products = visible(shop);
  return (
    <section className="pt-sec pt-wrap">
      <Head view={view} kicker={shop.discoverTitle} title={shop.discountTitle} titlePath="site.shop.discountTitle" center />
      <div className="pt-carte">
        {cats.map((c) => (
          <div key={c.id} className="pt-carte-col pt-rise">
            <h3>{c.name}</h3>
            {products
              .filter((p) => p.categoryId === c.id)
              .slice(0, 6)
              .map((p) => (
                <Dish key={p.id} view={view} p={p} />
              ))}
          </div>
        ))}
      </div>
      <div className="pt-btns pt-center">
        <PageLink to="/shop" link={link} className="pt-btn">
          سفارش آنلاین
        </PageLink>
        <PageLink to="/menu" link={link} className="pt-btn line">
          همه‌ی منو
        </PageLink>
      </div>
    </section>
  );
}

type Photo = NonNullable<ResumeData["site"]>["gallery"][number];

/** Two tall photos side by side (stacked on phones), each opens large. */
function PhotoPair({ view, pics }: { view: View; pics: Photo[] }) {
  return (
    <div className="pt-pair">
      {pics.map((g) => (
        <ZoomOpen key={g.id} id={g.id} className="pt-photo pt-rise">
          <img src={safeUrl(g.image)} alt={g.title} loading="lazy" {...ed(`${item("site.gallery", g.id)}.image`, "image", "عکس")} />
        </ZoomOpen>
      ))}
      {view.editing && pics.length < 2 && (
        <span className="pt-photo pt-add" {...ed("site.gallery", "newimage", "افزودن عکس")}>
          +
        </span>
      )}
    </div>
  );
}

function AboutBlock({ view, pics }: { view: View; pics?: Photo[] }) {
  const { ctx, editing, link } = view;
  const site = ctx.data.site;
  return (
    <section className={`pt-sec pt-wrap pt-split pt-flip${pics ? " pt-split3" : ""}`}>
      {pics ? <PhotoPair view={view} pics={pics} /> : <Pic src={site?.aboutImage} path="site.aboutImage" label="عکس معرفی" className="pt-split-pic pt-rise" />}
      <div className="pt-split-text pt-rise">
        <Opt value={site?.aboutCaption} editing={editing} edit={ed("site.aboutCaption", "text", "خط بالای تیتر")}>
          <small className="pt-kicker" {...ed("site.aboutCaption", "text", "خط بالای تیتر")}>
            {site?.aboutCaption}
          </small>
        </Opt>
        <Opt value={site?.aboutTitle} editing={editing} edit={ed("site.aboutTitle", "text", "تیتر معرفی")}>
          <h2 {...ed("site.aboutTitle", "text", "تیتر معرفی")}>{site?.aboutTitle}</h2>
        </Opt>
        <Opt value={site?.aboutText} editing={editing} edit={ed("site.aboutText", "multiline", "متن معرفی")}>
          <div className="pt-muted" {...ed("site.aboutText", "multiline", "متن معرفی")}>
            <Para text={site?.aboutText} />
          </div>
        </Opt>
        <PageLink to="/shop" link={link} className="pt-btn">
          سفارش غذا
        </PageLink>
      </div>
    </section>
  );
}

/* ───────────── Menu page ───────────── */

function MenuPage(view: View) {
  const { shop } = view;
  const products = visible(shop);
  const cats = shop.categories.filter((c) => products.some((p) => p.categoryId === c.id));
  return (
    <>
      {cats.length > 1 && (
        <nav className="pt-jump" aria-label="دسته‌های منو">
          <div className="pt-wrap">
            {cats.map((c) => (
              <a key={c.id} href={`#pt-cat-${c.id}`}>
                {c.name}
              </a>
            ))}
          </div>
        </nav>
      )}
      {cats.map((c, k) => {
        const list = products.filter((p) => p.categoryId === c.id);
        const cover = safeUrl(c.image) ?? pic(list[0]!);
        return (
          <section key={c.id} id={`pt-cat-${c.id}`} className={`pt-sec pt-menu-cat${k % 2 ? " pt-dark" : ""}`}>
            <div className="pt-wrap">
              <span className="pt-cat-pic" {...ed(`${item("site.shop.categories", c.id)}.image`, "image", "عکس دسته")}>
                {cover && <img src={cover} alt="" loading="lazy" />}
              </span>
              <h2 className="pt-cat-title">{c.name}</h2>
              <div className="pt-menu-list">
                {list.map((p) => (
                  <Dish key={p.id} view={view} p={p} pics={false} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}

/* ───────────── About and contact ───────────── */

function About(view: View) {
  const { ctx, shop, editing } = view;
  const site = ctx.data.site;
  const team = (site?.gallery ?? []).filter((g) => safeUrl(g.image) && g.description).slice(0, 4);
  const sign = safeUrl(shop.trendImage);
  return (
    <>
      <AboutBlock view={view} />
      <section className="pt-sec pt-wrap pt-split">
        <div className="pt-split-text pt-rise">
          <small className="pt-kicker">سفری خوش‌طعم</small>
          <Opt value={site?.styleTitle} editing={editing} edit={ed("site.styleTitle", "text", "تیتر")}>
            <h2 {...ed("site.styleTitle", "text", "تیتر")}>{site?.styleTitle}</h2>
          </Opt>
          <Opt value={site?.styleText} editing={editing} edit={ed("site.styleText", "multiline", "متن")}>
            <div className="pt-muted" {...ed("site.styleText", "multiline", "متن")}>
              <Para text={site?.styleText} />
            </div>
          </Opt>
          <span className="pt-sign" {...ed("site.shop.trendImage", "image", "امضا")}>
            {sign && <img src={sign} alt="" loading="lazy" />}
          </span>
        </div>
        <Pic src={site?.heroImage} path="site.heroImage" label="عکس کنار متن" className="pt-split-pic pt-rise" />
      </section>
      {team.length > 0 && (
        <section className="pt-sec pt-dark">
          <div className="pt-wrap">
            <Head view={view} kicker="درباره‌ی تیم ما" title="با سرآشپزهای ما آشنا شوید" center />
            <div className="pt-team">
              {team.map((g, k) => {
                const at = item("site.gallery", g.id);
                return (
                  <figure key={g.id} className="pt-chef pt-rise" style={{ "--i": k } as CSSProperties}>
                    <span className="pt-chef-pic">
                      <img src={safeUrl(g.image)} alt={g.title} loading="lazy" {...ed(`${at}.image`, "image", "عکس")} />
                    </span>
                    <small className="pt-kicker" {...ed(`${at}.description`, "text", "سمت")}>
                      {g.description}
                    </small>
                    <b {...ed(`${at}.title`, "text", "نام")}>{g.title}</b>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Contact(view: View) {
  const { ctx, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const map = safeUrl(site?.mapUrl);
  const embed = mapEmbed(map);
  return (
    <>
      <section className="pt-contact">
        <div className="pt-contact-text pt-rise">
          <small className="pt-kicker">نشانی ما</small>
          <h1>کجا ما را پیدا کنید</h1>
          <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن")}>
            <div className="pt-muted" {...ed("site.contactText", "multiline", "متن")}>
              <Para text={site?.contactText} />
            </div>
          </Opt>
          <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <p className="pt-contact-line">
              <Svg name="pin" /> <span {...ed("site.address", "text", "نشانی")}>{site?.address}</span>
            </p>
          </Opt>
          {b.phone && (
            <p className="pt-contact-line">
              <Svg name="phone" />{" "}
              <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                {b.phone}
              </a>
            </p>
          )}
          {b.email && (
            <p className="pt-contact-line">
              <Svg name="mail" />{" "}
              <a href={`mailto:${b.email}`} dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
                {b.email}
              </a>
            </p>
          )}
          {map && (
            <a href={map} {...outside(map)} className="pt-btn">
              مسیریابی
            </a>
          )}
        </div>
        <div className="pt-map" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان، بلد یا اوپن‌استریت‌مپ)")}>
          {embed ? <iframe src={embed} title="نقشه‌ی رستوران" loading="lazy" referrerPolicy="no-referrer" /> : <span>برای نمایش نقشه، لینک مکان رستوران را بگذارید.</span>}
        </div>
      </section>
      <section className="pt-contact">
        <Pic src={site?.accentImage} path="site.accentImage" label="عکس کنار فرم" className="pt-contact-pic" />
        <div className="pt-contact-text pt-rise">
          <small className="pt-kicker">در تماس باشید</small>
          <h2>تماس با ما</h2>
          <p className="pt-muted">برای پرسش‌های عمومی این فرم را پر کنید؛ ظرف ۴۸ ساعت پاسخ می‌دهیم.</p>
          {b.email ? (
            // No server mailbox yet: sending opens an email to the restaurant.
            <form method="get" action={`mailto:${b.email}`} className="pt-form">
              <label>
                نام شما
                <input name="cc" />
              </label>
              <label>
                ایمیل شما
                <input name="bcc" type="email" dir="auto" />
              </label>
              <label className="pt-full">
                موضوع
                <input name="subject" />
              </label>
              <label className="pt-full">
                پیام شما
                <textarea name="body" required rows={4} />
              </label>
              <button type="submit" className="pt-btn">
                ارسال
              </button>
            </form>
          ) : (
            <p className="pt-muted">برای فعال شدن فرم، ایمیل رستوران را وارد کنید.</p>
          )}
        </div>
      </section>
    </>
  );
}

/* ───────────── Order online (shop) and product ───────────── */

function Listing(view: View & { categoryId?: string }) {
  const { shop, link, visitor } = view;
  const q = visitor.query;
  const { list, cats, cat, active } = filterProducts(visible(shop), shop.categories ?? [], q, view.categoryId);
  const here = view.categoryId ? `/category/${view.categoryId}` : "/shop";
  const sort = SORTS.find(([k]) => k === (q.sort ?? "new")) ?? SORTS[0]!;
  return (
    <section className="pt-wrap pt-inner">
      <nav className="pt-cats">
        <PageLink to="/shop" link={link} current={!cat}>
          همه
        </PageLink>
        {cats.map((c) => (
          <PageLink key={c.id} to={`/category/${c.id}`} link={link} current={cat?.id === c.id}>
            {c.name}
          </PageLink>
        ))}
      </nav>
      <div className="pt-toolbar">
        <span>
          نمایش {fa(list.length)} مورد
          {active && (
            <>
              {" · "}
              <PageLink to={here} link={link}>
                حذف فیلترها
              </PageLink>
            </>
          )}
        </span>
        <details className="pt-sort">
          <summary>
            {sort[1]} <Svg name="down" />
          </summary>
          <div>
            {SORTS.map(([k, label]) => (
              <form key={k} method="get" action={link(here)}>
                {Object.entries(q)
                  .filter(([key, v]) => v && key !== "sort")
                  .map(([key, v]) => (
                    <input key={key} type="hidden" name={key} value={v} />
                  ))}
                <input type="hidden" name="sort" value={k} />
                <button type="submit" aria-current={k === sort[0] || undefined}>
                  {label}
                </button>
              </form>
            ))}
          </div>
        </details>
      </div>
      {list.length ? (
        <div className="pt-grid">
          {list.map((p, k) => (
            <ProductCard key={p.id} view={view} p={p} i={k} />
          ))}
        </div>
      ) : (
        <p className="pt-notice">{active ? "موردی با این فیلترها پیدا نشد." : "هنوز غذایی اضافه نشده است."}</p>
      )}
    </section>
  );
}

function ProductCard({ view, p, i = 0 }: { view: View; p: Product; i?: number; mode?: string }) {
  const img = pic(p);
  const rating = view.visitor.ratings?.[p.id];
  const soldOut = p.stock === 0;
  return (
    <article className="pt-card pt-rise" style={{ "--i": i % 4 } as CSSProperties} data-product={p.id}>
      <div className="pt-card-pic">
        <PageLink to={productPath(p)} link={view.link}>
          <span className="pt-img">{img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}</span>
        </PageLink>
        {soldOut ? <span className="pt-sale dark">تمام</span> : onSale(p) ? <span className="pt-sale">{fa(percentOff(p))}٪</span> : null}
        {!soldOut &&
          (hasChoices(p) ? (
            <PageLink to={productPath(p)} link={view.link} className="pt-card-add">
              انتخاب گزینه‌ها
            </PageLink>
          ) : (
            <Act view={view} op="add" id={p.id} className="pt-card-add" label="افزودن به سبد">
              افزودن به سبد
            </Act>
          ))}
      </div>
      <PageLink to={productPath(p)} link={view.link} className="pt-card-name">
        <span>{p.name}</span>
      </PageLink>
      <Price view={view} p={p} />
      {rating && <Stars value={rating.avg} count={rating.count} />}
    </article>
  );
}

function ProductPage(view: View & { id: string }) {
  const { shop, link, visitor } = view;
  const p = visible(shop).find((x) => x.id === view.id)!;
  const cat = shop.categories.find((c) => c.id === p.categoryId);
  const related = visible(shop)
    .filter((x) => x.id !== p.id && x.categoryId === p.categoryId)
    .slice(0, 4);
  const soldOut = p.stock === 0;
  const imgs = p.images.map((u) => safeUrl(u)).filter((u): u is string => Boolean(u));
  const rating = visitor.ratings?.[p.id];
  const [lead, ...rest] = (p.description ?? "").split(/\n\s*\n|\n/).filter((x) => x.trim());
  return (
    <>
      <section className="pt-wrap pt-inner pt-product" data-product={p.id}>
        <div className="pt-gallery">
          {(imgs.length ? imgs : [undefined]).map((src, k) =>
            src ? (
              <ZoomOpen key={k} id={`${p.id}-${k}`} className="pt-gal">
                <span>
                  <img src={src} alt={p.name} />
                </span>
              </ZoomOpen>
            ) : (
              <span key={k} className="pt-gal" />
            ),
          )}
          <i className="pt-zoom" aria-hidden="true">
            <Svg name="zoom" />
          </i>
        </div>
        <div className="pt-pinfo">
          <h1>{p.name}</h1>
          <Price view={view} p={p} />
          {rating && <Stars value={rating.avg} count={rating.count} />}
          {lead && <p className="pt-muted">{lead}</p>}
          {soldOut ? (
            <p className="pt-soldout">این غذا امروز تمام شده است.</p>
          ) : (
            <form method="post" action={link("/_cart")} className="pt-buy">
              <input type="hidden" name="op" value="add" />
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="back" value="/cart" />
              <OptionPicker p={p} />
              <div className="pt-buy-row">
                <label className="pt-qty">
                  <span className="sr-only">تعداد</span>
                  <input type="number" name="qty" min={1} max={p.stock ?? 50} defaultValue={1} />
                </label>
                <button type="submit" className="pt-btn light">
                  افزودن به سبد
                </button>
              </div>
            </form>
          )}
          <dl className="pt-meta">
            <dt>کد:</dt>
            <dd dir="ltr">{p.id.toUpperCase()}</dd>
            {cat && (
              <>
                <dt>دسته:</dt>
                <dd>
                  <PageLink to={`/category/${cat.id}`} link={link}>
                    {cat.name}
                  </PageLink>
                </dd>
              </>
            )}
            {p.badge && (
              <>
                <dt>برچسب:</dt>
                <dd>{p.badge}</dd>
              </>
            )}
          </dl>
        </div>
      </section>
      <section className="pt-wrap pt-tabs">
        <input type="radio" name="pt-tab" id="pt-tab-1" defaultChecked />
        <input type="radio" name="pt-tab" id="pt-tab-2" />
        <div className="pt-tab-heads">
          <label htmlFor="pt-tab-1">توضیحات</label>
          <label htmlFor="pt-tab-2">نظرات ({fa(rating?.count ?? 0)})</label>
        </div>
        <div className="pt-tab pt-tab-desc">
          {(rest.length ? rest : lead ? [lead] : []).map((x, k) => (
            <p key={k}>{x}</p>
          ))}
          <SpecsTable p={p} className="pt-specs" />
        </div>
        <div className="pt-tab pt-tab-rev">
          <Reviews p={p} link={link} page={view.page} visitor={visitor} />
        </div>
      </section>
      {related.length > 0 && (
        <section className="pt-wrap pt-sec">
          <Head view={view} title="غذاهای مشابه" />
          <div className="pt-grid">
            {related.map((x, k) => (
              <ProductCard key={x.id} view={view} p={x} i={k} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── Cart, checkout and the rest (shared shapes, PatioTime look) ───────────── */

/** No page-name strip on any page (the owner's choice); kept for the shared shapes. */
function PageHead(_: { title: string; view: View; trail?: { label: string; to?: string }[] }) {
  return null;
}

function Act({ view, op, id, children, className, qty, size, label }: { view: View; op: "add" | "remove" | "wish" | "set"; id: string; children: ReactNode; className?: string; qty?: number; size?: string; label?: string }) {
  return (
    <form method="post" action={view.link("/_cart")} className="pt-act">
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

/** Section heading of the reference: bold title, a grey line beside it, "view all" on the other side. */

/** Price filter of the side column: two boxes, two handles on one line (plain range inputs) and a button. */


function Empty({ view, text, heart }: { view: View; text: string; heart?: boolean }) {
  return (
    <div className="pt-empty">
      <Svg name={heart ? "heartBig" : "bag"} className="pt-empty-ico" />
      <p>{text}</p>
      <PageLink to="/shop" link={view.link} className="pt-btn dark">
        بازگشت به فروشگاه
      </PageLink>
    </div>
  );
}



function Cart(view: View) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  return (
    <section className="pt-wrap pt-inner">
      <PageHead view={view} title="سبد خرید" />
      {cart.lines.length === 0 ? (
        <Empty view={view} text="سبد خرید شما خالی است." />
      ) : (
        <div className="pt-cart">
          <div className="pt-box pt-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="pt-line">
                <PageLink to={productPath(l.product)} link={link} className="pt-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div className="pt-line-info">
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
                <div className="pt-stepper">
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                    <Svg name="minus" />
                  </Act>
                  <span>{fa(l.qty)}</span>
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                    <Svg name="plus" />
                  </Act>
                </div>
                <b className="pt-line-total">{money(view, l.total)}</b>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="pt-remove" label="حذف از سبد">
                  <Svg name="trash" />
                </Act>
              </div>
            ))}
          </div>
          <aside className="pt-box pt-sum">
            <h2>خلاصه‌ی سفارش</h2>
            <dl>
              <dt>جمع کالاها ({fa(cart.count)})</dt>
              <dd>{money(view, cart.subtotal)}</dd>
              {cart.discount > 0 && (
                <>
                  <dt>کد تخفیف</dt>
                  <dd className="pt-minus">− {money(view, cart.discount)}</dd>
                </>
              )}
              <dt>هزینه‌ی ارسال</dt>
              <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
              <dt className="total">مبلغ قابل پرداخت</dt>
              <dd className="total">{money(view, cart.total)}</dd>
            </dl>
            {shop.freeShippingFrom && cart.shipping > 0 ? <small>برای خریدهای بالای {money(view, shop.freeShippingFrom)} ارسال رایگان است.</small> : null}
            {(shop.coupons ?? []).length > 0 && <CouponBox link={link} page={view.page} visitor={visitor} applied={cart.coupon} error={cart.couponError} />}
            <PageLink to="/checkout" link={link} className="pt-btn wide">
              ادامه‌ی خرید
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
    <section className="pt-wrap pt-inner">
      {items.length === 0 ? (
        <Empty view={view} heart text="فهرست علاقه‌مندی‌های شما خالی است." />
      ) : (
        <>
          <PageHead view={view} title="علاقه‌مندی‌ها" />
          <div className="pt-grid four">
            {items.map((p) => (
              <ProductCard key={p.id} view={view} p={p} mode="shop" />
            ))}
          </div>
        </>
      )}
    </section>
  );
}



function Search(view: View) {
  const q = (view.visitor.query.q ?? "").trim();
  const words = q.split(/\s+/).filter(Boolean);
  const found = words.length ? visible(view.shop).filter((p) => words.every((w) => `${p.name} ${p.description ?? ""}`.includes(w))) : [];
  return (
    <section className="pt-wrap pt-inner">
      <PageHead view={view} title="جستجو" />
      <form method="get" action={view.link("/search")} className="pt-search pt-search-big">
        <input name="q" defaultValue={q} placeholder="نام محصول را بنویسید..." aria-label="جستجو" />
        <button type="submit" aria-label="جستجو">
          <Svg name="search" />
        </button>
      </form>
      {words.length > 0 &&
        (found.length ? (
          <div className="pt-grid four">
            {found.map((p) => (
              <ProductCard key={p.id} view={view} p={p} mode="shop" />
            ))}
          </div>
        ) : (
          <p className="pt-notice">محصولی با «{q}» پیدا نشد.</p>
        ))}
    </section>
  );
}



function Checkout(view: View) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  const me = visitor.customer;
  const addr = visitor.account?.addresses[0];
  const error = visitor.query.error;
  if (cart.lines.length === 0)
    return (
      <section className="pt-wrap pt-inner">
        <PageHead view={view} title="ثبت سفارش" />
        <Empty view={view} text="سبد خرید شما خالی است؛ اول چند محصول اضافه کنید." />
      </section>
    );
  return (
    <section className="pt-wrap pt-inner">
      <PageHead view={view} title="ثبت سفارش" trail={[{ label: "سبد خرید", to: "/cart" }, { label: "ثبت سفارش" }]} />
      <div className="pt-cart">
        <form method="post" action={link("/_order")} className="pt-box pt-checkout">
          <h2>اطلاعات ارسال</h2>
          {error && <p className="pt-error">{error}</p>}
          {!me && (
            <p className="full pt-muted">
              قبلاً خرید کرده‌اید؟{" "}
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
          <input name="website" tabIndex={-1} autoComplete="off" className="pt-trap" aria-hidden="true" />
          <button type="submit" className="pt-btn full">
            ثبت سفارش
          </button>
        </form>
        <aside className="pt-box pt-sum">
          <h2>سفارش شما</h2>
          <ul className="pt-sum-lines">
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
                <dd className="pt-minus">− {money(view, cart.discount)}</dd>
              </>
            )}
            <dt>هزینه‌ی ارسال</dt>
            <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
            <dt className="total">مبلغ قابل پرداخت</dt>
            <dd className="total">{money(view, cart.total)}</dd>
          </dl>
          {shop.paymentNote && (
            <p className="pt-pay" {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>
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
    <section className="pt-wrap pt-inner">
      <PageHead view={view} title={view.visitor.customer ? "حساب کاربری" : "ورود یا ثبت‌نام"} />
      <AccountPage link={view.link} page={view.page} visitor={view.visitor} />
    </section>
  );
}



function Thanks(view: View) {
  const code = view.visitor.query.code;
  const shop = view.shop;
  return (
    <section className="pt-wrap pt-inner">
      <div className="pt-box pt-thanks">
        <span className="pt-done" aria-hidden="true">
          <Svg name="check" />
        </span>
        <h1>سفارش شما ثبت شد</h1>
        {code && (
          <p>
            کد پیگیری سفارش: <b dir="ltr">{code}</b>
          </p>
        )}
        {shop.orderNote && <p {...ed("site.shop.orderNote", "multiline", "پیام بعد از ثبت سفارش")}>{shop.orderNote}</p>}
        {shop.paymentNote && <p className="pt-pay">{shop.paymentNote}</p>}
        <PageLink to="/shop" link={view.link} className="pt-btn">
          بازگشت به فروشگاه
        </PageLink>
      </div>
    </section>
  );
}



/* ───────────── Example content (from the PatioTime reference, in Persian) ───────────── */

export function patioSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`pt-${n}`);
  const png = (n: string) => sampleImage(`pt-${n}`, "png");
  const size = (regular: number, large: number): Partial<Product> => ({
    options: [{ name: "اندازه", values: [{ label: "معمولی" }, { label: "بزرگ" }] }],
    variants: [
      { key: "معمولی", price: regular },
      { key: "بزرگ", price: large },
    ],
    price: regular,
  });
  const dish = (id: string, categoryId: string, name: string, price: number, image: string, description: string, extra: Partial<Product> = {}): Product => ({ id, name, categoryId, price, images: [image], description, ...extra });
  const products: Product[] = [
    dish("z1", "pz", "مارگاریتا", 0, img("pizza3"), "سس گوجه، موتزارلای تازه، ریحان و روغن زیتون.", size(390000, 480000)),
    dish("z2", "pz", "بوراتای کلاسیک", 0, img("pizza2"), "سس گوجه، پنیر بوراتا، اسفناج تازه و گوجه‌گیلاسی.", size(450000, 560000)),
    dish("z3", "pz", "کاپریچوزا", 0, img("pizza1"), "سس گوجه، ژامبون، قارچ، کنگر فرنگی و زیتون سیاه.", size(430000, 530000)),
    dish("z4", "pz", "سیسیلیانا", 0, img("pizza4"), "سس گوجه، پپرونی، پیاز قرمز، فلفل تند و پنیر چدار.", { ...size(440000, 540000), badge: "تند" }),
    dish("p1", "ps", "اسپاگتی ناپولیتانا", 320000, img("pasta2"), "سس گوجه‌ی تازه، سیر، ریحان و پارمزان.\nپاستای تازه‌ی دست‌ساز که هر روز صبح در آشپزخانه‌ی ما آماده می‌شود."),
    dish("p2", "ps", "اسپاگتی پوتانسکا", 340000, img("pasta3"), "زیتون، کاپاری، گوجه و فلفل تند.", { badge: "پیشنهاد سرآشپز" }),
    dish("p3", "ps", "پنه آرابیاتا", 310000, img("pasta4"), "پنه با سس گوجه‌ی تند و سیر."),
    dish("p4", "ps", "پاپاردله با میگو", 420000, img("pasta6"), "پاپاردله، میگو، سیر و جعفری.", { salePrice: 370000 }),
    dish("p5", "ps", "کاپلینی با غذای دریایی", 450000, img("pasta5"), "صدف، میگو و ماهی مرکب با سس سفید."),
    dish("p6", "ps", "فتوچینی بولونز", 380000, img("pasta1"), "فتوچینی با سس گوشت آرام‌پز و پارمزان.\nسس بولونزِ ما چهار ساعت آرام می‌پزد تا طعمش کامل شود.", { featured: true }),
    dish("s1", "st", "سالاد ذرت بنفش", 210000, png("dish1"), "ذرت، کاهو، آووکادو و سس لیمو.", { badge: "جدید" }),
    dish("s2", "st", "ساندویچ بروسکتا", 190000, png("dish2"), "نان تست، گوجه، ریحان و روغن زیتون."),
    dish("s3", "st", "صدف تازه", 520000, png("dish4"), "یک دوجین صدف تازه با لیمو و یخ."),
    dish("d1", "sd", "کلم بروکسل", 140000, png("dish6"), "کلم بروکسل برشته با کره و سیر.", { badge: "گیاهی" }),
    dish("d2", "sd", "بروکلی کره‌ای", 130000, png("dish5"), "بروکلی بخارپز با کره و لیمو."),
    dish("m1", "mp", "پیتزا پپرونی کوچک", 260000, png("dish9"), "پپرونی، پیاز قرمز و موتزارلا."),
    dish("m2", "mp", "پیتزا سبزیجات", 240000, png("dish7"), "اسفناج، قارچ و پنیر بز.", { badge: "گیاهی" }),
    dish("m3", "mp", "پیتزا دیاولا", 270000, png("dish11"), "سالامی تند، زیتون سیاه و فلفل.", { stock: 0 }),
  ];
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "PatioTime",
      jobTitle: "رستوران و کافه",
      avatarUrl: png("logo"),
      email: "booking@example.com",
      phone: "021 0000 0000",
      summary: "",
      links: [
        { id: "sl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "sl2", type: "telegram", url: "https://t.me/example" },
        { id: "sl3", type: "whatsapp", url: "https://wa.me/example" },
      ],
    },
    site: {
      ...base.site,
      aboutCaption: "طعم و تغذیه",
      aboutTitle: "غذای باکیفیت و متعادل",
      aboutText: "غذا، هماهنگی و خنده سرو می‌کنیم؛ از سال ۱۳۷۷ غذای خوشمزه و تجربه‌ای دلپذیر برای مهمانانمان ساخته‌ایم.\n\nمشتری‌ها مهمان ما هستند و ما میزبانشان؛ کار ما این است که هر روز هر لحظه از تجربه‌ی مهمانان را کمی بهتر کنیم.",
      aboutImage: img("about2"),
      styleTitle: "فلسفه‌ی ما",
      styleText: "ساده و متعادل. سرآشپز ما طعم‌ها و غذاهای ویژه‌ی ایتالیا و فراتر از آن را با هنری غافلگیرکننده کنار هم می‌گذارد.\n\n«در همه‌ی دنیا سفر کرده‌ام و طعم‌های محلی را چشیده‌ام. هر آشپز فلسفه و روش خودش را دارد و من از همه‌شان یاد گرفته‌ام.»",
      heroImage: img("photo1"),
      accentImage: img("contact"),
      signatureImage: png("bistro"),
      contactText: "رستوران ما در قلب شهر، کنار پارک ملت است. برای رزرو میز یا سفارش مهمانی تماس بگیرید یا به ما سر بزنید؛ خوشحال می‌شویم میزبانتان باشیم.",
      contactNote: "شنبه تا چهارشنبه: ۹ تا ۲۲\nپنجشنبه: ۱۱ تا ۲۴\nجمعه: ۱۱ تا ۲۳\nساعت خوش: ۱۷ تا ۲۱",
      address: "تهران، خیابان ولیعصر، روبه‌روی پارک ملت، پلاک ۱۲۳",
      mapUrl: "https://www.openstreetmap.org/?mlat=35.7000&mlon=51.4000",
      gallery: [
        { id: "g1", title: "برگر و سیب‌زمینی", image: img("photo1") },
        { id: "g2", title: "پیتزا", image: img("photo2") },
        { id: "g3", title: "دسر", image: img("photo3") },
        { id: "g4", title: "کباب", image: img("photo4") },
        { id: "c1", title: "علی مرادی", description: "سرآشپز", image: img("chef1") },
        { id: "c2", title: "آیدا ویلیامز", description: "سرآشپز شیرینی", image: img("chef2") },
      ],
      shop: {
        heroKicker: "خوش آمدید به",
        heroTitle: "پاتیوتایم بیسترو",
        heroText: "رستوران، بار و کافه؛ غذای تازه و فضایی گرم برای هر روز.",
        heroImage: img("hero"),
        newText: "رستوران ایتالیایی",
        newTitle: "منوی پیتزا",
        bestText: "تازه از آشپزخانه",
        bestTitle: "پاستای تازه",
        discoverTitle: "منوی کامل",
        discountTitle: "آلاکارت",
        discoverImage: img("foot"),
        trendImage: png("sign"),
        newsletterText: "از تازه‌ترین خبرها و پیشنهادهای ما باخبر شوید.",
        showcaseCategoryId: "pz",
        categories: [
          { id: "pz", name: "پیتزا", image: img("pizza2") },
          { id: "ps", name: "پاستا و اسپاگتی", image: img("pasta1") },
          { id: "st", name: "پیش‌غذا", image: png("dish4") },
          { id: "sd", name: "کنار غذا", image: png("dish6") },
          { id: "mp", name: "پیتزای کوچک", image: png("dish10") },
        ],
        products,
        shippingFee: 50000,
        freeShippingFrom: 1500000,
        coupons: [{ id: "d1", code: "PATIO10", percent: 10, maxDiscount: 150000, active: true }],
        paymentNote: "پرداخت در محل هنگام تحویل، یا کارت به کارت پس از تماس ما.",
        orderNote: "سفارش شما ثبت شد؛ به‌زودی برای هماهنگی ارسال با شما تماس می‌گیریم.",
        faq: [
          { id: "f1", q: "تا چه شعاعی ارسال دارید؟", a: "تا شعاع ۷ کیلومتری رستوران، با پیک خودمان." },
          { id: "f2", q: "چقدر طول می‌کشد سفارش برسد؟", a: "معمولاً ۴۰ تا ۶۰ دقیقه." },
        ],
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
@font-face { font-family: "Kafe Markazi"; src: url("/_assets/fonts/kafe-markazi.woff") format("woff"); font-display: swap; }
.pt {
  --pt-orange: var(--color-primary);
  --pt-gold: #E9A13B;
  --pt-bg: #0B0B0B;
  --pt-bg2: #151515;
  --pt-line: rgb(255 255 255 / .12);
  --pt-muted: rgb(255 255 255 / .68);
  --pt-head: "Kafe Markazi", var(--font-heading), serif;
  --sk-accent: var(--pt-orange);
  --sk-card: var(--pt-bg2);
  --sk-line: var(--pt-line);
  --sk-soft: #1C1C1C;
  --sk-muted: var(--pt-muted);
  --sk-radius: 0px;
  --sk-card-radius: 0px;
  background: var(--pt-bg);
  color: #fff;
  font-size: 15px;
}
.pt :where(input, textarea, select) { width: auto; padding: 0; border: 0; border-radius: 0; background: none; color: inherit; outline-offset: 2px; }
.pt a { color: inherit; text-decoration: none; }
.pt h1, .pt h2, .pt h3, .pt h4, .pt p, .pt figure { margin: 0; }
.pt-ico { width: 20px; height: 20px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.pt-wrap { box-sizing: border-box; width: 100%; max-width: 1240px; margin-inline: auto; padding-inline: 24px; }
.pt-sec { padding-block: 100px; }
.pt-dark { background: var(--pt-bg2); }
.pt-inner { padding-block: 60px 90px; }
.pt-muted { color: var(--pt-muted); line-height: 2; }
.pt-muted p + p { margin-top: 14px; }
.pt-center { justify-content: center; justify-items: center; text-align: center; }
.pt-act { display: contents; }
.pt-pic { display: block; overflow: hidden; }
.pt-pic img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s cubic-bezier(.2, .8, .2, 1); }
.pt-pic:hover img { transform: scale(1.05); }
.pt-add { display: grid; place-items: center; border: 1px dashed var(--pt-line); color: var(--pt-muted); font-size: 28px; cursor: pointer; }
.pt-notice { padding: 30px; background: var(--pt-bg2); color: var(--pt-muted); text-align: center; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

/* Buttons: square, small capitals feel, orange fill or a white line */
.pt-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 46px; padding: 0 26px; border: 1px solid var(--pt-orange); background: var(--pt-orange); color: #fff !important; font-size: 13px; font-weight: 700; cursor: pointer; transition: background .3s, color .3s, border-color .3s; }
.pt-btn:hover { background: transparent; color: var(--pt-orange) !important; }
.pt-btn.line { border-color: #fff; background: transparent; }
.pt-btn.line:hover { background: #fff; color: #111 !important; }
.pt-btn.light { border-color: #EDEDED; background: #EDEDED; color: #111 !important; }
.pt-btn.light:hover { background: transparent; color: #fff !important; }
.pt-btns { display: flex; flex-wrap: wrap; gap: 14px; }
.pt-kicker { display: inline-flex; align-items: center; gap: 14px; color: var(--pt-gold); font-size: 13px; font-weight: 700; }
.pt-kicker::after { content: ""; width: 54px; height: 1px; background: currentColor; }
.pt-center .pt-kicker::before { content: ""; width: 54px; height: 1px; background: currentColor; }
.pt-head-block { display: grid; gap: 14px; margin-bottom: 56px; }
.pt-head-block h2, .pt-split-text h2, .pt-contact-text h1, .pt-contact-text h2 { font-family: var(--pt-head); font-size: clamp(32px, 3.4cqi, 48px); font-weight: 500; line-height: 1.25; }

/* Header: menu, logo in the middle, socials, bag and the order button */
.pt-header { position: sticky; top: 0; z-index: 30; background: rgb(11 11 11 / .96); border-bottom: 1px solid var(--pt-line); }
/* On the home page the header lies over the hero (sticky, pulled over it), never outside the page. */
.pt-home .pt-header { margin-bottom: -97px; background: linear-gradient(rgb(0 0 0 / .55), transparent); border-color: transparent; }
.pt-header-in { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 20px; min-height: 96px; }
.pt-nav { display: flex; gap: 28px; font-size: 14px; font-weight: 600; }
.pt-nav a { position: relative; padding: 6px 0; }
.pt-nav a::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 1px; background: var(--pt-orange); transform: scaleX(0); transition: transform .3s; }
.pt-nav a:hover::after, .pt-nav a[aria-current="page"]::after { transform: scaleX(1); }
.pt-logo { justify-self: center; display: flex; }
.pt-logo img { display: block; height: 58px; width: auto; }
.pt-logo b { font-family: var(--pt-head); font-size: 34px; }
.pt-tools { display: flex; align-items: center; justify-content: flex-end; gap: 18px; }
.pt-head-socials { gap: 4px !important; }
.pt-head-socials a { width: 32px !important; height: 32px !important; color: #fff !important; }
.pt-head-socials a:hover { color: var(--pt-orange) !important; background: none !important; }
.pt-head-socials .p-ico { width: 16px; height: 16px; }
.pt-order { height: 42px; padding: 0 20px; font-size: 12px; }
.pt-burger { display: none; }
.pt-mini { position: relative; outline: none; }
.pt-bag { position: relative; display: grid; place-items: center; width: 38px; height: 38px; }
.pt-bag i { position: absolute; top: 1px; inset-inline-end: -2px; min-width: 16px; height: 16px; padding: 0 3px; box-sizing: border-box; border-radius: 8px; background: var(--pt-orange); font-size: 10px; font-style: normal; font-weight: 700; line-height: 16px; text-align: center; }
.pt-mini-panel { position: absolute; top: calc(100% + 14px); inset-inline-end: -40px; z-index: 40; display: grid; gap: 16px; width: 330px; padding: 24px; background: #0F0F0F; border: 1px solid var(--pt-line); box-shadow: 0 30px 50px -30px #000; opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .25s, transform .25s, visibility .25s; }
.pt-mini:hover .pt-mini-panel, .pt-mini:focus-within .pt-mini-panel { opacity: 1; visibility: visible; transform: none; }
.pt-mini-line { display: grid; grid-template-columns: 70px 1fr auto; gap: 14px; align-items: start; padding-bottom: 16px; border-bottom: 1px solid var(--pt-line); }
.pt-mini-pic img { display: block; width: 70px; height: 70px; object-fit: cover; }
.pt-mini-line span:nth-child(2) { display: grid; gap: 6px; }
.pt-mini-line b { font-family: var(--pt-head); font-size: 19px; font-weight: 500; }
.pt-mini-line small { color: var(--pt-muted); }
.pt-mini-x { display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: none; background: none; color: #fff; cursor: pointer; }
.pt-mini-x .pt-ico { width: 14px; height: 14px; }
.pt-mini-sum { font-size: 14px; }
.pt-mini-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.pt-mini-btns .pt-btn { padding: 0 10px; }

/* Hero */
.pt-hero { position: relative; display: grid; align-items: center; min-height: clamp(560px, 52cqi, 820px); overflow: hidden; isolation: isolate; }
.pt-hero-pic { position: absolute; inset: 0; z-index: -1; }
.pt-hero-pic img { width: 100%; height: 100%; object-fit: cover; animation: pt-zoom 22s ease-in-out infinite alternate; }
.pt-hero-pic::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgb(0 0 0 / .15), rgb(0 0 0 / .7)); }
@keyframes pt-zoom { to { transform: scale(1.12); } }
.pt-hero-text { display: grid; justify-items: start; gap: 18px; width: min(620px, 100%); box-sizing: border-box; margin-inline-start: clamp(20px, 9cqi, 160px); padding-top: 90px; }
.pt-hero-text h1 { font-family: var(--pt-head); font-size: clamp(48px, 6.4cqi, 92px); font-weight: 500; line-height: 1.05; }
.pt-hero-text p { max-width: 460px; color: rgb(255 255 255 / .85); font-size: 16px; line-height: 2; }
.pt-hero-text > * { animation: pt-up 1s cubic-bezier(.2, .8, .2, 1) both; }
.pt-hero-text > :nth-child(2) { animation-delay: .15s; }
.pt-hero-text > :nth-child(3) { animation-delay: .3s; }
.pt-hero-text > :nth-child(4) { animation-delay: .45s; }
@keyframes pt-up { from { opacity: 0; transform: translateY(30px); } }

/* Pizza menu: when the page opens the round pizzas spin fast for a few seconds and come to rest; a button per size */
.pt-pizzas { display: grid; justify-items: center; gap: 90px; }
.pt-pizza { display: grid; justify-items: center; gap: 14px; width: min(100%, 520px); text-align: center; }
.pt-pizza-pic { display: block; width: min(100%, 440px); }
.pt-pizza-pic span { display: block; aspect-ratio: 1; border-radius: 50%; overflow: hidden; box-shadow: 0 30px 50px -30px #000; animation: pt-spin 3s calc(.4s + var(--i) * .15s) cubic-bezier(.1, .65, .15, 1) both; }
.pt-pizza-pic img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.14); transition: transform .8s; }
.pt-pizza:hover .pt-pizza-pic img { transform: scale(1.2) rotate(8deg); }
@keyframes pt-spin { from { transform: rotate(-900deg) scale(.82); opacity: 0; } 15% { opacity: 1; } }
.pt-pizza h3 { margin-top: 18px; font-family: var(--pt-head); font-size: clamp(30px, 3cqi, 40px); font-weight: 500; }
.pt-pizza p { max-width: 380px; color: rgb(255 255 255 / .82); font-family: var(--pt-head); font-size: 20px; font-style: italic; line-height: 1.6; }
.pt-sizes { display: grid; gap: 12px; margin-top: 10px; }
.pt-size { display: flex; align-items: center; justify-content: center; gap: 16px; }
.pt-size-btn { min-width: 92px; height: 34px; padding: 0 14px; border: 1px solid #fff; background: none; color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; transition: background .25s, color .25s; }
.pt-size-btn:hover { background: #fff; color: #111; }
.pt-size b { min-width: 120px; font-family: var(--pt-head); font-size: 28px; font-weight: 500; text-align: start; }
.pt-soldout { color: #E8705A; font-size: 13px; font-weight: 700; }

/* Fresh pasta cards */
.pt-pasta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 46px 30px; }
.pt-pasta-card { display: grid; gap: 12px; align-content: start; }
.pt-pasta-pic { display: block; aspect-ratio: 734 / 536; overflow: hidden; }
.pt-pasta-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.1s cubic-bezier(.2, .8, .2, 1); }
.pt-pasta-card:hover .pt-pasta-pic img { transform: scale(1.07); }
.pt-pasta-card small, .pt-dish-text small { color: var(--pt-muted); font-size: 13px; line-height: 1.8; }
.pt-dish-line { display: flex; align-items: baseline; gap: 10px; }
.pt-dish-line b { font-family: var(--pt-head); font-size: 21px; font-weight: 500; }
.pt-dish-line > i { flex: 1; min-width: 16px; border-bottom: 1px dotted rgb(255 255 255 / .3); transform: translateY(-5px); }
.pt-price { display: inline-flex; gap: 8px; align-items: baseline; white-space: nowrap; }
.pt-price b { font-family: var(--pt-head); font-size: 20px; font-weight: 500; }
.pt-price s { color: var(--pt-muted); font-size: 13px; }
.pt-badge { padding: 1px 7px; background: var(--pt-orange); font-size: 10px; font-style: normal; font-weight: 700; white-space: nowrap; }

/* À la carte */
.pt-carte { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px 60px; margin-bottom: 50px; }
.pt-carte-col { display: grid; align-content: start; gap: 22px; }
.pt-carte-col h3 { padding-bottom: 12px; border-bottom: 1px solid var(--pt-line); font-family: var(--pt-head); font-size: 30px; font-weight: 500; }
.pt-dish { display: flex; align-items: center; gap: 16px; transition: color .2s; }
.pt-dish:hover .pt-dish-line b { color: var(--pt-gold); }
.pt-dish-pic { flex: none; width: 58px; height: 58px; border-radius: 50%; overflow: hidden; transition: transform .6s cubic-bezier(.2, .8, .2, 1.3); }
.pt-dish:hover .pt-dish-pic { transform: rotate(-25deg) scale(1.06); }
.pt-dish-pic img { width: 100%; height: 100%; object-fit: cover; }
.pt-dish-text { flex: 1; min-width: 0; display: grid; gap: 4px; }
.pt-out { opacity: .5; }

/* Photo row, split blocks */
.pt-photo { display: block; aspect-ratio: 3 / 4; overflow: hidden; cursor: zoom-in; }
.pt-photo img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s, filter .5s; }
.pt-photo:hover img { transform: scale(1.07); filter: brightness(.8); }
.pt-split { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
.pt-flip .pt-split-text { order: 2; }
.pt-split3 { grid-template-columns: 1.4fr 1fr; gap: 60px; }
.pt-split3:not(.pt-flip) { grid-template-columns: 1fr 1.4fr; }
.pt-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.pt-pair .pt-photo { aspect-ratio: 3 / 4; }
.pt-split-text { display: grid; justify-items: start; gap: 20px; }
.pt-split-pic { aspect-ratio: 4 / 5; }
.pt-contact-line { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.pt-contact-line .pt-ico { width: 17px; height: 17px; }
.pt-sign img { display: block; height: 54px; width: auto; }

/* Menu page */
.pt-jump { position: sticky; top: 97px; z-index: 20; background: rgb(11 11 11 / .96); border-bottom: 1px solid var(--pt-line); }
.pt-jump .pt-wrap { display: flex; justify-content: center; gap: 8px; padding-block: 14px; overflow-x: auto; scrollbar-width: none; }
.pt-jump a { flex: none; padding: 8px 18px; border: 1px solid var(--pt-line); font-size: 13px; transition: background .2s, border-color .2s; }
.pt-jump a:hover { background: var(--pt-orange); border-color: var(--pt-orange); }
section[id^="pt-cat-"] { scroll-margin-top: 160px; }
.pt-menu-cat .pt-wrap { display: grid; justify-items: center; }
.pt-cat-pic { display: block; width: 220px; aspect-ratio: 1; border-radius: 50%; overflow: hidden; box-shadow: 0 30px 50px -30px #000; }
.pt-cat-pic img { width: 100%; height: 100%; object-fit: cover; animation: pt-spin 2.6s cubic-bezier(.12, .7, .2, 1) both; }
.pt-cat-title { display: flex; align-items: center; gap: 16px; margin: 30px 0 46px; font-family: var(--pt-head); font-size: 32px; font-weight: 500; color: var(--pt-gold); }
.pt-cat-title::before, .pt-cat-title::after { content: ""; width: 40px; height: 1px; background: currentColor; }
.pt-menu-list { display: grid; grid-template-columns: 1fr 1fr; gap: 26px 60px; width: 100%; }

/* Team */
.pt-team { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 34px; justify-content: center; }
.pt-chef { display: grid; justify-items: center; gap: 10px; text-align: center; }
.pt-chef-pic { display: block; width: 100%; aspect-ratio: 530 / 650; overflow: hidden; }
.pt-chef-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s; }
.pt-chef:hover .pt-chef-pic img { transform: scale(1.06); }
.pt-chef .pt-kicker { margin-top: 10px; }
.pt-chef .pt-kicker::after { display: none; }
.pt-chef b { font-family: var(--pt-head); font-size: 26px; font-weight: 500; }

/* Contact */
.pt-contact { display: grid; grid-template-columns: 1fr 1fr; min-height: 560px; }
.pt-contact-text { display: grid; align-content: center; justify-items: start; gap: 18px; padding: 70px clamp(24px, 6cqi, 90px); }
.pt-map { display: grid; place-items: center; min-height: 420px; align-self: center; background: var(--pt-bg2); color: var(--pt-muted); font-size: 13px; }
.pt-map iframe { width: 100%; height: 100%; min-height: 420px; border: 0; filter: grayscale(.2); }
.pt-contact-pic { min-height: 520px; }
.pt-contact + .pt-contact .pt-contact-text { background: var(--pt-bg); }
.pt-form { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; width: 100%; margin-top: 10px; }
.pt-form label { display: grid; gap: 10px; font-size: 14px; }
.pt-form input, .pt-form textarea { width: 100%; padding: 10px 0; border-bottom: 1px solid var(--pt-line); font: inherit; transition: border-color .3s; }
.pt-form input:focus, .pt-form textarea:focus { outline: none; border-color: var(--pt-orange); }
.pt-form textarea { resize: vertical; }
.pt-full { grid-column: 1 / -1; }
.pt-form .pt-btn { justify-self: start; }

/* Order online: category links, sorting and a four-column grid */
.pt-cats { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 30px; }
.pt-cats a { padding: 8px 18px; border: 1px solid var(--pt-line); font-size: 13px; transition: background .2s, border-color .2s; }
.pt-cats a:hover, .pt-cats a[aria-current="page"] { background: var(--pt-orange); border-color: var(--pt-orange); }
.pt-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 34px; font-size: 16px; }
.pt-toolbar a { color: var(--pt-gold); }
.pt-sort { position: relative; }
.pt-sort summary { display: flex; align-items: center; gap: 30px; min-width: 200px; justify-content: space-between; list-style: none; cursor: pointer; }
.pt-sort summary::-webkit-details-marker { display: none; }
.pt-sort > div { position: absolute; top: calc(100% + 8px); inset-inline-end: 0; z-index: 20; display: grid; min-width: 220px; background: #111; border: 1px solid var(--pt-line); }
.pt-sort button { width: 100%; padding: 10px 14px; border: none; background: none; color: #fff; text-align: start; cursor: pointer; }
.pt-sort button:hover, .pt-sort button[aria-current] { background: var(--pt-orange); }
.pt-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px 30px; }
.pt-card { display: grid; justify-items: center; gap: 8px; text-align: center; }
.pt-card-pic { position: relative; width: 100%; overflow: hidden; }
.pt-img { display: grid; place-items: center; aspect-ratio: 1; background: var(--pt-bg2); }
.pt-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s cubic-bezier(.2, .8, .2, 1); }
.pt-card:hover .pt-img img { transform: scale(1.08); }
/* Small round pictures (the à la carte dishes) keep near their own size instead of being blown up. */
.pt-img img[src*=".png"] { width: 56%; height: 56%; object-fit: contain; }
.pt-img b { font-family: var(--pt-head); font-size: 40px; color: var(--pt-muted); }
.pt-sale { position: absolute; top: 14px; inset-inline-start: 14px; display: grid; place-items: center; width: 54px; height: 54px; border-radius: 50%; background: var(--pt-orange); font-size: 13px; font-weight: 700; }
.pt-sale.dark { background: #333; }
.pt-card-add { position: absolute; inset-inline: 0; bottom: 0; display: grid; place-items: center; height: 46px; padding: 0; border: none; background: rgb(221 89 2 / .94); color: #fff !important; font-size: 13px; font-weight: 700; cursor: pointer; transform: translateY(100%); transition: transform .35s cubic-bezier(.2, .8, .2, 1); }
.pt-card:hover .pt-card-add, .pt-card:focus-within .pt-card-add { transform: none; }
.pt-card-name { margin-top: 10px; font-family: var(--pt-head); font-size: 22px; }
.pt-card-name:hover { color: var(--pt-gold); }

/* Product page */
.pt-product { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
.pt-gallery { position: relative; display: grid; }
.pt-gal { grid-area: 1 / 1; display: block; aspect-ratio: 1; overflow: hidden; cursor: zoom-in; }
.pt-gal span { display: contents; }
.pt-gal img { width: 100%; height: 100%; object-fit: cover; }
.pt-gal + .pt-gal { visibility: hidden; }
.pt-zoom { position: absolute; top: 18px; inset-inline-end: 18px; display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; background: #fff; color: #111; pointer-events: none; }
.pt-pinfo { display: grid; gap: 18px; align-content: start; }
.pt-pinfo h1 { font-family: var(--pt-head); font-size: clamp(32px, 3.4cqi, 46px); font-weight: 500; }
.pt-pinfo .pt-price b { font-size: 28px; }
.pt-buy { display: grid; gap: 14px; }
.pt-buy-row { display: flex; gap: 12px; }
.pt-qty input { width: 90px; height: 46px; box-sizing: border-box; border: 1px solid var(--pt-line); text-align: center; font: inherit; }
.pt-meta { display: grid; grid-template-columns: auto 1fr; gap: 6px 10px; margin: 6px 0 0; font-size: 14px; }
.pt-meta dt { font-weight: 700; }
.pt-meta dd { margin: 0; color: var(--pt-muted); }
.pt-meta a:hover { color: var(--pt-gold); }
.pt-tabs > input { position: absolute; opacity: 0; pointer-events: none; }
.pt-tab-heads { display: flex; gap: 30px; border-bottom: 1px solid var(--pt-line); }
.pt-tab-heads label { padding: 12px 0; margin-bottom: -1px; border-bottom: 2px solid transparent; color: var(--pt-muted); font-weight: 700; cursor: pointer; }
#pt-tab-1:checked ~ .pt-tab-heads label[for="pt-tab-1"], #pt-tab-2:checked ~ .pt-tab-heads label[for="pt-tab-2"] { border-color: var(--pt-orange); color: #fff; }
.pt-tab { display: none; padding-block: 26px 40px; }
#pt-tab-1:checked ~ .pt-tab-desc, #pt-tab-2:checked ~ .pt-tab-rev { display: grid; gap: 14px; }
.pt-tab-desc p { color: var(--pt-muted); line-height: 2; }

/* Footer: a dark restaurant photo behind three columns */
.pt-foot { position: relative; isolation: isolate; overflow: hidden; padding-top: 90px; }
.pt-foot-bg { position: absolute; inset: 0; z-index: -1; }
.pt-foot-bg img { width: 100%; height: 100%; object-fit: cover; opacity: .3; }
.pt-foot-cols { display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 50px; padding-bottom: 70px; border-bottom: 1px solid var(--pt-line); }
.pt-foot h4 { margin-bottom: 20px; font-size: 15px; font-weight: 700; }
.pt-foot-cols > div { display: grid; align-content: start; }
.pt-hours { display: grid; gap: 8px; margin: 0; font-size: 14px; }
.pt-hours div { display: flex; justify-content: space-between; gap: 16px; }
.pt-hours dd { margin: 0; color: var(--pt-muted); }
.pt-foot-mid { justify-items: center; gap: 8px; text-align: center; font-size: 14px; color: var(--pt-muted); }
.pt-foot-brand img { display: block; width: 260px; height: auto; margin-bottom: 14px; }
.pt-foot-brand b { font-family: var(--pt-head); font-size: 40px; color: #fff; }
.pt-foot-socials { margin-top: 10px; justify-content: center; gap: 4px !important; }
.pt-foot-socials a, .pt-foot-socials .p-ghost { width: 34px !important; height: 34px !important; color: #fff !important; }
.pt-foot-socials a:hover { color: var(--pt-orange) !important; background: none !important; }
.pt-foot-socials .p-ico { width: 16px; height: 16px; }
.pt-foot-cols p { color: var(--pt-muted); font-size: 14px; line-height: 1.9; }
.pt-news { display: flex; margin-top: 18px; border-bottom: 1px solid var(--pt-line); }
.pt-news input { flex: 1; min-width: 0; height: 44px; font: inherit; font-size: 14px; }
.pt-news button { display: grid; place-items: center; width: 40px; border: none; background: none; color: #fff; cursor: pointer; transition: color .2s, transform .3s; }
.pt-news button:hover { color: var(--pt-orange); transform: translateX(-4px); }
.pt-foot-end { display: flex; justify-content: space-between; align-items: center; gap: 20px; min-height: 90px; font-size: 13px; color: var(--pt-muted); }
.pt-foot-end nav { display: flex; flex-wrap: wrap; gap: 22px; }
.pt-foot-end nav a { color: #fff; transition: color .2s; }
.pt-foot-end nav a:hover { color: var(--pt-orange); }

/* Cart, checkout and the rest */
.pt-box { padding: 28px; background: var(--pt-bg2); border: 1px solid var(--pt-line); box-sizing: border-box; }
.pt-empty { display: grid; justify-items: center; gap: 20px; padding-block: 60px; text-align: center; }
.pt-empty-ico { width: 90px; height: 90px; stroke-width: 1.2; color: var(--pt-gold); }
.pt-empty p { color: var(--pt-muted); font-size: 16px; }
.pt-cart { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 30px; align-items: start; }
.pt-lines { padding: 0; }
.pt-line { display: grid; grid-template-columns: 80px minmax(0, 1fr) auto auto auto; align-items: center; gap: 16px; padding: 16px 22px; border-top: 1px solid var(--pt-line); }
.pt-line:first-child { border-top: none; }
.pt-line-pic img { width: 80px; height: 80px; object-fit: cover; }
.pt-line-info { display: grid; gap: 4px; }
.pt-line-info b { font-family: var(--pt-head); font-size: 20px; font-weight: 500; }
.pt-line-info small { color: var(--pt-muted); }
.pt-stepper { display: flex; align-items: center; gap: 10px; padding: 4px; border: 1px solid var(--pt-line); }
.pt-stepper button { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: none; background: #222; color: #fff; cursor: pointer; }
.pt-stepper .pt-ico { width: 14px; height: 14px; }
.pt-line-total { min-width: 110px; text-align: end; }
.pt-remove { display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: none; background: none; color: var(--pt-muted); cursor: pointer; }
.pt-remove:hover { color: #E8705A; }
.pt-sum { display: grid; gap: 14px; }
.pt-sum h2, .pt-checkout h2 { font-family: var(--pt-head); font-size: 26px; font-weight: 500; }
.pt-sum dl { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin: 0; font-size: 14px; }
.pt-sum dd { margin: 0; font-weight: 600; }
.pt-sum .total { padding-top: 12px; border-top: 1px solid var(--pt-line); font-size: 16px; font-weight: 800; }
.pt-sum > small { color: var(--pt-gold); }
.pt-minus { color: #7BD389; }
.pt-sum-lines { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; font-size: 14px; }
.pt-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.pt-checkout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.pt-checkout h2, .pt-checkout .full, .pt-checkout .pt-error { grid-column: 1 / -1; }
.pt-checkout label { display: grid; gap: 8px; font-size: 14px; }
.pt-checkout input, .pt-checkout textarea { padding: 10px 0; border-bottom: 1px solid var(--pt-line); font: inherit; }
.pt-checkout input:focus, .pt-checkout textarea:focus { outline: none; border-color: var(--pt-orange); }
.pt-trap { position: absolute; inset-inline-start: 0; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }
.pt-error { padding: 10px 14px; background: rgb(232 112 90 / .15); color: #F09A88; }
.pt-pay { padding: 14px; background: #1E1E1E; font-size: 13px; line-height: 1.8; }
.pt-thanks { display: grid; justify-items: center; gap: 14px; max-width: 520px; margin: 40px auto; text-align: center; }
.pt-done { display: grid; place-items: center; width: 70px; height: 70px; border-radius: 50%; background: var(--pt-orange); }
.pt-done .pt-ico { width: 32px; height: 32px; stroke-width: 2.4; }
.pt-search { display: flex; align-items: center; height: 54px; border-bottom: 1px solid var(--pt-line); }
.pt-search input { flex: 1; min-width: 0; height: 100%; font: inherit; font-size: 16px; }
.pt-search button { display: grid; place-items: center; width: 54px; height: 100%; border: none; background: none; color: #fff; cursor: pointer; }
.pt-search-big { max-width: 640px; margin-bottom: 30px; }
.pt .sk-account, .pt .sk-form { color: #fff; }

/* Reveal on scroll */
@supports (animation-timeline: view()) {
  .pt-rise { animation: pt-rise linear both; animation-timeline: view(); animation-range: entry calc(var(--i, 0) * 5%) entry calc(65% + var(--i, 0) * 5%); }
  @keyframes pt-rise { from { opacity: 0; transform: translateY(36px); } }
}

@container (max-width: 1100px) {
  .pt-head-socials { display: none !important; }
  .pt-nav { gap: 18px; }
  .pt-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pt-pasta { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pt-cart { grid-template-columns: 1fr; }
}
@container (max-width: 820px) {
  .pt { font-size: 14px; }
  .pt-wrap { padding-inline: 18px; }
  .pt-sec { padding-block: 64px; }
  .pt-head-block { margin-bottom: 36px; }
  /* Phone header as in the reference: menu button, logo in the middle, bag */
  .pt-header-in { min-height: 70px; grid-template-columns: 1fr auto 1fr; }
  .pt-home .pt-header { margin-bottom: -71px; }
  .pt-nav, .pt-order { display: none; }
  .pt-logo img { height: 42px; }
  .pt-burger { display: block; position: static; }
  .pt-burger summary { display: grid; place-items: center; width: 40px; height: 40px; list-style: none; cursor: pointer; position: relative; z-index: 3; }
  .pt-burger summary::-webkit-details-marker { display: none; }
  .pt-burger summary span, .pt-burger summary span::before, .pt-burger summary span::after { position: relative; display: block; width: 24px; height: 1.5px; background: #fff; transition: transform .3s, background .3s; }
  .pt-burger summary span::before, .pt-burger summary span::after { content: ""; position: absolute; inset-inline: 0; }
  .pt-burger summary span::before { top: -7px; }
  .pt-burger summary span::after { top: 7px; }
  .pt-burger[open] summary span { background: transparent; }
  .pt-burger[open] summary span::before { top: 0; transform: rotate(45deg); }
  .pt-burger[open] summary span::after { top: 0; transform: rotate(-45deg); }
  .pt-burger[open] summary::before { content: ""; position: absolute; z-index: -1; inset: 0 0 auto; height: 100vh; }
  .pt-header-in { position: relative; }
  .pt-drawer { position: absolute; inset-inline: 0; top: 100%; z-index: 2; display: grid; padding: 8px 18px 20px; background: #0B0B0B; border-bottom: 1px solid var(--pt-line); animation: pt-drop .35s ease both; }
  @keyframes pt-drop { from { opacity: 0; transform: translateY(-10px); } }
  .pt-drawer a { padding: 14px 4px; border-top: 1px solid var(--pt-line); font-weight: 600; }
  .pt-drawer a[aria-current="page"] { color: var(--pt-orange); }
  .pt-mini-panel { inset-inline-end: -10px; width: min(330px, 86vw); }
  .pt-hero-text { padding-top: 70px; margin-inline: 18px; justify-items: center; text-align: center; }
  .pt-hero-text .pt-btns { justify-content: center; }
  .pt-pasta { grid-template-columns: 1fr; }
  /* As in the reference: the two photos first, the text under them. */
  .pt-split3, .pt-split3:not(.pt-flip) { grid-template-columns: 1fr; gap: 30px; }
  .pt-split3 .pt-split-text, .pt-flip.pt-split3 .pt-split-text { order: 2; }
  .pt-pizzas { gap: 64px; }
  .pt-pizza-pic { width: 92%; }
  .pt-hero-text h1 { font-size: 48px; }
  .pt-pair { grid-template-columns: 1fr; }
  .pt-carte, .pt-menu-list { grid-template-columns: 1fr; }
  .pt-split, .pt-contact, .pt-product, .pt-foot-cols { grid-template-columns: 1fr; gap: 40px; }
  .pt-flip .pt-split-text { order: 0; }
  .pt-split-pic { aspect-ratio: 4 / 3; }
  .pt-contact-text { padding: 56px 18px; }
  .pt-contact-pic { min-height: 300px; }
  .pt-form { grid-template-columns: 1fr; }
  .pt-jump { top: 71px; }
  .pt-jump .pt-wrap { justify-content: flex-start; }
  .pt-cat-pic { width: 200px; }
  .pt-grid { gap: 30px 14px; }
  .pt-card-name { font-size: 18px; }
  .pt-card-add { transform: none; height: 40px; font-size: 12px; }
  .pt-toolbar { font-size: 14px; }
  .pt-sort summary { min-width: 0; gap: 10px; }
  .pt-foot-cols { text-align: center; }
  .pt-hours div { justify-content: center; }
  .pt-foot-end { flex-direction: column; justify-content: center; padding-block: 26px; text-align: center; }
  .pt-foot-end nav { justify-content: center; gap: 14px; }
  .pt-line { grid-template-columns: 64px minmax(0, 1fr) auto; }
  .pt-line-pic img { width: 64px; height: 64px; }
  .pt-line-total { grid-column: 2; text-align: start; min-width: 0; }
  .pt-checkout { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .pt *, .pt *::before, .pt *::after { animation: none !important; transition: none !important; }
}
`;
