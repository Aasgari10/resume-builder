// The owner's inbox: what visitors sent through the forms of the published site — bookings (a salon
// appointment, a restaurant table), contact messages and newsletter sign-ups. Shown as a tab of the
// site manager, and on its own for website templates without a shop.

import { useEffect, useMemo, useState } from "react";
import { type SiteMessage, type SiteMessageKind, type SiteMessageStatus, type SiteMessages } from "../../api";
import { showNumber } from "./fields";
import { SelectAll, errorText, faDate, useSelection } from "./ShopOrders";
import { NeedsPublish } from "./ShopPeople";
import { useShopApi } from "./shopApi";

type View = "BOOKING" | "CONTACT" | "NEWSLETTER" | "TRASH";

const STATUS: Record<SiteMessageStatus, string> = { NEW: "جدید", SEEN: "دیده‌شده", CONFIRMED: "تأییدشده", DONE: "انجام‌شده", CANCELED: "لغوشده" };
const KIND_LABEL: Record<SiteMessageKind, string> = { BOOKING: "نوبت / رزرو", CONTACT: "پیام", NEWSLETTER: "خبرنامه" };

/** "yyyy-mm-dd" as a Persian date, or the text as it is. */
const shownDay = (d: string | null) => {
  if (!d) return "";
  const at = new Date(`${d}T12:00:00`);
  return Number.isNaN(at.getTime()) ? d : at.toLocaleDateString("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};
const today = () => new Date().toISOString().slice(0, 10);

export function SiteInbox({ resumeId, onChanged, bookings }: { resumeId?: string; onChanged?: () => void; bookings?: boolean }) {
  const api = useShopApi();
  const [view, setView] = useState<View>(bookings ? "BOOKING" : "CONTACT");
  const [data, setData] = useState<SiteMessages | null>(null);
  const [trash, setTrash] = useState<SiteMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [status, setStatus] = useState<"" | SiteMessageStatus>("");
  const [when, setWhen] = useState<"all" | "upcoming" | "today">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const sel = useSelection();

  const load = () => {
    if (!resumeId) return;
    setError(null);
    api.siteMessages(resumeId).then(setData, (e) => setError(errorText(e, "دریافت پیام‌ها ممکن نشد")));
    api.siteMessages(resumeId, true).then((r) => setTrash(r.messages), () => setTrash([]));
  };
  useEffect(load, [resumeId]);

  const all = view === "TRASH" ? (trash ?? []) : (data?.messages ?? []).filter((m) => m.kind === view);
  const shown = useMemo(() => {
    const words = q.trim().split(/\s+/).filter(Boolean);
    const now = today();
    return all
      .filter((m) => !status || m.status === status)
      .filter((m) => view !== "BOOKING" || when === "all" || (when === "today" ? m.date === now : (m.date ?? "") >= now))
      .filter((m) => words.every((w) => [m.name, m.phone, m.email, m.subject, m.text, m.service, m.code, m.ownerNote].some((x) => x?.includes(w))))
      .sort((a, b) => (view === "BOOKING" && when !== "all" ? `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`) : 0));
  }, [all, status, when, q, view]);

  if (!resumeId || error || !data) return <NeedsPublish resumeId={resumeId} error={error} loading={!data} />;

  const ids = shown.map((m) => m.id);
  const picked = ids.filter((id) => sel.has(id));
  const act = async (action: Parameters<typeof api.batchSiteMessages>[2], list = picked) => {
    if (!list.length) return;
    if (action === "purge" && !window.confirm(`${showNumber(list.length)} مورد برای همیشه پاک شود؟`)) return;
    try {
      const r = await api.batchSiteMessages(resumeId, list, action);
      setNote(`${showNumber(r.done)} مورد به‌روز شد.`);
      sel.setAll(list, false);
      load();
      onChanged?.();
    } catch (e) {
      setNote(errorText(e, "انجام نشد"));
    }
  };
  const patch = async (m: SiteMessage, change: Parameters<typeof api.updateSiteMessage>[2]) => {
    try {
      await api.updateSiteMessage(resumeId, m.id, change);
      load();
      onChanged?.();
    } catch (e) {
      setNote(errorText(e, "ذخیره نشد"));
    }
  };
  const emails = (data.messages ?? []).filter((m) => m.kind === "NEWSLETTER" && m.email).map((m) => m.email!);
  const csv = () => {
    const rows = [["ایمیل", "تاریخ عضویت"], ...data.messages.filter((m) => m.kind === "NEWSLETTER").map((m) => [m.email ?? "", m.createdAt.slice(0, 10)])];
    const blob = new Blob(["﻿" + rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "newsletter.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const counts = data.newCounts;
  const hasBookings = bookings || data.messages.some((m) => m.kind === "BOOKING");
  const tabs: [View, string, number?][] = [
    ...(hasBookings ? ([["BOOKING", "📅 نوبت‌ها و رزروها", counts.booking]] as [View, string, number][]) : []),
    ["CONTACT", "✉️ پیام‌ها", counts.contact],
    ["NEWSLETTER", "📰 خبرنامه", counts.newsletter],
    ["TRASH", "🗑 سطل زباله"],
  ];

  return (
    <div className="shm-inbox">
      <p className="muted">
        هر چه بازدیدکننده‌ها در فرم‌های سایت منتشرشده بفرستند — {hasBookings ? "درخواست نوبت یا رزرو میز، " : ""}پیام تماس و عضویت خبرنامه — این‌جا ثبت می‌شود. موارد حذف‌شده {showNumber(data.days)} روز در سطل زباله می‌مانند.
      </p>
      <nav className="shm-subtabs" role="tablist">
        {tabs.map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => {
              setView(id);
              setStatus("");
              setOpen(null);
            }}
          >
            {label}
            {n ? <i className="shm-count shm-new">{showNumber(n)}</i> : null}
          </button>
        ))}
      </nav>

      <div className="shm-toolbar">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو در نام، تلفن، ایمیل، متن یا کد…" aria-label="جستجو" />
        {view !== "NEWSLETTER" && view !== "TRASH" && (
          <select value={status} onChange={(e) => setStatus(e.target.value as SiteMessageStatus | "")} aria-label="وضعیت">
            <option value="">همه‌ی وضعیت‌ها</option>
            {(view === "BOOKING" ? (["NEW", "SEEN", "CONFIRMED", "DONE", "CANCELED"] as const) : (["NEW", "SEEN", "DONE"] as const)).map((s) => (
              <option key={s} value={s}>
                {STATUS[s]}
              </option>
            ))}
          </select>
        )}
        {view === "BOOKING" && (
          <select value={when} onChange={(e) => setWhen(e.target.value as typeof when)} aria-label="زمان">
            <option value="all">همه (تازه‌ترین درخواست بالا)</option>
            <option value="upcoming">نوبت‌های پیش رو (به ترتیب زمان)</option>
            <option value="today">نوبت‌های امروز</option>
          </select>
        )}
        {view === "NEWSLETTER" && emails.length > 0 && (
          <>
            <button type="button" className="btn ghost small" onClick={() => navigator.clipboard?.writeText(emails.join(", ")).then(() => setNote("ایمیل‌ها کپی شد."))}>
              کپی همه‌ی ایمیل‌ها
            </button>
            <button type="button" className="btn ghost small" onClick={csv}>
              دانلود فایل اکسل (CSV)
            </button>
          </>
        )}
      </div>

      {ids.length > 0 && (
        <div className="shm-batch">
          <SelectAll ids={ids} sel={sel} />
          {picked.length > 0 &&
            (view === "TRASH" ? (
              <>
                <button type="button" className="btn small" onClick={() => act("restore")}>
                  برگرداندن
                </button>
                <button type="button" className="btn ghost small danger" onClick={() => act("purge")}>
                  پاک کردن برای همیشه
                </button>
              </>
            ) : (
              <>
                {view === "BOOKING" && (
                  <>
                    <button type="button" className="btn small" onClick={() => act("confirm")}>
                      تأیید
                    </button>
                    <button type="button" className="btn ghost small" onClick={() => act("done")}>
                      انجام شد
                    </button>
                    <button type="button" className="btn ghost small" onClick={() => act("cancel")}>
                      لغو
                    </button>
                  </>
                )}
                {view === "CONTACT" && (
                  <>
                    <button type="button" className="btn ghost small" onClick={() => act("seen")}>
                      خوانده شد
                    </button>
                    <button type="button" className="btn ghost small" onClick={() => act("done")}>
                      پاسخ داده شد
                    </button>
                  </>
                )}
                <button type="button" className="btn ghost small danger" onClick={() => act("delete")}>
                  حذف
                </button>
              </>
            ))}
        </div>
      )}
      {note && <p className="muted shm-hint">{note}</p>}

      {shown.length === 0 ? (
        <p className="muted shm-hint">
          {view === "TRASH" ? "سطل زباله خالی است." : view === "BOOKING" ? "هنوز درخواست نوبتی نیامده است." : view === "CONTACT" ? "هنوز پیامی نیامده است." : "هنوز کسی در خبرنامه عضو نشده است."}
        </p>
      ) : (
        <ul className="shm-msgs">
          {shown.map((m) => (
            <li key={m.id} className={`shm-msg${m.status === "NEW" && !m.deletedAt ? " is-new" : ""}`}>
              <div className="shm-msg-head">
                <input type="checkbox" checked={sel.has(m.id)} onChange={() => sel.toggle(m.id)} aria-label="انتخاب" />
                <button type="button" className="shm-msg-sum" onClick={() => setOpen(open === m.id ? null : m.id)} aria-expanded={open === m.id}>
                  {m.kind === "NEWSLETTER" ? (
                    <b dir="ltr">{m.email}</b>
                  ) : (
                    <>
                      <b>{m.name || m.email || "بی‌نام"}</b>
                      {m.kind === "BOOKING" ? (
                        <span>
                          {[m.service, m.date && shownDay(m.date), m.time, m.guests && `${showNumber(m.guests)} نفر`].filter(Boolean).join(" · ")}
                        </span>
                      ) : (
                        <span>{m.subject || m.text?.slice(0, 70)}</span>
                      )}
                    </>
                  )}
                  {view === "TRASH" && <em>{KIND_LABEL[m.kind]}</em>}
                </button>
                {m.kind !== "NEWSLETTER" && <span className={`shm-status s-${m.status.toLowerCase()}`}>{STATUS[m.status]}</span>}
                <small className="muted">{faDate(m.createdAt, true)}</small>
              </div>
              {open === m.id && (
                <div className="shm-msg-body">
                  <dl>
                    {m.code && (
                      <>
                        <dt>کد پیگیری</dt>
                        <dd dir="ltr">{m.code}</dd>
                      </>
                    )}
                    {m.phone && (
                      <>
                        <dt>تلفن</dt>
                        <dd>
                          <a href={`tel:${m.phone.replace(/[^\d+]/g, "")}`} dir="ltr">
                            {m.phone}
                          </a>
                        </dd>
                      </>
                    )}
                    {m.email && (
                      <>
                        <dt>ایمیل</dt>
                        <dd>
                          <a href={`mailto:${m.email}`} dir="ltr">
                            {m.email}
                          </a>
                        </dd>
                      </>
                    )}
                    {m.subject && (
                      <>
                        <dt>موضوع</dt>
                        <dd>{m.subject}</dd>
                      </>
                    )}
                    {m.text && (
                      <>
                        <dt>{m.kind === "BOOKING" ? "توضیحات" : "پیام"}</dt>
                        <dd className="shm-msg-text">{m.text}</dd>
                      </>
                    )}
                    {m.page && (
                      <>
                        <dt>از صفحه‌ی</dt>
                        <dd dir="ltr">{m.page}</dd>
                      </>
                    )}
                  </dl>
                  {!m.deletedAt && m.kind === "BOOKING" && (
                    <div className="shm-msg-edit">
                      <label>
                        تاریخ
                        <input type="date" defaultValue={m.date ?? ""} onBlur={(e) => e.target.value !== (m.date ?? "") && patch(m, { date: e.target.value })} />
                      </label>
                      <label>
                        ساعت
                        <input type="time" defaultValue={m.time ?? ""} onBlur={(e) => e.target.value !== (m.time ?? "") && patch(m, { time: e.target.value })} />
                      </label>
                      <label>
                        وضعیت
                        <select value={m.status} onChange={(e) => patch(m, { status: e.target.value as SiteMessageStatus })}>
                          {(["NEW", "SEEN", "CONFIRMED", "DONE", "CANCELED"] as const).map((s) => (
                            <option key={s} value={s}>
                              {STATUS[s]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                  {!m.deletedAt && m.kind !== "NEWSLETTER" && (
                    <label className="shm-msg-note">
                      یادداشت شما (فقط خودتان می‌بینید)
                      <textarea rows={2} maxLength={1000} defaultValue={m.ownerNote ?? ""} onBlur={(e) => e.target.value !== (m.ownerNote ?? "") && patch(m, { ownerNote: e.target.value || null })} />
                    </label>
                  )}
                  {!m.deletedAt && (
                    <div className="shm-row">
                      {m.kind === "CONTACT" && m.status === "NEW" && (
                        <button type="button" className="btn ghost small" onClick={() => patch(m, { status: "SEEN" })}>
                          خوانده شد
                        </button>
                      )}
                      {m.kind === "BOOKING" && m.status !== "CONFIRMED" && (
                        <button type="button" className="btn small" onClick={() => patch(m, { status: "CONFIRMED" })}>
                          تأیید نوبت
                        </button>
                      )}
                      {m.email && m.kind === "CONTACT" && (
                        <a className="btn ghost small" href={`mailto:${m.email}?subject=${encodeURIComponent(`پاسخ: ${m.subject ?? ""}`)}`} onClick={() => patch(m, { status: "DONE" })}>
                          پاسخ با ایمیل
                        </a>
                      )}
                      <button type="button" className="btn ghost small danger" onClick={() => act("delete", [m.id])}>
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
