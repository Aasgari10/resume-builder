// Products shown on the landing page. Live products link to their builder;
// the rest open a "coming soon" page that collects interest.

import type { ReactNode } from "react";

export type ProductKey = "resume" | "site" | "shop" | "salon" | "clinic" | "cafe";

export type Product = { key: ProductKey; title: string; subtitle: string; href: string; art: ReactNode };

const Line = ({ w }: { w?: string }) => <i className="ln" style={w ? { width: w } : undefined} />;

export const PRODUCTS: Product[] = [
  {
    key: "resume",
    title: "رزومه",
    subtitle: "ده قالب حرفه‌ای · دانلود پی‌دی‌اف",
    href: "/resume",
    art: (
      <div className="art a-resume">
        <div className="sheet">
          <div className="side">
            <b />
            <Line />
            <Line />
            <Line />
          </div>
          <div className="main">
            <div className="t" />
            <Line w="50%" />
            <div className="h" />
            <Line />
            <Line />
            <Line w="70%" />
            <div className="h" />
            <Line />
            <Line w="60%" />
          </div>
        </div>
        <span className="pdf">PDF</span>
      </div>
    ),
  },
  {
    key: "site",
    title: "سایت شخصی",
    subtitle: "نمونه‌کار و رزومه روی آدرس اختصاصی",
    href: "/resume",
    art: (
      <div className="art a-site">
        <span className="addr">sara.example.ir</span>
        <div className="sheet">
          <div className="bar">
            <i />
            <i />
            <i />
          </div>
          <div className="body">
            <b />
            <div>
              <div className="t" />
              <Line />
              <Line w="60%" />
            </div>
          </div>
          <div className="tiles">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "shop",
    title: "فروشگاه اینترنتی",
    subtitle: "محصولات، سبد خرید و درگاه پرداخت",
    href: "/soon/shop",
    art: (
      <div className="art a-shop">
        <span className="cart">
          🛒<sup>۳</sup>
        </span>
        <div className="phone">
          <div className="scr">
            <div className="top" />
            {["#FCE3D6", "#E3EEF9", "#E7F4E8", "#F6E7F2"].map((c) => (
              <div className="item" key={c}>
                <b style={{ background: c }} />
                <i />
                <s />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "salon",
    title: "آرایشگاه و سالن زیبایی",
    subtitle: "معرفی خدمات و نوبت‌دهی آنلاین",
    href: "/soon/salon",
    art: (
      <div className="art a-salon">
        <div className="phone">
          <div className="scr">
            <div className="cover" />
            <div className="t" />
            <div className="days">
              <span />
              <span className="on" />
              <span />
              <span />
            </div>
            <div className="slots">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} />
              ))}
            </div>
            <div className="go" />
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "clinic",
    title: "مطب و کلینیک",
    subtitle: "معرفی پزشک، ساعت کاری و رزرو",
    href: "/soon/clinic",
    art: (
      <div className="art a-clinic">
        <div className="sheet">
          <div className="doc">
            <b />
            <div>
              <div className="t" />
              <span className="stars">★★★★★</span>
            </div>
          </div>
          <div className="appt">
            <i />
            <s />
          </div>
          <div className="appt">
            <i style={{ width: 50 }} />
            <s style={{ background: "#CFE0F0" }} />
          </div>
          <Line />
          <Line w="70%" />
        </div>
      </div>
    ),
  },
  {
    key: "cafe",
    title: "کافه و رستوران",
    subtitle: "منوی دیجیتال با کد کیوآر",
    href: "/soon/cafe",
    art: (
      <div className="art a-cafe">
        <div className="sheet">
          <div className="t" />
          {[46, 36, 46, 56, 30].map((w, i) => (
            <div className="lp-row" key={i}>
              <b style={{ width: w }} />
              <i />
              <s />
            </div>
          ))}
        </div>
        <span className="qr" />
      </div>
    ),
  },
];
