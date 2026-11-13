/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Escape": an escape-room site rebuilt from the Exit Game reference, in Persian. A thin dark bar with
// the phone, email and socials over a transparent menu on a full-screen hero; welcome with three
// numbered points, the rooms, a corporate band, "our games are perfect for", a video band, the
// players' reviews, FAQ and a gift-card band. Pages: events, about (gallery, numbers, reviews, blog),
// contact, rooms, and online booking: each room is booked on its own (one group per room at a time),
// from the owner's working hours and the bookings already taken; the server checks it again. No
// scripts: the sliders use radios, the questions and the mobile menu use details.

import type { ReactNode } from "react";
import { defaultSchedule, emptyVisitor, formatToman, takenFor, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { FormMeta, Opt, PageLink, blockOn, ed, item, outside, partsCss } from "./parts";
import { mapEmbed } from "./golsara";
import { AccountPage, shopkitCss } from "./shopkit";
import { BookingPicker, TrackBooking, bookingCss } from "./booking";

export const ESCAPE_BLOCKS = [
  { key: "hero", label: "تصویر بزرگ بالای صفحه" },
  { key: "welcome", label: "خوش آمدید (سه نکته)" },
  { key: "rooms", label: "اتاق‌ها" },
  { key: "corporate", label: "نوار سازمانی" },
  { key: "perfect", label: "مناسب برای" },
  { key: "video", label: "نوار ویدیو" },
  { key: "reviews", label: "نظر بازیکن‌ها" },
  { key: "faq", label: "سؤال‌های پرتکرار" },
  { key: "gift", label: "کارت هدیه" },
] as const;

export const ESCAPE_OPTIONAL_PAGES = [
  { path: "/events", label: "صفحه‌ی رویدادها" },
  { path: "/about", label: "صفحه‌ی درباره‌ی ما" },
] as const;

const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);
const roomsOf = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());

export function escapePages(data: ResumeData): string[] {
  const posts = livePosts(data.site?.shop).map((p) => `/blog/${p.id}`);
  return ["/", ...(pageOn(data, "/events") ? ["/events"] : []), ...(pageOn(data, "/about") ? ["/about"] : []), "/contact", "/appointment", "/rooms", ...posts, "/account", "/track"];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; page: string; visitor: Visitor };

export function EscapeSite(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = escapePages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), page, visitor: props.visitor ?? emptyVisitor() };
  const [kind, id] = page.split("/").filter(Boolean);
  const body: ReactNode =
    page === "/" ? <Home {...view} />
    : page === "/events" ? <Events {...view} />
    : page === "/about" ? <About {...view} />
    : page === "/rooms" ? <Rooms {...view} />
    : page === "/appointment" ? <Appointment {...view} />
    : page === "/account" ? <Account {...view} />
    : page === "/track" ? <Track {...view} />
    : kind === "blog" && id ? <Post {...view} id={id} />
    : <Contact {...view} />;
  const visitorPage = page === "/account" || page === "/track";
  return (
    <WebPage ctx={ctx} className={`eg${page === "/" ? " eg-home" : ""}`} css={partsCss + bookingCss + (visitorPage ? shopkitCss : "") + css}>
      <Header {...view} />
      <main key={page}>{body}</main>
      <Footer {...view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const fa = (n: number) => new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(n);
const faDate = (day: string) => new Date(`${day.slice(0, 10)}T12:00:00Z`).toLocaleDateString("fa-IR-u-ca-persian", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
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
/** A phone number in Persian digits; its groups keep their order inside right-to-left text. */
const faDigits = (v: string) => v.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
const telHref = (v: string) => `tel:${v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d+]/g, "")}`;
const Phone = ({ value }: { value: string }) => <bdi dir="ltr">{faDigits(value)}</bdi>;
/** A decorative picture of the template (the red numbers behind some sections). */
const DIGITS = sampleImage("eg-digits");

// Line icons, drawn on a 48 grid with the current color.
const ICONS: Record<string, string> = {
  phone: "M14 8h7l3 9-4.5 3a23 23 0 0 0 9.5 9.5l3-4.5 9 3v7a3 3 0 0 1-3 3C21 38 10 27 11 11a3 3 0 0 1 3-3z",
  mail: "M7 12h34v24H7zM7 13l17 13 17-13",
  pin: "M24 43s-13-11-13-22a13 13 0 0 1 26 0c0 11-13 22-13 22zM24 25a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z",
  clock: "M24 42a18 18 0 1 0 0-36 18 18 0 0 0 0 36zM24 14v10l7 5",
  user: "M24 23a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9 41c2-8 8-12 15-12s13 4 15 12",
  friends: "M15 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM33 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM24 39a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM7 26c1-4 4-6 8-6s7 2 8 6M25 26c1-4 4-6 8-6s7 2 8 6M16 44c1-3 4-5 8-5s7 2 8 5M12 22l9 9M36 22l-9 9",
  puzzle: "M8 8h12v4a4 4 0 1 0 8 0V8h12v12h-4a4 4 0 1 0 0 8h4v12H28v-4a4 4 0 1 0-8 0v4H8V28h4a4 4 0 1 0 0-8H8z",
  flag: "M10 44V6M10 8h26l-5 8 5 8H10M16 12h12M16 18h8",
  team: "M24 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 19a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM36 19a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17 44V25a7 7 0 0 1 14 0v19M5 44V29a7 7 0 0 1 9-6M43 44V29a7 7 0 0 0-9-6M22 44V34M26 44V34",
  alarm: "M24 42a15 15 0 1 0 0-30 15 15 0 0 0 0 30zM24 19v8l5 4M8 13l7-6M40 13l-7-6",
  coin: "M24 42a18 18 0 1 0 0-36 18 18 0 0 0 0 36zM29 17c-1-2-3-3-5-3-3 0-5 2-5 4 0 6 11 3 11 9 0 3-3 5-6 5-3 0-5-1-6-3M24 11v4M24 33v4",
  people: "M17 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM31 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM5 39c1-7 6-11 12-11s11 4 12 11M23 31c2-2 5-3 8-3 6 0 11 4 12 11",
  door: "M12 44V6h20v38M8 44h32M27 26h2M32 10l6 3v31",
  calendar: "M7 11h34v31H7zM7 19h34M15 6v9M33 6v9M15 26h4M22 26h4M29 26h4M15 33h4M22 33h4M29 33h4",
  check: "M24 43a19 19 0 1 0 0-38 19 19 0 0 0 0 38zM15 24l6 6 12-13",
  play: "M17 12l20 12-20 12z",
  quote: "M8 30c0-9 4-15 11-18l1 3c-4 2-6 5-6 8h5v11H8zM27 30c0-9 4-15 11-18l1 3c-4 2-6 5-6 8h5v11H27z",
  prev: "M18 10l14 14-14 14",
  next: "M30 10L16 24l14 14",
  down: "M12 18l12 12 12-12",
};
const Svg = ({ name, className = "eg-ico" }: { name: string; className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
);
const PERK_ICONS = ["friends", "puzzle", "flag", "team"];
const POINT_ICONS = ["alarm", "coin", "people"];
const STEP_ICONS = ["door", "calendar", "people", "check"];

/** A red script-like line above a heading. */
const Kicker = ({ children, edit }: { children: ReactNode; edit?: object }) => (
  <em className="eg-kicker" {...edit}>
    {children}
  </em>
);

function Logo({ view }: { view: View }) {
  const b = view.ctx.data.basics;
  const icon = safeUrl(view.ctx.data.site?.signatureImage);
  return (
    <PageLink to="/" link={view.link} className="eg-logo">
      <span className="eg-logo-icon" {...ed("site.signatureImage", "image", "نشان")}>
        {icon ? (
          <img src={icon} alt="" />
        ) : (
          <svg viewBox="0 0 40 48" aria-hidden="true">
            <path className="sh" d="M20 3c6 0 9 3 9 6 5 1 8 4 8 9 0 3-2 5-2 7s3 4 3 8c0 6-5 9-10 9-2 3-5 4-8 4s-6-1-8-4C7 42 2 39 2 33c0-4 3-6 3-8s-2-4-2-7c0-5 3-8 8-9 0-3 3-6 9-6z" />
            <path className="bd" d="M19 2c6 0 9 3 9 6 5 1 8 4 8 9 0 3-2 5-2 7s3 4 3 8c0 6-5 9-10 9-2 3-5 4-8 4s-6-1-8-4c-5 0-10-3-10-9 0-4 3-6 3-8s-2-4-2-7c0-5 3-8 8-9 0-3 3-6 9-6z" />
            <path className="kh" d="M19 15a5 5 0 0 0-2.5 9.3L15 33h8l-1.5-8.7A5 5 0 0 0 19 15z" />
          </svg>
        )}
      </span>
      <span className="eg-logo-text">
        <b {...ed("basics.fullName", "text", "نام")} data-text={b.fullName}>
          {b.fullName}
        </b>
        <small {...ed("basics.jobTitle", "text", "زیر نام")}>{b.jobTitle}</small>
      </span>
    </PageLink>
  );
}

const menuItems = (view: View) =>
  [
    { to: "/", label: "خانه" },
    { to: "/events", label: "رویدادها", on: pageOn(view.ctx.data, "/events") },
    { to: "/about", label: "درباره‌ی ما", on: pageOn(view.ctx.data, "/about") },
    { to: "/contact", label: "تماس با ما" },
    { to: "/appointment", label: "رزرو اتاق" },
  ].filter((m) => m.on !== false);
const isCurrent = (view: View, to: string) => (to === "/" ? view.page === "/" : view.page === to || (to === "/appointment" && view.page === "/rooms"));

function SocialText({ view }: { view: View }) {
  const links = view.ctx.data.basics.links.filter((l) => safeUrl(l.url));
  const NAMES: Record<string, string> = { instagram: "اینستاگرام", telegram: "تلگرام", whatsapp: "واتس‌اپ", eitaa: "ایتا", rubika: "روبیکا", website: "وب‌سایت", linkedin: "لینکدین", github: "گیت‌هاب", behance: "بهنس", dribbble: "دریبل" };
  return (
    <>
      {links.map((l) => {
        const href = safeUrl(l.url)!;
        return (
          <a key={l.id} href={href} {...outside(href)} {...ed(`basics.links[${l.id}].url`, "url", NAMES[l.type] ?? "لینک")}>
            {NAMES[l.type] ?? "لینک"}
          </a>
        );
      })}
      {view.editing && (
        <span className="p-ghost" {...ed("basics.links", "newlink", "شبکه‌ی اجتماعی")}>
          + شبکه‌ی اجتماعی
        </span>
      )}
    </>
  );
}

function Header(view: View) {
  const { ctx, link } = view;
  const b = ctx.data.basics;
  const nav = menuItems(view).map((m) => (
    <PageLink key={m.to} to={m.to} link={link} current={isCurrent(view, m.to)}>
      {m.label}
    </PageLink>
  ));
  return (
    <header className="eg-head">
      <div className="eg-top">
        <div className="eg-top-in">
          <span className="eg-top-info">
            {b.phone && (
              <a href={telHref(b.phone)} {...ed("basics.phone", "text", "تلفن")}>
                <Phone value={b.phone} />
              </a>
            )}
            {b.email && (
              <a href={`mailto:${b.email}`} {...ed("basics.email", "text", "ایمیل")}>
                {b.email}
              </a>
            )}
          </span>
          <span className="eg-top-social">
            <SocialText view={view} />
          </span>
        </div>
      </div>
      <div className="eg-bar">
        <Logo view={view} />
        <nav className="eg-nav">{nav}</nav>
        <div className="eg-tools">
          <PageLink to="/account" link={link} className="eg-acc" current={view.page === "/account" || view.page === "/track"} label={view.visitor.customer ? "رزروهای من" : "ورود و رزروهای من"}>
            <Svg name="user" />
          </PageLink>
          <PageLink to="/appointment" link={link} className="eg-btn small eg-book">
            همین حالا رزرو کنید
          </PageLink>
        </div>
        <details className="eg-burger">
          <summary aria-label="منو">
            <span />
          </summary>
          <div className="eg-drawer">
            <Logo view={view} />
            <nav>
              {nav}
              <PageLink to="/rooms" link={link} current={view.page === "/rooms"}>
                اتاق‌ها
              </PageLink>
              <PageLink to="/account" link={link} current={view.page === "/account"}>
                {view.visitor.customer ? "رزروهای من" : "ورود / ثبت‌نام"}
              </PageLink>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}

function Footer(view: View) {
  const { ctx, link, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  return (
    <footer className="eg-foot">
      <div className="eg-wrap eg-foot-in">
        <div className="eg-foot-logo">
          <Logo view={view} />
        </div>
        <div>
          <h4>منوی سایت</h4>
          <nav className="eg-foot-list">
            <PageLink to="/rooms" link={link}>
              اتاق‌ها
            </PageLink>
            {pageOn(ctx.data, "/events") && (
              <PageLink to="/events" link={link}>
                رویدادها
              </PageLink>
            )}
            {pageOn(ctx.data, "/about") && (
              <PageLink to="/about" link={link}>
                درباره‌ی ما
              </PageLink>
            )}
            <PageLink to="/appointment" link={link}>
              رزرو اتاق
            </PageLink>
            <PageLink to="/track" link={link}>
              پیگیری رزرو
            </PageLink>
          </nav>
        </div>
        <div>
          <h4>ما را دنبال کنید</h4>
          <div className="eg-foot-list">
            <SocialText view={view} />
          </div>
        </div>
        <div>
          <h4>تماس</h4>
          <div className="eg-foot-list">
            <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
              <span {...ed("site.address", "text", "نشانی")}>{site?.address}</span>
            </Opt>
            {b.phone && (
              <a href={telHref(b.phone)} {...ed("basics.phone", "text", "تلفن")}>
                <Phone value={b.phone} />
              </a>
            )}
            {b.email && (
              <a href={`mailto:${b.email}`} {...ed("basics.email", "text", "ایمیل")}>
                {b.email}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="eg-copy">
        <span className="eg-copy-bg" style={{ backgroundImage: `url(${sampleImage("eg-foot")})` }} />
        <p>
          © {fa(new Date().getFullYear() - 621)} <b>{b.fullName}</b>. همه‌ی حقوق محفوظ است.
        </p>
      </div>
    </footer>
  );
}

/** The dark picture strip with the page's title and the way back home. */
function PageTop({ view, title, trail }: { view: View; title: string; trail?: { label: string; to: string } }) {
  const url = safeUrl(view.shop.discoverImage);
  return (
    <section className="eg-ptop">
      <span className="eg-ptop-pic" {...ed("site.shop.discoverImage", "image", "عکس بالای صفحه‌ها")}>
        {url && <img src={url} alt="" />}
      </span>
      <div className="eg-ptop-in">
        <h1>{title}</h1>
        <nav className="eg-crumbs">
          <PageLink to="/" link={view.link}>
            خانه
          </PageLink>
          {trail && (
            <>
              {" / "}
              <PageLink to={trail.to} link={view.link}>
                {trail.label}
              </PageLink>
            </>
          )}
          {" / "}
          <span>{title}</span>
        </nav>
      </div>
    </section>
  );
}

const Head = ({ kicker, title, center, editTitle }: { kicker: string; title?: string; center?: boolean; editTitle?: object }) => (
  <div className={`eg-headline${center ? " center" : ""}`}>
    <Kicker>{kicker}</Kicker>
    {title && <h2 {...editTitle}>{title}</h2>}
  </div>
);

/* ───────────── Home ───────────── */

function Home(view: View) {
  const { ctx, shop, link, editing } = view;
  const data = ctx.data;
  const site = data.site;
  const on = (k: string) => blockOn(data, k);
  const hero = safeUrl(shop.heroImage);
  const points = (site?.aboutText ?? "").split("\n").filter((x) => x.trim()).slice(0, 4);
  const corp = safeUrl(shop.newImage);
  const b = data.basics;
  return (
    <>
      {on("hero") && (
        <section className="eg-hero">
          <span className="eg-hero-pic" {...ed("site.shop.heroImage", "image", "عکس بزرگ")}>
            {hero && <img src={hero} alt="" />}
          </span>
          <div className="eg-hero-in">
            <Opt value={shop.heroKicker} editing={editing} edit={ed("site.shop.heroKicker", "text", "جمله‌ی کوچک")}>
              <Kicker edit={ed("site.shop.heroKicker", "text", "جمله‌ی کوچک")}>{shop.heroKicker}</Kicker>
            </Opt>
            <h1 {...ed("site.shop.heroTitle", "text", "عنوان بزرگ")}>{shop.heroTitle || "بهترین بازی‌های فرار"}</h1>
            <PageLink to="/rooms" link={link} className="eg-btn">
              انتخاب ماجرا
            </PageLink>
          </div>
        </section>
      )}

      {on("welcome") && (
        <section className="eg-sec eg-numbers" style={{ backgroundImage: `url(${DIGITS})` }}>
          <div className="eg-wrap eg-split">
            <div className="eg-split-pic">
              <div className="eg-headline over">
                <Kicker>خوش آمدید!</Kicker>
                <h2 {...ed("site.aboutTitle", "text", "عنوان")}>{site?.aboutTitle}</h2>
              </div>
              <span className="eg-frame" {...ed("site.aboutImage", "image", "عکس")}>
                {safeUrl(site?.aboutImage) && <img src={safeUrl(site?.aboutImage)} alt="" loading="lazy" />}
              </span>
            </div>
            <ol className="eg-points" {...ed("site.aboutText", "multiline", "نکته‌ها (هر خط یک نکته)")}>
              {points.map((x, k) => (
                <li key={k}>
                  <b>{fa(k + 1)}</b>
                  <p>{x}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {on("rooms") && (
        <section className="eg-sec">
          <Head kicker="یکی را انتخاب کنید" title="اتاق‌های ما" center />
          <RoomGrid view={view} limit={6} />
          <p className="eg-center">
            <PageLink to="/rooms" link={link} className="eg-btn">
              همه‌ی اتاق‌ها
            </PageLink>
          </p>
        </section>
      )}

      {on("corporate") && (
        <section className="eg-sec eg-corp">
          <span className="eg-corp-bg" {...ed("site.shop.newImage", "image", "عکس پس‌زمینه")}>
            {corp && <img src={corp} alt="" loading="lazy" />}
          </span>
          <div className="eg-wrap eg-corp-in">
            <div>
              <Head kicker="سازمانی" title={shop.newTitle} editTitle={ed("site.shop.newTitle", "text", "عنوان")} />
              <PageLink to="/appointment" link={link} className="eg-btn">
                رزرو کنید
              </PageLink>
            </div>
            <div className="eg-body">
              <div {...ed("site.shop.newText", "multiline", "متن")}>
                <Para text={shop.newText} />
              </div>
              {b.phone && (
                <p className="eg-ask">
                  <span className="eg-ask-q">؟</span>
                  <span>
                    می‌خواهید تیم‌تان را بیاورید؟
                    <br />
                    با ما تماس بگیرید:{" "}
                    <a href={telHref(b.phone)}>
                      <Phone value={b.phone} />
                    </a>
                    {b.email && (
                      <>
                        {" "}
                        یا{" "}
                        <a href={`mailto:${b.email}`}>ایمیل بزنید</a>
                      </>
                    )}
                  </span>
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {on("perfect") && (shop.perks ?? []).length > 0 && (
        <section className="eg-sec">
          <Head kicker="اتاقی برای هر سلیقه!" title="بازی‌های ما مناسب‌اند برای" center />
          <div className="eg-wrap eg-perks">
            {(shop.perks ?? []).slice(0, 4).map((p, k) => {
              const at = item("site.shop.perks", p.id);
              const pic = safeUrl(p.image);
              return (
                <article key={p.id}>
                  {pic ? <img src={pic} alt="" className="eg-ico big" /> : <Svg name={PERK_ICONS[k % 4]!} className="eg-ico big" />}
                  <h3 {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</h3>
                  <p {...ed(`${at}.text`, "multiline", "متن")}>{p.text}</p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {on("video") && <VideoBand view={view} />}
      {on("reviews") && <Reviews view={view} />}

      {on("faq") && (shop.faq ?? []).length > 0 && (
        <section className="eg-sec">
          <Head kicker="سؤال‌های پرتکرار" title={shop.faqTitle || "پاسخ همه‌ی سؤال‌هایتان این‌جاست"} editTitle={ed("site.shop.faqTitle", "text", "عنوان")} center />
          <div className="eg-wrap eg-faq">
            {[0, 1].map((col) => (
              <div key={col}>
                {(shop.faq ?? [])
                  .filter((_, k) => k % 2 === col)
                  .map((x, k) => {
                    const at = item("site.shop.faq", x.id);
                    return (
                      <details key={x.id} open={col === 0 && k === 0}>
                        <summary>
                          <span {...ed(`${at}.q`, "text", "سؤال")}>{x.q}</span>
                          <Svg name="down" className="eg-ico arrow" />
                        </summary>
                        <div {...ed(`${at}.a`, "multiline", "پاسخ")}>
                          <Para text={x.a} />
                        </div>
                      </details>
                    );
                  })}
              </div>
            ))}
          </div>
        </section>
      )}

      {on("gift") && <GiftBand view={view} />}
    </>
  );
}

function RoomGrid({ view, limit }: { view: View; limit?: number }) {
  const rooms = roomsOf(view.shop).slice(0, limit ?? 50);
  return (
    <div className="eg-wrap wide eg-rooms">
      {rooms.map((r) => {
        const pic = safeUrl(r.images[0]);
        return (
          <PageLink key={r.id} to={`/appointment?room=${encodeURIComponent(r.id)}`} link={view.link} className="eg-room" product={r.id}>
            {pic && <img src={pic} alt="" loading="lazy" />}
            <b>{r.name}</b>
          </PageLink>
        );
      })}
      {rooms.length === 0 && view.editing && <p className="eg-muted">اتاق‌ها را در «⚙️ مدیریت ← اتاق‌ها» اضافه کنید.</p>}
    </div>
  );
}

function VideoBand({ view }: { view: View }) {
  const band = view.shop.banners?.[0];
  if (!band) return null;
  const at = item("site.shop.banners", band.id);
  const pic = safeUrl(band.image);
  const video = safeUrl(band.link);
  return (
    <section className="eg-video">
      <span className="eg-video-bg" {...ed(`${at}.image`, "image", "عکس پس‌زمینه")}>
        {pic && <img src={pic} alt="" loading="lazy" />}
      </span>
      <div className="eg-video-in">
        <Kicker edit={ed(`${at}.kicker`, "text", "جمله‌ی کوچک")}>{band.kicker}</Kicker>
        <h2 {...ed(`${at}.title`, "text", "عنوان")}>{band.title}</h2>
        {video ? (
          <a href={video} {...outside(video)} className="eg-btn" {...(view.editing ? ed(`${at}.link`, "url", "لینک ویدیو") : {})}>
            پخش ویدیو
          </a>
        ) : (
          view.editing && (
            <span className="p-ghost" {...ed(`${at}.link`, "url", "لینک ویدیو")}>
              + لینک ویدیو
            </span>
          )
        )}
      </div>
    </section>
  );
}

function Reviews({ view }: { view: View }) {
  const list = (view.ctx.data.site?.testimonials ?? []).filter((t) => t.text.trim());
  const pic = safeUrl(view.shop.trendImage);
  if (!list.length) return null;
  return (
    <section className="eg-sec eg-numbers" style={{ backgroundImage: `url(${DIGITS})` }}>
      <div className="eg-wrap eg-split">
        <div className="eg-split-pic">
          <div className="eg-headline over">
            <Kicker>نظرها</Kicker>
            <h2>بازیکن‌ها چه می‌گویند</h2>
          </div>
          <span className="eg-frame" {...ed("site.shop.trendImage", "image", "عکس")}>
            {pic && <img src={pic} alt="" loading="lazy" />}
          </span>
        </div>
        <div className="eg-quotes">
          {list.map((t, k) => (
            <input key={t.id} type="radio" name="eg-q" id={`eg-q${k}`} defaultChecked={k === 0} className="eg-radio" />
          ))}
          <div className="eg-quote-list">
            {list.map((t) => {
              const at = item("site.testimonials", t.id);
              return (
                <blockquote key={t.id} className="eg-quote">
                  <Svg name="quote" className="eg-ico mark" />
                  <p {...ed(`${at}.text`, "multiline", "متن نظر")}>«{t.text}»</p>
                  <cite {...ed(`${at}.name`, "text", "نام")}>{t.name}</cite>
                </blockquote>
              );
            })}
          </div>
          {list.length > 1 && (
            <div className="eg-dots">
              {list.map((t, k) => (
                <label key={t.id} htmlFor={`eg-q${k}`} aria-label={`نظر ${fa(k + 1)}`} />
              ))}
            </div>
          )}
          <style>{list.map((_, k) => `#eg-q${k}:checked ~ .eg-quote-list .eg-quote:nth-child(${k + 1}) { opacity: 1; visibility: visible; transform: none; } #eg-q${k}:checked ~ .eg-dots label:nth-child(${k + 1}) { background: var(--eg-red); }`).join("\n")}</style>
        </div>
      </div>
    </section>
  );
}

function GiftBand({ view }: { view: View }) {
  const band = view.shop.banners?.[1];
  if (!band) return null;
  const at = item("site.shop.banners", band.id);
  const pic = safeUrl(band.image);
  const bg = safeUrl(view.shop.lookImage);
  const href = safeUrl(band.link);
  return (
    <section className="eg-gift">
      <span className="eg-gift-bg" {...ed("site.shop.lookImage", "image", "عکس پس‌زمینه")}>
        {bg && <img src={bg} alt="" loading="lazy" />}
      </span>
      <div className="eg-wrap eg-gift-in">
        <span className="eg-gift-pic" {...ed(`${at}.image`, "image", "عکس")}>
          {pic && <img src={pic} alt="" loading="lazy" />}
        </span>
        <div>
          <Kicker edit={ed(`${at}.kicker`, "text", "جمله‌ی کوچک")}>{band.kicker}</Kicker>
          <h2 {...ed(`${at}.title`, "text", "عنوان")}>{band.title}</h2>
          <p className="eg-body" {...ed(`${at}.text`, "multiline", "متن")}>
            {band.text}
          </p>
          {/* Without a link of its own the button leads to the contact page; in the editor a click sets the link. */}
          <a
            href={href ?? view.link("/contact")}
            {...(href ? outside(href) : { "data-page": "/contact" })}
            className="eg-btn"
            {...(view.editing ? ed(`${at}.link`, "url", "لینک خرید کارت هدیه") : {})}
          >
            خرید کارت هدیه
          </a>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Rooms ───────────── */

function Rooms(view: View) {
  const { ctx, shop, link } = view;
  const data = ctx.data;
  const clock = safeUrl(data.site?.accentImage);
  const video = safeUrl(shop.banners?.[0]?.link);
  return (
    <>
      <PageTop view={view} title="اتاق‌ها" />
      <section className="eg-sec eg-numbers" style={{ backgroundImage: `url(${DIGITS})` }}>
        <div className="eg-wrap eg-split">
          <div className="eg-split-pic">
            <div className="eg-headline over">
              <Kicker>آماده‌ی چالش هستید؟</Kicker>
              <h2 {...ed("site.shop.showcaseTitle", "text", "عنوان")}>{shop.showcaseTitle}</h2>
            </div>
            <span className="eg-frame" {...ed("site.accentImage", "image", "عکس")}>
              {clock && <img src={clock} alt="" loading="lazy" />}
              {video && (
                <a href={video} {...outside(video)} className="eg-play" aria-label="پخش ویدیو">
                  <Svg name="play" />
                </a>
              )}
            </span>
          </div>
          <ul className="eg-points icons">
            {data.skills.slice(0, 3).map((s, k) => (
              <li key={s.id}>
                <Svg name={POINT_ICONS[k % 3]!} className="eg-ico ring" />
                <p {...ed(`${item("skills", s.id)}.description`, "multiline", "متن")}>{s.description || s.name}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="eg-sec">
        <Head kicker="یکی را انتخاب کنید" title="اتاق‌های ما" center />
        <RoomGrid view={view} />
      </section>
      {data.education.length > 0 && (
        <section className="eg-sec">
          <Head kicker="راهنمای رزرو" title="چطور رزرو کنیم" center />
          <div className="eg-wrap eg-perks">
            {data.education.slice(0, 4).map((e, k) => {
              const at = item("education", e.id);
              return (
                <article key={e.id}>
                  <Svg name={STEP_ICONS[k % 4]!} className="eg-ico big" />
                  <h3 {...ed(`${at}.institution`, "text", "عنوان")}>{e.institution}</h3>
                  <p {...ed(`${at}.description`, "multiline", "متن")}>{e.description}</p>
                </article>
              );
            })}
          </div>
          <p className="eg-center">
            <PageLink to="/appointment" link={link} className="eg-btn">
              همین حالا رزرو کنید
            </PageLink>
          </p>
        </section>
      )}
    </>
  );
}

/* ───────────── Events ───────────── */

function Events(view: View) {
  const { ctx, link, editing } = view;
  const list = ctx.data.projects;
  return (
    <>
      <PageTop view={view} title="رویدادها" />
      <section className="eg-sec eg-wrap eg-events">
        {list.map((p) => {
          const at = item("projects", p.id);
          const pic = safeUrl(p.images[0]);
          return (
            <article key={p.id} className="eg-event">
              <span className="eg-frame" {...ed(`${at}.images.0`, "image", "عکس")}>
                {pic && <img src={pic} alt="" loading="lazy" />}
              </span>
              <div>
                <h2 {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</h2>
                <div className="eg-body" {...ed(`${at}.description`, "multiline", "متن")}>
                  <Para text={p.description} />
                </div>
                <PageLink to="/contact" link={link} className="eg-btn">
                  هماهنگی و رزرو
                </PageLink>
              </div>
            </article>
          );
        })}
        {editing && (
          <span className="p-ghost" {...ed("projects", "newimage", "رویداد تازه")}>
            + رویداد تازه
          </span>
        )}
      </section>
    </>
  );
}

/* ───────────── About ───────────── */

function About(view: View) {
  const { ctx, shop } = view;
  const data = ctx.data;
  const gallery = data.site?.gallery ?? [];
  const stats = shop.stats ?? [];
  const statsBg = safeUrl(data.site?.heroImage);
  const posts = livePosts(shop).slice(0, 3);
  return (
    <>
      <PageTop view={view} title="درباره‌ی ما" />
      <section className="eg-sec eg-wrap narrow eg-about">
        {gallery.length > 0 && (
          <div className="eg-gallery">
            {gallery.map((g, k) => (
              <input key={g.id} type="radio" name="eg-g" id={`eg-g${k}`} className="eg-radio" />
            ))}
            <div className="eg-gallery-main">
              {gallery.map((g, k) => (
                <figure key={g.id}>
                  <img src={safeUrl(g.image)} alt={g.title} loading={k ? "lazy" : undefined} {...ed(`${item("site.gallery", g.id)}.image`, "image", "عکس")} />
                  <label htmlFor={`eg-g${(k - 1 + gallery.length) % gallery.length}`} className="eg-arrow prev" aria-label="عکس قبلی">
                    <Svg name="prev" />
                  </label>
                  <label htmlFor={`eg-g${(k + 1) % gallery.length}`} className="eg-arrow next" aria-label="عکس بعدی">
                    <Svg name="next" />
                  </label>
                </figure>
              ))}
            </div>
            <div className="eg-thumbs">
              {gallery.map((g, k) => (
                <label key={g.id} htmlFor={`eg-g${k}`}>
                  <img src={safeUrl(g.image)} alt="" loading="lazy" />
                </label>
              ))}
            </div>
            <style>{galleryCss(gallery.length)}</style>
          </div>
        )}
        {view.editing && (
          <span className="p-ghost eg-add" {...ed("site.gallery", "newimage", "افزودن عکس به گالری")}>
            + افزودن عکس به گالری
          </span>
        )}
        <div className="eg-body" {...ed("basics.summary", "multiline", "متن درباره‌ی ما")}>
          <Para text={data.basics.summary} />
        </div>
      </section>
      {stats.length > 0 && (
        <section className="eg-stats">
          <span className="eg-stats-bg" {...ed("site.heroImage", "image", "عکس پس‌زمینه")}>
            {statsBg && <img src={statsBg} alt="" loading="lazy" />}
          </span>
          <div className="eg-wrap eg-stats-in">
            {stats.slice(0, 3).map((s, k) => {
              const at = item("site.shop.stats", s.id);
              return (
                <div key={s.id}>
                  <Svg name={["team", "alarm", "check"][k % 3]!} className="eg-ico" />
                  <b {...ed(`${at}.value`, "text", "عدد")}>{s.value}</b>
                  <span {...ed(`${at}.label`, "text", "عنوان")}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <Reviews view={view} />
      {posts.length > 0 && (
        <section className="eg-sec">
          <Head kicker="خبرها" title="بلاگ ما" center />
          <div className="eg-wrap eg-posts">
            {posts.map((p) => (
              <article key={p.id}>
                <PageLink to={`/blog/${p.id}`} link={view.link} className="eg-frame">
                  {safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}
                </PageLink>
                {p.date && <Kicker>{faDate(p.date)}</Kicker>}
                <h3>{p.title}</h3>
                <PageLink to={`/blog/${p.id}`} link={view.link} className="eg-btn small">
                  ادامه‌ی مطلب
                </PageLink>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/**
 * The gallery shows each picture for a few seconds in turn (CSS only, no scripts). Once a visitor
 * chooses a picture (an arrow or a thumbnail checks its radio) it stops on that one.
 */
const GALLERY_STEP = 5;
function galleryCss(n: number): string {
  if (n < 1) return "";
  const p = 100 / n;
  const fade = Math.min(p / 5, 4);
  const cycle = n * GALLERY_STEP;
  const shown = (on: string, off: string) =>
    `0% { ${off} } ${fade.toFixed(2)}% { ${on} } ${p.toFixed(2)}% { ${on} } ${(p + fade).toFixed(2)}% { ${off} } 100% { ${off} }`;
  const rules = [
    `@keyframes eg-g${n} { ${shown("opacity: 1; visibility: visible;", "opacity: 0; visibility: hidden;")} }`,
    `@keyframes eg-t${n} { ${shown("opacity: 1; outline-color: var(--eg-red);", "opacity: .55; outline-color: transparent;")} }`,
  ];
  for (let k = 0; k < n; k++) {
    const delay = (k - n) * GALLERY_STEP;
    rules.push(`.eg-gallery-main figure:nth-child(${k + 1}) { animation: eg-g${n} ${cycle}s ${delay}s linear infinite; }`);
    rules.push(`.eg-thumbs label:nth-child(${k + 1}) { animation: eg-t${n} ${cycle}s ${delay}s linear infinite; }`);
    rules.push(`#eg-g${k}:checked ~ .eg-gallery-main figure:nth-child(${k + 1}) { opacity: 1; visibility: visible; }`);
    rules.push(`#eg-g${k}:checked ~ .eg-thumbs label:nth-child(${k + 1}) { opacity: 1; outline-color: var(--eg-red); }`);
  }
  if (n === 1) rules.push(`.eg-gallery-main figure, .eg-thumbs label { animation: none; opacity: 1; visibility: visible; }`);
  return rules.join("\n");
}

function Post(view: View & { id: string }) {
  const p = livePosts(view.shop).find((x) => x.id === view.id)!;
  const pic = safeUrl(p.image);
  return (
    <>
      <PageTop view={view} title={p.title} trail={pageOn(view.ctx.data, "/about") ? { label: "درباره‌ی ما", to: "/about" } : undefined} />
      <section className="eg-sec eg-wrap narrow eg-post">
        {pic && (
          <span className="eg-frame">
            <img src={pic} alt="" />
          </span>
        )}
        {p.date && <Kicker>{faDate(p.date)}</Kicker>}
        <div className="eg-body">
          <Para text={p.text} />
        </div>
        <PageLink to="/appointment" link={view.link} className="eg-btn">
          رزرو اتاق
        </PageLink>
      </section>
    </>
  );
}

/* ───────────── Contact ───────────── */

function Contact(view: View) {
  const { ctx, editing, link } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const map = safeUrl(site?.mapUrl);
  const embed = mapEmbed(map);
  return (
    <>
      <PageTop view={view} title="تماس با ما" />
      <section className="eg-sec eg-wrap eg-contact">
        <div>
          <ul className="eg-info">
            <li>
              <Svg name="pin" />
              <span {...ed("site.address", "text", "نشانی")}>{site?.address}</span>
            </li>
            {b.phone && (
              <li>
                <Svg name="phone" />
                <a href={telHref(b.phone)} {...ed("basics.phone", "text", "تلفن")}>
                <Phone value={b.phone} />
              </a>
              </li>
            )}
            {b.email && (
              <li>
                <Svg name="mail" />
                <a href={`mailto:${b.email}`} {...ed("basics.email", "text", "ایمیل")}>
                  {b.email}
                </a>
              </li>
            )}
            <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "multiline", "ساعات کاری")}>
              <li>
                <Svg name="clock" />
                <span className="eg-lines" {...ed("site.contactNote", "multiline", "ساعات کاری")}>
                  {site?.contactNote}
                </span>
              </li>
            </Opt>
          </ul>
          {embed ? (
            <iframe className="eg-map" src={embed} title="نقشه" loading="lazy" {...ed("site.mapUrl", "url", "لینک نقشه")} />
          ) : (
            editing && (
              <span className="p-ghost" {...ed("site.mapUrl", "url", "لینک نقشه")}>
                + لینک نقشه
              </span>
            )
          )}
        </div>
        <form method="post" action={link("/_form")} className="eg-msg">
          <FormMeta kind="contact" back="/contact" />
          <h2 {...ed("site.contactTitle", "text", "عنوان فرم")}>{site?.contactTitle || "برای ما پیام بفرستید"}</h2>
          <p className="eg-body" {...ed("site.contactText", "multiline", "متن بالای فرم")}>
            {site?.contactText}
          </p>
          <input name="name" placeholder="نام شما" required aria-label="نام شما" autoComplete="name" defaultValue={view.visitor.customer?.name} />
          <input name="bcc" placeholder="ایمیل یا شماره‌ی تماس" required aria-label="ایمیل یا شماره‌ی تماس" dir="auto" />
          <textarea name="body" placeholder="پیام شما" rows={6} required aria-label="پیام شما" />
          <label className="eg-agree">
            <input type="checkbox" required /> موافقم که اطلاعات این فرم برای پاسخ به من ذخیره شود.
          </label>
          <button type="submit" className="eg-btn">
            ارسال پیام
          </button>
        </form>
      </section>
    </>
  );
}

/* ───────────── Booking ───────────── */

const PLAYERS = [2, 3, 4, 5, 6];

function Appointment(view: View) {
  const { shop, visitor, link, editing } = view;
  const rooms = roomsOf(shop);
  const q = visitor.query;
  const room = rooms.find((r) => r.id === q.room) ?? rooms[0];
  const schedule = shop.schedule ?? { ...defaultSchedule(), byService: true };
  const taken = takenFor(schedule, visitor.taken ?? {}, room?.name);
  const facts = (r: Product) => (r.description ?? "").split("\n").filter((x) => x.trim()).slice(0, 3);
  return (
    <>
      <PageTop view={view} title="رزرو اتاق" />
      <section className="eg-sec eg-wrap eg-appt">
        <h2 className="eg-step">۱. اتاق را انتخاب کنید</h2>
        <div className="eg-pick">
          {rooms.map((r) => {
            const pic = safeUrl(r.images[0]);
            return (
              <a key={r.id} href={`${link("/appointment")}?room=${encodeURIComponent(r.id)}#eg-cal`} className={`eg-pick-room${r.id === room?.id ? " on" : ""}`} aria-current={r.id === room?.id ? "true" : undefined}>
                <span>{pic && <img src={pic} alt="" loading="lazy" />}</span>
                <b>{r.name}</b>
                <small>
                  {facts(r).join(" · ")}
                  {r.price > 0 && (
                    <>
                      {facts(r).length ? " · " : ""}
                      {formatToman(r.salePrice ?? r.price, view.ctx.data.locale)}
                    </>
                  )}
                </small>
              </a>
            );
          })}
        </div>
        {room ? (
          <>
            <h2 className="eg-step" id="eg-cal">
              ۲. روز و سانس «{room.name}» را انتخاب کنید
            </h2>
            <BookingPicker
              link={link}
              path="/appointment"
              schedule={schedule}
              taken={taken}
              query={q}
              keep={{ room: room.id }}
              button="ثبت رزرو"
              hint={<p>روزهای پررنگ سانس خالی دارند. بعد از انتخاب روز، سانس‌های خالی همین اتاق و فرم رزرو این‌جا می‌آید.</p>}
            >
              <input type="hidden" name="service" value={room.name} />
              <label className="half">
                تعداد بازیکن‌ها
                <select name="guests" defaultValue={q.guests ?? "4"}>
                  {PLAYERS.map((n) => (
                    <option key={n} value={n}>
                      {fa(n)} نفر
                    </option>
                  ))}
                </select>
              </label>
              <label className="half">
                نام و نام خانوادگی *
                <input name="name" required autoComplete="name" defaultValue={visitor.customer?.name} />
              </label>
              <label className="half">
                شماره‌ی موبایل *
                <input name="phone" required inputMode="tel" dir="ltr" autoComplete="tel" defaultValue={visitor.customer?.phone} />
              </label>
              <label className="half">
                ایمیل (اختیاری)
                <input name="email" type="email" dir="auto" autoComplete="email" />
              </label>
              <label>
                توضیحات (اختیاری)
                <textarea name="body" rows={2} placeholder="مثلاً جشن تولد یا بازی سازمانی" />
              </label>
            </BookingPicker>
            <p className="eg-mine">
              <PageLink to="/account" link={link}>
                {visitor.customer ? "رزروهای من" : "ورود یا ثبت‌نام"}
              </PageLink>
              <span>·</span>
              <PageLink to="/track" link={link}>
                پیگیری رزرو با کد
              </PageLink>
            </p>
          </>
        ) : (
          <p className="eg-muted">فعلاً اتاقی برای رزرو نیست؛ لطفاً تماس بگیرید.</p>
        )}
        {editing && <p className="eg-muted">روزها و ساعت‌های کاری، طول هر سانس و تعطیلی‌ها را در «⚙️ مدیریت ← ساعت کاری و ظرفیت» و اتاق‌ها را در «اتاق‌ها» تعیین کنید.</p>}
      </section>
    </>
  );
}

function Account(view: View) {
  return (
    <>
      <PageTop view={view} title={view.visitor.customer ? "رزروهای من" : "ورود یا ثبت‌نام"} />
      <section className="eg-sec eg-wrap eg-visitor">
        <AccountPage link={view.link} page={view.page} visitor={view.visitor} bookings="only" />
        {!view.visitor.customer && (
          <p className="eg-muted eg-center">
            بدون حساب هم می‌توانید رزرو کنید و آن را با{" "}
            <PageLink to="/track" link={view.link}>
              کد پیگیری
            </PageLink>{" "}
            دنبال کنید.
          </p>
        )}
      </section>
    </>
  );
}

function Track(view: View) {
  return (
    <>
      <PageTop view={view} title="پیگیری رزرو" />
      <section className="eg-sec eg-wrap eg-visitor">
        <TrackBooking link={view.link} visitor={view.visitor} />
      </section>
    </>
  );
}

/* ───────────── Example content (from the reference, in Persian) ───────────── */

export function escapeSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`eg-${n}`);
  const room = (id: string, name: string, pic: string, price: number, facts: string): Product => ({ id, name, price, images: [img(`room-${pic}`)], description: facts });
  const step = (id: string, institution: string, description: string) => ({ id, institution, description, period: { start: "2024-01", end: "2024-06", current: false } });
  const post = (id: string, title: string, image: string, date: string) => ({
    id,
    title,
    image: img(image),
    date,
    text: "اتاق فرار فقط یک بازی نیست؛ تمرینی است برای فکر کردن با هم، گوش دادن به دیگران و تصمیم گرفتن زیر فشار زمان.\nدر این مطلب چند نکته‌ی ساده را مرور می‌کنیم که به تیم شما کمک می‌کند معماها را سریع‌تر حل کند: از تقسیم کار و حرف زدن بلند درباره‌ی هر سرنخ تا کنار گذاشتن چیزهایی که یک بار استفاده شده‌اند.\nمهم‌تر از همه، از بازی لذت ببرید؛ حتی اگر به موقع بیرون نیایید، خاطره‌اش تا مدت‌ها با شما می‌ماند.",
  });
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "گریزگاه",
      jobTitle: "اتاق فرار",
      avatarUrl: "",
      email: "info@example.com",
      phone: "021 2233 4455",
      summary:
        "گریزگاه از سال ۱۳۹۶ با یک اتاق کوچک شروع کرد و امروز نُه اتاق فرار با داستان‌های متفاوت دارد؛ از فرار از زندان و پرونده‌های کارآگاهی تا ماجراهای ترسناک و اتاق ویژه‌ی کودکان. هر اتاق را تیمی از طراحان بازی، نویسنده‌ها و صحنه‌پردازها ساخته‌اند تا از لحظه‌ی ورود حس کنید وارد یک داستان واقعی شده‌اید.\nما باور داریم بهترین خاطره‌ها را با هم می‌سازیم. برای همین هر بازی خصوصی است و فقط شما و همراهانتان در اتاق هستید. راهنمای بازی از پشت دوربین همراهتان است و اگر جایی گیر کردید، سرنخ می‌دهد تا هیجان بازی تا آخرین دقیقه حفظ شود.",
      links: [
        { id: "sl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "sl2", type: "telegram", url: "https://t.me/example" },
        { id: "sl3", type: "whatsapp", url: "https://wa.me/example" },
        { id: "sl4", type: "eitaa", url: "https://eitaa.com/example" },
      ],
    },
    skills: [
      { id: "k1", name: "زمان", description: "در هر اتاق تیم شما ۴۵ تا ۶۰ دقیقه برای فرار وقت دارد. پیش از شروع، هر چیزی را که لازم است بدانید برایتان توضیح می‌دهیم." },
      { id: "k2", name: "هزینه", description: "هزینه‌ی هر سانس بسته به اتاق، روز هفته و ساعت بازی بین ۹۰۰ هزار تا یک میلیون و ۴۰۰ هزار تومان است." },
      { id: "k3", name: "نفرات", description: "در هر اتاق حداکثر شش نفر بازی می‌کنند و هر سانس فقط برای یک گروه است." },
    ],
    education: [
      step("h1", "اتاق ماجرایتان را انتخاب کنید", "از میان نُه اتاق، داستانی را انتخاب کنید که بیشتر به سلیقه‌ی گروه شما می‌خورد."),
      step("h2", "روز و سانس را انتخاب کنید", "در تقویم، روزهای پررنگ سانس خالی دارند؛ روز و ساعت دلخواه را بزنید."),
      step("h3", "تعداد بازیکن‌ها را بگویید", "هر اتاق برای ۲ تا ۶ نفر طراحی شده؛ تعداد همراهانتان را مشخص کنید."),
      step("h4", "تأیید رزرو را بگیرید", "کد پیگیری فوراً نمایش داده می‌شود و برای تأیید نهایی با شما تماس می‌گیریم."),
    ],
    projects: [
      {
        id: "v1",
        title: "رویدادهای سازمانی",
        description: "فعالیت‌های تیمی برای بهره‌وری و حال‌وهوای محیط کار ارزشمندند؛ البته اگر درست انجام شوند.\nبه همین دلیل گریزگاه کمک می‌کند یک رویداد تیم‌سازی فراموش‌نشدنی برگزار کنید. در شصت دقیقه‌ی پرهیجان، همکاران شما نه فقط لذت می‌برند، بلکه مهارت‌های مختلفشان هم محک می‌خورد و قوی‌تر می‌شود.",
        technologies: [],
        images: [img("event-corporate")],
      },
      {
        id: "v2",
        title: "جشن تولد",
        description: "دنبال چیزی متفاوت برای جشن تولدتان هستید؟ چیزی که هفته‌ها درباره‌اش حرف بزنید؟ تولدتان را در گریزگاه جشن بگیرید!\nشما و مهمان‌هایتان در اتاقی با یک مأموریت ویژه حبس می‌شوید و شصت دقیقه وقت دارید معماها را حل کنید و فرار کنید.\nمی‌توانید کل مجموعه یا فقط یک اتاق را برای جشن‌تان رزرو کنید.",
        technologies: [],
        images: [img("event-birthday")],
      },
      {
        id: "v3",
        title: "خواستگاری",
        description: "می‌خواهید خواستگاری‌تان بی‌نظیر و فراموش‌نشدنی باشد؟ فقط شما دو نفر در اتاق؛ کنار هم معماها را حل می‌کنید و در مسیر، عزیزتان حلقه‌ای پنهان را پیدا می‌کند.\nمی‌توانیم اتاق را با گل و تزیینات آماده کنیم یا بعد از بیرون آمدن از اتاق، غافلگیری را ادامه دهیم. هر ایده‌ای دارید با ما در میان بگذارید.",
        technologies: [],
        images: [img("event-proposal")],
      },
      {
        id: "v4",
        title: "رویدادهای خصوصی",
        description: "برای ساختن یک خاطره‌ی ماندگار، هیچ راهی بهتر از فرار گروهی از یک اتاق نیست.\nبرای رویداد خصوصی شما زمانی هم برای پذیرایی، هدیه‌ها و هر غافلگیری دیگری در نظر می‌گیریم.\nرویدادهای روزانه شنبه تا چهارشنبه از ۸ صبح تا ۷ عصر برگزار می‌شوند. برای رزرو با ما تماس بگیرید.",
        technologies: [],
        images: [img("event-private")],
      },
    ],
    site: {
      ...base.site,
      aboutTitle: "ماجرای فرار خصوصی شما",
      aboutText:
        "هر چیزی در اتاق شما را در حال‌وهوای ماجرا فرو می‌برد: دکورهای باورنکردنی، جلوه‌های خیره‌کننده و پیچش‌های غافلگیرکننده‌ی داستان.\nشما فقط معما حل نمی‌کنید؛ در طول بازی یک داستان کارآگاهی واقعی را گره‌گشایی می‌کنید.\nتجربه‌ای خصوصی با دوستانتان دارید؛ فقط نزدیک‌ترین و مطمئن‌ترین آدم‌ها، بدون غریبه.",
      aboutImage: img("welcome"),
      accentImage: img("clock"),
      heroImage: img("stats"),
      contactTitle: "برای ما پیام بفرستید",
      contactText: "اگر سؤالی دارید یا اطلاعات بیشتری می‌خواهید، از فرم زیر برای ما پیام بفرستید.",
      contactNote: "همه‌روزه: ۱۰ صبح تا ۱۱ شب\nجمعه‌ها: ۱۲ ظهر تا ۱۱ شب",
      address: "تهران، خیابان ولیعصر، نرسیده به پارک ساعی، پلاک ۴۵",
      mapUrl: "https://www.openstreetmap.org/?mlat=35.7445&mlon=51.4103",
      gallery: [1, 2, 3, 4, 5].map((k) => ({ id: `g${k}`, title: `گریزگاه ${k}`, image: img(`gallery${k}`) })),
      testimonials: [
        { id: "t1", name: "کیانا رستمی", text: "همین امشب بازی کردیم و واقعاً ارزشش را داشت! معماها خیلی هوشمندانه بودند و چون متنوع بودند، هر کدام از ما فرصت درخشیدن پیدا کرد." },
        { id: "t2", name: "آرش موسوی", text: "اولین تجربه‌ی اتاق فرار ما بود و برای تولد دوستم رزرو کرده بودیم؛ عالی بود! خیلی چالش‌برانگیز و همه عاشقش شدیم. به موقع بیرون نیامدیم ولی حتماً دوباره می‌آییم." },
        { id: "t3", name: "نیلوفر احمدی", text: "دکور و صداها آن‌قدر واقعی بود که یادمان رفت در یک بازی هستیم. راهنمای بازی هم دقیقاً وقتی لازم بود کمک کرد." },
      ],
      shop: {
        categories: [],
        heroImage: img("hero"),
        heroKicker: "یک سرگرمی متفاوت!",
        heroTitle: "بهترین بازی‌های فرار",
        newTitle: "نسل تازه‌ی تیم‌سازی سازمانی",
        newText: "همه دوست داریم «مدیر باحال» باشیم؛ این فرصت شماست! تیم‌تان را به گریزگاه بیاورید تا هم روحیه بگیرند و هم ارتباط، نظم و تفکر انتقادی را تمرین کنند.\nبعد از بازی، تحلیل ده‌دقیقه‌ای از نقاط قوت و ضعف تیم و آمار هر بازیکن را دریافت می‌کنید.",
        newImage: img("corporate"),
        perks: [
          { id: "f1", title: "دوستان و خانواده", text: "ماجرایی هیجان‌انگیز را با خانواده و دوستانتان تجربه کنید!" },
          { id: "f2", title: "کارآگاه‌های آماتور", text: "خودتان کارآگاه آماتورید یا ایده‌ی خاصی برای قرار عاشقانه دارید." },
          { id: "f3", title: "دنبال هیجان", text: "حوصله‌تان سر رفته و دنبال چالش تازه‌ای هستید؟" },
          { id: "f4", title: "تیم‌سازی", text: "رویداد سازمانی برای تقویت روحیه‌ی همکاری در تیم شما." },
        ],
        banners: [
          { id: "n1", kicker: "تیم‌تان را دور هم جمع کنید!", title: "با هم مجموعه‌ای از معماها را حل کنید", image: img("video"), link: "https://www.aparat.com/" },
          { id: "n2", kicker: "کارت هدیه", title: "تجربه، بهترین هدیه است!", text: "کارت‌های هدیه در بسته‌بندی زیبا آماده‌اند و هدیه‌ای عالی برای عزیزانتان هستند. دارنده‌ی کارت تا سه ماه می‌تواند سانس دلخواهش را رزرو کند.", image: sampleImage("eg-gift", "png") },
        ],
        lookImage: img("gift-bg"),
        trendImage: img("players"),
        discoverImage: img("top"),
        showcaseTitle: "۶۰ دقیقه؛ زمان شروع شد…",
        faqTitle: "پاسخ همه‌ی سؤال‌هایتان این‌جاست",
        faq: [
          { id: "q1", q: "اتاق فرار چیست؟", a: "در هر بازی، شما و تیم‌تان برای مدت مشخصی در اتاقی حبس می‌شوید و باید راه فرار را پیدا کنید. اتاق‌ها پر از سرنخ، درهای مخفی و وسایل پنهان‌اند." },
          { id: "q2", q: "آیا این‌جا خانه‌ی وحشت است؟", a: "نه؛ بیشتر اتاق‌ها معمایی و کارآگاهی‌اند. فقط اتاق‌های «دلقک» و «دیوانه» حال‌وهوای ترسناک دارند." },
          { id: "q3", q: "اگر دیر برسم، باز هم می‌توانم بازی کنم؟", a: "تا ۱۵ دقیقه تأخیر را می‌پذیریم، اما از زمان بازی شما کم می‌شود؛ چون سانس بعدی منتظر است." },
          { id: "q4", q: "چقدر برای تمام کردن بازی وقت داریم؟", a: "بسته به اتاق، بین ۴۵ تا ۶۰ دقیقه." },
          { id: "q5", q: "می‌خواهم زمان رزروم را تغییر دهم!", a: "تا ۲۴ ساعت پیش از سانس تماس بگیرید تا زمان دیگری برایتان هماهنگ کنیم." },
          { id: "q6", q: "محدودیت سنی دارد؟", a: "برای اتاق‌های ترسناک حداقل ۱۶ سال؛ کودکان زیر ۱۲ سال فقط با همراه بزرگ‌سال بازی می‌کنند." },
          { id: "q7", q: "چند نفر هم‌زمان می‌توانند بازی کنند؟", a: "هر اتاق برای ۲ تا ۶ نفر طراحی شده است." },
          { id: "q8", q: "باید زودتر برسم؟", a: "بله؛ لطفاً ۱۵ دقیقه زودتر بیایید تا توضیحات پیش از بازی را بشنوید." },
          { id: "q9", q: "رزرو لازم است؟", a: "بله؛ هر سانس فقط برای یک گروه است و باید از قبل رزرو شود." },
          { id: "q10", q: "چه چیزی همراه بیاوریم؟", a: "فقط خودتان و یک ذهن آماده! لباس راحت بپوشید؛ وسایل شخصی در کمد امن می‌ماند." },
          { id: "q11", q: "هزینه‌ی بازی چقدر است؟", a: "قیمت هر اتاق در صفحه‌ی رزرو کنار نام آن آمده است و برای کل گروه حساب می‌شود." },
          { id: "q12", q: "ترسناک است؟", a: "به اتاق بستگی دارد؛ اگر اهل ترس نیستید، اتاق‌های کارآگاهی و ماجرایی را انتخاب کنید." },
        ],
        stats: [
          { id: "m1", value: "۹۷۶۵۳", label: "بازیکن فراری" },
          { id: "m2", value: "۱۲۳۴۵۶۷", label: "دقیقه بازی" },
          { id: "m3", value: "۵۸۱۴", label: "نظر مثبت" },
        ],
        products: [
          room("r1", "فرار از زندان", "prison", 1200000, "۲ تا ۶ نفر\n۶۰ دقیقه\nسختی: زیاد"),
          room("r2", "شرلوک هلمز", "sherlock", 1100000, "۲ تا ۵ نفر\n۶۰ دقیقه\nسختی: متوسط"),
          room("r3", "راز جنگل", "jungle", 1000000, "۲ تا ۶ نفر\n۶۰ دقیقه\nسختی: متوسط"),
          room("r4", "بانک مرکزی", "bank", 1300000, "۳ تا ۶ نفر\n۶۰ دقیقه\nسختی: خیلی زیاد"),
          room("r5", "دیوانه", "maniac", 1400000, "۲ تا ۵ نفر\n۶۰ دقیقه\nترسناک"),
          room("r6", "سقوط بشقاب‌پرنده", "ufo", 1100000, "۲ تا ۶ نفر\n۶۰ دقیقه\nسختی: متوسط"),
          room("r7", "پناهگاه", "bunker", 1000000, "۲ تا ۶ نفر\n۴۵ دقیقه\nسختی: متوسط"),
          room("r8", "دلقک", "horror", 1400000, "۳ تا ۶ نفر\n۶۰ دقیقه\nترسناک"),
          room("r9", "اتاق کودکان", "kids", 900000, "۲ تا ۶ نفر\n۴۵ دقیقه\nبرای ۷ تا ۱۲ سال"),
        ],
        schedule: { days: [0, 1, 2, 3, 4, 5, 6], start: "10:00", end: "23:00", slot: 90, capacity: 1, ahead: 30, closed: [], byService: true },
        posts: [
          post("b1", "موزه‌ی جهانی خطای دید", "post1", "2026-10-21"),
          post("b2", "چقدر برای تمام کردن بازی وقت داریم؟", "post2", "2026-10-12"),
          post("b3", "چهار نکته برای موفقیت تیم شما", "post3", "2026-10-02"),
        ],
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
@font-face { font-family: "Escape Lalezar"; src: url("/_assets/fonts/escape-lalezar.woff") format("woff"); font-display: swap; }
@font-face { font-family: "Kafe Markazi"; src: url("/_assets/fonts/kafe-markazi.woff") format("woff"); font-display: swap; }
.eg {
  --eg-red: var(--color-primary);
  --eg-bg: #0B0A0A;
  --eg-deep: #050404;
  --eg-ink: #FFFFFF;
  --eg-text: #BDB6B0;
  --eg-line: rgb(255 255 255 / .1);
  --eg-head: "Escape Lalezar", var(--font-heading), sans-serif;
  --eg-script: "Kafe Markazi", var(--font-body), serif;
  background: var(--eg-bg);
  color: var(--eg-text);
  line-height: 1.95;
}
.eg a { color: inherit; text-decoration: none; }
.eg img { display: block; max-width: 100%; }
.eg h1, .eg h2, .eg h3, .eg h4 { margin: 0; color: var(--eg-ink); font-family: var(--eg-head); font-weight: 400; line-height: 1.35; }
.eg-wrap { width: min(1280px, calc(100% - 48px)); margin-inline: auto; }
.eg-wrap.wide { width: min(1880px, calc(100% - 24px)); }
.eg-wrap.narrow { width: min(860px, calc(100% - 48px)); }
.eg-sec { position: relative; padding: clamp(60px, 8cqi, 120px) 0; }
.eg-center { margin: clamp(30px, 4cqi, 50px) 0 0; text-align: center; }
.eg-muted { color: var(--eg-text); opacity: .75; }
.eg-body { color: var(--eg-text); font-size: 16.5px; }
.eg-body p { margin: 0 0 14px; }
.eg-lines { white-space: pre-line; }
.eg-ico { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.eg-ico.big { width: 56px; height: 56px; color: var(--eg-red); stroke-width: 1.6; }
.eg-kicker { display: block; color: var(--eg-red); font-family: var(--eg-script); font-size: clamp(18px, 1.5cqi, 22px); font-style: normal; line-height: 1.6; }
.eg-headline h2 { font-size: clamp(34px, 3.8cqi, 56px); }
.eg-headline.center { text-align: center; margin-bottom: clamp(30px, 4cqi, 50px); }

/* The red button with a white offset edge. */
.eg-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 52px; padding: 0 34px; border: 0; background: var(--eg-red); color: #fff !important; box-shadow: -4px 4px 0 #fff; font-family: var(--eg-head); font-size: 18px; cursor: pointer; transition: box-shadow .3s, transform .3s; }
.eg-btn:hover { box-shadow: 0 0 0 #fff; transform: translate(-2px, 2px); }
.eg-btn.small { min-height: 42px; padding: 0 22px; font-size: 16px; }

/* Header */
.eg-head { position: absolute; inset-inline: 0; top: 0; z-index: 5; }
.eg-top { background: rgb(10 9 9 / .92); border-bottom: 1px solid var(--eg-line); font-size: 13px; }
.eg-top-in { display: flex; justify-content: space-between; gap: 20px; padding: 6px clamp(16px, 2cqi, 36px); }
.eg-top-info, .eg-top-social { display: flex; flex-wrap: wrap; gap: 6px 26px; }
.eg-top a:hover { color: #fff; }
.eg-bar { display: flex; align-items: center; gap: clamp(14px, 2cqi, 40px); min-height: 100px; padding: 0 clamp(16px, 2cqi, 36px); border-bottom: 1px solid var(--eg-line); }
.eg-logo { display: flex; align-items: center; gap: 10px; flex: none; }
.eg-logo-icon { display: grid; width: 46px; height: 56px; }
.eg-logo-icon img { width: 100%; height: 100%; object-fit: contain; }
.eg-logo-icon svg { width: 100%; height: 100%; }
.eg-logo-icon .sh { fill: var(--eg-red); }
.eg-logo-icon .bd { fill: #fff; }
.eg-logo-icon .kh { fill: var(--eg-red); }
.eg-logo-text { display: grid; line-height: 1; }
.eg-logo-text b { position: relative; color: #fff; font-family: var(--eg-head); font-size: 50px; font-weight: 400; text-shadow: -4px 3px 0 var(--eg-red); }
.eg-logo-text small { margin-top: -4px; color: var(--eg-red); font-family: var(--eg-script); font-size: 20px; letter-spacing: 1px; }
.eg-nav { display: flex; justify-content: center; gap: clamp(18px, 2.6cqi, 50px); flex: 1; font-family: var(--eg-head); font-size: 21px; }
.eg-nav a { position: relative; color: #A9A29C; transition: color .3s; }
.eg-nav a::after { content: ""; position: absolute; inset-inline: -6px; top: 52%; height: 3px; background: var(--eg-red); transform: rotate(-12deg) scaleX(0); transition: transform .35s; }
.eg-nav a:hover, .eg-nav a[aria-current="page"] { color: #fff; }
.eg-nav a:hover::after, .eg-nav a[aria-current="page"]::after { transform: rotate(-12deg) scaleX(1); }
.eg-tools { display: flex; align-items: center; gap: 18px; }
.eg-acc { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: rgb(232 64 58 / .25); color: #fff; transition: background .3s; }
.eg-acc:hover, .eg-acc[aria-current="page"] { background: var(--eg-red); }
.eg-acc .eg-ico { width: 20px; height: 20px; }
.eg-burger { display: none; }

/* Hero */
.eg-hero { position: relative; display: grid; place-items: center; min-height: min(100vh, 980px); overflow: hidden; text-align: center; }
.eg-hero-pic, .eg-ptop-pic, .eg-corp-bg, .eg-video-bg, .eg-gift-bg, .eg-stats-bg { position: absolute; inset: 0; }
.eg-hero-pic img, .eg-ptop-pic img, .eg-corp-bg img, .eg-video-bg img, .eg-gift-bg img, .eg-stats-bg img { width: 100%; height: 100%; object-fit: cover; }
.eg-hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(rgb(0 0 0 / .35), rgb(0 0 0 / .15) 60%, var(--eg-bg)); pointer-events: none; }
.eg-hero-in { position: relative; z-index: 1; display: grid; justify-items: center; gap: 18px; padding: 220px 24px 120px; }
.eg-hero h1 { font-size: clamp(50px, 8.6cqi, 140px); line-height: 1.15; text-shadow: 0 4px 30px rgb(0 0 0 / .5); }
.eg-hero .eg-kicker { font-size: clamp(22px, 2.2cqi, 32px); }

/* Page top */
.eg-ptop { position: relative; display: grid; place-items: center; min-height: clamp(300px, 28cqi, 440px); padding-top: 110px; box-sizing: border-box; overflow: hidden; text-align: center; border-bottom: 1px solid var(--eg-line); }
.eg-ptop::after { content: ""; position: absolute; inset: 0; background: linear-gradient(rgb(0 0 0 / .45), rgb(0 0 0 / .3)); }
.eg-ptop-in { position: relative; z-index: 1; padding: 30px 24px; }
.eg-ptop h1 { font-size: clamp(38px, 4.8cqi, 74px); }
.eg-crumbs { color: var(--eg-red); font-family: var(--eg-script); font-size: 22px; }
.eg-crumbs a:hover { color: #fff; }

/* Two columns: a framed picture under its heading, and points beside it, over red numbers */
.eg-numbers { background: var(--eg-bg) center / cover no-repeat; }
.eg-split { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(30px, 5cqi, 80px); align-items: center; }
.eg-split-pic { position: relative; padding-top: clamp(70px, 6cqi, 100px); }
.eg-headline.over { position: absolute; top: 0; inset-inline-start: clamp(30px, 8%, 110px); z-index: 1; }
.eg-headline.over h2 { max-width: 12ch; line-height: 1.25; text-shadow: 0 3px 20px rgb(0 0 0 / .6); }
.eg-frame { display: block; position: relative; border: 1px solid #2a2626; overflow: hidden; background: #141212; }
.eg-frame img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s; }
.eg-split-pic .eg-frame { aspect-ratio: 1.75; }
.eg-points { display: grid; gap: clamp(24px, 3cqi, 44px); margin: 0; padding: 0; list-style: none; }
.eg-points li { display: grid; grid-template-columns: 34px 1fr; gap: 14px; align-items: start; }
.eg-points b { color: var(--eg-red); font-family: var(--eg-script); font-size: 30px; line-height: 1; }
.eg-points p { margin: 0; font-size: 16.5px; }
.eg-points.icons li { grid-template-columns: 50px 1fr; align-items: center; }
.eg-ico.ring { width: 46px; height: 46px; padding: 10px; border: 1.5px solid var(--eg-red); border-radius: 50%; color: var(--eg-red); stroke-width: 2.4; box-sizing: border-box; }
.eg-play { position: absolute; inset: 0; margin: auto; display: grid; place-items: center; width: 56px; height: 56px; background: var(--eg-red); color: #fff; box-shadow: -4px 4px 0 #fff; }
.eg-play .eg-ico { fill: currentColor; stroke: none; }

/* Rooms */
.eg-rooms { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(14px, 2cqi, 30px); }
.eg-room { position: relative; display: grid; place-items: center; aspect-ratio: 1.6; overflow: hidden; border: 1px solid #2a2626; background: #141212; }
.eg-room img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s, filter .5s; }
.eg-room::after { content: ""; position: absolute; inset: 0; background: rgb(0 0 0 / .25); transition: background .4s; }
.eg-room b { position: relative; z-index: 1; padding: 0 12px; color: #fff; font-family: var(--eg-head); font-size: clamp(22px, 2.2cqi, 32px); font-weight: 400; text-align: center; text-shadow: 0 2px 16px rgb(0 0 0 / .7); }
.eg-room:hover img { transform: scale(1.06); }
.eg-room:hover::after { background: rgb(0 0 0 / .45); }

/* Corporate band */
.eg-corp { overflow: hidden; }
.eg-corp-bg img { opacity: .9; }
.eg-corp-in { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: clamp(30px, 5cqi, 90px); align-items: center; }
.eg-corp h2 { font-size: clamp(36px, 4.2cqi, 64px); line-height: 1.25; margin-bottom: 30px; }
.eg-ask { display: flex; gap: 12px; margin: 26px 0 0; color: #fff; font-family: var(--eg-script); font-size: 18px; line-height: 1.6; }
.eg-ask-q { color: var(--eg-red); font-size: 30px; line-height: 1; }
.eg-ask a { color: var(--eg-red); }

/* Perks and booking steps */
.eg-perks { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; text-align: center; }
.eg-perks article { display: grid; justify-items: center; align-content: start; gap: 12px; }
.eg-perks h3 { font-size: 24px; }
.eg-perks p { margin: 0; font-size: 15.5px; }

/* Video band */
.eg-video { position: relative; display: grid; place-items: center; min-height: clamp(380px, 36cqi, 640px); overflow: hidden; text-align: center; }
.eg-video::after { content: ""; position: absolute; inset: 0; background: linear-gradient(rgb(0 0 0 / .1), rgb(0 0 0 / .3) 55%, var(--eg-bg)); }
.eg-video-in { position: relative; z-index: 1; display: grid; justify-items: center; gap: 14px; padding: 40px 24px; }
.eg-video h2 { max-width: 16ch; font-size: clamp(36px, 4.4cqi, 66px); line-height: 1.25; }

/* Reviews */
.eg-quotes { position: relative; display: grid; }
.eg-radio { position: absolute; opacity: 0; pointer-events: none; }
.eg-quote-list { display: grid; }
.eg-quote { grid-area: 1 / 1; margin: 0; padding-inline-start: 46px; position: relative; opacity: 0; visibility: hidden; transform: translateY(12px); transition: opacity .6s, transform .6s, visibility .6s; }
.eg-quote .mark { position: absolute; inset-inline-start: 0; top: 4px; width: 30px; height: 30px; fill: var(--eg-red); stroke: none; }
.eg-quote p { margin: 0 0 14px; color: #D9D3CD; font-size: clamp(17px, 1.45cqi, 22px); font-style: italic; line-height: 1.9; }
.eg-quote cite { color: #fff; font-family: var(--eg-script); font-size: 17px; font-style: normal; }
.eg-dots { display: flex; gap: 10px; margin-top: 40px; padding-inline-start: 46px; }
.eg-dots label { width: 8px; height: 8px; border-radius: 50%; background: #4a4444; cursor: pointer; transition: background .3s; }

/* FAQ */
.eg-faq { display: grid; grid-template-columns: 1fr 1fr; gap: 0 26px; align-items: start; }
.eg-faq > div { display: grid; gap: 24px; }
.eg-faq details { border: 1px solid #2a2626; background: #0E0D0D; transition: box-shadow .4s; }
.eg-faq details[open] { box-shadow: 0 0 40px rgb(232 64 58 / .12); }
.eg-faq summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 26px; color: #fff; font-family: var(--eg-script); font-size: 20px; cursor: pointer; list-style: none; }
.eg-faq summary::-webkit-details-marker { display: none; }
.eg-faq details[open] summary { color: var(--eg-red); }
.eg-faq .arrow { color: var(--eg-red); stroke-width: 4; transition: transform .3s; }
.eg-faq details[open] .arrow { transform: rotate(180deg); }
.eg-faq details > div { padding: 0 26px 20px; font-size: 15.5px; }
.eg-faq details > div p { margin: 0; }

/* Gift band */
.eg-gift { position: relative; overflow: hidden; padding: clamp(60px, 8cqi, 140px) 0; border-block: 1px solid var(--eg-line); }
.eg-gift-in { position: relative; display: grid; grid-template-columns: 1.25fr 1fr; gap: clamp(26px, 4cqi, 60px); align-items: center; }
.eg-gift-pic img { width: 100%; height: auto; filter: drop-shadow(0 20px 40px rgb(0 0 0 / .5)); }
.eg-gift h2 { margin-bottom: 26px; font-size: clamp(36px, 4.2cqi, 62px); line-height: 1.25; }
.eg-gift .eg-body { max-width: 46ch; margin: 0 0 28px; }

/* Footer */
.eg-foot { background: #000; color: var(--eg-text); }
.eg-foot-in { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1.3fr; gap: 30px; padding: clamp(60px, 8cqi, 120px) 0; }
.eg-foot h4 { margin-bottom: 14px; font-size: 22px; }
.eg-foot-list { display: grid; gap: 2px; font-size: 15.5px; }
.eg-foot-list a:hover { color: #fff; }
.eg-copy { position: relative; padding: 26px 24px; border-top: 1px solid #2a2222; text-align: center; font-size: 14px; color: #B98C88; }
.eg-copy-bg { position: absolute; inset: 0; background: center / cover no-repeat; opacity: .9; }
.eg-copy p { position: relative; margin: 0; }
.eg-copy b { color: #fff; font-weight: 400; }

/* Events */
.eg-events { display: grid; gap: clamp(40px, 6cqi, 70px); }
.eg-event { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: clamp(20px, 3cqi, 40px); align-items: start; }
.eg-event .eg-frame { aspect-ratio: 1.34; }
.eg-event h2 { margin-bottom: 18px; font-size: clamp(28px, 2.6cqi, 38px); }
.eg-event .eg-btn { margin-top: 6px; }

/* About */
.eg-gallery { position: relative; margin-bottom: 40px; }
.eg-gallery-main { display: grid; }
.eg-gallery-main figure { grid-area: 1 / 1; position: relative; margin: 0; aspect-ratio: 1.67; border: 1px solid #2a2626; overflow: hidden; opacity: 0; visibility: hidden; transition: opacity .6s, visibility .6s; }
.eg-gallery-main figure img { width: 100%; height: 100%; object-fit: cover; }
.eg-gallery-main figure:first-child { opacity: 1; visibility: visible; }
.eg-gallery:has(.eg-radio:checked) .eg-gallery-main figure, .eg-gallery:has(.eg-radio:checked) .eg-thumbs label { animation: none; }
.eg-gallery:has(.eg-radio:checked) .eg-gallery-main figure:first-child { opacity: 0; visibility: hidden; }
.eg-gallery:hover .eg-gallery-main figure, .eg-gallery:hover .eg-thumbs label { animation-play-state: paused; }
.eg-add { display: inline-block; margin: -20px 0 30px; }
.eg-arrow { position: absolute; top: 50%; display: grid; place-items: center; width: 32px; height: 32px; margin-top: -16px; border-radius: 50%; background: var(--eg-red); color: #fff; cursor: pointer; }
.eg-arrow .eg-ico { width: 16px; height: 16px; stroke-width: 4; }
.eg-arrow.prev { inset-inline-start: 22px; }
.eg-arrow.next { inset-inline-end: 22px; }
.eg-thumbs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; margin-top: 14px; }
.eg-thumbs label { aspect-ratio: 1.55; overflow: hidden; opacity: .55; outline: 2px solid transparent; outline-offset: -2px; cursor: pointer; transition: opacity .3s; }
.eg-thumbs label:hover { opacity: .9; }
.eg-thumbs img { width: 100%; height: 100%; object-fit: cover; }
.eg-stats { position: relative; overflow: hidden; padding: clamp(60px, 8cqi, 120px) 0; text-align: center; }
.eg-stats-in { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
.eg-stats-in > div { display: grid; justify-items: center; gap: 10px; }
.eg-stats .eg-ico { width: 46px; height: 46px; color: #fff; stroke-width: 1.8; }
.eg-stats b { color: var(--eg-red); font-family: var(--eg-script); font-size: clamp(42px, 4.6cqi, 66px); font-weight: 700; line-height: 1.1; }
.eg-stats span { color: #fff; font-family: var(--eg-head); font-size: 18px; }
.eg-posts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 26px; text-align: center; }
.eg-posts article { display: grid; justify-items: center; align-content: start; gap: 10px; }
.eg-posts .eg-frame { width: 100%; aspect-ratio: 1.6; margin-bottom: 14px; }
.eg-posts .eg-frame:hover img { transform: scale(1.05); }
.eg-posts h3 { min-height: 2.7em; font-size: 24px; }
.eg-post .eg-frame { aspect-ratio: 1.6; margin-bottom: 20px; }
.eg-post .eg-body { margin: 14px 0 26px; }

/* Contact */
.eg-contact { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(30px, 5cqi, 70px); align-items: start; }
.eg-info { display: grid; gap: 18px; margin: 0 0 34px; padding: 0; list-style: none; font-size: 16px; }
.eg-info li { display: flex; gap: 16px; align-items: flex-start; }
.eg-info .eg-ico { color: var(--eg-red); margin-top: 4px; }
.eg-map { display: block; width: 100%; height: 340px; border: 0; filter: grayscale(.4); }
.eg-msg { display: grid; gap: 22px; padding: clamp(24px, 3cqi, 44px); border: 1px solid #2a2626; }
.eg-msg h2 { font-size: 30px; }
.eg-msg .eg-body { margin: -8px 0 0; }
.eg-msg input:not([type="checkbox"]), .eg-msg textarea { width: 100%; box-sizing: border-box; padding: 15px 22px; border: 1px solid transparent; background: #1E1C1C; color: #fff; font: inherit; transition: border-color .3s; }
.eg-msg input:focus, .eg-msg textarea:focus { outline: none; border-color: var(--eg-red); }
.eg-msg ::placeholder { color: #8b8580; }
.eg-agree { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; }
.eg-agree input { margin-top: 7px; accent-color: var(--eg-red); }
.eg-msg .eg-btn { justify-self: start; }

/* Booking */
.eg-step { margin: 0 0 22px; font-size: clamp(24px, 2.2cqi, 32px); }
.eg-pick { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; margin-bottom: clamp(40px, 5cqi, 60px); }
.eg-pick-room { display: grid; gap: 4px; padding: 8px 8px 12px; border: 1px solid #2a2626; background: #121010; transition: border-color .3s, background .3s; }
.eg-pick-room span { aspect-ratio: 1.7; overflow: hidden; margin-bottom: 6px; }
.eg-pick-room img { width: 100%; height: 100%; object-fit: cover; }
.eg-pick-room b { color: #fff; font-family: var(--eg-head); font-size: 20px; font-weight: 400; }
.eg-pick-room small { font-size: 12px; line-height: 1.7; }
.eg-pick-room:hover { border-color: #5a4f4f; }
.eg-pick-room.on { border-color: var(--eg-red); background: #1d1111; box-shadow: inset 0 0 0 1px var(--eg-red); }
.eg .bk { --bk-accent: var(--eg-red); --bk-ink: #fff; --bk-soft: #161414; --bk-line: #2a2626; --bk-dark: var(--eg-red); --bk-on: #fff; --bk-head: var(--eg-head); grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); }
.eg .bk-cal { background: #0E0D0D; }
.eg .bk-week { background: var(--eg-red); color: #fff; }
.eg .bk-day { color: #5b5552; }
.eg .bk-day.open { color: #fff; }
.eg .bk-day.open:hover { background: #1E1C1C; }
.eg .bk-day.today { box-shadow: inset 0 0 0 2px #fff; }
.eg .bk-form input:not([type="radio"]), .eg .bk-form select, .eg .bk-form textarea { background: #1E1C1C; border-color: transparent; color: #fff; }
.eg .bk-times span { background: #1E1C1C; border-color: #2a2626; }
.eg .bk-btn { box-shadow: -4px 4px 0 #fff; font-family: var(--eg-head); font-size: 18px; font-weight: 400; }
.eg-mine { display: flex; flex-wrap: wrap; gap: 8px; margin: 22px 0 0; font-size: 14px; }
.eg-mine a { color: #fff; text-decoration: underline; text-underline-offset: 4px; }
.eg-visitor { --sk-accent: var(--eg-red); --sk-line: #2a2626; --sk-muted: #9a938d; }
.eg-visitor .sk-card { background: #121010; border-color: #2a2626; }
.eg-visitor .sk-card h2, .eg-visitor .sk-hello h2 { color: #fff; }
.eg-visitor input { background: #1E1C1C; border-color: #2a2626; color: #fff; }
.eg-visitor .sk-btn { background: var(--eg-red); color: #fff; }
.eg-visitor a { color: #fff; }

/* Tablet */
@container (max-width: 1100px) {
  .eg-nav { gap: 18px; font-size: 17px; }
  .eg-book { display: none; }
  .eg-perks { grid-template-columns: repeat(2, 1fr); row-gap: 44px; }
  .eg-foot-in { grid-template-columns: 1fr 1fr; }
}
/* Phone */
@container (max-width: 820px) {
  .eg-top { display: none; }
  .eg-bar { flex-wrap: wrap; justify-content: center; gap: 4px; min-height: 0; padding: 18px 16px 10px; border-bottom: 0; }
  .eg-ptop { padding-top: 150px; min-height: 340px; }
  .eg-nav, .eg-tools { display: none; }
  .eg-burger { display: block; width: 100%; text-align: center; }
  .eg-burger summary { display: inline-grid; place-items: center; width: 44px; height: 36px; list-style: none; cursor: pointer; }
  .eg-burger summary::-webkit-details-marker { display: none; }
  .eg-burger summary span, .eg-burger summary span::before, .eg-burger summary span::after { display: block; width: 26px; height: 3px; background: var(--eg-red); position: relative; }
  .eg-burger summary span::before, .eg-burger summary span::after { content: ""; position: absolute; inset-inline: 0; }
  .eg-burger summary span::before { top: -8px; }
  .eg-burger summary span::after { top: 8px; }
  .eg-burger[open] summary { position: fixed; top: 16px; inset-inline-end: 16px; z-index: 12; }
  .eg-burger[open] summary span { background: transparent; }
  .eg-burger[open] summary span::before { top: 0; background: #fff; transform: rotate(45deg); }
  .eg-burger[open] summary span::after { top: 0; background: #fff; transform: rotate(-45deg); }
  .eg-drawer { position: fixed; inset: 0; z-index: 11; display: grid; align-content: start; gap: 40px; padding: 60px 22px; overflow-y: auto; background: #351414; text-align: start; animation: eg-in .35s ease both; }
  .eg-drawer .eg-logo { justify-self: center; }
  .eg-drawer nav { display: grid; gap: 4px; font-family: var(--eg-head); font-size: 34px; line-height: 1.5; }
  .eg-drawer nav a { color: #fff; }
  .eg-drawer nav a[aria-current="page"] { color: var(--eg-red); }
  .eg-logo-text b { font-size: 34px; }
  .eg-hero { min-height: 640px; }
  .eg-hero-in { padding: 200px 20px 80px; }
  .eg-split, .eg-corp-in, .eg-gift-in, .eg-contact, .eg-event { grid-template-columns: minmax(0, 1fr); }
  .eg-split-pic { padding-top: 0; }
  .eg-headline.over { position: static; margin-bottom: 20px; }
  .eg-rooms { grid-template-columns: minmax(0, 1fr); }
  .eg-faq { grid-template-columns: minmax(0, 1fr); }
  .eg-faq > div + div { margin-top: 24px; }
  .eg-posts, .eg-stats-in { grid-template-columns: minmax(0, 1fr); row-gap: 40px; }
  .eg-perks { grid-template-columns: minmax(0, 1fr); }
  .eg-foot-in { grid-template-columns: 1fr 1fr; }
  .eg-foot-logo { grid-column: 1 / -1; }
  .eg .bk { grid-template-columns: minmax(0, 1fr); }
  .eg-pick { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .eg-pick-room b { font-size: 17px; }
  .eg-pick-room small { font-size: 11px; }
  .eg-thumbs { gap: 2px; }
}
@keyframes eg-in { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .eg * { transition: none !important; animation: none !important; } }
.eg-gallery .eg-radio:checked ~ .eg-gallery-main figure { transition: opacity .6s, visibility .6s; }
`;
