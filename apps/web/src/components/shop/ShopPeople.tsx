// Shop manager tabs about people: product comments, support tickets and customer accounts.
// All of them come from the server (the published site), not from the site content.

import { useEffect, useState } from "react";
import { formatToman, type Shop } from "@rb/schema";
import { type ShopCustomer, type ShopCustomerDetail, type ShopReview, type ShopTicket } from "../../api";
import { useShopApi } from "./shopApi";
import { showNumber } from "./fields";
import { OrderDetails, OrderRow, Pager, SelectAll, errorText, faDate, useSelection } from "./ShopOrders";

/** Loads a list from the server once the site is saved; returns it with a reload and an error. */
export function useServerList<T>(resumeId: string | undefined, load: (id: string) => Promise<T[]>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = () => {
    if (!resumeId) return;
    setError(null);
    load(resumeId)
      .then(setItems)
      .catch((e) => setError(errorText(e, "اطلاعات دریافت نشد")));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, [resumeId]);
  return { items, setItems, error, setError, reload };
}

export function NeedsPublish({ resumeId, error, loading }: { resumeId?: string; error: string | null; loading: boolean }) {
  if (!resumeId) return <p className="muted shm-hint">اول سایت را ذخیره و منتشر کنید؛ این بخش اطلاعات سایت منتشرشده را نشان می‌دهد.</p>;
  if (error) return <p className="error">{error}</p>;
  if (loading) return <p className="muted shm-hint">در حال دریافت…</p>;
  return null;
}

const PAGE = 40;
/** The part of a list on the current page. */
const pageOf = <T,>(list: T[], page: number) => list.slice(page * PAGE, (page + 1) * PAGE);

function Stars({ n }: { n: number }) {
  return (
    <span className="shm-stars" aria-label={`${n} از ۵`}>
      {"★".repeat(n)}
      <s>{"★".repeat(5 - n)}</s>
    </span>
  );
}

export function ReplyBox({ initial, label, onSave, button = "ذخیره‌ی پاسخ", clearAfter }: { initial: string; label: string; onSave: (text: string) => Promise<void> | void; button?: string; clearAfter?: boolean }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const changed = text.trim() !== initial.trim();
  return (
    <div className="shm-reply">
      <textarea rows={2} maxLength={2000} value={text} placeholder={label} aria-label={label} onChange={(e) => setText(e.target.value)} />
      {changed && (
        <button
          type="button"
          className="btn small"
          disabled={busy || (clearAfter && !text.trim())}
          onClick={async () => {
            setBusy(true);
            await onSave(text.trim());
            setBusy(false);
            if (clearAfter) setText("");
          }}
        >
          {busy ? "…" : button}
        </button>
      )}
    </div>
  );
}

/* ───────────── Comments ───────────── */

type ReviewFilter = "waiting" | "approved" | "all";

export function Reviews({ resumeId, shop, setShop, onChanged }: { resumeId?: string; shop: Shop; setShop: (s: Partial<Shop>) => void; onChanged?: () => void }) {
  const api = useShopApi();
  const { items, setItems, error, setError, reload } = useServerList(resumeId, (id) => api.shopReviews(id).then((r) => r.reviews));
  const [filter, setFilter] = useState<ReviewFilter>("waiting");
  const [query, setQuery] = useState("");
  const [stars, setStars] = useState(0);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const sel = useSelection();
  if (!items || !resumeId) return <NeedsPublish resumeId={resumeId} error={error} loading={!items} />;

  const names = new Map(shop.products.map((p) => [p.id, p.name]));
  const replace = (r: ShopReview) => setItems((list) => list?.map((x) => (x.id === r.id ? { ...x, ...r, customer: x.customer } : x)) ?? null);
  const patch = async (r: ShopReview, body: Parameters<typeof api.updateShopReview>[2]) => {
    try {
      replace((await api.updateShopReview(resumeId, r.id, body)).review);
      onChanged?.();
    } catch (e) {
      setError(errorText(e, "ذخیره نشد"));
    }
  };
  const remove = async (r: ShopReview) => {
    if (!window.confirm("این نظر به سطل زباله برود؟")) return;
    try {
      await api.deleteShopReview(resumeId, r.id);
      setItems((list) => list?.filter((x) => x.id !== r.id) ?? null);
      onChanged?.();
    } catch (e) {
      setError(errorText(e, "حذف نشد"));
    }
  };
  const batch = async (action: "approve" | "hide" | "delete") => {
    const n = sel.picked.size;
    if (action === "delete" && !window.confirm(`${showNumber(n)} نظر به سطل زباله بروند؟`)) return;
    try {
      await api.batchShopReviews(resumeId, [...sel.picked], action);
      sel.clear();
      reload();
      onChanged?.();
    } catch (e) {
      setError(errorText(e, "انجام نشد"));
    }
  };

  const q = query.trim();
  const waiting = items.filter((r) => !r.approved).length;
  const list = items.filter(
    (r) =>
      (filter === "all" || (filter === "waiting" ? !r.approved : r.approved)) &&
      (!stars || r.rating === stars) &&
      (!q || r.text.includes(q) || r.customer.name.includes(q) || r.customer.phone.includes(q) || (names.get(r.productId) ?? "").includes(q)),
  );
  const shown = pageOf(list, page);
  const pages = Math.ceil(list.length / PAGE);
  const tabs: [ReviewFilter, string][] = [
    ["waiting", `در انتظار تأیید (${showNumber(waiting)})`],
    ["approved", `تأییدشده (${showNumber(items.length - waiting)})`],
    ["all", `همه (${showNumber(items.length)})`],
  ];
  return (
    <div className="shm-orders">
      <label className="shm-switch">
        <input type="checkbox" checked={Boolean(shop.reviewsAutoApprove)} onChange={(e) => setShop({ reviewsAutoApprove: e.target.checked || undefined })} />
        <span>
          <b>تأیید خودکار نظرات</b>
          <small className="muted">{shop.reviewsAutoApprove ? "نظر مشتری‌ها بی‌درنگ روی سایت نمایش داده می‌شود (بعد از انتشار سایت)." : "نظرها تا وقتی تأیید نکنید روی سایت نمایش داده نمی‌شوند."}</small>
        </span>
      </label>
      <div className="shm-toolbar">
        <div className="row gap wrap">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="btn ghost small"
              aria-pressed={filter === id}
              onClick={() => {
                setFilter(id);
                setPage(0);
                sel.clear();
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="btn ghost small" onClick={reload}>
          به‌روزرسانی
        </button>
      </div>
      <div className="shm-toolbar">
        <input placeholder="جست‌وجوی متن، مشتری یا محصول…" value={query} onChange={(e) => (setQuery(e.target.value), setPage(0))} />
        <select value={stars} aria-label="امتیاز" onChange={(e) => (setStars(Number(e.target.value)), setPage(0))}>
          <option value={0}>همه‌ی امتیازها</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {showNumber(n)} ستاره
            </option>
          ))}
        </select>
      </div>
      {shown.length > 0 && (
        <div className="shm-batch">
          <SelectAll ids={shown.map((r) => r.id)} sel={sel} />
          {sel.picked.size > 0 && (
            <>
              <button type="button" className="btn small" onClick={() => void batch("approve")}>
                تأیید
              </button>
              <button type="button" className="btn ghost small" onClick={() => void batch("hide")}>
                پنهان کردن
              </button>
              <button type="button" className="btn ghost small danger" onClick={() => void batch("delete")}>
                حذف
              </button>
            </>
          )}
        </div>
      )}
      {list.length === 0 && <p className="muted shm-hint">{items.length ? "نظری با این مشخصات نیست." : "هنوز نظری ثبت نشده است. مشتری‌های عضو از صفحه‌ی هر محصول نظر می‌دهند."}</p>}
      <ul className="shm-review-list">
        {shown.map((r) => (
          <li key={r.id} className={r.approved ? "" : "waiting"}>
            <div className="shm-review-head">
              <input type="checkbox" aria-label="انتخاب نظر" checked={sel.has(r.id)} onChange={() => sel.toggle(r.id)} />
              <b>{r.customer.name}</b>
              <Stars n={r.rating} />
              <small className="muted">
                {names.get(r.productId) ?? "محصول حذف‌شده"} · {faDate(r.createdAt)}
              </small>
              {!r.approved && <i className="shm-status">در انتظار تأیید</i>}
            </div>
            {editing === r.id ? (
              <ReviewEdit r={r} onCancel={() => setEditing(null)} onSave={async (text, rating) => (await patch(r, { text, rating }), setEditing(null))} />
            ) : (
              <p>{r.text}</p>
            )}
            <ReplyBox initial={r.reply ?? ""} label="پاسخ فروشگاه (زیر نظر نمایش داده می‌شود)" onSave={(reply) => patch(r, { reply: reply || null })} />
            <div className="row gap wrap">
              <button type="button" className={`btn small${r.approved ? " ghost" : ""}`} onClick={() => void patch(r, { approved: !r.approved })}>
                {r.approved ? "پنهان کردن از سایت" : "تأیید و نمایش"}
              </button>
              {editing !== r.id && (
                <button type="button" className="btn ghost small" onClick={() => setEditing(r.id)}>
                  ویرایش متن و امتیاز
                </button>
              )}
              <button type="button" className="btn ghost small danger" onClick={() => void remove(r)}>
                حذف
              </button>
            </div>
          </li>
        ))}
      </ul>
      {pages > 1 && <Pager page={page} pages={pages} onPage={(p) => (setPage(p), sel.clear())} />}
    </div>
  );
}

function ReviewEdit({ r, onSave, onCancel }: { r: ShopReview; onSave: (text: string, rating: number) => Promise<void>; onCancel: () => void }) {
  const [text, setText] = useState(r.text);
  const [rating, setRating] = useState(r.rating);
  return (
    <div className="shm-reply">
      <select value={rating} aria-label="امتیاز" onChange={(e) => setRating(Number(e.target.value))}>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {showNumber(n)} ستاره
          </option>
        ))}
      </select>
      <textarea rows={3} maxLength={1000} value={text} aria-label="متن نظر" onChange={(e) => setText(e.target.value)} />
      <div className="row gap">
        <button type="button" className="btn small" disabled={!text.trim()} onClick={() => void onSave(text.trim(), rating)}>
          ذخیره
        </button>
        <button type="button" className="btn ghost small" onClick={onCancel}>
          انصراف
        </button>
      </div>
    </div>
  );
}

/* ───────────── Support tickets ───────────── */

const TICKET_LABELS: Record<ShopTicket["status"], string> = { OPEN: "در انتظار پاسخ", ANSWERED: "پاسخ داده شد", CLOSED: "بسته" };

export function Tickets({ resumeId, onChanged }: { resumeId?: string; onChanged?: () => void }) {
  const api = useShopApi();
  const { items, setItems, error, setError, reload } = useServerList(resumeId, (id) => api.shopTickets(id).then((r) => r.tickets));
  const [open, setOpen] = useState<string | null>(null);
  const [status, setStatus] = useState<ShopTicket["status"] | "">("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const sel = useSelection();
  if (!items || !resumeId) return <NeedsPublish resumeId={resumeId} error={error} loading={!items} />;

  const patch = async (t: ShopTicket, body: { text?: string; status?: ShopTicket["status"] }) => {
    try {
      const { ticket } = await api.updateShopTicket(resumeId, t.id, body);
      setItems((list) => list?.map((x) => (x.id === ticket.id ? { ...x, ...ticket, customer: x.customer } : x)) ?? null);
      onChanged?.();
    } catch (e) {
      setError(errorText(e, "ذخیره نشد"));
    }
  };
  const remove = async (t: ShopTicket) => {
    if (!window.confirm(`تیکت «${t.subject}» به سطل زباله برود؟`)) return;
    try {
      await api.deleteShopTicket(resumeId, t.id);
      setItems((list) => list?.filter((x) => x.id !== t.id) ?? null);
      onChanged?.();
    } catch (e) {
      setError(errorText(e, "حذف نشد"));
    }
  };
  const batch = async (action: "close" | "delete") => {
    if (!window.confirm(`${showNumber(sel.picked.size)} تیکت ${action === "close" ? "بسته" : "به سطل زباله منتقل"} شوند؟`)) return;
    try {
      await api.batchShopTickets(resumeId, [...sel.picked], action);
      sel.clear();
      reload();
      onChanged?.();
    } catch (e) {
      setError(errorText(e, "انجام نشد"));
    }
  };

  const q = query.trim();
  const count = (s: ShopTicket["status"]) => items.filter((t) => t.status === s).length;
  const list = items.filter((t) => (!status || t.status === status) && (!q || t.subject.includes(q) || t.customer.name.includes(q) || t.customer.phone.includes(q) || t.messages.some((m) => m.text.includes(q))));
  const shown = pageOf(list, page);
  const pages = Math.ceil(list.length / PAGE);
  return (
    <div className="shm-orders">
      <div className="shm-toolbar">
        <input placeholder="جست‌وجوی موضوع، متن یا مشتری…" value={query} onChange={(e) => (setQuery(e.target.value), setPage(0))} />
        <select value={status} aria-label="وضعیت" onChange={(e) => (setStatus(e.target.value as ShopTicket["status"] | ""), setPage(0), sel.clear())}>
          <option value="">همه ({showNumber(items.length)})</option>
          {(["OPEN", "ANSWERED", "CLOSED"] as const).map((s) => (
            <option key={s} value={s}>
              {TICKET_LABELS[s]} ({showNumber(count(s))})
            </option>
          ))}
        </select>
        <button type="button" className="btn ghost small" onClick={reload}>
          به‌روزرسانی
        </button>
      </div>
      {shown.length > 0 && (
        <div className="shm-batch">
          <SelectAll ids={shown.map((t) => t.id)} sel={sel} />
          {sel.picked.size > 0 && (
            <>
              <button type="button" className="btn ghost small" onClick={() => void batch("close")}>
                بستن
              </button>
              <button type="button" className="btn ghost small danger" onClick={() => void batch("delete")}>
                حذف
              </button>
            </>
          )}
        </div>
      )}
      {list.length === 0 && <p className="muted shm-hint">{items.length ? "تیکتی با این مشخصات نیست." : "هنوز تیکتی ثبت نشده است. مشتری‌ها از صفحه‌ی «حساب من» در سایت تیکت می‌فرستند."}</p>}
      <ul className="shm-order-list">
        {shown.map((t) => (
          <li key={t.id} className={`tk-${t.status.toLowerCase()}`}>
            <div className="shm-order-line">
              <input type="checkbox" aria-label="انتخاب تیکت" checked={sel.has(t.id)} onChange={() => sel.toggle(t.id)} />
              <button type="button" className="shm-order" aria-expanded={open === t.id} onClick={() => setOpen(open === t.id ? null : t.id)}>
                <b>{t.subject}</b>
                <span>{t.customer.name}</span>
                <span dir="ltr">{t.customer.phone}</span>
                <span>{showNumber(t.messages.length)} پیام</span>
                <span>{faDate(t.updatedAt, true)}</span>
                <i className="shm-status">{TICKET_LABELS[t.status]}</i>
              </button>
            </div>
            {open === t.id && (
              <div className="shm-order-more">
                <ol className="shm-chat">
                  {t.messages.map((m, k) => (
                    <li key={k} className={m.from}>
                      <p>{m.text}</p>
                      <small className="muted">
                        {m.from === "shop" ? "فروشگاه" : t.customer.name} · {faDate(m.at, true)}
                      </small>
                    </li>
                  ))}
                </ol>
                {t.status !== "CLOSED" && <ReplyBox initial="" label="پاسخ شما…" button="ارسال پاسخ" clearAfter onSave={(text) => patch(t, { text })} />}
                <div className="row gap wrap">
                  {t.status === "CLOSED" ? (
                    <button type="button" className="btn ghost small" onClick={() => void patch(t, { status: "OPEN" })}>
                      باز کردن دوباره
                    </button>
                  ) : (
                    <button type="button" className="btn ghost small" onClick={() => void patch(t, { status: "CLOSED" })}>
                      بستن تیکت
                    </button>
                  )}
                  <a className="btn ghost small" href={`tel:${t.customer.phone}`}>
                    تماس با مشتری
                  </a>
                  <button type="button" className="btn ghost small danger" onClick={() => void remove(t)}>
                    حذف
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {pages > 1 && <Pager page={page} pages={pages} onPage={(p) => (setPage(p), sel.clear())} />}
    </div>
  );
}

/* ───────────── Customers ───────────── */

type CustomerSort = "new" | "spent" | "orders" | "recent";

export function Customers({ resumeId }: { resumeId?: string }) {
  const api = useShopApi();
  const { items, setItems, error, setError } = useServerList<ShopCustomer>(resumeId, (id) => api.shopCustomers(id).then((r) => r.customers));
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CustomerSort>("new");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  if (!items || !resumeId) return <NeedsPublish resumeId={resumeId} error={error} loading={!items} />;
  if (open) {
    return (
      <CustomerPage
        resumeId={resumeId}
        id={open}
        onBack={() => setOpen(null)}
        onDeleted={() => {
          setItems((list) => list?.filter((c) => c.id !== open) ?? null);
          setOpen(null);
        }}
        onError={setError}
      />
    );
  }
  const q = query.trim();
  const time = (s: string | null) => (s ? Date.parse(s) : 0);
  const list = items
    .filter((c) => !q || c.name.includes(q) || c.phone.includes(q))
    .sort((a, b) => (sort === "spent" ? b.spent - a.spent : sort === "orders" ? b.orders - a.orders : sort === "recent" ? time(b.lastOrderAt) - time(a.lastOrderAt) : time(b.createdAt) - time(a.createdAt)));
  const shown = pageOf(list, page);
  const pages = Math.ceil(list.length / PAGE);
  return (
    <div className="shm-orders">
      <div className="shm-toolbar">
        <input placeholder="جست‌وجوی نام یا تلفن…" value={query} onChange={(e) => (setQuery(e.target.value), setPage(0))} />
        <select value={sort} aria-label="مرتب‌سازی" onChange={(e) => setSort(e.target.value as CustomerSort)}>
          <option value="new">تازه‌ترین عضوها</option>
          <option value="spent">بیشترین خرید</option>
          <option value="orders">بیشترین سفارش</option>
          <option value="recent">آخرین خرید</option>
        </select>
        <span>{showNumber(items.length)} مشتری</span>
      </div>
      {error && <p className="error">{error}</p>}
      {items.length === 0 ? (
        <p className="muted shm-hint">هنوز کسی در سایت حساب نساخته است. مشتری‌ها از صفحه‌ی «حساب من» ثبت‌نام می‌کنند؛ خرید بدون ثبت‌نام هم ممکن است.</p>
      ) : (
        <div className="shm-table-wrap">
          <table className="shm-table shm-clickable">
            <thead>
              <tr>
                <th>نام</th>
                <th>تلفن</th>
                <th>عضویت</th>
                <th>سفارش‌ها</th>
                <th>جمع خرید</th>
                <th>آخرین خرید</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} tabIndex={0} onClick={() => setOpen(c.id)} onKeyDown={(e) => e.key === "Enter" && setOpen(c.id)}>
                  <td>
                    <b>{c.name}</b>
                  </td>
                  <td dir="ltr">{c.phone}</td>
                  <td>{faDate(c.createdAt)}</td>
                  <td>{showNumber(c.orders)}</td>
                  <td>{c.spent ? formatToman(c.spent) : "—"}</td>
                  <td>{c.lastOrderAt ? faDate(c.lastOrderAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && <Pager page={page} pages={pages} onPage={setPage} />}
    </div>
  );
}

function CustomerPage({ resumeId, id, onBack, onDeleted, onError }: { resumeId: string; id: string; onBack: () => void; onDeleted: () => void; onError: (e: string) => void }) {
  const api = useShopApi();
  const [c, setC] = useState<ShopCustomerDetail | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    api
      .shopCustomer(resumeId, id)
      .then((r) => setC(r.customer))
      .catch((e) => (onError(errorText(e, "مشتری دریافت نشد")), onBack()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId, id]);
  if (!c) return <p className="muted shm-hint">در حال دریافت…</p>;
  const live = c.orders.filter((o) => o.status !== "CANCELED");
  const remove = async () => {
    if (!window.confirm(`حساب «${c.name}» به سطل زباله برود؟ نظرها و تیکت‌هایش هم همراهش می‌روند؛ سفارش‌هایش در فهرست سفارش‌ها می‌مانند. تا ۳۰ روز می‌توانید برش گردانید.`)) return;
    try {
      await api.deleteShopCustomer(resumeId, c.id);
      onDeleted();
    } catch (e) {
      onError(errorText(e, "حذف نشد"));
    }
  };
  return (
    <div className="shm-orders">
      <div className="shm-toolbar">
        <button type="button" className="btn ghost small" onClick={onBack}>
          → همه‌ی مشتریان
        </button>
        <div className="row gap">
          <a className="btn ghost small" href={`tel:${c.phone}`}>
            تماس
          </a>
          <button type="button" className="btn ghost small danger" onClick={() => void remove()}>
            حذف حساب
          </button>
        </div>
      </div>
      <h3>
        {c.name} <small className="muted" dir="ltr">{c.phone}</small>
      </h3>
      <div className="shm-stats">
        <div>
          <small>عضویت</small>
          <b>{faDate(c.createdAt)}</b>
        </div>
        <div>
          <small>سفارش‌ها</small>
          <b>{showNumber(c.orders.length)}</b>
        </div>
        <div>
          <small>جمع خرید</small>
          <b>{formatToman(live.reduce((s, o) => s + o.total, 0))}</b>
        </div>
        <div>
          <small>نظر و تیکت</small>
          <b>
            {showNumber(c.reviews.length)} نظر، {showNumber(c.tickets.length)} تیکت
          </b>
        </div>
      </div>
      {c.addresses.length > 0 && (
        <section className="shm-panel-box">
          <h4>نشانی‌ها</h4>
          {c.addresses.map((a) => (
            <p key={a.id}>
              <b>{a.title || "نشانی"}:</b> {[a.city, a.address].filter(Boolean).join("، ")}
              {a.postalCode && ` · کد پستی ${a.postalCode}`}
            </p>
          ))}
        </section>
      )}
      <section className="shm-panel-box">
        <h4>سفارش‌ها</h4>
        {c.orders.length === 0 ? (
          <p className="muted">سفارشی ثبت نکرده است.</p>
        ) : (
          <ul className="shm-order-list">
            {c.orders.map((o) => (
              <li key={o.id} className={`st-${o.status.toLowerCase()}`}>
                <OrderRow o={o} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} />
                {open === o.id && <OrderDetails o={o} />}
              </li>
            ))}
          </ul>
        )}
      </section>
      {c.tickets.length > 0 && (
        <section className="shm-panel-box">
          <h4>تیکت‌ها</h4>
          {c.tickets.map((t) => (
            <p key={t.id}>
              {t.subject} · <span className="muted">{TICKET_LABELS[t.status]} · {faDate(t.updatedAt)}</span>
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
