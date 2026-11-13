/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Tanin": a recording studio rebuilt from the Resonate reference, in Persian. A transparent menu over
// a full-screen hero with the latest song; records, client logos, a studio band cut in bars, features,
// a strip of services whose picture follows the hovered one, studio tabs, artists, a booking band,
// reviews and news. Pages: about, services, studios, booking (each studio rented by the hour, from the
// owner's working hours and the bookings already taken), blog and posts, contact with FAQ. No scripts:
// tabs and sliders use radios, the menu uses details, entrances run on CSS (on load and on scroll).

import type { ReactNode } from "react";
import { defaultSchedule, emptyVisitor, formatToman, takenFor, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import { SAMPLE_ASSETS_PATH, SAMPLE_ASSETS_VERSION } from "@rb/schema";
import type { TemplateProps } from "../types";
import { FormMeta, Opt, PageLink, blockOn, ed, item, outside, partsCss } from "./parts";
import { mapEmbed } from "./golsara";
import { AccountPage, shopkitCss } from "./shopkit";
import { BookingPicker, TrackBooking, bookingCss } from "./booking";

export const TANIN_BLOCKS = [
  { key: "hero", label: "تصویر بزرگ و آهنگ تازه" },
  { key: "records", label: "تازه‌ترین آثار" },
  { key: "logos", label: "لوگوی همکاران" },
  { key: "studio", label: "استودیو برای موسیقی‌دان‌ها" },
  { key: "features", label: "ویژگی‌ها" },
  { key: "services", label: "نوار خدمات" },
  { key: "studios", label: "انتخاب استودیو" },
  { key: "artists", label: "هنرمندان" },
  { key: "booking", label: "فرم رزرو" },
  { key: "reviews", label: "نظر هنرمندان" },
  { key: "news", label: "بلاگ و اخبار" },
] as const;

export const TANIN_OPTIONAL_PAGES = [
  { path: "/about", label: "صفحه‌ی درباره‌ی ما" },
  { path: "/services", label: "صفحه‌ی خدمات" },
  { path: "/blog", label: "صفحه‌ی بلاگ" },
] as const;

const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);
const studiosOf = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());
const hasBlog = (data: ResumeData) => livePosts(data.site?.shop).length > 0 && pageOn(data, "/blog");

export function taninPages(data: ResumeData): string[] {
  const posts = livePosts(data.site?.shop).map((p) => `/blog/${p.id}`);
  return ["/", ...(["/about", "/services"] as const).filter((p) => pageOn(data, p)), "/studios", "/booking", ...(hasBlog(data) ? ["/blog", ...posts] : posts), "/contact", "/account", "/track"];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; page: string; visitor: Visitor };

export function TaninSite(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = taninPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), page, visitor: props.visitor ?? emptyVisitor() };
  const [kind, id] = page.split("/").filter(Boolean);
  const body: ReactNode =
    page === "/" ? <Home {...view} />
    : page === "/about" ? <About {...view} />
    : page === "/services" ? <Services {...view} />
    : page === "/studios" ? <Studios {...view} />
    : page === "/booking" ? <Booking {...view} />
    : page === "/blog" ? <Blog {...view} />
    : kind === "blog" && id ? <Post {...view} id={id} />
    : page === "/account" ? <Account {...view} />
    : page === "/track" ? <Track {...view} />
    : <Contact {...view} />;
  return (
    <WebPage ctx={ctx} className={`tn${page === "/" ? " tn-home" : ""}`} css={partsCss + bookingCss + (page === "/account" || page === "/track" ? shopkitCss : "") + css}>
      <Header {...view} />
      <main key={page}>{body}</main>
      <Footer {...view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const fa = (n: number) => new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(n);
const faDigits = (v: string) => v.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
const telHref = (v: string) => `tel:${v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d+]/g, "")}`;
const Phone = ({ value }: { value: string }) => <bdi dir="ltr">{faDigits(value)}</bdi>;
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
/** A heading where a word written between stars sits on a painted brush stroke: "صدایت را *اوج* بده". */
function Brush({ text }: { text?: string }) {
  return (
    <>
      {(text ?? "").split(/(\*[^*]+\*)/).map((part, k) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
          <span key={k} className="tn-brush">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
/** "استودیو ۱ - ضبط": the part after the dash in the accent color. */
function SplitName({ name }: { name: string }) {
  const [a, b] = name.split(/\s+-\s+/, 2);
  return (
    <>
      {a}
      {b && (
        <>
          {" - "}
          <em>{b}</em>
        </>
      )}
    </>
  );
}

const ICONS: Record<string, string> = {
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  cal: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5",
  arrow: "M19 12H5M11 6l-6 6 6 6",
  next: "M15 5l-7 7 7 7",
  prev: "M9 5l7 7-7 7",
  head: "M4 15v-3a8 8 0 0 1 16 0v3M4 15a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2zM20 15a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2z",
  area: "M4 4h16v16H4zM4 9h5V4M15 20v-5h5",
  people: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a2.5 2.5 0 1 0 0-5M3 20c.5-3.5 3-5.5 6-5.5s5.5 2 6 5.5M16 14.5c2.5.2 4.4 2 5 5.5",
  check: "M5 12.5l4.5 4.5L19 7.5",
  quote: "M4 17c0-6 2-9 6-10l.6 1.6C8.4 9.6 7.6 11 7.5 13H10v4zM13 17c0-6 2-9 6-10l.6 1.6c-2.2 1-3 2.4-3.1 4.4H19v4z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  insta: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.5 6.5h.01",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  down: "M6 9l6 6 6-6",
};
const Svg = ({ name, className = "tn-ico" }: { name: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
);

/** The record in the logo: a vinyl with its label. */
const Vinyl = () => (
  <svg viewBox="0 0 40 40" className="tn-vinyl" aria-hidden="true">
    <circle cx="20" cy="20" r="18" />
    <circle cx="20" cy="20" r="12.5" className="ring" />
    <circle cx="20" cy="20" r="6" className="label" />
    <circle cx="20" cy="20" r="1.6" className="hole" />
  </svg>
);

function Logo({ view, big }: { view: View; big?: boolean }) {
  const b = view.ctx.data.basics;
  return (
    <PageLink to="/" link={view.link} className={`tn-logo${big ? " big" : ""}`}>
      <Vinyl />
      <b {...ed("basics.fullName", "text", "نام")}>{b.fullName}</b>
    </PageLink>
  );
}

const SOCIAL_NAMES: Record<string, string> = { instagram: "اینستاگرام", telegram: "تلگرام", whatsapp: "واتس‌اپ", eitaa: "ایتا", rubika: "روبیکا", website: "وب‌سایت", linkedin: "لینکدین", github: "گیت‌هاب", behance: "بهنس", dribbble: "دریبل" };
function Socials({ view }: { view: View }) {
  const links = view.ctx.data.basics.links.filter((l) => safeUrl(l.url));
  return (
    <span className="tn-socials">
      {links.map((l) => {
        const href = safeUrl(l.url)!;
        const name = SOCIAL_NAMES[l.type] ?? "لینک";
        return (
          <a key={l.id} href={href} {...outside(href)} aria-label={name} title={name} {...ed(`basics.links[${l.id}].url`, "url", name)}>
            {name}
          </a>
        );
      })}
      {view.editing && (
        <span className="p-ghost" {...ed("basics.links", "newlink", "شبکه‌ی اجتماعی")}>
          +
        </span>
      )}
    </span>
  );
}

function Header(view: View) {
  const { ctx, link, page } = view;
  const data = ctx.data;
  const items = [
    { to: "/", label: "خانه" },
    ...(pageOn(data, "/about") ? [{ to: "/about", label: "درباره‌ی ما" }] : []),
    ...(pageOn(data, "/services") ? [{ to: "/services", label: "خدمات" }] : []),
  ];
  const pages = [
    { to: "/studios", label: "استودیوها" },
    { to: "/booking", label: "رزرو استودیو" },
    { to: "/track", label: "پیگیری رزرو" },
    { to: "/account", label: view.visitor.customer ? "رزروهای من" : "ورود / ثبت‌نام" },
  ];
  const inPages = pages.some((p) => p.to === page);
  const blogOn = hasBlog(data);
  return (
    <header className="tn-head">
      <div className="tn-wrap tn-head-in">
        <Logo view={view} />
        <nav className="tn-nav">
          {items.map((m) => (
            <PageLink key={m.to} to={m.to} link={link} current={page === m.to}>
              {m.label}
            </PageLink>
          ))}
          <span className={`tn-drop${inPages ? " on" : ""}`}>
            <button type="button" aria-haspopup="true">
              صفحه‌ها <Svg name="down" />
            </button>
            <span className="tn-drop-menu">
              {pages.map((m) => (
                <PageLink key={m.to} to={m.to} link={link} current={page === m.to}>
                  {m.label}
                </PageLink>
              ))}
            </span>
          </span>
          {blogOn && (
            <PageLink to="/blog" link={link} current={page.startsWith("/blog")}>
              بلاگ
            </PageLink>
          )}
        </nav>
        <PageLink to="/contact" link={link} className="tn-head-contact" current={page === "/contact"}>
          تماس با ما
        </PageLink>
        <details className="tn-burger">
          <summary aria-label="منو">
            <span />
          </summary>
          <nav className="tn-drawer">
            {[...items, ...pages.slice(0, 2), ...(blogOn ? [{ to: "/blog", label: "بلاگ" }] : []), { to: "/contact", label: "تماس با ما" }, ...pages.slice(2)].map((m) => (
              <PageLink key={m.to} to={m.to} link={link} current={page === m.to}>
                {m.label}
              </PageLink>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}

function Footer(view: View) {
  const { ctx, shop, link, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const tags = shop.bandItems ?? [];
  const photos = (shop.trustLogos ?? []).slice(0, 4);
  return (
    <footer className="tn-foot">
      <div className="tn-wrap">
        <div className="tn-foot-top">
          <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <span>
              <Svg name="pin" /> <span {...ed("site.address", "text", "نشانی")}>{site?.address}</span>
            </span>
          </Opt>
          {b.phone && (
            <a href={telHref(b.phone)} {...ed("basics.phone", "text", "تلفن")}>
              <Svg name="phone" /> <Phone value={b.phone} />
            </a>
          )}
          <Socials view={view} />
        </div>
        <div className="tn-foot-mid">
          <div className="tn-tags-box">
            <h4>برچسب‌ها</h4>
            <div className="tn-tags" {...ed("site.shop.bandItems", "lines", "برچسب‌ها (هر خط یکی)")}>
              {tags.map((t, k) =>
                hasBlog(ctx.data) ? (
                  <a key={k} href={`${link("/blog")}?tag=${encodeURIComponent(t)}`} className={k === 1 ? "on" : undefined}>
                    {t}
                  </a>
                ) : (
                  <span key={k}>{t}</span>
                ),
              )}
            </div>
          </div>
          <div className="tn-foot-mail">
            <small>راه ارتباط</small>
            {b.email && (
              <a href={`mailto:${b.email}`} {...ed("basics.email", "text", "ایمیل")}>
                {b.email}
              </a>
            )}
          </div>
        </div>
        <div className="tn-foot-bottom">
          <Logo view={view} big />
          <div className="tn-foot-pics">
            {photos.map((p) => {
              const pic = safeUrl(p.image);
              return (
                <span key={p.id} {...ed(`${item("site.shop.trustLogos", p.id)}.image`, "image", "عکس")}>
                  {pic && <img src={pic} alt="" loading="lazy" />}
                </span>
              );
            })}
          </div>
        </div>
        <p className="tn-copy">
          © {fa(new Date().getFullYear() - 621)} {b.fullName}؛ همه‌ی حقوق محفوظ است.
        </p>
      </div>
    </footer>
  );
}

/**
 * The top of an inner page: its name in two giant words cut around a picture, a trail back home and
 * the address, email and phone. The words come in from the sides as the page opens.
 */
function PageTop({ view, words, image, path, label = "عکس بالای صفحه" }: { view: View; words: [string, string]; image?: string; path: string; label?: string }) {
  const b = view.ctx.data.basics;
  const site = view.ctx.data.site;
  const pic = safeUrl(image);
  const title = words.join(" ");
  return (
    <section className="tn-ptop">
      <div className="tn-wrap tn-ptop-in">
        <span className="tn-ptop-pic" {...ed(path, "image", label)}>
          {pic && <img src={pic} alt="" />}
        </span>
        <h1 aria-label={title}>
          <span className="w1">{words[0]}</span>
          <span className="w2">{words[1]}</span>
        </h1>
      </div>
      <div className="tn-wrap tn-ptop-bar">
        <nav className="tn-crumbs">
          <PageLink to="/" link={view.link}>
            خانه
          </PageLink>
          <span>/</span>
          <em>{title}</em>
        </nav>
        <span className="tn-ptop-info">
          {site?.address && (
            <span>
              <Svg name="pin" /> {site.address}
            </span>
          )}
          {b.email && (
            <span>
              <Svg name="mail" /> {b.email}
            </span>
          )}
          {b.phone && (
            <span>
              <Svg name="phone" /> <Phone value={b.phone} />
            </span>
          )}
        </span>
      </div>
    </section>
  );
}

const Head = ({ title, text, center, editTitle, editText }: { title?: string; text?: string; center?: boolean; editTitle?: object; editText?: object }) => (
  <div className={`tn-headline${center ? " center" : ""} tn-rise`}>
    <h2 {...editTitle}>
      <Brush text={title} />
    </h2>
    {(text || editText) && <p {...editText}>{text}</p>}
  </div>
);

/* ───────────── Home ───────────── */

function Home(view: View) {
  const { ctx, shop, link, editing } = view;
  const data = ctx.data;
  const site = data.site;
  const on = (k: string) => blockOn(data, k);
  const hero = safeUrl(shop.heroImage);
  const song = data.projects.find((p) => safeUrl(p.url));
  return (
    <>
      {on("hero") && (
        <section className="tn-hero">
          <span className="tn-hero-pic" {...ed("site.shop.heroImage", "image", "عکس بزرگ")}>
            {hero && <img src={hero} alt="" />}
          </span>
          <div className="tn-wrap tn-hero-in">
            <h1 className="tn-in-up" {...ed("site.shop.heroTitle", "text", "عنوان (کلمه‌ی رنگی بین دو ستاره)")}>
              <Brush text={shop.heroTitle} />
            </h1>
            <p className="tn-in-up d2" {...ed("site.shop.heroText", "multiline", "متن")}>
              {shop.heroText}
            </p>
            <div className="tn-hero-btns">
              <PageLink to="/booking" link={link} className="tn-btn tn-in-start d3">
                رزرو استودیو
              </PageLink>
              <PageLink to="/studios" link={link} className="tn-btn line tn-in-end d3">
                دیدن استودیوها
              </PageLink>
            </div>
            {song && <Player view={view} song={song} />}
          </div>
        </section>
      )}

      {on("records") && data.projects.length > 0 && (
        <section className="tn-sec tn-wrap tn-records">
          <div className="tn-records-head tn-from-start">
            <h2 {...ed("site.shop.newTitle", "text", "عنوان (کلمه‌ی رنگی بین دو ستاره)")}>
              <Brush text={shop.newTitle} />
            </h2>
            <p {...ed("site.shop.newText", "multiline", "متن")}>{shop.newText}</p>
            <PageLink to="/studios" link={link} className="tn-link">
              دیدن استودیوها
            </PageLink>
          </div>
          {data.projects.slice(0, 3).map((p, k) => {
            const at = item("projects", p.id);
            const pic = safeUrl(p.images[0]);
            const href = safeUrl(p.url);
            return (
              <article key={p.id} className={`tn-record tn-rise r${k}`}>
                <span className="tn-record-pic" {...ed(`${at}.images.0`, "image", "عکس")}>
                  {pic && <img src={pic} alt="" loading="lazy" />}
                  <span className="tn-record-over">
                    {href ? (
                      <a href={href} {...outside(href)} className="tn-round" aria-label={`شنیدن ${p.title}`}>
                        <Svg name="arrow" />
                      </a>
                    ) : (
                      <span className="tn-round">
                        <Svg name="arrow" />
                      </span>
                    )}
                    <small {...ed(`${at}.description`, "multiline", "توضیح")}>{p.description}</small>
                  </span>
                </span>
                <b {...ed(`${at}.title`, "text", "نام اثر")}>{p.title}</b>
                <small {...ed(`${at}.role`, "text", "هنرمند")}>{p.role}</small>
              </article>
            );
          })}
        </section>
      )}

      {on("logos") && <Logos view={view} />}

      {on("studio") && (
        <section className="tn-sec tn-wrap tn-unite">
          <div className="tn-from-start">
            <h2 {...ed("site.aboutTitle", "text", "عنوان (کلمه‌ی رنگی بین دو ستاره)")}>
              <Brush text={site?.aboutTitle} />
            </h2>
            <p className="tn-body" {...ed("site.aboutText", "multiline", "متن")}>
              {site?.aboutText}
            </p>
            <ul className="tn-ticks">
              {data.skills.slice(0, 3).map((s) => (
                <li key={s.id}>
                  <Svg name="head" />
                  <span {...ed(`${item("skills", s.id)}.name`, "text", "نکته")}>{s.name}</span>
                </li>
              ))}
            </ul>
            <Stats view={view} count={3} />
          </div>
          <span className="tn-bars tn-from-end" {...ed("site.aboutImage", "image", "عکس")}>
            {safeUrl(site?.aboutImage) && <img src={safeUrl(site?.aboutImage)} alt="" loading="lazy" />}
          </span>
        </section>
      )}

      {on("features") && <Features view={view} />}
      {on("services") && <ServiceStrip view={view} />}
      {on("studios") && <StudioTabs view={view} />}
      {on("artists") && <Artists view={view} />}
      {on("booking") && <BookingBand view={view} />}
      {on("reviews") && <Reviews view={view} />}
      {on("news") && <News view={view} />}
      {editing && !song && (
        <p className="tn-wrap p-ghost" {...ed(`${item("projects", data.projects[0]?.id ?? "")}.url`, "url", "لینک فایل آهنگ")}>
          + لینک فایل آهنگ برای پخش‌کننده‌ی بالای صفحه
        </p>
      )}
    </>
  );
}

/** "The latest song recorded here": the first record with a sound file, in the browser's own player. */
function Player({ view, song }: { view: View; song: ResumeData["projects"][number] }) {
  const at = item("projects", song.id);
  const cover = safeUrl(song.images[0]);
  const src = safeUrl(song.url)!;
  return (
    <div className="tn-player-box tn-in-up d4">
      <small>آخرین آهنگی که این‌جا ضبط شد…</small>
      <div className="tn-player">
        <span className="tn-disc">{cover && <img src={cover} alt="" />}</span>
        <span className="tn-song">
          <b>{song.title}</b>
          <small>{song.role}</small>
        </span>
        <audio controls preload="none" src={src} {...(view.editing ? ed(`${at}.url`, "url", "لینک فایل آهنگ") : {})} />
      </div>
    </div>
  );
}

function Logos({ view }: { view: View }) {
  const list = (view.ctx.data.site?.clients ?? []).filter((c) => safeUrl(c.image));
  if (!list.length) return null;
  // Twice in a row, so the moving strip has no gap.
  return (
    <section className="tn-logos" aria-label="همکاران">
      <div className="tn-logos-track">
        {[...list, ...list].map((c, k) => (
          <span key={k} aria-hidden={k >= list.length || undefined} {...(k < list.length ? ed(`${item("site.clients", c.id)}.image`, "image", "لوگو") : {})}>
            <img src={safeUrl(c.image)} alt={k < list.length ? c.name : ""} loading="lazy" />
          </span>
        ))}
      </div>
    </section>
  );
}

function Stats({ view, count }: { view: View; count: number }) {
  const stats = (view.shop.stats ?? []).slice(0, count);
  if (!stats.length) return null;
  return (
    <div className={`tn-stats n${stats.length}`}>
      {stats.map((s) => {
        const at = item("site.shop.stats", s.id);
        return (
          <div key={s.id} className="tn-rise">
            <b>
              <span {...ed(`${at}.value`, "text", "عدد")}>{s.value}</span>
              <i>+</i>
            </b>
            <small {...ed(`${at}.label`, "text", "عنوان")}>{s.label}</small>
          </div>
        );
      })}
    </div>
  );
}

function Features({ view, wide = true }: { view: View; wide?: boolean }) {
  const perks = (view.shop.perks ?? []).slice(0, 4);
  if (!perks.length) return null;
  return (
    <section className={`tn-sec tn-wrap tn-features${wide ? "" : " two"}`}>
      {perks.slice(0, wide ? 4 : 2).map((p, k) => {
        const at = item("site.shop.perks", p.id);
        const icon = safeUrl(p.image);
        return (
          <article key={p.id} className={`tn-rise r${k}`}>
            <span className="tn-feat-ico" {...ed(`${at}.image`, "image", "آیکون")}>
              {icon && <img src={icon} alt="" loading="lazy" />}
            </span>
            <h3 {...ed(`${at}.title`, "text", "عنوان")}>{p.title}</h3>
            <p {...ed(`${at}.text`, "multiline", "متن")}>{p.text}</p>
            {wide && pageOn(view.ctx.data, "/services") && (
              <PageLink to="/services" link={view.link} className="tn-link">
                بیشتر بخوانید
              </PageLink>
            )}
          </article>
        );
      })}
    </section>
  );
}

/**
 * Five services side by side over one big picture: the hovered (or focused) column lights up, the
 * picture becomes that service's and its short text appears.
 */
function ServiceStrip({ view }: { view: View }) {
  const list = view.shop.categories.filter((c) => c.name.trim()).slice(0, 5);
  if (!list.length) return null;
  return (
    <section className="tn-strip" style={{ ["--n" as string]: list.length }}>
      {list.map((c, k) => {
        const at = item("site.shop.categories", c.id);
        const pic = safeUrl(c.image);
        return (
          <PageLink key={c.id} to={pageOn(view.ctx.data, "/services") ? "/services" : "/booking"} link={view.link} className={`tn-strip-col${k === Math.min(2, list.length - 1) ? " def" : ""}`}>
            <span className="tn-strip-pic" style={{ ["--k" as string]: k }}>{pic && <img src={pic} alt="" loading="lazy" />}</span>
            <b {...ed(`${at}.name`, "text", "نام خدمت")}>{c.name}</b>
            <span className="tn-strip-card">
              <em>{c.name}</em>
              <small {...ed(`${at}.text`, "multiline", "توضیح")}>{c.text}</small>
            </span>
          </PageLink>
        );
      })}
    </section>
  );
}

/** "Choose your studio": a list of the studios; the chosen one shows its picture, text, price and facts. */
function StudioTabs({ view }: { view: View }) {
  const { shop, link, ctx } = view;
  const list = studiosOf(shop);
  if (!list.length) return null;
  const start = Math.min(3, list.length - 1);
  return (
    <section className="tn-sec tn-wrap tn-choose">
      <Head title="استودیوی‌تان را *انتخاب* کنید" text={shop.showcaseText} center editText={ed("site.shop.showcaseText", "multiline", "متن")} />
      <div className="tn-tabs">
        {list.map((s, k) => (
          <input key={s.id} type="radio" name="tn-st" id={`tn-st${k}`} defaultChecked={k === start} className="tn-radio" />
        ))}
        <div className="tn-tab-list tn-from-start">
          {list.map((s, k) => (
            <label key={s.id} htmlFor={`tn-st${k}`}>
              {s.name}
            </label>
          ))}
        </div>
        <div className="tn-tab-panes">
          {list.map((s) => {
            const pic = safeUrl(s.images[0]);
            const spec = (label: string) => s.specs?.find((x) => x.label === label)?.value;
            return (
              <div key={s.id} className="tn-tab-pane">
                <span className="tn-tab-pic">{pic && <img src={pic} alt="" loading="lazy" />}</span>
                <div>
                  <h3>
                    <SplitName name={s.name} />
                  </h3>
                  <p className="tn-body">{s.description}</p>
                  {s.price > 0 && (
                    <p className="tn-price">
                      <b>{formatToman(s.salePrice ?? s.price, ctx.data.locale)}</b> / ساعت
                    </p>
                  )}
                  <p className="tn-facts">
                    {spec("متراژ") && (
                      <span>
                        <Svg name="area" /> {spec("متراژ")}
                      </span>
                    )}
                    {spec("ظرفیت") && (
                      <span>
                        <Svg name="people" /> {spec("ظرفیت")}
                      </span>
                    )}
                  </p>
                  <a href={`${link("/booking")}?studio=${encodeURIComponent(s.id)}`} className="tn-btn">
                    رزرو همین استودیو
                  </a>
                </div>
              </div>
            );
          })}
        </div>
        <style>{list.map((_, k) => `#tn-st${k}:checked ~ .tn-tab-panes .tn-tab-pane:nth-child(${k + 1}) { opacity: 1; visibility: visible; transform: none; } #tn-st${k}:checked ~ .tn-tab-list label:nth-child(${k + 1}) { background: var(--tn-gold); color: #17141a; }`).join("\n")}</style>
      </div>
    </section>
  );
}

/** Artists who recorded here: tall cards with the name written up the side, in a row that slides. */
function Artists({ view }: { view: View }) {
  const list = view.ctx.data.site?.gallery ?? [];
  if (!list.length) return null;
  const pages = Math.max(1, list.length - 3);
  return (
    <section className="tn-sec tn-artists">
      <div className="tn-wrap tn-artists-head">
        <h2 className="tn-from-start">
          <Brush text="*هنرمندانی* که به ما اعتماد کردند" />
        </h2>
        <p className="tn-from-end" {...ed("site.shop.discountTitle", "multiline", "متن")}>
          {view.shop.discountTitle}
        </p>
      </div>
      <div className="tn-wrap tn-slider">
        {Array.from({ length: pages }, (_, k) => (
          <input key={k} type="radio" name="tn-ar" id={`tn-ar${k}`} defaultChecked={k === 0} className="tn-radio" />
        ))}
        <div className="tn-slider-view">
          <div className="tn-slider-track">
            {list.map((g, k) => {
              const at = item("site.gallery", g.id);
              return (
                <article key={g.id} className={`tn-artist tn-rise r${k % 4}`}>
                  <span className="tn-artist-pic" {...ed(`${at}.image`, "image", "عکس")}>
                    <img src={safeUrl(g.image)} alt={g.title} loading="lazy" />
                  </span>
                  <b {...ed(`${at}.title`, "text", "نام هنرمند")}>{g.title}</b>
                  {g.description && <small>{g.description}</small>}
                </article>
              );
            })}
          </div>
        </div>
        {pages > 1 && (
          <div className="tn-arrows">
            {Array.from({ length: pages }, (_, k) => (
              <span key={k} className="tn-arrow-set">
                <label htmlFor={`tn-ar${Math.max(0, k - 1)}`} aria-label="قبلی" className={k === 0 ? "off" : undefined}>
                  <Svg name="prev" />
                </label>
                <label htmlFor={`tn-ar${Math.min(pages - 1, k + 1)}`} aria-label="بعدی" className={k === pages - 1 ? "off" : undefined}>
                  <Svg name="next" />
                </label>
              </span>
            ))}
          </div>
        )}
        <style>{Array.from({ length: pages }, (_, k) => `#tn-ar${k}:checked ~ .tn-slider-view .tn-slider-track { transform: translateX(calc(${k} * (var(--tn-card) + var(--tn-gap)))); } #tn-ar${k}:checked ~ .tn-arrows .tn-arrow-set:nth-child(${k + 1}) { display: flex; }`).join("\n")}</style>
        {view.editing && (
          <span className="p-ghost" {...ed("site.gallery", "newimage", "افزودن هنرمند")}>
            + افزودن هنرمند
          </span>
        )}
      </div>
    </section>
  );
}

const HOURS = [1, 2, 3, 4, 5, 6];

/** "Secure your studio session": the address, email and phone beside a short form that opens the booking page. */
function BookingBand({ view, full }: { view: View; full?: boolean }) {
  const { ctx, shop, link } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const bg = safeUrl(site?.accentImage);
  const list = studiosOf(shop);
  const q = view.visitor.query;
  return (
    <section className={`tn-sec tn-band${full ? " full" : ""}`}>
      <span className="tn-band-pic" {...ed("site.accentImage", "image", "عکس پس‌زمینه")}>
        {bg && <img src={bg} alt="" loading="lazy" />}
      </span>
      <div className="tn-wrap tn-band-in">
        <div className="tn-band-text tn-from-start">
          <h2 {...ed("site.shop.promoTitle", "text", "عنوان (کلمه‌ی رنگی بین دو ستاره)")}>
            <Brush text={shop.promoTitle} />
          </h2>
          <dl>
            {site?.address && (
              <>
                <dt>نشانی</dt>
                <dd>{site.address}</dd>
              </>
            )}
            {b.email && (
              <>
                <dt>ایمیل</dt>
                <dd>{b.email}</dd>
              </>
            )}
            {b.phone && (
              <>
                <dt>تلفن</dt>
                <dd>
                  <Phone value={b.phone} />
                </dd>
              </>
            )}
          </dl>
        </div>
        <form method="get" action={link("/booking")} className="tn-form tn-from-end">
          <label>
            <span>
              نام و نام خانوادگی<i>*</i>
            </span>
            <input name="name" required placeholder="نام شما" autoComplete="name" defaultValue={q.name ?? view.visitor.customer?.name} />
          </label>
          <label>
            <span>
              شماره‌ی موبایل<i>*</i>
            </span>
            <input name="phone" required inputMode="tel" dir="ltr" placeholder="09xx xxx xxxx" autoComplete="tel" defaultValue={q.phone ?? view.visitor.customer?.phone} />
          </label>
          <label>
            <span>
              تاریخ رزرو<i>*</i>
            </span>
            <input name="day" type="date" required dir="ltr" />
          </label>
          <label>
            <span>
              مدت جلسه<i>*</i>
            </span>
            <select name="hours" defaultValue="2">
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {fa(h)} ساعت
                </option>
              ))}
            </select>
          </label>
          <label className="wide">
            <span>
              انتخاب استودیو<i>*</i>
            </span>
            <select name="studio" required defaultValue="">
              <option value="" disabled>
                استودیو را انتخاب کنید
              </option>
              {list.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="wide">
            <span>پیام</span>
            <textarea name="body" rows={3} placeholder="اگر توضیحی دارید بنویسید" />
          </label>
          <button type="submit" className="tn-btn">
            دیدن ساعت‌های خالی
          </button>
        </form>
      </div>
    </section>
  );
}

function Reviews({ view }: { view: View }) {
  const list = (view.ctx.data.site?.testimonials ?? []).filter((t) => t.text.trim());
  if (!list.length) return null;
  return (
    <section className="tn-sec tn-reviews">
      <Head title="هنرمندان ما *چه می‌گویند*" text={view.shop.bestText} center editText={ed("site.shop.bestText", "multiline", "متن")} />
      <div className="tn-wrap tn-review-list">
        {list.slice(0, 4).map((t, k) => {
          const at = item("site.testimonials", t.id);
          const [title, ...rest] = t.text.split("\n");
          const face = safeUrl(t.image);
          const stars = t.rating ?? 5;
          return (
            <article key={t.id} className={`tn-review tn-rise r${k}`}>
              <header>
                <span className="tn-face" {...ed(`${at}.image`, "image", "عکس")}>
                  {face && <img src={face} alt="" loading="lazy" />}
                </span>
                <span>
                  <b {...ed(`${at}.name`, "text", "نام")}>{t.name}</b>
                  <small {...ed(`${at}.role`, "text", "سمت")}>{t.role}</small>
                </span>
              </header>
              <span className="tn-stars" aria-label={`${fa(stars)} از ۵`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Svg key={n} name="star" className={`tn-ico${n <= stars ? " on" : ""}`} />
                ))}
              </span>
              <div {...ed(`${at}.text`, "multiline", "متن نظر (خط اول عنوان است)")}>
                <h3>{rest.length ? title : ""}</h3>
                <p>{rest.length ? rest.join(" ") : title}</p>
              </div>
              <Svg name="quote" className="tn-ico q" />
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** Two newest posts as cards and the next ones as a list, with the way to the blog. */
function News({ view }: { view: View }) {
  const posts = livePosts(view.shop);
  if (!posts.length) return null;
  return (
    <section className="tn-sec tn-wrap tn-news">
      <div className="tn-split-head">
        <h2 className="tn-from-start">
          <Brush text="تازه‌ترین *بلاگ و اخبار*" />
        </h2>
        <p className="tn-from-end" {...ed("site.shop.lookText", "multiline", "متن")}>
          {view.shop.lookText}
        </p>
      </div>
      <div className="tn-news-grid">
        {posts.slice(0, 2).map((p, k) => (
          <PostCard key={p.id} view={view} p={p} className={`tn-rise r${k}`} />
        ))}
        <aside className="tn-news-list tn-from-end">
          <em>اخبار</em>
          {posts.slice(2, 6).map((p) => (
            <PageLink key={p.id} to={`/blog/${p.id}`} link={view.link}>
              <b>{p.title}</b>
              {p.date && (
                <small>
                  <Svg name="cal" /> {faDate(p.date)}
                </small>
              )}
            </PageLink>
          ))}
          {hasBlog(view.ctx.data) && (
            <PageLink to="/blog" link={view.link} className="tn-btn line">
              رفتن به بلاگ
            </PageLink>
          )}
        </aside>
      </div>
    </section>
  );
}

type PostT = NonNullable<Shop["posts"]>[number];
function PostCard({ view, p, className = "", more }: { view: View; p: PostT; className?: string; more?: boolean }) {
  const pic = safeUrl(p.image);
  return (
    <article className={`tn-post ${className}`}>
      <PageLink to={`/blog/${p.id}`} link={view.link} className="tn-post-pic">
        {pic && <img src={pic} alt="" loading="lazy" />}
        {p.category && <i>{p.category}</i>}
      </PageLink>
      {p.date && (
        <small>
          <Svg name="cal" /> {faDate(p.date)}
        </small>
      )}
      <PageLink to={`/blog/${p.id}`} link={view.link}>
        <h3>{p.title}</h3>
      </PageLink>
      {p.excerpt && <p>{p.excerpt}</p>}
      {more && (
        <PageLink to={`/blog/${p.id}`} link={view.link} className="tn-link">
          ادامه‌ی مطلب
        </PageLink>
      )}
    </article>
  );
}

/* ───────────── About ───────────── */

function About(view: View) {
  const { ctx, shop } = view;
  const data = ctx.data;
  const b = data.basics;
  const [pic1, pic2] = (shop.slides ?? []).map((s) => ({ s, url: safeUrl(s.image) }));
  const team = (shop.banners ?? []).filter((x) => !x.hidden);
  return (
    <>
      <PageTop view={view} words={["درباره‌ی", "ما"]} image={data.site?.heroImage} path="site.heroImage" />
      <section className="tn-sec tn-wrap tn-haven">
        <div className="tn-split-head">
          <h2 className="tn-from-start">
            <Brush text="خانه‌ی خلاقیت شما برای *موسیقی ناب*" />
          </h2>
          <div className="tn-from-end">
            <p {...ed("basics.summary", "multiline", "متن")}>{b.summary}</p>
            {b.email && (
              <a href={`mailto:${b.email}`} className="tn-mail">
                {b.email}
              </a>
            )}
            <Socials view={view} />
          </div>
        </div>
        <div className="tn-haven-grid">
          {pic1 && (
            <span className="tn-haven-a tn-from-start" {...ed(`${item("site.shop.slides", pic1.s.id)}.image`, "image", "عکس")}>
              {pic1.url && <img src={pic1.url} alt="" loading="lazy" />}
            </span>
          )}
          {pic2 && (
            <span className="tn-haven-b tn-from-end" {...ed(`${item("site.shop.slides", pic2.s.id)}.image`, "image", "عکس")}>
              {pic2.url && <img src={pic2.url} alt="" loading="lazy" />}
            </span>
          )}
          <Features view={view} wide={false} />
        </div>
      </section>
      <section className="tn-sec tn-wrap">
        <Stats view={view} count={4} />
      </section>
      <ServiceStrip view={view} />
      {team.length > 0 && (
        <section className="tn-sec tn-wrap tn-team">
          <Head title="ذهن‌های *پشت این موسیقی*" text={shop.newsletterText} center editText={ed("site.shop.newsletterText", "multiline", "متن")} />
          <div className="tn-team-in">
            {team.map((m, k) => (
              <input key={m.id} type="radio" name="tn-tm" id={`tn-tm${k}`} defaultChecked={k === 0} className="tn-radio" />
            ))}
            <div className="tn-team-pics">
              {team.map((m, k) => {
                const at = item("site.shop.banners", m.id);
                const pic = safeUrl(m.image);
                const href = safeUrl(m.link);
                return (
                  <label key={m.id} htmlFor={`tn-tm${k}`} className={`tn-member tn-rise r${k % 4}`}>
                    <span {...ed(`${at}.image`, "image", "عکس")}>{pic && <img src={pic} alt={m.title ?? ""} loading="lazy" />}</span>
                    {href && (
                      <a href={href} {...outside(href)} className="tn-member-social" aria-label="اینستاگرام">
                        <Svg name="insta" />
                      </a>
                    )}
                  </label>
                );
              })}
            </div>
            <div className="tn-team-info">
              {team.map((m) => {
                const at = item("site.shop.banners", m.id);
                return (
                  <div key={m.id} className="tn-team-card">
                    <h3 {...ed(`${at}.title`, "text", "نام")}>{m.title}</h3>
                    <small {...ed(`${at}.kicker`, "text", "سمت")}>{m.kicker}</small>
                    <p {...ed(`${at}.text`, "multiline", "معرفی")}>{m.text}</p>
                    <PageLink to="/contact" link={view.link} className="tn-link">
                      همکاری با ما
                    </PageLink>
                  </div>
                );
              })}
            </div>
            <style>{team.map((_, k) => `#tn-tm${k}:checked ~ .tn-team-info .tn-team-card:nth-child(${k + 1}) { opacity: 1; visibility: visible; transform: none; } #tn-tm${k}:checked ~ .tn-team-pics .tn-member:nth-child(${k + 1}) { flex-grow: 1.6; filter: none; }`).join("\n")}</style>
          </div>
        </section>
      )}
      <Newsletter view={view} />
    </>
  );
}

function Newsletter({ view }: { view: View }) {
  const vinyl = view.shop.slides?.[2];
  const pic = safeUrl(vinyl?.image);
  return (
    <section className="tn-sec tn-wrap tn-news-letter">
      <div className="tn-from-start">
        <h2 {...ed("site.shop.newsletterTitle", "text", "عنوان (کلمه‌ی رنگی بین دو ستاره)")}>
          <Brush text={view.shop.newsletterTitle || "از *تازه‌ترین آهنگ‌ها* باخبر شوید!"} />
        </h2>
        <p className="tn-body">برای خبر آهنگ‌های تازه، نکته‌های ضبط و پیشنهادهای ویژه عضو خبرنامه شوید.</p>
        <form method="post" action={view.link("/_form")} className="tn-subscribe">
          <FormMeta kind="newsletter" back={view.page} />
          <input name="email" type="email" required placeholder="ایمیل شما" aria-label="ایمیل شما" dir="auto" />
          <button type="submit" aria-label="عضویت">
            <Svg name="arrow" />
          </button>
        </form>
        <p className="tn-follow">
          <b>ما را دنبال کنید:</b> <Socials view={view} />
        </p>
      </div>
      {vinyl && (
        <span className="tn-frame tn-from-end" {...ed(`${item("site.shop.slides", vinyl.id)}.image`, "image", "عکس")}>
          {pic && <img src={pic} alt="" loading="lazy" />}
        </span>
      )}
    </section>
  );
}

/* ───────────── Services ───────────── */

function Services(view: View) {
  const { ctx, shop, link } = view;
  const data = ctx.data;
  const list = shop.categories.filter((c) => c.name.trim());
  return (
    <>
      <PageTop view={view} words={["خدمات", "ما"]} image={shop.trendImage} path="site.shop.trendImage" />
      <section className="tn-sec tn-wrap">
        <Head title="خدمتی را که *لازم دارید* پیدا کنید" text={shop.discoverTitle} center editText={ed("site.shop.discoverTitle", "multiline", "متن")} />
        <div className="tn-services">
          {list.map((c, k) => {
            const at = item("site.shop.categories", c.id);
            const pic = safeUrl(c.image);
            return (
              <PageLink key={c.id} to="/booking" link={link} className={`tn-service tn-rise r${k % 2}`}>
                <span {...ed(`${at}.image`, "image", "عکس")}>{pic && <img src={pic} alt="" loading="lazy" />}</span>
                <b {...ed(`${at}.name`, "text", "نام خدمت")}>{c.name}</b>
                <small>
                  <Svg name="arrow" /> رزرو این خدمت
                </small>
              </PageLink>
            );
          })}
        </div>
      </section>
      {data.education.length > 0 && (
        <section className="tn-sec tn-wrap tn-how">
          <div className="tn-split-head">
            <h2 className="tn-from-start">
              <Brush text="ما چطور *کار می‌کنیم*؟" />
            </h2>
            <p className="tn-from-end" {...ed("site.contactTitle", "multiline", "متن")}>
              {data.site?.contactTitle}
            </p>
          </div>
          <div className="tn-steps">
            {data.education.slice(0, 3).map((e, k) => {
              const at = item("education", e.id);
              const icon = sampleImage(`rs-step${k + 1}`, "png");
              return (
                <article key={e.id} className={`tn-step s${k} tn-rise r${k}`}>
                  <img src={icon} alt="" loading="lazy" />
                  <h3 {...ed(`${at}.institution`, "text", "عنوان")}>{e.institution}</h3>
                  <p {...ed(`${at}.description`, "multiline", "متن")}>{e.description}</p>
                  <i>{fa(k + 1).padStart(2, "۰")}</i>
                </article>
              );
            })}
          </div>
        </section>
      )}
      <StudioTabs view={view} />
      <section className="tn-sec tn-wrap">
        <Stats view={view} count={4} />
      </section>
      <Reviews view={view} />
    </>
  );
}

/* ───────────── Studios ───────────── */

function Studios(view: View) {
  return (
    <>
      <PageTop view={view} words={["استودیوهای", "ما"]} image={view.shop.lookImage} path="site.shop.lookImage" />
      <StudioTabs view={view} />
      <Features view={view} />
      <Newsletter view={view} />
    </>
  );
}

/* ───────────── Booking ───────────── */

function Booking(view: View) {
  const { shop, visitor, link, editing, ctx } = view;
  const list = studiosOf(shop);
  const q = visitor.query;
  const studio = list.find((s) => s.id === q.studio) ?? list[0];
  const hours = HOURS.includes(Number(q.hours)) ? Number(q.hours) : 2;
  const schedule = shop.schedule ?? { ...defaultSchedule(), byService: true, span: true };
  const taken = takenFor(schedule, visitor.taken ?? {}, studio?.name);
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const bg = safeUrl(site?.accentImage);
  return (
    <>
      <PageTop view={view} words={["رزرو", "استودیو"]} image={shop.newImage} path="site.shop.newImage" />
      <section className="tn-sec tn-band full">
        <span className="tn-band-pic" {...ed("site.accentImage", "image", "عکس پس‌زمینه")}>
          {bg && <img src={bg} alt="" loading="lazy" />}
        </span>
        <div className="tn-wrap tn-band-in">
          <div className="tn-band-text tn-from-start">
            <h2>
              <Brush text={shop.promoTitle} />
            </h2>
            <dl>
              {site?.address && (
                <>
                  <dt>نشانی</dt>
                  <dd>{site.address}</dd>
                </>
              )}
              {b.email && (
                <>
                  <dt>ایمیل</dt>
                  <dd>{b.email}</dd>
                </>
              )}
              {b.phone && (
                <>
                  <dt>تلفن</dt>
                  <dd>
                    <Phone value={b.phone} />
                  </dd>
                </>
              )}
            </dl>
          </div>
          <div className="tn-form tn-book tn-from-end">
            {studio ? (
              <>
                <form method="get" action={link("/booking")} className="tn-book-pick">
                  {q.name && <input type="hidden" name="name" value={q.name} />}
                  {q.phone && <input type="hidden" name="phone" value={q.phone} />}
                  {q.body && <input type="hidden" name="body" value={q.body} />}
                  <label>
                    <span>استودیو</span>
                    <select name="studio" defaultValue={studio.id}>
                      {list.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.price > 0 ? ` (${formatToman(s.salePrice ?? s.price, ctx.data.locale)} / ساعت)` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>مدت جلسه</span>
                    <select name="hours" defaultValue={String(hours)}>
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {fa(h)} ساعت
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="tn-btn line">
                    نمایش روزهای خالی
                  </button>
                </form>
                <p className="tn-book-note">
                  روزهای پررنگ تقویم، روزهایی‌اند که «{studio.name}» دست‌کم {fa(hours)} ساعت پشت سر هم خالی است.
                </p>
                <BookingPicker
                  link={link}
                  path="/booking"
                  schedule={schedule}
                  taken={taken}
                  query={q}
                  length={hours}
                  keep={{ studio: studio.id, hours: String(hours), name: q.name, phone: q.phone, body: q.body }}
                  button="ثبت رزرو"
                >
                  <input type="hidden" name="service" value={studio.name} />
                  <input type="hidden" name="guests" value={hours} />
                  <p className="tn-book-sum">
                    {studio.name} · {fa(hours)} ساعت
                    {studio.price > 0 && <> · {formatToman((studio.salePrice ?? studio.price) * hours, ctx.data.locale)}</>}
                  </p>
                  <label className="half">
                    نام و نام خانوادگی *
                    <input name="name" required autoComplete="name" defaultValue={q.name ?? visitor.customer?.name} />
                  </label>
                  <label className="half">
                    شماره‌ی موبایل *
                    <input name="phone" required inputMode="tel" dir="ltr" autoComplete="tel" defaultValue={q.phone ?? visitor.customer?.phone} />
                  </label>
                  <label>
                    پیام (اختیاری)
                    <textarea name="body" rows={2} defaultValue={q.body} />
                  </label>
                </BookingPicker>
                <p className="tn-mine">
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
              <p>فعلاً استودیویی برای رزرو نیست؛ لطفاً تماس بگیرید.</p>
            )}
            {editing && <p className="tn-muted">ساعت‌های کاری، واحد رزرو و تعطیلی‌ها را در «⚙️ مدیریت ← ساعت کاری و ظرفیت» و استودیوها را در «استودیوها» تعیین کنید.</p>}
          </div>
        </div>
      </section>
    </>
  );
}

function Account(view: View) {
  return (
    <>
      <PageTop view={view} words={view.visitor.customer ? ["رزروهای", "من"] : ["ورود", "و ثبت‌نام"]} image={view.shop.newImage} path="site.shop.newImage" />
      <section className="tn-sec tn-wrap tn-visitor">
        <AccountPage link={view.link} page={view.page} visitor={view.visitor} bookings="only" />
      </section>
    </>
  );
}

function Track(view: View) {
  return (
    <>
      <PageTop view={view} words={["پیگیری", "رزرو"]} image={view.shop.newImage} path="site.shop.newImage" />
      <section className="tn-sec tn-wrap tn-visitor">
        <TrackBooking link={view.link} visitor={view.visitor} />
      </section>
    </>
  );
}

/* ───────────── Blog ───────────── */

function Blog(view: View) {
  const { shop, visitor } = view;
  const all = livePosts(shop);
  const cat = visitor.query.cat;
  const tag = visitor.query.tag;
  const list = all.filter((p) => (!cat || p.category === cat) && (!tag || `${p.title} ${p.category ?? ""} ${p.text}`.includes(tag)));
  return (
    <>
      <PageTop view={view} words={["بلاگ", "و اخبار"]} image={shop.discoverImage} path="site.shop.discoverImage" />
      <section className="tn-sec tn-wrap">
        <div className="tn-split-head">
          <h2 className="tn-from-start">
            <Brush text="تازه‌ترین *بلاگ و اخبار*" />
          </h2>
          <p className="tn-from-end">{cat || tag ? `مطالب «${cat ?? tag}»` : shop.lookText}</p>
        </div>
        <div className="tn-blog">
          {list.map((p, k) => (
            <PostCard key={p.id} view={view} p={p} more className={`tn-rise b${k % 4}`} />
          ))}
          {!list.length && <p className="tn-muted">مطلبی پیدا نشد.</p>}
        </div>
      </section>
    </>
  );
}

function Post(view: View & { id: string }) {
  const { shop, link } = view;
  const all = livePosts(shop);
  const p = all.find((x) => x.id === view.id)!;
  const pic = safeUrl(p.image);
  const cats = [...new Set(all.map((x) => x.category).filter(Boolean))] as string[];
  const more = all.filter((x) => x.id !== p.id).slice(0, 3);
  const top = (p.title.split(/\s+/).length > 2 ? p.title.split(/[:؛،]/)[0]! : p.title).split(/\s+/);
  const words: [string, string] = [top.slice(0, Math.ceil(top.length / 2)).join(" "), top.slice(Math.ceil(top.length / 2)).join(" ")];
  return (
    <>
      <PageTop view={view} words={words} image={p.image} path={`${item("site.shop.posts", p.id)}.image`} label="عکس مطلب" />
      <section className="tn-sec tn-wrap tn-article-grid">
        <article className="tn-article">
          <span className="tn-post-pic big">
            {pic && <img src={pic} alt="" />}
            {p.category && <i>{p.category}</i>}
          </span>
          {p.date && (
            <small className="tn-date">
              <Svg name="cal" /> {faDate(p.date)}
            </small>
          )}
          <h2>{p.title}</h2>
          <div className="tn-body">
            <Para text={p.text} />
          </div>
          <footer>
            {p.category && (
              <span className="tn-tags">
                <b>برچسب:</b> <a href={`${link("/blog")}?cat=${encodeURIComponent(p.category)}`}>{p.category}</a>
              </span>
            )}
            <span className="tn-share">
              <b>اشتراک:</b> <Socials view={view} />
            </span>
          </footer>
          {more.length > 0 && (
            <section className="tn-more">
              <h3>پیشنهاد برای خواندن</h3>
              <div className="tn-blog small">
                {more.slice(0, 2).map((x) => (
                  <PostCard key={x.id} view={view} p={x} />
                ))}
              </div>
            </section>
          )}
        </article>
        <aside className="tn-side">
          {(shop.bandItems ?? []).length > 0 && (
            <section>
              <h3>برچسب‌ها</h3>
              <div className="tn-tags">
                {(shop.bandItems ?? []).map((t, k) => (
                  <a key={k} href={`${link("/blog")}?tag=${encodeURIComponent(t)}`}>
                    {t}
                  </a>
                ))}
              </div>
            </section>
          )}
          <section>
            <h3>مطالب تازه</h3>
            {all
              .filter((x) => x.id !== p.id)
              .slice(0, 4)
              .map((x) => (
                <PageLink key={x.id} to={`/blog/${x.id}`} link={link} className="tn-recent">
                  <b>{x.title}</b>
                  {x.date && (
                    <small>
                      <Svg name="cal" /> {faDate(x.date)}
                    </small>
                  )}
                </PageLink>
              ))}
          </section>
          {cats.length > 0 && (
            <section>
              <h3>دسته‌ها</h3>
              <ul className="tn-cats">
                {cats.map((c) => (
                  <li key={c} className={c === p.category ? "on" : undefined}>
                    <a href={`${link("/blog")}?cat=${encodeURIComponent(c)}`}>{c}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </section>
    </>
  );
}

/* ───────────── Contact ───────────── */

function Contact(view: View) {
  const { ctx, shop, editing, link } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const map = safeUrl(site?.mapUrl);
  const embed = mapEmbed(map);
  const hours = (site?.contactNote ?? "").split("\n").filter((x) => x.trim()).map((x) => {
    const i = x.indexOf(":");
    return i > 0 ? [x.slice(0, i).trim(), x.slice(i + 1).trim()] : [x.trim(), ""];
  });
  const faq = shop.faq ?? [];
  const cats = [...new Set(faq.map((f) => f.category || "سؤال‌های عمومی"))];
  return (
    <>
      <PageTop view={view} words={["تماس", "با ما"]} image={site?.signatureImage} path="site.signatureImage" label="عکس بالای صفحه‌ی تماس" />
      <section className="tn-sec tn-wrap tn-contact">
        <div>
          <form method="post" action={link("/_form")} className="tn-form tn-rise">
            <FormMeta kind="contact" back="/contact" />
            <label className="wide">
              <span>
                نام و نام خانوادگی<i>*</i>
              </span>
              <input name="name" required placeholder="نام شما" autoComplete="name" defaultValue={view.visitor.customer?.name} />
            </label>
            <label className="wide">
              <span>
                ایمیل یا شماره‌ی تماس<i>*</i>
              </span>
              <input name="bcc" required placeholder="ایمیل یا موبایل" dir="auto" />
            </label>
            <label className="wide">
              <span>
                پیام<i>*</i>
              </span>
              <textarea name="body" required rows={4} placeholder="پیام شما" />
            </label>
            <button type="submit" className="tn-btn">
              ارسال پیام
            </button>
          </form>
          <div className="tn-main-studio tn-rise">
            <h3 {...ed("site.shop.showcaseTitle", "text", "عنوان")}>{shop.showcaseTitle || "استودیوی اصلی"}</h3>
            <p {...ed("site.contactText", "multiline", "متن")}>{site?.contactText}</p>
            <ul className="tn-info">
              {b.email && (
                <li>
                  <Svg name="mail" /> {b.email}
                </li>
              )}
              {b.phone && (
                <li>
                  <Svg name="phone" /> <Phone value={b.phone} />
                </li>
              )}
              {site?.address && (
                <li>
                  <Svg name="pin" /> {site.address}
                </li>
              )}
            </ul>
          </div>
        </div>
        <div>
          <h2 className="tn-from-end">
            <Brush text="با ما *در ارتباط* باشید" />
          </h2>
          <p className="tn-body">برای آشنایی بیشتر با استودیو، پرسیدن سؤال یا پیشنهاد همکاری، پیام بدهید یا سری به ما بزنید.</p>
          {embed ? (
            <iframe className="tn-map" src={embed} title="نقشه" loading="lazy" />
          ) : (
            editing && (
              <span className="p-ghost" {...ed("site.mapUrl", "url", "لینک نقشه")}>
                + لینک نقشه
              </span>
            )
          )}
          <h3 className="tn-hours-title">ساعت کاری</h3>
          <dl className="tn-hours" {...ed("site.contactNote", "multiline", "ساعت کاری (هر خط: روزها: ساعت)")}>
            {hours.map(([d, h], k) => (
              <div key={k}>
                <dt>{d}</dt>
                <dd>{h}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <Logos view={view} />
      {faq.length > 0 && (
        <section className="tn-sec tn-wrap tn-faq">
          <Head title={shop.faqTitle || "سؤال‌های *پرتکرار*"} text={shop.promoText} center editTitle={ed("site.shop.faqTitle", "text", "عنوان")} editText={ed("site.shop.promoText", "multiline", "متن")} />
          <div className="tn-faq-in">
            {cats.map((c, k) => (
              <input key={c} type="radio" name="tn-fq" id={`tn-fq${k}`} defaultChecked={k === 0} className="tn-radio" />
            ))}
            <div className="tn-faq-cats tn-from-start">
              <h3>دسته‌ها</h3>
              {cats.map((c, k) => (
                <label key={c} htmlFor={`tn-fq${k}`}>
                  {c}
                  <Svg name="next" />
                </label>
              ))}
            </div>
            <div className="tn-faq-box tn-from-end">
              <h3>سؤال‌ها</h3>
              {cats.map((c) => (
                <div key={c} className="tn-faq-group">
                  {faq
                    .filter((f) => (f.category || "سؤال‌های عمومی") === c)
                    .map((f, k) => {
                      const at = item("site.shop.faq", f.id);
                      return (
                        <details key={f.id} open={k === 0}>
                          <summary>
                            <span {...ed(`${at}.q`, "text", "سؤال")}>{f.q}</span>
                            <Svg name="plus" className="tn-ico plus" />
                            <Svg name="minus" className="tn-ico minus" />
                          </summary>
                          <div {...ed(`${at}.a`, "multiline", "پاسخ")}>
                            <Para text={f.a} />
                          </div>
                        </details>
                      );
                    })}
                </div>
              ))}
            </div>
            <style>{cats.map((_, k) => `#tn-fq${k}:checked ~ .tn-faq-box .tn-faq-group:nth-of-type(${k + 1}) { display: block; } #tn-fq${k}:checked ~ .tn-faq-cats label:nth-of-type(${k + 1}) { background: var(--tn-gold); color: #17141a; }`).join("\n")}</style>
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── Example content (from the reference, in Persian) ───────────── */

export function taninSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`rs-${n}`);
  const png = (n: string) => sampleImage(`rs-${n}`, "png");
  const studio = (id: string, name: string, pic: string, price: number, area: string, people: string, description: string): Product => ({
    id,
    name,
    price,
    images: [img(`studio-${pic}`)],
    description,
    specs: [
      { label: "متراژ", value: area },
      { label: "ظرفیت", value: people },
    ],
  });
  const post = (id: string, title: string, image: string, date: string, category: string, excerpt: string) => ({
    id,
    title,
    image: img(image),
    date,
    category,
    excerpt,
    text: "استودیوی ما برای هنرمندانی ساخته شده که کیفیت صدا برایشان اهمیت دارد. فضاهای آکوستیک‌شده و تجهیزات به‌روز، هر جزئیات صدا را از وکال تا ساز با وضوح کامل ثبت می‌کنند.\nچه تنها کار کنید و چه با یک گروه کامل، این‌جا فضای راحتی برای خلاقیت و اجرای بی‌نقص دارید. مهندسان صدای ما در ضبط، میکس و مسترینگ کنارتان هستند تا صدای کارتان همان‌قدر خوب باشد که در ذهن دارید.\nدر این مطلب چند نکته‌ی کاربردی را مرور می‌کنیم: از آماده کردن صدا پیش از جلسه و تمرین با مترونوم تا انتخاب میکروفون مناسب و گوش دادن به نسخه‌ی نهایی روی چند سیستم پخش مختلف.",
  });
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "طنین",
      jobTitle: "استودیوی ضبط موسیقی",
      avatarUrl: "",
      email: "hello@example.com",
      phone: "021 2233 4455",
      summary: "به استودیوی موسیقی ما خوش آمدید؛ جایی برای این‌که موسیقی‌دان‌ها مهارتشان را بهتر کنند، با هم کار کنند و اثرشان را در فضایی راحت و با امکانات امروزی به اوج برسانند.",
      links: [
        { id: "sl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "sl2", type: "telegram", url: "https://t.me/example" },
        { id: "sl3", type: "whatsapp", url: "https://wa.me/example" },
        { id: "sl4", type: "website", url: "https://example.com" },
      ],
    },
    skills: [
      { id: "k1", name: "تولید موسیقی و مسترینگ حرفه‌ای قطعه‌ها" },
      { id: "k2", name: "جلسه‌های اختصاصی تنظیم و میکس" },
    ],
    education: [
      { id: "h1", institution: "رزرو استودیو", description: "استودیو و ساعت دلخواه را آنلاین رزرو کنید؛ کد پیگیری همان لحظه می‌آید.", period: { start: "2024-01", end: "2024-06", current: false } },
      { id: "h2", institution: "تخصص ما در خدمت شما", description: "مهندسان صدا و تهیه‌کننده‌های ما در هر مرحله راهنمایتان هستند.", period: { start: "2024-01", end: "2024-06", current: false } },
      { id: "h3", institution: "خدمات حرفه‌ای", description: "از ضبط تا مسترینگ، همه‌چیز را دقیق و بی‌دردسر انجام می‌دهیم.", period: { start: "2024-01", end: "2024-06", current: false } },
    ],
    projects: [
      { id: "r1", title: "نبض نیمه‌شب", role: "گروه نئون", description: "قطعه‌ای آرام با ملودی‌های دلنشین و حس نوستالژی شب‌های شهر.", technologies: [], images: [img("rec1")], url: `${SAMPLE_ASSETS_PATH}rs-song.mp3?v=${SAMPLE_ASSETS_VERSION}` },
      { id: "r2", title: "قلب روشن", role: "گروه گرو", description: "تلفیق گیتار آکوستیک و کوبه‌ای‌های گرم برای یک عاشقانه‌ی تازه.", technologies: [], images: [img("rec2")] },
      { id: "r3", title: "رویاهای کم‌رنگ", role: "آسمان‌خراش‌ها", description: "آلبومی تک‌آهنگی که در یک جلسه‌ی زنده‌ی چهارساعته ضبط شد.", technologies: [], images: [img("rec3")] },
    ],
    site: {
      ...base.site,
      aboutTitle: "استودیویی برای این‌که موسیقی‌دان‌ها *اوج بگیرند*",
      aboutText: "فضایی اختصاصی فراهم کرده‌ایم تا ایده‌های موسیقی شما زنده شوند؛ با استودیوهای مجهز و تیمی کاربلد.",
      aboutImage: png("bars"),
      heroImage: img("top-about"),
      accentImage: img("band"),
      signatureImage: img("top-contact"),
      contactTitle: "رویکرد ما همکاری و شفافیت است؛ هر مرحله با هدف شما هماهنگ است، از ایده تا اثر نهایی.",
      contactText: "قلب فضای خلاق ما؛ طراحی‌شده برای ضبط باکیفیت با تجهیزات حرفه‌ای و پشتیبانی متخصص.",
      contactNote: "شنبه تا چهارشنبه: ۹ صبح تا ۱۱ شب\nپنجشنبه: ۱۰ صبح تا ۶ عصر\nجمعه: تعطیل",
      address: "تهران، خیابان شریعتی، بالاتر از پل صدر، پلاک ۹۹",
      mapUrl: "https://www.openstreetmap.org/?mlat=35.7660&mlon=51.4430",
      gallery: [
        { id: "a1", title: "امیر میلانی", image: img("artist1") },
        { id: "a2", title: "نیوشا فرهمند", image: img("artist2") },
        { id: "a3", title: "آسمان آبی", image: img("artist3") },
        { id: "a4", title: "افق نقره‌ای", image: img("artist4") },
        { id: "a5", title: "سپیده راد", image: img("team3") },
      ],
      clients: [1, 2, 3, 4, 5].map((k) => ({ id: `c${k}`, name: `همکار ${k}`, image: png(`logo${k}`) })),
      testimonials: [
        { id: "t1", name: "لیام صدری", role: "تهیه‌کننده", text: "همراه خلاق هر موسیقی‌دان\nتیم این‌جا واقعاً بلد است یک آهنگ را به بهترین شکلش برساند. تخصص و علاقه‌شان کل کار را لذت‌بخش کرد؛ جای دیگری را تصور نمی‌کنم!", image: png("face1"), rating: 4 },
        { id: "t2", name: "نینا فروتن", role: "خواننده", text: "انتخابی ایده‌آل برای بهترین‌ها\nاین استودیو همه‌چیز را عوض کرد. تجهیزات و مهارت تیمشان کارهایم را یک پله بالاتر برد.", image: png("face2"), rating: 4 },
        { id: "t3", name: "داوود میرزایی", role: "تهیه‌کننده", text: "فضایی بی‌نظیر برای موسیقی\nجاهای زیادی ضبط کرده‌ام ولی هیچ‌کدام با این‌جا قابل مقایسه نیست. همه‌چیز عالی بود و نتیجه از انتظارم بیشتر شد.", image: png("face3"), rating: 5 },
        { id: "t4", name: "نسیم فرهادی", role: "هنرمند", text: "استودیویی که واقعاً به موسیقی‌ات اهمیت می‌دهد\nبا دقت و عشق کار می‌کنند تا هر جزئیات بی‌نقص باشد. از آهنگم خیلی راضی‌ام!", image: png("face4"), rating: 4 },
      ],
      shop: {
        heroImage: img("hero"),
        heroTitle: "صدایت را اوج بده، *شاهکارت* را بساز",
        heroText: "با آکوستیک حرفه‌ای و تجهیزات روز، استودیوی ما بهترین جا برای زنده کردن موسیقی شماست.",
        newTitle: "تازه‌ترین *آثار* را بشنوید!",
        newText: "تازه‌ترین قطعه‌هایی که در استودیو ضبط شده‌اند؛ آماده تا الهام‌بخش پروژه‌ی بعدی شما باشند.",
        promoTitle: "جلسه‌ی ضبطت را *همین امروز* رزرو کن",
        promoText: "در فضایی اختصاصی، ایده‌های موسیقی‌تان را زنده کنید. پاسخ سؤال‌های رایج درباره‌ی خدمات، جلسه‌ها و هزینه‌ها این‌جاست؛ اگر جوابتان را پیدا نکردید با ما تماس بگیرید.",
        showcaseText: "فضای مناسب پروژه‌تان را انتخاب کنید؛ برای ضبط، میکس یا مسترینگ، با گزینه‌هایی برای سبک‌های مختلف تولید.",
        discountTitle: "همراه مطمئن شما در تولید موسیقی؛ با خدمات حرفه‌ای که ایده‌تان را به اثر تبدیل می‌کند.",
        bestText: "ببینید هنرمندان تجربه‌ی کار در استودیوی ما را چطور توصیف می‌کنند و چرا ساختن موسیقی‌شان را به ما سپرده‌اند.",
        lookText: "از تازه‌ترین روندها، نکته‌ها و نظر کارشناسان تولید موسیقی باخبر شوید؛ مطالبی برای زنده نگه داشتن خلاقیت.",
        discoverTitle: "مجموعه‌ای از خدمات حرفه‌ای برای هدف‌های مختلف شما؛ با کیفیت و دقت در تک‌تک مراحل.",
        newsletterTitle: "از *تازه‌ترین آهنگ‌ها* باخبر شوید!",
        newsletterText: "تیم ما از نوازنده‌ها، تهیه‌کننده‌ها و مهندسان صدا کنار شماست تا به بهترین نسخه‌ی کارتان برسید.",
        showcaseTitle: "استودیوی اصلی",
        newImage: img("top-booking"),
        lookImage: img("top-studios"),
        trendImage: img("top-services"),
        discoverImage: img("top-blog"),
        slides: [
          { id: "sd1", image: img("about1") },
          { id: "sd2", image: img("about2") },
          { id: "sd3", image: img("vinyl") },
        ],
        perks: [
          { id: "f1", title: "بهترین تجهیزات", text: "ابزارهای باکیفیت برای این‌که ایده‌ی موسیقی شما دقیق اجرا شود.", image: png("icon1") },
          { id: "f2", title: "کیفیت صدا", text: "صدایی شفاف و تمیز که قطعه‌ی شما را می‌درخشاند.", image: png("icon2") },
          { id: "f3", title: "سازهای واقعی", text: "صدای سازهای واقعی و نوازنده‌های کاربلد در کنار شما.", image: png("icon3") },
          { id: "f4", title: "استودیوهای متنوع", text: "استودیوهایی متناسب با سبک‌ها و نیازهای مختلف تولید.", image: png("icon4") },
        ],
        stats: [
          { id: "m1", value: "۲۰", label: "کادر حرفه‌ای" },
          { id: "m2", value: "۲هزار", label: "عضو فعال" },
          { id: "m3", value: "۱۵", label: "سال تجربه" },
          { id: "m4", value: "۳", label: "شعبه" },
        ],
        categories: [
          { id: "sv1", name: "میکس صدا", image: img("sv-mixing"), text: "قطعه‌های شما را متعادل و پرقدرت می‌کنیم تا کیفیتی حرفه‌ای داشته باشند." },
          { id: "sv2", name: "ضبط وکال", image: img("sv-voice"), text: "از گویندگی تا خوانندگی؛ ترکیب فناوری روز و تخصص برای هر نیازی." },
          { id: "sv3", name: "مسترینگ", image: img("sv-mastering"), text: "صدایی صیقلی و آماده‌ی پخش با خدمات مسترینگ ما." },
          { id: "sv4", name: "ویرایش صدا", image: img("sv-editing"), text: "ضبط‌ها را تمیز و دقیق می‌کنیم تا تجربه‌ای شفاف داشته باشید." },
          { id: "sv5", name: "بازسازی صدا", image: img("sv-restore"), text: "ضبط‌های قدیمی یا آسیب‌دیده را به کیفیت اصلی‌شان برمی‌گردانیم." },
          { id: "sv6", name: "استودیوی سیار", image: img("sv-mobile"), text: "تجهیزات ضبط را به محل اجرای شما می‌آوریم." },
        ],
        products: [
          studio("st1", "استودیو ۱ - ضبط", "s1", 1800000, "۳۵ متر مربع", "تا ۶ نفر", "برای ضبط صدا طراحی شده؛ فضایی حرفه‌ای برای ثبت صدای باکیفیت، مناسب تهیه‌کننده‌ها، گوینده‌ها و پادکست."),
          studio("st2", "استودیو ۲ - میکس", "s2", 2200000, "۴۵ متر مربع", "تا ۹ نفر", "میز میکس و مانیتورهای دقیق برای رسیدن به تعادل کامل صدای قطعه‌ها."),
          studio("st3", "استودیو ۳ - مسترینگ", "s3", 2600000, "۴۵ متر مربع", "تا ۹ نفر", "مسترینگ دقیق با تجهیزات و مهندسی حرفه‌ای؛ برای تعادل کامل و آماده‌ی پخش."),
          studio("st4", "استودیو ۴ - موسیقی", "s4", 2600000, "۴۵ متر مربع", "تا ۹ نفر", "خانه‌ی خلاقیت شما با فناوری روز و فضایی چندمنظوره؛ مناسب ضبط، میکس و تولید صدای بی‌نقص."),
          studio("st5", "استودیو ۵ - تولید", "s5", 3000000, "۶۵ متر مربع", "تا ۱۰ نفر", "بزرگ‌ترین استودیوی ما برای تولید کامل؛ از ضبط گروهی تا تنظیم و میکس نهایی."),
        ],
        banners: [
          { id: "tm1", title: "هلیا مرادی", kicker: "متخصص مسترینگ", text: "هلیا با ضبط، میکس و مسترینگ دقیق، قطعه‌های خام را به آثاری صیقلی تبدیل می‌کند.", image: img("team3"), link: "https://instagram.com/example" },
          { id: "tm2", title: "آرمان شکیبا", kicker: "تهیه‌کننده", text: "آرمان سال‌هاست کنار هنرمندان جوان است تا صدای خاص خودشان را پیدا کنند.", image: img("team4"), link: "https://instagram.com/example" },
          { id: "tm3", title: "کاوه رستمی", kicker: "مهندس صدا", text: "کاوه از میکروفون تا میز میکس، هر جزئیات فنی ضبط را زیر نظر دارد.", image: img("team5"), link: "https://instagram.com/example" },
          { id: "tm4", title: "پدرام نیکو", kicker: "آهنگ‌ساز و تنظیم‌کننده", text: "پدرام به ایده‌های شما ساختار می‌دهد و تنظیمی می‌سازد که شنیده شود.", image: img("team6"), link: "https://instagram.com/example" },
        ],
        trustLogos: [1, 2, 3, 4].map((k) => ({ id: `fp${k}`, image: img(`foot${k}`) })),
        bandItems: ["هنرمندان", "صدا", "ساز", "استودیو", "اجرای زنده", "آلبوم"],
        faqTitle: "سؤال‌های *پرتکرار*",
        faq: [
          { id: "q1", category: "امکانات استودیو", q: "در استودیو ۱ چه پروژه‌هایی می‌شود ضبط کرد؟", a: "استودیو ۱ برای انواع پروژه‌ها طراحی شده؛ از ضبط وکال تکی تا قطعه‌های سازی و جلسه‌های گروه کامل. تجهیزات و آکوستیک آن برای همه‌ی سبک‌ها مناسب است." },
          { id: "q2", category: "امکانات استودیو", q: "آیا استودیو آکوستیک شده است؟", a: "بله؛ همه‌ی اتاق‌ها با پنل‌های جذب و پخش صدا آکوستیک شده‌اند." },
          { id: "q3", category: "امکانات استودیو", q: "چه سازهایی در استودیو هست؟", a: "درام کامل، پیانو دیجیتال، گیتار و باس، آمپ‌ها و انواع کیبورد در اختیارتان است." },
          { id: "q4", category: "امکانات استودیو", q: "ضبط زنده‌ی گروه کامل ممکن است؟", a: "بله؛ استودیو ۴ و ۵ برای ضبط هم‌زمان چند ساز طراحی شده‌اند." },
          { id: "q5", category: "رزرو و زمان", q: "حداقل زمان رزرو چقدر است؟", a: "هر رزرو دست‌کم یک ساعت است و می‌توانید تا شش ساعت پشت سر هم رزرو کنید." },
          { id: "q6", category: "رزرو و زمان", q: "چطور رزروم را لغو کنم؟", a: "از «رزروهای من» یا «پیگیری رزرو» تا روز جلسه می‌توانید رزرو را لغو کنید." },
          { id: "q7", category: "پشتیبانی و خدمات", q: "مهندس صدا همراه جلسه هست؟", a: "بله؛ در همه‌ی جلسه‌ها یک مهندس صدا کنار شماست." },
          { id: "q8", category: "قوانین", q: "می‌توانم همراه بیاورم؟", a: "تا ظرفیت هر استودیو می‌توانید همراه داشته باشید." },
        ],
        schedule: { days: [6, 0, 1, 2, 3, 4], start: "09:00", end: "23:00", slot: 60, capacity: 1, ahead: 30, closed: [], byService: true, span: true },
        posts: [
          post("b1", "در مسیر: تورها و اجراهای زنده‌ی پیش رو", "post1", "2026-11-02", "تور", "تورها، رویدادهای زنده و اجراهایی که نباید از دستشان بدهید."),
          post("b2", "صدای تازه: آهنگ‌های نو و هنرمندان در حال اوج", "post2", "2026-10-29", "موسیقی", "تازه‌ترین آهنگ‌ها و هنرمندانی که آینده‌ی موسیقی را می‌سازند."),
          post("b3", "روندهای مهم تولید موسیقی در سال جدید", "post3", "2026-10-26", "تولید", "چه ابزارها و سبک‌هایی امسال بیشتر شنیده می‌شوند؟"),
          post("b4", "کلاس استادی: نکته‌های تهیه‌کننده‌ها برای صدای بهتر", "post4", "2026-10-23", "نکته‌ها", "تجربه‌ی تهیه‌کننده‌های باسابقه برای میکس و ضبط تمیزتر."),
          post("b5", "ابزار و تجهیزات ضروری هر تور", "post5", "2026-10-20", "تور", "چک‌لیستی ساده برای این‌که در سفر کاری چیزی جا نماند."),
          post("b6", "چطور بهترین صدا را در اجرای زنده ضبط کنیم", "post6", "2026-10-18", "موسیقی", "از جای میکروفون‌ها تا کنترل صدای سالن."),
          post("b7", "سالن‌هایی که باید یک بار در آن‌ها اجرا کنید", "post7", "2026-10-12", "تور", "مکان‌هایی با آکوستیک و حال‌وهوای خاص."),
        ],
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
@font-face { font-family: "Tanin Light"; src: url("/_assets/vazirmatn/files/vazirmatn-arabic-300-normal.woff2") format("woff2"); font-weight: 300; font-display: swap; }
.tn {
  --tn-gold: var(--color-primary);
  --tn-bg: #17141A;
  --tn-panel: #221E24;
  --tn-field: #36333A;
  --tn-ink: #FFFFFF;
  --tn-text: #BEB8BF;
  --tn-line: rgb(255 255 255 / .12);
  --tn-head: var(--font-heading), sans-serif;
  background: var(--tn-bg);
  color: var(--tn-text);
  line-height: 1.9;
  /* Elements waiting to slide in sit beside the page: they must not make it scroll sideways. */
  overflow-x: clip;
}
.tn a { color: inherit; text-decoration: none; }
.tn img { display: block; max-width: 100%; }
.tn h1, .tn h2, .tn h3, .tn h4 { margin: 0; color: var(--tn-ink); font-family: var(--tn-head); font-weight: 800; line-height: 1.5; }
.tn-wrap { width: min(1840px, calc(100% - 48px)); margin-inline: auto; }
.tn-sec { position: relative; padding: clamp(60px, 7cqi, 120px) 0; }
.tn-body { color: var(--tn-text); }
.tn-body p { margin: 0 0 14px; }
.tn-muted { opacity: .75; }
.tn-ico { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; flex: none; vertical-align: -3px; }
.tn-radio { position: absolute; opacity: 0; pointer-events: none; }

/* A word on a painted brush stroke. */
.tn-brush { position: relative; z-index: 0; white-space: nowrap; }
.tn-brush::before { content: ""; position: absolute; z-index: -1; inset: 38% -10% 4% -8%; background: url("${sampleImage("rs-brush", "png")}") center / 100% 100% no-repeat; opacity: .85; transform: scaleX(0); transform-origin: right; animation: tn-paint .9s .5s cubic-bezier(.2, .7, .2, 1) forwards; }

.tn-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; padding: 0 30px; border: 1px solid var(--tn-gold); background: var(--tn-gold); color: #17141A !important; font: inherit; font-weight: 700; cursor: pointer; transition: background .35s, color .35s, transform .35s; }
.tn-btn:hover { background: transparent; color: var(--tn-gold) !important; }
.tn-btn.line { background: transparent; color: var(--tn-gold) !important; }
.tn-btn.line:hover { background: var(--tn-gold); color: #17141A !important; }
.tn-link { display: inline-block; padding-bottom: 4px; border-bottom: 1px solid currentColor; color: var(--tn-gold); font-weight: 700; transition: padding .3s; }
.tn-link:hover { padding-inline-start: 8px; }

/* Header */
.tn-head { position: sticky; top: 0; z-index: 20; height: 0; }
.tn-head-in { display: flex; align-items: center; gap: 30px; height: 90px; }
.tn-head::before { content: ""; position: absolute; inset: 0 0 auto; height: 90px; background: rgb(23 20 26 / .92); backdrop-filter: blur(8px); opacity: 0; transition: opacity .4s; }
@supports (animation-timeline: scroll()) {
  .tn-head::before { animation: tn-solid linear both; animation-timeline: scroll(root); animation-range: 0 160px; }
}
@keyframes tn-solid { to { opacity: 1; } }
.tn-head-in > * { position: relative; }
.tn-logo { display: inline-flex; align-items: center; gap: 4px; color: #EDEAEE; font-family: var(--tn-head); font-size: 34px; font-weight: 400; line-height: 1; }
.tn-logo b { font-weight: 500; }
.tn-vinyl { width: 34px; height: 34px; transition: transform 1.2s cubic-bezier(.2, .7, .2, 1); }
.tn-logo:hover .tn-vinyl { transform: rotate(360deg); }
.tn-vinyl circle { fill: #2A2328; stroke: var(--tn-gold); stroke-width: 2; }
.tn-vinyl .ring { fill: none; stroke: rgb(255 255 255 / .18); stroke-width: 1; }
.tn-vinyl .label { fill: var(--tn-gold); stroke: none; }
.tn-vinyl .hole { fill: #17141A; stroke: none; }
.tn-logo.big { font-size: clamp(70px, 10cqi, 150px); gap: 12px; }
.tn-logo.big .tn-vinyl { width: .8em; height: .8em; }
.tn-nav { display: flex; align-items: center; justify-content: center; gap: clamp(18px, 2.4cqi, 40px); flex: 1; }
.tn-nav > a, .tn-drop > button { position: relative; padding: 8px 0; border: 0; background: none; color: #B7B1B9; font: inherit; cursor: pointer; transition: color .3s; }
.tn-nav > a::after, .tn-drop > button::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 2px; background: var(--tn-gold); transform: scaleX(0); transition: transform .35s; }
.tn-nav > a:hover, .tn-nav > a[aria-current="page"], .tn-drop:hover > button, .tn-drop.on > button { color: #fff; }
.tn-nav > a[aria-current="page"]::after, .tn-drop.on > button::after, .tn-nav > a:hover::after { transform: scaleX(1); }
.tn-drop { position: relative; }
.tn-drop > button .tn-ico { width: 14px; height: 14px; }
.tn-drop-menu { position: absolute; top: 100%; inset-inline-start: -18px; display: grid; min-width: 190px; padding: 10px 0; background: var(--tn-panel); box-shadow: 0 20px 40px -20px rgb(0 0 0 / .7); opacity: 0; visibility: hidden; transform: translateY(10px); transition: opacity .3s, transform .3s, visibility .3s; }
.tn-drop:hover .tn-drop-menu, .tn-drop:focus-within .tn-drop-menu { opacity: 1; visibility: visible; transform: none; }
.tn-drop-menu a { padding: 8px 20px; color: #CFC9D0; transition: color .3s, padding .3s; }
.tn-drop-menu a:hover, .tn-drop-menu a[aria-current="page"] { color: var(--tn-gold); padding-inline-start: 26px; }
.tn-head-contact { padding-inline-start: 22px; border-inline-start: 1px solid var(--tn-line); color: #fff; font-weight: 700; }
.tn-head-contact:hover, .tn-head-contact[aria-current="page"] { color: var(--tn-gold); }
.tn-burger { display: none; }

/* Hero */
.tn-hero { position: relative; display: flex; align-items: flex-end; min-height: min(100vh, 960px); overflow: hidden; }
.tn-hero-pic, .tn-band-pic { position: absolute; inset: 0; }
.tn-hero-pic img, .tn-band-pic img { width: 100%; height: 100%; object-fit: cover; }
.tn-hero-pic img { animation: tn-zoom 2.2s cubic-bezier(.2, .7, .2, 1) both; }
.tn-hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(rgb(23 20 26 / .55), rgb(23 20 26 / .25) 40%, rgb(23 20 26 / .75) 85%, var(--tn-bg)); pointer-events: none; }
.tn-hero-in { position: relative; z-index: 1; padding: 170px 0 60px; }
.tn-hero h1 { max-width: 15ch; font-size: clamp(40px, 6cqi, 116px); line-height: 1.4; }
.tn-hero p { max-width: 52ch; margin: 18px 0 34px; color: #DDD7DE; font-size: clamp(15px, 1.05cqi, 19px); }
.tn-hero-btns { display: flex; flex-wrap: wrap; gap: 14px; }
.tn-player-box { margin-top: clamp(50px, 7cqi, 100px); }
.tn-player-box > small { display: block; margin-bottom: 14px; color: #D8D2D9; }
.tn-player { display: flex; align-items: center; gap: 22px; padding: 22px 24px; background: rgb(23 20 26 / .55); backdrop-filter: blur(14px); }
.tn-disc { position: relative; width: 84px; height: 84px; flex: none; border-radius: 50%; overflow: hidden; animation: tn-spin 12s linear infinite; }
.tn-disc img { width: 100%; height: 100%; object-fit: cover; }
.tn-disc::after { content: ""; position: absolute; inset: 0; margin: auto; width: 18px; height: 18px; border: 2px solid #fff; border-radius: 50%; }
.tn-song { display: grid; min-width: 150px; }
.tn-song b { color: #fff; }
.tn-song small { color: var(--tn-gold); }
.tn-player audio { flex: 1; min-width: 0; height: 44px; filter: invert(.88) sepia(.3) hue-rotate(160deg) saturate(.6); opacity: .9; }

/* Latest records */
.tn-records { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; align-items: start; }
.tn-records-head h2 { font-size: clamp(30px, 3cqi, 54px); line-height: 1.5; }
.tn-records-head p { margin: 16px 0 26px; }
.tn-record b { display: block; margin-top: 16px; color: var(--tn-gold); font-size: 20px; }
.tn-record > small { color: var(--tn-text); }
.tn-record-pic { position: relative; display: block; aspect-ratio: 1; overflow: hidden; }
.tn-record-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s; }
.tn-record-over { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 14px; padding: 20px; background: rgb(23 20 26 / .7); backdrop-filter: blur(3px); color: #D9D3DA; font-size: 13px; text-align: center; opacity: 0; transition: opacity .45s; }
.tn-record-over small { transform: translateY(14px); transition: transform .45s; }
.tn-record:hover .tn-record-over, .tn-record:focus-within .tn-record-over { opacity: 1; }
.tn-record:hover .tn-record-over small { transform: none; }
.tn-record:hover img { transform: scale(1.06); }
.tn-round { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; background: var(--tn-gold); color: #17141A; transition: transform .35s; }
.tn-round:hover { transform: scale(1.1); }
.tn-round .tn-ico { width: 20px; height: 20px; stroke-width: 2; }

/* Logos (moving strip) */
.tn-logos { overflow: hidden; padding: 20px 0; mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent); }
.tn-logos-track { display: flex; gap: clamp(40px, 5cqi, 90px); width: max-content; animation: tn-marquee 28s linear infinite; }
.tn-logos-track span { flex: none; display: grid; place-items: center; width: 170px; height: 60px; opacity: .75; transition: opacity .3s; }
.tn-logos-track span:hover { opacity: 1; }
.tn-logos-track img { max-width: 100%; max-height: 100%; object-fit: contain; }
.tn-logos:hover .tn-logos-track { animation-play-state: paused; }

/* A studio for musicians */
.tn-unite { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(30px, 5cqi, 80px); align-items: center; }
.tn-unite h2 { font-size: clamp(30px, 3cqi, 54px); }
.tn-unite .tn-body { margin: 18px 0 22px; }
.tn-ticks { display: grid; gap: 12px; margin: 0 0 40px; padding: 0; list-style: none; }
.tn-ticks li { display: flex; gap: 12px; align-items: center; }
.tn-ticks .tn-ico { color: var(--tn-gold); width: 22px; height: 22px; }
.tn-bars img { width: 100%; height: auto; }
.tn-stats { display: grid; grid-template-columns: repeat(var(--cols, 3), 1fr); text-align: center; }
.tn-stats.n4 { --cols: 4; }
.tn-stats > div { display: grid; gap: 6px; padding: 10px 14px; border-inline-start: 1px solid var(--tn-line); }
.tn-stats > div:first-child { border-inline-start: 0; }
.tn-stats b { color: #fff; font-size: clamp(32px, 3cqi, 46px); line-height: 1.2; }
.tn-stats i { color: var(--tn-gold); font-style: normal; font-size: .6em; vertical-align: super; margin-inline-start: 4px; }
.tn-stats small { color: #E6E1E7; }

/* Features */
.tn-features { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; text-align: center; }
.tn-features article { display: grid; justify-items: center; align-content: start; gap: 12px; }
.tn-feat-ico { display: grid; place-items: center; width: 74px; height: 74px; }
.tn-feat-ico img { max-width: 100%; max-height: 100%; transition: transform .5s; }
.tn-features article:hover .tn-feat-ico img { transform: translateY(-6px) rotate(-6deg); }
.tn-features h3 { font-size: 24px; }
.tn-features p { margin: 0; max-width: 28ch; font-size: 14.5px; }
.tn-features.two { grid-template-columns: 1fr 1fr; padding: 0; text-align: start; }
.tn-features.two article { justify-items: start; }

/* Services strip */
.tn-strip { position: relative; display: grid; grid-template-columns: repeat(var(--n), 1fr); height: clamp(420px, 37cqi, 600px); overflow: hidden; background: #000; }
.tn-strip-col { position: relative; display: block; border-inline-start: 1px solid rgb(255 255 255 / .5); }
.tn-strip-col:first-child { border-inline-start: 0; }
.tn-strip-pic { position: absolute; top: 0; bottom: 0; inset-inline-start: calc(var(--k) * -100%); width: calc(var(--n) * 100%); z-index: 0; opacity: 0; transition: opacity .6s; pointer-events: none; }
.tn-strip-pic img { width: 100%; height: 100%; object-fit: cover; }
.tn-strip-col > b { position: relative; z-index: 2; display: block; padding: 22px 20px; color: #fff; font-size: clamp(18px, 1.7cqi, 26px); text-align: center; line-height: 1.5; transition: color .35s, background .35s; }
.tn-strip-card { position: absolute; z-index: 2; top: 44%; inset-inline-start: 50%; width: min(340px, 190%); padding: 22px 24px; background: rgb(60 52 50 / .55); backdrop-filter: blur(14px); opacity: 0; transform: translate(50%, 16px); transition: opacity .45s, transform .45s; pointer-events: none; }
.tn-strip-card em { display: block; margin-bottom: 8px; color: var(--tn-gold); font-style: normal; font-weight: 700; }
.tn-strip-card small { color: #E1DCE2; font-size: 13.5px; }
.tn-strip-col:first-child .tn-strip-card { inset-inline-start: 0; transform: translate(0, 16px); }
.tn-strip-col:last-child .tn-strip-card { inset-inline-start: auto; inset-inline-end: 0; transform: translate(0, 16px); }
.tn-strip .tn-strip-col.def .tn-strip-pic, .tn-strip-col:hover .tn-strip-pic, .tn-strip-col:focus-visible .tn-strip-pic { opacity: 1; }
.tn-strip:hover .tn-strip-col.def:not(:hover) .tn-strip-pic { opacity: 0; }
.tn-strip-col.def .tn-strip-card, .tn-strip-col:hover .tn-strip-card, .tn-strip-col:focus-visible .tn-strip-card { opacity: 1; transform: translate(50%, 0); }
.tn-strip-col:first-child:hover .tn-strip-card, .tn-strip-col:last-child:hover .tn-strip-card, .tn-strip-col.def:first-child .tn-strip-card, .tn-strip-col.def:last-child .tn-strip-card { transform: none; }
.tn-strip:hover .tn-strip-col.def:not(:hover) .tn-strip-card { opacity: 0; }
.tn-strip-col.def > b, .tn-strip-col:hover > b { background: var(--tn-bg); color: var(--tn-gold); }
.tn-strip:hover .tn-strip-col.def:not(:hover) > b { background: none; color: #fff; }

/* Choose your studio */
.tn-headline { margin-bottom: clamp(30px, 4cqi, 50px); }
.tn-headline.center { max-width: 760px; margin-inline: auto; text-align: center; }
.tn-headline h2 { font-size: clamp(30px, 3cqi, 54px); }
.tn-headline p { margin: 12px 0 0; }
.tn-tabs { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr); align-items: center; gap: 30px; }
.tn-tab-list { position: relative; z-index: 2; display: grid; gap: 8px; align-self: center; width: min(310px, 100%); margin-inline-end: -120px; padding: 26px 22px; background: rgb(34 30 36 / .78); backdrop-filter: blur(10px); grid-row: 1; grid-column: 1; justify-self: start; }
.tn-tab-list label { padding: 8px 12px; color: #CFC8CF; font-size: 19px; font-weight: 700; cursor: pointer; transition: background .35s, color .35s; }
.tn-tab-list label:hover { color: #fff; }
.tn-tab-panes { display: grid; grid-column: 1 / -1; grid-row: 1; }
.tn-tab-pane { grid-area: 1 / 1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr); gap: 30px; align-items: center; opacity: 0; visibility: hidden; transform: translateY(14px); transition: opacity .5s, transform .5s, visibility .5s; }
.tn-tab-pic { aspect-ratio: 1.3; margin-inline-start: clamp(60px, 9cqi, 150px); overflow: hidden; }
.tn-tab-pic img { width: 100%; height: 100%; object-fit: cover; }
.tn-tab-pane h3 { font-size: 26px; }
.tn-tab-pane h3 em, .tn-tab-list label em { color: var(--tn-gold); font-style: normal; }
.tn-tab-pane .tn-body { max-width: 52ch; margin: 12px 0 18px; font-size: 15px; }
.tn-price { margin: 0 0 14px; color: #fff; font-size: 18px; }
.tn-price b { color: var(--tn-gold); font-size: clamp(30px, 3cqi, 46px); }
.tn-facts { display: flex; gap: 22px; margin: 0 0 22px; color: #fff; font-size: 14px; }
.tn-facts .tn-ico { color: var(--tn-gold); }

/* Artists */
.tn-artists { overflow: hidden; }
.tn-artists-head, .tn-split-head { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center; margin-bottom: clamp(30px, 4cqi, 50px); }
.tn-artists-head h2, .tn-split-head h2 { font-size: clamp(30px, 3cqi, 54px); }
.tn-artists-head p, .tn-split-head p { margin: 0; }
.tn-slider { --tn-card: calc((100% - 3 * var(--tn-gap)) / 4); --tn-gap: 24px; position: relative; }
.tn-slider-view { overflow: hidden; }
.tn-slider-track { display: flex; gap: var(--tn-gap); transition: transform .7s cubic-bezier(.2, .7, .2, 1); }
.tn-artist { position: relative; flex: 0 0 var(--tn-card); display: grid; grid-template-columns: 54px 1fr; align-items: end; }
.tn-artist::before { content: ""; position: absolute; inset: 30% 0 0; background: #0E0C0F; z-index: 0; }
.tn-artist-pic { position: relative; z-index: 1; grid-column: 2; aspect-ratio: .75; overflow: hidden; }
.tn-artist-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s, filter .5s; }
.tn-artist > b { position: relative; z-index: 1; grid-column: 1; grid-row: 1; align-self: end; padding-bottom: 14px; color: #fff; font-size: 22px; writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; transition: color .4s; }
.tn-artist:hover > b { color: var(--tn-gold); }
.tn-artist:hover img { transform: scale(1.06); }
.tn-arrows { display: flex; justify-content: center; margin-top: 30px; }
.tn-arrow-set { display: none; gap: 14px; }
.tn-arrow-set label { display: grid; place-items: center; width: 46px; height: 46px; border: 1px solid var(--tn-gold); border-radius: 50%; color: var(--tn-gold); cursor: pointer; transition: background .3s, color .3s; }
.tn-arrow-set label:hover { background: var(--tn-gold); color: #17141A; }
.tn-arrow-set label.off { opacity: .35; pointer-events: none; }

/* Booking band and forms */
.tn-band { overflow: hidden; }
.tn-band-pic::after { content: ""; position: absolute; inset: 0; background: linear-gradient(rgb(23 20 26 / .2), rgb(23 20 26 / .6)); }
.tn-band-in { position: relative; display: grid; grid-template-columns: 1fr 1fr; align-items: end; }
.tn-band-text { padding: clamp(30px, 4cqi, 50px); background: linear-gradient(transparent, rgb(23 20 26 / .85) 40%); backdrop-filter: blur(16px); }
.tn-band-text h2 { margin-bottom: 30px; font-size: clamp(28px, 2.6cqi, 40px); }
.tn-band-text dl { display: grid; grid-template-columns: auto 1fr; gap: 14px 40px; margin: 0; font-size: 14px; }
.tn-band-text dt { color: #CFC8CF; }
.tn-band-text dd { margin: 0; color: #fff; }
.tn-form { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: clamp(24px, 3cqi, 40px); background: var(--tn-panel); }
.tn-form > label { display: grid; gap: 8px; }
.tn-form > label.wide, .tn-form > button { grid-column: 1 / -1; }
.tn-form > label > span { color: #fff; font-size: 17px; }
.tn-form i { color: var(--tn-gold); font-style: normal; }
.tn-form input, .tn-form select, .tn-form textarea, .tn-book-pick select { width: 100%; box-sizing: border-box; padding: 13px 16px; border: 1px solid transparent; background: var(--tn-field); color: #fff; font: inherit; transition: border-color .3s; }
.tn-form input:focus, .tn-form select:focus, .tn-form textarea:focus { outline: none; border-color: var(--tn-gold); }
.tn-form ::placeholder { color: #A9A3AA; }
.tn-form > button { justify-self: start; }
.tn-band.full .tn-band-in { grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); }
.tn-book { display: block; }
.tn-book-pick { display: grid; grid-template-columns: 1fr 1fr auto; gap: 14px; align-items: end; margin-bottom: 22px; }
.tn-book-pick label { display: grid; gap: 6px; color: #fff; }
.tn .bk { --bk-accent: var(--tn-gold); --bk-ink: #fff; --bk-soft: #2B272E; --bk-line: #3A363D; --bk-dark: var(--tn-gold); --bk-on: #17141A; --bk-head: var(--tn-head); grid-template-columns: minmax(0, 1fr); }
.tn .bk-cal { background: #1E1B20; }
.tn .bk-day { color: #6F6A71; }
.tn .bk-day.open { color: #fff; }
.tn .bk-form input:not([type="radio"]), .tn .bk-form select, .tn .bk-form textarea { background: var(--tn-field); border-color: transparent; color: #fff; }
.tn .bk-times span { background: var(--tn-field); border-color: transparent; color: #fff; }
.tn .bk-btn { color: #17141A; }
.tn-book-note { margin: 0 0 14px; font-size: 14px; }
.tn-book-sum { margin: 0; color: var(--tn-gold); font-weight: 700; }
.tn-mine { display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0 0; font-size: 14px; }
.tn-mine a { color: #fff; text-decoration: underline; text-underline-offset: 4px; }

/* Reviews */
.tn-review-list { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.tn-review { position: relative; display: grid; align-content: start; gap: 12px; padding: 26px 22px; background: var(--tn-panel); transition: transform .4s, background .4s; }
.tn-review:hover { transform: translateY(-6px); background: #29242B; }
.tn-review header { display: flex; gap: 12px; align-items: center; }
.tn-face { width: 50px; height: 50px; flex: none; border-radius: 50%; overflow: hidden; }
.tn-face img { width: 100%; height: 100%; object-fit: cover; }
.tn-review header b { display: block; color: #fff; font-size: 19px; font-weight: 500; transition: color .3s; }
.tn-review:hover header b { color: var(--tn-gold); }
.tn-review header small { color: #CFC8CF; }
.tn-stars { display: flex; gap: 2px; }
.tn-stars .tn-ico { width: 18px; height: 18px; fill: #6F6A71; stroke: none; }
.tn-stars .tn-ico.on { fill: #F5C518; }
.tn-review h3 { color: #E2DCE3; font-size: 19px; font-weight: 500; line-height: 1.6; }
.tn-review p { margin: 8px 0 0; font-size: 13px; font-style: italic; }
.tn-review .q { width: 30px; height: 30px; fill: none; stroke: #5D575F; }

/* News */
.tn-news-grid { display: grid; grid-template-columns: 1fr 1fr .95fr; gap: 26px; align-items: start; }
.tn-post { display: grid; gap: 10px; align-content: start; }
.tn-post-pic { position: relative; display: block; aspect-ratio: .8; overflow: hidden; }
.tn-post-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s; }
.tn-post:hover .tn-post-pic img { transform: scale(1.05); }
.tn-post-pic i { position: absolute; bottom: 18px; inset-inline-start: 18px; padding: 4px 16px; background: rgb(23 20 26 / .75); color: #fff; font-style: normal; font-size: 14px; }
.tn-post > small, .tn-date { display: flex; gap: 8px; align-items: center; font-size: 14px; }
.tn-post h3 { font-size: clamp(20px, 1.8cqi, 26px); transition: color .3s; }
.tn-post a:hover h3 { color: var(--tn-gold); }
.tn-post p { margin: 0; font-size: 14.5px; }
.tn-news-list { display: grid; }
.tn-news-list > em { color: var(--tn-gold); font-style: normal; font-size: 19px; font-weight: 700; }
.tn-news-list > a:not(.tn-btn) { display: grid; gap: 10px; padding: 18px 0; border-bottom: 1px solid var(--tn-line); }
.tn-news-list b { color: #fff; font-weight: 500; transition: color .3s; }
.tn-news-list a:hover b { color: var(--tn-gold); }
.tn-news-list small { font-size: 13px; }
.tn-news-list .tn-btn { justify-self: start; margin-top: 26px; }

/* Footer */
.tn-foot { border-top: 1px solid rgb(255 255 255 / .35); padding-top: 34px; overflow: hidden; }
.tn-foot-top { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 40px; font-size: 14px; }
.tn-foot-top .tn-socials { margin-inline-start: auto; }
.tn-socials { display: inline-flex; flex-wrap: wrap; gap: 6px 18px; font-size: 14px; }
.tn-socials a { color: #E6E1E7; transition: color .3s; }
.tn-socials a:hover { color: var(--tn-gold); }
.tn-foot-mid { display: grid; grid-template-columns: minmax(0, .4fr) minmax(0, 1fr); gap: 40px; align-items: start; margin-top: 22px; }
.tn-tags-box h4 { padding-bottom: 12px; border-bottom: 1px solid var(--tn-line); color: #fff; font-size: 22px; font-weight: 500; }
.tn-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.tn-tags a, .tn-tags span { padding: 2px 10px; background: #3A363D; color: #fff; font-size: 14px; transition: background .3s, color .3s; }
.tn-tags a:hover, .tn-tags .on { background: var(--tn-gold); color: #17141A; }
.tn-foot-mail { display: grid; justify-items: end; gap: 6px; }
.tn-foot-mail small { justify-self: start; }
.tn-foot-mail a { color: #fff; font-size: clamp(34px, 5.6cqi, 84px); line-height: 1.2; direction: ltr; transition: color .4s; }
.tn-foot-mail a:hover { color: var(--tn-gold); }
.tn-foot-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 30px; margin-top: 20px; }
.tn-foot-pics { display: flex; gap: 20px; }
.tn-foot-pics span { width: 86px; height: 86px; overflow: hidden; }
.tn-foot-pics img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(.3); transition: transform .5s, filter .5s; }
.tn-foot-pics span:hover img { transform: scale(1.1); filter: none; }
.tn-copy { margin: 0; padding: 16px 0 24px; color: #8B858C; font-size: 13px; }

/* Inner page tops */
.tn-ptop { padding-top: 90px; }
.tn-ptop-in { position: relative; min-height: clamp(380px, 34cqi, 640px); overflow: hidden; }
.tn-ptop-pic { position: absolute; inset: 0 auto 0 0; width: 72%; }
.tn-ptop-pic img { width: 100%; height: 100%; object-fit: cover; animation: tn-reveal 1.2s .15s cubic-bezier(.2, .7, .2, 1) both; }
.tn-ptop h1 { position: relative; z-index: 1; display: grid; justify-items: start; font-family: "Tanin Light", var(--tn-head); font-size: clamp(64px, 11cqi, 210px); font-weight: 300; line-height: 1.2; }
.tn-ptop h1 span { padding: 0 .1em 0 .2em; background: var(--tn-bg); }
.tn-ptop .w1 { animation: tn-from-end 1s .2s cubic-bezier(.2, .7, .2, 1) both; }
.tn-ptop .w2 { margin-top: .15em; animation: tn-from-start 1s .35s cubic-bezier(.2, .7, .2, 1) both; }
.tn-ptop-bar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px 30px; padding: 16px 0; font-size: 14px; }
.tn-crumbs { display: flex; gap: 8px; color: #fff; }
.tn-crumbs em { color: var(--tn-gold); font-style: normal; }
.tn-ptop-info { display: flex; flex-wrap: wrap; gap: 8px 28px; }

/* About */
.tn-mail { display: inline-block; margin: 18px 0 10px; color: #fff; font-size: 20px; font-weight: 700; direction: ltr; }
.tn-haven-grid { display: grid; grid-template-columns: 1.45fr 1fr; gap: 20px 26px; }
.tn-haven-a { aspect-ratio: 2; overflow: hidden; }
.tn-haven-b { grid-row: span 2; aspect-ratio: .75; overflow: hidden; }
.tn-haven-a img, .tn-haven-b img { width: 100%; height: 100%; object-fit: cover; }
.tn-haven-grid .tn-features { padding-top: 10px; }
.tn-team-in { position: relative; display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); gap: 34px; align-items: start; }
.tn-team-pics { display: flex; gap: 10px; height: clamp(240px, 20cqi, 340px); }
.tn-member { position: relative; flex: 1 1 0; overflow: hidden; cursor: pointer; filter: grayscale(.4); transition: flex-grow .6s cubic-bezier(.2, .7, .2, 1), filter .5s; }
.tn-member > span, .tn-member img { width: 100%; height: 100%; }
.tn-member img { object-fit: cover; }
.tn-member:hover { filter: none; }
.tn-member-social { position: absolute; bottom: 18px; inset-inline-start: 50%; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #fff; color: #17141A; opacity: 0; transform: translate(50%, 10px); transition: opacity .35s, transform .35s; }
.tn-member:hover .tn-member-social { opacity: 1; transform: translate(50%, 0); }
.tn-team-info { display: grid; }
.tn-team-card { grid-area: 1 / 1; opacity: 0; visibility: hidden; transform: translateY(12px); transition: opacity .5s, transform .5s, visibility .5s; }
.tn-team-card h3 { color: var(--tn-gold); font-size: 28px; }
.tn-team-card small { display: block; margin-bottom: 16px; }
.tn-team-card p { margin: 0 0 18px; color: #fff; font-size: 19px; line-height: 1.8; }
.tn-news-letter { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(30px, 4cqi, 60px); align-items: center; }
.tn-news-letter h2 { font-size: clamp(30px, 3cqi, 54px); }
.tn-subscribe { display: flex; gap: 12px; margin: 26px 0 20px; }
.tn-subscribe input { flex: 1; min-width: 0; padding: 15px 18px; border: 0; background: #EFEDEF; color: #17141A; font: inherit; }
.tn-subscribe button { display: grid; place-items: center; width: 56px; border: 0; background: var(--tn-gold); color: #17141A; cursor: pointer; transition: transform .3s; }
.tn-subscribe button:hover { transform: translateX(-4px); }
.tn-follow { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; margin: 0; }
.tn-follow b { color: #fff; font-size: 20px; }
.tn-frame { display: block; overflow: hidden; aspect-ratio: 1.5; }
.tn-frame img { width: 100%; height: 100%; object-fit: cover; }

/* Services page */
.tn-services { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.tn-service { position: relative; display: grid; align-content: end; gap: 6px; aspect-ratio: 1.5; padding: clamp(20px, 3cqi, 40px); overflow: hidden; color: #fff; }
.tn-service > span { position: absolute; inset: 0; }
.tn-service img { width: 100%; height: 100%; object-fit: cover; transition: transform .9s; }
.tn-service::after { content: ""; position: absolute; inset: 0; background: linear-gradient(transparent 45%, rgb(23 20 26 / .6)); transition: background .5s; }
.tn-service:hover::after { background: linear-gradient(transparent 30%, rgb(214 166 112 / .55)); }
.tn-service:hover img { transform: scale(1.05); }
.tn-service b, .tn-service small { position: relative; z-index: 1; }
.tn-service b { font-size: clamp(22px, 2cqi, 30px); }
.tn-service small { display: flex; gap: 8px; align-items: center; }
.tn-steps { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; text-align: center; }
.tn-step { display: grid; justify-items: center; gap: 12px; }
.tn-step img { width: 64px; height: 64px; object-fit: contain; }
.tn-step h3 { font-size: 26px; }
.tn-step p { margin: 0; max-width: 30ch; }
.tn-step i { color: #3D3940; font-size: 64px; font-weight: 900; font-style: normal; line-height: 1; }
.tn-step.s1 { padding-top: 80px; }
.tn-step.s1 i { order: -1; }

/* Blog */
.tn-blog { display: grid; grid-template-columns: repeat(12, 1fr); gap: 34px 26px; }
.tn-blog > .tn-post { grid-column: span 4; }
.tn-blog > .b0 { grid-column: span 8; }
.tn-blog > .b3 { grid-column: span 8; }
.tn-blog > .b0 .tn-post-pic, .tn-blog > .b3 .tn-post-pic { aspect-ratio: 1.5; }
.tn-blog.small { grid-template-columns: 1fr 1fr; }
.tn-blog.small > .tn-post { grid-column: auto; }
.tn-blog.small .tn-post-pic { aspect-ratio: 1.5; }
.tn-article-grid { display: grid; grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr); gap: clamp(30px, 4cqi, 60px); }
.tn-post-pic.big { aspect-ratio: 1.5; margin-bottom: 16px; }
.tn-article h2 { margin: 10px 0 14px; font-size: clamp(24px, 2.2cqi, 32px); }
.tn-article footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--tn-line); }
.tn-article footer .tn-tags { margin: 0; align-items: center; }
.tn-share { display: flex; gap: 12px; align-items: center; }
.tn-more { margin-top: 40px; }
.tn-more h3 { margin-bottom: 20px; font-size: 26px; }
.tn-side { display: grid; align-content: start; gap: 40px; }
.tn-side h3 { padding-bottom: 12px; border-bottom: 1px solid var(--tn-line); font-size: 24px; }
.tn-recent { display: grid; gap: 6px; padding: 14px 0; }
.tn-recent b { color: #fff; font-weight: 500; transition: color .3s; }
.tn-recent:hover b { color: var(--tn-gold); }
.tn-recent small { font-size: 13px; }
.tn-cats { margin: 14px 0 0; padding-inline-start: 18px; display: grid; gap: 10px; }
.tn-cats li::marker { color: var(--tn-gold); }
.tn-cats li.on a, .tn-cats a:hover { color: var(--tn-gold); }

/* Contact */
.tn-contact { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(30px, 4cqi, 60px); align-items: start; }
.tn-contact h2 { font-size: clamp(30px, 3cqi, 54px); }
.tn-main-studio { margin-top: 30px; }
.tn-main-studio h3 { color: var(--tn-gold); font-size: 28px; }
.tn-info { display: grid; gap: 10px; margin: 14px 0 0; padding: 0; list-style: none; }
.tn-info li { display: flex; gap: 10px; align-items: center; }
.tn-map { display: block; width: 100%; height: 380px; margin-top: 20px; border: 0; filter: grayscale(.25); }
.tn-hours-title { margin-top: 30px; color: var(--tn-gold) !important; font-size: 28px; }
.tn-hours { display: grid; gap: 12px; margin: 14px 0 0; }
.tn-hours div { display: flex; justify-content: space-between; gap: 20px; }
.tn-hours dt { color: #fff; font-size: 19px; }
.tn-hours dd { margin: 0; color: var(--tn-gold); }
.tn-faq-in { position: relative; display: grid; grid-template-columns: minmax(0, .6fr) minmax(0, 1fr); gap: 34px; align-items: start; }
.tn-faq-cats { display: grid; gap: 8px; padding: 26px 22px; border: 1px solid var(--tn-line); background: var(--tn-panel); }
.tn-faq-cats h3, .tn-faq-box h3 { margin-bottom: 10px; font-size: 26px; }
.tn-faq-cats label { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; color: #fff; font-size: 19px; cursor: pointer; transition: background .35s, color .35s; }
.tn-faq-cats label:hover { background: #2E2A31; }
.tn-faq-box { padding: clamp(24px, 3cqi, 34px); background: #36333A; }
.tn-faq-box h3 { font-size: 40px; }
.tn-faq-group { display: none; }
.tn-faq-box details { border-bottom: 1px solid #5A565D; }
.tn-faq-box summary { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 18px 0; color: #fff; font-size: 19px; font-weight: 700; cursor: pointer; list-style: none; }
.tn-faq-box summary::-webkit-details-marker { display: none; }
.tn-faq-box summary .tn-ico { color: var(--tn-gold); }
.tn-faq-box .minus, .tn-faq-box details[open] .plus { display: none; }
.tn-faq-box details[open] .minus { display: block; }
.tn-faq-box details > div { padding-bottom: 16px; font-size: 14.5px; }
.tn-faq-box details > div p { margin: 0; }
.tn-visitor { --sk-accent: var(--tn-gold); --sk-line: var(--tn-line); --sk-muted: #A9A3AA; }
.tn-visitor .sk-card { background: var(--tn-panel); border-color: var(--tn-line); }
.tn-visitor .sk-card h2 { color: #fff; }
.tn-visitor input { background: var(--tn-field); border-color: transparent; color: #fff; }
.tn-visitor .sk-btn { background: var(--tn-gold); color: #17141A; }

/* Entrances: the hero and page tops on load, the rest as it scrolls into view (where supported). */
.tn-in-up { animation: tn-up .9s cubic-bezier(.2, .7, .2, 1) both; }
.tn-in-start { animation: tn-from-start .9s cubic-bezier(.2, .7, .2, 1) both; }
.tn-in-end { animation: tn-from-end .9s cubic-bezier(.2, .7, .2, 1) both; }
.d2 { animation-delay: .2s; } .d3 { animation-delay: .4s; } .d4 { animation-delay: .6s; }
@supports (animation-timeline: view()) {
  .tn-rise { animation: tn-up linear both; animation-timeline: view(); animation-range: entry 0% cover 22%; }
  .tn-rise.r1, .tn-rise.b1 { animation-range: entry 5% cover 26%; }
  .tn-rise.r2, .tn-rise.b2 { animation-range: entry 10% cover 30%; }
  .tn-rise.r3, .tn-rise.b3 { animation-range: entry 15% cover 34%; }
  .tn-from-start { animation: tn-from-start linear both; animation-timeline: view(); animation-range: entry 0% cover 26%; }
  .tn-from-end { animation: tn-from-end linear both; animation-timeline: view(); animation-range: entry 0% cover 26%; }
}
@keyframes tn-up { from { opacity: 0; transform: translateY(40px); } }
/* "start" is the right side in Persian: the element comes in from where the line begins. */
@keyframes tn-from-start { from { opacity: 0; transform: translateX(60px); } }
@keyframes tn-from-end { from { opacity: 0; transform: translateX(-60px); } }
@keyframes tn-zoom { from { transform: scale(1.12); } }
@keyframes tn-reveal { from { clip-path: inset(0 0 0 100%); } to { clip-path: inset(0); } }
@keyframes tn-paint { to { transform: scaleX(1); } }
@keyframes tn-spin { to { transform: rotate(360deg); } }
@keyframes tn-marquee { to { transform: translateX(50%); } }
@media (prefers-reduced-motion: reduce) { .tn *, .tn *::before { animation: none !important; transition: none !important; } .tn-brush::before { transform: none; } }

/* Tablet */
@container (max-width: 1100px) {
  .tn-nav { gap: 16px; font-size: 14.5px; }
  .tn-records { grid-template-columns: 1fr 1fr 1fr; }
  .tn-records-head { grid-column: 1 / -1; }
  .tn-features { grid-template-columns: 1fr 1fr; row-gap: 40px; }
  .tn-review-list { grid-template-columns: 1fr 1fr; }
  .tn-slider { --tn-card: calc((100% - 2 * var(--tn-gap)) / 3); }
  .tn-news-grid { grid-template-columns: 1fr 1fr; }
  .tn-news-list { grid-column: 1 / -1; }
  .tn-tab-list { margin-inline-end: -60px; }
}
/* Phone */
@container (max-width: 820px) {
  .tn-wrap { width: calc(100% - 32px); }
  .tn-head-in { height: 72px; gap: 12px; }
  .tn-head::before { height: 72px; }
  .tn-nav, .tn-head-contact { display: none; }
  .tn-logo { font-size: 28px; }
  .tn-vinyl { width: 28px; height: 28px; }
  .tn-burger { display: block; margin-inline-start: auto; }
  .tn-burger summary { display: grid; place-items: center; width: 44px; height: 44px; list-style: none; cursor: pointer; }
  .tn-burger summary::-webkit-details-marker { display: none; }
  .tn-burger summary span, .tn-burger summary span::before, .tn-burger summary span::after { display: block; width: 24px; height: 2px; background: #fff; position: relative; transition: transform .3s, background .3s; }
  .tn-burger summary span::before, .tn-burger summary span::after { content: ""; position: absolute; inset-inline: 0; }
  .tn-burger summary span::before { top: -7px; }
  .tn-burger summary span::after { top: 7px; }
  .tn-burger[open] summary span { background: transparent; }
  .tn-burger[open] summary span::before { top: 0; transform: rotate(45deg); }
  .tn-burger[open] summary span::after { top: 0; transform: rotate(-45deg); }
  .tn-drawer { position: absolute; top: 72px; inset-inline: -16px; display: grid; padding: 10px 24px 24px; background: rgb(23 20 26 / .97); backdrop-filter: blur(10px); animation: tn-up .4s ease both; }
  .tn-drawer a { padding: 12px 0; border-bottom: 1px solid var(--tn-line); color: #E6E1E7; font-size: 17px; }
  .tn-drawer a[aria-current="page"] { color: var(--tn-gold); }
  .tn-hero { min-height: 0; }
  .tn-hero-in { padding: 120px 0 40px; }
  .tn-hero h1 { font-size: 32px; }
  .tn-hero-btns { display: grid; }
  .tn-player { flex-wrap: wrap; gap: 14px; padding: 16px; }
  .tn-disc { width: 64px; height: 64px; }
  .tn-player audio { flex-basis: 100%; }
  .tn-records { grid-template-columns: minmax(0, 1fr); }
  .tn-unite, .tn-artists-head, .tn-split-head, .tn-band-in, .tn-band.full .tn-band-in, .tn-news-letter, .tn-contact, .tn-article-grid, .tn-faq-in, .tn-team-in { grid-template-columns: minmax(0, 1fr); }
  .tn-stats, .tn-stats.n4 { --cols: 2; row-gap: 20px; }
  .tn-stats > div:nth-child(odd) { border-inline-start: 0; }
  .tn-features { grid-template-columns: minmax(0, 1fr); }
  .tn-features.two { grid-template-columns: 1fr 1fr; }
  .tn-strip { grid-template-columns: minmax(0, 1fr); height: auto; }
  .tn-strip-col { border-inline-start: 0; border-top: 1px solid rgb(255 255 255 / .3); min-height: 0; }
  .tn-strip-pic { inset: 0; width: 100%; opacity: .45; }
  .tn-strip-col > b { text-align: start; background: none !important; color: #fff !important; }
  .tn-strip-card { position: static; display: block; width: auto; margin: 0 16px 18px; padding: 14px 16px; opacity: 1 !important; transform: none !important; }
  .tn-strip-card em { display: none; }
  .tn-tabs { grid-template-columns: minmax(0, 1fr); }
  .tn-tab-list { grid-row: 1; width: 100%; margin: 0; display: flex; overflow-x: auto; padding: 10px; gap: 6px; }
  .tn-tab-list label { flex: none; font-size: 15px; }
  .tn-tab-panes { grid-row: 2; }
  .tn-tab-pane { grid-template-columns: minmax(0, 1fr); }
  .tn-tab-pic { margin: 0; }
  .tn-slider { --tn-card: calc((100% - var(--tn-gap)) / 1.6); --tn-gap: 14px; }
  .tn-review-list, .tn-news-grid, .tn-services, .tn-steps, .tn-blog.small { grid-template-columns: minmax(0, 1fr); }
  .tn-step.s1 { padding-top: 0; }
  .tn-step.s1 i { order: 0; }
  .tn-blog { grid-template-columns: minmax(0, 1fr); }
  .tn-blog > .tn-post, .tn-blog > .b0, .tn-blog > .b3 { grid-column: auto; }
  .tn-form { grid-template-columns: minmax(0, 1fr); }
  .tn-book-pick { grid-template-columns: 1fr 1fr; }
  .tn-book-pick .tn-btn { grid-column: 1 / -1; }
  .tn-foot-mid { grid-template-columns: minmax(0, 1fr); }
  .tn-foot-mail { justify-items: start; }
  .tn-foot-mail a { font-size: clamp(24px, 9cqi, 40px); }
  .tn-foot-bottom { flex-direction: column; align-items: flex-start; }
  .tn-foot-pics span { width: 64px; height: 64px; }
  .tn-ptop { padding-top: 72px; }
  .tn-ptop-in { min-height: 300px; }
  .tn-ptop-pic { width: 100%; opacity: .55; }
  .tn-ptop h1 { font-size: 60px; }
  .tn-team-pics { height: 220px; }
  .tn-haven-grid { grid-template-columns: minmax(0, 1fr); }
  .tn-haven-b { grid-row: auto; aspect-ratio: 1.2; }
  .tn-faq-box h3 { font-size: 30px; }
}
`;
