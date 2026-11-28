// Contact (unit 32): the phone, Telegram and Instagram of site4site as three brass plates, and the way to
// a written question (a support ticket).

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHead, UnitPage } from "./Shell";
import { CONTACT, CONTACT_LINKS, Icon, unitByKey, type IconName } from "./units";
import "./pages.css";

const WAYS: { icon: IconName; title: string; value: string; note: string; href: string; out?: boolean }[] = [
  { icon: "contact", title: "تلفن", value: CONTACT.phone.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3"), note: "در ساعت‌های کاری جواب می‌دهیم.", href: CONTACT_LINKS.phone },
  { icon: "telegram", title: "تلگرام", value: `@${CONTACT.telegram}`, note: "پیام بدهید؛ زود جواب می‌گیرید.", href: CONTACT_LINKS.telegram, out: true },
  { icon: "instagram", title: "اینستاگرام", value: CONTACT.instagram, note: "نمونه‌کارها و خبرهای تازه.", href: CONTACT_LINKS.instagram, out: true },
];

export function Contact() {
  const u = unitByKey("contact");
  useEffect(() => {
    document.title = "تماس با ما | site4site";
  }, []);
  return (
    <UnitPage current="contact">
      <PageHead plate={u.plate} title="تماس با ما" sub="هر راهی که برایتان راحت‌تر است؛ ما همین‌جا هستیم." />

      <div className="ct-ways">
        {WAYS.map((w) => (
          <a key={w.title} href={w.href} className="ct-way" {...(w.out ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            <span className="pr-ring" aria-hidden="true">
              <Icon name={w.icon} />
            </span>
            <b>{w.title}</b>
            <span className="v ltr">{w.value}</span>
            <small>{w.note}</small>
          </a>
        ))}
      </div>

      <div className="tp-more ct-more">
        <div>
          <b>سؤالتان نوشتنی است؟</b>
          <p>برای پیگیری سفارش یا مشکل فنی، تیکت بفرستید تا پاسخ همیشه در حسابتان بماند.</p>
        </div>
        <Link to="/support" className="s4-btn dark">
          ارسال تیکت
        </Link>
      </div>
    </UnitPage>
  );
}
