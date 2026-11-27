// Admin tab: every site order, newest and unread first. Opening one shows the customer's details, the
// design as it was when ordered, the status (which the customer sees) and the thread with the customer.

import { useEffect, useState } from "react";
import { getTemplate } from "@rb/templates";
import { ApiError, api, type AdminSiteOrder, type SiteOrderStatus, type SiteOrderSummary } from "../api";
import { formatDate } from "../format";
import { Scaled } from "./Scaled";
import { OrderThread, SITE_ORDER_STATUS, StatusPill } from "./siteOrders";

const fa = (n: number) => n.toLocaleString("fa-IR");

export function SiteOrdersAdmin() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: SiteOrderSummary[]; pages: number; total: number; unread: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [open, setOpen] = useState<AdminSiteOrder | null>(null);

  // Search 400 ms after typing stops.
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [status, query]);

  useEffect(() => {
    api.admin
      .siteOrders(page, status || undefined, query || undefined)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "خطا در بارگذاری"));
  }, [page, status, query]);

  useEffect(() => {
    if (!openId) return setOpen(null);
    api.admin
      .siteOrder(openId)
      .then((r) => {
        setOpen(r.order);
        setData((d) => d && { ...d, items: d.items.map((o) => (o.id === openId ? { ...o, unreadByAdmin: false } : o)) });
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "سفارش پیدا نشد"));
  }, [openId]);

  function changed(order: AdminSiteOrder) {
    setOpen(order);
    setData((d) => d && { ...d, items: d.items.map((o) => (o.id === order.id ? { ...o, status: order.status } : o)) });
  }

  return (
    <div className="stack">
      <div className="card stack">
        <div className="row gap wrap">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="وضعیت">
            <option value="">همه‌ی وضعیت‌ها</option>
            {Object.entries(SITE_ORDER_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="کد، نام، شماره یا کسب‌وکار" aria-label="جستجو" />
          {data && (
            <span className="muted small">
              {fa(data.total)} سفارش{data.unread > 0 && ` · ${fa(data.unread)} تازه`}
            </span>
          )}
        </div>
        {error && <p className="error">{error}</p>}
        {data && (
          <div className="table-wrap">
            <table className="admin-table so-table">
              <thead>
                <tr>
                  {["", "کد", "تاریخ", "نام", "شماره", "کسب‌وکار", "قالب", "وضعیت"].map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="muted center">
                      سفارشی پیدا نشد.
                    </td>
                  </tr>
                )}
                {data.items.map((o) => (
                  <tr key={o.id} className={`so-row ${o.id === openId ? "active" : ""} ${o.unreadByAdmin ? "unread" : ""}`} onClick={() => setOpenId(o.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpenId(o.id)}>
                    <td>{o.unreadByAdmin && <i className="so-dot" aria-label="تازه" />}</td>
                    <td className="ltr">{o.code}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>{o.name}</td>
                    <td className="ltr">{o.phone}</td>
                    <td>{o.business ?? "—"}</td>
                    <td>{templateName(o.templateId)}</td>
                    <td>
                      <StatusPill status={o.status} />
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

      {open && <OrderDetail order={open} onChange={changed} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function templateName(id: string): string {
  try {
    return getTemplate(id).name;
  } catch {
    return id;
  }
}

function OrderDetail({ order, onChange, onClose }: { order: AdminSiteOrder; onChange: (o: AdminSiteOrder) => void; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  let template: ReturnType<typeof getTemplate> | null = null;
  try {
    template = getTemplate(order.templateId);
  } catch {
    template = null;
  }

  async function setStatus(status: SiteOrderStatus) {
    setBusy(true);
    setError(null);
    try {
      onChange((await api.admin.setSiteOrderStatus(order.id, status)).order);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تغییر نکرد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card so-admin-detail">
      <div className="so-head">
        <div>
          <h2>
            {order.business || order.title} <span className="muted ltr small">{order.code}</span>
          </h2>
          <p className="muted small">
            {formatDate(order.createdAt)} · قالب {order.templateName}
          </p>
        </div>
        <button className="btn ghost small" onClick={onClose}>
          بستن
        </button>
      </div>

      <div className="so-admin-grid">
        <div className="stack">
          <dl className="so-info">
            <dt>نام</dt>
            <dd>{order.name}</dd>
            <dt>شماره‌ی تماس</dt>
            <dd className="ltr">
              <a href={`tel:${order.phone}`}>{order.phone}</a>
            </dd>
            <dt>شماره‌ی حساب</dt>
            <dd className="ltr">{order.user.phone}</dd>
            {order.note && (
              <>
                <dt>توضیحات مشتری</dt>
                <dd className="so-note">{order.note}</dd>
              </>
            )}
          </dl>
          <label className="field">
            <span>وضعیت (مشتری می‌بیند)</span>
            <select value={order.status} disabled={busy} onChange={(e) => void setStatus(e.target.value as SiteOrderStatus)}>
              {Object.entries(SITE_ORDER_STATUS).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="error small">{error}</p>}
          <OrderThread lines={order.messages} me="admin" onSend={async (text) => onChange((await api.admin.sendSiteOrder(order.id, text)).order)} />
        </div>

        <div className="so-preview">
          <p className="muted small">طرح مشتری هنگام سفارش</p>
          <div className="so-preview-box">
            {template ? (
              <Scaled base={1280}>
                <template.component data={order.design.data} theme={order.design.theme} />
              </Scaled>
            ) : (
              <p className="muted center">این قالب دیگر وجود ندارد.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
