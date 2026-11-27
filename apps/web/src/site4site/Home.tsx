// Home: the building at night. Each window is a unit of the site; choosing one lights its bulb, then
// the unit opens. Phones see the building alone (the door is the way in); wide screens see it beside
// a smoked-glass intercom and the slogans the programmer on the roof is typing.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SITE_TEMPLATES } from "@rb/templates";
import deskArt from "./art/building-desk-floors.svg?raw";
import groundArt from "./art/ground.svg?raw";
import roofArt from "./art/roof-desk.svg?raw";
import phoneArt from "./art/building-phone.svg?raw";
import { Icon, UNITS, unitByKey, type UnitKey } from "./units";
import "./site4site.css";
import "./home.css";

const fa = (n: number) => n.toLocaleString("fa-IR");
const WIDE = "(min-width: 1000px)";
/** How long the light shows before the unit opens. */
const OPEN_DELAY = 650;
/** Design width of the wide-screen scene (the height is 900). */
const STAGE = 1840;
/**
 * Left edges on the stage: the building (its three floors, 840 tall, 677 wide), then the wall right against
 * its side: the slogan board, the programmer and the neon stand on it; low on it, from the building, one tall
 * engine-room window, the entrance door and the intercom, their tops level.
 * Matches home.css.
 */
const LAYOUT = { bld: 0, gate: 677 - 13 };

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

/** Stars spread over the whole stage, the same on every visit. */
function stars(width: number): [number, number][] {
  const out: [number, number][] = [];
  let a = 9;
  const next = () => ((a = (a * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < Math.round(width / 150); i++) out.push([Math.round(next() * 330), Math.round(next() * width)]);
  return out;
}

/** A part of a drawing: the same SVG shown through another viewBox (stretched to its box when `fill`). */
const part = (svg: string, viewBox: string, fill = false) =>
  svg.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}" preserveAspectRatio="${fill ? "none" : "xMidYMax meet"}"`);

/** The entrance built into the wall: a stone surround, a canopy, the brass plate, two wall lamps and a double door. */
function EntryDoor() {
  return (
    <svg viewBox="0 28 290 370" preserveAspectRatio="none" aria-hidden="true">
      <circle cx="14" cy="168" r="34" fill="#FFD99A" opacity=".16" />
      <circle cx="276" cy="168" r="34" fill="#FFD99A" opacity=".16" />
      <rect x="28" y="52" width="234" height="346" rx="4" fill="#4e4868" />
      <rect x="28" y="52" width="234" height="346" rx="4" fill="none" stroke="#6a6480" strokeWidth="2" />
      <rect x="44" y="68" width="202" height="330" fill="#1e1a30" />
      <path d="M12 30 H278 L262 56 H28 Z" fill="#3a3350" />
      <path d="M12 30 H278" stroke="#7a7298" strokeWidth="3" />
      <rect x="28" y="56" width="234" height="3" fill="#FFD99A" opacity=".35" />
      <rect x="98" y="80" width="94" height="32" rx="5" fill="#1a1530" stroke="#F4BE6A" strokeWidth="1.6" />
      <text x="145" y="102" textAnchor="middle" fontSize="18" fontWeight="700" fill="#F4BE6A">
        ورود
      </text>
      {[58, 147].map((x) => (
        <g key={x}>
          <rect x={x} y="124" width="85" height="262" rx="2" fill="#3a2f52" />
          <rect x={x + 10} y="136" width="65" height="112" rx="2" fill="#F2C27E" opacity=".2" />
          <path d={`M${x + 42.5} 136 V248 M${x + 10} 192 H${x + 75}`} stroke="#3a2f52" strokeWidth="3" />
          <rect x={x + 10} y="266" width="65" height="104" rx="2" fill="none" stroke="#4d4170" strokeWidth="2" />
        </g>
      ))}
      <circle cx="137" cy="258" r="3.5" fill="#F4BE6A" />
      <circle cx="153" cy="258" r="3.5" fill="#F4BE6A" />
      <rect x="32" y="386" width="226" height="12" fill="#5a5470" />
      {[14, 276].map((x) => (
        <g key={x}>
          <rect x={x - 5} y="150" width="10" height="6" rx="1" fill="#2c2546" />
          <rect x={x - 6} y="156" width="12" height="22" rx="4" fill="#FFD99A" />
        </g>
      ))}
    </svg>
  );
}

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
  const [{ k, w }, setFit] = useState({ k: 1, w: STAGE });

  // The scene is drawn for 1840 × 900 and scaled to fit the window, so it never scrolls. A window wider
  // than that shape gets a wider stage: the building and the intercom keep their size in the middle and
  // the street continues to both sides (neighbouring buildings on the left, the intercom's wall on the right).
  useEffect(() => {
    const fit = () => {
      const k = Math.min(window.innerWidth / STAGE, window.innerHeight / 900);
      setFit({ k, w: Math.max(STAGE, window.innerWidth / k) });
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

  return (
    <div className="s4 s4-home-desk" dir="rtl" style={{ "--k": k, "--w": `${w}px`, "--off": "0px" } as CSSProperties}>
      <h1 className="s4-sr">site4site؛ سایت آماده با پنل مدیریت برای کسب‌وکار شما</h1>
      <SkipLinks />
      <div className="s4-stage">
        {stars(w).map(([top, left], i) => (
          <span key={i} className="s4-star" style={{ top, left }} />
        ))}
        <div className="s4-core">
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
        <div ref={root} className="s4-bld" dangerouslySetInnerHTML={{ __html: deskArt }} />
        <div className="s4-entry">
          <Link to="/login" className="s4-entry-door" aria-label="ورود / ثبت‌نام">
            <EntryDoor />
          </Link>
          {/* one tall window of the engine room, holding what both ground-floor windows held */}
          <div className="s4-entry-glass" aria-hidden="true">
            <span dangerouslySetInnerHTML={{ __html: part(groundArt, "44 704 96 108", true) }} />
            <span dangerouslySetInnerHTML={{ __html: part(groundArt, "250 704 96 108", true) }} />
          </div>
        </div>
        {/* the programmer and the neon sign, on top of the intercom's wall */}
        {/* the programmer and the neon sign together on the wall's cornice */}
        <div className="s4-roof" aria-hidden="true" dangerouslySetInnerHTML={{ __html: roofArt }} />

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
      </div>
      <div className="s4-walk" aria-hidden="true" />
    </div>
  );
}
