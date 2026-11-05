// Layout of the resume section: a side menu (on the right, for RTL) and the page content.
// Template browsing is public; personal pages require sign-in.

import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { PDF_TEMPLATES, SITE_TEMPLATES } from "@rb/templates";
import { useAuth } from "../auth";
import "./hub.css";
import { Icon, type IconName } from "./Icons";

const fa = (n: number) => n.toLocaleString("fa-IR");

export const STYLE_FILTERS: { key: string; label: string; icon: IconName }[] = [
  { key: "formal", label: "ساده و رسمی", icon: "briefcase" },
  { key: "creative", label: "رنگی و خلاق", icon: "palette" },
  { key: "sidebar", label: "ستون‌دار", icon: "columns" },
  { key: "dark", label: "تیره", icon: "moon" },
  { key: "photo", label: "با عکس", icon: "user" },
];

const SOON: { label: string; icon: IconName }[] = [
  { label: "نامه‌ی همکاری", icon: "mail" },
  { label: "بررسی رزومه با هوش مصنوعی", icon: "sparkles" },
  { label: "ساخت از روی رزومه‌ی قدیمی", icon: "upload" },
];

export function ResumeHub({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const style = params.get("style");
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => setOpen(false), [pathname, style]);

  const count = (tag?: string) => (tag ? PDF_TEMPLATES.filter((t) => t.tags?.includes(tag as never)).length : PDF_TEMPLATES.length);
  const onGallery = pathname === "/resume";

  return (
    <div className="hub" dir="rtl">
      <button className="hub-menu-toggle" type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Icon name="menu" />
        منو
      </button>

      <aside className={`hub-side ${open ? "open" : ""}`}>
        <Link to="/" className="hub-brand">
          <span className="hub-logo">س</span>
          سایت‌ساز
        </Link>

        <p className="hub-label">رزومه‌ساز</p>
        <nav className="hub-nav">
          <Link to="/resume" className={onGallery && !style ? "active" : ""}>
            <Icon name="grid" />
            قالب‌های رزومه
            <span className="hub-count">{fa(count())}</span>
          </Link>
          <NavLink to="/resume/sites" end>
            <Icon name="globe" />
            قالب‌های سایت
            <span className="hub-count">{fa(SITE_TEMPLATES.length)}</span>
          </NavLink>
          <NavLink to="/resume/mine" end>
            <Icon name="file" />
            رزومه‌های من
          </NavLink>
          <NavLink to="/resume/mine?sites=1" className={() => (pathname === "/resume/mine" && params.get("sites") ? "active" : "")}>
            <Icon name="home" />
            سایت‌های منتشرشده
          </NavLink>
        </nav>

        <p className="hub-label">سبک رزومه</p>
        <nav className="hub-nav">
          {STYLE_FILTERS.map((f) => (
            <Link key={f.key} to={`/resume?style=${f.key}`} className={onGallery && style === f.key ? "active" : ""}>
              <Icon name={f.icon} />
              {f.label}
              <span className="hub-count">{fa(count(f.key))}</span>
            </Link>
          ))}
        </nav>

        <p className="hub-label">به‌زودی</p>
        <nav className="hub-nav">
          {SOON.map((s) => (
            <span key={s.label} className="disabled" aria-disabled="true">
              <Icon name={s.icon} />
              {s.label}
              <span className="hub-soon">به‌زودی</span>
            </span>
          ))}
        </nav>

        <nav className="hub-nav hub-bottom">
          <Link to="/soon/consult">
            <Icon name="help" />
            راهنما و پشتیبانی
          </Link>
          {user?.role === "ADMIN" && (
            <Link to="/admin">
              <Icon name="shield" />
              پنل مدیریت
            </Link>
          )}
          {user ? (
            <button type="button" onClick={() => void logout()}>
              <Icon name="logout" />
              خروج
              <span className="hub-phone ltr">{user.phone}</span>
            </button>
          ) : (
            <Link to="/login" state={{ from: pathname }}>
              <Icon name="login" />
              ورود / ثبت‌نام
            </Link>
          )}
        </nav>
      </aside>

      {open && <div className="hub-backdrop" onClick={() => setOpen(false)} />}
      <main className="hub-main">{children}</main>
    </div>
  );
}
