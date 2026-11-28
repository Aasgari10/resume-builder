// The customer's own unit in the building (/account): a summary, their site orders and the conversation
// with the team, their support tickets, and their details. Admins also get the way to the admin panel.
//   /account            summary
//   /account/orders     orders (?open=<id> opens one)
//   /account/tickets    support tickets
//   /account/profile    name, email (the phone is the login)

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, api, type SiteOrder, type SiteOrderSummary, type SupportInfo, type TicketSummary } from "../api";
import { useAuth } from "../auth";
import { OrderThread, StatusPill } from "../components/siteOrders";
import { TicketPill } from "../components/tickets";
import { formatDate } from "../format";
import { PageHead, UnitPage } from "./Shell";
import { Desk } from "./Support";
import "./pages.css";

const fa = (n: number) => n.toLocaleString("fa-IR");

type Section = "home" | "orders" | "tickets" | "profile";

const MENU: { key: Section; to: string; label: string; d: string }[] = [
  { key: "home", to: "/account", label: "خلاصه", d: "M3 11l9-7 9 7 M5 10v10h14V10 M10 20v-6h4v6" },
  { key: "orders", to: "/account/orders", label: "سفارش‌های من", d: "M4 6h16v12H4z M4 10h16 M8 14h4" },
  { key: "tickets", to: "/account/tickets", label: "تیکت‌های من", d: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z M14 5v14" },
  { key: "profile", to: "/account/profile", label: "اطلاعات من", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0" },
];

const TITLE: Record<Section, string> = { home: "حساب من", orders: "سفارش‌های من", tickets: "تیکت‌های من", profile: "اطلاعات من" };

export function Account({ section }: { section: Section }) {
  const { user, loading, logout } = useAuth();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    document.title = `${TITLE[section]} | site4site`;
  }, [section]);

  if (loading) return <UnitPage>{null}</UnitPage>;
  if (!user) return <Navigate to="/login" replace state={{ from: pathname + search }} />;

  return (
    <UnitPage>
      <PageHead plate="واحد شما" title={user.name ? `سلام، ${user.name}` : "حساب من"} sub="سفارش‌ها، تیکت‌ها و اطلاعات شما، همه در یک جا." sides={false} />
      <div className="ac-layout">
        <nav className="ac-menu" aria-label="حساب من">
          {MENU.map((m) => (
            <NavLink key={m.key} to={m.to} end className={m.key === section ? "on" : ""}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={m.d} />
              </svg>
              {m.label}
            </NavLink>
          ))}
          <span className="ac-sep" />
          {user.role === "ADMIN" && (
            <Link to="/admin" className="ac-admin">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4" />
              </svg>
              پنل مدیریت
            </Link>
          )}
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate("/", { replace: true });
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 4H5v16h5 M14 8l4 4-4 4 M8 12h10" />
            </svg>
            خروج
            <small className="ltr">{user.phone}</small>
          </button>
        </nav>
        <section className="ac-body">
          {section === "home" && <Summary admin={user.role === "ADMIN"} />}
          {section === "orders" && <Orders />}
          {section === "tickets" && <Tickets />}
          {section === "profile" && <Profile />}
        </section>
      </div>
    </UnitPage>
  );
}

/** Counters and the latest news from orders and tickets. */
function Summary({ admin }: { admin: boolean }) {
  const [orders, setOrders] = useState<SiteOrderSummary[] | null>(null);
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);
  useEffect(() => {
    api.siteOrders.list().then((r) => setOrders(r.orders), () => setOrders([]));
    api.support.list().then((r) => setTickets(r.tickets), () => setTickets([]));
  }, []);
  if (!orders || !tickets) return <p className="sp-hint center">…</p>;

  const openOrders = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELED").length;
  const openTickets = tickets.filter((t) => t.status !== "CLOSED").length;
  const news = orders.filter((o) => o.unreadByUser).length + tickets.filter((t) => t.unreadByUser).length;
  const feed = [
    ...orders.map((o) => ({ at: o.updatedAt, to: `/account/orders?open=${o.id}`, title: o.business || o.title, code: o.code, pill: <StatusPill status={o.status} />, unread: o.unreadByUser, kind: "سفارش" })),
    ...tickets.map((t) => ({ at: t.updatedAt, to: `/account/tickets`, title: t.subject, code: t.code, pill: <TicketPill status={t.status} />, unread: t.unreadByUser, kind: "تیکت" })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  return (
    <div className="ac-sum">
      <div className="ac-stats">
        <Link to="/account/orders">
          <b>{fa(openOrders)}</b>
          <small>سفارش در جریان</small>
        </Link>
        <Link to="/account/tickets">
          <b>{fa(openTickets)}</b>
          <small>تیکت باز</small>
        </Link>
        <Link to={news ? "/account/orders" : "/account"} className={news ? "lit" : ""}>
          <b>{fa(news)}</b>
          <small>پیام تازه</small>
        </Link>
      </div>

      <h2 className="ac-h">آخرین اتفاق‌ها</h2>
      {feed.length === 0 ? (
        <div className="sp-empty">
          <b>هنوز سفارش یا تیکتی ندارید</b>
          <p>یک قالب را امتحان کنید و سفارش دهید؛ همه‌چیز این‌جا دیده می‌شود.</p>
          <Link to="/templates" className="s4-btn main">
            دیدن قالب‌ها
          </Link>
        </div>
      ) : (
        <ul className="ac-feed">
          {feed.map((f) => (
            <li key={f.kind + f.code}>
              <Link to={f.to}>
                <span className="k">{f.kind}</span>
                <b>{f.title}</b>
                {f.unread && <i className="so-dot" aria-label="تازه" />}
                <span className="m">
                  {f.pill}
                  <small>
                    {formatDate(f.at)} · <span className="ltr">{f.code}</span>
                  </small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="ac-quick">
        <Link to="/templates" className="s4-btn ghost">
          دیدن قالب‌ها
        </Link>
        <Link to="/account/tickets" className="s4-btn ghost">
          تیکت تازه
        </Link>
        {admin && (
          <Link to="/admin" className="s4-btn main">
            پنل مدیریت
          </Link>
        )}
      </div>
    </div>
  );
}

/** The customer's site orders and the thread with the team. */
function Orders() {
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
        setOrders((list) => list?.map((o) => (o.id === openId ? { ...o, unreadByUser: false } : o)) ?? list);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "سفارش پیدا نشد"));
  }, [openId]);

  if (error) return <p className="sp-error">{error}</p>;
  if (!orders) return <p className="sp-hint center">…</p>;
  if (orders.length === 0)
    return (
      <div className="sp-empty">
        <b>هنوز سفارشی ثبت نکرده‌اید</b>
        <p>یک قالب را باز کنید، به سلیقه‌ی خودتان تغییرش دهید و «ثبت سفارش» را بزنید.</p>
        <Link to="/templates" className="s4-btn main">
          دیدن قالب‌ها
        </Link>
      </div>
    );

  return (
    <div className="sp-desk">
      <div className="sp-layout">
        <aside className="sp-list">
          <ul>
            {orders.map((o) => (
              <li key={o.id}>
                <button type="button" className={`sp-item ${o.id === openId ? "active" : ""}`} onClick={() => setParams({ open: o.id }, { replace: true })}>
                  <span className="top">
                    <b>{o.business || o.title}</b>
                    {o.unreadByUser && <i className="so-dot" aria-label="پیام تازه" />}
                  </span>
                  <span className="meta">
                    <StatusPill status={o.status} />
                    <small>
                      {formatDate(o.createdAt)} · <span className="ltr">{o.code}</span>
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="sp-detail">
          {!open ? (
            <p className="sp-hint center">یک سفارش را انتخاب کنید.</p>
          ) : (
            <div className="sp-ticket">
              <div className="sp-head">
                <div>
                  <h3>{open.business || open.title}</h3>
                  <small>
                    کد پیگیری <span className="ltr">{open.code}</span> · {formatDate(open.createdAt)}
                  </small>
                </div>
                <StatusPill status={open.status} />
              </div>
              {open.note && <p className="ac-note">{open.note}</p>}
              <OrderThread lines={open.messages} me="customer" onSend={async (text) => setOpen((await api.siteOrders.send(open.id, text)).order)} />
              {open.resumeId && (
                <Link to={`/resumes/${open.resumeId}`} className="s4-btn ghost sp-close">
                  دیدن و ویرایش طرح
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Tickets() {
  const [info, setInfo] = useState<SupportInfo | null>(null);
  useEffect(() => {
    api.support.info().then(setInfo, () => setInfo({ ticketsEnabled: true, rules: { maxOpen: 3, minText: 10, maxText: 2000 } }));
  }, []);
  if (!info) return <p className="sp-hint center">…</p>;
  return (
    <>
      <p className="ac-lead">
        شرایط ارسال تیکت را در <Link to="/support">صفحه‌ی پشتیبانی</Link> ببینید.
      </p>
      <Desk info={info} />
    </>
  );
}

function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const r = await api.updateMe({ name: name.trim(), email: email.trim() });
      setUser(r.user);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیره نشد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="sp-form ac-profile" onSubmit={save}>
      <label>
        <span>نام و نام خانوادگی</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
      </label>
      <label>
        <span>شماره‌ی موبایل</span>
        <input value={user?.phone ?? ""} readOnly dir="ltr" className="ac-readonly" />
        <small>با این شماره وارد می‌شوید و پیامک‌ها به آن می‌آید.</small>
      </label>
      <label>
        <span>ایمیل (اختیاری)</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} dir="ltr" autoComplete="email" placeholder="name@example.com" />
      </label>
      {error && <p className="sp-error">{error}</p>}
      {done && <p className="ac-done">ذخیره شد.</p>}
      <button className="s4-btn main" disabled={busy}>
        {busy ? "در حال ذخیره…" : "ذخیره"}
      </button>
    </form>
  );
}
