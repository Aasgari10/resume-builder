// Pricing (unit 22): three packages that build the same site and differ only in how soon the order is
// taken up; what every package includes; how the final price is set; the steps; common questions.

import { useEffect, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { PageHead, UnitPage } from "./Shell";
import { unitByKey } from "./units";
import "./pages.css";

const fa = (n: number) => n.toLocaleString("fa-IR");

/** The deposit paid once the price is agreed (million tomans); the rest is paid at delivery. */
const DEPOSIT = 4;

/** The packages: the way up to our unit, from the stairs to ringing the bell. `glow` is how bright its lamp is. */
const PACKAGES = [
  {
    key: "stairs",
    name: "از پله‌ها",
    kind: "اقتصادی",
    from: 6,
    to: 14,
    when: "۴ روز بعد",
    note: "سفارش شما ۴ روز بعد از ثبت به دست ما می‌رسد و بررسی می‌شود.",
    glow: 0.35,
    d: "M3 20h4v-4h4v-4h4V8h4V4h2",
  },
  {
    key: "lift",
    name: "با آسانسور",
    kind: "سریع",
    from: 8,
    to: 16,
    when: "۲ روز بعد",
    note: "سفارش شما ۲ روز بعد از ثبت به دست ما می‌رسد و بررسی می‌شود.",
    glow: 0.65,
    d: "M5 3h14v18H5z M12 3v18 M8.5 9l-1.5 2h3z M15.5 11l1.5-2h-3z",
  },
  {
    key: "bell",
    name: "زنگ مستقیم",
    kind: "فوری",
    from: 10,
    to: 18,
    when: "همین امروز",
    note: "سفارش شما همان لحظه به دست ما می‌رسد و همین امروز بررسی می‌شود.",
    glow: 1,
    d: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 20a2 2 0 0 0 4 0 M12 3v2",
  },
];

/** What every package includes. */
const INCLUDED = [
  { t: "هر قالبی که بخواهید", s: "همه‌ی قالب‌ها با پنل مدیریت فارسی" },
  { t: "شخصی‌سازی", s: "رنگ، متن، عکس و اطلاعات کسب‌وکار شما" },
  { t: "یک ماه پشتیبانی", s: "بعد از تحویل، کنارتان هستیم" },
  { t: `${fa(DEPOSIT)} میلیون بیعانه`, s: "باقی مبلغ هنگام تحویل سایت" },
];

const STEPS = [
  { t: "قالب را انتخاب کنید", s: "هر قالب را با پنل مدیریتش امتحان کنید." },
  { t: "سفارش و بسته", s: "سفارش را ثبت کنید و بسته‌ی دلخواه را انتخاب کنید." },
  { t: "تماس ما", s: `در زمان بسته‌تان تماس می‌گیریم، قیمت قطعی را می‌گوییم و ${fa(DEPOSIT)} میلیون بیعانه پرداخت می‌شود.` },
  { t: "تحویل", s: "سایت را تحویل می‌گیرید، باقی مبلغ را می‌پردازید و یک ماه پشتیبانی دارید." },
];

const FAQ = [
  {
    q: "فرق بسته‌ها فقط در زمان است؟",
    a: "بله. سایتی که می‌سازیم و کیفیت کار در هر سه بسته یکی است؛ فرقشان در این است که سفارش شما چقدر زود به دست ما می‌رسد و کار شروع می‌شود.",
  },
  {
    q: "قیمت دقیق چطور مشخص می‌شود؟",
    a: "قیمت هر بسته یک بازه است و به قالب و میزان شخصی‌سازی بستگی دارد. وقتی تماس می‌گیریم، نیازتان را می‌پرسیم و قیمت قطعی را پیش از شروع کار اعلام می‌کنیم.",
  },
  {
    q: "پرداخت چطور است؟",
    a: `بعد از توافق روی قیمت، ${fa(DEPOSIT)} میلیون تومان بیعانه پرداخت می‌کنید و باقی مبلغ را هنگام تحویل سایت.`,
  },
  {
    q: "پشتیبانی شامل چه می‌شود؟",
    a: "تا یک ماه بعد از تحویل به سؤال‌هایتان جواب می‌دهیم، اشکال‌ها را برطرف می‌کنیم و کار با پنل مدیریت را یادتان می‌دهیم.",
  },
];

export function Pricing() {
  const u = unitByKey("pricing");
  useEffect(() => {
    document.title = "تعرفه‌ها | site4site";
  }, []);
  return (
    <UnitPage current="pricing">
      <PageHead plate={u.plate} title="تعرفه‌ها" sub="فرق بسته‌ها فقط این است که چقدر زود سراغتان می‌آییم." />

      <div className="pr-cards">
        {PACKAGES.map((p) => (
          <section key={p.key} className="pr-card" aria-label={`بسته‌ی ${p.kind}`}>
            <span className="pr-lamp" aria-hidden="true" style={{ "--glow": p.glow } as CSSProperties} />
            <span className="pr-ring" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d={p.d} />
              </svg>
            </span>
            <h2>{p.name}</h2>
            <small className="pr-kind">{p.kind}</small>
            <p className="pr-price">
              <b>
                {fa(p.from)} تا {fa(p.to)}
              </b>
              <span>میلیون تومان</span>
            </p>
            <p className="pr-when">
              بررسی سفارش: <b>{p.when}</b>
            </p>
            <p className="pr-note">{p.note}</p>
            <Link to="/templates" className="s4-btn main">
              انتخاب قالب
            </Link>
          </section>
        ))}
      </div>

      <h2 className="s4-h2">در همه‌ی بسته‌ها</h2>
      <ul className="pr-inc">
        {INCLUDED.map((i) => (
          <li key={i.t}>
            <b>{i.t}</b>
            <span>{i.s}</span>
          </li>
        ))}
      </ul>

      <h2 className="s4-h2">از سفارش تا تحویل</h2>
      <ol className="pr-steps">
        {STEPS.map((s, i) => (
          <li key={s.t}>
            <span className="n" aria-hidden="true">
              {fa(i + 1)}
            </span>
            <b>{s.t}</b>
            <span className="d">{s.s}</span>
          </li>
        ))}
      </ol>

      <h2 className="s4-h2">سؤال‌های رایج</h2>
      <div className="pr-faq">
        {FAQ.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>

      <div className="ab-cta">
        <Link to="/templates" className="s4-btn main">
          دیدن قالب‌ها
        </Link>
        <Link to="/" className="s4-btn ghost">
          بازگشت به ساختمان
        </Link>
      </div>
    </UnitPage>
  );
}
