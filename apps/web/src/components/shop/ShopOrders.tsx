// The overview tab and the orders tab of the shop manager, plus pieces the other tabs share:
// the order details box and the select-many helper.

import { useEffect, useState } from "react";
import { SHOP_ORDER_STATUSES, SHOP_ORDER_STATUS_LABELS, formatToman, type ShopOrderStatus } from "@rb/schema";
import { ApiError, type ShopOrder, type ShopSummary } from "../../api";
import { useShopApi } from "./shopApi";
import { showNumber } from "./fields";

export const faDate = (iso: string, time = false) => new Date(iso).toLocaleString("fa-IR", time ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
export const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/** Ticked rows of a list, for actions on many at once. */
export function useSelection() {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  return {
    picked,
    has: (id: string) => picked.has(id),
    toggle: (id: string) =>
      setPicked((s) => {
        const next = new Set(s);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    setAll: (ids: string[], on: boolean) => setPicked(on ? new Set(ids) : new Set()),
    clear: () => setPicked(new Set()),
  };
}
export type Selection = ReturnType<typeof useSelection>;

/** "Select all" box for a list, with the count of ticked rows. */
export function SelectAll({ ids, sel }: { ids: string[]; sel: Selection }) {
  const all = ids.length > 0 && ids.every((id) => sel.has(id));
  return (
    <label className="shm-inline shm-select-all">
      <input type="checkbox" checked={all} onChange={(e) => sel.setAll(ids, e.target.checked)} />
      {sel.picked.size ? `${showNumber(sel.picked.size)} انتخاب‌شده` : "انتخاب همه"}
    </label>
  );
}

/* ───────────── Overview ───────────── */

export function Dashboard({ resumeId, products, outOfStock, lowStock, onTab }: { resumeId?: string; products: number; outOfStock: number; lowStock: number; onTab: (tab: string) => void }) {
  const api = useShopApi();
  const [summary, setSummary] = useState<ShopSummary | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    if (!resumeId) return;
    api
      .shopSummary(resumeId)
      .then((r) => setSummary(r.summary))
      .catch((e) => setError(errorText(e, "آمار دریافت نشد")));
  }, [resumeId]);

  const card = (label: string, value: string, tab?: string, tone?: string, note?: string) => (
    <button type="button" className={`shm-kpi${tone ? ` ${tone}` : ""}`} disabled={!tab} onClick={() => tab && onTab(tab)}>
      <small>{label}</small>
      <b>{value}</b>
      {note && <small>{note}</small>}
    </button>
  );
  return (
    <div className="shm-reports">
      {!resumeId || summary === null ? (
        <p className="muted shm-hint">آمار سفارش‌ها و مشتری‌ها بعد از ذخیره و انتشار سایت این‌جا نمایش داده می‌شود.</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : !summary ? (
        <p className="muted shm-hint">در حال دریافت…</p>
      ) : (
        <>
          <div className="shm-stats">
            {card("فروش ۳۰ روز اخیر", formatToman(summary.monthSales), "reports")}
            {card("سفارش‌های ۳۰ روز اخیر", showNumber(summary.monthOrders), "orders")}
            {card("فروش کل", formatToman(summary.sales), "reports")}
            {card("مشتریان عضو", showNumber(summary.customers), "customers")}
          </div>
          <div className="shm-stats">
            {card("سفارش‌های تازه", showNumber(summary.newOrders), "orders", summary.newOrders ? "alert" : "")}
            {card("تیکت‌های بی‌پاسخ", showNumber(summary.openTickets), "tickets", summary.openTickets ? "alert" : "")}
            {card("نظرهای در انتظار تأیید", showNumber(summary.waitingReviews), "reviews", summary.waitingReviews ? "alert" : "")}
            {card("محصولات", showNumber(products), "products", outOfStock ? "warn" : "", [outOfStock && `${showNumber(outOfStock)} ناموجود`, lowStock && `${showNumber(lowStock)} رو به اتمام (۵ یا کمتر)`].filter(Boolean).join("، ") || undefined)}
          </div>
          <section className="shm-panel-box">
            <h4>آخرین سفارش‌ها</h4>
            {summary.recent.length === 0 ? (
              <p className="muted">هنوز سفارشی ثبت نشده است.</p>
            ) : (
              <ul className="shm-order-list">
                {summary.recent.map((o) => (
                  <li key={o.id} className={`st-${o.status.toLowerCase()}`}>
                    <OrderRow o={o} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} />
                    {open === o.id && <OrderDetails o={o} />}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* ───────────── Orders ───────────── */

export function OrderRow({ o, open, onToggle, sel }: { o: ShopOrder; open: boolean; onToggle: () => void; sel?: Selection }) {
  return (
    <div className="shm-order-line">
      {sel && <input type="checkbox" aria-label={`انتخاب سفارش ${o.code}`} checked={sel.has(o.id)} onChange={() => sel.toggle(o.id)} />}
      <button type="button" className="shm-order" onClick={onToggle} aria-expanded={open}>
        <b dir="ltr">#{o.code}</b>
        <span>
          {o.customerName}
          {o.customerId && <i className="shm-member" title="مشتری عضو سایت"> ✓ عضو</i>}
        </span>
        <span dir="ltr">{o.phone}</span>
        <span>{faDate(o.createdAt, true)}</span>
        <b>{formatToman(o.total)}</b>
        <i className="shm-status">{SHOP_ORDER_STATUS_LABELS[o.status]}</i>
      </button>
    </div>
  );
}

export function OrderDetails({ o, onStatus, onDelete }: { o: ShopOrder; onStatus?: (s: ShopOrderStatus) => void; onDelete?: () => void }) {
  return (
    <div className="shm-order-more">
      <table>
        <tbody>
          {o.items.map((it, k) => (
            <tr key={k}>
              <td>
                {it.name}
                {it.size && ` (${it.size})`}
              </td>
              <td>× {showNumber(it.qty)}</td>
              <td>{formatToman(it.total)}</td>
            </tr>
          ))}
          {o.discount > 0 && (
            <tr>
              <td>
                تخفیف
                {o.couponCode && (
                  <>
                    {" "}
                    (کد <b dir="ltr">{o.couponCode}</b>)
                  </>
                )}
              </td>
              <td />
              <td>− {formatToman(o.discount)}</td>
            </tr>
          )}
          <tr>
            <td>هزینه‌ی ارسال</td>
            <td />
            <td>{o.shipping ? formatToman(o.shipping) : "رایگان"}</td>
          </tr>
          <tr className="shm-sum">
            <td>مبلغ کل</td>
            <td />
            <td>{formatToman(o.total)}</td>
          </tr>
        </tbody>
      </table>
      <p>
        <b>نشانی:</b> {[o.city, o.address].filter(Boolean).join("، ")}
        {o.postalCode && ` · کد پستی ${o.postalCode}`}
      </p>
      {o.note && (
        <p>
          <b>توضیح مشتری:</b> {o.note}
        </p>
      )}
      <div className="row gap wrap">
        {onStatus && (
          <>
            <span>وضعیت:</span>
            {SHOP_ORDER_STATUSES.map((s) => (
              <button key={s} type="button" className="btn ghost small" aria-pressed={o.status === s} onClick={() => onStatus(s)}>
                {SHOP_ORDER_STATUS_LABELS[s]}
              </button>
            ))}
          </>
        )}
        <a className="btn ghost small" href={`tel:${o.phone}`}>
          تماس با مشتری
        </a>
        {onDelete && (
          <button type="button" className="btn ghost small danger" onClick={onDelete}>
            حذف سفارش
          </button>
        )}
      </div>
    </div>
  );
}

const PAGE = 50;

export function Orders({ resumeId, onChanged }: { resumeId?: string; onChanged?: () => void }) {
  const api = useShopApi();
  const [orders, setOrders] = useState<ShopOrder[] | null>(null);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<ShopOrderStatus | "">("");
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [batch, setBatch] = useState<ShopOrderStatus | "DELETE" | "">("");
  const sel = useSelection();

  const load = () => {
    if (!resumeId) return;
    setError(null);
    api
      .shopOrders(resumeId, { status: status || undefined, q: q || undefined, take: PAGE, skip: page * PAGE })
      .then((r) => {
        setOrders(r.orders);
        setTotal(r.total);
      })
      .catch((e) => setError(errorText(e, "سفارش‌ها دریافت نشد")));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [resumeId, status, q, page]);
  // Typing waits a moment before searching.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(query.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  if (!resumeId) return <p className="muted shm-hint">برای دیدن سفارش‌ها، اول سایت را ذخیره و منتشر کنید.</p>;

  const changeOne = async (o: ShopOrder, next: ShopOrderStatus) => {
    try {
      const { order } = await api.setShopOrderStatus(resumeId, o.id, next);
      setOrders((list) => list?.map((x) => (x.id === order.id ? order : x)) ?? null);
      onChanged?.();
    } catch (e) {
      setError(errorText(e, "وضعیت ذخیره نشد"));
    }
  };
  const removeOne = async (o: ShopOrder) => {
    if (!window.confirm(`سفارش ${o.code} برای همیشه حذف شود؟${o.status === "CANCELED" ? "" : " کالاهایش به موجودی برمی‌گردد."}`)) return;
    try {
      await api.deleteShopOrder(resumeId, o.id);
      load();
      onChanged?.();
    } catch (e) {
      setError(errorText(e, "حذف نشد"));
    }
  };
  const applyBatch = async () => {
    if (!batch || !sel.picked.size) return;
    const label = batch === "DELETE" ? "برای همیشه حذف شوند" : `به «${SHOP_ORDER_STATUS_LABELS[batch]}» تغییر کنند`;
    if (!window.confirm(`${showNumber(sel.picked.size)} سفارش ${label}؟`)) return;
    try {
      const r = await api.batchShopOrders(resumeId, [...sel.picked], batch);
      setNotice(`${showNumber(r.done)} سفارش تغییر کرد.${r.failed.length ? ` انجام نشد: ${r.failed.join("، ")}` : ""}`);
      sel.clear();
      setBatch("");
      load();
      onChanged?.();
    } catch (e) {
      setError(errorText(e, "انجام نشد"));
    }
  };

  const pages = Math.ceil(total / PAGE);
  return (
    <div className="shm-orders">
      <div className="shm-toolbar">
        <input placeholder="جست‌وجوی کد، نام، تلفن یا شهر…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select
          value={status}
          aria-label="وضعیت"
          onChange={(e) => {
            setStatus(e.target.value as ShopOrderStatus | "");
            setPage(0);
            sel.clear();
          }}
        >
          <option value="">همه‌ی وضعیت‌ها</option>
          {SHOP_ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {SHOP_ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <span>{showNumber(total)} سفارش</span>
        <button type="button" className="btn ghost small" onClick={load}>
          به‌روزرسانی
        </button>
      </div>
      {orders && orders.length > 0 && (
        <div className="shm-batch">
          <SelectAll ids={orders.map((o) => o.id)} sel={sel} />
          {sel.picked.size > 0 && (
            <>
              <select value={batch} aria-label="کار گروهی" onChange={(e) => setBatch(e.target.value as ShopOrderStatus | "DELETE" | "")}>
                <option value="">تغییر وضعیت انتخاب‌شده‌ها…</option>
                {SHOP_ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {SHOP_ORDER_STATUS_LABELS[s]}
                  </option>
                ))}
                <option value="DELETE">حذف همیشگی</option>
              </select>
              <button type="button" className="btn small" disabled={!batch} onClick={() => void applyBatch()}>
                اعمال
              </button>
            </>
          )}
        </div>
      )}
      {notice && <p className="notice">{notice}</p>}
      {error && <p className="error">{error}</p>}
      {!orders ? (
        <p className="muted shm-hint">در حال دریافت سفارش‌ها…</p>
      ) : orders.length === 0 ? (
        <p className="muted shm-hint">{q || status ? "سفارشی با این مشخصات نیست." : "هنوز سفارشی ثبت نشده است. سفارش‌هایی که مشتری‌ها در سایت منتشرشده ثبت کنند این‌جا می‌آیند."}</p>
      ) : (
        <ul className="shm-order-list">
          {orders.map((o) => (
            <li key={o.id} className={`st-${o.status.toLowerCase()}`}>
              <OrderRow o={o} sel={sel} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} />
              {open === o.id && <OrderDetails o={o} onStatus={(s) => void changeOne(o, s)} onDelete={() => void removeOne(o)} />}
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && <Pager page={page} pages={pages} onPage={(p) => (setPage(p), sel.clear())} />}
    </div>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  return (
    <div className="shm-pager">
      <button type="button" className="btn ghost small" disabled={page === 0} onClick={() => onPage(page - 1)}>
        قبلی
      </button>
      <span>
        صفحه‌ی {showNumber(page + 1)} از {showNumber(pages)}
      </span>
      <button type="button" className="btn ghost small" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
        بعدی
      </button>
    </div>
  );
}
