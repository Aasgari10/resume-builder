/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Sepid" (white): a clean, airy portfolio with a fixed side column (photo, name, menu, social
// links) and one page per menu item: about (large photo, services, client words and logos),
// resume (timelines and skill bars), works (with category filters), gallery and contact.
// Pages and home sections can be switched off; every text and picture is editable in place.

import { useId, type CSSProperties, type ReactNode } from "react";
import type { ResumeData } from "@rb/schema";
import { WebPage, webCtx } from "./kit";
import { formatNumber, formatPeriod, safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { Icon, Opt, PageLink, Socials, ToPage, blockOn, ed, item, outside, pagesOf, paragraphs, partsCss, type View } from "./parts";
import { ZoomOpen } from "./zoom";

export const SEPID_OPTIONAL_PAGES = [
  { path: "/resume", label: "رزومه" },
  { path: "/works", label: "نمونه‌کارها" },
  { path: "/gallery", label: "گالری" },
  { path: "/contact", label: "تماس" },
] as const;

export const SEPID_BLOCKS = [
  { key: "services", label: "کارهایی که انجام می‌دهم" },
  { key: "testimonials", label: "نظر مشتری‌ها" },
  { key: "clients", label: "لوگوی مشتری‌ها" },
] as const;

export const sepidPages = (data: ResumeData) => pagesOf(data, SEPID_OPTIONAL_PAGES);

const MENU: Record<string, string> = { "/": "درباره‌ی من", "/resume": "رزومه", "/works": "نمونه‌کارها", "/gallery": "گالری", "/contact": "تماس" };

type SView = View & { pages: string[] };

export function SepidPortfolio(props: TemplateProps) {
  const ctx = webCtx(props);
  const pages = sepidPages(ctx.data);
  const view: SView = { ctx, link: props.link ?? ((p) => p), editing: Boolean(props.editing), pages };
  const page = pages.includes(props.page ?? "/") ? (props.page ?? "/") : "/";
  const at = pages.indexOf(page);
  return (
    <WebPage ctx={ctx} className="sp" css={partsCss + css}>
      <div className="sp-shell">
        <Side {...view} page={page} />
        <main className="sp-main" key={page}>
          {page === "/resume" ? <Resume {...view} /> : page === "/works" ? <Works {...view} /> : page === "/gallery" ? <Gallery {...view} /> : page === "/contact" ? <Contact {...view} /> : <About {...view} />}
          {pages.length > 1 && (
            <nav className="sp-arrows" aria-label="صفحه‌ی قبل و بعد">
              {at > 0 ? (
                <PageLink to={pages[at - 1]!} link={view.link}>
                  <Chevron back />
                </PageLink>
              ) : (
                <span />
              )}
              {at < pages.length - 1 ? (
                <PageLink to={pages[at + 1]!} link={view.link}>
                  <Chevron />
                </PageLink>
              ) : (
                <span />
              )}
            </nav>
          )}
        </main>
      </div>
    </WebPage>
  );
}

function Chevron({ back }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`sp-chev${back ? " back" : ""}`} aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function Side({ ctx, editing, link, pages, page }: SView & { page: string }) {
  const b = ctx.data.basics;
  const photo = safeUrl(b.avatarUrl);
  return (
    <aside className="sp-side">
      <div className="sp-avatar" {...ed("basics.avatarUrl", "image", "عکس پروفایل")}>
        {photo ? <img src={photo} alt={b.fullName} /> : <span>{b.fullName.charAt(0)}</span>}
      </div>
      <h2 className="sp-side-name" {...ed("basics.fullName", "text", "نام")}>
        {b.fullName}
      </h2>
      <nav className="sp-menu">
        {pages.map((p) => (
          <PageLink key={p} to={p} link={link} current={p === page}>
            {MENU[p]}
          </PageLink>
        ))}
      </nav>
      <Socials ctx={ctx} editing={editing} className="sp-socials" />
      <small className="sp-copy">© {b.fullName}، همه‌ی حقوق محفوظ است.</small>
    </aside>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3 className="sp-h3">
      <span>{children}</span>
    </h3>
  );
}

function PageTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <header className="sp-title">
      <h1>{title}</h1>
      <small>{sub}</small>
    </header>
  );
}

/* ───────────── About ───────────── */

const SERVICE_ICONS: Record<string, string> = {
  shop: "M3 9l2-5h14l2 5 M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z M5 13v7h14v-7 M9 20v-4h6v4",
  pen: "M4 20l1-5L16 4l4 4L9 19z M14 6l4 4",
  devices: "M3 16V6h14v10z M1 19h18 M20 9h3v11h-5V9z",
  flag: "M5 21V4 M5 4c4-2 7 2 11 0 2-1 3-1 4-1v9c-1 0-2 0-4 1-4 2-7-2-11 0",
};
const SERVICE_KEYS = ["shop", "pen", "devices", "flag"];

function About(view: SView) {
  const { ctx, editing, link, pages } = view;
  const { data } = ctx;
  const site = data.site;
  const photo = safeUrl(site?.aboutImage || data.basics.avatarUrl);
  const text = site?.aboutText?.trim() || data.basics.summary?.trim() || "";
  const services = data.skills.filter((s) => s.name.trim() && s.description?.trim()).slice(0, 4);
  const testimonials = site?.testimonials ?? [];
  const clients = (site?.clients ?? []).filter((c) => safeUrl(c.image));
  return (
    <>
      <section className="sp-hero">
        <div className="sp-hero-pic" {...ed("site.aboutImage", "image", "عکس بزرگ")}>
          {photo && <img src={photo} alt={data.basics.fullName} />}
        </div>
        <div className="sp-hero-text">
          <Opt value={data.basics.jobTitle} editing={editing} edit={ed("basics.jobTitle", "text", "عنوان شغلی")}>
            <small {...ed("basics.jobTitle", "text", "عنوان شغلی")}>{data.basics.jobTitle}</small>
          </Opt>
          <h1 {...ed("basics.fullName", "text", "نام")}>{data.basics.fullName}</h1>
          <Opt value={text} editing={editing} edit={ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
            <div className="sp-text" {...ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
              {paragraphs(text).map((p, k) => (
                <p key={k}>{p}</p>
              ))}
            </div>
          </Opt>
          <ToPage pages={pages} to="/resume" link={link} className="sp-btn">
            مشاهده‌ی رزومه
          </ToPage>
        </div>
      </section>

      <div className="sp-pad">
        {blockOn(data, "services") && services.length > 0 && (
          <section className="sp-sec">
            <Heading>کارهایی که انجام می‌دهم</Heading>
            <div className="sp-services">
              {services.map((s, k) => (
                <div key={s.id} className="sp-service" style={{ "--i": k } as CSSProperties}>
                  <svg viewBox="0 0 24 24" className="sp-sico" aria-hidden="true">
                    <path d={SERVICE_ICONS[SERVICE_KEYS[k % 4]!]} />
                  </svg>
                  <div>
                    <h4 {...ed(`${item("skills", s.id)}.name`, "text", "عنوان خدمت")}>{s.name}</h4>
                    <p {...ed(`${item("skills", s.id)}.description`, "multiline", "توضیح خدمت")}>{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {blockOn(data, "testimonials") && testimonials.length > 0 && (
          <section className="sp-sec">
            <Heading>نظر مشتری‌ها</Heading>
            <div className="sp-quotes">
              {testimonials.map((t) => {
                const at = item("site.testimonials", t.id);
                const pic = safeUrl(t.image);
                return (
                  <figure key={t.id} className="sp-quote">
                    <blockquote {...ed(`${at}.text`, "multiline", "متن نظر")}>{t.text}</blockquote>
                    <figcaption>
                      <span className="sp-quote-pic" {...ed(`${at}.image`, "image", "عکس مشتری")}>
                        {pic ? <img src={pic} alt={t.name} loading="lazy" /> : <b>{t.name.charAt(0)}</b>}
                      </span>
                      <span>
                        <strong {...ed(`${at}.name`, "text", "نام مشتری")}>{t.name}</strong>
                        <Opt value={t.role} editing={editing} edit={ed(`${at}.role`, "text", "سمت یا شرکت")}>
                          <small {...ed(`${at}.role`, "text", "سمت یا شرکت")}>{t.role}</small>
                        </Opt>
                      </span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </section>
        )}

        {blockOn(data, "clients") && (clients.length > 0 || editing) && (
          <section className="sp-sec">
            <Heading>مشتری‌ها</Heading>
            <div className="sp-clients">
              {clients.map((c) => (
                <span key={c.id} className="sp-client" title={c.name} {...ed(`${item("site.clients", c.id)}.image`, "image", `لوگوی ${c.name}`)}>
                  <img src={safeUrl(c.image)} alt={c.name} loading="lazy" />
                </span>
              ))}
              {editing && (
                <span className="sp-client sp-add" {...ed("site.clients", "newimage", "افزودن لوگو")}>
                  + لوگو
                </span>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/* ───────────── Resume ───────────── */

function Resume({ ctx, editing, link, pages }: SView) {
  const { data } = ctx;
  const fmt = ctx.theme.display.dateFormat;
  const startYears = data.experience.map((x) => Number(x.period.start.slice(0, 4))).filter(Boolean);
  const years = startYears.length ? new Date().getFullYear() - Math.min(...startYears) : 0;
  // Skills grouped by category, like "Design skills" and "Coding skills".
  const groups = new Map<string, ResumeData["skills"]>();
  for (const s of data.skills.filter((s) => s.name.trim())) {
    const key = s.category?.trim() || "مهارت‌ها";
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  const line = (key: string, rows: { id: string; date: string; dateEdit: string; place: string; placeEdit: string; title: string; titleEdit: string; text?: string; textEdit: string }[]) => (
    <div className="sp-tl" key={key}>
      {rows.map((r) => (
        <div key={r.id} className="sp-tl-row">
          <div className="sp-tl-when">
            <b {...ed(r.dateEdit, "period", "تاریخ")}>{r.date}</b>
            <small {...ed(r.placeEdit, "text", "محل")}>{r.place}</small>
          </div>
          <span className="sp-tl-mid" aria-hidden="true">
            <i />
          </span>
          <div className="sp-tl-what">
            <h4 {...ed(r.titleEdit, "text", "عنوان")}>{r.title}</h4>
            <Opt value={r.text} editing={editing} edit={ed(r.textEdit, "multiline", "توضیحات")}>
              <p {...ed(r.textEdit, "multiline", "توضیحات")}>{r.text}</p>
            </Opt>
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="sp-pad">
      <PageTitle title="رزومه" sub={years > 0 ? `${formatNumber(years, data.locale)} سال تجربه` : "سوابق من"} />
      <div className="sp-resume">
        <div>
          {data.education.length > 0 && (
            <section className="sp-sec">
              <Heading>تحصیلات</Heading>
              {line(
                "edu",
                data.education.map((x) => {
                  const at = item("education", x.id);
                  return {
                    id: x.id,
                    date: formatPeriod(x.period, data.locale, fmt),
                    dateEdit: `${at}.period`,
                    place: x.institution,
                    placeEdit: `${at}.institution`,
                    title: [x.degree, x.field].filter(Boolean).join("، ") || x.institution,
                    titleEdit: `${at}.degree`,
                    text: x.description,
                    textEdit: `${at}.description`,
                  };
                }),
              )}
            </section>
          )}
          {data.experience.length > 0 && (
            <section className="sp-sec">
              <Heading>سوابق کاری</Heading>
              {line(
                "exp",
                data.experience.map((x) => {
                  const at = item("experience", x.id);
                  return {
                    id: x.id,
                    date: formatPeriod(x.period, data.locale, fmt),
                    dateEdit: `${at}.period`,
                    place: x.company,
                    placeEdit: `${at}.company`,
                    title: x.position,
                    titleEdit: `${at}.position`,
                    text: x.description,
                    textEdit: `${at}.description`,
                  };
                }),
              )}
            </section>
          )}
          <ToPage pages={pages} to="/contact" link={link} className="sp-btn">
            همکاری کنیم
          </ToPage>
        </div>
        <div>
          {[...groups].map(([name, skills]) => (
            <section key={name} className="sp-sec">
              <Heading>{name === "مهارت‌ها" ? name : `مهارت‌های ${name}`}</Heading>
              <div className="sp-bars">
                {skills.map((s) => {
                  const pct = (s.level ?? 3) * 20;
                  return (
                    <div key={s.id}>
                      <span>
                        <b {...ed(`${item("skills", s.id)}.name`, "text", "مهارت")}>{s.name}</b>
                        <small>{formatNumber(pct, data.locale)}٪</small>
                      </span>
                      <i style={{ "--w": `${pct}%` } as CSSProperties} />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────── Works ───────────── */

function Works({ ctx, editing }: SView) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const items = ctx.data.projects.filter((p) => p.title.trim());
  const cats = [...new Set(items.map((p) => p.role?.trim()).filter((c): c is string => Boolean(c)))];
  // Filters work without scripts: one hidden radio per category, and CSS hides the other works.
  const rules = cats
    .map(
      (_, k) =>
        `#${uid}-${k + 1}:checked ~ .sp-works .sp-work:not([data-cat="${k + 1}"]) { display: none; } #${uid}-${k + 1}:checked ~ .sp-filters label[for="${uid}-${k + 1}"] { border-color: var(--color-primary); color: var(--color-text); }`,
    )
    .join("\n");
  return (
    <div className="sp-pad">
      <PageTitle title="نمونه‌کارها" sub="کارهای من" />
      <style>{`#${uid}-0:checked ~ .sp-filters label[for="${uid}-0"] { border-color: var(--color-primary); color: var(--color-text); }\n${rules}`}</style>
      <input type="radio" name={uid} id={`${uid}-0`} className="sp-radio" defaultChecked />
      {cats.map((_, k) => (
        <input key={k} type="radio" name={uid} id={`${uid}-${k + 1}`} className="sp-radio" />
      ))}
      {cats.length > 1 && (
        <div className="sp-filters">
          <label htmlFor={`${uid}-0`}>همه</label>
          {cats.map((c, k) => (
            <label key={c} htmlFor={`${uid}-${k + 1}`}>
              {c}
            </label>
          ))}
        </div>
      )}
      <div className="sp-works">
        {items.map((p, k) => {
          const at = item("projects", p.id);
          const href = safeUrl(p.url) ?? safeUrl(p.repoUrl);
          const img = safeUrl(p.images[0]);
          const cat = p.role?.trim() ? cats.indexOf(p.role.trim()) + 1 : 0;
          return (
            <a key={p.id} href={href ?? "#"} {...outside(href)} className="sp-work" data-cat={cat} style={{ "--i": k } as CSSProperties}>
              <span className="sp-work-pic" {...ed(`${at}.images.0`, "image", "تصویر پروژه")}>
                {img ? <img src={img} alt={p.title} loading="lazy" /> : <b>{p.title.charAt(0)}</b>}
              </span>
              <strong className="sp-work-title" {...ed(`${at}.title`, "text", "عنوان پروژه")}>
                {p.title}
              </strong>
              <Opt value={p.role} editing={editing} edit={ed(`${at}.role`, "text", "دسته")}>
                <small className="sp-work-cat" {...ed(`${at}.role`, "text", "دسته")}>
                  {p.role}
                </small>
              </Opt>
              <span className="sp-work-ico">
                <Icon name="arrow" />
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────── Gallery ───────────── */

function Gallery({ ctx, editing }: SView) {
  const items = (ctx.data.site?.gallery ?? []).filter((g) => safeUrl(g.image));
  return (
    <div className="sp-pad">
      <PageTitle title="گالری" sub="تصویرها و مدارک" />
      <div className="sp-posts">
        {items.map((g, k) => {
          const at = item("site.gallery", g.id);
          return (
            <ZoomOpen key={g.id} id={g.id} className="sp-post" style={{ "--i": k } as CSSProperties}>
              <span className="sp-post-pic" {...ed(`${at}.image`, "image", "تصویر")}>
                <img src={safeUrl(g.image)} alt={g.title} loading="lazy" />
              </span>
              <span className="sp-post-text">
                <Opt value={g.description} editing={editing} edit={ed(`${at}.description`, "text", "توضیح کوتاه")}>
                  <small {...ed(`${at}.description`, "text", "توضیح کوتاه")}>{g.description}</small>
                </Opt>
                <strong {...ed(`${at}.title`, "text", "عنوان")}>{g.title}</strong>
              </span>
            </ZoomOpen>
          );
        })}
        {editing && (
          <span className="sp-post sp-add" {...ed("site.gallery", "newimage", "افزودن تصویر")}>
            + افزودن تصویر یا مدرک
          </span>
        )}
      </div>
    </div>
  );
}

/* ───────────── Contact ───────────── */

function Contact({ ctx, editing }: SView) {
  const b = ctx.data.basics;
  const site = ctx.data.site;
  const banner = safeUrl(site?.accentImage);
  const email = b.email?.trim();
  const boxes: { icon: string; value?: string; path: string; label: string; href?: string }[] = [
    { icon: "phone", value: b.phone, path: "basics.phone", label: "تلفن", href: b.phone ? `tel:${b.phone.replace(/[^\d+]/g, "")}` : undefined },
    { icon: "pin", value: site?.address || b.location, path: "site.address", label: "نشانی" },
    { icon: "mail", value: email, path: "basics.email", label: "ایمیل", href: email ? `mailto:${email}` : undefined },
    { icon: "check", value: site?.contactNote, path: "site.contactNote", label: "وضعیت همکاری" },
  ];
  return (
    <div className="sp-pad">
      <PageTitle title="تماس" sub="در ارتباط باشیم" />
      <Opt value={banner} editing={editing} edit={ed("site.accentImage", "image", "تصویر بالای صفحه‌ی تماس")}>
        <div className="sp-banner" {...ed("site.accentImage", "image", "تصویر بالای صفحه‌ی تماس")}>
          {banner && <img src={banner} alt="" />}
        </div>
      </Opt>
      <div className="sp-boxes">
        {boxes.map((x) => (
          <div key={x.path} className="sp-box">
            {x.icon === "check" ? (
              <svg viewBox="0 0 24 24" className="sp-sico" aria-hidden="true">
                <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M8 12l3 3 5-6" />
              </svg>
            ) : (
              <Icon name={x.icon} className="sp-sico" />
            )}
            <Opt value={x.value} editing={editing} edit={ed(x.path, "text", x.label)}>
              {x.href ? (
                <a href={x.href} dir="auto" {...ed(x.path, "text", x.label)}>
                  {x.value}
                </a>
              ) : (
                <strong {...ed(x.path, "text", x.label)}>{x.value}</strong>
              )}
            </Opt>
          </div>
        ))}
      </div>
      <section className="sp-sec sp-form-wrap">
        <Heading>چطور می‌توانم کمکتان کنم؟</Heading>
        {/* No server needed: the visitor's mail app opens with the message filled in. */}
        <form className="sp-form" action={email ? `mailto:${email}` : undefined} method="post" encType="text/plain">
          <div>
            <input name="name" placeholder="نام و نام خانوادگی" required />
            <input name="email" type="email" placeholder="ایمیل" required />
            <input name="subject" placeholder="موضوع" required />
          </div>
          <textarea name="message" placeholder="پیام شما" required />
          <button type="submit" className="sp-btn">
            ارسال پیام
          </button>
        </form>
      </section>
    </div>
  );
}

/* ───────────── Example content ───────────── */

export function sepidSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  if (locale !== "fa") return base;
  const lorem =
    "طراحی را با شناخت کاربر شروع می‌کنم و تا جزئیات آخر کنار تیم می‌مانم؛ نتیجه، محصولی است که هم زیباست و هم راحت کار می‌کند.";
  return {
    ...base,
    basics: {
      ...base.basics,
      fullName: "کیان مهرزاد",
      jobTitle: "طراح وب",
      email: "kian@example.com",
      phone: "0912 000 0000",
      location: "تهران",
      avatarUrl: sampleImage("sepid-avatar"),
      summary:
        "طراح وب و رابط کاربری هستم و بیش از هفت سال است برای برندها و استارتاپ‌ها سایت و اپلیکیشن طراحی می‌کنم. به سادگی، نظم و جزئیات دقیق باور دارم.",
    },
    experience: [
      { id: "se1", position: "طراح ارشد رابط کاربری", company: "شرکت نوآوران", period: { start: "2019-03", current: true }, description: "رهبری تیم طراحی محصول، ساخت سیستم طراحی و همکاری نزدیک با تیم‌های فنی برای عرضه‌ی نسخه‌های تازه.", highlights: [] },
      { id: "se2", position: "طراح رابط کاربری", company: "استودیو رنگ", period: { start: "2016-06", end: "2019-02", current: false }, description: "طراحی سایت و اپلیکیشن برای بیش از سی مشتری، از فروشگاه‌های اینترنتی تا سامانه‌های سازمانی.", highlights: [] },
      { id: "se3", position: "طراح وب", company: "آژانس خلاق", period: { start: "2014-09", end: "2016-05", current: false }, description: "طراحی صفحه‌های فرود، بنرها و هویت بصری کمپین‌های تبلیغاتی.", highlights: [] },
    ],
    education: [
      { id: "sd1", institution: "دانشگاه هنر تهران", degree: "کارشناسی ارشد", field: "ارتباط تصویری", period: { start: "2012-09", end: "2014-07", current: false }, description: "پایان‌نامه درباره‌ی نقش تایپوگرافی در خوانایی صفحه‌های وب." },
      { id: "sd2", institution: "دانشگاه هنر تهران", degree: "کارشناسی", field: "گرافیک", period: { start: "2008-09", end: "2012-07", current: false }, description: "آشنایی با اصول طراحی، رنگ و ترکیب‌بندی و شروع کار حرفه‌ای در کنار درس." },
    ],
    skills: [
      { id: "ss1", name: "فروشگاه اینترنتی", category: "طراحی", level: 5, description: "طراحی فروشگاه‌هایی که خرید را ساده می‌کنند؛ از صفحه‌ی محصول تا سبد خرید و پرداخت. " + lorem },
      { id: "ss2", name: "تولید محتوا", category: "طراحی", level: 3, description: "نوشتن متن‌های کوتاه و روشن برای سایت و شبکه‌های اجتماعی که پیام برند را درست برسانند." },
      { id: "ss3", name: "طراحی وب", category: "طراحی", level: 5, description: "سایت‌هایی که روی همه‌ی دستگاه‌ها زیبا و سریع دیده می‌شوند و بازدیدکننده را به هدفش می‌رسانند." },
      { id: "ss4", name: "مدیریت پروژه", category: "طراحی", level: 4, description: "برنامه‌ریزی، تقسیم کار و پیگیری تا تحویل به‌موقع؛ با گزارش‌های منظم به مشتری." },
      { id: "ss5", name: "جاوااسکریپت", category: "کدنویسی", level: 4 },
      { id: "ss6", name: "پی‌اچ‌پی", category: "کدنویسی", level: 3 },
      { id: "ss7", name: "اچ‌تی‌ام‌ال و سی‌اس‌اس", category: "کدنویسی", level: 5 },
      { id: "ss8", name: "وردپرس", category: "کدنویسی", level: 4 },
    ],
    projects: [
      ["پروژه‌ی میز کار", "مدیا"],
      ["اتاق جلسه", "ماکاپ"],
      ["گوشه‌ی دنج", "مدیا"],
      ["کافه‌ی سفید", "ماکاپ"],
      ["خانه‌ی مدرن", "ویدیو"],
      ["دفتر کار", "مدیا"],
    ].map(([title, role], k) => ({ id: `sp${k + 1}`, title: title!, role, url: `https://example.com/work-${k + 1}`, technologies: [], images: [sampleImage(`sepid-p${k + 1}`)] })),
    site: {
      ...base.site,
      aboutImage: sampleImage("sepid-me"),
      accentImage: sampleImage("sepid-g2"),
      aboutText:
        "طراح وب و رابط کاربری هستم و بیش از هفت سال است برای برندها و استارتاپ‌ها سایت و اپلیکیشن طراحی می‌کنم. کار را با شنیدن شروع می‌کنم: کسب‌وکار شما چه می‌خواهد و مشتری‌هایتان دنبال چه هستند.\n\nبه سادگی، نظم و جزئیات دقیق باور دارم. هر طرح را آن‌قدر می‌آزمایم که هم زیبا باشد و هم بی‌دردسر کار کند؛ از اولین طرح خام تا روزی که سایت منتشر می‌شود کنارتان هستم.",
      address: "تهران",
      contactNote: "آماده‌ی همکاری",
      gallery: [
        ["سفر به کوهستان", "اردیبهشت ۱۴۰۳"],
        ["کوچه‌های قدیمی", "خرداد ۱۴۰۳"],
        ["آماده‌ی سفر", "تیر ۱۴۰۳"],
        ["میز کار من", "مرداد ۱۴۰۳"],
        ["جاده‌ی بی‌انتها", "شهریور ۱۴۰۳"],
        ["شلوغی شهر", "مهر ۱۴۰۳"],
      ].map(([title, description], k) => ({ id: `sg${k + 1}`, title: title!, description, image: sampleImage(`sepid-g${k + 1}`) })),
      testimonials: [
        { id: "st1", name: "رضا کامرانی", role: "فروشگاه لوازم ورزشی", text: "از اولین جلسه معلوم بود کارش را بلد است. سایت فروشگاه ما حالا هم زیباتر است و هم فروشش بیشتر شده.", image: sampleImage("sepid-t1") },
        { id: "st2", name: "دانیال پرنیان", role: "استارتاپ رعد", text: "دقیق، خوش‌قول و صبور. هر تغییری خواستیم با حوصله انجام داد و نتیجه از انتظارمان بهتر شد.", image: sampleImage("sepid-t2") },
        { id: "st3", name: "سینا افشار", role: "آژانس سفر", text: "طراحی سایت ما را طوری انجام داد که مشتری‌ها راحت تور مورد نظرشان را پیدا می‌کنند. حتماً دوباره با او کار می‌کنیم.", image: sampleImage("sepid-t3") },
      ],
      clients: ["Less", "Adobe", "GitHub", "Spotify", "Envato", "WordPress", "Client"].map((name, k) => ({ id: `sc${k + 1}`, name, image: sampleImage(`sepid-c${k + 1}`, "png") })),
    },
  };
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
.sp { --sp-line: var(--color-line); --sp-side: 240px; background: var(--color-bg); color: var(--color-text); min-height: 100%; }
.sp a { color: inherit; }
/* The side column's white band, hairline and soft strip run the full page height. */
.sp-shell { display: grid; grid-template-columns: var(--sp-side) minmax(0, 1fr); min-height: 100%;
  background: linear-gradient(to right, var(--color-bg) var(--sp-side), var(--sp-line) var(--sp-side) calc(var(--sp-side) + 1px), var(--color-soft) calc(var(--sp-side) + 1px) calc(var(--sp-side) + 13px), transparent calc(var(--sp-side) + 13px)); }
.sp[dir="rtl"] .sp-shell { background-image: linear-gradient(to left, var(--color-bg) var(--sp-side), var(--sp-line) var(--sp-side) calc(var(--sp-side) + 1px), var(--color-soft) calc(var(--sp-side) + 1px) calc(var(--sp-side) + 13px), transparent calc(var(--sp-side) + 13px)); }
.sp h1, .sp h2, .sp h3, .sp h4, .sp p, .sp blockquote { margin-block: 0; }

/* Side column */
.sp-side { position: sticky; top: 0; align-self: start; display: grid; justify-items: center; gap: 18px; padding: 44px 0 30px; background: var(--color-bg); z-index: 2; animation: sp-in .7s ease backwards; }
.sp-avatar { width: 120px; height: 120px; overflow: hidden; background: var(--color-soft); }
.sp-avatar img { width: 100%; height: 100%; object-fit: cover; }
.sp-avatar span { display: grid; place-items: center; height: 100%; font-size: 3em; font-weight: 700; color: var(--color-muted); }
.sp-side-name { max-width: 9em; text-align: center; font-size: 1.9em; font-weight: 600; line-height: 1.3; }
.sp-menu { width: 100%; display: grid; margin-top: 30px; border-top: 1px solid var(--sp-line); }
.sp-menu a { position: relative; padding: 22px 10px; text-align: center; border-bottom: 1px solid var(--sp-line); font-size: 1.05em; transition: background .25s, color .25s; }
.sp-menu a::after { content: ""; position: absolute; inset-block: 0; inset-inline-end: 0; width: 2px; background: var(--color-primary); transform: scaleY(0); transition: transform .3s; }
.sp-menu a:hover { background: var(--color-soft); }
.sp-menu a[aria-current="page"] { background: var(--color-soft); color: var(--color-muted); }
.sp-menu a[aria-current="page"]::after { transform: none; }
.sp-socials { justify-content: center; gap: 10px; margin-top: 30px; }
.sp-socials a, .sp-socials .p-ghost { width: 42px; height: 42px; border-radius: 0; background: var(--color-raise); color: var(--color-muted); }
.sp-socials a:hover { background: var(--color-primary); color: var(--color-on-primary); }
.sp-copy { max-width: 12em; text-align: center; color: var(--color-muted); font-size: .8em; line-height: 1.6; }

/* Shared */
.sp-main { position: relative; min-width: 0; padding-bottom: 90px; }
.sp-main > * { animation: sp-in .8s cubic-bezier(.2, 1, .3, 1) backwards; }
.sp-main > :nth-child(2) { animation-delay: .1s; }
@keyframes sp-in { from { opacity: 0; transform: translateY(30px); } }
.sp-pad { padding: clamp(36px, 6cqi, 80px) clamp(18px, 6cqi, 110px) 0; }
.sp-title { display: grid; margin-bottom: 40px; }
.sp-title h1 { padding-bottom: 14px; border-bottom: 2px solid var(--sp-line); font-size: clamp(2em, 4.4cqi, 2.8em); font-weight: 600; }
.sp-title small { justify-self: end; margin-top: 12px; color: var(--color-muted); font-size: 1.05em; }
.sp-h3 { margin-bottom: 32px; font-size: 1.6em; font-weight: 600; }
.sp-h3 span { display: inline-block; padding-bottom: 4px; border-bottom: 2px solid var(--color-primary); }
.sp-sec { margin-bottom: clamp(44px, 7cqi, 80px); }
.sp-btn { display: inline-block; padding: 14px 36px; border: 2px solid var(--color-primary); background: transparent; color: var(--color-text); font: inherit; font-size: 1.02em; cursor: pointer; transition: background .3s, color .3s; }
.sp-btn:hover { background: var(--color-primary); color: var(--color-on-primary) !important; }
.sp-text { display: grid; gap: 18px; color: var(--color-body); line-height: 2.1; }
.sp-add { display: grid; place-items: center; border: 2px dashed var(--sp-line); color: var(--color-muted); cursor: pointer; }

/* About */
.sp-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); min-height: min(800px, 100vh); background: var(--color-surface); }
.sp-hero-pic { position: relative; overflow: hidden; background: var(--color-soft); }
.sp-hero-pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: sp-zoom 1.4s cubic-bezier(.2, 1, .3, 1) backwards; }
@keyframes sp-zoom { from { transform: scale(1.12); opacity: 0; } }
.sp-hero-text { display: grid; align-content: center; gap: 22px; padding: clamp(30px, 6cqi, 110px) clamp(22px, 6cqi, 110px); }
.sp-hero-text > small { color: var(--color-muted); font-size: 1.15em; }
.sp-hero-text h1 { margin-top: -8px; font-size: clamp(2.4em, 5.4cqi, 3.8em); font-weight: 600; line-height: 1.25; }
.sp-hero-text .sp-btn { justify-self: start; margin-top: 10px; }
.sp-pad:has(.sp-services) { padding-top: clamp(44px, 7cqi, 80px); }
.sp-services { display: grid; grid-template-columns: 1fr 1fr; gap: 50px 60px; }
.sp-service { display: flex; gap: 26px; align-items: flex-start; }
.sp-sico { width: 56px; height: 56px; flex: none; fill: none; stroke: var(--color-muted); stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; transition: stroke .3s, transform .4s; }
.sp-service:hover .sp-sico { stroke: var(--color-primary); transform: translateY(-4px); }
.sp-service h4 { margin-bottom: 10px; font-size: 1.3em; font-weight: 600; }
.sp-service p { color: var(--color-body); line-height: 2; font-size: .95em; }
.sp-quotes { display: flex; gap: 40px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; scrollbar-width: thin; }
.sp-quote { flex: 0 0 calc(50% - 20px); min-width: 280px; margin: 0; scroll-snap-align: start; }
.sp-quote blockquote { margin: 0 0 0 0; margin-inline-start: 66px; padding: 26px 34px 40px; border: 1px solid var(--sp-line); background: var(--color-surface); font-style: italic; line-height: 2; color: var(--color-body); }
.sp-quote figcaption { display: flex; align-items: center; gap: 18px; margin-top: -36px; }
.sp-quote-pic { width: 104px; height: 104px; flex: none; border-radius: 50%; overflow: hidden; border: 3px solid var(--color-bg); background: var(--color-soft); box-shadow: 0 6px 16px -8px rgb(0 0 0 / .35); }
.sp-quote-pic img { width: 100%; height: 100%; object-fit: cover; }
.sp-quote-pic b { display: grid; place-items: center; height: 100%; font-size: 2em; color: var(--color-muted); }
.sp-quote figcaption span:last-child { display: grid; gap: 2px; padding-top: 30px; }
.sp-quote strong { font-size: 1.1em; font-weight: 600; }
.sp-quote small { color: var(--color-muted); font-size: .85em; }
.sp-clients { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 24px; align-items: center; }
.sp-client { display: grid; place-items: center; min-height: 60px; }
.sp-client img { max-width: 100%; max-height: 54px; opacity: .45; filter: grayscale(1); transition: opacity .3s, filter .3s; }
.sp-client:hover img { opacity: 1; filter: none; }

/* Resume */
.sp-resume { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: clamp(30px, 5cqi, 70px); }
.sp-tl { display: grid; }
.sp-tl-row { display: grid; grid-template-columns: minmax(110px, 200px) 24px minmax(0, 1fr); gap: 0 22px; position: relative; padding-bottom: 34px; }
.sp-tl-when { display: grid; justify-items: end; align-content: start; gap: 4px; text-align: end; }
.sp-tl-when b { font-weight: 600; font-size: .95em; }
.sp-tl-when small { color: var(--color-muted); font-size: .88em; }
.sp-tl-mid { position: relative; display: flex; justify-content: center; }
.sp-tl-mid::before { content: ""; position: absolute; top: 12px; bottom: -34px; width: 1px; background: var(--sp-line); }
.sp-tl-row:last-child .sp-tl-mid::before { bottom: 0; }
.sp-tl-mid i { position: relative; width: 14px; height: 14px; margin-top: 5px; border: 3px solid var(--color-primary); border-radius: 50%; background: var(--color-bg); }
.sp-tl-what h4 { margin-bottom: 8px; font-size: 1.25em; font-weight: 600; }
.sp-tl-what p { color: var(--color-body); line-height: 2; }
.sp-bars { display: grid; gap: 22px; }
.sp-bars span { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.sp-bars b { font-weight: 600; }
.sp-bars small { color: var(--color-muted); font-size: .82em; }
.sp-bars i { display: block; height: 10px; padding: 2px; border: 1px solid var(--color-primary); border-radius: 10px; }
.sp-bars i::after { content: ""; display: block; width: var(--w); height: 100%; border-radius: 10px; background: var(--color-primary); animation: sp-bar 1.3s .3s cubic-bezier(.2, 1, .3, 1) backwards; }
@keyframes sp-bar { from { width: 0; } }

/* Works */
.sp-radio { position: absolute; opacity: 0; pointer-events: none; }
.sp-filters { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px 10px; margin-bottom: 40px; }
.sp-filters label { padding: 8px 16px; border: 2px solid transparent; color: var(--color-muted); cursor: pointer; transition: color .2s, border-color .2s; }
.sp-filters label:hover { color: var(--color-text); }
.sp-works { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.sp-work { position: relative; display: block; aspect-ratio: 3 / 2; overflow: hidden; background: var(--color-soft); animation: sp-pop .7s calc(var(--i) * 70ms) cubic-bezier(.2, 1, .3, 1) backwards; }
@keyframes sp-pop { from { opacity: 0; transform: scale(.9); } }
.sp-work-pic, .sp-work-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
.sp-work-pic img { object-fit: cover; transition: transform .6s ease, filter .4s; }
.sp-work-pic b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 3em; color: var(--color-muted); }
.sp-work:hover .sp-work-pic img { transform: scale(1.06); filter: brightness(.88); }
.sp-work-title, .sp-work-cat, .sp-work-ico { position: absolute; z-index: 1; background: #fff; color: #222; opacity: 0; transition: opacity .3s, transform .35s; }
.sp-work-title { top: 12px; inset-inline-start: 12px; padding: 6px 14px; font-size: 1.15em; font-weight: 600; transform: translateY(-10px); }
.sp-work-cat { bottom: 12px; inset-inline-start: 12px; padding: 2px 10px; font-size: .82em; transform: translateY(10px); }
.sp-work-ico { top: 12px; inset-inline-end: 12px; width: 42px; height: 42px; display: grid; place-items: center; color: var(--color-primary); transform: translateY(-10px); }
.sp[dir="rtl"] .sp-work-ico .p-ico { transform: scaleX(-1); }
.sp-work:hover .sp-work-title, .sp-work:hover .sp-work-cat, .sp-work:hover .sp-work-ico { opacity: 1; transform: none; }

/* Gallery (blog style) */
.sp-posts { display: grid; grid-template-columns: 1fr 1fr; gap: 42px; }
.sp-post { display: grid; align-content: start; border: 1px solid var(--sp-line); background: var(--color-surface); cursor: zoom-in; animation: sp-pop .7s calc(var(--i) * 80ms) cubic-bezier(.2, 1, .3, 1) backwards; transition: box-shadow .3s, transform .3s; }
.sp-post:hover { transform: translateY(-4px); box-shadow: 0 20px 34px -24px rgb(0 0 0 / .4); }
.sp-post-pic { display: block; aspect-ratio: 15 / 7; overflow: hidden; }
.sp-post-pic img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s ease; }
.sp-post:hover .sp-post-pic img { transform: scale(1.05); }
.sp-post-text { display: grid; gap: 10px; padding: 26px 30px 30px; }
.sp-post-text small { color: var(--color-muted); font-size: .85em; }
.sp-post-text strong { font-size: 1.35em; font-weight: 600; line-height: 1.6; }
.sp-post.sp-add { min-height: 300px; }

/* Contact */
.sp-banner { height: 225px; margin-bottom: 44px; overflow: hidden; background: var(--color-soft); }
.sp-banner img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(.6) contrast(1.05); }
.sp-boxes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 44px; margin-bottom: clamp(50px, 8cqi, 90px); }
.sp-box { display: grid; justify-items: center; gap: 22px; padding: 30px 14px; border: 1px solid var(--sp-line); text-align: center; transition: border-color .3s, transform .3s; }
.sp-box:hover { border-color: var(--color-primary); transform: translateY(-3px); }
.sp-box .sp-sico { width: 62px; height: 62px; }
.sp-box a, .sp-box strong { font-size: 1.2em; font-weight: 600; overflow-wrap: anywhere; }
.sp-form-wrap { max-width: 950px; margin-inline: auto; }
.sp-form { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
.sp-form > div { display: grid; gap: 30px; }
.sp-form input, .sp-form textarea { width: 100%; padding: 16px 18px; border: 1px solid var(--sp-line); border-radius: 0; background: var(--color-bg); color: var(--color-text); font: inherit; transition: border-color .25s; }
.sp-form textarea { min-height: 100%; resize: vertical; }
.sp-form input:focus, .sp-form textarea:focus { outline: none; border-color: var(--color-primary); }
.sp-form input::placeholder, .sp-form textarea::placeholder { color: var(--color-muted); }
.sp-form button { justify-self: start; grid-column: 1 / -1; }

/* Previous / next page */
.sp-arrows { position: absolute; bottom: 24px; inset-inline-end: 24px; display: flex; gap: 6px; animation: none !important; }
.sp-arrows a { width: 58px; height: 58px; display: grid; place-items: center; border: 1px solid var(--sp-line); background: var(--color-bg); transition: background .2s, border-color .2s; }
.sp-arrows a:hover { border-color: var(--color-primary); }
.sp-chev { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 1.4; }
.sp[dir="rtl"] .sp-chev { transform: scaleX(-1); }
.sp-chev.back { transform: scaleX(-1); }
.sp[dir="rtl"] .sp-chev.back { transform: none; }

@container (max-width: 1100px) {
  .sp-boxes { grid-template-columns: 1fr 1fr; gap: 20px; }
  .sp-works { grid-template-columns: 1fr 1fr; }
}
@container (max-width: 900px) {
  .sp-shell { grid-template-columns: 1fr; background: none !important; }
  .sp-side { position: static; grid-template-columns: auto 1fr; justify-items: start; align-items: center; gap: 12px 18px; padding: 20px 18px 0; box-shadow: none !important; }
  .sp-avatar { width: 64px; height: 64px; }
  .sp-side-name { font-size: 1.3em; text-align: start; max-width: none; }
  .sp-menu { grid-column: 1 / -1; display: flex; overflow-x: auto; margin-top: 4px; border-bottom: 1px solid var(--sp-line); }
  .sp-menu a { flex: none; padding: 14px 16px; border: none; white-space: nowrap; }
  .sp-menu a::after { inset-block: auto 0; inset-inline: 0; width: auto; height: 2px; transform: scaleX(0); }
  .sp-menu a[aria-current="page"]::after { transform: none; }
  .sp-socials, .sp-copy { display: none; }
  .sp-hero { grid-template-columns: 1fr; min-height: 0; }
  .sp-hero-pic { aspect-ratio: 1; }
  .sp-services, .sp-resume, .sp-posts, .sp-form { grid-template-columns: 1fr; }
  .sp-quote { flex-basis: 88%; }
}
@container (max-width: 560px) {
  .sp-works, .sp-boxes { grid-template-columns: 1fr; }
  .sp-tl-row { grid-template-columns: 1fr; padding-inline-start: 26px; }
  .sp-tl-mid { position: absolute; inset-block: 0; inset-inline-start: 0; width: 14px; }
  .sp-tl-mid i { margin-top: 3px; }
  .sp-tl-when { justify-items: start; text-align: start; margin-bottom: 6px; }
  .sp-service { gap: 16px; }
  .sp-sico { width: 44px; height: 44px; }
  .sp-quote blockquote { margin-inline-start: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .sp-side, .sp-main > *, .sp-hero-pic img, .sp-work, .sp-post, .sp-bars i::after { animation: none !important; }
}
`;
