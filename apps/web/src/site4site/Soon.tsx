// A unit of the building that is still being built (pricing, support, contact, blog): its header
// and a short note with the ways a visitor can already get help.

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHead, UnitPage } from "./Shell";
import { unitByKey, type UnitKey } from "./units";
import "./pages.css";

const NOTE: Partial<Record<UnitKey, string>> = {
  pricing: "تعرفه‌ها به‌زودی همین‌جا می‌آید. تا آن موقع قالب دلخواهتان را امتحان کنید و سفارش دهید؛ قیمت را بعد از بررسی طرحتان اعلام می‌کنیم.",
  support: "صفحه‌ی پشتیبانی در حال آماده شدن است. اگر سفارشی ثبت کرده‌اید، پیام‌هایتان را در «سفارش‌های من» بفرستید؛ همان‌جا جواب می‌دهیم.",
  contact: "راه‌های تماس به‌زودی این‌جا می‌آید. فعلاً می‌توانید از «سفارش‌های من» برایمان پیام بفرستید.",
  blog: "بلاگ به‌زودی با مطالبی درباره‌ی ساختن و رشد سایت کسب‌وکار باز می‌شود.",
};

export function Soon({ unit }: { unit: UnitKey }) {
  const u = unitByKey(unit);
  useEffect(() => {
    document.title = `${u.label} | site4site`;
  }, [u.label]);
  return (
    <UnitPage current={unit}>
      <PageHead plate={u.plate} title={u.label} sub="این واحد در حال آماده شدن است." />
      <div className="soon">
        <p>{NOTE[unit]}</p>
        <div className="acts">
          <Link to="/templates" className="s4-btn main">
            دیدن قالب‌ها
          </Link>
          <Link to="/resume/orders" className="s4-btn ghost">
            سفارش‌های من
          </Link>
        </div>
      </div>
    </UnitPage>
  );
}
