// Public home page: headline, calls to action and a carousel of products.

import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../landing.css";
import { PRODUCTS } from "./products";
import { SiteHeader } from "./SiteHeader";

const AUTO_ADVANCE_MS = 3500;

export function Landing() {
  return (
    <div className="lp" dir="rtl">
      <SiteHeader />
      <section className="lp-hero">
        <h1>
          تو فقط بگو چی می‌خوای.
          <br />
          سایتت <span className="soft">خودکار</span> ساخته می‌شه.
        </h1>
        <div className="points">
          <span>رزومه و سایت در چند دقیقه</span>
          <span>دستیار هوشمند فارسی</span>
          <span>پرداخت ریالی و بی‌دردسر</span>
          <span>بدون برنامه‌نویسی و طراح</span>
        </div>
        <div className="actions">
          <Link className="lp-btn dark" to="/resume">
            رایگان شروع کن
          </Link>
          <Link className="lp-btn light" to="/soon/consult">
            مشاوره‌ی رایگان
          </Link>
        </div>
        <div className="note">بدون نیاز به کارت بانکی</div>
      </section>
      <ProductCarousel />
    </div>
  );
}

/** Advances one card every few seconds; pauses on hover or touch, and when motion is reduced. */
function ProductCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const step = () => (track.current?.querySelector<HTMLElement>(".lp-card")?.offsetWidth ?? 360) + 16;
  // In RTL, scrollLeft runs from 0 toward negative values, so "next" moves left.
  const next = () => {
    const el = track.current;
    if (!el) return;
    const atEnd = Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 4;
    if (atEnd) el.scrollTo({ left: 0 });
    else el.scrollBy({ left: -step() });
  };
  const prev = () => track.current?.scrollBy({ left: step() });

  const restart = () => {
    clearInterval(timer.current);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setInterval(() => {
      if (!paused.current && !document.hidden) next();
    }, AUTO_ADVANCE_MS);
  };

  useEffect(() => {
    restart();
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pause = (value: boolean) => () => {
    paused.current = value;
  };

  return (
    <section
      className="carousel"
      aria-label="محصولات"
      onMouseEnter={pause(true)}
      onMouseLeave={pause(false)}
      onTouchStart={pause(true)}
      onTouchEnd={pause(false)}
    >
      <button className="arrow prev" type="button" aria-label="قبلی" onClick={() => (prev(), restart())}>
        →
      </button>
      <button className="arrow next" type="button" aria-label="بعدی" onClick={() => (next(), restart())}>
        ←
      </button>
      <div className="cards" ref={track}>
        {PRODUCTS.map((p) => (
          <Link key={p.key} className="lp-card" to={p.href}>
            {p.art}
            <h3>{p.title}</h3>
            <p>{p.subtitle}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
