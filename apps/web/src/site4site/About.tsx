// About (unit 21): who builds the sites and why to choose them. The same story is short enough to be
// read in one screen on a phone.

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SITE_TEMPLATES } from "@rb/templates";
import ali from "./art/ali.svg?raw";
import support from "./art/support.svg?raw";
import { PageHead, UnitPage } from "./Shell";
import "./pages.css";

const fa = (n: number) => n.toLocaleString("fa-IR");

const WHY = [
  {
    d: "M4 4h7v7H4z M13 4h7v4h-7z M13 10h7v10h-7z M4 13h7v7H4z",
    t: "اول امتحان کنید",
    s: "هر قالب را با پنل مدیریتش امتحان کنید، بعد سفارش دهید.",
  },
  {
    d: "M13 2 4 14h7l-1 8 9-12h-7z",
    t: "سریع",
    s: "قالب را انتخاب کنید؛ سایت در چند روز آماده است.",
  },
  {
    d: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
    t: "تحویل کامل",
    s: "سایت سریع و امن، آماده برای موتورهای جستجو.",
  },
  {
    d: "M4 12a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-1v-6h3 M4 13h3v6H6a2 2 0 0 1-2-2z",
    t: "کنار شما",
    s: "بعد از تحویل هم پاسخ‌گوی سؤال‌هایتان هستیم.",
  },
];

const PEOPLE = [
  {
    art: ali,
    name: "علی عسگری",
    role: "مدیر ساختمان · برنامه‌نویس فول‌استک وب",
    text: "طراحی و ساخت همه‌ی قالب‌های site4site با من است؛ از ظاهر صفحه‌ها تا پنل مدیریت و کدی که پشتشان کار می‌کند. سعی می‌کنم هر سایت سریع، ساده و برای صاحبش راحت باشد.",
    tags: ["React", "TypeScript", "Node.js", "طراحی رابط کاربری"],
  },
  {
    art: support,
    name: "تیم پشتیبانی",
    role: "در خدمت شماست",
    text: "از انتخاب قالب تا تحویل سایت و بعد از آن، کنارتان هستیم: به سؤال‌هایتان جواب می‌دهیم، تغییرهایی که می‌خواهید را پیگیری می‌کنیم و کار با پنل مدیریت را یادتان می‌دهیم.",
    tags: ["پیگیری سفارش", "آموزش پنل", "تغییرات بعد از تحویل"],
  },
];

export function About() {
  useEffect(() => {
    document.title = "درباره‌ی ما | site4site";
  }, []);
  return (
    <UnitPage current="about">
      <PageHead plate="واحد ۲۱" title="درباره‌ی ما" sub="چند برنامه‌نویس و طراح که شب‌ها هم چراغشان روشن است." />

      <div className="ab-top">
        <div className="ab-paper">
          <span className="q" aria-hidden="true">
            ؟
          </span>
          <p>
            <b>site4site</b> یک ساختمان کوچک است با آدم‌هایی که کارشان ساختن سایت است. هر قالبی که می‌بینید را خودمان طراحی کرده‌ایم و برای کسب‌وکار شما
            شخصی‌سازی می‌کنیم.
          </p>
          <p>از فروشگاه و رزرو آنلاین تا سایت شخصی و رزومه؛ شما قالب را انتخاب می‌کنید، ما سایت را تحویل می‌دهیم و بعد از تحویل هم کنارتان هستیم.</p>
        </div>
        <div className="ab-stats">
          <div>
            <b>{fa(SITE_TEMPLATES.length)}+</b>
            <small>قالب آماده</small>
          </div>
          <div>
            <b>{fa(48)}</b>
            <small>ساعت تا تحویل</small>
          </div>
          <div>
            <b>رایگان</b>
            <small>امتحان قالب با پنل</small>
          </div>
        </div>
      </div>

      <h2 className="s4-h2">چرا ما؟</h2>
      <div className="ab-why">
        {WHY.map((w) => (
          <div key={w.t} className="w">
            <span className="ring" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d={w.d} />
              </svg>
            </span>
            <b>{w.t}</b>
            <span className="d">{w.s}</span>
          </div>
        ))}
      </div>

      <h2 className="s4-h2">ساکنان ساختمان</h2>
      <div className="ab-team">
        {PEOPLE.map((p, i) => (
          <div key={p.name} className={`row ${i % 2 ? "flip" : ""}`}>
            <span className="pic" dangerouslySetInnerHTML={{ __html: p.art }} />
            <div className="bio">
              <b>{p.name}</b>
              <small>{p.role}</small>
              <p>{p.text}</p>
              <div className="ab-tags">
                {p.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="ab-cta">
        <Link to="/templates" className="s4-btn main">
          سفارش سایت
        </Link>
        <Link to="/" className="s4-btn ghost">
          بازگشت به ساختمان
        </Link>
      </div>
    </UnitPage>
  );
}
