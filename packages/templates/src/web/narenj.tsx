/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Narenj": a boutique guesthouse, in Persian. A framed page:
// a big slider with the menu over it, then tiles (check availability, breakfast, about, the amenities
// band, map, check-in, hosts, a guest's words) and a newsletter band. Pages: rooms (with an
// availability search), each room (pictures, amenities, rules, a two-month calendar of free nights,
// prices, map and the reservation box with extras and discount codes), offers, about, blog, contact,
// and the visitor's bookings and tracking. Rooms are booked by the night: the calendar and the price
// come from the owner's rooms and the bookings already taken; the server checks it again. No
// scripts: days are links, the slider and menu use radios and details.

import type { ReactNode } from "react";
import {
  addDay,
  couponCovers,
  couponProblem,
  daysBetween,
  emptyVisitor,
  findCoupon,
  formatToman,
  isWeekendNight,
  nightOpen,
  stayDays,
  stayDefaults,
  stayFree,
  stayNights,
  takenFor,
  todayTehran,
  unitPrice,
  type Product,
  type ResumeData,
  type Schedule,
  type Shop,
  type Visitor,
} from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { FormMeta, Opt, PageLink, blockOn, ed, item, outside, partsCss } from "./parts";
import { mapEmbed } from "./golsara";
import { AccountPage, shopkitCss } from "./shopkit";
import { TrackBooking, bookingCss, faDay, jalali, monthOf } from "./booking";
import { ZoomOpen } from "./zoom";

export const NARENJ_BLOCKS = [
  { key: "hero", label: "اسلایدر بالای صفحه" },
  { key: "search", label: "فرم بررسی اتاق خالی" },
  { key: "tiles", label: "کاشی‌های عکس (صبحانه، منو، ورود و خروج، میزبان‌ها)" },
  { key: "about", label: "درباره‌ی ما در صفحه‌ی اول" },
  { key: "amenities", label: "نوار امکانات" },
  { key: "map", label: "نقشه در صفحه‌ی اول" },
  { key: "review", label: "نظر مهمان‌ها" },
  { key: "newsletter", label: "خبرنامه" },
] as const;

export const NARENJ_OPTIONAL_PAGES = [
  { path: "/offers", label: "صفحه‌ی پیشنهادها و تخفیف‌ها" },
  { path: "/about", label: "صفحه‌ی درباره‌ی ما" },
  { path: "/blog", label: "صفحه‌ی بلاگ" },
] as const;

const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);
const roomsOf = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());
/** The booking rules: the owner's, always by the night and each room on its own. */
const scheduleOf = (shop: Shop): Schedule => ({ ...stayDefaults(), ...shop.schedule, nights: true, byService: true });
/** How many rooms of this kind there are (each night takes one). */
const unitsOf = (r: Product, s: Schedule) => r.stock ?? s.capacity;

export function narenjPages(data: ResumeData): string[] {
  const shop = data.site?.shop;
  const rooms = roomsOf(shop).map((r) => `/room/${r.id}`);
  const blog = pageOn(data, "/blog") ? ["/blog", ...livePosts(shop).map((p) => `/blog/${p.id}`)] : [];
  return ["/", "/rooms", ...rooms, ...(pageOn(data, "/offers") ? ["/offers"] : []), ...(pageOn(data, "/about") ? ["/about"] : []), ...blog, "/contact", "/account", "/track"];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; page: string; visitor: Visitor };

export function NarenjSite(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = narenjPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), page, visitor: props.visitor ?? emptyVisitor() };
  const [kind, id] = page.split("/").filter(Boolean);
  const body: ReactNode =
    page === "/" ? <Home {...view} />
    : page === "/rooms" ? <Rooms {...view} />
    : kind === "room" && id ? <Room {...view} id={id} />
    : page === "/offers" ? <Offers {...view} />
    : page === "/about" ? <About {...view} />
    : page === "/blog" ? <Blog {...view} />
    : kind === "blog" && id ? <Post {...view} id={id} />
    : page === "/account" ? <Account {...view} />
    : page === "/track" ? <Track {...view} />
    : <Contact {...view} />;
  const visitorPage = page === "/account" || page === "/track";
  const slides = (shop.slides ?? []).filter((s) => safeUrl(s.image)).length;
  return (
    <WebPage ctx={ctx} className={`nr${page === "/" ? " nr-home" : ""}`} css={partsCss + bookingCss + (visitorPage ? shopkitCss : "") + css + sliderCss(Math.max(1, slides))}>
      <Header {...view} />
      <main key={page}>{body}</main>
      <Footer {...view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const fa = (n: number) => new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(n);
const toman = (view: View, n: number) => formatToman(n, view.ctx.data.locale);
const faDate = (day: string) => new Date(`${day.slice(0, 10)}T12:00:00Z`).toLocaleDateString("fa-IR-u-ca-persian", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
const shortDay = (day: string) => faDay(day, { weekday: "long", day: "numeric", month: "long" });
const faTime = (t: string) => t.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
const faDigits = (v: string) => v.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
const telHref = (v: string) => `tel:${v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d+]/g, "")}`;
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
/** Query string of a page link (empty values left out). */
const qs = (q: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

// Thin line icons on a 48 grid, drawn with the current color.
const ICONS: Record<string, string> = {
  bed: "M5 36V14M5 26h38v10M43 36V24a5 5 0 0 0-5-5H22v7M10 26v-4a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v4",
  wifi: "M6 19a26 26 0 0 1 36 0M12 25a17 17 0 0 1 24 0M18 31a8 8 0 0 1 12 0M24 37h.1",
  safe: "M7 9h34v28H7zM10 37v3M38 37v3M24 29a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM24 17v3M24 26v3M30 23h-3M21 23h-3M35 15v16",
  bath: "M5 25h38v4a9 9 0 0 1-9 9H14a9 9 0 0 1-9-9zM10 25V11a4 4 0 0 1 8 0M14 38l-2 4M34 38l2 4M17 15h4",
  gym: "M8 18v12M13 14v20M35 14v20M40 18v12M13 24h22M4 24h4M40 24h4",
  drink: "M14 6h20l-3 16a7 7 0 0 1-14 0zM24 29v12M17 42h14M16 14h16",
  cup: "M9 18h26v8a13 13 0 0 1-26 0zM35 21h3a4 4 0 0 1 0 8h-4M16 6c-2 3 2 5 0 8M23 6c-2 3 2 5 0 8M8 42h30",
  parking: "M8 6h32v36H8zM19 34V14h7a6 6 0 0 1 0 12h-7",
  snow: "M24 5v38M8 14l32 20M40 14L8 34M19 8l5 5 5-5M19 40l5-5 5 5",
  flame: "M24 43c-8 0-13-5-13-12 0-9 9-13 9-22 5 3 9 9 9 14 2-2 3-5 3-7 4 4 5 9 5 15 0 7-5 12-13 12zM24 43c-3 0-5-2-5-5 0-4 5-7 5-11 3 3 5 6 5 10 0 4-2 6-5 6z",
  tv: "M5 11h38v24H5zM17 41h14M24 35v6",
  pot: "M8 20h32v14a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8zM4 20h4M40 20h4M18 20v-5a6 6 0 0 1 12 0v5",
  fridge: "M11 5h26v38H11zM11 19h26M16 11v4M16 24v6",
  dryer: "M18 30a12 12 0 1 1 12-12v2l-6 4M18 23a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM24 30l-4 13h-6l2-14M38 13h5M38 19h5",
  towel: "M10 6h28v6H10zM13 12v30h22V12M13 30h22M13 35h22",
  balcony: "M10 26V10a14 14 0 0 1 28 0v16M6 26h36M6 26v16h36V26M12 26v16M18 26v16M24 26v16M30 26v16M36 26v16",
  desk: "M4 18h40M9 18v24M39 18v24M28 18v12h11M28 24h11M19 6h10l-2 12h-6z",
  paw: "M24 42c-6 0-11-3-11-8 0-6 6-10 11-10s11 4 11 10c0 5-5 8-11 8zM12 22a4 5 0 1 0 0-.1zM36 22a4 5 0 1 0 0-.1zM19 13a4 5 0 1 0 0-.1zM29 13a4 5 0 1 0 0-.1z",
  people: "M17 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM31 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM5 39c1-7 6-11 12-11s11 4 12 11M23 31c2-2 5-3 8-3 6 0 11 4 12 11",
  area: "M6 6h36v36H6zM6 16h6M6 26h6M6 36h6M16 42v-6M26 42v-6M36 42v-6",
  dot: "M24 30a6 6 0 1 0 0-12 6 6 0 0 0 0 12z",
  star: "M24 5l5.6 12.2 13.4 1.4-10 9 2.9 13.2L24 34l-11.9 6.8 2.9-13.2-10-9 13.4-1.4z",
  moon: "M33 33A15 15 0 0 1 20 8a17 17 0 1 0 20 20 15 15 0 0 1-7 5z",
  pin: "M24 43s-13-11-13-22a13 13 0 0 1 26 0c0 11-13 22-13 22zM24 25a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z",
  calx: "M7 11h34v31H7zM7 19h34M15 6v9M33 6v9M19 26l10 10M29 26L19 36",
  card: "M5 11h38v26H5zM5 18h38M10 30h10",
  tag: "M6 6h17l19 19-17 17L6 23zM15 15h.1",
  phone: "M14 8h7l3 9-4.5 3a23 23 0 0 0 9.5 9.5l3-4.5 9 3v7a3 3 0 0 1-3 3C21 38 10 27 11 11a3 3 0 0 1 3-3z",
  mail: "M7 12h34v24H7zM7 13l17 13 17-13",
  clock: "M24 42a18 18 0 1 0 0-36 18 18 0 0 0 0 36zM24 14v10l7 5",
  user: "M24 23a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9 41c2-8 8-12 15-12s13 4 15 12",
  quote: "M8 30c0-9 4-15 11-18l1 3c-4 2-6 5-6 8h5v11H8zM27 30c0-9 4-15 11-18l1 3c-4 2-6 5-6 8h5v11H27z",
  prev: "M18 8l16 16-16 16",
  next: "M30 8L14 24l16 16",
  envelope: "M6 18l18-12 18 12v22H6zM6 18l18 13 18-13M14 12V6h20v6",
  plus: "M24 14v20M14 24h20",
};
const Svg = ({ name, className = "nr-ico" }: { name: string; className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path d={ICONS[name] ?? ICONS.dot} />
  </svg>
);
/** The icon of an amenity, from its words ("وای‌فای", "صبحانه"…); a plain dot for others. */
function amenityIcon(label: string): string {
  const rules: [RegExp, string][] = [
    [/وای|اینترنت/, "wifi"],
    [/صبحانه|قهوه|چای/, "cup"],
    [/پارکینگ/, "parking"],
    [/کولر|تهویه/, "snow"],
    [/گرمایش|شومینه|بخاری/, "flame"],
    [/تلویزیون/, "tv"],
    [/آشپزخانه|اجاق/, "pot"],
    [/یخچال/, "fridge"],
    [/حمام|دوش|وان/, "bath"],
    [/سشوار/, "dryer"],
    [/حوله|ملحفه/, "towel"],
    [/بالکن|تراس|حیاط/, "balcony"],
    [/میز/, "desk"],
    [/حیوان/, "paw"],
    [/تخت/, "bed"],
    [/گاوصندوق/, "safe"],
    [/باشگاه|ورزش/, "gym"],
    [/نوشیدنی/, "drink"],
  ];
  return rules.find(([re]) => re.test(label))?.[1] ?? "dot";
}
const AMENITY_ICONS = ["bed", "wifi", "safe", "bath", "gym", "drink"];
const FEATURE_ICONS = ["star", "moon", "pin", "calx", "card", "tag"];
/** "بیشتر +" under a tile's title. */
const More = ({ label = "بیشتر" }: { label?: string }) => (
  <span className="nr-more">
    {label} <Svg name="plus" className="nr-plus" />
  </span>
);

/* ───────────── Header and footer ───────────── */

function menu(view: View) {
  const d = view.ctx.data;
  return [
    { to: "/", label: "خانه" },
    { to: "/rooms", label: "اتاق‌ها" },
    { to: "/offers", label: "پیشنهادها" },
    { to: "/about", label: "درباره‌ی ما" },
    { to: "/blog", label: "بلاگ" },
    { to: "/contact", label: "تماس" },
  ].filter((m) => m.to === "/" || m.to === "/rooms" || m.to === "/contact" || pageOn(d, m.to));
}
const isHere = (view: View, to: string) => (to === "/" ? view.page === "/" : view.page === to || view.page.startsWith(`${to}/`) || (to === "/rooms" && view.page.startsWith("/room/")));

function Logo({ view }: { view: View }) {
  const b = view.ctx.data.basics;
  return (
    <PageLink to="/" link={view.link} className="nr-logo">
      {safeUrl(b.avatarUrl) ? (
        <img src={safeUrl(b.avatarUrl)} alt={b.fullName} {...ed("basics.avatarUrl", "image", "لوگو (خالی: نام اقامتگاه)")} />
      ) : (
        <b {...ed("basics.fullName", "text", "نام اقامتگاه")}>{b.fullName}</b>
      )}
    </PageLink>
  );
}

function Header(view: View) {
  const { link, visitor } = view;
  const items = menu(view);
  return (
    <header className="nr-head">
      <div className="nr-head-in">
        <Logo view={view} />
        <nav className="nr-nav" aria-label="منو">
          {items.map((m) => (
            <PageLink key={m.to} to={m.to} link={link} current={isHere(view, m.to)}>
              {m.label}
            </PageLink>
          ))}
        </nav>
        <PageLink to="/account" link={link} className="nr-user" current={view.page === "/account"}>
          <Svg name="user" />
          <span className="sr-only">{visitor.customer ? "رزروهای من" : "ورود یا ثبت‌نام"}</span>
        </PageLink>
        {/* The phone menu opens without scripts: a details element. */}
        <details className="nr-menu">
          <summary aria-label="منو">
            <i />
            <i />
            <i />
          </summary>
          <nav className="nr-drawer">
            {items.map((m) => (
              <PageLink key={m.to} to={m.to} link={link} current={isHere(view, m.to)}>
                {m.label}
              </PageLink>
            ))}
            <PageLink to="/account" link={link} current={view.page === "/account"}>
              {visitor.customer ? "رزروهای من" : "ورود یا ثبت‌نام"}
            </PageLink>
            <PageLink to="/track" link={link} current={view.page === "/track"}>
              پیگیری رزرو
            </PageLink>
          </nav>
        </details>
      </div>
    </header>
  );
}

const SOCIAL: Record<string, string> = {
  instagram: "M14 6h20a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8V14a8 8 0 0 1 8-8zM24 31a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM35 13h.1",
  telegram: "M5 23l37-15-6 33-11-9-6 6v-9l17-15-21 13z",
  whatsapp: "M8 40l3-9a17 17 0 1 1 6 6zM18 17c0 8 5 13 13 13l2-4-4-2-2 2c-3-1-4-3-5-5l2-2-2-4z",
  eitaa: "M6 6h36v36H6zM30 21a6 6 0 1 0-2 8M19 23h11",
  rubika: "M24 4l17 10v20L24 44 7 34V14zM24 15l8 5v9l-8 5-8-5v-9z",
};

function Footer(view: View) {
  const { ctx, link, editing, shop } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const map = safeUrl(site?.mapUrl);
  const socials = b.links.filter((l) => SOCIAL[l.type] && safeUrl(l.url));
  return (
    <footer className="nr-foot">
      <div className="nr-foot-in">
        <div className="nr-foot-col nr-foot-about">
          <h3>درباره‌ی ما</h3>
          <Opt value={b.summary} editing={editing} edit={ed("basics.summary", "multiline", "معرفی کوتاه")}>
            <p {...ed("basics.summary", "multiline", "معرفی کوتاه")}>{b.summary}</p>
          </Opt>
          {(shop.trustLogos ?? []).some((t) => safeUrl(t.image)) && (
            <div className="nr-trust">
              {(shop.trustLogos ?? []).map((t) =>
                safeUrl(t.image) ? <img key={t.id} src={safeUrl(t.image)} alt={t.title ?? ""} loading="lazy" /> : null,
              )}
            </div>
          )}
        </div>
        <div className="nr-foot-col">
          <h3>تماس</h3>
          <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <p {...ed("site.address", "text", "نشانی")}>نشانی: {site?.address}</p>
          </Opt>
          {b.phone && (
            <p>
              تلفن:{" "}
              <a href={telHref(b.phone)} {...ed("basics.phone", "text", "تلفن")}>
                <bdi dir="ltr">{faDigits(b.phone)}</bdi>
              </a>
            </p>
          )}
          {b.email && (
            <p>
              ایمیل:{" "}
              <a href={`mailto:${b.email}`} {...ed("basics.email", "text", "ایمیل")}>
                <bdi dir="ltr">{b.email}</bdi>
              </a>
            </p>
          )}
          <a href={map ?? "#"} {...outside(map)} className="nr-more nr-foot-map" {...ed("site.mapUrl", "url", "لینک نقشه")}>
            نمایش روی نقشه <Svg name="plus" className="nr-plus" />
          </a>
        </div>
        <div className="nr-foot-col">
          <h3>روش‌های پرداخت</h3>
          <Opt value={shop.paymentNote} editing={editing} edit={ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>
            <p {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>{shop.paymentNote}</p>
          </Opt>
        </div>
        <div className="nr-foot-col">
          <h3>همراه ما باشید</h3>
          <p>در شبکه‌های اجتماعی دنبالمان کنید و از پیشنهادهای تازه باخبر شوید.</p>
          <div className="nr-social">
            {socials.map((l) => (
              <a key={l.id} href={safeUrl(l.url)} {...outside(safeUrl(l.url))} aria-label={l.type} {...ed(`${item("basics.links", l.id)}.url`, "url", "لینک")}>
                <svg viewBox="0 0 48 48" className="nr-ico" aria-hidden="true">
                  <path d={SOCIAL[l.type]} />
                </svg>
              </a>
            ))}
          </div>
          <p className="nr-foot-links">
            <PageLink to="/track" link={link}>
              پیگیری رزرو
            </PageLink>
            <PageLink to="/account" link={link}>
              رزروهای من
            </PageLink>
          </p>
        </div>
      </div>
      <p className="nr-copy">© همه‌ی حقوق برای {b.fullName} محفوظ است.</p>
    </footer>
  );
}

/** The top of an inner page: a photo band with the title over it, or a cream band with the title in a box. */
function PageTop({ view, title, image, path }: { view: View; title: string; image?: string; path?: string }) {
  const pic = safeUrl(image);
  if (pic || (view.editing && path))
    return (
      <section className="nr-band" {...(path ? ed(path, "image", "عکس بالای صفحه") : {})}>
        {pic && <img src={pic} alt="" />}
        <h1>{title}</h1>
      </section>
    );
  return (
    <section className="nr-top">
      <h1>{title}</h1>
    </section>
  );
}

/* ───────────── Home ───────────── */

/** Where each photo tile leads: breakfast, menu, check-in, hosts. */
const TILE_LINKS = ["/about", "/blog", "/contact", "/about"];

function Home(view: View) {
  const { ctx, shop, link, editing } = view;
  const site = ctx.data.site;
  const on = (k: string) => blockOn(ctx.data, k);
  const tiles = (shop.banners ?? []).filter((t) => !t.hidden);
  const tile = (k: number, cls: string) => {
    const t = tiles[k];
    if (!t && !editing) return null;
    const at = t ? item("site.shop.banners", t.id) : "";
    const to = TILE_LINKS[k] ?? "/";
    const go = pageOn(ctx.data, to) || to === "/contact" ? to : "/rooms";
    return (
      <div className={`nr-tile ${cls}`}>
        {t && safeUrl(t.image) && <img src={safeUrl(t.image)} alt="" loading="lazy" {...ed(`${at}.image`, "image", "عکس")} />}
        <PageLink to={go} link={link} className="nr-tile-box">
          {t ? <h2 {...ed(`${at}.title`, "text", "عنوان")}>{t.title}</h2> : <h2>کاشی تازه</h2>}
          <More />
        </PageLink>
      </div>
    );
  };
  const review = (site?.testimonials ?? []).find((t) => !t.hidden);
  const perks = shop.perks ?? [];
  const map = safeUrl(site?.mapUrl);
  return (
    <>
      {on("hero") && <Hero view={view} />}
      <div className="nr-frame nr-grid">
        {on("search") && (
          <div className="nr-cream nr-search">
            <SearchForm view={view} />
          </div>
        )}
        {on("tiles") && tile(0, "nr-wide")}
        {on("tiles") && tile(1, "nr-wide")}
        {on("about") && (
          <div className="nr-cream nr-about-box">
            <Opt value={site?.aboutTitle} editing={editing} edit={ed("site.aboutTitle", "text", "تیتر درباره")}>
              <h2 {...ed("site.aboutTitle", "text", "تیتر درباره")}>{site?.aboutTitle}</h2>
            </Opt>
            <Opt value={site?.aboutText} editing={editing} edit={ed("site.aboutText", "multiline", "متن درباره")}>
              <div className="nr-about-text" {...ed("site.aboutText", "multiline", "متن درباره")}>
                <Para text={site?.aboutText?.split(/\n\s*\n/)[0]} />
              </div>
            </Opt>
            {pageOn(ctx.data, "/about") && (
              <PageLink to="/about" link={link}>
                <More />
              </PageLink>
            )}
          </div>
        )}
        {on("amenities") && perks.length > 0 && (
          <div className="nr-amen" {...ed("site.shop.lookImage", "image", "عکس نوار امکانات")}>
            {safeUrl(shop.lookImage) && <img src={safeUrl(shop.lookImage)} alt="" loading="lazy" />}
            <ul className="nr-amen-box">
              {perks.map((p, k) => (
                <li key={p.id}>
                  <Svg name={AMENITY_ICONS[k % AMENITY_ICONS.length]!} className="nr-big-ico" />
                  <span {...ed(`${item("site.shop.perks", p.id)}.title`, "text", "امکان")}>{p.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {on("map") && (
          <a href={map ?? "#"} {...outside(map)} className="nr-map-tile" {...ed("site.accentImage", "image", "تصویر نقشه")}>
            {safeUrl(site?.accentImage) && <img src={safeUrl(site?.accentImage)} alt="نقشه" loading="lazy" />}
          </a>
        )}
        {on("tiles") && tile(2, "nr-wide")}
        {on("tiles") && tile(3, "nr-wide")}
        {on("review") && review && (
          <div className="nr-cream nr-review">
            <Svg name="quote" className="nr-quote" />
            <h2 {...ed(`${item("site.testimonials", review.id)}.role`, "text", "عنوان کوتاه نظر")}>«{review.role || "یک انتخاب عالی"}»</h2>
            <p {...ed(`${item("site.testimonials", review.id)}.text`, "multiline", "متن نظر")}>{review.text}</p>
            <cite {...ed(`${item("site.testimonials", review.id)}.name`, "text", "نام")}>{review.name}</cite>
          </div>
        )}
      </div>
      {on("newsletter") && <Newsletter view={view} />}
    </>
  );
}

/**
 * The check-in day as a list of days in the Persian calendar ("پنجشنبه ۲۹ آبان"), from today up to
 * the days ahead the guesthouse takes bookings for. Browsers' own date fields show the Gregorian
 * calendar; this needs no script and sends the same yyyy-mm-dd value.
 */
function DaySelect({ name, value, ahead }: { name: string; value?: string; ahead: number }) {
  const today = todayTehran();
  const days = Array.from({ length: Math.max(1, Math.min(ahead, 365)) + 1 }, (_, k) => addDay(today, k));
  const year = faDay(today, { year: "numeric" });
  return (
    <select name={name} defaultValue={value && days.includes(value) ? value : days[1] ?? today} required>
      {days.map((d, k) => (
        <option key={d} value={d}>
          {k === 0 ? "امروز، " : k === 1 ? "فردا، " : ""}
          {shortDay(d)}
          {faDay(d, { year: "numeric" }) !== year ? ` ${faDay(d, { year: "numeric" })}` : ""}
        </option>
      ))}
    </select>
  );
}

/** Check-in day, nights and guests: shows the rooms free for them. */
function SearchForm({ view, title }: { view: View; title?: string }) {
  const q = view.visitor.query;
  return (
    <form method="get" action={view.link("/rooms")} className="nr-form">
      {title && <h3>{title}</h3>}
      <label>
        <span>تاریخ ورود</span>
        <DaySelect name="in" value={q.in} ahead={scheduleOf(view.shop).ahead} />
      </label>
      <label>
        <span>تعداد شب</span>
        <select name="n" defaultValue={q.n ?? "1"}>
          {Array.from({ length: 14 }, (_, k) => k + 1).map((n) => (
            <option key={n} value={n}>
              {fa(n)} شب
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>مهمان‌ها</span>
        <select name="guests" defaultValue={q.guests ?? "2"}>
          {Array.from({ length: 8 }, (_, k) => k + 1).map((n) => (
            <option key={n} value={n}>
              {fa(n)} نفر
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="nr-btn">
        بررسی اتاق خالی
      </button>
    </form>
  );
}

/** The home slider: pictures fade one after another; arrows pick one (radios, no scripts). */
function Hero({ view }: { view: View }) {
  const { shop, editing } = view;
  const slides = (shop.slides ?? []).filter((s) => safeUrl(s.image) || editing);
  if (!slides.length) return null;
  const n = slides.length;
  return (
    <section className={`nr-hero nr-n${n}`}>
      {n > 1 && <input type="radio" name="nr-s" id="nr-auto" className="nr-radio" defaultChecked />}
      {n > 1 && slides.map((s, k) => <input key={s.id} type="radio" name="nr-s" id={`nr-s${k}`} className="nr-radio" />)}
      <div className="nr-slides">
        {slides.map((s, k) => {
          const at = item("site.shop.slides", s.id);
          return (
            <div key={s.id} className={`nr-slide nr-slide-${k}`}>
              <span className="nr-slide-pic" {...ed(`${at}.image`, "image", "عکس اسلاید")}>
                {safeUrl(s.image) && <img src={safeUrl(s.image)} alt="" />}
              </span>
              <div className="nr-slide-text">
                <Opt value={s.title} editing={editing} edit={ed(`${at}.title`, "text", "تیتر")}>
                  {k === 0 ? <h1 {...ed(`${at}.title`, "text", "تیتر")}>{s.title}</h1> : <h2 {...ed(`${at}.title`, "text", "تیتر")}>{s.title}</h2>}
                </Opt>
                <Opt value={s.text} editing={editing} edit={ed(`${at}.text`, "multiline", "متن")}>
                  <p {...ed(`${at}.text`, "multiline", "متن")}>{s.text}</p>
                </Opt>
              </div>
              {n > 1 && (
                <span className="nr-arrows">
                  <label htmlFor={`nr-s${(k + n - 1) % n}`} aria-label="اسلاید قبلی">
                    <Svg name="prev" />
                  </label>
                  <label htmlFor={`nr-s${(k + 1) % n}`} aria-label="اسلاید بعدی">
                    <Svg name="next" />
                  </label>
                </span>
              )}
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <span className="nr-arrows nr-arrows-auto">
          <label htmlFor={`nr-s${n - 1}`} aria-label="اسلاید قبلی">
            <Svg name="prev" />
          </label>
          <label htmlFor="nr-s1" aria-label="اسلاید بعدی">
            <Svg name="next" />
          </label>
        </span>
      )}
    </section>
  );
}

/** Slider timing for n pictures: each shows 6 seconds and fades into the next. */
function sliderCss(n: number): string {
  if (n < 2) return "";
  const step = 100 / n;
  const fade = Math.min(step / 4, 4);
  let out = `@keyframes nr-fade${n}{0%{opacity:0}${fade.toFixed(2)}%{opacity:1}${step.toFixed(2)}%{opacity:1}${(step + fade).toFixed(2)}%{opacity:0}100%{opacity:0}}
#nr-auto:checked~.nr-slides .nr-slide{animation:nr-fade${n} ${n * 6}s linear infinite}
#nr-auto:not(:checked)~.nr-arrows-auto{display:none}
.nr-hero:hover #nr-auto:checked~.nr-slides .nr-slide{animation-play-state:paused}`;
  for (let k = 0; k < n; k++)
    out += `
#nr-auto:checked~.nr-slides .nr-slide-${k}{animation-delay:${k * 6}s}
#nr-s${k}:checked~.nr-slides .nr-slide-${k}{opacity:1;z-index:2}
#nr-s${k}:checked~.nr-slides .nr-slide-${k} .nr-arrows{visibility:visible}`;
  return out + `
@media (prefers-reduced-motion: reduce){#nr-auto:checked~.nr-slides .nr-slide{animation:none}#nr-auto:checked~.nr-slides .nr-slide-0{opacity:1}}`;
}

function Newsletter({ view }: { view: View }) {
  const { shop, editing } = view;
  return (
    <section className="nr-frame">
      <div className="nr-news" {...ed("site.shop.newImage", "image", "عکس پشت خبرنامه")}>
        {safeUrl(shop.newImage) && <img src={safeUrl(shop.newImage)} alt="" loading="lazy" />}
        <form method="post" action={view.link("/_form")} className="nr-news-box">
          <FormMeta kind="newsletter" back={view.page} />
          <Svg name="envelope" className="nr-news-ico" />
          <Opt value={shop.newsletterTitle} editing={editing} edit={ed("site.shop.newsletterTitle", "text", "تیتر خبرنامه")}>
            <h2 {...ed("site.shop.newsletterTitle", "text", "تیتر خبرنامه")}>{shop.newsletterTitle}</h2>
          </Opt>
          <input type="email" name="email" required placeholder="ایمیل شما" aria-label="ایمیل" dir="ltr" />
          <button type="submit" className="nr-btn">
            عضویت
          </button>
        </form>
      </div>
    </section>
  );
}

/* ───────────── Rooms ───────────── */

/** The chosen stay from the query: check-in day and nights (none when not chosen or in the past). */
function chosen(q: Record<string, string>): { checkIn?: string; nights: number } {
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(q.in ?? "") && (q.in ?? "") >= todayTehran();
  const nights = q.out && /^\d{4}-\d{2}-\d{2}$/.test(q.out) && ok ? daysBetween(q.in!, q.out) : Number(q.n) || 1;
  return { checkIn: ok ? q.in : undefined, nights: stayNights(nights) };
}

function RoomFacts({ room }: { room: Product }) {
  const area = room.specs?.find((s) => /متراژ|مساحت/.test(s.label))?.value;
  return (
    <div className="nr-facts">
      <small>
        {area && <>{area} / </>}
        {room.maxGuests ? `تا ${fa(room.maxGuests)} نفر` : null}
      </small>
      <span className="nr-facts-icons">
        {(room.amenities ?? []).slice(0, 5).map((a) => (
          <span key={a} title={a}>
            <Svg name={amenityIcon(a)} />
          </span>
        ))}
      </span>
    </div>
  );
}

function Rooms(view: View) {
  const { shop, visitor, link, editing } = view;
  const rooms = roomsOf(shop);
  const s = scheduleOf(shop);
  const { checkIn, nights } = chosen(visitor.query);
  const guests = Number(visitor.query.guests) || 0;
  const keep = { in: checkIn, n: checkIn ? nights : undefined, guests: guests || undefined };
  return (
    <>
      <PageTop view={view} title="اتاق‌ها" />
      <section className="nr-wrap nr-side-layout">
        <div className="nr-room-list">
          {checkIn && (
            <p className="nr-note">
              از {shortDay(checkIn)} برای {fa(nights)} شب{guests ? `، ${fa(guests)} نفر` : ""}:
            </p>
          )}
          {rooms.map((r) => {
            const pic = safeUrl(r.images[0]);
            const free = checkIn ? stayFree(s, takenFor({ byService: true }, visitor.taken ?? {}, r.name), checkIn, nights, unitsOf(r, s)) : 1;
            const fits = !guests || !r.maxGuests || guests <= r.maxGuests;
            return (
              <article key={r.id} className={`nr-room-row${free && fits ? "" : " nr-taken"}`}>
                <PageLink to={`/room/${r.id}${qs(keep)}`} link={link} className="nr-room-pic">
                  {pic && <img src={pic} alt={r.name} loading="lazy" />}
                  <span className="nr-from">
                    از <b>{toman(view, unitPrice(r))}</b>
                  </span>
                </PageLink>
                <div className="nr-room-body">
                  <div>
                    <h2>
                      <PageLink to={`/room/${r.id}${qs(keep)}`} link={link}>
                        {r.name}
                      </PageLink>
                    </h2>
                    <p>{(r.description ?? "").split("\n")[0]}</p>
                    {checkIn && <p className={free && fits ? "nr-ok" : "nr-no"}>{!fits ? "برای این تعداد مهمان کوچک است" : free ? "در این تاریخ‌ها خالی است" : "در این تاریخ‌ها پر است"}</p>}
                    <PageLink to={`/room/${r.id}${qs(keep)}`} link={link}>
                      <More label="جزئیات و رزرو" />
                    </PageLink>
                  </div>
                  <RoomFacts room={r} />
                </div>
              </article>
            );
          })}
          {!rooms.length && <p className="nr-note">هنوز اتاقی اضافه نشده است.</p>}
          {editing && <p className="nr-note">اتاق‌ها، قیمت‌ها و امکاناتشان را در «⚙️ مدیریت ← اتاق‌ها و خدمات اضافه» تعیین کنید.</p>}
        </div>
        <aside className="nr-aside">
          <div className="nr-cream nr-aside-box">
            <SearchForm view={view} title="بررسی اتاق خالی" />
          </div>
          <SpecialOffer view={view} />
        </aside>
      </section>
    </>
  );
}

/** A room on sale, as the small "special offer" card of the side columns. */
function SpecialOffer({ view, not }: { view: View; not?: string }) {
  const room = roomsOf(view.shop).find((r) => r.id !== not && unitPrice(r) < r.price);
  if (!room) return null;
  const pic = safeUrl(room.images[0]);
  return (
    <PageLink to={`/room/${room.id}`} link={view.link} className="nr-offer-card">
      {pic && <img src={pic} alt="" loading="lazy" />}
      <b>پیشنهاد ویژه</b>
      <span>
        <small>از</small>
        {toman(view, unitPrice(room))}
      </span>
    </PageLink>
  );
}

/* ───────────── One room ───────────── */

type Quote = { lines: { label: string; amount: number }[]; total: number; discount: number; coupon?: string; couponError?: string; extras: string[] };

/** The price of a stay: each night (higher on weekend nights), the extras, then a discount code. */
function quoteOf(shop: Shop, room: Product, checkIn: string, nights: number, guests: number, extraIds: string[], code?: string): Quote {
  const base = unitPrice(room);
  const sale = base < room.price ? base / room.price : 1;
  const days = stayDays(checkIn, nights);
  const weekend = days.filter(isWeekendNight).length;
  const weekendPrice = room.weekendPrice ? Math.round(room.weekendPrice * sale) : base;
  const lines: Quote["lines"] = [];
  if (nights - weekend > 0) lines.push({ label: `${fa(nights - weekend)} شب × ${formatToman(base)}`, amount: (nights - weekend) * base });
  if (weekend > 0) lines.push({ label: `${fa(weekend)} شب آخر هفته × ${formatToman(weekendPrice)}`, amount: weekend * weekendPrice });
  const extras: string[] = [];
  for (const x of (shop.extras ?? []).filter((x) => !x.hidden && extraIds.includes(x.id))) {
    const times = x.per === "night" ? nights : x.per === "guest" ? guests : 1;
    lines.push({ label: x.title + (times > 1 ? ` (${fa(times)} ${x.per === "night" ? "شب" : "نفر"})` : ""), amount: x.price * times });
    extras.push(x.title);
  }
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  let discount = 0;
  let couponError: string | undefined;
  const c = findCoupon(shop, code);
  if (code?.trim()) {
    if (!c) couponError = "کد تخفیف معتبر نیست.";
    else if (!couponCovers(c, room)) couponError = "این کد برای این اتاق نیست.";
    else {
      couponError = couponProblem(c, subtotal) ?? undefined;
      if (!couponError) discount = Math.min(subtotal, c.percent ? Math.min(Math.round((subtotal * c.percent) / 100), c.maxDiscount ?? Infinity) : (c.amount ?? 0));
    }
  }
  return { lines, total: subtotal - discount, discount, coupon: discount ? c?.code : undefined, couponError, extras };
}

function Room(view: View & { id: string }) {
  const { shop, visitor, link, editing, ctx } = view;
  const room = roomsOf(shop).find((r) => r.id === view.id);
  if (!room) return <Rooms {...view} />;
  const s = scheduleOf(shop);
  const q = visitor.query;
  const taken = takenFor({ byService: true }, visitor.taken ?? {}, room.name);
  const units = unitsOf(room, s);
  const { checkIn, nights } = chosen(q);
  const free = checkIn ? stayFree(s, taken, checkIn, nights, units) : 0;
  const guests = Math.min(room.maxGuests ?? 8, Math.max(1, Number(q.guests) || 2));
  const extraIds = (q.x ?? "").split(",").filter(Boolean);
  const quote = checkIn && free ? quoteOf(shop, room, checkIn, nights, guests, extraIds, q.c) : undefined;
  const extras = (shop.extras ?? []).filter((x) => !x.hidden && x.title.trim());
  const pics = room.images.map(safeUrl).filter((u): u is string => Boolean(u));
  const rules = shop.pages?.find((p) => p.slug === "rules" && !p.hidden);
  const cancel = shop.pages?.find((p) => p.slug === "cancellation" && !p.hidden);
  const map = mapEmbed(safeUrl(ctx.data.site?.mapUrl));
  const at = item("site.shop.products", room.id);
  const summary = quote
    ? [`${fa(nights)} شب از ${shortDay(checkIn!)}`, `${fa(guests)} نفر`, ...quote.extras, quote.coupon ? `کد ${quote.coupon}` : "", `جمع ${formatToman(quote.total)}`].filter(Boolean).join(" · ")
    : "";
  return (
    <>
      <section className="nr-gallery">
        {pics.slice(0, 3).map((u, k) => (
          <ZoomOpen key={k} id={`${room.id}-${k}`} className="nr-gal-pic">
            <img src={u} alt={room.name} />
          </ZoomOpen>
        ))}
        {!pics.length && <div className="nr-gal-pic" />}
      </section>
      <section className="nr-wrap nr-side-layout nr-room-page">
        <div className="nr-room-main">
          <h1 {...ed(`${at}.name`, "text", "نام اتاق")}>{room.name}</h1>
          <div className="nr-text">
            <Para text={room.description} />
          </div>
          {(room.amenities ?? []).length > 0 && (
            <div className="nr-part">
              <h2>امکانات</h2>
              <ul className="nr-amen-list">
                {(room.amenities ?? []).map((a) => (
                  <li key={a}>
                    <Svg name={amenityIcon(a)} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(room.specs ?? []).length > 0 && (
            <div className="nr-part">
              <h2>مشخصات</h2>
              <dl className="nr-specs">
                {room.maxGuests && (
                  <div>
                    <dt>ظرفیت</dt>
                    <dd>تا {fa(room.maxGuests)} نفر</dd>
                  </div>
                )}
                {(room.specs ?? []).filter((x) => x.label.trim()).map((x, k) => (
                  <div key={k}>
                    <dt>{x.label}</dt>
                    <dd>{x.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="nr-part">
            <h2>قوانین اقامت</h2>
            <ul className="nr-rules">
              <li>ساعت ورود از {faTime(s.start)} و ساعت خروج تا {faTime(s.checkOut ?? "12:00")}</li>
              {rules && <Para text={rules.text} />}
            </ul>
          </div>
          {cancel && (
            <div className="nr-part">
              <h2>{cancel.title}</h2>
              <div className="nr-text">
                <Para text={cancel.text} />
              </div>
            </div>
          )}
          <div className="nr-part" id="nr-cal">
            <h2>شب‌های خالی</h2>
            <StayCalendar view={view} room={room} schedule={s} taken={taken} units={units} />
          </div>
          <div className="nr-part">
            <h2>قیمت‌ها</h2>
            <table className="nr-prices">
              <tbody>
                <tr>
                  <td>شب‌های عادی</td>
                  <td>{toman(view, unitPrice(room))} برای هر شب</td>
                </tr>
                <tr>
                  <td>شب‌های چهارشنبه و پنجشنبه</td>
                  <td>{toman(view, room.weekendPrice ? Math.round(room.weekendPrice * (unitPrice(room) / room.price)) : unitPrice(room))} برای هر شب</td>
                </tr>
                {extras.map((x) => (
                  <tr key={x.id}>
                    <td>{x.title}</td>
                    <td>
                      {toman(view, x.price)} {x.per === "night" ? "برای هر شب" : x.per === "guest" ? "برای هر نفر" : "برای کل اقامت"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {map && (
            <div className="nr-part">
              <h2>موقعیت</h2>
              <div className="nr-map-frame">
                <iframe src={map} title="نقشه" loading="lazy" referrerPolicy="no-referrer" />
              </div>
            </div>
          )}
        </div>
        <aside className="nr-aside" id="nr-book">
          <div className="nr-cream nr-aside-box nr-reserve">
            <h3>رزرو شما</h3>
            {room.price > 0 && (
              <p className="nr-reserve-price">
                {unitPrice(room) < room.price && <s>{toman(view, room.price)}</s>} {toman(view, unitPrice(room))} <small>هر شب</small>
              </p>
            )}
            <form method="get" action={`${link(`/room/${room.id}`)}#nr-book`} className="nr-form">
              <label>
                <span>تاریخ ورود</span>
                <DaySelect name="in" value={checkIn} ahead={s.ahead} />
              </label>
              <label>
                <span>تعداد شب</span>
                <select name="n" defaultValue={String(nights)}>
                  {Array.from({ length: 14 }, (_, k) => k + 1).map((n) => (
                    <option key={n} value={n}>
                      {fa(n)} شب
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>مهمان‌ها</span>
                <select name="guests" defaultValue={String(guests)}>
                  {Array.from({ length: room.maxGuests ?? 4 }, (_, k) => k + 1).map((n) => (
                    <option key={n} value={n}>
                      {fa(n)} نفر
                    </option>
                  ))}
                </select>
              </label>
              {extras.length > 0 && (
                <fieldset className="nr-extras">
                  <legend>خدمات اضافه</legend>
                  {extras.map((x) => (
                    <label key={x.id}>
                      <input type="checkbox" name="x" value={x.id} defaultChecked={extraIds.includes(x.id)} />
                      <span>{x.title}</span>
                      <small>
                        {formatToman(x.price)}
                        {x.per === "night" ? " / شب" : x.per === "guest" ? " / نفر" : ""}
                      </small>
                    </label>
                  ))}
                </fieldset>
              )}
              <label>
                <span>کد تخفیف</span>
                <input name="c" defaultValue={q.c} dir="ltr" placeholder="اختیاری" />
              </label>
              <button type="submit" className="nr-btn">
                محاسبه‌ی قیمت
              </button>
            </form>
            {checkIn && !free && <p className="nr-no">این اتاق از {shortDay(checkIn)} برای {fa(nights)} شب خالی نیست؛ در تقویم شب‌های خالی را ببینید.</p>}
            {quote && (
              <>
                <div className="nr-quote-box">
                  <p className="nr-quote-dates">
                    ورود {shortDay(checkIn!)} · خروج {shortDay(addDay(checkIn!, nights))}
                  </p>
                  {quote.lines.map((l, k) => (
                    <p key={k}>
                      <span>{l.label}</span>
                      <span>{formatToman(l.amount)}</span>
                    </p>
                  ))}
                  {quote.discount > 0 && (
                    <p className="nr-ok">
                      <span>تخفیف ({quote.coupon})</span>
                      <span>−{formatToman(quote.discount)}</span>
                    </p>
                  )}
                  {quote.couponError && <p className="nr-no">{quote.couponError}</p>}
                  <p className="nr-total">
                    <span>جمع</span>
                    <b>{formatToman(quote.total)}</b>
                  </p>
                </div>
                <form method="post" action={link("/_form")} className="nr-form">
                  <FormMeta kind="booking" back={`/room/${room.id}`} />
                  <input type="hidden" name="service" value={room.name} />
                  <input type="hidden" name="date" value={checkIn} />
                  <input type="hidden" name="nights" value={nights} />
                  <input type="hidden" name="guests" value={guests} />
                  <input type="hidden" name="subject" value={summary.slice(0, 160)} />
                  <label>
                    <span>نام و نام خانوادگی *</span>
                    <input name="name" required autoComplete="name" defaultValue={visitor.customer?.name} />
                  </label>
                  <label>
                    <span>شماره‌ی موبایل *</span>
                    <input name="phone" required inputMode="tel" dir="ltr" autoComplete="tel" defaultValue={visitor.customer?.phone} />
                  </label>
                  <label>
                    <span>توضیحات (اختیاری)</span>
                    <textarea name="body" rows={2} placeholder="مثلاً ساعت تقریبی رسیدن" />
                  </label>
                  <button type="submit" className="nr-btn nr-btn-dark">
                    ثبت رزرو
                  </button>
                  {shop.paymentNote && <small className="nr-muted">{shop.paymentNote}</small>}
                </form>
              </>
            )}
            {!checkIn && <p className="nr-muted">روز ورود و خروج را در تقویم انتخاب کنید یا تاریخ ورود و تعداد شب را بنویسید.</p>}
            <p className="nr-mine">
              <PageLink to="/account" link={link}>
                {visitor.customer ? "رزروهای من" : "ورود یا ثبت‌نام"}
              </PageLink>
              <span>·</span>
              <PageLink to="/track" link={link}>
                پیگیری با کد
              </PageLink>
            </p>
          </div>
          <SpecialOffer view={view} not={room.id} />
          {editing && <p className="nr-note">قیمت، تعداد، امکانات و عکس‌های اتاق در «⚙️ مدیریت ← اتاق‌ها و خدمات اضافه» است؛ ساعت ورود و خروج و شب‌های بسته در «ورود، خروج و شب‌های بسته».</p>}
        </aside>
      </section>
    </>
  );
}

/**
 * Two months of the Persian calendar with the nights still free for this room. The first click picks
 * the check-in day, the second the check-out day (all nights between must be free); links, no scripts.
 */
function StayCalendar({ view, room, schedule: s, taken, units }: { view: View; room: Product; schedule: Schedule; taken: Record<string, number>; units: number }) {
  const q = view.visitor.query;
  const today = todayTehran();
  const { checkIn, nights } = chosen(q);
  const out = checkIn ? addDay(checkIn, nights) : undefined;
  const picking = checkIn && !q.out && !q.n; // check-in picked on the calendar, check-out not yet
  const m = Math.max(0, Math.min(3, Number(q.m) || 0));
  let first = monthOf(today).first;
  for (let k = 0; k < m; k++) first = addDay(monthOf(first).days.slice(-1)[0]!, 1);
  const second = addDay(monthOf(first).days.slice(-1)[0]!, 1);
  const keep = { guests: q.guests, x: q.x, c: q.c };
  const href = (extra: Record<string, string | number | undefined>) => `${view.link(`/room/${room.id}`)}${qs({ ...keep, ...extra })}#nr-cal`;
  const freeNight = (day: string) => nightOpen(s, day) && stayFree(s, taken, day, 1, units) > 0;
  const month = (start: string) => {
    const { days } = monthOf(start);
    const lead = (new Date(`${days[0]}T12:00:00Z`).getUTCDay() + 1) % 7; // weeks start on Saturday
    return (
      <div className="nr-cal-month">
        <b className="nr-cal-title">{faDay(days[0]!, { month: "long", year: "numeric" })}</b>
        <div className="nr-cal-grid">
          {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((d) => (
            <i key={d}>{d}</i>
          ))}
          {Array.from({ length: lead }, (_, k) => (
            <span key={`e${k}`} />
          ))}
          {days.map((day) => {
            const d = jalali(day).d;
            const isFree = freeNight(day);
            const inRange = checkIn && out && day >= checkIn && day < out;
            const cls = `${day < today || !nightOpen(s, day) ? "off" : isFree ? "free" : "full"}${inRange ? " sel" : ""}${day === checkIn ? " in" : ""}${day === out ? " out" : ""}`;
            // Second click: a later day ends the stay when every night before it is free.
            if (picking && day > checkIn! && stayFree(s, taken, checkIn!, daysBetween(checkIn!, day), units) > 0)
              return (
                <a key={day} href={href({ in: checkIn, out: day })} className={`${cls} can-out`} rel="nofollow">
                  {fa(d)}
                </a>
              );
            if (isFree)
              return (
                <a key={day} href={href({ in: day })} className={cls} rel="nofollow" title="روز ورود">
                  {fa(d)}
                </a>
              );
            return (
              <span key={day} className={cls}>
                {fa(d)}
              </span>
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <div className="nr-cal">
      <div className="nr-cal-nav">
        {m > 0 ? (
          <a href={href({ in: q.in, out: q.out, n: q.n, m: m - 1 })} rel="nofollow" aria-label="ماه قبل">
            <Svg name="prev" />
          </a>
        ) : (
          <span />
        )}
        {m < 3 ? (
          <a href={href({ in: q.in, out: q.out, n: q.n, m: m + 1 })} rel="nofollow" aria-label="ماه بعد">
            <Svg name="next" />
          </a>
        ) : (
          <span />
        )}
      </div>
      <div className="nr-cal-months">
        {month(first)}
        {month(second)}
      </div>
      <p className="nr-cal-key">
        <span className="k-free">خالی</span>
        <span className="k-full">پر</span>
        <span className="k-sel">انتخاب شما</span>
        {picking && <b>حالا روز خروج را انتخاب کنید.</b>}
      </p>
    </div>
  );
}

/* ───────────── Offers ───────────── */

function Offers(view: View) {
  const { shop, editing, link } = view;
  const now = Date.now();
  const codes = (shop.coupons ?? []).filter((c) => c.active !== false && (!c.endsAt || Date.parse(c.endsAt) > now)).slice(0, 3);
  const strip = roomsOf(shop).flatMap((r) => r.images.slice(0, 1)).map(safeUrl).filter(Boolean).slice(0, 4);
  return (
    <>
      <PageTop view={view} title="پیشنهادها و تخفیف‌ها" image={shop.discoverImage} path="site.shop.discoverImage" />
      <section className="nr-wrap nr-sec nr-center">
        <Opt value={shop.promoTitle} editing={editing} edit={ed("site.shop.promoTitle", "text", "تیتر")}>
          <h2 className="nr-h" {...ed("site.shop.promoTitle", "text", "تیتر")}>
            {shop.promoTitle}
          </h2>
        </Opt>
        <Opt value={shop.promoText} editing={editing} edit={ed("site.shop.promoText", "multiline", "متن")}>
          <p className="nr-lead" {...ed("site.shop.promoText", "multiline", "متن")}>
            {shop.promoText}
          </p>
        </Opt>
        <div className="nr-deals">
          {codes.map((c, k) => (
            <article key={c.id} className={`nr-deal${k === 1 ? " nr-deal-mid" : ""}`}>
              <h3>{k === 0 ? "پیشنهاد زمستانی" : k === 1 ? "تعطیلات" : "مناسبت‌های ویژه"}</h3>
              <b className="nr-deal-pct">{c.percent ? `${fa(c.percent)}٪` : formatToman(c.amount ?? 0)}</b>
              <ul>
                <li>
                  کد: <bdi dir="ltr">{c.code}</bdi>
                </li>
                {c.minTotal ? <li>برای رزرو از {formatToman(c.minTotal)}</li> : <li>برای همه‌ی رزروها</li>}
                {c.maxDiscount ? <li>تا {formatToman(c.maxDiscount)} تخفیف</li> : null}
                {c.endsAt ? <li>تا {faDate(c.endsAt)}</li> : <li>بدون تاریخ پایان</li>}
                <li>کد را در صفحه‌ی اتاق بنویسید</li>
              </ul>
              <PageLink to={`/rooms${qs({ c: c.code })}`} link={link} className="nr-btn">
                رزرو با این کد
              </PageLink>
            </article>
          ))}
          {!codes.length && <p className="nr-note">کد تخفیف فعالی نیست؛ کدها را در «⚙️ مدیریت ← کدهای تخفیف» بسازید.</p>}
        </div>
      </section>
      {strip.length > 0 && (
        <section className="nr-frame nr-strip">
          {strip.map((u, k) => (
            <img key={k} src={u} alt="" loading="lazy" />
          ))}
        </section>
      )}
    </>
  );
}

/* ───────────── About ───────────── */

function About(view: View) {
  const { ctx, shop, editing } = view;
  const site = ctx.data.site;
  const features = shop.stats ?? [];
  const near = (site?.gallery ?? []).filter((g) => safeUrl(g.image)).slice(0, 3);
  const reviews = (site?.testimonials ?? []).filter((t) => !t.hidden);
  return (
    <>
      <PageTop view={view} title="درباره‌ی ما" image={site?.heroImage} path="site.heroImage" />
      <section className="nr-wrap nr-sec nr-center">
        <Opt value={site?.styleTitle} editing={editing} edit={ed("site.styleTitle", "text", "تیتر")}>
          <h2 className="nr-h" {...ed("site.styleTitle", "text", "تیتر")}>
            {site?.styleTitle}
          </h2>
        </Opt>
        <Opt value={site?.styleText} editing={editing} edit={ed("site.styleText", "multiline", "متن")}>
          <div className="nr-lead" {...ed("site.styleText", "multiline", "متن")}>
            <Para text={site?.styleText} />
          </div>
        </Opt>
      </section>
      <section className="nr-wrap nr-about-pic" {...ed("site.aboutImage", "image", "عکس")}>
        {safeUrl(site?.aboutImage) && <img src={safeUrl(site?.aboutImage)} alt="" loading="lazy" />}
      </section>
      {features.length > 0 && (
        <section className="nr-soft">
          <div className="nr-wrap nr-features">
            {features.map((f, k) => {
              const a = item("site.shop.stats", f.id);
              return (
                <div key={f.id}>
                  <Svg name={FEATURE_ICONS[k % FEATURE_ICONS.length]!} className="nr-feat-ico" />
                  <h3 {...ed(`${a}.label`, "text", "عنوان")}>{f.label}</h3>
                  <Opt value={f.text} editing={editing} edit={ed(`${a}.text`, "text", "توضیح")}>
                    <p {...ed(`${a}.text`, "text", "توضیح")}>{f.text}</p>
                  </Opt>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {near.length > 0 && (
        <section className="nr-wrap nr-sec nr-center">
          <h2 className="nr-h">جاهای دیدنی اطراف</h2>
          <div className="nr-near">
            {near.map((g) => {
              const a = item("site.gallery", g.id);
              return (
                <article key={g.id}>
                  <ZoomOpen id={g.id} className="nr-near-pic">
                    <img src={safeUrl(g.image)} alt={g.title} loading="lazy" />
                  </ZoomOpen>
                  <div className="nr-near-box">
                    <h3 {...ed(`${a}.title`, "text", "عنوان")}>{g.title}</h3>
                    <Opt value={g.description} editing={editing} edit={ed(`${a}.description`, "multiline", "توضیح")}>
                      <p {...ed(`${a}.description`, "multiline", "توضیح")}>{g.description}</p>
                    </Opt>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
      {reviews.length > 0 && (
        <section className="nr-soft nr-sec nr-center nr-said">
          <Svg name="quote" className="nr-quote" />
          {reviews.slice(0, 3).map((r) => {
            const a = item("site.testimonials", r.id);
            return (
              <blockquote key={r.id}>
                <h2 {...ed(`${a}.role`, "text", "عنوان کوتاه")}>«{r.role || "جای جادویی"}»</h2>
                <p {...ed(`${a}.text`, "multiline", "متن")}>{r.text}</p>
                <cite {...ed(`${a}.name`, "text", "نام")}>{r.name}</cite>
              </blockquote>
            );
          })}
        </section>
      )}
    </>
  );
}

/* ───────────── Blog ───────────── */

function BlogSide({ view }: { view: View }) {
  const { shop, link, ctx } = view;
  const posts = livePosts(shop);
  const cats = [...new Set(posts.map((p) => p.category).filter(Boolean))] as string[];
  return (
    <aside className="nr-aside nr-blog-side">
      <div className="nr-side-part">
        <h3>پرخواننده‌ها</h3>
        {posts.slice(0, 3).map((p) => (
          <PageLink key={p.id} to={`/blog/${p.id}`} link={link} className="nr-mini">
            <span>{safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}</span>
            <b>{p.title}</b>
            {p.date && <small>{faDate(p.date)}</small>}
          </PageLink>
        ))}
      </div>
      <div className="nr-side-part">
        <h3>درباره‌ی ما</h3>
        <p>{ctx.data.basics.summary}</p>
      </div>
      {cats.length > 0 && (
        <div className="nr-side-part">
          <h3>دسته‌ها</h3>
          {cats.map((c) => (
            <span key={c} className="nr-cat">
              {c}
            </span>
          ))}
        </div>
      )}
      <SpecialOffer view={view} />
    </aside>
  );
}

function Blog(view: View) {
  const { shop, link, ctx } = view;
  const posts = livePosts(shop);
  return (
    <>
      <section className="nr-blog-top">
        <span aria-hidden="true">{ctx.data.basics.jobTitle || ctx.data.basics.fullName}</span>
        <h1>بلاگ</h1>
      </section>
      <section className="nr-wrap nr-side-layout">
        <div className="nr-posts">
          {posts.map((p) => {
            const at = item("site.shop.posts", p.id);
            return (
              <article key={p.id} className="nr-post-card">
                {safeUrl(p.image) && (
                  <PageLink to={`/blog/${p.id}`} link={link} className="nr-post-pic">
                    <img src={safeUrl(p.image)} alt="" loading="lazy" />
                  </PageLink>
                )}
                <small className="nr-post-meta">
                  {p.date && faDate(p.date)}
                  {p.category && ` · ${p.category}`}
                </small>
                <h2>
                  <PageLink to={`/blog/${p.id}`} link={link}>
                    <span {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</span>
                  </PageLink>
                </h2>
                <p>{p.excerpt || p.text.slice(0, 220)}</p>
                <PageLink to={`/blog/${p.id}`} link={link}>
                  <More label="ادامه" />
                </PageLink>
              </article>
            );
          })}
          {!posts.length && <p className="nr-note">هنوز مطلبی نوشته نشده است.</p>}
        </div>
        <BlogSide view={view} />
      </section>
    </>
  );
}

function Post(view: View & { id: string }) {
  const { shop, link } = view;
  const posts = livePosts(shop);
  const p = posts.find((x) => x.id === view.id);
  if (!p) return <Blog {...view} />;
  const at = item("site.shop.posts", p.id);
  const related = posts.filter((x) => x.id !== p.id).slice(0, 2);
  return (
    <>
      <section className="nr-blog-top">
        <span aria-hidden="true">{view.ctx.data.basics.fullName}</span>
        <h1 {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</h1>
      </section>
      <section className="nr-wrap nr-side-layout">
        <article className="nr-article">
          {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" className="nr-article-pic" {...ed(`${at}.image`, "image", "عکس")} />}
          <small className="nr-post-meta">
            {p.date && faDate(p.date)}
            {p.author && ` · ${p.author}`}
            {p.category && ` · ${p.category}`}
          </small>
          <div className="nr-text nr-article-text" {...ed(`${at}.text`, "multiline", "متن")}>
            <Para text={p.text} />
          </div>
          {related.length > 0 && (
            <div className="nr-related">
              <h2>مطالب مرتبط</h2>
              <div>
                {related.map((r) => (
                  <PageLink key={r.id} to={`/blog/${r.id}`} link={link} className="nr-rel">
                    {safeUrl(r.image) && <img src={safeUrl(r.image)} alt="" loading="lazy" />}
                    <b>{r.title}</b>
                  </PageLink>
                ))}
              </div>
            </div>
          )}
        </article>
        <BlogSide view={view} />
      </section>
    </>
  );
}

/* ───────────── Contact ───────────── */

function Contact(view: View) {
  const { ctx, shop, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const map = mapEmbed(safeUrl(site?.mapUrl));
  return (
    <>
      <PageTop view={view} title="تماس با ما" image={shop.trendImage} path="site.shop.trendImage" />
      <section className="nr-wrap nr-sec nr-contact">
        <div className="nr-contact-info">
          <Opt value={site?.contactTitle} editing={editing} edit={ed("site.contactTitle", "text", "تیتر")}>
            <h2 className="nr-h" {...ed("site.contactTitle", "text", "تیتر")}>
              {site?.contactTitle}
            </h2>
          </Opt>
          <Opt value={site?.contactText} editing={editing} edit={ed("site.contactText", "multiline", "متن")}>
            <p className="nr-muted" {...ed("site.contactText", "multiline", "متن")}>
              {site?.contactText}
            </p>
          </Opt>
          {b.email && (
            <p className="nr-contact-line">
              <Svg name="mail" />
              <a href={`mailto:${b.email}`} {...ed("basics.email", "text", "ایمیل")}>
                <bdi dir="ltr">{b.email}</bdi>
              </a>
            </p>
          )}
          {b.phone && (
            <p className="nr-contact-line">
              <Svg name="phone" />
              <a href={telHref(b.phone)} {...ed("basics.phone", "text", "تلفن")}>
                <bdi dir="ltr">{faDigits(b.phone)}</bdi>
              </a>
            </p>
          )}
          <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <p className="nr-contact-line">
              <Svg name="pin" />
              <span {...ed("site.address", "text", "نشانی")}>{site?.address}</span>
            </p>
          </Opt>
          <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "text", "ساعت پاسخ‌گویی")}>
            <p className="nr-contact-line">
              <Svg name="clock" />
              <span {...ed("site.contactNote", "text", "ساعت پاسخ‌گویی")}>{site?.contactNote}</span>
            </p>
          </Opt>
          {map && (
            <div className="nr-map-frame">
              <iframe src={map} title="نقشه" loading="lazy" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
        <form method="post" action={view.link("/_form")} className="nr-form nr-contact-form">
          <FormMeta kind="contact" back="/contact" />
          <h2 className="nr-h">چطور کمکتان کنیم؟</h2>
          <p className="nr-muted">پیامتان را بنویسید؛ در ساعت کاری همان روز پاسخ می‌دهیم.</p>
          <label>
            <span>نام</span>
            <input name="name" autoComplete="name" />
          </label>
          <label>
            <span>ایمیل یا موبایل</span>
            <input name="bcc" dir="auto" />
          </label>
          <label>
            <span>پیام شما *</span>
            <textarea name="body" rows={5} required />
          </label>
          <button type="submit" className="nr-btn">
            ارسال پیام
          </button>
        </form>
      </section>
      <Newsletter view={view} />
    </>
  );
}

/* ───────────── The visitor's bookings ───────────── */

function Account(view: View) {
  return (
    <>
      <PageTop view={view} title={view.visitor.customer ? "رزروهای من" : "ورود یا ثبت‌نام"} />
      <section className="nr-wrap nr-sec nr-visitor">
        <AccountPage link={view.link} page={view.page} visitor={view.visitor} bookings="only" />
      </section>
    </>
  );
}

function Track(view: View) {
  return (
    <>
      <PageTop view={view} title="پیگیری رزرو" />
      <section className="nr-wrap nr-sec nr-visitor">
        <TrackBooking link={view.link} visitor={view.visitor} />
      </section>
    </>
  );
}

/* ───────────── Example content (in Persian) ───────────── */

export function narenjSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`nr-${n}`);
  const soon = (days: number) => new Date(Date.now() + days * 86400000).toISOString();
  const common = ["وای‌فای", "حوله و ملحفه", "سشوار"];
  const room = (id: string, name: string, cat: string, price: number, guests: number, area: string, bed: string, pics: string[], amen: string[], text: string, extra: Partial<Product> = {}): Product => ({
    id,
    name,
    categoryId: cat,
    price,
    weekendPrice: Math.round((price * 1.2) / 10000) * 10000,
    images: pics.map(img),
    stock: 1,
    maxGuests: guests,
    amenities: [...common, ...amen],
    specs: [
      { label: "متراژ", value: area },
      { label: "تخت", value: bed },
    ],
    description: text,
    ...extra,
  });
  const products: Product[] = [
    room("loft", "لافت هنری", "c1", 1900000, 2, "۳۵ متر", "یک تخت دونفره", ["room-loft"], ["میز کار", "صبحانه"], "لافتی آرام با میز کار رو به نور، برای کسانی که سفر را با کمی کار و خیلی آرامش می‌خواهند.\nدیوارها پر از کارهای هنرمندان شیرازی است و پنجره‌ها رو به کوچه‌ی نارنج‌ها باز می‌شوند."),
    room("mancini", "سوئیت آفتاب", "c2", 2600000, 3, "۵۵ متر", "یک دونفره و یک کاناپه‌تخت", ["room-mancini", "central-top-1"], ["آشپزخانه", "تلویزیون", "کولر"], "سوئیتی روشن با پله‌ی چوبی، نشیمن جادار و آشپزخانه‌ی کوچک؛ مناسب سفرهای چندروزه.", { salePrice: 2190000, saleEndsAt: soon(6) }),
    room("modern", "اتاق مدرن", "c1", 1700000, 2, "۳۰ متر", "یک تخت دونفره", ["room-modern", "modern-top-1", "modern-top-2"], ["کولر", "تلویزیون"], "اتاقی ساده و مدرن با رنگ‌های گرم و تخت راحت؛ همه‌چیز برای یک خواب خوب.", { stock: 2 }),
    room("dazzling", "خانه‌ی روشن", "c3", 3400000, 4, "۸۰ متر", "دو تخت دونفره", ["room-dazzling", "emma-top"], ["آشپزخانه", "یخچال", "پارکینگ", "بالکن"], "آپارتمانی کامل با دو اتاق خواب و نشیمن پر از نور؛ برای خانواده‌ها و دوستان."),
    room("orange", "سوئیت نارنجی", "c2", 2400000, 2, "۴۵ متر", "یک تخت دونفره‌ی بزرگ", ["room-orange"], ["گرمایش", "صبحانه", "حمام اختصاصی"], "سوئیتی دنج با پارچه‌های نارنجی و چوب گردو، با وان و صبحانه‌ی محلی در اتاق."),
    room("central", "آپارتمان مرکزی", "c3", 2900000, 4, "۷۰ متر", "یک دونفره و دو یک‌نفره", ["room-central", "central-top-1", "central-top-2"], ["آشپزخانه", "تلویزیون", "پارکینگ"], "در قلب شهر و چند قدمی بازار؛ آپارتمانی با شومینه و همه‌ی امکانات یک خانه.", { stock: 2 }),
    room("egizo", "اتاق باغ", "c1", 1500000, 2, "۲۸ متر", "یک تخت دونفره", ["room-egizo"], ["بالکن", "صبحانه"], "اتاقی کوچک و دلباز رو به حیاط و حوض؛ صبح‌ها صدای پرنده‌ها بیدارتان می‌کند."),
    room("emma", "اتاق‌های مهتاب", "c2", 2200000, 3, "۵۰ متر", "یک دونفره و یک یک‌نفره", ["room-emma", "emma-top"], ["کولر", "میز کار"], "دو اتاق تو در تو با پرده‌های نازک و نور ملایم؛ برای سفرهای دوستانه."),
    room("laura", "ویلای لاله", "c3", 4200000, 6, "۱۲۰ متر", "سه تخت دونفره", ["room-laura"], ["آشپزخانه", "یخچال", "پارکینگ", "مناسب حیوانات"], "ویلای دوطبقه با حیاط سرسبز و آشپزخانه‌ی کامل؛ برای خانواده‌های بزرگ.", { salePrice: 3690000 }),
    room("maisonette", "مزونت چوبی", "c2", 3100000, 2, "۶۰ متر", "یک تخت دونفره با پشه‌بند", ["room-maisonette", "maisonette-top-1", "maisonette-top-2"], ["حمام اختصاصی", "بالکن", "صبحانه"], "سوئیتی دوبلکس با سقف چوبی و حمام سنگی؛ رمانتیک‌ترین اتاق نارنج."),
  ];
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "نارنج",
      // A placeholder logo, for now (to be replaced by the designer's).
      avatarUrl: sampleImage("nr-logo-temp", "png"),
      jobTitle: "اقامتگاه بوتیک",
      email: "info@example.com",
      phone: "071 1234 5678",
      location: "شیراز",
      summary: "به نارنج خوش آمدید؛ جایی که آرامش از همه‌چیز مهم‌تر است. اتاق‌های دنج، رزرو آسان و میزبانی گرم در قلب شیراز.",
      links: [
        { id: "nl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "nl2", type: "telegram", url: "https://t.me/example" },
        { id: "nl3", type: "whatsapp", url: "https://wa.me/example" },
        { id: "nl4", type: "eitaa", url: "https://eitaa.com/example" },
        { id: "nl5", type: "rubika", url: "https://rubika.ir/example" },
      ],
    },
    experience: [],
    education: [],
    projects: [],
    certificates: [],
    site: {
      ...base.site,
      address: "شیراز، محله‌ی سنگ سیاه، کوچه‌ی نارنج، پلاک ۱۲",
      contactNote: "هر روز، ۸ صبح تا ۱۱ شب",
      contactTitle: "با ما در تماس باشید",
      contactText: "برای رزروهای گروهی، مناسبت‌ها یا هر سؤالی پیام بگذارید یا تماس بگیرید.",
      mapUrl: "https://www.openstreetmap.org/?mlat=29.61040&mlon=52.54390#map=16/29.61040/52.54390",
      aboutTitle: "درباره‌ی ما",
      aboutText: "نارنج خانه‌ای قدیمی در محله‌ای قدیمی است که با عشق بازسازی شده تا مهمان‌هایش احساس کنند در خانه‌ی خودشان‌اند.\n\nهر اتاق داستان خودش را دارد و صبحانه‌ی محلی‌مان را در حیاط و کنار حوض سرو می‌کنیم.",
      aboutImage: img("about-room"),
      heroImage: img("about-hero"),
      accentImage: img("map"),
      styleTitle: "از سال ۱۳۹۴",
      styleText: "نارنج از یک خانه‌ی قدیمی و یک رؤیا شروع شد: جایی که مسافر شیراز را از نزدیک ببیند، بوی بهارنارنج را حس کند و مثل یک دوست از او پذیرایی شود.\n\nامروز ده اتاق و سوئیت داریم، هر کدام با سلیقه‌ای متفاوت، و هنوز هم میزبانی را خودمان انجام می‌دهیم.",
      gallery: [
        { id: "ng1", title: "گشت در بافت قدیم", image: img("post1"), description: "بازار وکیل، مسجد نصیرالملک و کوچه‌های قدیمی، همه در فاصله‌ی پیاده‌روی." },
        { id: "ng2", title: "خوراک خوب", image: img("menu"), description: "بهترین رستوران‌ها و کافه‌های اطراف را با کمال میل معرفی می‌کنیم." },
        { id: "ng3", title: "کشف شهر", image: img("street"), description: "حافظیه، باغ ارم و دروازه‌ی قرآن را با دوچرخه یا پیاده ببینید." },
      ],
      testimonials: [
        { id: "nt1", name: "مریم سعادتی", role: "یک انتخاب عالی", text: "اتاق تمیز و دنج بود، صبحانه‌ی حیاط فوق‌العاده و میزبان‌ها مهربان و همیشه در دسترس. حتماً دوباره می‌آییم." },
        { id: "nt2", name: "آرش کامرانی", role: "جای جادویی", text: "نزدیک بازار و حافظیه و در عین حال ساکت. بوی بهارنارنج صبح‌ها را فراموش نمی‌کنم." },
        { id: "nt3", name: "سارا و پویا", role: "سفری به‌یادماندنی", text: "برای ماه‌عسل مزونت چوبی را گرفتیم؛ همه‌چیز از قبل آماده و بی‌نقص بود." },
      ],
      shop: {
        categories: [
          { id: "c1", name: "اتاق", image: "" },
          { id: "c2", name: "سوئیت", image: "" },
          { id: "c3", name: "آپارتمان و ویلا", image: "" },
        ],
        products,
        slides: [
          { id: "ns1", title: "اقامتی که به یاد می‌ماند", text: "این فقط یک سفر نیست؛ تجربه‌ای است که دوست دارید بارها به آن برگردید.", image: img("hero") },
          { id: "ns2", title: "خانه‌ای در قلب شیراز", text: "چند قدم تا بازار و حافظیه، با آرامش یک خانه‌ی قدیمی.", image: img("emma-top") },
          { id: "ns3", title: "صبح بخیر با بوی بهارنارنج", text: "صبحانه‌ی محلی در حیاط، کنار حوض و درخت‌های نارنج.", image: img("maisonette-top-1") },
        ],
        banners: [
          { id: "nb1", title: "صبحانه", image: img("breakfast") },
          { id: "nb2", title: "منوی ما", image: img("menu") },
          { id: "nb3", title: "ورود و خروج", image: img("checkin") },
          { id: "nb4", title: "میزبان‌های شما", image: img("hosts") },
        ],
        perks: [
          { id: "np1", title: "تخت بزرگ" },
          { id: "np2", title: "وای‌فای سریع" },
          { id: "np3", title: "گاوصندوق" },
          { id: "np4", title: "حمام" },
          { id: "np5", title: "باشگاه" },
          { id: "np6", title: "نوشیدنی" },
        ],
        lookImage: img("amenities"),
        newImage: img("street"),
        newsletterTitle: "عضویت در خبرنامه‌ی هفتگی",
        discoverImage: img("offers-hero"),
        trendImage: img("contact-hero"),
        promoTitle: "یک تعطیلات بی‌نقص",
        promoText: "با کدهای تخفیف این صفحه، اقامت در نارنج را ارزان‌تر کنید؛ کد را در صفحه‌ی اتاق و کنار تاریخ‌ها بنویسید.",
        stats: [
          { id: "nf1", value: "", label: "امتیاز بالا", text: "مهمان‌هایمان به ما بالاترین امتیاز را داده‌اند." },
          { id: "nf2", value: "", label: "ساعت‌های آرام", text: "از ۱۱ شب به بعد، خانه آرام و بی‌صداست." },
          { id: "nf3", value: "", label: "بهترین موقعیت", text: "در قلب بافت تاریخی و نزدیک همه‌چیز." },
          { id: "nf4", value: "", label: "لغو رایگان", text: "تا سه روز پیش از ورود، بدون هزینه." },
          { id: "nf5", value: "", label: "پرداخت آسان", text: "کارت‌به‌کارت یا پرداخت در محل." },
          { id: "nf6", value: "", label: "پیشنهادهای ویژه", text: "تخفیف‌های فصلی و مناسبتی." },
        ],
        extras: [
          { id: "ne1", title: "صبحانه‌ی محلی", price: 180000, per: "guest" },
          { id: "ne2", title: "ترانسفر فرودگاه", price: 450000, per: "stay" },
          { id: "ne3", title: "دوچرخه", price: 150000, per: "night" },
          { id: "ne4", title: "تزیین اتاق (تولد، سالگرد)", price: 600000, per: "stay" },
        ],
        coupons: [
          { id: "nc1", code: "ZEMESTAN25", percent: 25, maxDiscount: 2000000, endsAt: soon(60), active: true },
          { id: "nc2", code: "NOROOZ10", percent: 10, minTotal: 3000000, active: true },
          { id: "nc3", code: "SPECIAL5", percent: 5, active: true },
        ],
        pages: [
          { id: "npg1", slug: "rules", title: "قوانین اقامت", text: "استعمال دخانیات در اتاق‌ها ممنوع است.\nبرگزاری مهمانی در اتاق‌ها مجاز نیست.\nهمراه داشتن کارت شناسایی برای همه‌ی مهمان‌ها لازم است." },
          { id: "npg2", slug: "cancellation", title: "شرایط لغو", text: "لغو تا سه روز پیش از ورود رایگان است. پس از آن، هزینه‌ی یک شب کسر می‌شود.\nرزروهای نوروز و تعطیلات بازگشت‌پذیر نیستند." },
        ],
        posts: [
          { id: "nw1", title: "پنج رستوران خوب در کوچه‌های قدیمی شیراز", image: img("post1"), date: "2026-10-20", author: "تیم نارنج", category: "خوراک", excerpt: "از کباب‌های اصیل تا کافه‌های دنج؛ جاهایی که مهمان‌هایمان دوستشان دارند.", text: "شیراز شهر خوراک‌های خوب است.\n\nدر این مطلب پنج رستوران و کافه را معرفی می‌کنیم که پیاده از نارنج به آن‌ها می‌رسید و مهمان‌هایمان بارها از آن‌ها تعریف کرده‌اند." },
          { id: "nw2", title: "بهترین اقامتگاه‌های سنتی؛ از خانه‌ای قدیمی تا هتل بوتیک", image: img("post2"), date: "2026-10-02", author: "تیم نارنج", category: "سفر", text: "اقامت در خانه‌های قدیمی تجربه‌ای متفاوت از هتل‌هاست.\n\nچند نکته برای انتخاب بهترین اقامتگاه سنتی را این‌جا نوشته‌ایم." },
          { id: "nw3", title: "سفر کاری؟ مثل خانه احساس راحتی کنید", image: img("room-egizo"), date: "2026-09-15", author: "تیم نارنج", category: "سفر", text: "میز کار، اینترنت سریع و صبحانه‌ی زود؛ هر چه برای یک سفر کاری راحت لازم دارید." },
          { id: "nw4", title: "بهار در شیراز: کجا برویم؟", image: img("about-room"), date: "2026-09-01", author: "تیم نارنج", category: "راهنما", text: "باغ ارم، حافظیه و باغ دلگشا در بهار دیدنی‌ترین‌اند. برنامه‌ی سه‌روزه‌ی پیشنهادی ما را بخوانید." },
        ],
        schedule: { ...stayDefaults(), closed: [] },
        paymentNote: "پرداخت فعلاً کارت‌به‌کارت یا در محل است؛ پس از ثبت رزرو برای تأیید با شما تماس می‌گیریم.",
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
@font-face { font-family: "Narenj Markazi"; src: url("/_assets/fonts/kafe-markazi.woff") format("woff"); font-display: swap; }
.nr { --nr-accent: var(--color-primary); --nr-ink: var(--color-text); --nr-muted: var(--color-muted); --nr-cream: #F5F1EA; --nr-soft: #FAF8F4; --nr-line: #E9E3DA;
  --nr-head: "Narenj Markazi", var(--font-heading); --nr-frame-pad: clamp(10px, 2.2cqi, 42px); --nr-wrap: min(1180px, 100% - 2 * clamp(16px, 5cqi, 80px));
  background: var(--color-bg); color: var(--nr-ink); font-size: 15px; font-weight: 300; line-height: 1.9; }
.nr h1, .nr h2, .nr h3 { font-family: var(--nr-head); font-weight: 400; line-height: 1.5; color: var(--nr-ink); }
.nr a { color: inherit; text-decoration: none; }
.nr .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.nr img { display: block; max-width: 100%; }
:where(.nr) svg[viewBox="0 0 48 48"] { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.nr-wrap { width: var(--nr-wrap); margin-inline: auto; }
.nr-frame { padding-inline: var(--nr-frame-pad); }
.nr-sec { padding-block: clamp(46px, 7cqi, 96px); }
.nr-center { text-align: center; }
.nr-h { font-size: clamp(1.8em, 3.2cqi, 2.6em); }
.nr-lead { width: min(640px, 100%); margin: 10px auto 0; color: var(--nr-muted); }
.nr-lead p + p { margin-top: 10px; }
.nr-muted { color: var(--nr-muted); font-size: .9em; }
.nr-note { padding: 12px 16px; border-inline-start: 3px solid var(--nr-accent); background: var(--nr-soft); font-size: .9em; }
.nr-cream { background: var(--nr-cream); }
.nr-soft { background: var(--nr-soft); }
.nr-ok { color: #4F7A52; }
.nr-no { color: #A8483B; }
.nr-more { display: inline-flex; align-items: center; gap: 6px; margin-top: 14px; font-size: .78em; font-weight: 600; letter-spacing: 0; color: var(--nr-ink); transition: color .25s; }
.nr-more:hover, a:hover > .nr-more { color: var(--nr-accent); }
.nr .nr-plus { width: 12px; height: 12px; stroke-width: 3; transition: transform .3s; }
a:hover .nr-plus, .nr-more:hover .nr-plus { transform: rotate(90deg); }
.nr-btn { display: inline-flex; align-items: center; justify-content: center; padding: 11px 28px; border: 1px solid var(--nr-ink); background: transparent; color: var(--nr-ink); font: inherit; font-size: .82em; font-weight: 600; cursor: pointer; transition: background .3s, color .3s, border-color .3s; }
.nr-btn:hover { border-color: var(--nr-accent); background: var(--nr-accent); color: #fff; }
.nr-btn-dark { border-color: var(--nr-accent); background: var(--nr-accent); color: #fff; }
.nr-btn-dark:hover { border-color: var(--nr-ink); background: var(--nr-ink); }

/* Header: over the slider on the home page, white on the other pages */
.nr-head { position: relative; z-index: 20; background: var(--color-bg); }
.nr-head-in { display: flex; align-items: center; gap: 28px; padding: 18px clamp(16px, 2.6cqi, 52px); }
.nr-home .nr-head { position: absolute; inset: var(--nr-frame-pad) var(--nr-frame-pad) auto; background: none; }
.nr-home .nr-head-in { color: #fff; padding-inline: clamp(16px, 2.6cqi, 52px); }
.nr-logo b { font-family: var(--nr-head); font-size: 1.9em; font-weight: 400; line-height: 1; }
.nr-logo img { display: block; width: auto; height: clamp(30px, 3cqi, 42px); }
.nr-home .nr-head .nr-logo img { filter: invert(1); }
.nr-nav { display: flex; gap: clamp(16px, 2.4cqi, 38px); margin-inline-start: auto; font-size: .82em; font-weight: 600; }
.nr-nav a { padding: 6px 0; transition: color .25s; }
.nr-nav a:hover, .nr-nav a[aria-current="page"] { color: var(--nr-accent); }
.nr-user { display: inline-flex; transition: color .25s; }
.nr-user:hover { color: var(--nr-accent); }
.nr-menu { display: none; }
.nr-menu > summary { display: grid; gap: 5px; width: 26px; padding: 8px 0; cursor: pointer; list-style: none; }
.nr-menu > summary::-webkit-details-marker { display: none; }
.nr-menu > summary i { height: 1.5px; background: currentColor; transition: transform .3s, opacity .3s; }
.nr-menu[open] > summary i:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
.nr-menu[open] > summary i:nth-child(2) { opacity: 0; }
.nr-menu[open] > summary i:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }
.nr-drawer { position: absolute; top: 100%; inset-inline: 0; z-index: 30; display: grid; padding: 8px 0; background: var(--color-bg); color: var(--nr-ink); box-shadow: 0 14px 24px -18px rgb(0 0 0 / .4); }
.nr-drawer a { padding: 10px clamp(16px, 6cqi, 40px); font-size: .9em; font-weight: 600; }
.nr-drawer a[aria-current="page"] { color: var(--nr-accent); }

/* Home slider */
.nr-hero { position: relative; margin: var(--nr-frame-pad) var(--nr-frame-pad) 0; height: clamp(420px, 46cqi, 820px); overflow: hidden; background: #2b2723; color: #fff; }
.nr-radio { position: absolute; opacity: 0; pointer-events: none; }
.nr-slides, .nr-slide { position: absolute; inset: 0; }
.nr-slide { opacity: 0; transition: opacity .9s ease; }
.nr-n1 .nr-slide { opacity: 1; }
.nr-slide-pic, .nr-slide-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.nr-slide-pic::after { content: ""; position: absolute; inset: 0; background: linear-gradient(0deg, rgb(0 0 0 / .45), rgb(0 0 0 / .05) 55%, rgb(0 0 0 / .25)); }
.nr-slide-text { position: absolute; inset-inline-start: clamp(20px, 5.5cqi, 100px); bottom: clamp(40px, 9cqi, 150px); z-index: 1; width: min(640px, 80%); }
.nr-slide-text h1, .nr-slide-text h2 { color: #fff; font-size: clamp(2em, 4.6cqi, 3.9em); line-height: 1.35; }
.nr-slide-text p { margin-top: 10px; color: rgb(255 255 255 / .92); font-size: clamp(.95em, 1.3cqi, 1.15em); }
.nr-arrows { position: absolute; inset: 0; z-index: 3; pointer-events: none; visibility: hidden; }
.nr-arrows-auto { visibility: visible; }
.nr-arrows label { position: absolute; top: 50%; translate: 0 -50%; display: grid; place-items: center; width: 52px; height: 52px; cursor: pointer; pointer-events: auto; color: #fff; opacity: .85; transition: opacity .25s; }
.nr-arrows label:hover { opacity: 1; }
.nr-arrows label:first-child { right: clamp(10px, 2cqi, 30px); }
.nr-arrows label:last-child { left: clamp(10px, 2cqi, 30px); }
.nr .nr-arrows .nr-ico { width: 34px; height: 34px; stroke-width: 1.2; }

/* Home tiles */
.nr-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--nr-frame-pad); margin-top: var(--nr-frame-pad); }
.nr-grid > * { min-height: clamp(260px, 27cqi, 470px); }
.nr-wide { grid-column: span 2; }
.nr-search { display: grid; place-items: center; padding: 30px 20px; }
.nr-search .nr-form { width: min(260px, 100%); }
.nr-tile { position: relative; overflow: hidden; background: var(--nr-cream); }
.nr-tile > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s cubic-bezier(.2, 1, .3, 1); }
.nr-tile:hover > img { transform: scale(1.04); }
.nr-tile-box { position: absolute; inset-inline-start: 0; top: 50%; translate: 0 -50%; display: grid; justify-items: start; min-width: min(300px, 70%); padding: clamp(20px, 3cqi, 40px) clamp(22px, 3cqi, 44px); background: var(--nr-cream); }
.nr-tile-box h2 { font-size: clamp(1.6em, 2.6cqi, 2.4em); }
.nr-about-box { display: grid; align-content: center; padding: clamp(26px, 4cqi, 56px); }
.nr-about-box h2 { font-size: clamp(1.7em, 2.8cqi, 2.5em); }
.nr-about-text { margin-top: 8px; color: var(--nr-muted); font-size: 1.05em; line-height: 2; }
.nr-amen { position: relative; grid-column: 1 / -1; display: grid; place-items: center; min-height: clamp(320px, 36cqi, 620px); overflow: hidden; }
.nr-amen > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.nr-amen-box { position: relative; display: flex; flex-wrap: wrap; justify-content: center; gap: clamp(12px, 2.8cqi, 44px); margin: 0; padding: clamp(24px, 3cqi, 40px) clamp(20px, 3.4cqi, 56px); list-style: none; background: var(--nr-cream); }
.nr-amen-box li { display: grid; justify-items: center; gap: 8px; width: 82px; text-align: center; font-size: .78em; font-weight: 600; line-height: 1.6; }
.nr .nr-big-ico { width: 54px; height: 54px; stroke-width: 1.1; }
.nr-map-tile { position: relative; display: block; overflow: hidden; background: #ECE6DA; }
.nr-map-tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.nr-review { display: grid; align-content: center; justify-items: center; gap: 6px; padding: clamp(26px, 4cqi, 56px); text-align: center; }
.nr .nr-quote { width: 64px; height: 64px; fill: #fff; stroke: none; opacity: .9; }
.nr-review h2 { margin-top: -26px; font-size: clamp(1.7em, 2.8cqi, 2.4em); }
.nr-review p { color: var(--nr-muted); font-size: 1.02em; }
.nr-review cite { color: var(--nr-accent); font-size: .88em; font-style: normal; }

/* Newsletter band */
.nr-news { position: relative; display: grid; place-items: center; margin-top: var(--nr-frame-pad); min-height: clamp(320px, 34cqi, 560px); overflow: hidden; background: #3a332d; }
.nr-news > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.nr-news-box { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 18px 26px; width: min(1000px, 92%); padding: clamp(24px, 3cqi, 40px) clamp(22px, 3cqi, 48px); background: var(--nr-cream); }
.nr .nr-news-ico { width: 34px; height: 34px; stroke-width: 1.3; }
.nr-news-box h2 { font-size: clamp(1.4em, 2.4cqi, 2.1em); }
.nr-news-box input { flex: 1; min-width: 180px; padding: 8px 2px; border: none; border-bottom: 1px solid #CFC6B8; background: none; color: var(--nr-ink); font: inherit; font-size: .9em; }
.nr-news-box input:focus { outline: none; border-color: var(--nr-accent); }

/* Forms */
.nr-form { display: grid; gap: 14px; }
.nr-form h3 { font-size: 1.5em; }
.nr-form label { display: grid; gap: 5px; }
.nr-form label > span, .nr-extras legend { font-size: .74em; font-weight: 700; }
.nr-form input:not([type="checkbox"]), .nr-form select, .nr-form textarea { width: 100%; padding: 9px 12px; border: 1px solid #DCD3C6; border-radius: 0; background: #fff; color: var(--nr-ink); font: inherit; font-size: .88em; }
.nr-form input:focus, .nr-form select:focus, .nr-form textarea:focus { outline: none; border-color: var(--nr-accent); }
.nr-form .nr-btn { justify-self: stretch; }
.nr-extras { display: grid; gap: 6px; margin: 0; padding: 0; border: 0; }
.nr-extras label { display: flex; align-items: center; gap: 8px; font-size: .84em; }
.nr-extras label span { flex: 1; }
.nr-extras label small { color: var(--nr-muted); }
.nr-extras input { accent-color: var(--nr-accent); }

/* Inner page tops */
.nr-band { position: relative; display: grid; place-items: center; margin: 0 var(--nr-frame-pad); min-height: clamp(220px, 26cqi, 440px); overflow: hidden; background: #3a332d; }
.nr-band img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.nr-band::after { content: ""; position: absolute; inset: 0; background: rgb(0 0 0 / .22); }
.nr-band h1 { position: relative; z-index: 1; color: #fff; font-size: clamp(2.2em, 4.6cqi, 3.8em); }
.nr-top { padding: clamp(30px, 4cqi, 60px) var(--nr-frame-pad); margin: 0 var(--nr-frame-pad); background: var(--nr-soft); }
.nr-top h1 { display: inline-block; width: max-content; margin-inline-start: clamp(0px, 3cqi, 60px); padding: 0 12px; background: var(--nr-accent); color: #fff; font-size: clamp(1.8em, 3cqi, 2.4em); line-height: 1.6; }

/* Rooms */
.nr-side-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: clamp(28px, 5cqi, 70px); align-items: start; padding-block: clamp(40px, 6cqi, 90px); }
.nr-room-list { display: grid; gap: clamp(46px, 6cqi, 80px); }
.nr-room-row.nr-taken { opacity: .55; }
.nr-room-pic { position: relative; display: block; aspect-ratio: 1.57; overflow: hidden; background: var(--nr-cream); }
.nr-room-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s cubic-bezier(.2, 1, .3, 1); }
.nr-room-pic:hover img { transform: scale(1.04); }
.nr-from { position: absolute; inset-inline-start: 0; bottom: 0; padding: 8px 14px; background: var(--nr-cream); color: var(--nr-accent); font-size: .78em; }
.nr-from b { color: var(--nr-ink); font-family: var(--nr-head); font-size: 1.35em; font-weight: 400; }
.nr-room-body { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; margin-top: 22px; }
.nr-room-body h2 { font-size: clamp(1.6em, 2.4cqi, 2em); line-height: 1.3; }
.nr-room-body h2 a:hover { color: var(--nr-accent); }
.nr-room-body p { color: var(--nr-muted); font-size: .92em; }
.nr-facts { display: grid; align-content: start; gap: 8px; padding-inline-start: 22px; border-inline-start: 1px solid var(--nr-line); }
.nr-facts small { font-size: .8em; }
.nr-facts-icons { display: flex; gap: 10px; color: var(--nr-accent); }
.nr-aside { display: grid; gap: 22px; }
.nr-aside-box { padding: 26px 24px; }
.nr-offer-card { position: relative; display: block; aspect-ratio: 1.3; overflow: hidden; color: #fff; }
.nr-offer-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.nr-offer-card b { position: absolute; top: 14px; inset-inline-start: 16px; font-family: var(--nr-head); font-size: 1.6em; font-weight: 400; text-shadow: 0 1px 8px rgb(0 0 0 / .4); }
.nr-offer-card span { position: absolute; bottom: 0; inset-inline-end: 0; display: grid; justify-items: center; padding: 8px 14px; background: var(--nr-cream); color: var(--nr-ink); font-family: var(--nr-head); font-size: 1.1em; }
.nr-offer-card small { font-family: inherit; font-size: .6em; }

/* One room */
.nr-gallery { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 6px; height: clamp(260px, 38cqi, 560px); margin: 0 var(--nr-frame-pad); }
.nr-gallery:has(> :only-child) { grid-template-columns: 1fr; }
.nr-gallery:has(> :nth-child(2):last-child) { grid-template-columns: 2fr 1fr; }
.nr-gal-pic { position: relative; display: block; overflow: hidden; background: var(--nr-cream); cursor: zoom-in; }
.nr-gal-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s cubic-bezier(.2, 1, .3, 1); }
.nr-gal-pic:hover img { transform: scale(1.04); }
.nr-room-main h1 { font-size: clamp(2em, 3.4cqi, 2.8em); line-height: 1.3; }
.nr-text { margin-top: 12px; color: var(--nr-muted); }
.nr-text p + p { margin-top: 12px; }
.nr-part { margin-top: clamp(30px, 4cqi, 48px); padding-top: clamp(26px, 3.4cqi, 40px); border-top: 1px solid var(--nr-line); }
.nr-part h2 { margin-bottom: 14px; font-size: 1.6em; }
.nr-amen-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; margin: 0; padding: 0; list-style: none; color: var(--nr-muted); font-size: .9em; }
.nr-amen-list li { display: flex; align-items: center; gap: 12px; }
.nr-amen-list .nr-ico { color: var(--nr-accent); }
.nr-specs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 0; }
.nr-specs div { padding: 12px 14px; background: var(--nr-soft); }
.nr-specs dt { font-size: .76em; font-weight: 700; }
.nr-specs dd { margin: 2px 0 0; color: var(--nr-muted); font-size: .9em; }
.nr-rules { display: grid; gap: 4px; margin: 0; padding-inline-start: 18px; color: var(--nr-muted); font-size: .92em; }
.nr-rules p { display: list-item; }
.nr-prices { width: min(560px, 100%); border-collapse: collapse; font-size: .9em; }
.nr-prices td { padding: 10px 12px; border-bottom: 1px solid var(--nr-line); }
.nr-prices td:last-child { color: var(--nr-muted); text-align: end; }
.nr-map-frame { position: relative; aspect-ratio: 1.9; border: 1px solid var(--nr-line); background: var(--nr-cream); }
.nr-map-frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.nr-reserve h3 { font-size: 1.5em; }
.nr-reserve-price { margin: 4px 0 16px; color: var(--nr-accent); font-family: var(--nr-head); font-size: 1.3em; }
.nr-reserve-price s { color: var(--nr-muted); font-size: .75em; }
.nr-reserve-price small { color: var(--nr-muted); font-family: var(--font-body); font-size: .55em; }
.nr-reserve > p { margin-top: 12px; font-size: .88em; }
.nr-quote-box { display: grid; gap: 6px; margin: 18px 0 14px; padding: 14px; background: #fff; font-size: .84em; }
.nr-quote-box p { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; line-height: 1.7; }
.nr-quote-box p > span:last-child, .nr-total b { flex: none; white-space: nowrap; }
.nr-quote-dates { color: var(--nr-accent); font-weight: 600; }
.nr-total { padding-top: 8px; border-top: 1px solid var(--nr-line); font-size: 1.1em; }
.nr-total b { font-weight: 700; }
.nr-mine { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; font-size: .82em; }
.nr-mine a { color: var(--nr-accent); }

/* The availability calendar */
.nr-cal { width: min(620px, 100%); padding: 16px 18px; border: 1px solid var(--nr-line); background: var(--nr-soft); }
.nr-cal-nav { display: flex; justify-content: space-between; }
.nr-cal-nav a { display: grid; place-items: center; width: 30px; height: 30px; color: var(--nr-ink); }
.nr-cal-nav a:hover { color: var(--nr-accent); }
.nr-cal-months { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-top: -26px; }
.nr-cal-title { display: block; margin-bottom: 10px; text-align: center; font-size: .8em; font-weight: 700; }
.nr-cal-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px; text-align: center; font-size: .8em; }
.nr-cal-grid i { color: var(--nr-accent); font-style: normal; font-weight: 700; font-size: .9em; }
.nr-cal-grid a, .nr-cal-grid span { display: grid; place-items: center; aspect-ratio: 1; }
.nr-cal-grid .free { border: 1px solid var(--nr-line); background: #fff; }
.nr-cal-grid a.free:hover, .nr-cal-grid a.can-out:hover { border-color: var(--nr-accent); color: var(--nr-accent); }
.nr-cal-grid .full { background: #EEDDD3; color: #A8483B; text-decoration: line-through; }
.nr-cal-grid .off { color: #C9C2B8; }
.nr-cal-grid .sel { background: var(--nr-accent); border-color: var(--nr-accent); color: #fff; text-decoration: none; }
.nr-cal-grid .can-out { border: 1px dashed var(--nr-accent); background: #fff; }
.nr-cal-key { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; margin-top: 12px; font-size: .78em; }
.nr-cal-key span::before { content: ""; display: inline-block; width: 12px; height: 12px; margin-inline-end: 6px; vertical-align: -1px; border: 1px solid var(--nr-line); background: #fff; }
.nr-cal-key .k-full::before { background: #EEDDD3; }
.nr-cal-key .k-sel::before { background: var(--nr-accent); border-color: var(--nr-accent); }
.nr-cal-key b { color: var(--nr-accent); }

/* Offers */
.nr-deals { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; width: min(900px, 100%); margin: clamp(30px, 4cqi, 50px) auto 0; }
.nr-deal { display: grid; justify-items: center; align-content: start; gap: 10px; padding: 34px 22px 30px; background: var(--nr-soft); }
.nr-deal-mid { background: #F3E3DC; }
.nr-deal h3 { font-size: 1.5em; }
.nr-deal-pct { font-family: var(--nr-head); font-size: 3em; font-weight: 400; line-height: 1; }
.nr-deal ul { display: grid; gap: 4px; margin: 10px 0 14px; padding: 0; list-style: none; color: var(--nr-muted); font-size: .86em; }
.nr-deal-mid .nr-btn { border-color: var(--nr-accent); background: var(--nr-accent); color: #fff; }
.nr-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
.nr-strip img { width: 100%; aspect-ratio: 1.4; object-fit: cover; }

/* About */
.nr-about-pic img { width: 100%; aspect-ratio: 1.6; object-fit: cover; }
.nr-features { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(26px, 4cqi, 50px) clamp(20px, 4cqi, 60px); padding-block: clamp(46px, 6cqi, 90px); }
.nr-features h3 { margin-top: 10px; font-size: 1.35em; }
.nr-features p { color: var(--nr-muted); font-size: .9em; }
.nr .nr-feat-ico { width: 34px; height: 34px; color: var(--nr-accent); stroke-width: 1.3; }
.nr-near { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; margin-top: 30px; text-align: start; }
.nr-near article { position: relative; }
.nr-near-pic { display: block; aspect-ratio: 1.25; overflow: hidden; cursor: zoom-in; }
.nr-near-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s cubic-bezier(.2, 1, .3, 1); }
.nr-near-pic:hover img { transform: scale(1.05); }
.nr-near-box { position: relative; margin: -40px 16px 0; padding: 16px 18px; background: var(--nr-cream); }
.nr-near-box h3 { font-size: 1.35em; }
.nr-near-box p { color: var(--nr-muted); font-size: .86em; }
.nr-said { display: grid; justify-items: center; gap: 30px; }
.nr .nr-said .nr-quote { fill: var(--nr-cream); width: 70px; height: 70px; }
.nr-said blockquote { width: min(640px, 92%); margin: 0; }
.nr-said h2 { font-size: 2em; }
.nr-said p { color: var(--nr-muted); }
.nr-said cite { color: var(--nr-accent); font-style: normal; font-size: .9em; }

/* Blog */
.nr-blog-top { position: relative; display: grid; place-items: center; margin: 0 var(--nr-frame-pad); padding: clamp(34px, 5cqi, 70px) 16px; overflow: hidden; background: var(--nr-soft); text-align: center; }
.nr-blog-top span { position: absolute; inset: 50% 0 auto; translate: 0 -50%; color: rgb(0 0 0 / .045); font-family: var(--nr-head); font-size: clamp(3em, 11cqi, 9em); line-height: 1; white-space: nowrap; }
.nr-blog-top h1 { position: relative; font-size: clamp(1.8em, 3cqi, 2.6em); }
.nr-posts { display: grid; gap: clamp(46px, 6cqi, 80px); }
.nr-post-pic { display: block; aspect-ratio: 2.1; overflow: hidden; }
.nr-post-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s cubic-bezier(.2, 1, .3, 1); }
.nr-post-pic:hover img { transform: scale(1.04); }
.nr-post-meta { display: block; margin-top: 14px; color: var(--nr-accent); font-size: .8em; }
.nr-post-card h2 { font-size: 1.8em; line-height: 1.4; }
.nr-post-card h2 a:hover { color: var(--nr-accent); }
.nr-post-card p { color: var(--nr-muted); }
.nr-side-part { display: grid; gap: 10px; padding-bottom: 22px; border-bottom: 1px solid var(--nr-line); }
.nr-side-part h3 { font-size: 1.3em; }
.nr-side-part p { color: var(--nr-muted); font-size: .88em; }
.nr-mini { display: grid; grid-template-columns: 56px 1fr; grid-template-rows: auto auto; gap: 0 12px; align-items: center; font-size: .84em; }
.nr-mini span { grid-row: span 2; aspect-ratio: 1; overflow: hidden; background: var(--nr-cream); }
.nr-mini span img { width: 100%; height: 100%; object-fit: cover; }
.nr-mini b { font-weight: 600; line-height: 1.6; }
.nr-mini small { color: var(--nr-accent); font-size: .85em; }
.nr-mini:hover b { color: var(--nr-accent); }
.nr-cat { display: inline-block; margin-inline-end: 6px; color: var(--nr-muted); font-size: .88em; }
.nr-article-pic { width: 100%; aspect-ratio: 1.9; object-fit: cover; }
.nr-article-text { font-size: 1.02em; line-height: 2.1; }
.nr-article-text > p:first-child::first-letter { float: right; margin-inline-end: 8px; color: var(--nr-accent); font-family: var(--nr-head); font-size: 3.4em; line-height: 1; }
.nr-related { margin-top: 40px; padding-top: 30px; border-top: 1px solid var(--nr-line); }
.nr-related h2 { font-size: 1.6em; }
.nr-related > div { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 14px; }
.nr-rel img { width: 100%; aspect-ratio: 1.3; object-fit: cover; }
.nr-rel b { display: block; margin-top: 8px; font-weight: 600; }
.nr-rel:hover b { color: var(--nr-accent); }

/* Contact */
.nr-contact { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(30px, 6cqi, 90px); }
.nr-contact-info { display: grid; align-content: start; gap: 12px; }
.nr-contact-line { display: flex; align-items: center; gap: 12px; }
.nr-contact-line .nr-ico { color: var(--nr-accent); }
.nr-contact-line a:hover { color: var(--nr-accent); }
.nr-contact-form { align-content: start; }
.nr-visitor { width: min(760px, var(--nr-wrap)); }

/* Footer */
.nr-foot { margin: var(--nr-frame-pad); margin-bottom: 0; background: var(--nr-soft); }
.nr-foot-in { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: clamp(24px, 4cqi, 60px); padding: clamp(46px, 6cqi, 90px) clamp(20px, 5cqi, 80px); }
.nr-foot h3 { margin-bottom: 12px; font-size: 1.45em; }
.nr-foot p { color: var(--nr-muted); font-size: .86em; line-height: 1.9; }
.nr-foot p a { color: var(--nr-ink); }
.nr-foot p a:hover { color: var(--nr-accent); }
.nr-foot-map { margin-top: 18px; }
.nr-trust { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 18px; }
.nr-trust img { height: 46px; width: auto; filter: grayscale(1); opacity: .8; }
.nr-social { display: flex; gap: 12px; margin-top: 12px; }
.nr-social a { display: inline-flex; transition: color .25s; }
.nr-social a:hover { color: var(--nr-accent); }
.nr-foot-links { display: flex; gap: 14px; margin-top: 14px; }
.nr-copy { padding: 14px; background: #F2EAE5; color: var(--nr-muted); font-size: .78em; text-align: center; }

/* Tablets and phones */
@container (max-width: 1000px) {
  .nr-nav, .nr-user { display: none; }
  .nr-menu { display: block; margin-inline-start: auto; }
  .nr-head-in { position: relative; }
  .nr-side-layout { grid-template-columns: 1fr; }
  .nr-foot-in { grid-template-columns: 1fr 1fr; }
}
@container (max-width: 760px) {
  .nr-grid { grid-template-columns: 1fr; }
  .nr-wide { grid-column: auto; }
  .nr-grid > * { min-height: 300px; }
  .nr-room-body { grid-template-columns: 1fr; }
  .nr-facts { padding: 12px 0 0; border: 0; border-top: 1px solid var(--nr-line); }
  .nr-deals, .nr-near, .nr-features { grid-template-columns: 1fr; }
  .nr-contact { grid-template-columns: 1fr; }
  .nr-cal-months { grid-template-columns: 1fr; margin-top: 0; }
  .nr-gallery { grid-template-columns: 1fr !important; height: auto; }
  .nr-gallery > :not(:first-child) { display: none; }
  .nr-gallery > :first-child { aspect-ratio: 1.4; }
  .nr-strip { grid-template-columns: 1fr 1fr; }
  .nr-amen-list, .nr-specs { grid-template-columns: 1fr 1fr; }
  .nr-news-box { justify-content: center; text-align: center; }
  .nr-news-box h2 { flex-basis: 100%; }
  .nr-foot-in { grid-template-columns: 1fr; text-align: center; }
  .nr-social, .nr-foot-links, .nr-trust { justify-content: center; }
  .nr-related > div { grid-template-columns: 1fr; }
  .nr-tile-box { min-width: 0; }
  .nr-slide-text { width: 86%; }
}
`;
