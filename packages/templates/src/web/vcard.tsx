/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// "Card" (vCard style): a business card beside a content panel. The card (photo, name, contact
// details, social links) stays in place while the panel's tabs switch pages: about, resume,
// works, certificates and contact. Light and calm; the primary color marks active things.

import type { CSSProperties, ReactNode } from "react";
import type { ResumeData } from "@rb/schema";
import { WebPage, webCtx } from "./kit";
import { formatNumber, formatPeriod, formatYearMonth, safeUrl } from "../format";
import { sampleImage, sampleResume } from "../sample";
import type { TemplateProps } from "../types";
import { Certificates, Icon, Opt, PageLink, SERVICE_ICONS, Socials, ToPage, ed, item, outside, pagesOf, paragraphs, partsCss, type View } from "./parts";

export const VCARD_OPTIONAL_PAGES = [
  { path: "/resume", label: "رزومه" },
  { path: "/works", label: "نمونه‌کارها" },
  { path: "/gallery", label: "مدارک" },
  { path: "/contact", label: "تماس" },
] as const;

export const vcardPages = (data: ResumeData) => pagesOf(data, VCARD_OPTIONAL_PAGES);

const TABS: Record<string, string> = { "/": "درباره", "/resume": "رزومه", "/works": "نمونه‌کارها", "/gallery": "مدارک", "/contact": "تماس" };
const TITLES: Record<string, string> = { "/": "درباره‌ی من", "/resume": "رزومه", "/works": "نمونه‌کارها", "/gallery": "مدارک من", "/contact": "تماس با من" };

export function VcardPortfolio(props: TemplateProps) {
  const ctx = webCtx(props);
  const view: View = { ctx, link: props.link ?? ((p) => p), editing: Boolean(props.editing) };
  const pages = vcardPages(ctx.data);
  const page = pages.includes(props.page ?? "/") ? (props.page ?? "/") : "/";

  return (
    <WebPage ctx={ctx} className="vc" css={partsCss + css}>
      <div className="vc-wrap">
        <Side {...view} pages={pages} />
        <main className="vc-main">
          <nav className="vc-tabs">
            {pages.map((p) => (
              <PageLink key={p} to={p} link={view.link} current={p === page}>
                {TABS[p]}
              </PageLink>
            ))}
          </nav>
          <h1 className="vc-title" key={page}>
            {TITLES[page]}
          </h1>
          <div className="vc-page" key={`b${page}`}>
            {page === "/resume" ? <Resume {...view} /> : page === "/works" ? <Works {...view} /> : page === "/gallery" ? <Certificates ctx={ctx} editing={view.editing} className="vc-certs" /> : page === "/contact" ? <Contact {...view} /> : <About {...view} />}
          </div>
        </main>
      </div>
    </WebPage>
  );
}

function Side({ ctx, editing, link, pages }: View & { pages: string[] }) {
  const b = ctx.data.basics;
  const photo = safeUrl(b.avatarUrl);
  const rows: { icon: string; label: string; value?: string; href?: string; path: string }[] = [
    { icon: "mail", label: "ایمیل", value: b.email, href: b.email ? `mailto:${b.email}` : undefined, path: "basics.email" },
    { icon: "phone", label: "تلفن", value: b.phone, href: b.phone ? `tel:${b.phone.replace(/[^\d+]/g, "")}` : undefined, path: "basics.phone" },
    { icon: "pin", label: "شهر", value: b.location, path: "basics.location" },
  ];
  return (
    <aside className="vc-side">
      <div className="vc-photo" {...ed("basics.avatarUrl", "image", "عکس پروفایل")}>
        {photo ? <img src={photo} alt={b.fullName} /> : <span>{b.fullName.charAt(0)}</span>}
      </div>
      <h2 {...ed("basics.fullName", "text", "نام")}>{b.fullName}</h2>
      <Opt value={b.jobTitle} editing={editing} edit={ed("basics.jobTitle", "text", "عنوان شغلی")}>
        <span className="vc-role" {...ed("basics.jobTitle", "text", "عنوان شغلی")}>
          {b.jobTitle}
        </span>
      </Opt>
      <hr />
      <ul className="vc-info">
        {rows.map((r) => (
          <li key={r.path}>
            <span className="vc-ico">
              <Icon name={r.icon} />
            </span>
            <div>
              <small>{r.label}</small>
              <Opt value={r.value} editing={editing} edit={ed(r.path, "text", r.label)}>
                {r.href ? (
                  <a href={r.href} dir="ltr" {...ed(r.path, "text", r.label)}>
                    {r.value}
                  </a>
                ) : (
                  <span {...ed(r.path, "text", r.label)}>{r.value}</span>
                )}
              </Opt>
            </div>
          </li>
        ))}
      </ul>
      <Socials ctx={ctx} editing={editing} className="vc-socials" />
      <ToPage pages={pages} to="/contact" link={link} className="vc-cta">
        پیام بدهید
      </ToPage>
    </aside>
  );
}

function About({ ctx, editing }: View) {
  const text = ctx.data.site?.aboutText?.trim() || ctx.data.basics.summary?.trim() || "";
  const services = ctx.data.skills.filter((s) => s.name.trim() && s.description?.trim()).slice(0, 4);
  const startYears = ctx.data.experience.map((x) => Number(x.period.start.slice(0, 4))).filter(Boolean);
  const years = startYears.length ? new Date().getFullYear() - Math.min(...startYears) : 0;
  const n = (v: number) => formatNumber(v, ctx.data.locale);
  return (
    <>
      <Opt value={text} editing={editing} edit={ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
        <div className="vc-text" {...ed("site.aboutText", "multiline", "متن درباره‌ی من")}>
          {paragraphs(text).map((p, k) => (
            <p key={k}>{p}</p>
          ))}
        </div>
      </Opt>
      <div className="vc-stats">
        <div>
          <b>{n(years)}+</b>
          <small>سال تجربه</small>
        </div>
        <div>
          <b>{n(ctx.data.projects.length)}</b>
          <small>پروژه</small>
        </div>
        <div>
          <b>{n(ctx.data.site?.gallery.length ?? 0)}</b>
          <small>مدرک</small>
        </div>
      </div>
      {services.length > 0 && (
        <>
          <h3 className="vc-h3">کارهایی که انجام می‌دهم</h3>
          <div className="vc-services">
            {services.map((s, k) => (
              <div key={s.id} className="vc-box" style={{ "--i": k } as CSSProperties}>
                <span className="vc-ico big">
                  <Icon name={SERVICE_ICONS[k % 4]!} />
                </span>
                <div>
                  <strong {...ed(`${item("skills", s.id)}.name`, "text", "عنوان خدمت")}>{s.name}</strong>
                  <p {...ed(`${item("skills", s.id)}.description`, "multiline", "توضیح خدمت")}>{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function Timeline({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <section className="vc-tl">
      <h3 className="vc-h3">
        <span className="vc-ico">
          <Icon name={icon} />
        </span>
        {title}
      </h3>
      <ol>{children}</ol>
    </section>
  );
}

function Resume({ ctx, editing }: View) {
  const { data } = ctx;
  const fmt = ctx.theme.display.dateFormat;
  const skills = data.skills.filter((s) => s.name.trim());
  return (
    <>
      {data.experience.length > 0 && (
        <Timeline title="سوابق کاری" icon="layers">
          {data.experience.map((x) => {
            const at = item("experience", x.id);
            return (
              <li key={x.id}>
                <strong {...ed(`${at}.position`, "text", "سمت")}>{x.position}</strong>
                <span className="vc-sub">
                  <span {...ed(`${at}.company`, "text", "شرکت")}>{x.company}</span> ·{" "}
                  <span {...ed(`${at}.period`, "period", "تاریخ")}>{formatPeriod(x.period, data.locale, fmt)}</span>
                </span>
                <Opt value={x.description} editing={editing} edit={ed(`${at}.description`, "multiline", "توضیحات")}>
                  <p {...ed(`${at}.description`, "multiline", "توضیحات")}>{x.description}</p>
                </Opt>
              </li>
            );
          })}
        </Timeline>
      )}
      {data.education.length > 0 && (
        <Timeline title="تحصیلات" icon="calendar">
          {data.education.map((x) => {
            const at = item("education", x.id);
            return (
              <li key={x.id}>
                <strong {...ed(`${at}.institution`, "text", "دانشگاه")}>{x.institution}</strong>
                <span className="vc-sub">
                  <span {...ed(`${at}.degree`, "text", "مقطع")}>{[x.degree, x.field].filter(Boolean).join("، ")}</span> ·{" "}
                  <span {...ed(`${at}.period`, "period", "تاریخ")}>{formatPeriod(x.period, data.locale, fmt)}</span>
                </span>
              </li>
            );
          })}
        </Timeline>
      )}
      {skills.length > 0 && (
        <>
          <h3 className="vc-h3">مهارت‌ها</h3>
          <div className="vc-skills">
            {skills.map((s) => (
              <div key={s.id}>
                <span>
                  <b {...ed(`${item("skills", s.id)}.name`, "text", "مهارت")}>{s.name}</b>
                  {s.level && <small>{formatNumber(s.level * 20, data.locale)}٪</small>}
                </span>
                <i style={{ "--w": `${(s.level ?? 3) * 20}%` } as CSSProperties} />
              </div>
            ))}
          </div>
        </>
      )}
      {data.certificates.length > 0 && (
        <Timeline title="دوره‌ها" icon="spark">
          {data.certificates.map((c) => (
            <li key={c.id}>
              <strong {...ed(`${item("certificates", c.id)}.title`, "text", "عنوان")}>{c.title}</strong>
              <span className="vc-sub">
                {[c.issuer, formatYearMonth(c.date, data.locale, fmt)].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </Timeline>
      )}
    </>
  );
}

function Works({ ctx, editing }: View) {
  const items = ctx.data.projects.filter((p) => p.title.trim());
  return (
    <div className="vc-works">
      {items.map((p, k) => {
        const at = item("projects", p.id);
        const href = safeUrl(p.url) ?? safeUrl(p.repoUrl);
        const img = safeUrl(p.images[0]);
        return (
          <a key={p.id} href={href ?? "#"} {...outside(href)} className="vc-work" style={{ "--i": k } as CSSProperties}>
            <span className="vc-shot" {...ed(`${at}.images.0`, "image", "تصویر پروژه")}>
              {img ? <img src={img} alt={p.title} loading="lazy" /> : <b>{p.title.charAt(0)}</b>}
              <i className="vc-eye">
                <Icon name="arrow" />
              </i>
            </span>
            <strong {...ed(`${at}.title`, "text", "عنوان پروژه")}>{p.title}</strong>
            <Opt value={p.role} editing={editing} edit={ed(`${at}.role`, "text", "دسته")}>
              <small {...ed(`${at}.role`, "text", "دسته")}>{p.role}</small>
            </Opt>
          </a>
        );
      })}
    </div>
  );
}

function Contact({ ctx }: View) {
  const email = ctx.data.basics.email?.trim();
  return (
    <>
      <p className="vc-text">برای همکاری، سفارش یا هر سؤالی پیام بگذارید؛ زود جواب می‌دهم.</p>
      {/* No server needed: the visitor's mail app opens with the message filled in. */}
      <form className="vc-form" action={email ? `mailto:${email}` : undefined} method="post" encType="text/plain">
        <div>
          <input name="name" placeholder="نام شما" required />
          <input name="email" type="email" placeholder="ایمیل شما" required />
        </div>
        <textarea name="message" rows={6} placeholder="پیام شما" required />
        <button type="submit">
          <Icon name="telegram" /> ارسال پیام
        </button>
      </form>
    </>
  );
}

/* ───────────── Example content ───────────── */

export function vcardSample(locale: ResumeData["locale"]): ResumeData {
  const base = sampleResume(locale);
  return { ...base, skills: describeSkills(base.skills, locale), basics: { ...base.basics, avatarUrl: sampleImage("avatar") } };
}

/** The first four skills with a sentence each, for templates that present skills as services. */
export function describeSkills(skills: ResumeData["skills"], locale: ResumeData["locale"]): ResumeData["skills"] {
  if (locale !== "fa") return skills;
  const text = [
    "ساخت رابط‌های کاربری سریع و دسترس‌پذیر با ری‌اکت؛ از صفحه‌های ساده تا پنل‌های بزرگ.",
    "کد قابل اعتماد و قابل نگهداری با تایپ‌اسکریپت، تا تغییرات بعدی بی‌دردسر باشند.",
    "صفحه‌هایی که روی موبایل و دسکتاپ درست و زیبا دیده می‌شوند، با جزئیات دقیق.",
    "سایت‌های سریع و سئوشده با نکست؛ مناسب کسب‌وکارهایی که در گوگل دیده شوند.",
  ];
  return skills.map((s, k) => (k < 4 ? { ...s, description: s.description ?? text[k] } : s));
}

/* ───────────── Styles ───────────── */

const css = /* css */ `
/* Page colors come from the theme (see palettes.ts for this template's designed ones). */
.vc { --vc-bg: var(--color-bg); --vc-card: var(--color-surface); --vc-ink: var(--color-text); --vc-mute: var(--color-muted); --vc-line: var(--color-line); --vc-soft: var(--color-soft); --vc-accent: var(--color-primary-read);
  background: var(--vc-bg); color: var(--vc-ink); min-height: 100%; }
.vc a { color: inherit; }
.vc-wrap { display: grid; grid-template-columns: minmax(260px, 300px) minmax(0, 1fr); gap: 24px; align-items: start; width: min(1180px, 100% - 2 * clamp(12px, 3cqi, 40px)); margin: 0 auto; padding: clamp(16px, 4cqi, 56px) 0; }
.vc-side, .vc-main { background: var(--vc-card); border-radius: 26px; box-shadow: 0 1px 0 var(--vc-line), 0 24px 50px -36px rgb(0 0 0 / .3); animation: vc-grow .8s cubic-bezier(.2, 1.1, .3, 1) backwards; }
.vc-side { position: sticky; top: 24px; display: grid; justify-items: center; gap: 10px; padding: 30px 24px; text-align: center; }
.vc-main { position: relative; padding: clamp(22px, 4cqi, 40px); min-height: 70vh; animation-delay: .1s; overflow: hidden; }
@keyframes vc-grow { from { opacity: 0; transform: scale(.94) translateY(16px); } }
.vc-photo { position: relative; width: 150px; aspect-ratio: 1; border-radius: 30px; overflow: hidden; background: linear-gradient(140deg, var(--color-primary-tint), var(--color-primary)); }
.vc-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.vc-photo span { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-size: 3em; font-weight: 800; }
.vc-side h2 { margin-top: 8px; font-size: 1.35em; font-weight: 700; }
.vc-role { padding: 5px 14px; border-radius: 999px; background: var(--vc-soft); color: var(--vc-mute); font-size: .82em; }
.vc-side hr { width: 100%; border: none; border-top: 1px solid var(--vc-line); margin: 10px 0; }
.vc-info { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; width: 100%; text-align: start; }
.vc-info li { display: flex; gap: 12px; align-items: center; min-width: 0; }
.vc-info small { display: block; color: var(--vc-mute); font-size: .72em; margin-bottom: 2px; }
.vc-info a, .vc-info span { font-size: .9em; overflow-wrap: anywhere; }
.vc-ico { width: 42px; height: 42px; flex: none; display: grid; place-items: center; border-radius: 13px; background: var(--vc-soft); color: var(--vc-accent); box-shadow: inset 0 0 0 1px var(--vc-line); }
.vc-ico.big { width: 52px; height: 52px; border-radius: 16px; }
.vc-ico.big .p-ico { width: 26px; height: 26px; }
.vc-socials { justify-content: center; margin-top: 8px; }
.vc-socials a { background: var(--vc-soft); color: var(--vc-mute); }
.vc-socials a:hover { background: var(--color-primary); color: var(--color-on-primary); }
.vc-cta { width: 100%; margin-top: 6px; padding: 12px; border-radius: 14px; background: var(--color-primary); color: var(--color-on-primary) !important; font-weight: 600; transition: filter .2s, transform .2s; }
.vc-cta:hover { filter: brightness(1.08); transform: translateY(-1px); }

.vc-tabs { position: absolute; top: 0; inset-inline-end: 0; display: flex; gap: 4px; padding: 6px 18px; border-end-start-radius: 20px; background: var(--vc-soft); box-shadow: inset 0 0 0 1px var(--vc-line); font-size: .9em; }
.vc-tabs a { padding: 10px 12px; color: var(--vc-mute); border-radius: 10px; transition: color .2s; }
.vc-tabs a:hover { color: var(--vc-ink); }
.vc-tabs a[aria-current="page"] { color: var(--vc-accent); font-weight: 600; }
.vc-title { position: relative; margin: 34px 0 28px; padding-bottom: 14px; font-size: clamp(1.6em, 3.4cqi, 2.1em); font-weight: 800; animation: vc-rise .6s ease both; }
.vc-title::after { content: ""; position: absolute; bottom: 0; inset-inline-start: 0; width: 44px; height: 5px; border-radius: 5px; background: var(--color-primary); animation: vc-bar .7s .2s cubic-bezier(.2, 1, .3, 1) both; transform-origin: right; }
@keyframes vc-bar { from { transform: scaleX(0); } }
@keyframes vc-rise { from { opacity: 0; transform: translateY(12px); } }
.vc-page > * { animation: vc-pop .7s cubic-bezier(.2, 1.1, .3, 1) backwards; }
.vc-page > :nth-child(2) { animation-delay: .08s; } .vc-page > :nth-child(3) { animation-delay: .16s; } .vc-page > :nth-child(4) { animation-delay: .24s; } .vc-page > :nth-child(n+5) { animation-delay: .32s; }
@keyframes vc-pop { from { opacity: 0; transform: scale(.95) translateY(14px); } }
.vc-text { display: grid; gap: 14px; color: var(--color-body); line-height: 2.05; }
.vc-h3 { display: flex; align-items: center; gap: 12px; margin: 34px 0 var(--w-head-gap); font-size: 1.2em; font-weight: 700; }
.vc-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 26px; }
.vc-stats div { display: grid; gap: 4px; justify-items: center; padding: 18px 10px; border-radius: 18px; background: var(--vc-soft); }
.vc-stats b { font-size: 1.8em; color: var(--vc-accent); }
.vc-stats small { color: var(--vc-mute); font-size: .8em; }
.vc-services { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.vc-box { display: flex; gap: 16px; align-items: flex-start; padding: 22px; border-radius: 20px; background: var(--vc-card); box-shadow: inset 0 0 0 1px var(--vc-line), 0 16px 30px -26px rgb(0 0 0 / .4); transition: transform .3s, box-shadow .3s; }
.vc-box:hover { transform: translateY(-3px); box-shadow: inset 0 0 0 1px var(--color-primary-tint), 0 20px 34px -24px rgb(0 0 0 / .4); }
.vc-box strong { display: block; margin-bottom: 6px; }
.vc-box p { color: var(--vc-mute); font-size: .88em; line-height: 1.95; }

.vc-tl ol { list-style: none; margin: 0; padding: 0; padding-inline-start: 62px; display: grid; gap: 26px; }
.vc-tl li { position: relative; display: grid; gap: 6px; }
.vc-tl li::before { content: ""; position: absolute; inset-inline-start: -37px; top: 14px; bottom: -26px; width: 1px; background: var(--vc-line); }
.vc-tl li:last-child::before { display: none; }
.vc-tl li::after { content: ""; position: absolute; inset-inline-start: -42px; top: 6px; width: 11px; height: 11px; border-radius: 50%; background: var(--color-primary); box-shadow: 0 0 0 5px color-mix(in srgb, var(--color-primary) 14%, var(--color-surface)); }
.vc-sub { color: var(--vc-accent); font-size: .84em; }
.vc-tl p { color: var(--vc-mute); font-size: .9em; line-height: 1.95; }
.vc-skills { display: grid; gap: 18px; padding: 22px; border-radius: 20px; box-shadow: inset 0 0 0 1px var(--vc-line); }
.vc-skills span { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: .9em; }
.vc-skills small { color: var(--vc-mute); }
.vc-skills i { display: block; height: 7px; border-radius: 7px; background: var(--vc-soft); position: relative; overflow: hidden; }
.vc-skills i::after { content: ""; position: absolute; inset-block: 0; inset-inline-start: 0; width: var(--w); border-radius: inherit; background: linear-gradient(90deg, var(--color-primary), var(--color-primary-tint)); animation: vc-fill 1.2s .3s cubic-bezier(.2, 1, .3, 1) both; }
@keyframes vc-fill { from { width: 0; } }

.vc-works { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; }
.vc-work { display: grid; gap: 6px; }
.vc-shot { position: relative; display: block; aspect-ratio: 4 / 3; border-radius: 18px; overflow: hidden; margin-bottom: 8px; background: linear-gradient(140deg, var(--color-primary-tint), var(--color-primary)); }
.vc-shot img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
.vc-shot b { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-size: 2.6em; }
.vc-eye { position: absolute; inset: 0; display: grid; place-items: center; background: rgb(20 22 30 / .35); opacity: 0; transition: opacity .3s; }
.vc-eye .p-ico { width: 46px; height: 46px; padding: 12px; border-radius: 14px; background: var(--color-surface); color: var(--vc-accent); transform: scale(.7); transition: transform .3s; }
.vc-work:hover .vc-shot img { transform: scale(1.08); }
.vc-work:hover .vc-eye { opacity: 1; }
.vc-work:hover .vc-eye .p-ico { transform: none; }
.vc-work small { color: var(--vc-mute); font-size: .82em; }

.vc-certs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; }
.vc-certs .p-cert-pic { aspect-ratio: 4 / 3; border-radius: 16px; padding: 12px; background: var(--vc-soft); box-shadow: inset 0 0 0 1px var(--vc-line); }
.vc-certs .p-cert-pic img { object-fit: contain; border-radius: 6px; }
.vc-certs small { color: var(--vc-mute); }

.vc-form { display: grid; gap: 14px; margin-top: 24px; }
.vc-form > div { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.vc-form input, .vc-form textarea { width: 100%; padding: 14px 18px; border: 1px solid var(--vc-line); border-radius: 14px; background: var(--vc-soft); color: var(--vc-ink); font: inherit; font-size: .92em; transition: border-color .2s, background .2s; }
.vc-form input:focus, .vc-form textarea:focus { outline: none; border-color: var(--color-primary); background: var(--color-surface); }
.vc-form button { justify-self: end; display: inline-flex; gap: 10px; align-items: center; padding: 13px 26px; border: none; border-radius: 14px; background: var(--color-primary); color: var(--color-on-primary); font: inherit; font-weight: 600; cursor: pointer; transition: filter .2s, transform .2s; }
.vc-form button:hover { filter: brightness(1.08); transform: translateY(-1px); }

@container (max-width: 900px) {
  .vc-wrap { grid-template-columns: 1fr; }
  .vc-side { position: static; }
  .vc-works, .vc-certs { grid-template-columns: 1fr 1fr; }
}
@container (max-width: 600px) {
  .vc-tabs { position: static; margin: -8px -8px 0; border-radius: 16px; overflow-x: auto; justify-content: space-between; padding: 4px 8px; }
  .vc-tabs a { padding: 10px 6px; white-space: nowrap; }
  .vc-title { margin-top: 22px; }
  .vc-services, .vc-works, .vc-certs, .vc-form > div { grid-template-columns: 1fr; }
  .vc-stats b { font-size: 1.4em; }
}
@media (prefers-reduced-motion: reduce) {
  .vc-side, .vc-main, .vc-title, .vc-title::after, .vc-page > *, .vc-skills i::after { animation: none; }
}
`;
