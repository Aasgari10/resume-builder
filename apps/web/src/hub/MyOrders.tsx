// The customer's site orders: every order with its status, and the thread with the team.
// "?open=<id>" opens an order (the editor sends the customer here right after ordering).

import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError, api, type SiteOrder, type SiteOrderSummary } from "../api";
import { OrderThread, StatusPill } from "../components/siteOrders";
import { formatDate } from "../format";

export function MyOrders() {
  const [params, setParams] = useSearchParams();
  const openId = params.get("open");
  const [orders, setOrders] = useState<SiteOrderSummary[] | null>(null);
  const [open, setOpen] = useState<SiteOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.siteOrders
      .list()
      .then((r) => setOrders(r.orders))
      .catch((e) => setError(e instanceof ApiError ? e.message : "خطا در بارگذاری"));
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    if (!openId) return setOpen(null);
    api.siteOrders
      .get(openId)
      .then((r) => {
        setOpen(r.order);
        // Opening marks the news as read.
        setOrders((list) => list?.map((o) => (o.id === openId ? { ...o, unreadByUser: false } : o)) ?? list);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "سفارش پیدا نشد"));
  }, [openId]);

  const select = (id: string | null) => setParams(id ? { open: id } : {}, { replace: true });

  return (
    <div className="stack so-page">
      <div>
        <h1>سفارش‌های من</h1>
        <p className="muted">سایت‌هایی که سفارش داده‌اید، وضعیتشان و پیام‌های پشتیبانی.</p>
      </div>
      {error && <p className="error">{error}</p>}
      {orders?.length === 0 && (
        <div className="card center stack">
          <p>هنوز سفارشی ثبت نکرده‌اید.</p>
          <p className="muted small">یک قالب را باز کنید، به سلیقه‌ی خودتان تغییرش دهید و «ثبت سفارش» را بزنید.</p>
          <Link to="/resume/sites" className="btn">
            دیدن قالب‌ها
          </Link>
        </div>
      )}
      {orders && orders.length > 0 && (
        <div className="so-layout">
          <ul className="so-list">
            {orders.map((o) => (
              <li key={o.id}>
                <button className={`so-item ${o.id === openId ? "active" : ""}`} onClick={() => select(o.id)}>
                  <span className="so-item-top">
                    <b>{o.business || o.title}</b>
                    {o.unreadByUser && <i className="so-dot" aria-label="پیام تازه" />}
                  </span>
                  <span className="so-item-meta">
                    <StatusPill status={o.status} />
                    <span className="muted small">
                      {formatDate(o.createdAt)} · <span className="ltr">{o.code}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <section className="card so-detail">
            {!open ? (
              <p className="muted center">یک سفارش را انتخاب کنید.</p>
            ) : (
              <div className="stack">
                <div className="so-head">
                  <div>
                    <h2>{open.business || open.title}</h2>
                    <p className="muted small">
                      کد پیگیری <b className="ltr">{open.code}</b> · {formatDate(open.createdAt)}
                    </p>
                  </div>
                  <StatusPill status={open.status} />
                </div>
                {open.note && <p className="so-note">{open.note}</p>}
                {open.resumeId && (
                  <Link to={`/resumes/${open.resumeId}`} className="btn ghost small so-design">
                    دیدن و ویرایش طرح
                  </Link>
                )}
                <OrderThread
                  lines={open.messages}
                  me="customer"
                  onSend={async (text) => {
                    const { order } = await api.siteOrders.send(open.id, text);
                    setOpen(order);
                  }}
                />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
