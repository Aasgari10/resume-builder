// The frame every inner page of the building shares: the top menu (unit icons; a drawer on phones),
// the bulb-and-plate header, and the sidewalk with the footer under the page.

import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import phoneArt from "./art/building-phone.svg?raw";
import { CONTACT_LINKS, Icon, UNITS, type UnitKey } from "./units";
import "./site4site.css";

function Logo() {
  return (
    <Link to="/" className="s4-logo" aria-label="site4site، صفحه‌ی اصلی">
      site<b>4</b>site
    </Link>
  );
}

/** Where the account button leads: the login page, or the customer's own dashboard once signed in. */
function AccountLink({ className }: { className: string }) {
  const { user } = useAuth();
  return user ? (
    <Link to="/account" className={className}>
      <Icon name="register" />
      حساب من
    </Link>
  ) : (
    <Link to="/login" className={className}>
      <Icon name="login" />
      ورود / ثبت‌نام
    </Link>
  );
}

function TopBar({ current }: { current?: UnitKey }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const here = UNITS.find((u) => u.key === current);

  return (
    <>
      <header className="s4-bar">
        <Logo />
        <nav className="s4-nav" aria-label="واحدهای ساختمان">
          {UNITS.map((u) => (
            <NavLink key={u.key} to={u.path} className={({ isActive }) => (isActive || u.key === current ? "on" : "")}>
              <svg className="s4-icon" viewBox="-12 -12 24 24" aria-hidden="true">
                <path d={u.icon} />
              </svg>
              <span>{u.label}</span>
            </NavLink>
          ))}
        </nav>
        <AccountLink className="s4-login" />
        {here && (
          <span className="s4-here" aria-hidden="true">
            <svg className="s4-icon" viewBox="-12 -12 24 24">
              <path d={here.icon} />
            </svg>
            {here.label}
          </span>
        )}
        <button type="button" className="s4-menu-btn" onClick={() => setOpen(true)} aria-label="منو" aria-expanded={open}>
          <Icon name="menu" />
        </button>
      </header>
      {/* outside the header: its backdrop blur would pin the drawer inside the bar */}
      {open && (
        <>
          <div className="s4-shade" onClick={() => setOpen(false)} />
          <div className="s4-drawer" role="dialog" aria-modal="true" aria-label="منو">
            <div className="s4-drawer-top">
              <Logo />
              <button type="button" className="s4-menu-btn" onClick={() => setOpen(false)} aria-label="بستن منو">
                <Icon name="close" />
              </button>
            </div>
            {UNITS.map((u) => (
              <NavLink key={u.key} to={u.path} className={({ isActive }) => (isActive || u.key === current ? "on" : "")}>
                <svg className="s4-icon" viewBox="-12 -12 24 24" aria-hidden="true">
                  <path d={u.icon} />
                </svg>
                {u.label}
              </NavLink>
            ))}
            <AccountLink className="s4-drawer-login" />
            <Link to="/" className="s4-drawer-home">
              بازگشت به ساختمان
            </Link>
          </div>
        </>
      )}
    </>
  );
}

/** A crop of the phone building drawing (the programmer or the neon sign) for page headers. */
function Crop({ viewBox, className }: { viewBox: string; className: string }) {
  const svg = phoneArt
    .replace(/<svg [^>]*>/, `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`)
    .replace(/<rect[^>]*fill="url\(#sky\)"\/>/, "")
    .replace(/<circle[^>]*fill="url\(#moonGlow\)"\/>/, "")
    .replace(/<g fill="#FFF1DC">[\s\S]*?<\/g>/, "");
  return <span className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** The hanging bulb, the brass plate and the title; on wide screens the programmer and the neon stand beside it. */
export function PageHead({ plate, title, sub, sides = true }: { plate: string; title: string; sub?: string; sides?: boolean }) {
  return (
    <div className="s4-head">
      {sides && (
        <>
          <Crop viewBox="28 84 196 148" className="s4-head-prog" />
          <Crop viewBox="228 58 140 172" className="s4-head-neon" />
        </>
      )}
      <div className="s4-bulb" aria-hidden="true">
        <i />
      </div>
      <p className="s4-plate">{plate}</p>
      <h1>{title}</h1>
      {sub && <p className="s4-sub">{sub}</p>}
    </div>
  );
}

export function Footer() {
  return (
    <>
      <div className="s4-street" aria-hidden="true" />
      <footer className="s4-foot">
        <div className="s4-foot-in">
          <div className="s4-foot-brand">
            <Logo />
            <p>سایت آماده با پنل مدیریت، برای کسب‌وکارهای کوچک و بزرگ.</p>
            <div className="s4-soc">
              <a href={CONTACT_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام">
                <Icon name="instagram" />
              </a>
              <a href={CONTACT_LINKS.telegram} target="_blank" rel="noopener noreferrer" aria-label="تلگرام">
                <Icon name="telegram" />
              </a>
              <a href={CONTACT_LINKS.phone} aria-label="تماس تلفنی">
                <Icon name="contact" />
              </a>
            </div>
          </div>
          <div className="s4-foot-col">
            <b>ساختمان</b>
            {UNITS.slice(0, 4).map((u) => (
              <Link key={u.key} to={u.path}>
                {u.label}
              </Link>
            ))}
          </div>
          <div className="s4-foot-col">
            <b>کمک</b>
            {UNITS.slice(4).map((u) => (
              <Link key={u.key} to={u.path}>
                {u.label}
              </Link>
            ))}
            <Link to="/account/orders">سفارش‌های من</Link>
          </div>
          <div className="s4-foot-col">
            <b>اعتماد</b>
            <div className="s4-trust">
              <span>نماد اعتماد</span>
              <span>ساماندهی</span>
            </div>
          </div>
        </div>
        <p className="s4-copy">© ۱۴۰۵ site4site · همه‌ی حقوق محفوظ است</p>
      </footer>
    </>
  );
}

/** An inner page of the building: menu, the page itself, sidewalk and footer. */
export function UnitPage({ current, children }: { current?: UnitKey; children: ReactNode }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [current]);
  return (
    <div className="s4" dir="rtl">
      <TopBar current={current} />
      <main className="s4-room">{children}</main>
      <Footer />
    </div>
  );
}
