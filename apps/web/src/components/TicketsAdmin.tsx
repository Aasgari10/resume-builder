// Admin tab: support tickets. A switch turns new tickets on or off (open tickets carry on either way);
// below, every ticket, unread first, and the conversation with the customer when one is opened.

import { useEffect, useState } from "react";
import { ApiError, api, type Ticket, type TicketStatus, type TicketSummary } from "../api";
import { formatDate } from "../format";
import { OrderThread } from "./siteOrders";
import { TICKET_STATUS, TICKET_TOPIC, TicketPill } from "./tickets";

const fa = (n: number) => n.toLocaleString("fa-IR");

export function TicketsAdmin() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: TicketSummary[]; pages: number; total: number; unread: number; ticketsEnabled: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [open, setOpen] = useState<Ticket | null>(null);
  const [switching, setSwitching] = useState(false);

  // Search 400 ms after typing stops.
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [status, query]);

  useEffect(() => {
    api.admin
      .tickets(page, status || undefined, query || undefined)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "خطا در بارگذاری"));
  }, [page, status, query]);

  useEffect(() => {
    if (!openId) return setOpen(null);
    api.admin
      .ticket(openId)
      .then((r) => {
        setOpen(r.ticket);
        setData((d) => d && { ...d, items: d.items.map((t) => (t.id === openId ? { ...t, unreadByAdmin: false } : t)) });
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "تیکت پیدا نشد"));
  }, [openId]);

  function changed(t: Ticket) {
    setOpen(t);
    setData((d) => d && { ...d, items: d.items.map((x) => (x.id === t.id ? { ...x, status: t.status } : x)) });
  }

  async function toggle() {
    if (!data) return;
    setSwitching(true);
    try {
      const { settings } = await api.admin.updateSettings({ ticketsEnabled: !data.ticketsEnabled });
      setData({ ...data, ticketsEnabled: settings.ticketsEnabled });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تغییر نکرد");
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="stack">
      {data && (
        <div className="card tk-switch">
          <div>
            <b>دریافت تیکت تازه</b>
            <p className="muted small">
              {data.ticketsEnabled
                ? "مشتری‌ها می‌توانند از صفحه‌ی پشتیبانی تیکت بفرستند."
                : "بسته است: صفحه‌ی پشتیبانی تیکت تازه نمی‌گیرد؛ تیکت‌های باز مثل قبل کار می‌کنند."}
            </p>
          </div>
          <button type="button" role="switch" aria-checked={data.ticketsEnabled} className={`tk-toggle ${data.ticketsEnabled ? "on" : ""}`} disabled={switching} onClick={() => void toggle()}>
            <i />
            <span>{data.ticketsEnabled ? "فعال" : "غیرفعال"}</span>
          </button>
        </div>
      )}

      <div className="card stack">
        <div className="row gap wrap">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="وضعیت">
            <option value="">همه‌ی وضعیت‌ها</option>
            {Object.entries(TICKET_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="کد، عنوان، کد سفارش یا شماره" aria-label="جستجو" />
          {data && (
            <span className="muted small">
              {fa(data.total)} تیکت{data.unread > 0 && ` · ${fa(data.unread)} تازه`}
            </span>
          )}
        </div>
        {error && <p className="error">{error}</p>}
        {data && (
          <div className="table-wrap">
            <table className="admin-table so-table">
              <thead>
                <tr>
                  {["", "کد", "آخرین فعالیت", "شماره", "موضوع", "عنوان", "وضعیت"].map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted center">
                      تیکتی پیدا نشد.
                    </td>
                  </tr>
                )}
                {data.items.map((t) => (
                  <tr key={t.id} className={`so-row ${t.id === openId ? "active" : ""} ${t.unreadByAdmin ? "unread" : ""}`} onClick={() => setOpenId(t.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpenId(t.id)}>
                    <td>{t.unreadByAdmin && <i className="so-dot" aria-label="تازه" />}</td>
                    <td className="ltr">{t.code}</td>
                    <td>{formatDate(t.updatedAt)}</td>
                    <td className="ltr">{t.user?.phone ?? "—"}</td>
                    <td>{TICKET_TOPIC[t.topic]}</td>
                    <td>{t.subject}</td>
                    <td>
                      <TicketPill status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.pages > 1 && (
          <div className="row gap">
            <button className="btn ghost small" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              قبلی
            </button>
            <span className="muted small">
              صفحه‌ی {fa(page)} از {fa(data.pages)}
            </span>
            <button className="btn ghost small" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
              بعدی
            </button>
          </div>
        )}
      </div>

      {open && <TicketDetail ticket={open} onChange={changed} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function TicketDetail({ ticket, onChange, onClose }: { ticket: Ticket; onChange: (t: Ticket) => void; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: TicketStatus) {
    setError(null);
    try {
      onChange((await api.admin.setTicketStatus(ticket.id, status)).ticket);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تغییر نکرد");
    }
  }

  return (
    <div className="card so-admin-detail">
      <div className="so-head">
        <div>
          <h2>
            {ticket.subject} <span className="muted ltr small">{ticket.code}</span>
          </h2>
          <p className="muted small">
            {TICKET_TOPIC[ticket.topic]}
            {ticket.orderCode && (
              <>
                {" "}
                · سفارش <span className="ltr">{ticket.orderCode}</span>
              </>
            )}{" "}
            · {ticket.user?.name ?? "بی‌نام"} · <span className="ltr">{ticket.user?.phone}</span> · {formatDate(ticket.createdAt)}
          </p>
        </div>
        <div className="row gap">
          <TicketPill status={ticket.status} />
          {ticket.status === "CLOSED" ? (
            <button className="btn ghost small" onClick={() => void setStatus("OPEN")}>
              باز کردن دوباره
            </button>
          ) : (
            <button className="btn ghost small" onClick={() => void setStatus("CLOSED")}>
              بستن تیکت
            </button>
          )}
          <button className="btn ghost small" onClick={onClose}>
            بستن پنجره
          </button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <OrderThread lines={ticket.messages} me="admin" onSend={async (text) => onChange((await api.admin.answerTicket(ticket.id, text)).ticket)} />
    </div>
  );
}
