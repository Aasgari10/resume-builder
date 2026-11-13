/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Therapy": a psychologist's practice rebuilt from the Dr. Cloe Brooks reference, in Persian. A dark
// bar with the name, address, hours and phone over a thin cream menu; hero slider, books, a booking
// call, education, events, prices and a "new book" band. Pages: about me, online booking (a Persian
// calendar of the free days and times, from the owner's working hours and the bookings already
// taken), blog with categories and posts, contact. Every form is saved for the owner's panel; the
// server checks again that a booked time is still free. No scripts: the slider uses radios.

import type { CSSProperties, ReactNode } from "react";
import { emptyVisitor, formatToman, freeAt, openDays, slotsOf, todayTehran, addDay, defaultSchedule, type Product, type ResumeData, type Shop, type Visitor } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { FormMeta, Opt, PageLink, Socials, blockOn, ed, item, outside, partsCss } from "./parts";
import { mapEmbed } from "./golsara";

export const THERAPY_BLOCKS = [
  { key: "hero", label: "اسلایدر بالای صفحه" },
  { key: "books", label: "کتاب‌ها" },
  { key: "cta", label: "نوار نوبت گرفتن" },
  { key: "education", label: "تحصیلات" },
  { key: "events", label: "رویدادها" },
  { key: "prices", label: "تعرفه‌ها" },
  { key: "band", label: "نوار کتاب تازه" },
] as const;

export const THERAPY_OPTIONAL_PAGES = [
  { path: "/about", label: "صفحه‌ی درباره‌ی من" },
  { path: "/blog", label: "صفحه‌ی بلاگ" },
] as const;

const pageOn = (data: ResumeData, path: string) => !(data.site?.hiddenPages ?? []).includes(path);
const livePosts = (shop: Shop | undefined) => (shop?.posts ?? []).filter((p) => !p.hidden && p.title.trim());
const plansOf = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
const hasBlog = (data: ResumeData) => livePosts(data.site?.shop).length > 0 && pageOn(data, "/blog");

export function therapyPages(data: ResumeData): string[] {
  const blog = hasBlog(data) ? ["/blog", ...livePosts(data.site?.shop).map((p) => `/blog/${p.id}`)] : [];
  return ["/", ...(pageOn(data, "/about") ? ["/about"] : []), "/booking", ...blog, "/contact"];
}

type View = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; page: string; visitor: Visitor };

export function TherapySite(props: TemplateProps) {
  const ctx = webCtx(props);
  const shop: Shop = ctx.data.site?.shop ?? { categories: [], products: [] };
  const page = therapyPages(ctx.data).includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const view: View = { ctx, shop, link: props.link ?? ((p) => p), editing: Boolean(props.editing), page, visitor: props.visitor ?? emptyVisitor() };
  const [kind, id] = page.split("/").filter(Boolean);
  const body: ReactNode =
    page === "/" ? <Home {...view} />
    : page === "/about" ? <About {...view} />
    : page === "/booking" ? <Booking {...view} />
    : kind === "blog" ? (id ? <Post {...view} id={id} /> : <Blog {...view} />)
    : <Contact {...view} />;
  return (
    <WebPage ctx={ctx} className="th" css={partsCss + css}>
      <Header {...view} />
      <main key={page}>{body}</main>
      <Footer {...view} />
    </WebPage>
  );
}

/* ───────────── Small pieces ───────────── */

const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
const faDate = (day: string, o: Intl.DateTimeFormatOptions) => new Date(`${day}T12:00:00Z`).toLocaleDateString("fa-IR-u-ca-persian", { timeZone: "UTC", ...o });
/** Persian calendar parts of a "yyyy-mm-dd" day. */
function jalali(day: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date(`${day}T12:00:00Z`));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

function Title({ title, sub, kicker, path, subPath }: { title?: string; sub?: string; kicker?: string; path?: string; subPath?: string }) {
  return (
    <div className="th-title th-rise">
      {kicker && <small>{kicker}</small>}
      <h2 {...(path ? ed(path, "text", "تیتر") : {})}>{title}</h2>
      <i aria-hidden="true" />
      {sub && <p {...(subPath ? ed(subPath, "text", "متن زیر تیتر") : {})}>{sub}</p>}
    </div>
  );
}

function Pic({ src, path, label, className }: { src?: string; path: string; label: string; className?: string }) {
  const url = safeUrl(src);
  return (
    <span className={`th-pic ${className ?? ""}`} {...ed(path, "image", label)}>
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

const ICONS: Record<string, string> = {
  home: "M3 11l9-7 9 7v9h-6v-6H9v6H3z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  prev: "M9 4l8 8-8 8",
  next: "M15 4l-8 8 8 8",
  cal: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5",
  check: "M5 12.5l4.5 4.5L19 7.5",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z",
  head: "M4 13a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-2v-7h4M4 13v5a2 2 0 0 0 2 2h2v-7H4",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6",
};
function Svg({ name, className = "th-ico" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Line icons for the four book features (in order, when a feature has no picture of its own). */
const FEATURE_ICONS = [
  "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4",
  "M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM4 20v-6a3 3 0 0 1 6 0v6M14 20v-6a3 3 0 0 1 6 0v6M9 20v-7a3 3 0 0 1 6 0v7",
  "M3 12l4-4 4 3 3-3 4 2 3 4-6 5-3-2-3 2zM7 8l3 3M14 8l-3 3",
  "M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 15h6M10 18h3M17 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
];

/* ───────────── Header and footer ───────────── */

function menuItems(view: View) {
  const data = view.ctx.data;
  return [
    { to: "/", label: "خانه" },
    ...(pageOn(data, "/about") ? [{ to: "/about", label: "درباره‌ی من" }] : []),
    { to: "/booking", label: "نوبت آنلاین" },
    ...(hasBlog(data) ? [{ to: "/blog", label: "بلاگ" }] : []),
    { to: "/contact", label: "تماس با من" },
  ];
}
const isCurrent = (view: View, to: string) => (to === "/" ? view.page === "/" : view.page.startsWith(to));

function Logo({ view, stacked }: { view: View; stacked?: boolean }) {
  const b = view.ctx.data.basics;
  const icon = safeUrl(view.ctx.data.site?.signatureImage);
  return (
    <PageLink to="/" link={view.link} className={`th-logo${stacked ? " stacked" : ""}`}>
      <span className="th-logo-icon" {...ed("site.signatureImage", "image", "نشان")}>
        {icon && <img src={icon} alt="" />}
      </span>
      <span className="th-logo-text">
        <b {...ed("basics.fullName", "text", "نام")}>{b.fullName}</b>
        <small {...ed("basics.jobTitle", "text", "زیر نام")}>{b.jobTitle}</small>
      </span>
    </PageLink>
  );
}

function Header(view: View) {
  const { ctx, link, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const nav = menuItems(view).map((m) => (
    <PageLink key={m.to} to={m.to} link={link} current={isCurrent(view, m.to)}>
      {m.label}
    </PageLink>
  ));
  return (
    <header className="th-head">
      <div className="th-top">
        <div className="th-wrap th-top-in">
          <Logo view={view} />
          <div className="th-top-info">
            <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
              <span className="th-top-item">
                <Svg name="home" />
                <span {...ed("site.address", "text", "نشانی")}>{site?.address}</span>
              </span>
            </Opt>
            <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "multiline", "ساعات کاری")}>
              <span className="th-top-item">
                <Svg name="clock" />
                <span className="th-lines" {...ed("site.contactNote", "multiline", "ساعات کاری")}>
                  {site?.contactNote}
                </span>
              </span>
            </Opt>
            {b.phone && (
              <a className="th-pill" href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                <Svg name="phone" /> {b.phone}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="th-bar">
        <div className="th-wrap th-bar-in">
          <details className="th-burger">
            <summary aria-label="منو">
              <span />
            </summary>
            <nav className="th-drawer">{nav}</nav>
          </details>
          <nav className="th-nav">{nav}</nav>
          {hasBlog(ctx.data) && (
            <details className="th-search">
              <summary aria-label="جستجو">
                <Svg name="search" />
              </summary>
              <form method="get" action={link("/blog")}>
                <input name="q" placeholder="جستجو در مطالب…" aria-label="جستجو در مطالب" />
                <button type="submit" aria-label="جستجو">
                  <Svg name="search" />
                </button>
              </form>
            </details>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer(view: View) {
  const { ctx, editing } = view;
  const b = ctx.data.basics;
  const site = ctx.data.site;
  return (
    <footer className="th-foot">
      <div className="th-wrap th-foot-in">
        <Logo view={view} stacked />
        <div className="th-foot-info">
          <Opt value={site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <p className="th-lines" {...ed("site.address", "text", "نشانی")}>
              {site?.address}
            </p>
          </Opt>
          <p>
            {b.phone && (
              <>
                تلفن:{" "}
                <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr">
                  {b.phone}
                </a>
                <br />
              </>
            )}
            {b.email && (
              <>
                ایمیل:{" "}
                <a href={`mailto:${b.email}`} dir="ltr">
                  {b.email}
                </a>
              </>
            )}
          </p>
        </div>
        <Socials ctx={ctx} editing={editing} className="th-foot-socials" />
      </div>
      <div className="th-foot-end">
        © {fa(new Date().getFullYear())} {b.fullName}. همه‌ی حقوق محفوظ است.
      </div>
    </footer>
  );
}

/** Top of an inner page: a dark photo strip with the title and the way back home. */
function PageTop({ view, title, trail }: { view: View; title: string; trail?: { label: string; to?: string }[] }) {
  const url = safeUrl(view.shop.discoverImage);
  return (
    <section className="th-ptop">
      <span className="th-ptop-pic" {...ed("site.shop.discoverImage", "image", "عکس نوار بالای صفحه‌ها")}>
        {url && <img src={url} alt="" />}
      </span>
      <div className="th-wrap th-ptop-in">
        <h1>{title}</h1>
        <nav className="th-crumbs">
          <PageLink to="/" link={view.link}>
            خانه
          </PageLink>
          {(trail ?? [{ label: title }]).map((t, k) => (
            <span key={k}>
              {" / "}
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

/* ───────────── Home ───────────── */

function Hero({ view }: { view: View }) {
  const slides = (view.shop.slides ?? []).filter((s) => safeUrl(s.image)).slice(0, 5);
  if (!slides.length) return null;
  const n = slides.length;
  const id = "th-hero";
  const rules = slides.map((_, k) => `#${id}-${k}:checked ~ .th-slides .th-slide:nth-child(${k + 1}) { opacity: 1; visibility: visible; z-index: 1; } #${id}-${k}:checked ~ .th-slide-nav .th-nav-${k} { display: contents; }`).join("\n");
  return (
    <section className="th-hero">
      {n > 1 && <style dangerouslySetInnerHTML={{ __html: rules }} />}
      {n > 1 && slides.map((_, k) => <input key={k} type="radio" name={id} id={`${id}-${k}`} defaultChecked={k === 0} className="th-radio" aria-label={`اسلاید ${fa(k + 1)}`} />)}
      <div className={`th-slides${n > 1 ? " many" : ""}`}>
        {slides.map((s) => {
          const at = item("site.shop.slides", s.id);
          return (
            <div key={s.id} className="th-slide">
              <span className="th-slide-pic" {...ed(`${at}.image`, "image", "عکس اسلاید")}>
                <img src={safeUrl(s.image)} alt="" />
              </span>
              <div className="th-slide-text">
                {s.text && <p {...ed(`${at}.text`, "text", "خط بالای تیتر")}>{s.text}</p>}
                {s.title && <h1 {...ed(`${at}.title`, "text", "تیتر")}>{s.title}</h1>}
                <PageLink to="/booking" link={view.link} className="th-btn">
                  دریافت نوبت
                </PageLink>
              </div>
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <div className="th-slide-nav">
          {slides.map((_, k) => (
            <span key={k} className={`th-nav-${k}`}>
              <label htmlFor={`${id}-${(k - 1 + n) % n}`} className="th-arrow prev" aria-label="قبلی">
                <Svg name="prev" />
              </label>
              <label htmlFor={`${id}-${(k + 1) % n}`} className="th-arrow next" aria-label="بعدی">
                <Svg name="next" />
              </label>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function Education({ view }: { view: View }) {
  const list = view.ctx.data.education.slice(0, 6);
  if (!list.length) return null;
  return (
    <section className="th-sec th-wrap">
      <Title title="تحصیلات من" sub="برای آشنایی بیشتر با سابقه‌ی تحصیلی و دوره‌هایی که گذرانده‌ام" />
      <table className="th-table th-rise">
        <thead>
          <tr>
            <th>#</th>
            <th>دانشگاه</th>
            <th>رشته</th>
            <th>مقطع</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.map((e, k) => {
            const at = item("education", e.id);
            return (
              <tr key={e.id}>
                <td>{fa(k + 1).padStart(2, "۰")}</td>
                <td {...ed(`${at}.institution`, "text", "دانشگاه")}>{e.institution}</td>
                <td {...ed(`${at}.field`, "text", "رشته")}>{e.field}</td>
                <td {...ed(`${at}.degree`, "text", "مقطع")}>{e.degree}</td>
                <td className="th-year">{e.period?.end || e.period?.start ? jalali(`${(e.period.end || e.period.start).slice(0, 7)}-15`).y.toLocaleString("fa-IR", { useGrouping: false }) : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Prices({ view }: { view: View }) {
  const plans = plansOf(view.shop).slice(0, 3);
  if (!plans.length) return null;
  return (
    <section className="th-sec th-wrap">
      <Title kicker="تعرفه‌ی جلسات" title="تعرفه‌ها" />
      <div className="th-prices">
        {plans.map((p) => {
          const at = item("site.shop.products", p.id);
          const lines = (p.description ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
          return (
            <article key={p.id} className="th-price th-rise" data-product={p.id}>
              {p.badge && <em className="th-ribbon">{p.badge}</em>}
              <h3 {...ed(`${at}.name`, "text", "نام")}>{p.name}</h3>
              <b>
                {fa(Math.round((p.salePrice ?? p.price) / 1000))}
                <small>هزار تومان</small>
              </b>
              <ul>
                {lines.map((x, k) => (
                  <li key={k}>
                    {x} <Svg name="check" />
                  </li>
                ))}
              </ul>
              <a href={`${view.link("/booking")}?plan=${encodeURIComponent(p.id)}`} className="th-btn blue">
                دریافت نوبت
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Home(view: View) {
  const { ctx, shop, editing, link } = view;
  const data = ctx.data;
  const site = data.site;
  const on = (k: string) => blockOn(data, k);
  const features = (shop.perks ?? []).slice(0, 4);
  const today = todayTehran();
  const events = (shop.events ?? []).filter((e) => !e.hidden && (e.end || e.start) >= today).slice(0, 2);
  const book = safeUrl(shop.newImage);
  const cta = safeUrl(site?.accentImage);
  const band = safeUrl(shop.lookImage);
  return (
    <>
      {on("hero") && <Hero view={view} />}

      {on("books") && (features.length > 0 || book) && (
        <section className="th-sec th-wrap">
          <Title title={shop.newTitle} sub={shop.newText} path="site.shop.newTitle" subPath="site.shop.newText" />
          <div className="th-books">
            {[features.slice(0, 2), features.slice(2, 4)].map((side, s) => (
              <div key={s} className={`th-feats side-${s}`}>
                {side.map((f, k) => {
                  const at = item("site.shop.perks", f.id);
                  const icon = safeUrl(f.image);
                  return (
                    <article key={f.id} className="th-feat th-rise">
                      <span className="th-feat-ico">
                        {icon ? (
                          <img src={icon} alt="" {...ed(`${at}.image`, "image", "آیکون")} />
                        ) : (
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d={FEATURE_ICONS[(s * 2 + k) % 4]} />
                          </svg>
                        )}
                      </span>
                      <div>
                        <h3 {...ed(`${at}.title`, "text", "عنوان")}>{f.title}</h3>
                        {f.text && <p {...ed(`${at}.text`, "text", "متن")}>{f.text}</p>}
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}
            <span className="th-book th-rise" {...ed("site.shop.newImage", "image", "عکس کتاب")}>
              {book && <img src={book} alt="" loading="lazy" />}
            </span>
          </div>
        </section>
      )}

      {on("cta") && (
        <section className="th-cta">
          <span className="th-cta-pic" {...ed("site.accentImage", "image", "عکس نوار نوبت")}>
            {cta && <img src={cta} alt="" loading="lazy" />}
          </span>
          <div className="th-cta-text th-rise">
            <h2 {...ed("site.contactTitle", "text", "تیتر")}>{site?.contactTitle}</h2>
            <p>
              با شماره‌ی{" "}
              <a href={`tel:${(data.basics.phone ?? "").replace(/[^\d+]/g, "")}`} dir="ltr">
                {data.basics.phone}
              </a>{" "}
              تماس بگیرید یا فرم نوبت آنلاین را پر کنید؛ با شما تماس می‌گیریم.
            </p>
            <div className="th-btns">
              <PageLink to="/contact" link={link} className="th-btn blue">
                پرسیدن سؤال
              </PageLink>
              <PageLink to="/booking" link={link} className="th-btn dark">
                دریافت نوبت
              </PageLink>
            </div>
          </div>
        </section>
      )}

      {on("education") && <Education view={view} />}

      {on("events") && (events.length > 0 || editing) && (
        <section className="th-sec th-cream">
          <div className="th-wrap">
            <Title kicker="برای رویداد بعدی آماده باشید" title="رویدادهای پیش رو" />
            <div className="th-events">
              {events.map((e) => {
                const href = safeUrl(e.link);
                const inner = (
                  <>
                    <span className="th-ev-pic">
                      {safeUrl(e.image) && <img src={safeUrl(e.image)} alt="" loading="lazy" />}
                      {e.price !== undefined && <b className="th-ev-price">{e.price ? `${fa(Math.round(e.price / 1000))} هزار` : "رایگان"}</b>}
                    </span>
                    <span className="th-ev-text">
                      <small>
                        <Svg name="cal" /> {faDate(e.start, { day: "numeric", month: "long", year: "numeric" })}
                        {e.end && e.end !== e.start ? ` تا ${faDate(e.end, { day: "numeric", month: "long", year: "numeric" })}` : ""}
                      </small>
                      <b>{e.title}</b>
                    </span>
                  </>
                );
                return href ? (
                  <a key={e.id} href={href} {...outside(href)} className="th-ev th-rise">
                    {inner}
                  </a>
                ) : (
                  <article key={e.id} className="th-ev th-rise">
                    {inner}
                  </article>
                );
              })}
              {editing && events.length === 0 && <p className="th-muted">رویدادها را در پنل مدیریت، بخش «رویدادها» اضافه کنید؛ رویدادهای گذشته خودشان پنهان می‌شوند.</p>}
            </div>
          </div>
        </section>
      )}

      {on("prices") && <Prices view={view} />}

      {on("band") && (
        <section className="th-band">
          <span className="th-band-pic" {...ed("site.shop.lookImage", "image", "عکس پشت نوار")}>
            {band && <img src={band} alt="" loading="lazy" />}
          </span>
          <div className="th-wrap th-band-in">
            <div>
              <h2 {...ed("site.shop.promoTitle", "text", "تیتر")}>{shop.promoTitle}</h2>
              <Opt value={shop.promoText} editing={editing} edit={ed("site.shop.promoText", "text", "متن")}>
                <p {...ed("site.shop.promoText", "text", "متن")}>{shop.promoText}</p>
              </Opt>
            </div>
            <div className="th-btns">
              <PageLink to="/contact" link={link} className="th-btn">
                درخواست کتاب رایگان
              </PageLink>
              {pageOn(data, "/about") && (
                <PageLink to="/about" link={link} className="th-btn white">
                  درباره‌ی من
                </PageLink>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ───────────── About ───────────── */

function About(view: View) {
  const { ctx, shop, editing } = view;
  const data = ctx.data;
  const site = data.site;
  const helps = shop.categories.filter((c) => safeUrl(c.image)).slice(0, 4);
  return (
    <>
      <PageTop view={view} title="درباره‌ی من" />
      {helps.length > 0 && (
        <section className="th-sec th-wrap">
          <Title title="چطور می‌توانم کمکتان کنم" sub="هدفم ساختن فضایی امن و آرام است تا با هم به هدف‌هایتان برسیم." />
          <div className="th-helps">
            {helps.map((c) => {
              const at = item("site.shop.categories", c.id);
              return (
                <article key={c.id} className="th-help th-rise">
                  <Pic src={c.image} path={`${at}.image`} label="عکس" className="th-help-pic" />
                  <h3>{c.name}</h3>
                  {c.text && <p {...ed(`${at}.text`, "multiline", "متن")}>{c.text}</p>}
                </article>
              );
            })}
          </div>
        </section>
      )}
      <section className="th-sec th-blue">
        <div className="th-wrap th-me">
          <div className="th-me-pics th-rise">
            <Pic src={site?.aboutImage} path="site.aboutImage" label="عکس پشت" className="th-me-a" />
            <Pic src={site?.heroImage} path="site.heroImage" label="عکس جلو" className="th-me-b" />
          </div>
          <div className="th-me-text th-rise">
            <h2 {...ed("basics.fullName", "text", "نام")}>{data.basics.fullName}</h2>
            <Opt value={site?.aboutCaption} editing={editing} edit={ed("site.aboutCaption", "text", "عنوان")}>
              <p className="th-me-role" {...ed("site.aboutCaption", "text", "عنوان")}>
                {site?.aboutCaption}
              </p>
            </Opt>
            <Opt value={site?.aboutText} editing={editing} edit={ed("site.aboutText", "multiline", "معرفی")}>
              <div className="th-body" {...ed("site.aboutText", "multiline", "معرفی")}>
                <Para text={site?.aboutText} />
              </div>
            </Opt>
          </div>
        </div>
      </section>
      <Education view={view} />
    </>
  );
}

/* ───────────── Online booking ───────────── */

const WEEK = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

/** A month of the Persian calendar: its first day and the days, as "yyyy-mm-dd". */
function monthOf(anyDay: string): { first: string; days: string[] } {
  let first = anyDay;
  while (jalali(first).d !== 1) first = addDay(first, -1);
  const days = [first];
  for (let d = addDay(first, 1); jalali(d).d !== 1; d = addDay(d, 1)) days.push(d);
  return { first, days };
}

function Booking(view: View) {
  const { shop, visitor, link, editing } = view;
  const s = shop.schedule ?? defaultSchedule();
  const taken = visitor.taken ?? {};
  const today = todayTehran();
  const open = new Set(openDays(s, taken));
  // The month shown: this one, or one of the next ones (?m=1, 2…) while inside the booking window.
  const last = addDay(today, s.ahead);
  const months: string[] = [monthOf(today).first];
  while (months.length < 7) {
    const next = addDay(monthOf(months[months.length - 1]!).days.slice(-1)[0]!, 1);
    if (next > last) break;
    months.push(next);
  }
  const m = Math.min(months.length - 1, Math.max(0, Number(visitor.query.m) || 0));
  const { first, days } = monthOf(months[m]!);
  const lead = (new Date(`${first}T12:00:00Z`).getUTCDay() + 1) % 7; // Saturday first
  const picked = visitor.query.day && open.has(visitor.query.day) ? visitor.query.day : undefined;
  const times = picked ? slotsOf(s, picked).filter((t) => freeAt(s, taken, picked, t) > 0) : [];
  const plans = plansOf(shop);
  const plan = plans.find((p) => p.id === visitor.query.plan);
  const href = (q: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ plan: plan?.id, ...q })) if (v !== undefined && v !== "" && !(k === "m" && Number(v) === 0)) p.set(k, String(v));
    const qs = p.toString();
    return `${link("/booking")}${qs ? `?${qs}` : ""}`;
  };
  const monthName = faDate(first, { month: "long", year: "numeric" });
  return (
    <>
      <PageTop view={view} title="نوبت آنلاین" />
      <section className="th-sec th-wrap th-booking">
        <div className="th-cal th-rise">
          <div className="th-cal-head">
            {m > 0 ? (
              <a href={href({ m: m - 1 })} className="th-cal-arrow" aria-label="ماه قبل">
                <Svg name="prev" />
              </a>
            ) : (
              <span />
            )}
            <b>{monthName}</b>
            {m < months.length - 1 ? (
              <a href={href({ m: m + 1 })} className="th-cal-arrow" aria-label="ماه بعد">
                <Svg name="next" />
              </a>
            ) : (
              <span />
            )}
          </div>
          <div className="th-cal-week">
            {WEEK.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="th-cal-days">
            {Array.from({ length: lead }, (_, k) => (
              <span key={`e${k}`} className="th-day empty" />
            ))}
            {days.map((d) => {
              const n = fa(jalali(d).d);
              const cls = `th-day${d === today ? " today" : ""}${d === picked ? " picked" : ""}`;
              return open.has(d) ? (
                <a key={d} href={`${href({ m, day: d })}#th-times`} className={`${cls} open`} aria-label={faDate(d, { weekday: "long", day: "numeric", month: "long" })}>
                  {n}
                  <small>نوبت خالی</small>
                </a>
              ) : (
                <span key={d} className={`${cls}${d < today ? " past" : " off"}`}>
                  {n}
                </span>
              );
            })}
          </div>
          <p className="th-cal-legend">
            <i className="open" /> روزهای دارای نوبت خالی <i className="off" /> تعطیل یا پر
          </p>
        </div>

        <div className="th-times th-rise" id="th-times">
          {!picked ? (
            <div className="th-pick-hint">
              <Svg name="cal" className="th-ico big" />
              <h2>یک روز را انتخاب کنید</h2>
              <p>روزهایی که نوبت خالی دارند در تقویم پررنگ‌اند. بعد از انتخاب روز، ساعت‌های خالی و فرم نوبت این‌جا نمایش داده می‌شود.</p>
              {open.size === 0 && <p className="th-warn">در حال حاضر نوبت خالی نداریم؛ لطفاً تماس بگیرید.</p>}
            </div>
          ) : (
            <form method="post" action={link("/_form")} className="th-form">
              <FormMeta kind="booking" back="/booking" />
              <input type="hidden" name="date" value={picked} />
              <h2>{faDate(picked, { weekday: "long", day: "numeric", month: "long" })}</h2>
              <fieldset className="th-slots">
                <legend>ساعت را انتخاب کنید</legend>
                {times.map((t, k) => (
                  <label key={t}>
                    <input type="radio" name="time" value={t} required defaultChecked={k === 0} />
                    <span dir="ltr">{fa(Number(t.slice(0, 2))).padStart(2, "۰")}:{fa(Number(t.slice(3))).padStart(2, "۰")}</span>
                  </label>
                ))}
              </fieldset>
              {plans.length > 0 && (
                <label className="th-full">
                  نوع جلسه
                  <select name="service" defaultValue={plan?.name ?? plans[0]!.name}>
                    {plans.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} – {formatToman(p.salePrice ?? p.price, view.ctx.data.locale)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                نام و نام خانوادگی *
                <input name="name" required autoComplete="name" />
              </label>
              <label>
                شماره‌ی موبایل *
                <input name="phone" required inputMode="tel" dir="ltr" autoComplete="tel" placeholder="09xx xxx xxxx" />
              </label>
              <label className="th-full">
                ایمیل (اختیاری)
                <input name="email" type="email" dir="auto" autoComplete="email" />
              </label>
              <label className="th-full">
                توضیح کوتاه (اختیاری)
                <textarea name="body" rows={3} placeholder="اگر لازم است، درباره‌ی دلیل مراجعه بنویسید." />
              </label>
              <button type="submit" className="th-btn">
                ثبت نوبت
              </button>
              <p className="th-muted">پس از ثبت، کد پیگیری نمایش داده می‌شود و برای تأیید با شما تماس می‌گیریم.</p>
            </form>
          )}
          {editing && <p className="th-muted">روزها و ساعت‌های کاری، طول هر جلسه و تعطیلی‌ها را در پنل مدیریت، بخش «ساعت کاری و ظرفیت» تعیین کنید.</p>}
        </div>
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
      <PageTop view={view} title="تماس با من" />
      <section className="th-sec th-wrap th-infos">
        <article className="th-info th-rise">
          <Svg name="clock" className="th-ico big" />
          <h3>ساعات کاری</h3>
          <Opt value={site?.contactNote} editing={editing} edit={ed("site.contactNote", "multiline", "ساعات کاری")}>
            <p className="th-lines" {...ed("site.contactNote", "multiline", "ساعات کاری")}>
              {site?.contactNote}
            </p>
          </Opt>
        </article>
        <article className="th-info th-rise">
          <Svg name="pin" className="th-ico big" />
          <h3>نشانی</h3>
          <p className="th-lines" {...ed("site.address", "text", "نشانی")}>
            {site?.address}
          </p>
          {map && (
            <a href={map} {...outside(map)} className="th-link">
              مسیریابی
            </a>
          )}
        </article>
        <article className="th-info th-rise">
          <Svg name="head" className="th-ico big" />
          <h3>راه‌های تماس</h3>
          <p>
            {b.phone && (
              <>
                تلفن:{" "}
                <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} dir="ltr">
                  {b.phone}
                </a>
                <br />
              </>
            )}
            {b.email && (
              <>
                ایمیل:{" "}
                <a href={`mailto:${b.email}`} dir="ltr">
                  {b.email}
                </a>
              </>
            )}
          </p>
        </article>
      </section>
      <section className="th-contact">
        <div className="th-map" {...ed("site.mapUrl", "url", "لینک نقشه (گوگل‌مپ، نشان، بلد یا اوپن‌استریت‌مپ)")}>
          {embed ? <iframe src={embed} title="نقشه‌ی مطب" loading="lazy" referrerPolicy="no-referrer" /> : <span>برای نمایش نقشه، لینک مکان مطب را بگذارید.</span>}
        </div>
        <div className="th-contact-form">
          <h2>سؤالی دارید؟ با من در تماس باشید!</h2>
          <p className="th-muted">
            برای نوبت گرفتن از{" "}
            <PageLink to="/booking" link={link}>
              نوبت آنلاین
            </PageLink>{" "}
            استفاده کنید؛ برای پرسش‌ها همین فرم را بفرستید.
          </p>
          <form method="post" action={link("/_form")} className="th-form lines">
            <FormMeta kind="contact" back="/contact" />
            <label>
              نام
              <input name="name" required autoComplete="name" />
            </label>
            <label>
              تلفن
              <input name="phone" inputMode="tel" dir="ltr" autoComplete="tel" />
            </label>
            <label className="th-full">
              ایمیل
              <input name="email" type="email" dir="auto" autoComplete="email" />
            </label>
            <label className="th-full">
              پیام
              <textarea name="body" rows={3} required />
            </label>
            <button type="submit" className="th-btn">
              ارسال پیام
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

/* ───────────── Blog ───────────── */

type PostT = NonNullable<Shop["posts"]>[number];
const excerptOf = (p: PostT) => p.excerpt?.trim() || (p.text.length > 200 ? `${p.text.slice(0, 200).trim()}…` : p.text);
const PER_PAGE = 6;

function Meta({ p }: { p: PostT }) {
  return (
    <small className="th-meta">
      {[p.date && faDate(p.date, { day: "numeric", month: "long", year: "numeric" }), p.category, p.author].filter(Boolean).join(" · ")}
    </small>
  );
}

function BlogSide({ view, skip }: { view: View; skip?: string }) {
  const all = livePosts(view.shop);
  const cats = [...new Set(all.map((p) => p.category?.trim()).filter((c): c is string => Boolean(c)))];
  const recent = all.filter((p) => p.id !== skip).slice(0, 3);
  return (
    <aside className="th-side">
      <form method="get" action={view.link("/blog")} className="th-side-search">
        <input name="q" placeholder="جستجو…" aria-label="جستجو" defaultValue={view.visitor.query.q} />
        <button type="submit" aria-label="جستجو">
          <Svg name="search" />
        </button>
      </form>
      {cats.length > 0 && (
        <div>
          <h4>دسته‌ها</h4>
          <nav className="th-side-cats">
            {cats.map((c) => (
              <a key={c} href={`${view.link("/blog")}?cat=${encodeURIComponent(c)}`}>
                {c} ({fa(all.filter((p) => p.category === c).length)})
              </a>
            ))}
          </nav>
        </div>
      )}
      <div>
        <h4>تازه‌ترین مطالب</h4>
        {recent.map((p) => (
          <PageLink key={p.id} to={`/blog/${p.id}`} link={view.link} className="th-side-post">
            <span>{safeUrl(p.image) && <img src={safeUrl(p.image)} alt="" loading="lazy" />}</span>
            <b>{p.title}</b>
          </PageLink>
        ))}
      </div>
    </aside>
  );
}

function Blog(view: View) {
  const { shop, link, visitor } = view;
  const cat = visitor.query.cat;
  const q = (visitor.query.q ?? "").trim();
  const words = q.split(/\s+/).filter(Boolean);
  const list = livePosts(shop).filter((p) => (!cat || p.category === cat) && words.every((w) => `${p.title} ${p.text}`.includes(w)));
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const at = Math.min(pages, Math.max(1, Number(visitor.query.p) || 1));
  const shown = list.slice((at - 1) * PER_PAGE, at * PER_PAGE);
  const href = (p: number) => {
    const params = new URLSearchParams();
    if (cat) params.set("cat", cat);
    if (q) params.set("q", q);
    if (p > 1) params.set("p", String(p));
    const s = params.toString();
    return `${link("/blog")}${s ? `?${s}` : ""}`;
  };
  return (
    <>
      <PageTop view={view} title={cat || (q ? `جستجوی «${q}»` : "بلاگ")} trail={cat || q ? [{ label: "بلاگ", to: "/blog" }, { label: cat || q }] : undefined} />
      <section className="th-sec th-wrap th-blog">
        <div className="th-posts">
          {shown.length === 0 && <p className="th-muted">مطلبی پیدا نشد.</p>}
          {shown.map((p) => {
            const img = safeUrl(p.image);
            return (
              <article key={p.id} className="th-post th-rise">
                <PageLink to={`/blog/${p.id}`} link={link} className="th-post-pic">
                  {img && <img src={img} alt={p.title} loading="lazy" />}
                </PageLink>
                <PageLink to={`/blog/${p.id}`} link={link}>
                  <h2>{p.title}</h2>
                </PageLink>
                <Meta p={p} />
                <p>{excerptOf(p)}</p>
                <PageLink to={`/blog/${p.id}`} link={link} className="th-btn small">
                  ادامه‌ی مطلب
                </PageLink>
              </article>
            );
          })}
          {pages > 1 && (
            <nav className="th-pager">
              {Array.from({ length: pages }, (_, k) => (
                <a key={k} href={href(k + 1)} aria-current={at === k + 1 ? "page" : undefined}>
                  {fa(k + 1)}
                </a>
              ))}
            </nav>
          )}
        </div>
        <BlogSide view={view} />
      </section>
    </>
  );
}

function Post(view: View & { id: string }) {
  const all = livePosts(view.shop);
  const p = all.find((x) => x.id === view.id)!;
  const img = safeUrl(p.image);
  const more = all.filter((x) => x.id !== p.id && (!p.category || x.category === p.category)).slice(0, 2);
  const b = view.ctx.data.basics;
  const face = safeUrl(view.ctx.data.site?.heroImage);
  return (
    <>
      <section className="th-post-top">
        <span className="th-ptop-pic">{img && <img src={img} alt="" />}</span>
        <div className="th-wrap th-post-top-in">
          {p.category && <em>{p.category}</em>}
          <h1>{p.title}</h1>
          <Meta p={p} />
        </div>
      </section>
      <section className="th-sec th-wrap th-blog">
        <article className="th-article">
          <div className="th-body">
            <Para text={p.text} />
          </div>
          <div className="th-author">
            <span>{face && <img src={face} alt={b.fullName} />}</span>
            <div>
              <b>{b.fullName}</b>
              <small>{b.jobTitle}</small>
            </div>
          </div>
          <section className="th-comment">
            <h3>نظر بگذارید</h3>
            <form method="post" action={view.link("/_form")} className="th-form lines">
              <FormMeta kind="contact" back={view.page} />
              <input type="hidden" name="subject" value={`نظر برای مطلب «${p.title}»`} />
              <label>
                نام *
                <input name="name" required />
              </label>
              <label>
                ایمیل
                <input name="email" type="email" dir="auto" />
              </label>
              <label className="th-full">
                نظر شما *
                <textarea name="body" rows={4} required />
              </label>
              <button type="submit" className="th-btn">
                ارسال نظر
              </button>
            </form>
          </section>
          {more.length > 0 && (
            <section className="th-more">
              <h3>مطالب مرتبط</h3>
              <div>
                {more.map((x) => (
                  <PageLink key={x.id} to={`/blog/${x.id}`} link={view.link} className="th-more-item">
                    <span>{safeUrl(x.image) && <img src={safeUrl(x.image)} alt="" loading="lazy" />}</span>
                    <small>{x.category}</small>
                    <b>{x.title}</b>
                  </PageLink>
                ))}
              </div>
            </section>
          )}
        </article>
        <BlogSide view={view} skip={p.id} />
      </section>
    </>
  );
}

/* ───────────── Example content (from the reference, in Persian) ───────────── */

export function therapySample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const img = (n: string) => sampleImage(`cb-${n}`);
  const plan = (id: string, name: string, price: number, badge?: string): Product => ({ id, name, price, images: [], badge, description: "مشاوره‌ی فردی\nزوج‌درمانی و مشاوره‌ی ازدواج\nمشاوره‌ی نوجوان" });
  const edu = (id: string, institution: string, field: string, degree: string, year: string) => ({ id, institution, field, degree, period: { start: `${year}-01`, end: `${year}-06`, current: false }, highlights: [] });
  const post = (id: string, title: string, image: string, date: string, category: string) => ({
    id,
    title,
    image: img(image),
    date,
    category,
    author: "دکتر مهرپویا",
    text: "سلامت واقعی بدون آرامش درونی ممکن نیست. بسیاری از ما سال‌ها به بدنمان می‌رسیم اما احساس‌هایمان را نادیده می‌گیریم؛ در حالی که فشارهای روانی کم‌کم روی خواب، تمرکز و حتی سیستم ایمنی اثر می‌گذارند.\nدر این مطلب چند راه ساده و علمی برای شناختن احساس‌ها، کنار آمدن با استرس روزمره و ساختن عادت‌های آرام‌بخش را مرور می‌کنیم.\nاگر احساس می‌کنید این فشارها از توان شما بیشتر شده، صحبت با یک متخصص می‌تواند اولین قدم برای بهتر شدن باشد.",
  });
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "دکتر سارا مهرپویا",
      jobTitle: "روان‌شناس بالینی و خانواده",
      avatarUrl: "",
      email: "info@example.com",
      phone: "021 0000 0000",
      summary: "",
      links: [
        { id: "sl1", type: "instagram", url: "https://instagram.com/example" },
        { id: "sl2", type: "telegram", url: "https://t.me/example" },
        { id: "sl3", type: "whatsapp", url: "https://wa.me/example" },
      ],
    },
    education: [
      edu("e1", "دانشکده‌ی روان‌شناسی دانشگاه تهران", "دوره‌های تکمیلی", "کارشناسی", "2019"),
      edu("e2", "دانشگاه علامه طباطبایی", "روان‌شناسی بالینی", "کارشناسی ارشد", "2018"),
      edu("e3", "دانشگاه شهید بهشتی", "روان‌شناسی عمومی", "کارشناسی", "2017"),
    ],
    site: {
      ...base.site,
      aboutCaption: "روان‌شناس بالینی با سال‌ها تجربه در درمان فردی و خانواده",
      aboutText: "روان‌شناس بالینی دارای پروانه‌ی نظام روان‌شناسی هستم و در مطب خصوصی، جلسه‌های درمان فردی برای بزرگسالان و زوج‌ها برگزار می‌کنم.\nتخصص من درمان اضطراب، افسردگی و مشکلات ارتباطی است و در هر جلسه کنار شما هستم تا گام‌به‌گام به آرامش و خودشناسی بیشتر برسید.",
      aboutImage: img("about1"),
      heroImage: img("about2"),
      accentImage: img("cta"),
      signatureImage: sampleImage("cb-icon", "png"),
      contactTitle: "می‌خواهید نوبت بگیرید یا سؤالی دارید؟",
      contactNote: "شنبه تا چهارشنبه: ۹ تا ۱۷\nپنجشنبه و جمعه: تعطیل",
      address: "تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲",
      mapUrl: "https://www.openstreetmap.org/?mlat=35.7580&mlon=51.4100",
      gallery: [],
      shop: {
        slides: [
          { id: "s1", text: "همه‌ی ما نمی‌توانیم کارهای بزرگ انجام دهیم، اما", title: "می‌توانیم کارهای کوچک را با عشقی بزرگ انجام دهیم", image: img("hero1") },
          { id: "s2", text: "هر قدم کوچک، شروعی تازه است", title: "آرامش را از درون خودتان آغاز کنید", image: img("hero2") },
          { id: "s3", text: "کنار شما هستم", title: "با هم مسیر بهتر شدن را پیدا می‌کنیم", image: img("hero3") },
        ],
        newTitle: "کتاب‌های تازه‌ی من",
        newText: "این کتاب‌ها مجموعه‌ای از داستان‌ها و تجربه‌های الهام‌بخش است که از پرونده‌ها و پژوهش‌های علمی جمع شده‌اند",
        newImage: sampleImage("cb-book", "png"),
        perks: [
          { id: "f1", title: "بهترین کتاب سال", text: "کودکان با نیازهای ویژه و راه‌های سازگاری با دنیای بیرون؛ داستان یک معجزه را بخوانید." },
          { id: "f2", title: "قرص‌ها و درمان‌ها", text: "حالت‌های هیجانی ناپایدار و مؤثرترین راه‌های کنار آمدن با آن‌ها با کمک درمان." },
          { id: "f3", title: "زندگی درونی شما", text: "گذارهای زندگی و بیماری‌های مزمن، هویت اجتماعی و درونی و باورهای شخصی." },
          { id: "f4", title: "درمان تحلیلی", text: "همکاری با مراجع برای شناخت بهتر الگوهای رفتاری و ساختن الگوهای تازه." },
        ],
        events: [
          { id: "v1", title: "همایش آنلاین روان‌شناسی و اختلال‌های شناختی", image: img("ev1"), start: "2026-12-10", end: "2027-01-20", price: 5800000 },
          { id: "v2", title: "هفدهمین همایش بین‌المللی روان‌شناسی زبان", image: img("ev2"), start: "2026-12-22", end: "2027-02-01", price: 4200000 },
        ],
        products: [plan("p1", "جلسه‌ای", 1000000), plan("p2", "هفتگی", 2500000, "۲۰٪ تخفیف"), plan("p3", "ماهانه", 6000000)],
        promoTitle: "کتاب تازه‌ی من را دریافت کنید",
        promoText: "پیشنهاد ویژه: یک کتاب رایگان برای مراجعان و عضوهای خبرنامه",
        lookImage: img("band"),
        discoverImage: img("top"),
        categories: [
          { id: "h1", name: "مدیریت استرس", image: img("help1"), text: "خطر، تهدید، خبر بد یا بیماری؛ عوامل زیادی می‌توانند استرس را برانگیزند." },
          { id: "h2", name: "رابطه و ازدواج", image: img("help2"), text: "عشق به یکدیگر، حل اختلاف‌های همیشگی زندگی روزمره را آسان‌تر می‌کند." },
          { id: "h3", name: "عزت‌نفس", image: img("help3"), text: "رایج‌ترین و خطرناک‌ترین نشانه‌ی عزت‌نفس پایین، گفت‌وگوی منفی با خود است." },
          { id: "h4", name: "روان‌پویشی", image: img("help4"), text: "اصول نظری بر پایه‌ی روابط میان‌فردی خانواده و ارزیابی دقیق." },
        ],
        schedule: { days: [6, 0, 1, 2, 3], start: "09:00", end: "17:00", slot: 60, capacity: 1, ahead: 30, closed: [], breakStart: "13:00", breakEnd: "14:00" },
        posts: [
          post("b1", "سلامت واقعی بدون آرامش درونی ممکن نیست", "post1", "2026-10-02", "روان‌شناسی شناختی"),
          post("b2", "پیدا کردن آرامش در روزهای نامطمئن", "post2", "2026-09-21", "خانواده‌درمانی"),
          post("b3", "درمان شناختی‌رفتاری برای بی‌خوابی", "post3", "2026-09-10", "روان‌شناسی شناختی"),
          post("b4", "خانواده‌درمانی و مشاوره‌ی ازدواج", "post4", "2026-08-28", "خانواده‌درمانی"),
          post("b5", "کنار آمدن با آسیب‌های روانی شدید", "post5", "2026-08-15", "روان‌درمانی"),
          post("b6", "شش قانون مهم در تربیت فرزند", "post6", "2026-08-01", "خانواده‌درمانی"),
          post("b7", "ده باور نادرست درباره‌ی خوش‌بینی و بدبینی", "post7", "2026-07-20", "روان‌شناسی شناختی"),
          post("b8", "چرا یک چهره‌ی مشهور الگوی مناسبی نیست", "post8", "2026-07-08", "روان‌درمانی"),
        ],
        faq: [],
      },
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
@font-face { font-family: "Kafe Markazi"; src: url("/_assets/fonts/kafe-markazi.woff") format("woff"); font-display: swap; }
.th {
  --th-dark: #3D3835;
  --th-peach: var(--color-primary);
  --th-blue: #6BB3C6;
  --th-ice: #E9F4F7;
  --th-cream: #FBF6F1;
  --th-ink: #2E2A27;
  --th-muted: #7A746F;
  --th-line: #E6E0DA;
  --th-head: "Kafe Markazi", var(--font-heading), serif;
  background: #fff;
  color: var(--th-ink);
  font-size: 16px;
}
.th :where(input, textarea, select) { width: auto; padding: 0; border: 0; border-radius: 0; background: none; color: inherit; outline-offset: 2px; }
.th a { color: inherit; text-decoration: none; }
.th h1, .th h2, .th h3, .th h4, .th p, .th figure, .th ul, .th table { margin: 0; }
.th-ico { width: 22px; height: 22px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.th-ico.big { width: 48px; height: 48px; stroke-width: 1.1; }
.th-wrap { box-sizing: border-box; width: 100%; max-width: 1690px; margin-inline: auto; padding-inline: clamp(18px, 7cqi, 135px); }
.th-sec { padding-block: clamp(70px, 8cqi, 150px); }
.th-cream { background: var(--th-cream); }
.th-blue { background: var(--th-ice); }
.th-muted { color: var(--th-muted); }
.th-lines { white-space: pre-line; }
.th-radio { position: absolute; opacity: 0; pointer-events: none; }
.th-pic { display: block; overflow: hidden; }
.th-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
.th-body { color: var(--th-muted); line-height: 2.1; }
.th-body p + p { margin-top: 14px; }

/* Titles: serif, a short teal line, a light line of text */
.th-title { display: grid; justify-items: center; gap: 14px; margin-bottom: clamp(40px, 4.4cqi, 84px); text-align: center; }
.th-title small { color: var(--th-muted); font-size: 14px; letter-spacing: .02em; }
.th-title h2 { font-family: var(--th-head); font-size: clamp(34px, 3.7cqi, 72px); font-weight: 500; line-height: 1.25; }
.th-title > i { width: 34px; height: 2px; background: var(--th-blue); }
.th-title p { max-width: 640px; color: var(--th-muted); font-size: 15px; line-height: 2; }

/* Buttons: rounded pills */
.th-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 54px; padding: 0 34px; border: 0; border-radius: 999px; background: var(--th-peach); color: #fff !important; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; transition: filter .3s, transform .3s; }
.th-btn:hover { filter: brightness(.94); transform: translateY(-2px); }
.th-btn.blue { background: var(--th-blue); }
.th-btn.dark { background: var(--th-dark); }
.th-btn.white { background: #fff; color: var(--th-ink) !important; }
.th-btn.small { height: 40px; padding: 0 22px; font-size: 13px; }
.th-btns { display: flex; flex-wrap: wrap; gap: 14px; }

/* Header: a dark bar with the name, address, hours and phone; a thin cream menu bar under it */
.th-head { position: relative; z-index: 30; }
.th-top { background: var(--th-dark); color: #fff; }
.th-top-in { display: flex; align-items: center; justify-content: space-between; gap: 30px; min-height: clamp(90px, 6.1cqi, 117px); }
.th-logo { display: inline-flex; align-items: center; gap: 12px; }
.th-logo-icon { display: block; width: clamp(40px, 2.5cqi, 48px); flex: none; }
.th-logo-icon img { display: block; width: 100%; }
.th-logo-text { display: grid; gap: 2px; }
.th-logo-text b { font-family: var(--th-head); font-size: clamp(24px, 1.9cqi, 36px); font-weight: 500; line-height: 1.1; }
.th-logo-text small { font-size: 11px; opacity: .8; letter-spacing: .03em; }
.th-top-info { display: flex; align-items: center; gap: clamp(20px, 2.3cqi, 44px); font-size: 14px; }
.th-top-item { display: flex; align-items: center; gap: 12px; line-height: 1.6; }
.th-top-item .th-ico { width: 30px; height: 30px; color: var(--th-peach); stroke-width: 1.2; }
.th-pill { display: inline-flex; align-items: center; gap: 8px; height: 50px; padding: 0 28px; border-radius: 999px; background: var(--th-peach); font-size: 14px; font-weight: 600; transition: filter .3s; }
.th-pill:hover { filter: brightness(.94); }
.th-pill .th-ico { width: 16px; height: 16px; }
.th-bar { background: var(--th-cream); border-bottom: 1px solid #F0E8E0; }
.th-bar-in { display: flex; align-items: center; justify-content: space-between; min-height: clamp(60px, 3.9cqi, 76px); }
.th-nav { display: flex; gap: clamp(22px, 2.6cqi, 52px); font-family: var(--th-head); font-size: 18px; color: #5A544F; }
.th-nav a { position: relative; padding: 6px 0; transition: color .3s; }
.th-nav a::after { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 1px; background: currentColor; transform: scaleX(0); transform-origin: right; transition: transform .35s; }
.th-nav a:hover, .th-nav a[aria-current="page"] { color: var(--th-ink); }
.th-nav a:hover::after, .th-nav a[aria-current="page"]::after { transform: scaleX(1); }
.th-search { position: relative; }
.th-search summary, .th-burger summary { display: grid; place-items: center; list-style: none; cursor: pointer; }
.th-search summary::-webkit-details-marker, .th-burger summary::-webkit-details-marker { display: none; }
.th-search summary .th-ico { width: 28px; height: 28px; stroke-width: 1.4; }
.th-search form { position: absolute; top: calc(100% + 18px); inset-inline-end: 0; display: flex; width: 320px; background: #fff; box-shadow: 0 20px 40px -20px rgb(0 0 0 / .35); }
.th-search input { flex: 1; padding: 14px 16px; font: inherit; }
.th-search button { display: grid; place-items: center; width: 52px; border: 0; background: var(--th-peach); color: #fff; cursor: pointer; }
.th-burger { display: none; }

/* Hero slider */
.th-hero { position: relative; overflow: hidden; height: clamp(460px, 52cqi, 1000px); color: #fff; background: #333; }
.th-slides, .th-slide { position: absolute; inset: 0; }
.th-slides.many .th-slide { opacity: 0; visibility: hidden; transition: opacity 1s ease, visibility 1s; }
.th-slide-pic { position: absolute; inset: 0; }
.th-slide-pic img { width: 100%; height: 100%; object-fit: cover; animation: th-zoom 12s ease-out both; }
@keyframes th-zoom { from { transform: scale(1.08); } }
.th-slide::after { content: ""; position: absolute; inset: 0; background: rgb(25 22 20 / .35); }
.th-slide-text { position: relative; z-index: 1; display: grid; place-content: center; justify-items: center; gap: 22px; height: 100%; padding: 0 90px; text-align: center; }
.th-slide-text p { font-size: clamp(16px, 1.25cqi, 24px); }
.th-slide-text h1 { max-width: 13em; font-family: var(--th-head); font-size: clamp(38px, 4.6cqi, 88px); font-weight: 500; line-height: 1.2; }
.th-slide-text .th-btn { margin-top: 10px; height: clamp(50px, 3.8cqi, 72px); padding: 0 clamp(28px, 2.5cqi, 48px); font-size: clamp(14px, 1.05cqi, 20px); }
.th-slide-nav span { display: none; }
.th-arrow { position: absolute; top: 50%; z-index: 3; display: grid; place-items: center; width: 50px; height: 50px; margin-top: -25px; color: #fff; cursor: pointer; }
.th-arrow .th-ico { width: 44px; height: 44px; stroke-width: 1.3; }
.th-arrow.prev { inset-inline-start: clamp(14px, 5cqi, 96px); }
.th-arrow.next { inset-inline-end: clamp(14px, 5cqi, 96px); }

/* Books: two features on each side of the book */
.th-books { display: grid; grid-template-columns: 1fr minmax(0, 520px) 1fr; align-items: center; gap: clamp(20px, 3cqi, 60px); }
.th-book { grid-column: 2; grid-row: 1; display: block; }
.th-book img { display: block; width: 100%; }
.th-feats { display: grid; gap: clamp(40px, 4cqi, 80px); }
.th-feats.side-0 { grid-column: 1; grid-row: 1; }
.th-feats.side-1 { grid-column: 3; grid-row: 1; }
.th-feat { display: flex; align-items: flex-start; gap: 24px; }
.th-feats.side-0 .th-feat { flex-direction: row-reverse; text-align: end; }
.th-feat-ico { display: grid; place-items: center; flex: none; width: clamp(80px, 6.2cqi, 120px); height: clamp(80px, 6.2cqi, 120px); border-radius: 50%; background: var(--th-ice); }
.th-feat-ico svg, .th-feat-ico img { width: 46%; height: 46%; object-fit: contain; fill: none; stroke: var(--th-ink); stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
.th-feat h3 { margin-top: 10px; font-family: var(--th-head); font-size: clamp(22px, 1.8cqi, 34px); font-weight: 500; }
.th-feat p { margin-top: 12px; max-width: 300px; color: var(--th-muted); line-height: 2.1; }
.th-feats.side-0 .th-feat p { margin-inline-start: auto; }

/* Booking call: photo on one side, text and two buttons on the other */
.th-cta { position: relative; display: grid; grid-template-columns: 1fr 1fr; min-height: clamp(420px, 36.5cqi, 700px); background: #E3F1F4; overflow: hidden; }
.th-cta-pic { position: absolute; inset: 0; }
.th-cta-pic img { width: 100%; height: 100%; object-fit: cover; object-position: 20% center; transform: scaleX(-1); }
.th-cta-text { position: relative; grid-column: 2; display: grid; place-content: center; justify-items: center; gap: 26px; padding: 60px clamp(20px, 5cqi, 100px); text-align: center; }
.th-cta-text h2 { max-width: 10em; font-family: var(--th-head); font-size: clamp(34px, 3.7cqi, 72px); font-weight: 500; line-height: 1.2; }
.th-cta-text p { max-width: 520px; color: var(--th-muted); font-size: clamp(16px, 1.3cqi, 24px); line-height: 1.8; }
.th-cta-text p a { color: var(--th-peach); }

/* Education table */
.th-table { width: 100%; border-collapse: collapse; font-family: var(--th-head); font-size: clamp(16px, 1.25cqi, 24px); }
.th-table th { padding: 0 0 28px; font-weight: 500; text-align: start; border-bottom: 1px solid #999; }
.th-table td { padding: 30px 0; border-bottom: 1px solid var(--th-line); }
.th-table .th-year { color: #999; text-align: end; }

/* Events */
.th-events { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(24px, 2.3cqi, 44px); }
.th-ev { display: grid; background: #fff; transition: transform .4s, box-shadow .4s; }
.th-ev:hover { transform: translateY(-6px); box-shadow: 0 30px 50px -36px rgb(0 0 0 / .4); }
.th-ev-pic { position: relative; display: block; aspect-ratio: 800 / 600; }
.th-ev-pic img { width: 100%; height: 100%; object-fit: cover; }
.th-ev-price { position: absolute; inset-inline-end: 30px; bottom: -60px; display: grid; place-items: center; width: clamp(80px, 6.2cqi, 120px); height: clamp(80px, 6.2cqi, 120px); border-radius: 50%; background: var(--th-dark); color: #fff; font-family: var(--th-head); font-size: clamp(16px, 1.3cqi, 24px); font-weight: 500; text-align: center; line-height: 1.2; }
.th-ev-text { display: grid; gap: 14px; padding: clamp(30px, 2.6cqi, 50px) clamp(24px, 3cqi, 58px); }
.th-ev-text small { display: flex; align-items: center; gap: 8px; color: var(--th-muted); font-size: 14px; }
.th-ev-text small .th-ico { width: 18px; height: 18px; color: var(--th-blue); }
.th-ev-text b { font-family: var(--th-head); font-size: clamp(20px, 1.6cqi, 30px); font-weight: 500; line-height: 1.4; }

/* Prices */
.th-prices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(20px, 2.3cqi, 44px); }
.th-price { position: relative; display: grid; justify-items: center; gap: 22px; padding: clamp(50px, 4.4cqi, 84px) 24px; overflow: hidden; background: var(--th-ice); text-align: center; }
.th-price h3 { font-family: var(--th-head); font-size: clamp(20px, 1.6cqi, 30px); font-weight: 500; }
.th-price > b { display: grid; font-size: clamp(44px, 4.2cqi, 80px); font-weight: 300; line-height: 1; }
.th-price > b small { margin-top: 8px; font-size: 14px; color: var(--th-muted); }
.th-price ul { display: grid; gap: 14px; padding: 0; list-style: none; color: var(--th-muted); font-size: clamp(14px, 1.15cqi, 22px); }
.th-price li { display: flex; align-items: center; justify-content: center; gap: 10px; }
.th-price li .th-ico { width: 18px; height: 18px; color: var(--th-peach); stroke-width: 2.4; }
.th-price .th-btn { margin-top: 12px; height: clamp(50px, 4cqi, 78px); padding: 0 clamp(26px, 2.4cqi, 46px); }
.th-ribbon { position: absolute; top: 34px; inset-inline-start: -46px; width: 200px; padding: 8px 0; background: #EDBBA7; color: #fff; font-size: 14px; font-style: normal; text-align: center; transform: rotate(-45deg); }

/* New book band */
.th-band { position: relative; overflow: hidden; color: #fff; isolation: isolate; }
.th-band-pic { position: absolute; inset: 0; z-index: -1; }
.th-band-pic img { width: 100%; height: 100%; object-fit: cover; }
.th-band::after { content: ""; position: absolute; inset: 0; z-index: -1; background: rgb(25 22 20 / .45); }
.th-band-in { display: flex; justify-content: space-between; align-items: center; gap: 30px; min-height: clamp(150px, 8.8cqi, 170px); padding-block: 24px; flex-wrap: wrap; }
.th-band h2 { font-family: var(--th-head); font-size: clamp(28px, 2.7cqi, 52px); font-weight: 500; }
.th-band p { margin-top: 6px; font-size: 15px; opacity: .9; }

/* Footer */
.th-foot { background: var(--th-cream); }
.th-foot-in { display: grid; justify-items: center; gap: 30px; padding-block: clamp(60px, 4.7cqi, 90px); text-align: center; }
.th-logo.stacked { flex-direction: column; gap: 14px; }
.th-logo.stacked .th-logo-icon { width: 80px; }
.th-logo.stacked .th-logo-text b { font-size: clamp(30px, 2.4cqi, 46px); }
.th-foot-info { display: flex; gap: 40px; color: var(--th-muted); font-size: 17px; line-height: 1.8; }
.th-foot-info > :first-child { text-align: end; }
.th-foot-info > :last-child { text-align: start; }
.th-foot-socials { gap: 12px !important; }
.th-foot-socials a { width: 48px !important; height: 48px !important; border-radius: 50%; background: var(--th-dark) !important; color: #fff !important; }
.th-foot-socials a:hover { background: var(--th-peach) !important; }
.th-foot-end { padding: 22px; background: var(--th-dark); color: rgb(255 255 255 / .7); font-size: 14px; text-align: center; }

/* Inner page top */
.th-ptop, .th-post-top { position: relative; overflow: hidden; color: #fff; isolation: isolate; }
.th-ptop-pic { position: absolute; inset: 0; z-index: -1; }
.th-ptop-pic img { width: 100%; height: 100%; object-fit: cover; }
.th-ptop::after, .th-post-top::after { content: ""; position: absolute; inset: 0; z-index: -1; background: rgb(25 22 20 / .55); }
.th-ptop-in { display: grid; align-content: center; gap: 14px; min-height: clamp(180px, 14cqi, 270px); }
.th-ptop h1 { font-family: var(--th-head); font-size: clamp(30px, 2.4cqi, 46px); font-weight: 500; }
.th-crumbs { font-size: 15px; opacity: .95; }
.th-post-top-in { display: grid; justify-items: center; align-content: center; gap: 16px; min-height: clamp(300px, 24cqi, 460px); text-align: center; }
.th-post-top em { padding: 4px 14px; border-radius: 99px; background: var(--th-blue); font-size: 12px; font-style: normal; }
.th-post-top h1 { max-width: 16em; font-family: var(--th-head); font-size: clamp(30px, 3cqi, 58px); font-weight: 500; line-height: 1.3; }
.th-post-top .th-meta { color: #fff; opacity: .9; }

/* About */
.th-helps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 30px; }
.th-help { display: grid; justify-items: center; gap: 14px; text-align: center; }
.th-help-pic { width: clamp(150px, 13.3cqi, 256px); aspect-ratio: 1; border-radius: 50%; }
.th-help-pic img { transition: transform 1s; }
.th-help:hover .th-help-pic img { transform: scale(1.08); }
.th-help h3 { margin-top: 18px; font-family: var(--th-head); font-size: clamp(22px, 1.9cqi, 36px); font-weight: 500; }
.th-help p { max-width: 360px; color: var(--th-muted); line-height: 2; }
.th-me { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(40px, 6cqi, 120px); align-items: center; }
.th-me-pics { position: relative; padding-bottom: 18%; padding-inline-end: 18%; }
.th-me-a { width: 72%; aspect-ratio: 578 / 650; }
.th-me-b { position: absolute; inset-inline-end: 6%; bottom: 0; width: 64%; aspect-ratio: 526 / 520; box-shadow: 0 30px 50px -30px rgb(0 0 0 / .4); }
.th-me-text { display: grid; gap: 22px; }
.th-me-text h2 { font-family: var(--th-head); font-size: clamp(36px, 4cqi, 78px); font-weight: 500; }
.th-me-role { color: var(--th-muted); font-size: clamp(18px, 1.6cqi, 30px); }

/* Booking calendar */
.th-booking { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: clamp(24px, 3cqi, 60px); align-items: start; }
.th-cal { border: 1px solid var(--th-line); }
.th-cal-head { display: flex; align-items: center; justify-content: space-between; padding: 22px 30px; background: var(--th-dark); color: #fff; }
.th-cal-head b { font-family: var(--th-head); font-size: 24px; font-weight: 500; }
.th-cal-arrow { display: grid; place-items: center; width: 36px; height: 36px; }
.th-cal-head > span { width: 36px; }
.th-cal-week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); background: var(--th-cream); font-size: 13px; text-align: center; }
.th-cal-week span { padding: 14px 4px; }
.th-cal-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.th-day { display: grid; place-content: center; justify-items: center; gap: 4px; aspect-ratio: 1 / .82; border-inline-start: 1px solid var(--th-line); border-top: 1px solid var(--th-line); font-family: var(--th-head); font-size: clamp(18px, 1.5cqi, 28px); color: #C8C2BC; }
.th-day:nth-child(7n + 1) { border-inline-start: 0; }
.th-day.open { color: var(--th-ink); background: #fff; transition: background .25s, color .25s; }
.th-day.open small { font-family: var(--font-body); font-size: 11px; color: var(--th-blue); }
.th-day.open:hover { background: var(--th-ice); }
.th-day.today { box-shadow: inset 0 0 0 2px var(--th-peach); }
.th-day.picked { background: var(--th-dark) !important; color: #fff; }
.th-day.picked small { color: #fff; }
.th-day.empty { background: #FCFBFA; }
.th-cal-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; padding: 14px 20px; border-top: 1px solid var(--th-line); color: var(--th-muted); font-size: 13px; }
.th-cal-legend i { display: inline-block; width: 14px; height: 14px; border: 1px solid var(--th-line); }
.th-cal-legend i.open { background: #fff; border-color: var(--th-ink); }
.th-cal-legend i.off { background: #EEE; }
.th-times { position: sticky; top: 20px; padding: clamp(24px, 2.4cqi, 44px); background: var(--th-ice); }
.th-pick-hint { display: grid; justify-items: center; gap: 14px; text-align: center; color: var(--th-muted); }
.th-pick-hint h2, .th-form h2 { font-family: var(--th-head); font-size: clamp(24px, 1.9cqi, 34px); font-weight: 500; color: var(--th-ink); }
.th-warn { color: #B4442F; }
.th-slots { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 10px; margin: 0; padding: 0; border: 0; }
.th-slots legend { margin-bottom: 10px; font-size: 14px; color: var(--th-muted); }
.th-slots label { position: relative; }
.th-slots input { position: absolute; opacity: 0; }
.th-slots span { display: inline-block; padding: 10px 18px; border: 1px solid #C9DCE2; border-radius: 99px; background: #fff; cursor: pointer; transition: background .2s, color .2s; }
.th-slots input:checked + span { background: var(--th-dark); border-color: var(--th-dark); color: #fff; }
.th-slots input:focus-visible + span { outline: 2px solid var(--th-blue); }

/* Forms */
.th-form { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.th-form h2, .th-form > .th-btn, .th-form > .th-muted, .th-full { grid-column: 1 / -1; }
.th-form label { display: grid; gap: 8px; font-size: 14px; color: var(--th-muted); }
.th-form input:not([type="radio"]), .th-form select, .th-form textarea { width: 100%; padding: 12px 14px; border: 1px solid #D6E3E7; background: #fff; color: var(--th-ink); font: inherit; }
.th-form.lines input, .th-form.lines textarea { padding: 10px 0; border: 0; border-bottom: 1px solid #C6D5DA; background: transparent; }
.th-form input:focus, .th-form select:focus, .th-form textarea:focus { outline: none; border-color: var(--th-peach); }
.th-form > .th-btn { justify-self: start; }

/* Contact */
.th-infos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 30px; text-align: center; }
.th-info { display: grid; justify-items: center; gap: 14px; color: var(--th-muted); line-height: 1.9; }
.th-info h3 { font-family: var(--th-head); font-size: clamp(22px, 1.6cqi, 30px); font-weight: 500; color: var(--th-ink); }
.th-info .th-ico.big { color: var(--th-ink); }
.th-link { color: var(--th-ink); text-decoration: underline !important; }
.th-contact { display: grid; grid-template-columns: 1fr 1fr; min-height: clamp(520px, 44cqi, 840px); }
.th-map { display: grid; place-items: center; background: #E5E5E5; color: var(--th-muted); }
.th-map iframe { width: 100%; height: 100%; border: 0; filter: grayscale(1); }
.th-contact-form { display: grid; align-content: center; gap: 22px; padding: 60px clamp(24px, 7cqi, 140px); background: var(--th-ice); }
.th-contact-form h2 { font-family: var(--th-head); font-size: clamp(32px, 3.4cqi, 66px); font-weight: 500; line-height: 1.2; }
.th-contact-form p a { color: var(--th-peach); }

/* Blog */
.th-blog { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: clamp(30px, 4cqi, 80px); align-items: start; }
.th-posts { display: grid; gap: 70px; }
.th-post { display: grid; justify-items: start; gap: 14px; }
.th-post-pic { display: block; width: 100%; max-width: 860px; aspect-ratio: 16 / 10; overflow: hidden; }
.th-post-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s; }
.th-post:hover .th-post-pic img { transform: scale(1.04); }
.th-post h2 { margin-top: 8px; font-family: var(--th-head); font-size: clamp(24px, 1.9cqi, 34px); font-weight: 500; line-height: 1.4; }
.th-post p { color: var(--th-muted); line-height: 2; }
.th-meta { color: var(--th-muted); font-size: 13px; }
.th-pager { display: flex; gap: 8px; }
.th-pager a { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--th-line); }
.th-pager a[aria-current="page"] { background: var(--th-peach); border-color: var(--th-peach); color: #fff; }
.th-side { display: grid; gap: 30px; padding: 30px 24px; background: var(--th-cream); position: sticky; top: 20px; }
.th-side h4 { margin-bottom: 14px; font-family: var(--th-head); font-size: 22px; font-weight: 500; }
.th-side-search { display: flex; background: #fff; }
.th-side-search input { flex: 1; min-width: 0; padding: 12px 14px; font: inherit; }
.th-side-search button { display: grid; place-items: center; width: 46px; border: 0; background: none; cursor: pointer; }
.th-side-cats { display: grid; gap: 8px; font-size: 14px; color: var(--th-muted); }
.th-side-cats a:hover { color: var(--th-peach); }
.th-side-post { display: grid; grid-template-columns: 70px 1fr; gap: 12px; align-items: center; margin-bottom: 14px; }
.th-side-post span { display: block; width: 70px; height: 70px; overflow: hidden; }
.th-side-post img { width: 100%; height: 100%; object-fit: cover; }
.th-side-post b { font-size: 14px; font-weight: 600; line-height: 1.6; }
.th-article { display: grid; gap: 40px; }
.th-author { display: flex; align-items: center; gap: 18px; padding: 24px; background: var(--th-cream); }
.th-author span { display: block; width: 76px; height: 76px; border-radius: 50%; overflow: hidden; flex: none; }
.th-author img { width: 100%; height: 100%; object-fit: cover; }
.th-author div { display: grid; gap: 4px; }
.th-author small { color: var(--th-muted); }
.th-comment { display: grid; gap: 20px; }
.th-comment h3, .th-more h3 { font-family: var(--th-head); font-size: 28px; font-weight: 500; }
.th-more > div { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; }
.th-more-item { display: grid; gap: 8px; }
.th-more-item span { display: block; aspect-ratio: 16 / 10; overflow: hidden; }
.th-more-item img { width: 100%; height: 100%; object-fit: cover; }
.th-more-item small { color: var(--th-muted); font-size: 12px; }

/* Gentle reveal while scrolling, where supported */
@supports (animation-timeline: view()) {
  .th-rise { animation: th-up linear both; animation-timeline: view(); animation-range: entry 0% cover 20%; }
  @keyframes th-up { from { opacity: 0; transform: translateY(30px); } }
}
@media (prefers-reduced-motion: reduce) {
  .th *, .th *::before, .th *::after { animation: none !important; transition: none !important; }
}

@container (max-width: 1100px) {
  .th-top-item:nth-child(2) { display: none; }
  .th-books { grid-template-columns: 1fr 1fr; }
  .th-book { grid-column: 1 / -1; grid-row: 1; max-width: 420px; justify-self: center; }
  .th-feats.side-0, .th-feats.side-1 { grid-row: 2; }
  .th-feats.side-1 { grid-column: 2; }
  .th-feats.side-0 .th-feat { flex-direction: row; text-align: start; }
  .th-feats.side-0 .th-feat p { margin-inline-start: 0; }
  .th-helps { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 50px; }
  .th-booking, .th-blog { grid-template-columns: 1fr; }
  .th-times, .th-side { position: static; }
}
@container (max-width: 820px) {
  .th { font-size: 15px; }
  .th-top-info { display: none; }
  .th-top-in { justify-content: center; min-height: 80px; }
  .th-bar-in { min-height: 56px; }
  .th-nav { display: none; }
  .th-burger { display: block; position: static; }
  .th-burger summary span, .th-burger summary span::before, .th-burger summary span::after { position: relative; display: block; width: 24px; height: 1.5px; background: var(--th-ink); transition: transform .3s, background .3s; }
  .th-burger summary span::before, .th-burger summary span::after { content: ""; position: absolute; inset-inline: 0; }
  .th-burger summary span::before { top: -7px; }
  .th-burger summary span::after { top: 7px; }
  .th-burger summary { width: 40px; height: 40px; }
  .th-burger[open] summary span { background: transparent; }
  .th-burger[open] summary span::before { top: 0; transform: rotate(45deg); }
  .th-burger[open] summary span::after { top: 0; transform: rotate(-45deg); }
  .th-bar-in { position: relative; }
  .th-drawer { position: absolute; inset-inline: 0; top: 100%; z-index: 5; display: grid; padding: 6px 18px 18px; background: var(--th-cream); border-bottom: 1px solid var(--th-line); font-family: var(--th-head); font-size: 18px; }
  .th-drawer a { padding: 12px 4px; border-top: 1px solid var(--th-line); }
  .th-drawer a[aria-current="page"] { color: var(--th-peach); }
  .th-search form { width: min(320px, 86vw); }
  .th-hero { height: 520px; }
  .th-slide-text { padding: 0 24px; }
  .th-arrow { display: none; }
  .th-books, .th-events, .th-prices, .th-infos, .th-me, .th-contact, .th-form { grid-template-columns: 1fr; }
  .th-feats.side-0, .th-feats.side-1 { grid-column: 1; }
  .th-feats.side-1 { grid-row: 3; }
  .th-cta { grid-template-columns: 1fr; min-height: 0; }
  .th-cta-pic { position: relative; display: block; height: 320px; }
  .th-cta-text { grid-column: 1; }
  .th-table { font-size: 15px; }
  .th-table th:nth-child(3), .th-table td:nth-child(3) { display: none; }
  .th-helps { grid-template-columns: 1fr; }
  .th-day { aspect-ratio: 1; font-size: 17px; }
  .th-day.open small { display: none; }
  .th-day.open::after { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--th-blue); }
  .th-day.picked::after { background: #fff; }
  .th-cal-week span { padding: 10px 0; font-size: 10px; }
  .th-band-in { justify-content: center; text-align: center; }
  .th-foot-info { flex-direction: column; gap: 10px; }
  .th-foot-info > * { text-align: center !important; }
  .th-more > div { grid-template-columns: 1fr; }
  .th-map { min-height: 300px; }
}
`;
