// Public header for the landing and "coming soon" pages: products, then account actions.
// Signed-in users get links to their resumes and, for administrators, the admin panel.

import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export function SiteHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="lp-nav">
      <Link to="/" className="logo" aria-label="صفحه‌ی اصلی">
        س
      </Link>
      <Link to="/resume">رزومه‌ساز</Link>
      <Link to="/soon/site">سایت‌ساز</Link>
      <Link to="/soon/shop">فروشگاه‌ساز</Link>
      <Link to="/resume">قالب‌ها</Link>
      <Link to="/resume">دستیار هوشمند</Link>
      <span className="sep" />
      <Link to="/soon/business">برای کسب‌وکارها</Link>
      <Link to="/soon/pricing">قیمت‌ها</Link>
      <span className="lp-grow" />
      {user ? (
        <>
          {user.role === "ADMIN" && (
            <Link className="login" to="/admin">
              پنل مدیریت
            </Link>
          )}
          <button type="button" className="login" onClick={() => void logout()}>
            خروج
          </button>
          <Link className="signup" to="/dashboard">
            رزومه‌های من
          </Link>
        </>
      ) : (
        <>
          <Link className="login" to="/login">
            ورود
          </Link>
          <Link className="signup" to="/login">
            ساخت حساب رایگان
          </Link>
        </>
      )}
    </header>
  );
}
