// Platform administration: overview, orders, users, template pricing and site moderation.
// Access is enforced by the API; this page only hides itself from non-admins.

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ApiError,
  api,
  type AdminOrder,
  type AdminSite,
  type AdminStats,
  type AdminTemplate,
  type AdminUser,
  type Paged,
} from "../api";
import { useAuth } from "../auth";
import { formatToman } from "../format";

type Tab = "overview" | "orders" | "users" | "templates" | "sites";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "نمای کلی" },
  { id: "orders", label: "سفارش‌ها" },
  { id: "users", label: "کاربران" },
  { id: "templates", label: "قالب‌ها" },
  { id: "sites", label: "سایت‌ها" },
];

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" });
const formatDate = (iso: string | null) => (iso ? dateFormatter.format(new Date(iso)) : "—");
const fa = (n: number) => n.toLocaleString("fa-IR");
const errorText = (e: unknown) => (e instanceof ApiError ? e.message : "خطای ناشناخته");

export function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  if (user?.role !== "ADMIN") return <p className="center muted">صفحه پیدا نشد</p>;

  return (
    <div className="stack">
      <h1>پنل مدیریت</h1>
      <div className="admin-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "overview" && <Overview />}
      {tab === "orders" && <Orders />}
      {tab === "users" && <Users />}
      {tab === "templates" && <Templates />}
      {tab === "sites" && <Sites />}
    </div>
  );
}

/* ───────────── Shared ───────────── */

/** Loads one page of a list; reloads when the page or any filter changes. */
function usePaged<T>(load: (page: number) => Promise<Paged<T>>, deps: unknown[]) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Filters changed: back to the first page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), deps);

  useEffect(() => {
    let active = true;
    setError(null);
    load(page)
      .then((d) => active && setData(d))
      .catch((e) => active && setError(errorText(e)));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, nonce, ...deps]);

  return { data, error, page, setPage, reload: () => setNonce((n) => n + 1) };
}

function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="row gap pager">
      <button className="btn ghost small-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        قبلی
      </button>
      <span className="muted small">
        صفحه‌ی {fa(page)} از {fa(pages)}
      </span>
      <button className="btn ghost small-btn" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        بعدی
      </button>
    </div>
  );
}

/** Search input that reports its value 300 ms after typing stops. */
function SearchBox({ placeholder, onSearch }: { placeholder: string; onSearch: (q: string) => void }) {
  const [value, setValue] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => onSearch(value.trim()), 300);
    return () => clearTimeout(timer);
  }, [value, onSearch]);
  return <input className="admin-search" value={value} placeholder={placeholder} onChange={(e) => setValue(e.target.value)} />;
}

function Table({ head, children, empty }: { head: string[]; children: ReactNode[]; empty: string }) {
  if (children.length === 0) return <p className="muted">{empty}</p>;
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/* ───────────── Overview ───────────── */

function Overview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.admin
      .stats()
      .then((r) => setStats(r.stats))
      .catch((e) => setError(errorText(e)));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p className="muted">در حال بارگذاری…</p>;

  const cards: { label: string; value: string; hint?: string }[] = [
    { label: "درآمد کل", value: formatToman(stats.revenue), hint: `${fa(stats.paidOrders)} سفارش موفق` },
    { label: "درآمد ۳۰ روز اخیر", value: formatToman(stats.revenue30d), hint: `${fa(stats.paidOrders30d)} سفارش موفق` },
    { label: "کاربران", value: fa(stats.users), hint: `${fa(stats.newUsers7d)} کاربر جدید در ۷ روز اخیر` },
    { label: "رزومه‌ها", value: fa(stats.resumes) },
    { label: "سایت‌های منتشرشده", value: fa(stats.publishedSites) },
    { label: "پرداخت‌های ناموفق ۳۰ روز اخیر", value: fa(stats.failedOrders30d), hint: `${fa(stats.pendingOrders)} سفارش در انتظار پرداخت` },
  ];

  return (
    <div className="stat-grid">
      {cards.map((c) => (
        <div key={c.label} className="card stat-card">
          <span className="muted small">{c.label}</span>
          <strong>{c.value}</strong>
          {c.hint && <span className="muted small">{c.hint}</span>}
        </div>
      ))}
    </div>
  );
}

/* ───────────── Orders ───────────── */

const ORDER_STATUS: Record<AdminOrder["status"], { label: string; tone: string }> = {
  PAID: { label: "پرداخت‌شده", tone: "ok" },
  PENDING: { label: "در انتظار", tone: "wait" },
  FAILED: { label: "ناموفق", tone: "fail" },
  CANCELED: { label: "لغوشده", tone: "fail" },
};

function Orders() {
  const [status, setStatus] = useState("");
  const { data, error, page, setPage } = usePaged((p) => api.admin.orders(p, status), [status]);

  return (
    <div className="card stack">
      <div className="row gap wrap">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">همه‌ی وضعیت‌ها</option>
          {Object.entries(ORDER_STATUS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {data && <span className="muted small">{fa(data.total)} سفارش</span>}
      </div>
      {error && <p className="error">{error}</p>}
      {data && (
        <>
          <Table head={["تاریخ", "خریدار", "قالب", "مبلغ", "وضعیت", "کد پیگیری"]} empty="سفارشی پیدا نشد.">
            {data.items.map((o) => (
              <tr key={o.id}>
                <td>{formatDate(o.createdAt)}</td>
                <td className="ltr">{o.phone}</td>
                <td>{o.templateName ?? "—"}</td>
                <td>{formatToman(o.amount)}</td>
                <td>
                  <span className={`status-pill ${ORDER_STATUS[o.status].tone}`}>{ORDER_STATUS[o.status].label}</span>
                </td>
                <td className="ltr">{o.refId ?? "—"}</td>
              </tr>
            ))}
          </Table>
          <Pager page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

/* ───────────── Users ───────────── */

function Users() {
  const [q, setQ] = useState("");
  const { data, error, page, setPage } = usePaged((p) => api.admin.users(p, q), [q]);
  const onSearch = useCallback((v: string) => setQ(v), []);

  return (
    <div className="card stack">
      <div className="row gap wrap">
        <SearchBox placeholder="جستجوی شماره یا نام" onSearch={onSearch} />
        {data && <span className="muted small">{fa(data.total)} کاربر</span>}
      </div>
      {error && <p className="error">{error}</p>}
      {data && (
        <>
          <Table head={["شماره", "نام", "نقش", "رزومه", "سایت", "خرید", "عضویت"]} empty="کاربری پیدا نشد.">
            {data.items.map((u: AdminUser) => (
              <tr key={u.id}>
                <td className="ltr">{u.phone}</td>
                <td>{u.name ?? "—"}</td>
                <td>{u.role === "ADMIN" ? "مدیر" : "کاربر"}</td>
                <td>{fa(u.resumes)}</td>
                <td>{fa(u.sites)}</td>
                <td>{fa(u.purchases)}</td>
                <td>{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </Table>
          <Pager page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

/* ───────────── Templates ───────────── */

function Templates() {
  const [templates, setTemplates] = useState<AdminTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.admin
      .templates()
      .then((r) => setTemplates(r.templates))
      .catch((e) => setError(errorText(e)));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!templates) return <p className="muted">در حال بارگذاری…</p>;

  const replace = (t: AdminTemplate) => setTemplates((list) => list?.map((x) => (x.id === t.id ? { ...x, ...t } : x)) ?? null);

  return (
    <div className="stack">
      {templates.map((t) => (
        <TemplateRow key={t.id} template={t} onSaved={replace} />
      ))}
    </div>
  );
}

function TemplateRow({ template, onSaved }: { template: AdminTemplate; onSaved: (t: AdminTemplate) => void }) {
  const [name, setName] = useState(template.name);
  const [toman, setToman] = useState(String(template.price / 10));
  const [isPremium, setIsPremium] = useState(template.isPremium);
  const [isActive, setIsActive] = useState(template.isActive);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const price = Math.round(Number(toman.replace(/[,٬\s]/g, "")) * 10);
  const priceValid = Number.isFinite(price) && price >= 0;
  const changed =
    name.trim() !== template.name || price !== template.price || isPremium !== template.isPremium || isActive !== template.isActive;

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const { template: saved } = await api.admin.updateTemplate(template.id, {
        name: name.trim(),
        price: isPremium ? price : 0,
        isPremium,
        isActive,
      });
      onSaved({ ...template, ...saved });
      setToman(String(saved.price / 10));
      setMessage({ ok: true, text: "ذخیره شد" });
    } catch (e) {
      setMessage({ ok: false, text: errorText(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card template-row">
      <div className="template-row-head">
        <strong>{template.name}</strong>
        <span className="muted small ltr">{template.id}</span>
        <span className="badge">{template.kind === "PDF" ? "پی‌دی‌اف" : "سایت"}</span>
        <span className="muted small">
          {fa(template.sales)} فروش · {fa(template.sites)} سایت
        </span>
      </div>
      <div className="template-row-fields">
        <label className="field">
          <span>نام</span>
          <input value={name} maxLength={50} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>قیمت (تومان)</span>
          <input
            className="ltr"
            inputMode="numeric"
            value={isPremium ? toman : "0"}
            disabled={!isPremium}
            onChange={(e) => setToman(e.target.value)}
          />
        </label>
        <label className="check">
          <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
          پولی
        </label>
        <label className="check">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          فعال
        </label>
        <button className="btn" disabled={!changed || busy || !name.trim() || (isPremium && (!priceValid || price <= 0))} onClick={save}>
          {busy ? "…" : "ذخیره"}
        </button>
      </div>
      {message && <p className={message.ok ? "muted small" : "error"}>{message.text}</p>}
    </div>
  );
}

/* ───────────── Sites ───────────── */

function Sites() {
  const [q, setQ] = useState("");
  const { data, error, page, setPage, reload } = usePaged((p) => api.admin.sites(p, q), [q]);
  const onSearch = useCallback((v: string) => setQ(v), []);
  const [actionError, setActionError] = useState<string | null>(null);

  async function takeDown(site: AdminSite) {
    if (!confirm(`سایت «${site.subdomain}» از دسترس خارج شود؟ صاحب سایت می‌تواند دوباره منتشرش کند.`)) return;
    setActionError(null);
    try {
      await api.admin.unpublishSite(site.id);
      reload();
    } catch (e) {
      setActionError(errorText(e));
    }
  }

  return (
    <div className="card stack">
      <div className="row gap wrap">
        <SearchBox placeholder="جستجوی آدرس یا شماره" onSearch={onSearch} />
        {data && <span className="muted small">{fa(data.total)} سایت</span>}
      </div>
      {(error || actionError) && <p className="error">{error ?? actionError}</p>}
      {data && (
        <>
          <Table head={["آدرس", "صاحب", "قالب", "وضعیت", "آخرین انتشار", ""]} empty="سایتی پیدا نشد.">
            {data.items.map((s) => (
              <tr key={s.id}>
                <td className="ltr">
                  {s.isPublished ? (
                    <a href={s.url ?? s.path} target="_blank" rel="noopener noreferrer">
                      {s.subdomain}
                    </a>
                  ) : (
                    s.subdomain
                  )}
                </td>
                <td className="ltr">{s.phone}</td>
                <td>{s.templateName}</td>
                <td>
                  <span className={`status-pill ${s.isPublished ? "ok" : "wait"}`}>{s.isPublished ? "منتشرشده" : "غیرفعال"}</span>
                </td>
                <td>{formatDate(s.publishedAt)}</td>
                <td>
                  {s.isPublished && (
                    <button className="btn danger ghost small-btn" onClick={() => takeDown(s)}>
                      لغو انتشار
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <Pager page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
