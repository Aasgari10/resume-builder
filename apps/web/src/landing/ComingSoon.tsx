// Placeholder for products that are not built yet. Collects phone numbers of interested visitors,
// which also shows which product to build next.

import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, api, type WaitlistProduct } from "../api";
import "../landing.css";
import { SiteHeader } from "./SiteHeader";

const COPY: Record<WaitlistProduct, { title: string; text: string }> = {
  site: { title: "سایت‌ساز", text: "سایت کامل برای هر کسب‌وکاری، فقط با پر کردن چند فرم." },
  shop: { title: "فروشگاه‌ساز", text: "فروشگاه اینترنتی با محصولات، سبد خرید و درگاه پرداخت ریالی." },
  salon: { title: "سایت آرایشگاه و سالن زیبایی", text: "معرفی خدمات، نمونه‌کارها و نوبت‌دهی آنلاین مشتری‌ها." },
  clinic: { title: "سایت مطب و کلینیک", text: "معرفی پزشک، ساعت کاری، آدرس و رزرو نوبت." },
  cafe: { title: "سایت کافه و رستوران", text: "منوی دیجیتال با کد کیوآر و معرفی فضا و ساعت کاری." },
  business: { title: "برای کسب‌وکارها", text: "سایت‌ساز مخصوص صنف‌ها، با قالب‌ها و فرم‌های مخصوص هر کسب‌وکار." },
  pricing: { title: "قیمت‌ها", text: "در دوره‌ی راه‌اندازی، همه‌ی امکانات رزومه‌ساز رایگان است. تعرفه‌ها به‌زودی اعلام می‌شوند." },
  consult: { title: "مشاوره‌ی رایگان", text: "شماره‌ات را بگذار تا برای انتخاب بهترین قالب و راه‌اندازی سایتت با تو تماس بگیریم." },
};

export function ComingSoon() {
  const { product } = useParams<{ product: string }>();
  const key = (product && product in COPY ? product : "business") as WaitlistProduct;
  const copy = COPY[key];
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setState(null);
    try {
      await api.joinWaitlist(key, phone);
      setState({ ok: true, text: "ثبت شد! به محض آماده شدن به تو خبر می‌دهیم." });
      setPhone("");
    } catch (err) {
      setState({ ok: false, text: err instanceof ApiError ? err.message : "خطای ناشناخته" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lp" dir="rtl">
      <SiteHeader />
      <main className="soon">
        <div className="soon-box">
          <span className="soon-badge">{key === "consult" ? "تماس با ما" : "به‌زودی"}</span>
          <h1>{copy.title}</h1>
          <p>{copy.text}</p>
          <form onSubmit={submit}>
            <input
              className="ltr"
              inputMode="tel"
              placeholder="09121234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-label="شماره موبایل"
            />
            <button className="lp-btn dark" disabled={busy || !phone.trim()}>
              {busy ? "…" : key === "consult" ? "درخواست تماس" : "وقتی آماده شد خبرم کن"}
            </button>
          </form>
          {state && <p className={`msg ${state.ok ? "" : "error"}`}>{state.text}</p>}
          <Link to="/" className="back">
            → بازگشت به صفحه‌ی اصلی
          </Link>
        </div>
      </main>
    </div>
  );
}
