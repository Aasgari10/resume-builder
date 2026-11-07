/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Grid": a dark, card-based ("bento") portfolio. The home page is a grid of cards that lead to
// the inner pages: about, credentials (full resume), works, services and contact. Cards fade and
// rise in smoothly (on scroll where the browser supports it, otherwise on load) and a strip of
// text scrolls sideways. Pages and home cards can be switched off (site.hiddenPages/hiddenBlocks).
// Every text and picture carries a data-edit marker for the editor.

import type { CSSProperties, ReactNode } from "react";
import type { ResumeData } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { ZoomOpen } from "./zoom";
import { formatNumber, formatPeriod, formatYearMonth, isDummyUrl, linkLabel, safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";

/* ───────────── Pages and blocks ───────────── */

export const GRID_OPTIONAL_PAGES = [
  { path: "/about", label: "درباره‌ی من" },
  { path: "/credentials", label: "سوابق" },
  { path: "/gallery", label: "مدارک" },
  { path: "/works", label: "نمونه‌کارها" },
  { path: "/services", label: "خدمات" },
  { path: "/contact", label: "تماس" },
] as const;

export const GRID_BLOCKS = [
  { key: "marquee", label: "نوار متحرک" },
  { key: "credentials", label: "کارت سوابق" },
  { key: "works", label: "کارت نمونه‌کارها" },
  { key: "gallery", label: "کارت مدارک" },
  { key: "services", label: "کارت خدمات" },
  { key: "profiles", label: "کارت شبکه‌های اجتماعی" },
  { key: "stats", label: "کارت آمار" },
  { key: "together", label: "کارت «بیایید با هم کار کنیم»" },
] as const;

export function gridPages(data: ResumeData): string[] {
  const off = data.site?.hiddenPages ?? [];
  // The certificates page exists only when there is at least one picture to show.
  const hasGallery = Boolean(data.site?.gallery.some((g) => safeUrl(g.image)));
  return ["/", ...GRID_OPTIONAL_PAGES.map((p) => p.path).filter((p) => !off.includes(p) && (p !== "/gallery" || hasGallery))];
}

const TEXT = {
  fa: {
    menu: { "/": "خانه", "/about": "درباره", "/works": "نمونه‌کارها", "/contact": "تماس" } as Record<string, string>,
    talk: "بیایید صحبت کنیم",
    credentials: "سوابق",
    moreAbout: "بیشتر درباره‌ی من",
    showcase: "نمایشگاه",
    projects: "پروژه‌ها",
    gallery: "مدارک",
    certificates: "گواهی‌ها",
    myCerts: "مدارک من",
    addCert: "افزودن مدرک",
    close: "بستن",
    specialization: "تخصص",
    services: "خدماتی که ارائه می‌دهم",
    stayWithMe: "همراه من باشید",
    profiles: "شبکه‌های اجتماعی",
    years: "سال تجربه",
    totalProjects: "پروژه‌ی انجام‌شده",
    totalCerts: "مدرک و گواهی",
    lets: "بیایید",
    together: "با هم کار کنیم.",
    summary: "خلاصه‌ی من",
    experience: "سوابق کاری",
    education: "تحصیلات",
    aboutMe: "درباره‌ی من",
    skills: "مهارت‌ها",
    awards: "دوره‌ها و جوایز",
    contactMe: "تماس با من",
    allProjects: "همه‌ی پروژه‌ها",
    offerings: "خدمات من",
    contactInfo: "اطلاعات تماس",
    mail: "ایمیل",
    phone: "تلفن",
    location: "نشانی",
    social: "شبکه‌های اجتماعی",
    name: "نام",
    email: "ایمیل",
    subject: "موضوع",
    message: "پیام شما",
    send: "ارسال پیام",
    rights: "همه‌ی حقوق محفوظ است",
    notFound: "این صفحه پیدا نشد.",
  },
  en: {
    menu: { "/": "Home", "/about": "About", "/works": "Works", "/contact": "Contact" } as Record<string, string>,
    talk: "Let's talk",
    credentials: "Credentials",
    moreAbout: "More about me",
    showcase: "Showcase",
    projects: "Projects",
    gallery: "Gallery",
    certificates: "Certificates",
    myCerts: "My certificates",
    addCert: "Add certificate",
    close: "Close",
    specialization: "Specialization",
    services: "Services offering",
    stayWithMe: "Stay with me",
    profiles: "Profiles",
    years: "Years experience",
    totalProjects: "Total projects",
    totalCerts: "Certificates",
    lets: "Let's",
    together: "work together.",
    summary: "Self-summary",
    experience: "Experience",
    education: "Education",
    aboutMe: "About me",
    skills: "Skills",
    awards: "Awards",
    contactMe: "Contact me",
    allProjects: "All projects",
    offerings: "My offerings",
    contactInfo: "Contact info",
    mail: "Mail us",
    phone: "Contact us",
    location: "Location",
    social: "Social info",
    name: "Name",
    email: "Email",
    subject: "Your subject",
    message: "Your message",
    send: "Send message",
    rights: "All rights reserved",
    notFound: "This page was not found.",
  },
};

/* ───────────── Click-to-edit markers ───────────── */

type EditKind = "text" | "multiline" | "image" | "url" | "period" | "month" | "lines" | "tags" | "newlink" | "newimage";
type Edit = { "data-edit": string; "data-edit-kind": EditKind; "data-edit-label": string };
const ed = (path: string, kind: EditKind, label: string): Edit => ({ "data-edit": path, "data-edit-kind": kind, "data-edit-label": label });
const item = (list: string, id: string) => `${list}[${id}]`;

function Opt({ value, editing, edit, children }: { value: unknown; editing: boolean; edit: Edit; children?: ReactNode }) {
  const filled = Array.isArray(value) ? value.some((v) => String(v).trim()) : Boolean(String(value ?? "").trim());
  if (filled) return <>{children}</>;
  return editing ? (
    <span className="gx-ghost" {...edit}>
      + {edit["data-edit-label"]}
    </span>
  ) : null;
}

const paragraphs = (text: string) => text.split(/\n\s*\n|\n/).filter((p) => p.trim());

/* ───────────── Template ───────────── */

type Link = (path: string) => string;
type View = { ctx: Ctx; link: Link; editing: boolean; t: (typeof TEXT)["fa"] };

export function GridPortfolio(props: TemplateProps) {
  const ctx = webCtx(props);
  const view: View = { ctx, link: props.link ?? ((p: string) => p), editing: Boolean(props.editing), t: TEXT[ctx.data.locale] };
  const page = props.page ?? "/";
  const pages = gridPages(ctx.data);

  let body: ReactNode;
  if (!pages.includes(page)) body = <p className="gx-empty">{view.t.notFound}</p>;
  else if (page === "/about") body = <About {...view} />;
  else if (page === "/credentials") body = <Credentials {...view} />;
  else if (page === "/gallery") body = <Gallery {...view} />;
  else if (page === "/works") body = <Works {...view} />;
  else if (page === "/services") body = <Services {...view} />;
  else if (page === "/contact") body = <Contact {...view} />;
  else body = <Home {...view} />;

  return (
    <WebPage ctx={ctx} className="gx" css={css}>
      <Header {...view} page={page} />
      <main className="gx-main">{body}</main>
      <Footer {...view} />
    </WebPage>
  );
}

function PageLink({ to, link, className, children, edit, current }: { to: string; link: Link; className?: string; children: ReactNode; edit?: Edit; current?: boolean }) {
  return (
    <a href={link(to)} data-page={to} className={className} aria-current={current ? "page" : undefined} {...edit}>
      {children}
    </a>
  );
}

/** Link to an inner page when it is on, otherwise to the top of the current page. */
function To({ view, to, className, children }: { view: View; to: string; className?: string; children: ReactNode }) {
  const on = gridPages(view.ctx.data).includes(to);
  return on ? (
    <PageLink to={to} link={view.link} className={className}>
      {children}
    </PageLink>
  ) : (
    <a href="#" className={className}>
      {children}
    </a>
  );
}

const shown = (view: View, key: string) => !(view.ctx.data.site?.hiddenBlocks ?? []).includes(key);

function Header(view: View & { page: string }) {
  const { ctx, link, t, page } = view;
  const pages = gridPages(ctx.data);
  return (
    <header className="gx-head">
      <PageLink to="/" link={link} className="gx-logo">
        <span {...ed("basics.fullName", "text", "نام")}>{ctx.data.basics.fullName.trim().split(/\s+/)[0]}</span>
      </PageLink>
      <nav className="gx-nav">
        {Object.keys(t.menu)
          .filter((p) => pages.includes(p))
          .map((p) => (
            <PageLink key={p} to={p} link={link} current={p === page}>
              {t.menu[p]}
            </PageLink>
          ))}
      </nav>
      <To view={view} to="/contact" className="gx-talk">
        {t.talk}
      </To>
    </header>
  );
}

function Footer({ ctx, link, t }: View) {
  const pages = gridPages(ctx.data);
  return (
    <footer className="gx-foot">
      <PageLink to="/" link={link} className="gx-logo">
        {ctx.data.basics.fullName.trim().split(/\s+/)[0]}
      </PageLink>
      <nav>
        {Object.keys(t.menu)
          .filter((p) => pages.includes(p))
          .map((p) => (
            <PageLink key={p} to={p} link={link}>
              {t.menu[p]}
            </PageLink>
          ))}
      </nav>
      <p>
        © {t.rights} — {ctx.data.basics.fullName}
      </p>
    </footer>
  );
}

/* ───────────── Small pieces ───────────── */

/** Circle with a four-point star; turns on hover of its card. */
function Go() {
  return (
    <span className="gx-go" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M12 4c.6 4.4 3.6 7.4 8 8-4.4.6-7.4 3.6-8 8-.6-4.4-3.6-7.4-8-8 4.4-.6 7.4-3.6 8-8z" />
      </svg>
    </span>
  );
}

/** Twelve-ray star beside page titles (still, not spinning). */
function Burst() {
  return (
    <svg className="gx-burst" viewBox="0 0 8 8" aria-hidden="true">
      <path d="M3.80051 0.605637C3.81936 0.359319 4.18049 0.359319 4.19934 0.605637L4.3137 2.09993C4.32812 2.28827 4.57153 2.35349 4.67819 2.19759L5.52437 0.960678C5.66385 0.756786 5.9766 0.937351 5.86977 1.16009L5.22166 2.51136C5.13997 2.68168 5.31817 2.85988 5.48849 2.77819L6.83976 2.13008C7.0625 2.02325 7.24307 2.336 7.03917 2.47548L5.80226 3.32166C5.64636 3.42832 5.71158 3.67174 5.89992 3.68615L7.39421 3.80051C7.64053 3.81936 7.64053 4.18049 7.39421 4.19934L5.89993 4.3137C5.71158 4.32812 5.64636 4.57153 5.80226 4.67819L7.03917 5.52437C7.24307 5.66385 7.0625 5.9766 6.83976 5.86977L5.48849 5.22166C5.31817 5.13997 5.13997 5.31817 5.22166 5.48849L5.86977 6.83976C5.9766 7.0625 5.66385 7.24307 5.52437 7.03917L4.67819 5.80226C4.57153 5.64636 4.32812 5.71158 4.3137 5.89992L4.19934 7.39421C4.18049 7.64053 3.81936 7.64053 3.80051 7.39421L3.68615 5.89993C3.67174 5.71158 3.42832 5.64636 3.32166 5.80226L2.47548 7.03917C2.336 7.24307 2.02325 7.0625 2.13008 6.83976L2.77819 5.48849C2.85988 5.31817 2.68168 5.13997 2.51137 5.22166L1.16009 5.86977C0.937352 5.9766 0.756785 5.66385 0.960677 5.52437L2.19759 4.67819C2.35349 4.57153 2.28827 4.32812 2.09993 4.3137L0.605637 4.19934C0.359319 4.18049 0.359319 3.81936 0.605637 3.80051L2.09993 3.68615C2.28827 3.67174 2.35349 3.42832 2.19759 3.32166L0.960678 2.47548C0.756786 2.336 0.937351 2.02325 1.16009 2.13008L2.51136 2.77819C2.68168 2.85988 2.85988 2.68168 2.77819 2.51137L2.13008 1.16009C2.02325 0.937352 2.336 0.756785 2.47548 0.960677L3.32166 2.19759C3.42832 2.35349 3.67174 2.28827 3.68615 2.09993L3.80051 0.605637Z" />
    </svg>
  );
}

/** A thin line hanging from the top of a card with a four-point star at its end. */
function Hang() {
  return (
    <span className="gx-hang" aria-hidden="true">
      <svg viewBox="0 0 56 140">
        <path d="M28 0V84" />
        <path d="M28 84c1.6 13 7 18.6 20 20-13 1.4-18.4 7-20 20-1.6-13-7-18.6-20-20 13-1.4 18.4-7 20-20z" />
      </svg>
    </span>
  );
}

function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="gx-title">
      <Burst />
      <span>{children}</span>
      <Burst />
    </h1>
  );
}

function Card({ className = "", i = 0, children }: { className?: string; i?: number; children: ReactNode }) {
  return (
    <div className={`gx-card ${className}`} style={{ "--i": i } as CSSProperties}>
      {children}
    </div>
  );
}

function Label({ small, title }: { small: string; title: ReactNode }) {
  return (
    <div className="gx-label">
      <small>{small}</small>
      <strong>{title}</strong>
    </div>
  );
}

function Photo({ ctx, className = "" }: { ctx: Ctx; className?: string }) {
  const src = safeUrl(ctx.data.site?.aboutImage || ctx.data.basics.avatarUrl);
  return (
    <div className={`gx-photo ${className}`} {...ed("site.aboutImage", "image", "عکس من")}>
      {src ? <img src={src} alt={ctx.data.basics.fullName} /> : <span>{ctx.data.basics.fullName.charAt(0)}</span>}
    </div>
  );
}

const ICONS: Record<string, string> = {
  camera: "M4 8h3l2-2h6l2 2h3v11H4z M12 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  pen: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7l-4 9h8z M12 13v.01",
  circles: "M12 8a4 4 0 1 0 0 .01 M9 13a4 4 0 1 0 0 .01 M15 13a4 4 0 1 0 0 .01",
  code: "M8 4H6v6l-2 2 2 2v6h2 M16 4h2v6l2 2-2 2v6h-2",
  mail: "M4 6h16v12H4z M4 7l8 6 8-6",
  phone: "M6 3h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z",
  pin: "M12 21s-7-6-7-11a7 7 0 1 1 14 0c0 5-7 11-7 11z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  whatsapp: "M4 20l1.5-4.5A8 8 0 1 1 8.5 18.5z M9 9.5c.5 2.5 2.5 4.5 5 5l1.5-1.5-2-1-1 1a5 5 0 0 1-2-2l1-1-1-2z",
  telegram: "M21 4L3 11l6 2 2 6 3-4 5 4z M9 13l8-6",
  instagram: "M5 5h14v14H5z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M16.5 7.5h.01",
  github: "M9 18l-6-6 6-6 M15 6l6 6-6 6",
  linkedin: "M5 5h14v14H5z M8 10v6 M8 7.5v.01 M11.5 16v-6 M11.5 12.5c0-1.5 1-2.5 2.5-2.5s2 1 2 2.5V16",
  dribbble: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M5 7c4 3 10 4 15 3 M8 20c1-6 5-10 12-10 M7 4c3 4 6 10 7 17",
  behance: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3 3 3 15 0 18",
  website: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3a14 14 0 0 1 0 18 M12 3a14 14 0 0 0 0 18",
  other: "M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1 M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1",
};
const SERVICE_ICONS = ["camera", "pen", "circles", "code"];

function Icon({ name }: { name: string }) {
  return (
    <svg className="gx-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name] ?? ICONS.other} />
    </svg>
  );
}

function Socials({ ctx, editing }: { ctx: Ctx; editing: boolean }) {
  const links = ctx.data.basics.links.filter((l) => safeUrl(l.url));
  return (
    <div className="gx-socials">
      {links.map((l) => (
        <a key={l.id} href={safeUrl(l.url)} target={isDummyUrl(l.url) ? undefined : "_blank"} rel="noopener noreferrer" aria-label={linkLabel(l, ctx.data.locale)} {...ed(`basics.links[${l.id}].url`, "url", linkLabel(l, ctx.data.locale))}>
          <Icon name={l.type} />
        </a>
      ))}
      {editing && (
        <span className="gx-ghost" {...ed("basics.links", "newlink", "افزودن راه ارتباطی")}>
          +
        </span>
      )}
    </div>
  );
}

function Together({ view, i }: { view: View; i: number }) {
  return (
    <Card className="gx-together" i={i}>
      <To view={view} to="/contact" className="gx-fill">
        <Hang />
        <h2>
          {view.t.lets}
          <br />
          <em>{view.t.together}</em>
        </h2>
        <Go />
      </To>
    </Card>
  );
}

function CredentialsCard({ view, i }: { view: View; i: number }) {
  const sign = safeUrl(view.ctx.data.site?.signatureImage);
  return (
    <Card className="gx-small" i={i}>
      <To view={view} to="/credentials" className="gx-fill">
        <div className="gx-thumb" {...ed("site.signatureImage", "image", "تصویر امضا")}>
          {sign && <img src={sign} alt="" />}
        </div>
        <Label small={view.t.moreAbout} title={view.t.credentials} />
        <Go />
      </To>
    </Card>
  );
}

function ProfilesCard({ view, i }: { view: View; i: number }) {
  return (
    <Card className="gx-small" i={i}>
      <div className="gx-fill">
        <div className="gx-thumb gx-inset">
          <Socials ctx={view.ctx} editing={view.editing} />
        </div>
        <Label small={view.t.stayWithMe} title={view.t.profiles} />
      </div>
    </Card>
  );
}

/* ───────────── Home ───────────── */

function Home(view: View) {
  const { ctx, editing, t } = view;
  const { data } = ctx;
  const b = data.basics;
  const site = data.site;
  const marquee = site?.bandText?.trim() || t.showcase;
  const firstShot = safeUrl(site?.gallery.find((g) => safeUrl(g.image))?.image);
  const works = safeUrl(site?.accentImage);
  const services = data.skills.filter((s) => s.name.trim()).slice(0, 4);
  const startYears = data.experience.map((x) => Number(x.period.start.slice(0, 4))).filter(Boolean);
  const years = startYears.length ? new Date().getFullYear() - Math.min(...startYears) : 0;
  const num = (n: number) => formatNumber(n, data.locale);

  return (
    <div className="gx-grid">
      <Card className="gx-hero" i={0}>
        <To view={view} to="/about" className="gx-fill gx-row">
          <Photo ctx={ctx} />
          <div className="gx-intro">
            <Opt value={b.jobTitle} editing={editing} edit={ed("basics.jobTitle", "text", "عنوان شغلی")}>
              <small {...ed("basics.jobTitle", "text", "عنوان شغلی")}>{b.jobTitle}</small>
            </Opt>
            <h1 {...ed("basics.fullName", "text", "نام")}>{b.fullName}</h1>
            <Opt value={site?.tagline} editing={editing} edit={ed("site.tagline", "multiline", "معرفی کوتاه")}>
              <p {...ed("site.tagline", "multiline", "معرفی کوتاه")}>{site?.tagline}</p>
            </Opt>
          </div>
          <Go />
        </To>
      </Card>

      <div className="gx-side">
        {shown(view, "marquee") && (
          <Card className="gx-marquee" i={1}>
            <div className="gx-track" {...ed("site.bandText", "text", "متن نوار متحرک")}>
              {Array.from({ length: 8 }, (_, k) => (
                <span key={k}>
                  {marquee} <i aria-hidden="true">●</i>
                </span>
              ))}
            </div>
          </Card>
        )}
        <div className="gx-pair">
          {shown(view, "credentials") && <CredentialsCard view={view} i={2} />}
          {shown(view, "works") && (
            <Card className="gx-small" i={3}>
              <To view={view} to="/works" className="gx-fill">
                <div className="gx-thumb" {...ed("site.accentImage", "image", "تصویر کارت نمونه‌کارها")}>
                  {works && <img src={works} alt="" />}
                </div>
                <Label small={t.showcase} title={t.projects} />
                <Go />
              </To>
            </Card>
          )}
        </div>
      </div>

      {shown(view, "gallery") && (
        <Card className="gx-small" i={4}>
          <To view={view} to="/gallery" className="gx-fill">
            <div className="gx-thumb">{firstShot && <img src={firstShot} alt="" className="gx-cover" />}</div>
            <Label small={t.certificates} title={t.gallery} />
            <Go />
          </To>
        </Card>
      )}

      {shown(view, "services") && (
        <Card className="gx-wide" i={5}>
          <To view={view} to="/services" className="gx-fill">
            <div className="gx-icons">
              {services.map((s, k) => (
                <span key={s.id} title={s.name}>
                  <Icon name={SERVICE_ICONS[k % 4]!} />
                </span>
              ))}
            </div>
            <Label small={t.specialization} title={t.services} />
            <Go />
          </To>
        </Card>
      )}

      {shown(view, "profiles") && <ProfilesCard view={view} i={6} />}

      {shown(view, "stats") && (
        <Card className="gx-stats" i={7}>
          <div>
            <b>{num(years).padStart(2, data.locale === "fa" ? "۰" : "0")}</b>
            <small>{t.years}</small>
          </div>
          <div>
            <b>+{num(data.projects.length)}</b>
            <small>{t.totalProjects}</small>
          </div>
          <div>
            <b>+{num(data.certificates.length + (site?.gallery.length ?? 0))}</b>
            <small>{t.totalCerts}</small>
          </div>
        </Card>
      )}

      {shown(view, "together") && <Together view={view} i={8} />}
    </div>
  );
}

/* ───────────── About ───────────── */

function About(view: View) {
  const { ctx, editing, t } = view;
  const { data } = ctx;
  const fmt = ctx.theme.display.dateFormat;
  const text = data.site?.aboutText?.trim() || data.basics.summary?.trim() || "";
  return (
    <div className="gx-stack">
      <div className="gx-split">
        <Card className="gx-photo-card" i={0}>
          <Photo ctx={ctx} />
        </Card>
        <div className="gx-stack">
          <Title>{t.summary}</Title>
          <Card className="gx-summary" i={1}>
            <Hang />
            <h2 {...ed("basics.fullName", "text", "نام")}>{data.basics.fullName}</h2>
            <Opt value={text} editing={editing} edit={ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
              <div className="gx-text" {...ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
                {paragraphs(text).map((p, k) => (
                  <p key={k}>{p}</p>
                ))}
              </div>
            </Opt>
          </Card>
        </div>
      </div>
      <div className="gx-two">
        <Card i={2}>
          <h3 className="gx-h3">{t.experience}</h3>
          {data.experience.map((x) => (
            <div key={x.id} className="gx-entry">
              <small {...ed(`${item("experience", x.id)}.period`, "period", "تاریخ")}>{formatPeriod(x.period, data.locale, fmt)}</small>
              <strong {...ed(`${item("experience", x.id)}.position`, "text", "سمت")}>{x.position}</strong>
              <span {...ed(`${item("experience", x.id)}.company`, "text", "شرکت")}>{x.company}</span>
            </div>
          ))}
        </Card>
        <Card i={3}>
          <h3 className="gx-h3">{t.education}</h3>
          {data.education.map((x) => (
            <div key={x.id} className="gx-entry">
              <small {...ed(`${item("education", x.id)}.period`, "period", "تاریخ")}>{formatPeriod(x.period, data.locale, fmt)}</small>
              <strong {...ed(`${item("education", x.id)}.degree`, "text", "مقطع و رشته")}>{[x.degree, x.field].filter(Boolean).join(" ") || x.institution}</strong>
              <span {...ed(`${item("education", x.id)}.institution`, "text", "دانشگاه")}>{x.institution}</span>
            </div>
          ))}
        </Card>
      </div>
      <div className="gx-row3">
        {shown(view, "profiles") && <ProfilesCard view={view} i={4} />}
        {shown(view, "together") && <Together view={view} i={5} />}
        {shown(view, "credentials") && <CredentialsCard view={view} i={6} />}
      </div>
    </div>
  );
}

/* ───────────── Credentials (full resume) ───────────── */

function Credentials(view: View) {
  const { ctx, editing, t } = view;
  const { data } = ctx;
  const fmt = ctx.theme.display.dateFormat;
  const text = data.basics.summary?.trim() || "";
  const skills = data.skills.filter((s) => s.name.trim());
  return (
    <div className="gx-cv">
      <aside>
        <Card className="gx-profile" i={0}>
          <Photo ctx={ctx} />
          <h2 {...ed("basics.fullName", "text", "نام")}>{data.basics.fullName}</h2>
          <Opt value={data.basics.jobTitle} editing={editing} edit={ed("basics.jobTitle", "text", "عنوان شغلی")}>
            <small {...ed("basics.jobTitle", "text", "عنوان شغلی")}>{data.basics.jobTitle}</small>
          </Opt>
          <Socials ctx={ctx} editing={editing} />
          <To view={view} to="/contact" className="gx-btn">
            {t.contactMe}
          </To>
        </Card>
      </aside>
      <div className="gx-cv-body">
        <section>
          <h3 className="gx-h3">{t.aboutMe}</h3>
          <Opt value={text} editing={editing} edit={ed("basics.summary", "multiline", "خلاصه")}>
            <p className="gx-text" {...ed("basics.summary", "multiline", "خلاصه")}>
              {text}
            </p>
          </Opt>
        </section>
        {data.experience.length > 0 && (
          <section>
            <h3 className="gx-h3">{t.experience}</h3>
            {data.experience.map((x) => {
              const at = item("experience", x.id);
              return (
                <div key={x.id} className="gx-entry wide">
                  <small {...ed(`${at}.period`, "period", "تاریخ")}>{formatPeriod(x.period, data.locale, fmt)}</small>
                  <strong className="gx-accent" {...ed(`${at}.position`, "text", "سمت")}>
                    {x.position}
                  </strong>
                  <span {...ed(`${at}.company`, "text", "شرکت")}>{x.company}</span>
                  <Opt value={x.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیحات")}>
                    <p className="gx-text" {...ed(`${at}.description`, "multiline", "توضیحات")}>
                      {x.description}
                    </p>
                  </Opt>
                </div>
              );
            })}
          </section>
        )}
        {data.education.length > 0 && (
          <section>
            <h3 className="gx-h3">{t.education}</h3>
            {data.education.map((x) => {
              const at = item("education", x.id);
              return (
                <div key={x.id} className="gx-entry wide">
                  <small {...ed(`${at}.period`, "period", "تاریخ")}>{formatPeriod(x.period, data.locale, fmt)}</small>
                  <strong className="gx-accent" {...ed(`${at}.degree`, "text", "مقطع و رشته")}>
                    {[x.degree, x.field].filter(Boolean).join(" ") || x.institution}
                  </strong>
                  <span {...ed(`${at}.institution`, "text", "دانشگاه")}>{x.institution}</span>
                  <Opt value={x.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیحات")}>
                    <p className="gx-text" {...ed(`${at}.description`, "multiline", "توضیحات")}>
                      {x.description}
                    </p>
                  </Opt>
                </div>
              );
            })}
          </section>
        )}
        {skills.length > 0 && (
          <section>
            <h3 className="gx-h3">{t.skills}</h3>
            <div className="gx-skills">
              {skills.map((s) => (
                <div key={s.id} className="gx-entry">
                  {s.level && <small>{formatNumber(s.level * 20, data.locale)}٪</small>}
                  <strong {...ed(`${item("skills", s.id)}.name`, "text", "مهارت")}>{s.name}</strong>
                  <Opt value={s.category} editing={editing} edit={ed(`${item("skills", s.id)}.category`, "text", "دسته")}>
                    <span {...ed(`${item("skills", s.id)}.category`, "text", "دسته")}>{s.category}</span>
                  </Opt>
                </div>
              ))}
            </div>
          </section>
        )}
        {data.certificates.length > 0 && (
          <section>
            <h3 className="gx-h3">{t.awards}</h3>
            {data.certificates.map((c) => (
              <div key={c.id} className="gx-entry">
                <Opt value={c.date} editing={editing} edit={ed(`${item("certificates", c.id)}.date`, "month", "تاریخ")}>
                  <small {...ed(`${item("certificates", c.id)}.date`, "month", "تاریخ")}>{formatYearMonth(c.date, data.locale, fmt)}</small>
                </Opt>
                <strong {...ed(`${item("certificates", c.id)}.title`, "text", "عنوان")}>{c.title}</strong>
                <Opt value={c.issuer} editing={editing} edit={ed(`${item("certificates", c.id)}.issuer`, "text", "صادرکننده")}>
                  <span {...ed(`${item("certificates", c.id)}.issuer`, "text", "صادرکننده")}>{c.issuer}</span>
                </Opt>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

/* ───────────── Works ───────────── */

function Works(view: View) {
  const { ctx, editing, t } = view;
  const items = ctx.data.projects.filter((p) => p.title.trim());
  // Like the reference: one column of alternating short and tall cards beside the title and a
  // two-column grid; every column ends on the same line.
  const side = items.filter((_, k) => k % 3 === 0);
  const rest = items.filter((_, k) => k % 3 !== 0);
  const card = (p: (typeof items)[number], k: number) => {
    const at = item("projects", p.id);
    const href = safeUrl(p.url) ?? safeUrl(p.repoUrl);
    const img = safeUrl(p.images[0]);
    return (
      <Card key={p.id} className="gx-project" i={k}>
        <a href={href ?? "#"} target={href && !isDummyUrl(href) ? "_blank" : undefined} rel="noopener noreferrer" className="gx-fill">
          <div className="gx-shot" {...ed(`${at}.images.0`, "image", "تصویر پروژه")}>
            {img ? <img src={img} alt={p.title} loading="lazy" /> : <span>{p.title.charAt(0)}</span>}
          </div>
          <div className="gx-label">
            <Opt value={p.role} editing={editing} edit={ed(`${at}.role`, "text", "دسته")}>
              <small {...ed(`${at}.role`, "text", "دسته")}>{p.role}</small>
            </Opt>
            <strong {...ed(`${at}.title`, "text", "عنوان پروژه")}>{p.title}</strong>
          </div>
          <span className="gx-go-edit" {...ed(`${at}.url`, "url", "لینک پروژه")}>
            <Go />
          </span>
        </a>
      </Card>
    );
  };
  return (
    <div className="gx-works">
      <div className="gx-col">{side.map((p, k) => card(p, k * 2))}</div>
      <div className="gx-col">
        <Title>{t.allProjects}</Title>
        <div className="gx-pairs">{rest.map((p, k) => card(p, k + 1))}</div>
      </div>
    </div>
  );
}

/* ───────────── Certificates ───────────── */

function Gallery(view: View) {
  const { ctx, editing, t } = view;
  const items = (ctx.data.site?.gallery ?? []).filter((g) => safeUrl(g.image));
  return (
    <div className="gx-stack">
      <Title>{t.myCerts}</Title>
      <div className="gx-certs">
        {items.map((g, k) => {
          const at = item("site.gallery", g.id);
          const src = safeUrl(g.image)!;
          return (
            <Card key={g.id} className="gx-cert" i={k}>
              <ZoomOpen id={g.id} className="gx-fill">
                {/* The certificate sits on a dark mat, so any paper colour or shape looks at home. */}
                <div className="gx-mat" {...ed(`${at}.image`, "image", "تصویر مدرک")}>
                  <img src={src} alt={g.title} loading="lazy" />
                </div>
                <div className="gx-label">
                  <Opt value={g.description} editing={editing} edit={ed(`${at}.description`, "text", "صادرکننده یا توضیح")}>
                    <small {...ed(`${at}.description`, "text", "صادرکننده یا توضیح")}>{g.description}</small>
                  </Opt>
                  <strong {...ed(`${at}.title`, "text", "عنوان مدرک")}>{g.title}</strong>
                </div>
                <Go />
              </ZoomOpen>
            </Card>
          );
        })}
        {editing && (
          <div className="gx-card gx-cert gx-add" {...ed("site.gallery", "newimage", t.addCert)}>
            <span>+</span>
            {t.addCert}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── Services ───────────── */

function Services(view: View) {
  const { ctx, editing, t } = view;
  const skills = ctx.data.skills.filter((s) => s.name.trim()).slice(0, 6);
  return (
    <div className="gx-stack">
      <div className="gx-offer">
        <Card className="gx-offer-list" i={0}>
          {skills.map((s, k) => (
            <div key={s.id}>
              <Icon name={SERVICE_ICONS[k % 4]!} />
              <span>{s.name}</span>
            </div>
          ))}
        </Card>
        <div className="gx-stack">
          <Title>{t.offerings}</Title>
          <Card className="gx-offer-grid" i={1}>
            {skills.map((s) => {
              const at = item("skills", s.id);
              return (
                <div key={s.id} className="gx-offer-item">
                  <small {...ed(`${at}.name`, "text", "عنوان خدمت")}>{s.name}</small>
                  <Opt value={s.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیح خدمت")}>
                    <p {...ed(`${at}.description`, "multiline", "توضیح خدمت")}>{s.description}</p>
                  </Opt>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
      <div className="gx-row3">
        {shown(view, "profiles") && <ProfilesCard view={view} i={2} />}
        {shown(view, "together") && <Together view={view} i={3} />}
        {shown(view, "credentials") && <CredentialsCard view={view} i={4} />}
      </div>
    </div>
  );
}

/* ───────────── Contact ───────────── */

function Contact(view: View) {
  const { ctx, editing, t } = view;
  const b = ctx.data.basics;
  const email = b.email?.trim();
  return (
    <div className="gx-contact">
      <div className="gx-stack">
        <h3 className="gx-h3">{t.contactInfo}</h3>
        <div className="gx-info">
          <span className="gx-box">
            <Icon name="mail" />
          </span>
          <div>
            <small>{t.mail}</small>
            <Opt value={email} editing={editing} edit={ed("basics.email", "text", "ایمیل")}>
              <a href={`mailto:${email}`} dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
                {email}
              </a>
            </Opt>
          </div>
        </div>
        <div className="gx-info">
          <span className="gx-box">
            <Icon name="phone" />
          </span>
          <div>
            <small>{t.phone}</small>
            <Opt value={b.phone} editing={editing} edit={ed("basics.phone", "text", "تلفن")}>
              <a href={`tel:${(b.phone ?? "").replace(/[^\d+]/g, "")}`} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                {b.phone}
              </a>
            </Opt>
          </div>
        </div>
        <div className="gx-info">
          <span className="gx-box">
            <Icon name="pin" />
          </span>
          <div>
            <small>{t.location}</small>
            <Opt value={ctx.data.site?.address || b.location} editing={editing} edit={ed("site.address", "text", "نشانی")}>
              <span {...ed("site.address", "text", "نشانی")}>{ctx.data.site?.address || b.location}</span>
            </Opt>
          </div>
        </div>
        <h3 className="gx-h3">{t.social}</h3>
        <Socials ctx={ctx} editing={editing} />
      </div>
      <Card className="gx-form" i={0}>
        <Hang />
        <h2>
          {t.lets} <em>{t.together}</em>
        </h2>
        {/* No server needed: the visitor's mail app opens with the message filled in. */}
        <form action={email ? `mailto:${email}` : undefined} method="post" encType="text/plain">
          <input name="name" placeholder={`${t.name} *`} required />
          <input name="email" type="email" placeholder={`${t.email} *`} required />
          <input name="subject" placeholder={`${t.subject} *`} required />
          <textarea name="message" rows={5} placeholder={`${t.message} *`} required />
          <button type="submit">{t.send}</button>
        </form>
      </Card>
    </div>
  );
}

/* ───────────── Example content ───────────── */

export function gridSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  const pictures = {
    aboutImage: sampleImage("grid-me", "png"),
    signatureImage: sampleImage("grid-sign", "png"),
    accentImage: sampleImage("grid-works", "png"),
  };
  if (locale !== "fa") return { ...base, site: { ...base.site, gallery: base.site?.gallery ?? [], ...pictures } };
  const projects: [string, string][] = [
    ["پویا", "طراحی وب"],
    ["استودیو هفت", "طراحی موبایل"],
    ["استودیو ریون", "برندینگ"],
    ["دیزل", "عکاسی"],
    ["زیردریایی", "طراحی موبایل"],
    ["هیدرا", "طراحی وب"],
  ];
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "آرمان رحیمی",
      jobTitle: "طراح وب",
      location: "تهران",
      email: "arman@example.com",
      summary:
        "طراح محصول و وب در تهران هستم و روی طراحی سایت، تصویرسازی و طراحی بصری تمرکز دارم. در این سال‌ها با تیم‌ها و صنعت‌های مختلفی کار کرده‌ام و تجربه‌ی متنوعی به دست آورده‌ام؛ از استارتاپ‌های کوچک تا شرکت‌های بزرگ.",
    },
    skills: [
      { id: "gs1", name: "عکاسی", level: 4, category: "تصویر", description: "عکاسی محصول و پرتره برای فروشگاه‌های اینترنتی و برندها؛ از نورپردازی و صحنه‌آرایی تا ویرایش نهایی، طوری که محصول شما بهترین جلوه را داشته باشد." },
      { id: "gs2", name: "طراحی وب", level: 5, category: "طراحی", description: "طراحی سایت‌های شیک و کاربردی که روی همه‌ی دستگاه‌ها درست نمایش داده می‌شوند و بازدیدکننده را راحت به هدفش می‌رسانند." },
      { id: "gs3", name: "برندینگ", level: 4, category: "طراحی", description: "ساختن هویت بصری برند: لوگو، رنگ‌ها، فونت‌ها و راهنمای استفاده، تا برند شما در همه‌جا یک‌دست و به‌یادماندنی دیده شود." },
      { id: "gs4", name: "توسعه", level: 4, category: "برنامه‌نویسی", description: "پیاده‌سازی طرح‌ها با کد تمیز و سریع؛ از سایت‌های معرفی تا پنل‌های مدیریتی، با تمرکز بر سرعت بارگذاری و سئو." },
    ],
    projects: projects.map(([title, role], k) => ({
      id: `gp${k + 1}`,
      title,
      role,
      url: `https://example.com/work-${k + 1}`,
      technologies: [],
      images: [sampleImage(`grid-p${k + 1}`)],
    })),
    site: {
      ...base.site,
      gallery: base.site?.gallery ?? [],
      ...pictures,
      tagline: "طراح وب ساکن تهران؛ عاشق جزئیات و سادگی.",
      bandText: "آخرین کارها و برگزیده‌ها",
      aboutText:
        "طراح محصول و وب در تهران هستم و روی طراحی سایت، تصویرسازی و طراحی بصری تمرکز دارم. در این سال‌ها با تیم‌ها و صنعت‌های مختلفی کار کرده‌ام و تجربه‌ی متنوعی به دست آورده‌ام.",
      address: "تهران، خیابان نمونه، پلاک ۲۲",
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
/* Page colors come from the theme (see palettes.ts for this template's designed ones). */
.gx { --gx-bg: var(--color-bg); --gx-card: var(--color-surface); --gx-card2: color-mix(in srgb, var(--color-text) 4%, var(--color-surface)); --gx-line: color-mix(in srgb, var(--color-text) 8%, transparent); --gx-ink: var(--color-text); --gx-mute: var(--color-muted); --gx-accent: var(--color-primary-read); --gx-deep: color-mix(in srgb, var(--color-bg) 55%, transparent);
  background: var(--gx-bg); color: var(--gx-ink); min-height: 100%; }
.gx a { color: inherit; }
.gx-empty { padding: 100px 20px; text-align: center; color: var(--gx-mute); }
.gx-main { width: min(1180px, 100% - 2 * clamp(14px, 4cqi, 48px)); margin: 0 auto; padding: clamp(24px, 5cqi, 60px) 0 40px; }

/* Header and footer */
.gx-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: min(1240px, 100% - 2 * clamp(14px, 4cqi, 48px)); margin: 0 auto; padding: 18px 0; }
.gx-logo { font-size: 1.6em; font-weight: 800; letter-spacing: -.02em; }
.gx-nav { display: flex; gap: clamp(14px, 3cqi, 36px); font-size: .95em; }
.gx-nav a { color: var(--gx-mute); transition: color .2s; }
.gx-nav a:hover, .gx-nav a[aria-current="page"] { color: var(--gx-ink); }
.gx-talk { padding: 10px 20px; border-radius: 12px; background: var(--color-raise); font-weight: 600; font-size: .92em; transition: background .2s; }
.gx-talk:hover { background: var(--color-raise-2); }
.gx-foot { display: grid; justify-items: center; gap: 20px; padding: 60px 20px 40px; color: var(--gx-mute); font-size: .85em; }
.gx-foot nav { display: flex; flex-wrap: wrap; justify-content: center; gap: 28px; }
.gx-foot p { margin: 0; }

/* Cards: soft gradient, inner glow, and a smooth "grow in" entrance.
   On load every card grows from a smaller size one after another (gx-pop). Where the browser
   supports scroll-linked animation, cards further down also grow in as they scroll into view
   (gx-view). The two use different properties (scale/opacity and transform/filter), so they add
   up instead of replacing each other: cards already on screen are not held back by the second. */
.gx-card { position: relative; border-radius: 26px; padding: clamp(16px, 2.4cqi, 28px); background: linear-gradient(140deg, var(--gx-card2), var(--gx-card) 60%); box-shadow: inset 0 1px 0 rgb(255 255 255 / .04), 0 20px 40px -30px rgb(0 0 0 / .55);
  transform-origin: 50% 70%;
  animation: gx-pop .9s cubic-bezier(.22, 1.2, .36, 1) calc(var(--i, 0) * 90ms) both;
  transition: translate .35s ease, box-shadow .35s ease; }
.gx-card:hover { translate: 0 -4px; box-shadow: inset 0 1px 0 rgb(255 255 255 / .06), 0 26px 50px -28px rgb(0 0 0 / .6); }
@keyframes gx-pop { from { opacity: 0; scale: .82; } to { opacity: 1; scale: 1; } }
@keyframes gx-view { from { filter: opacity(0) blur(6px); transform: scale(.86) translateY(40px); } to { filter: none; transform: none; } }
@supports (animation-timeline: view()) {
  .gx-card { animation: gx-pop .9s cubic-bezier(.22, 1.2, .36, 1) calc(var(--i, 0) * 90ms) both, gx-view linear both; animation-timeline: auto, view(); animation-range: normal, entry 0% entry 80%; }
}
.gx-fill { display: grid; height: 100%; gap: 14px; position: relative; }
.gx-label { display: grid; gap: 4px; align-self: end; }
.gx-label small { color: var(--gx-mute); font-size: .74em; letter-spacing: .04em; }
.gx-label strong { font-size: 1.15em; font-weight: 600; }
.gx-go { position: absolute; inset-block-end: 0; inset-inline-end: 0; width: 44px; height: 44px; display: grid; place-items: center; border: 1px solid color-mix(in srgb, var(--color-text) 25%, transparent); border-radius: 50%; transition: transform .4s ease, border-color .3s, background .3s; }
.gx-go svg { width: 16px; height: 16px; fill: currentColor; }
.gx-card:hover .gx-go { transform: rotate(90deg); border-color: var(--gx-ink); background: color-mix(in srgb, var(--color-text) 6%, transparent); }
.gx-go-edit { position: absolute; inset-block-end: 0; inset-inline-end: 0; width: 40px; height: 40px; }

/* Home grid */
.gx-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 18px; }
.gx-hero { grid-column: span 6; }
.gx-side { grid-column: span 6; display: grid; gap: 18px; grid-template-rows: auto 1fr; }
.gx-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.gx-grid > .gx-small { grid-column: span 3; }
.gx-grid > .gx-wide { grid-column: span 6; }
.gx-grid > .gx-small:nth-of-type(n) { min-height: 200px; }
.gx-stats { grid-column: span 6; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.gx-grid > .gx-together { grid-column: span 6; }
.gx-row { grid-template-columns: auto 1fr; align-items: center; gap: clamp(16px, 3cqi, 28px); }
.gx-photo { position: relative; width: clamp(130px, 18cqi, 200px); aspect-ratio: 1; border-radius: 22px; overflow: hidden; background: linear-gradient(140deg, var(--color-primary-tint), var(--color-primary)); }
.gx-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.gx-photo span { position: absolute; inset: 0; display: grid; place-items: center; font-size: 3em; font-weight: 800; color: #fff; }
.gx-intro { display: grid; gap: 8px; }
.gx-intro small { color: var(--gx-mute); font-size: .78em; }
.gx-intro h1 { font-size: clamp(1.6em, 3.6cqi, 2.4em); font-weight: 600; line-height: 1.3; }
.gx-intro p { color: var(--gx-mute); font-size: .9em; line-height: 1.9; max-width: 22em; }
.gx-marquee { padding: 14px 0; border-radius: 999px; overflow: hidden; }
.gx-track { display: flex; width: max-content; gap: 24px; animation: gx-slide 22s linear infinite; font-size: .78em; color: var(--gx-mute); white-space: nowrap; }
.gx-track i { font-style: normal; font-size: .6em; vertical-align: middle; margin-inline-start: 10px; opacity: .6; }
.gx[dir="rtl"] .gx-track { animation-name: gx-slide-rtl; }
@keyframes gx-slide { to { transform: translateX(-50%); } }
@keyframes gx-slide-rtl { to { transform: translateX(50%); } }
.gx-thumb { min-height: 110px; display: grid; place-items: center; border-radius: 16px; overflow: hidden; }
.gx-thumb img { max-width: 100%; max-height: 120px; object-fit: contain; transition: transform .5s ease; }
.gx-thumb img.gx-cover { width: 100%; height: 120px; max-height: none; object-fit: cover; border-radius: 14px; }
.gx-card:hover .gx-thumb img { transform: scale(1.05); }
.gx-inset { background: var(--gx-deep); box-shadow: inset 0 0 0 1px var(--gx-line); padding: 14px; }
.gx-icons { display: flex; justify-content: space-around; align-items: center; min-height: 120px; }
.gx-icons span { display: grid; place-items: center; transition: transform .3s ease; }
.gx-card:hover .gx-icons span { transform: translateY(-3px); }
.gx-icons .gx-ico { width: clamp(40px, 5cqi, 56px); height: clamp(40px, 5cqi, 56px); stroke-width: 1.5; }
.gx-ico { width: 30px; height: 30px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.gx-socials { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
.gx-socials a, .gx-socials .gx-ghost { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 50%; background: color-mix(in srgb, var(--color-text) 5%, transparent); box-shadow: inset 0 0 0 1px var(--gx-line); transition: background .2s, transform .2s; }
.gx-socials a:hover { background: color-mix(in srgb, var(--color-text) 10%, transparent); transform: translateY(-2px); }
.gx-socials .gx-ico { width: 22px; height: 22px; }
.gx-stats > div { display: grid; place-items: center; align-content: center; gap: 8px; padding: 18px 8px; border-radius: 18px; background: var(--gx-deep); text-align: center; }
.gx-stats b { font-size: clamp(1.8em, 3.4cqi, 2.4em); font-weight: 500; }
.gx-stats small { color: var(--gx-mute); font-size: .74em; line-height: 1.6; }
.gx-together h2, .gx-form h2 { font-size: clamp(1.8em, 4cqi, 2.6em); font-weight: 500; line-height: 1.35; align-self: end; }
.gx-together em, .gx-form em { font-style: normal; color: var(--gx-accent); }
.gx-together .gx-fill { min-height: 230px; }
.gx-together h2 { padding-top: 90px; }
.gx-form h2 { padding-top: 100px; }
.gx-fill > .gx-hang { top: calc(-1 * clamp(16px, 2.4cqi, 28px)); }
/* Hanging star: from the top edge of the card, like the reference. */
.gx-hang { position: absolute; top: 0; inset-inline-start: clamp(24px, 4cqi, 46px); width: 56px; height: 124px; pointer-events: none; transform-origin: 50% 0; animation: gx-sway 6s ease-in-out infinite; }
.gx-hang svg { width: 100%; height: 100%; fill: none; stroke: var(--color-muted); stroke-width: 1.6; stroke-linejoin: round; }
@keyframes gx-sway { 0%, 100% { rotate: -2deg; } 50% { rotate: 2deg; } }

/* Inner pages */
.gx-stack { display: grid; gap: 18px; align-content: start; }
.gx-title { display: flex; align-items: center; justify-content: center; gap: 14px; font-size: clamp(2em, 6cqi, 3.6em); font-weight: 800; line-height: 1.2; text-align: center; animation: gx-pop .9s cubic-bezier(.22, 1.2, .36, 1) both; }
.gx-burst { width: .62em; height: .62em; flex: none; fill: var(--color-muted); }
.gx-split { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 7fr); gap: 18px; }
.gx-photo-card .gx-photo { width: 100%; }
.gx-summary { padding-top: 130px; }
.gx-summary h2 { font-size: 1.6em; font-weight: 500; margin-bottom: 10px; }
.gx-text { display: grid; gap: 12px; color: var(--color-body); font-size: .92em; line-height: 2; }
.gx-two { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.gx-h3 { font-size: .95em; font-weight: 600; letter-spacing: .03em; margin-bottom: 12px; }
.gx-entry { display: grid; gap: 4px; margin-bottom: 20px; }
.gx-entry small { color: var(--gx-mute); font-size: .8em; }
.gx-entry strong { font-weight: 500; }
.gx-entry > span { color: var(--gx-mute); font-size: .82em; }
.gx-entry.wide { margin-bottom: 30px; }
.gx-accent { color: var(--gx-accent); }
.gx-row3 { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 18px; }
.gx-row3 .gx-small .gx-fill, .gx-row3 .gx-together .gx-fill { min-height: 180px; }

.gx-cv { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 7fr); gap: clamp(20px, 5cqi, 60px); align-items: start; }
.gx-cv aside { position: sticky; top: 20px; }
.gx-profile { display: grid; justify-items: center; gap: 12px; text-align: center; }
.gx-profile .gx-photo { width: 100%; }
.gx-profile h2 { font-size: 1.4em; font-weight: 500; margin-top: 8px; }
.gx-profile small { color: var(--gx-mute); }
.gx-profile .gx-socials a { width: 38px; height: 38px; }
.gx-profile .gx-socials .gx-ico { width: 17px; height: 17px; }
.gx-btn { width: 100%; padding: 12px; border-radius: 12px; background: var(--color-raise); font-weight: 600; transition: background .2s; }
.gx-btn:hover { background: var(--color-raise-2); }
.gx-cv-body { display: grid; gap: 40px; }
.gx-skills { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }

.gx-works { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 18px; align-items: stretch; }
.gx-col { display: flex; flex-direction: column; gap: 18px; }
.gx-works .gx-title { margin: 6px 0 4px; }
.gx-pairs { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; flex: 1; }
.gx-project { padding: 14px 14px 22px; display: flex; flex-direction: column; }
.gx-project .gx-fill { flex: 1; grid-template-rows: 1fr auto; gap: 18px; }
.gx-shot { position: relative; min-height: 0; aspect-ratio: 7 / 6; border-radius: 18px; overflow: hidden; background: linear-gradient(140deg, var(--color-primary-tint), var(--color-primary)); }
/* Side column: cards alternate short and tall, and the last one stretches to the bottom line. */
.gx-col:first-child .gx-project:nth-child(even) .gx-shot { aspect-ratio: 6 / 7; }
.gx-col:first-child .gx-project:last-child { flex: 1; }
.gx-col:first-child .gx-project:last-child .gx-shot { aspect-ratio: auto; min-height: 240px; }
.gx-shot img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .6s ease; }
.gx-card:hover .gx-shot img { transform: scale(1.05); }
.gx-shot span { position: absolute; inset: 0; display: grid; place-items: center; font-size: 3em; font-weight: 800; color: #fff; }
.gx-project .gx-label { padding-inline: 8px; padding-inline-end: 56px; }

/* Certificates: each one on a dark mat inside a card, so any paper colour fits the site. */
.gx-certs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.gx-cert { padding: 14px 14px 22px; }
.gx-cert .gx-fill { gap: 18px; }
.gx-mat { aspect-ratio: 4 / 3; display: flex; align-items: center; justify-content: center; padding: 18px; border-radius: 18px; background: radial-gradient(120% 90% at 50% 0%, var(--color-raise), var(--color-bg)); box-shadow: inset 0 0 0 1px var(--gx-line); overflow: hidden; }
.gx-mat img { display: block; min-width: 0; min-height: 0; max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 6px; box-shadow: 0 18px 30px -12px rgb(0 0 0 / .8); transform: rotate(-1.2deg); transition: transform .5s ease; }
.gx-cert:nth-child(even) .gx-mat img { transform: rotate(1.2deg); }
.gx-card.gx-cert:hover .gx-mat img { transform: rotate(0) scale(1.04); }
.gx-cert .gx-label { padding-inline: 8px; padding-inline-end: 60px; }
.gx-add { display: grid; place-items: center; align-content: center; gap: 10px; min-height: 260px; color: var(--gx-mute); border: 1px dashed color-mix(in srgb, var(--color-text) 20%, transparent); background: transparent; cursor: pointer; }
.gx-add span { font-size: 2.4em; line-height: 1; }

.gx-offer { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: 18px; }
.gx-offer-list { display: grid; align-content: space-around; gap: 30px; padding: 40px; }
.gx-offer-list > div { display: flex; align-items: center; gap: 22px; font-weight: 500; }
.gx-offer-list .gx-ico { width: 26px; height: 26px; }
.gx-offer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.gx-offer-item { display: grid; align-content: start; gap: 10px; padding: 22px; border-radius: 20px; background: linear-gradient(140deg, var(--color-raise), var(--color-soft)); }
.gx-offer-item small { color: var(--gx-mute); font-weight: 600; font-size: .82em; }
.gx-offer-item p { color: var(--color-body); font-size: .9em; line-height: 1.95; }

.gx-contact { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: clamp(20px, 5cqi, 60px); align-items: start; }
.gx-info { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 18px; }
.gx-info small { display: block; color: var(--gx-mute); font-size: .8em; margin-bottom: 4px; }
.gx-box { width: 50px; height: 50px; flex: none; display: grid; place-items: center; border-radius: 14px; background: linear-gradient(140deg, var(--gx-card2), var(--gx-card)); box-shadow: inset 0 0 0 1px var(--gx-line); }
.gx-box .gx-ico { width: 22px; height: 22px; }
.gx-form { padding: clamp(24px, 4cqi, 40px); }
.gx-form form { display: grid; gap: 12px; margin-top: 20px; }
.gx-form input, .gx-form textarea { width: 100%; padding: 14px 16px; border: none; border-radius: 12px; background: var(--color-raise); color: var(--gx-ink); font: inherit; font-size: .9em; }
.gx-form input::placeholder, .gx-form textarea::placeholder { color: var(--color-muted); }
.gx-form button { padding: 14px; border: none; border-radius: 12px; background: var(--color-raise-2); color: var(--gx-ink); font: inherit; font-weight: 600; cursor: pointer; transition: background .2s; }
.gx-form button:hover { background: color-mix(in srgb, var(--color-text) 26%, var(--color-surface)); }

.gx-ghost { display: inline-flex; align-items: center; justify-content: center; padding: 2px 10px; border: 1px dashed currentColor; border-radius: 999px; font-size: .8em; opacity: .7; }

@container (max-width: 900px) {
  .gx-grid > * { grid-column: 1 / -1 !important; }
  .gx-split, .gx-cv, .gx-offer, .gx-contact { grid-template-columns: 1fr; }
  .gx-cv aside { position: static; }
  .gx-works { grid-template-columns: 1fr; }
  .gx-works .gx-col:first-child { order: 2; }
  .gx-certs { grid-template-columns: 1fr 1fr; }
  .gx-row3 { grid-template-columns: 1fr; }
}
@container (max-width: 600px) {
  .gx-head { flex-wrap: wrap; }
  .gx-nav { order: 3; width: 100%; justify-content: space-between; }
  .gx-row { grid-template-columns: 1fr; padding-bottom: 54px; }
  .gx-pair, .gx-two, .gx-pairs, .gx-certs, .gx-offer-grid, .gx-skills { grid-template-columns: 1fr; }
  .gx-stats { grid-template-columns: repeat(3, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .gx-card, .gx-title, .gx-hang, .gx-track { animation: none; }
  .gx-card:hover { translate: none; }
  .gx-card:hover .gx-go { transform: none; }
}
`;
