/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Aseman" (sky): a calm one-page portfolio with a full-width picture header, two picture-and-text
// halves (work style, about me), a colored band and a dark four-column footer: skill details,
// skills list, projects and contact. Choosing a skill in the footer shows its description; this
// works without JavaScript (hidden radio buttons + CSS), so it also works on published pages.
// Projects are plain links to the projects themselves. Texts and pictures carry data-edit markers.

import { useId, type ReactNode } from "react";
import type { ResumeData } from "@rb/schema";
import { WebPage, webCtx, type Ctx } from "./kit";
import { linkLabel, safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";

/* ───────────── Pages ───────────── */

const projectsOf = (d: ResumeData) => d.projects.filter((p) => p.title.trim());

/** One page: projects in the footer are links to the projects themselves, not inner pages. */
export function asemanPages(): string[] {
  return ["/"];
}

/* ───────────── Texts ───────────── */

const TEXT = {
  fa: {
    intro: "معرفی",
    skills: "مهارت‌ها",
    home: "صفحه‌ی اصلی",
    styleTitle: "سبک کار من چه ویژگی‌هایی دارد؟",
    contactTitle: "راه ارتباط با من",
    contactText: "اگر دوست دارید با هم همکاری کنیم، راه‌های ارتباط با من را پایین همین صفحه پیدا می‌کنید.",
    description: "توضیحات",
    mySkills: "مهارت‌های من",
    myProjects: "پروژه‌های من",
    contactMe: "تماس با من",
    address: "نشانی",
    contactInfo: "راه‌های ارتباطی",
    phone: "تلفن",
    email: "ایمیل",
  },
  en: {
    intro: "Introduction",
    skills: "My skills",
    home: "Main page",
    styleTitle: "What are the characteristics of my work style?",
    contactTitle: "How to contact me",
    contactText: "If you would like to work together, you can find my contact details at the bottom of this page.",
    description: "Description",
    mySkills: "My skills",
    myProjects: "My projects",
    contactMe: "Contact me",
    address: "My address",
    contactInfo: "Contact information",
    phone: "phone",
    email: "email",
  },
};

/* ───────────── Click-to-edit markers ───────────── */

type EditKind = "text" | "multiline" | "image" | "url" | "period" | "tags" | "newlink";
type Edit = { "data-edit": string; "data-edit-kind": EditKind; "data-edit-label": string };
const ed = (path: string, kind: EditKind, label: string): Edit => ({ "data-edit": path, "data-edit-kind": kind, "data-edit-label": label });
const item = (list: string, id: string) => `${list}[${id}]`;

/** Shown when filled; while editing, an empty value becomes a small "+ label" button. */
function Opt({ value, editing, edit, children }: { value: unknown; editing: boolean; edit: Edit; children?: ReactNode }) {
  const filled = Array.isArray(value) ? value.some((v) => String(v).trim()) : Boolean(String(value ?? "").trim());
  if (filled) return <>{children}</>;
  return editing ? (
    <span className="as-ghost" {...edit}>
      + {edit["data-edit-label"]}
    </span>
  ) : null;
}

const paragraphs = (text: string) => text.split(/\n\s*\n|\n/).filter((p) => p.trim());

/* ───────────── Template ───────────── */

type Link = (path: string) => string;
type View = { ctx: Ctx; link: Link; editing: boolean };

export function AsemanPortfolio(props: TemplateProps) {
  const ctx = webCtx(props);
  const view: View = { ctx, link: props.link ?? ((p: string) => p), editing: Boolean(props.editing) };
  return (
    <WebPage ctx={ctx} className="as" css={css}>
      <Home {...view} />
    </WebPage>
  );
}

function PageLink({ to, link, className, children, edit }: { to: string; link: Link; className?: string; children: ReactNode; edit?: Edit }) {
  return (
    <a href={link(to)} data-page={to} className={className} {...edit}>
      {children}
    </a>
  );
}

function TopBar({ ctx, link, onDark }: View & { onDark: boolean }) {
  const t = TEXT[ctx.data.locale];
  return (
    <div className={`as-top${onDark ? " on-dark" : ""}`}>
      <PageLink to="/" link={link} className="as-brand">
        <span {...ed("basics.fullName", "text", "نام")}>{ctx.data.basics.fullName}</span>
      </PageLink>
      <nav className="as-nav">
        <a href="#intro">{t.intro}</a>
        <a href="#skills">{t.skills}</a>
        <PageLink to="/" link={link}>
          {t.home}
        </PageLink>
      </nav>
    </div>
  );
}

function Home(view: View) {
  const { ctx, editing } = view;
  const { data } = ctx;
  const t = TEXT[data.locale];
  const b = data.basics;
  const site = data.site;
  const hero = safeUrl(site?.heroImage);
  const tagline = site?.tagline?.trim() || b.jobTitle || "";
  const styleText = site?.styleText?.trim() || "";
  const aboutText = site?.aboutText?.trim() || b.summary?.trim() || "";

  return (
    <>
      <header className="as-hero" style={hero ? { backgroundImage: `url("${hero}")` } : undefined} {...ed("site.heroImage", "image", "تصویر بالای صفحه")}>
        <TopBar {...view} onDark />
        <div className="as-tagline">
          <span {...ed("site.tagline", "text", "جمله‌ی بالای صفحه")}>{tagline}</span>
        </div>
      </header>

      <section className="as-half" id="intro">
        <div className="as-text">
          <h2 {...ed("site.styleTitle", "text", "عنوان بخش سبک کار")}>{site?.styleTitle?.trim() || t.styleTitle}</h2>
          <Opt value={styleText} editing={editing} edit={ed("site.styleText", "multiline", "متن سبک کار")}>
            <div className="as-body" {...ed("site.styleText", "multiline", "متن سبک کار")}>
              {paragraphs(styleText).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Opt>
          <h2 {...ed("site.contactTitle", "text", "عنوان بخش ارتباط")}>{site?.contactTitle?.trim() || t.contactTitle}</h2>
          <p className="as-body" {...ed("site.contactText", "multiline", "متن بخش ارتباط")}>
            {site?.contactText?.trim() || t.contactText}
          </p>
        </div>
        <Picture src={site?.accentImage} edit={ed("site.accentImage", "image", "تصویر کنار متن")} />
      </section>

      <section className="as-half flip">
        <Picture src={site?.aboutImage || b.avatarUrl} edit={ed("site.aboutImage", "image", "عکس من")} />
        <div className="as-text">
          <h2 className="as-name" {...ed("basics.fullName", "text", "نام")}>
            {b.fullName}
          </h2>
          <Opt value={b.jobTitle} editing={editing} edit={ed("basics.jobTitle", "text", "عنوان شغلی")}>
            <em className="as-role" {...ed("basics.jobTitle", "text", "عنوان شغلی")}>
              {b.jobTitle}
            </em>
          </Opt>
          <Opt value={aboutText} editing={editing} edit={ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
            <div className="as-body" {...ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
              {paragraphs(aboutText).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Opt>
        </div>
      </section>

      <div className="as-band">
        <span {...ed("basics.jobTitle", "text", "عنوان شغلی")}>{b.jobTitle}</span>
        <Opt value={site?.bandText} editing={editing} edit={ed("site.bandText", "text", "جمله‌ی نوار رنگی")}>
          <span {...ed("site.bandText", "text", "جمله‌ی نوار رنگی")}>{site?.bandText}</span>
        </Opt>
      </div>

      <Footer {...view} />
    </>
  );
}

function Picture({ src, edit }: { src?: string; edit: Edit }) {
  const url = safeUrl(src);
  return (
    <div className="as-pic" {...edit}>
      {url && <img src={url} alt="" loading="lazy" />}
    </div>
  );
}

function Footer({ ctx, link, editing }: View) {
  const { data } = ctx;
  const t = TEXT[data.locale];
  const b = data.basics;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const skills = data.skills.filter((s) => s.name.trim());
  const projects = projectsOf(data);
  const links = b.links.filter((l) => safeUrl(l.url));

  // One hidden radio per skill; the checked one highlights its row and shows its description.
  const rules = skills
    .map(
      (_, i) =>
        `#${uid}-${i}:checked ~ .as-cols .as-d-${i}{display:grid}` +
        `#${uid}-${i}:checked ~ .as-cols label[for="${uid}-${i}"]{color:var(--color-primary-on-dark)}` +
        `#${uid}-${i}:checked ~ .as-cols label[for="${uid}-${i}"] svg{transform:rotate(var(--as-turn))}`,
    )
    .join("");

  return (
    <footer className="as-foot" id="skills">
      <style>{rules}</style>
      {skills.map((s, i) => (
        <input key={s.id} className="as-radio" type="radio" name={`${uid}-skill`} id={`${uid}-${i}`} defaultChecked={i === 0} />
      ))}
      <div className="as-cols">
        <div className="as-col">
          <h3>{t.description}</h3>
          {skills.map((s, i) => {
            const at = item("skills", s.id);
            return (
              <div key={s.id} className={`as-desc as-d-${i}`}>
                <strong {...ed(`${at}.name`, "text", "نام مهارت")}>{s.name}</strong>
                <Opt value={s.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیح مهارت")}>
                  <p {...ed(`${at}.description`, "multiline", "توضیح مهارت")}>{s.description}</p>
                </Opt>
              </div>
            );
          })}
        </div>

        <div className="as-col">
          <h3>{t.mySkills}</h3>
          <ul className="as-list">
            {skills.map((s, i) => (
              <li key={s.id}>
                <label htmlFor={`${uid}-${i}`}>
                  {s.name}
                  <Chevron />
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="as-col">
          <h3>{t.myProjects}</h3>
          <ul className="as-list">
            {projects.map((p) => {
              const at = item("projects", p.id);
              const href = safeUrl(p.url) ?? safeUrl(p.repoUrl);
              return (
                <li key={p.id}>
                  <a href={href ?? "#"} target={href ? "_blank" : undefined} rel="noopener noreferrer" {...ed(`${at}.url`, "url", "لینک پروژه")}>
                    <span {...ed(`${at}.title`, "text", "عنوان پروژه")}>{p.title}</span>
                    <Chevron />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="as-col">
          <h3>{t.contactMe}</h3>
          <Opt value={data.site?.address} editing={editing} edit={ed("site.address", "text", "نشانی")}>
            <small className="as-label">{t.address}</small>
            <p {...ed("site.address", "text", "نشانی")}>{data.site?.address}</p>
          </Opt>
          <small className="as-label">{t.contactInfo}</small>
          <div className="as-icons">
            {links.map((l) => (
              <a key={l.id} href={safeUrl(l.url)} target="_blank" rel="noopener noreferrer" title={linkLabel(l, data.locale)} aria-label={linkLabel(l, data.locale)} {...ed(`basics.links[${l.id}].url`, "url", linkLabel(l, data.locale))}>
                <Icon name={l.type} />
              </a>
            ))}
            {editing && (
              <span className="as-ghost" {...ed("basics.links", "newlink", "افزودن راه ارتباطی")}>
                +
              </span>
            )}
          </div>
          <Opt value={b.phone} editing={editing} edit={ed("basics.phone", "text", "تلفن")}>
            <p className="as-line">
              {t.phone}:{" "}
              <a href={`tel:${(b.phone ?? "").replace(/[^\d+]/g, "")}`} dir="ltr" {...ed("basics.phone", "text", "تلفن")}>
                {b.phone}
              </a>
            </p>
          </Opt>
          <Opt value={b.email} editing={editing} edit={ed("basics.email", "text", "ایمیل")}>
            <p className="as-line">
              {t.email}:{" "}
              <a href={`mailto:${b.email}`} dir="ltr" {...ed("basics.email", "text", "ایمیل")}>
                {b.email}
              </a>
            </p>
          </Opt>
          <Opt value={data.site?.contactNote} editing={editing} edit={ed("site.contactNote", "multiline", "یادداشت پایانی")}>
            <p className="as-note" {...ed("site.contactNote", "multiline", "یادداشت پایانی")}>
              {data.site?.contactNote}
            </p>
          </Opt>
        </div>
      </div>
    </footer>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

const ICONS: Record<string, string> = {
  whatsapp: "M4 20l1.5-4.5A8 8 0 1 1 8.5 18.5z M9 9.5c.5 2.5 2.5 4.5 5 5l1.5-1.5-2-1-1 1a5 5 0 0 1-2-2l1-1-1-2z",
  telegram: "M21 4L3 11l6 2 2 6 3-4 5 4z M9 13l8-6",
  instagram: "M5 5h14v14H5z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M16.5 7.5h.01",
  github: "M9 18l-6-6 6-6 M15 6l6 6-6 6",
  linkedin: "M5 5h14v14H5z M8 10v6 M8 7.5v.01 M11.5 16v-6 M11.5 12.5c0-1.5 1-2.5 2.5-2.5s2 1 2 2.5V16",
  website: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3a14 14 0 0 1 0 18 M12 3a14 14 0 0 0 0 18",
  other: "M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1 M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1",
};

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name] ?? ICONS.other} />
    </svg>
  );
}

/* ───────────── Example content ───────────── */

/** The template's own example persona and pictures, shown until the user adds their own. */
export function asemanSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  if (locale !== "fa") {
    return { ...base, site: { ...base.site, gallery: base.site?.gallery ?? [], heroImage: sampleImage("sky"), accentImage: sampleImage("canyon"), aboutImage: sampleImage("ali") } };
  }
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "علی عسگری",
      jobTitle: "توسعه‌دهنده‌ی فرانت‌اند",
      location: "کرمانشاه",
      summary:
        "سلام! من علی عسگری هستم، اهل کرمانشاه. از نوجوانی عاشق برنامه‌نویسی بودم و ساختن نرم‌افزار و حل مسئله‌های پیچیده با کد همیشه برایم جذاب بوده است.",
    },
    skills: [
      {
        id: "as1",
        name: "جاوااسکریپت",
        description:
          "به‌عنوان یک توسعه‌دهنده‌ی جاوااسکریپت، از انعطاف این زبان برای ساختن قابلیت‌های پیچیده در اپلیکیشن‌های وب استفاده می‌کنم. کار با DOM، برنامه‌نویسی ناهمزمان با Promise و async/await و امکانات مدرن زبان، بخش هر روزه‌ی کار من است. با الگوهای درست طراحی، مسئله‌ها را خلاقانه حل می‌کنم و با شناخت دقیق از عملکرد مرورگرها، مطمئن می‌شوم برنامه‌ها روی همه‌ی مرورگرها و دستگاه‌ها روان و سریع اجرا شوند.",
      },
      {
        id: "as2",
        name: "تایپ‌اسکریپت",
        description:
          "تایپ‌اسکریپت به من کمک می‌کند پروژه‌های بزرگ را امن‌تر و خواناتر بنویسم. با تعریف دقیق نوع داده‌ها، خطاها پیش از رسیدن به کاربر پیدا می‌شوند و همکاری در تیم ساده‌تر می‌شود. در پروژه‌هایم از نوع‌های عمومی، رابط‌های دقیق و بررسی سخت‌گیرانه استفاده می‌کنم تا کد سال‌ها قابل نگهداری بماند و تغییر دادنش بی‌دردسر باشد.",
      },
      {
        id: "as3",
        name: "نکست‌جی‌اس",
        description:
          "با نکست‌جی‌اس سایت‌هایی می‌سازم که هم سریع‌اند و هم برای موتورهای جست‌وجو بهینه. از صفحه‌های ساده‌ی معرفی تا فروشگاه‌های کامل، با رندر سمت سرور، تولید صفحه‌های ایستا و بهینه‌سازی تصویرها کار می‌کنم تا کاربر در کمترین زمان محتوا را ببیند و سایت در نتایج گوگل جایگاه بهتری بگیرد.",
      },
      {
        id: "as4",
        name: "ری‌اکت",
        description:
          "رابط‌های کاربری تعاملی و قابل نگهداری را با ری‌اکت طراحی می‌کنم. کامپوننت‌های قابل استفاده‌ی مجدد، مدیریت درست وضعیت و توجه به دسترس‌پذیری، اصول ثابت کار من است. هدفم این است که کاربر بدون فکر کردن به ظاهر برنامه، کارش را راحت انجام دهد و تیم هم بتواند سریع قابلیت تازه اضافه کند.",
      },
      {
        id: "as5",
        name: "نود‌جی‌اس",
        description:
          "سمت سرور را با نود‌جی‌اس می‌نویسم: ساختن API، اتصال به پایگاه داده، احراز هویت کاربران و پردازش پرداخت. تمرکزم روی امنیت، سرعت پاسخ و کدی است که با بزرگ شدن تعداد کاربران هم پایدار بماند.",
      },
      {
        id: "as6",
        name: "طراحی رابط کاربری",
        description:
          "پیش از نوشتن کد، ساختار صفحه‌ها و مسیر کاربر را طراحی می‌کنم. با ابزارهایی مثل فیگما نمونه‌ی اولیه می‌سازم، با کاربران واقعی امتحانش می‌کنم و جزئیات را آن‌قدر اصلاح می‌کنم تا تجربه‌ای ساده و دلنشین به دست بیاید.",
      },
    ],
    projects: [
      { id: "ap1", title: "پنل مدیریت فروشگاه", url: "https://example.com/shop-admin", technologies: [], images: [] },
      { id: "ap2", title: "کتابخانه‌ی کامپوننت", url: "https://example.com/components", technologies: [], images: [] },
      { id: "ap3", title: "اپلیکیشن کشف موسیقی", url: "https://example.com/music", technologies: [], images: [] },
      { id: "ap4", title: "سایت نمونه‌کار شخصی", url: "https://example.com/portfolio", technologies: [], images: [] },
      { id: "ap5", title: "سامانه‌ی نوبت‌دهی آنلاین", url: "https://example.com/booking", technologies: [], images: [] },
      { id: "ap6", title: "داشبورد گزارش فروش", url: "https://example.com/reports", technologies: [], images: [] },
    ],
    site: {
      ...base.site,
      gallery: base.site?.gallery ?? [],
      tagline: "با اشتیاق و پشتکار، عاشق حل مسئله",
      heroImage: sampleImage("sky"),
      accentImage: sampleImage("canyon"),
      aboutImage: sampleImage("ali"),
      styleText:
        "پشتکار قلب زندگی شخصی و حرفه‌ای من است. همین به من انگیزه می‌دهد که حتی در سختی‌ها هم با تعهد کامل دنبال هدف‌هایم بروم.\n\nعلاقه به برنامه‌نویسی باعث می‌شود همیشه یاد بگیرم و مسئله‌های پیچیده را حل کنم. از ساختن راه‌حل‌های خلاقانه و امتحان فناوری‌های تازه لذت می‌برم.\n\nبا حس مسئولیت و تجربه‌ای که دارم، خیالتان از پروژه راحت باشد؛ کیفیت و دقت در جزئیات برایم اولویت است.",
      aboutText:
        "سلام! من علی عسگری هستم، اهل کرمانشاه. از نوجوانی عاشق برنامه‌نویسی بودم و ایده‌ی ساختن نرم‌افزار و حل مسئله‌های پیچیده با کد همیشه برایم جذاب بوده است.\n\nخوشبختانه الان در همان حوزه‌ای کار می‌کنم که دوستش دارم و هر پروژه تجربه‌ی تازه‌ای به من اضافه می‌کند.\n\nخلاصه‌ی مهارت‌هایم را پایین همین صفحه می‌بینید و پروژه‌هایم را هم با جزئیات می‌توانید مرور کنید. از اینکه وقت گذاشتید ممنونم و منتظر همکاری با شما هستم!",
      bandText: "متخصص ساخت اپلیکیشن‌های وب با جاوااسکریپت",
      address: "کرمانشاه، خیابان نمونه، کوچه‌ی نمونه، پلاک ۱۰",
      contactNote: "لطفاً در ساعت کاری تماس بگیرید. ایمیل‌ها هر روز ساعت ۸ صبح بررسی می‌شوند. ممنون که وقت گذاشتید!",
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.as { --as-dark: #262626; --as-line: color-mix(in srgb, var(--color-primary) 70%, transparent); --as-turn: 90deg; background: var(--color-bg); }
.as[dir="ltr"] { --as-turn: -90deg; }
.as-empty { padding: 80px 20px; text-align: center; color: var(--color-muted); }

/* Picture header */
.as-hero { position: relative; display: grid; grid-template-rows: auto 1fr; min-height: clamp(420px, 55cqi, 640px); background: linear-gradient(160deg, #7FA6B6, #A9C4CF) center / cover no-repeat; color: #fff; }
.as-mini { background: var(--as-dark); color: #fff; }
.as-top { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: clamp(18px, 3cqi, 32px) clamp(20px, 4cqi, 40px); }
.as-brand { font-size: 1.15em; font-weight: 300; color: inherit; }
.as[dir="ltr"] .as-brand, .as[dir="ltr"] .as-nav a { text-transform: uppercase; letter-spacing: .3em; }
.as-nav { display: flex; flex-wrap: wrap; gap: clamp(16px, 4cqi, 56px); font-size: .92em; font-weight: 400; }
.as-nav a { color: inherit; opacity: .92; }
.as-nav a:hover { opacity: 1; }
.as-tagline { align-self: center; justify-self: center; margin-bottom: 40px; padding: 18px 28px; border-block: 1px solid rgb(255 255 255 / .7); font-size: clamp(1.05em, 2.2cqi, 1.35em); font-weight: 300; text-align: center; text-shadow: 0 1px 12px rgb(0 0 0 / .15); }

/* Picture and text halves; pictures run edge to edge */
.as-half { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.as-half.flip { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.as-text { display: grid; align-content: center; gap: 18px; padding: clamp(32px, 6cqi, 72px); }
.as-text h2 { padding-bottom: 14px; border-bottom: 1.5px solid var(--as-line); font-size: 1.1em; font-weight: 500; }
.as-text h2 + .as-body { margin-top: 4px; }
.as-body { display: grid; gap: 14px; color: var(--color-muted); font-size: .93em; line-height: 2.1; }
.as-name { border-bottom: none !important; padding-bottom: 0 !important; font-size: 1.15em !important; }
.as-role { margin-top: -12px; padding-bottom: 14px; border-bottom: 1.5px solid var(--as-line); color: var(--color-muted); font-size: .85em; }
.as-pic { position: relative; min-height: clamp(320px, 45cqi, 620px); background: linear-gradient(160deg, var(--color-primary-soft), var(--color-primary-tint)); overflow: hidden; }
.as-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* Colored band */
.as-band { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px 48px; padding: 22px 20px; background: var(--color-primary); color: var(--color-on-primary); font-size: .85em; font-weight: 500; text-align: center; }

/* Dark footer with four columns */
.as-foot { background: var(--as-dark); color: #E8E6E1; padding: clamp(40px, 7cqi, 80px) clamp(20px, 5cqi, 64px); }
.as-radio { display: none; }
.as-cols { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px; }
.as-col { display: grid; align-content: start; gap: 12px; font-size: .9em; }
.as-col h3 { padding-bottom: 16px; margin-bottom: 8px; border-bottom: 1px solid rgb(255 255 255 / .35); font-size: 1.2em; font-weight: 400; color: #fff; }
.as-desc { display: none; gap: 10px; }
.as-desc strong { color: var(--color-primary-on-dark); font-weight: 500; font-size: .95em; }
.as-desc p { line-height: 2; text-align: justify; color: #D8D6D0; }
.as-list { list-style: none; margin: 0; padding: 0; }
.as-list li { border-bottom: 1px solid rgb(255 255 255 / .35); }
.as-list label, .as-list a { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 16px 2px; color: #E8E6E1; cursor: pointer; transition: color .2s; }
.as-list label:hover, .as-list a:hover { color: var(--color-primary-on-dark); }
.as-list svg { width: 18px; height: 18px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; transition: transform .25s; }
.as-list a svg { transform: rotate(var(--as-turn)); }
.as-label { color: var(--color-primary-on-dark); font-size: .85em; }
.as-col p { margin: 0; line-height: 1.9; }
.as-icons { display: flex; flex-wrap: wrap; gap: 10px; }
.as-icons a { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid var(--color-primary-on-dark); border-radius: 50%; color: var(--color-primary-on-dark); }
.as-icons svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.as-line a { color: var(--color-primary-on-dark); }
.as-note { color: #D8D6D0; font-size: .92em; }


.as-ghost { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; padding: 2px 10px; border: 1px dashed currentColor; border-radius: 999px; font-size: .8em; opacity: .7; }

@container (max-width: 860px) {
  .as-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container (max-width: 640px) {
  .as-top { flex-direction: column; align-items: flex-start; }
  .as-half, .as-half.flip { grid-template-columns: 1fr; }
  .as-half.flip .as-pic { order: -1; }
  .as-half:not(.flip) .as-pic { order: -1; }
  .as-cols { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) { .as-list svg { transition: none; } }
`;
