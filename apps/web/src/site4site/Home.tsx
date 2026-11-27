// Home: the building at night. Each window is a unit of the site; choosing one lights its bulb, then
// the unit opens. Phones see the building alone (the door is the way in); wide screens see it beside
// a smoked-glass intercom and the slogans the programmer on the roof is typing.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SITE_TEMPLATES } from "@rb/templates";
import deskArt from "./art/building-desk.svg?raw";
import deskWideArt from "./art/building-desk-wide.svg?raw";
import phoneArt from "./art/building-phone.svg?raw";
import { Icon, UNITS, unitByKey, type UnitKey } from "./units";
import "./site4site.css";
import "./home.css";

const fa = (n: number) => n.toLocaleString("fa-IR");
const WIDE = "(min-width: 1000px)";
/** How long the light shows before the unit opens. */
const OPEN_DELAY = 650;

function useWide() {
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches);
  useEffect(() => {
    const q = window.matchMedia(WIDE);
    const on = () => setWide(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return wide;
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Lights a unit on the drawing (its window, its label and, on wide screens, the stairwell of its
 * floor) and opens its page after a moment. Returns `light` for clicks and `hover` for the intercom.
 */
function useUnits(root: React.RefObject<HTMLDivElement | null>) {
  const navigate = useNavigate();
  const busy = useRef(false);

  const mark = useCallback(
    (key: UnitKey | null, cls: "on" | "hover") => {
      const el = root.current;
      if (!el) return;
      el.querySelectorAll(`.${cls}`).forEach((n) => n.classList.remove(cls));
      if (!key) return;
      el.querySelectorAll(`[data-unit="${key}"]`).forEach((n) => n.classList.add(cls));
      el.querySelectorAll(`.st[data-floor="${unitByKey(key).floor}"]`).forEach((n) => n.classList.add(cls));
    },
    [root],
  );

  const light = useCallback(
    (key: UnitKey) => {
      if (busy.current) return;
      busy.current = true;
      mark(key, "on");
      window.setTimeout(() => navigate(unitByKey(key).path), reduced() ? 0 : OPEN_DELAY);
    },
    [mark, navigate],
  );

  // Clicks on the drawing: any element inside a unit's group opens that unit.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      const unit = (e.target as Element).closest("[data-unit]")?.getAttribute("data-unit") as UnitKey | null;
      if (unit) light(unit);
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [root, light]);

  return { light, hover: (key: UnitKey | null) => mark(key, "hover") };
}

/** Links to every unit for keyboards and screen readers; they show when focused. */
function SkipLinks() {
  return (
    <nav className="s4-skip" aria-label="واحدهای ساختمان">
      {UNITS.map((u) => (
        <Link key={u.key} to={u.path}>
          {u.label}
        </Link>
      ))}
      <Link to="/login">ورود / ثبت‌نام</Link>
    </nav>
  );
}

export function Home() {
  const wide = useWide();
  useEffect(() => {
    document.title = "site4site | سایت آماده با پنل مدیریت";
  }, []);
  return wide ? <DeskHome /> : <PhoneHome />;
}

function PhoneHome() {
  const root = useRef<HTMLDivElement>(null);
  useUnits(root);
  return (
    <div className="s4 s4-home-phone" dir="rtl">
      <h1 className="s4-sr">site4site؛ سایت آماده با پنل مدیریت برای کسب‌وکار شما</h1>
      <SkipLinks />
      <div className="s4-art-wrap">
        <div ref={root} className="s4-art" dangerouslySetInnerHTML={{ __html: phoneArt }} />
        {/* the entrance door of the drawing (its plate says ورود) */}
        <Link to="/login" className="s4-door" aria-label="ورود / ثبت‌نام" />
      </div>
    </div>
  );
}

const SLIDES = [
  {
    kicker: "سایتی برای ساختن سایت شما",
    title: ["سایت کسب‌وکارت را ", "در چند روز", " تحویل بگیر"],
    text: "قالب را انتخاب کن، بقیه با ما؛ از شخصی‌سازی تا تحویل. فروشگاه، رزرو آنلاین، سایت شخصی و رزومه، همه با پنل مدیریت فارسی.",
  },
  {
    kicker: "اول امتحان کن، بعد سفارش بده",
    title: ["هر قالب را ", "با پنل مدیریتش", " امتحان کن"],
    text: "محصول اضافه کن، سفارش و نوبت ببین، ظاهر را عوض کن؛ وقتی پسندیدی، همان را سفارش بده.",
  },
  {
    kicker: `${fa(SITE_TEMPLATES.length)} قالب آماده`,
    title: ["از ", "فروشگاه", " تا رزرو آنلاین"],
    text: "کافه، آرایشگاه، کتاب‌فروشی، اتاق فرار، مطب و…؛ قالب کسب‌وکارت احتمالاً همین‌جاست.",
  },
];

const ROWS: [UnitKey, UnitKey][] = [
  ["support", "contact"],
  ["about", "pricing"],
  ["blog", "templates"],
];

function DeskHome() {
  const root = useRef<HTMLDivElement>(null);
  const { light, hover } = useUnits(root);
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [pressed, setPressed] = useState<string | null>(null);
  const [{ k, w }, setFit] = useState({ k: 1, w: 1440 });

  // The scene is drawn for 1440 × 900 and scaled to the window.
  useEffect(() => {
    // Scaled by whichever side is tighter; a wider window gets a wider stage (not empty bands at the sides).
    const fit = () => {
      const k = Math.min(window.innerWidth / 1440, window.innerHeight / 900);
      setFit({ k, w: Math.max(1440, window.innerWidth / k) });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    if (reduced()) return;
    const t = window.setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 7000);
    return () => window.clearInterval(t);
  }, []);

  const press = (key: UnitKey) => {
    setPressed(key);
    light(key);
  };
  const enter = (which: "login" | "register") => {
    setPressed(which);
    window.setTimeout(() => navigate("/login"), reduced() ? 0 : 350);
  };

  const s = SLIDES[slide]!;
  const card = (key: UnitKey) => {
    const u = unitByKey(key);
    const state = pressed === key ? "on" : key === "support" ? "live" : "";
    return { u, state };
  };

  // On a wide stage the parts grow with it: a wider drawing of the building (more room per window)
  // and a wider intercom and slogan; f is how much wider than the 1440 design, capped.
  const f = Math.min(1.3, w / 1440);
  const wideBld = f >= 1.06; // a 16:9 screen gives a 1600-wide stage
  const bw = wideBld ? (870 * 666) / 986 : 482;

  return (
    <div className="s4 s4-home-desk" dir="rtl" style={{ "--k": k, "--w": `${w}px`, "--f": f, "--bw": `${bw}px` } as CSSProperties}>
      <h1 className="s4-sr">site4site؛ سایت آماده با پنل مدیریت برای کسب‌وکار شما</h1>
      <SkipLinks />
      <div className="s4-stage">
        <span className="s4-moon" aria-hidden="true">
          <svg viewBox="-22 -22 44 44" width="44" height="44">
            <circle r="22" fill="#FBE6C0" />
            <g fill="none" stroke="#D9BE8E" strokeOpacity=".38" strokeWidth=".8">
              <line x1="-22" y1="0" x2="22" y2="0" />
              <path d="M-19 -10.5 Q0 -6.5 19 -10.5 M-19 10.5 Q0 14.5 19 10.5" />
              <line x1="0" y1="-22" x2="0" y2="22" />
              <ellipse rx="9" ry="22" />
              <ellipse rx="16.5" ry="22" />
            </g>
            <circle cx="-7" cy="-8" r="2.4" fill="#E8CFA2" opacity=".55" />
            <circle cx="8" cy="9" r="1.8" fill="#E8CFA2" opacity=".5" />
          </svg>
        </span>
        {[
          [40, 300],
          [110, 560],
          [30, 700],
          [70, 860],
          [170, 700],
          [20, 1000],
          [220, 1360],
          [300, 620],
        ].map(([top, left], i) => (
          <span key={i} className="s4-star" style={{ top, left }} />
        ))}
        <svg className="s4-city" viewBox="0 0 320 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 200V90h50V50h40v60h40V30h60v80h40V70h50v130z" fill="#2B2547" opacity=".85" />
          <g fill="#F2C27E" opacity=".35">
            <rect x="64" y="70" width="6" height="8" />
            <rect x="152" y="50" width="6" height="8" />
            <rect x="250" y="96" width="6" height="8" />
          </g>
        </svg>

        <div ref={root} className="s4-bld" dangerouslySetInnerHTML={{ __html: wideBld ? deskWideArt : deskArt }} />

        <div className="s4-say" aria-live="polite">
          <small>{s.kicker}</small>
          <p className="s4-say-title" key={slide}>
            {s.title[0]}
            <span className="mark">{s.title[1]}</span>
            {s.title[2]}
            <span className="caret" aria-hidden="true" />
          </p>
          <p>{s.text}</p>
          <ul className="s4-say-chips">
            <li>{fa(SITE_TEMPLATES.length)}+ قالب آماده</li>
            <li>تحویل در چند روز</li>
            <li>امتحان رایگان با پنل</li>
          </ul>
          <div className="s4-say-dots" role="tablist" aria-label="جمله‌ها">
            {SLIDES.map((_, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === slide} aria-label={`جمله‌ی ${fa(i + 1)}`} onClick={() => setSlide(i)} />
            ))}
          </div>
        </div>

        <div className="s4-gate">
          <span className="s4-lamp" aria-hidden="true" />
          <div className="s4-ip" role="group" aria-label="آیفون ساختمان">
            <span className="screw s1" />
            <span className="screw s2" />
            <span className="screw s3" />
            <span className="screw s4s" />
            <div className="spk" aria-hidden="true">
              <i />
            </div>
            {ROWS.map(([a, b]) => {
              const A = card(a);
              const B = card(b);
              return (
                <div className="row" key={a}>
                  <button
                    type="button"
                    className={`slot ${A.state}`}
                    onClick={() => press(a)}
                    onMouseEnter={() => hover(a)}
                    onMouseLeave={() => hover(null)}
                    onFocus={() => hover(a)}
                    onBlur={() => hover(null)}
                  >
                    <span className="card">
                      <svg viewBox="-12 -12 24 24" aria-hidden="true">
                        <path d={A.u.icon} />
                      </svg>
                      {A.u.label}
                      <small>{A.u.plate.replace("واحد ", "")}</small>
                    </span>
                  </button>
                  <span className={`key ${A.state}`} aria-hidden="true">
                    <i />
                  </span>
                  <span className={`key ${B.state}`} aria-hidden="true">
                    <i />
                  </span>
                  <button
                    type="button"
                    className={`slot ${B.state}`}
                    onClick={() => press(b)}
                    onMouseEnter={() => hover(b)}
                    onMouseLeave={() => hover(null)}
                    onFocus={() => hover(b)}
                    onBlur={() => hover(null)}
                  >
                    <span className="card">
                      <svg viewBox="-12 -12 24 24" aria-hidden="true">
                        <path d={B.u.icon} />
                      </svg>
                      {B.u.label}
                      <small>{B.u.plate.replace("واحد ", "")}</small>
                    </span>
                  </button>
                </div>
              );
            })}
            <div className="row">
              <button type="button" className={`slot acc ${pressed === "login" ? "on" : ""}`} onClick={() => enter("login")}>
                <span className="card">
                  <Icon name="login" />
                  ورود
                </span>
              </button>
              <span className="key acc" aria-hidden="true">
                <i />
              </span>
              <span className="key acc" aria-hidden="true">
                <i />
              </span>
              <button type="button" className={`slot acc ${pressed === "register" ? "on" : ""}`} onClick={() => enter("register")}>
                <span className="card">
                  <Icon name="register" />
                  ثبت‌نام
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="s4-walk" aria-hidden="true" />
    </div>
  );
}
