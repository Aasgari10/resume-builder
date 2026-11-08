// The reports tab: sales over a chosen period (by day or month, product, category, city and status),
// the stock report, and Excel files of both.

import { useEffect, useState } from "react";
import { SHOP_ORDER_STATUSES, SHOP_ORDER_STATUS_LABELS, allVariantKeys, formatToman, unitPrice, type Product, type Shop, type ShopOrderStatus } from "@rb/schema";
import { type ShopOrder } from "../../api";
import { useShopApi } from "./shopApi";
import { buildXlsx, download, type Cell } from "../../lib/xlsx";
import { showNumber } from "./fields";
import { errorText } from "./ShopOrders";
import { stockOf } from "./ShopProducts";

const DAY = 86400000;
/** Persian-calendar keys that sort as text: "1405/08/17" and "1405/08". */
const dayKey = (iso: string) => new Date(iso).toLocaleDateString("fa-IR-u-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit" });
const monthKey = (iso: string) => new Date(iso).toLocaleDateString("fa-IR-u-nu-latn", { year: "numeric", month: "2-digit" });
const monthName = (iso: string) => new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long" });
const dayName = (iso: string) => new Date(iso).toLocaleDateString("fa-IR", { month: "short", day: "numeric" });
const faDateTime = (iso: string) => new Date(iso).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" });
const toInput = (t: number) => new Date(t - new Date(t).getTimezoneOffset() * 60000).toISOString().slice(0, 10);

type Range = "7" | "30" | "90" | "365" | "all" | "custom";
type StatusFilter = "sold" | "all" | ShopOrderStatus;

type Group = { key: string; label: string; total: number; count: number };
function group<T>(list: T[], key: (x: T) => string, label: (x: T) => string, total: (x: T) => number, count: (x: T) => number = () => 1): Group[] {
  const m = new Map<string, Group>();
  for (const x of list) {
    const k = key(x);
    const g = m.get(k) ?? { key: k, label: label(x), total: 0, count: 0 };
    g.total += total(x);
    g.count += count(x);
    m.set(k, g);
  }
  return [...m.values()];
}

function Bars({ rows, money = true }: { rows: Group[]; money?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => (money ? r.total : r.count)));
  return (
    <ul className="shm-bars">
      {rows.map((r) => (
        <li key={r.key} title={`${r.label}: ${formatToman(r.total)} · ${showNumber(r.count)}`}>
          <span>{r.label}</span>
          <i style={{ width: `${Math.max(2, ((money ? r.total : r.count) / max) * 100)}%` }} />
          <b>{money ? formatToman(r.total) : showNumber(r.count)}</b>
        </li>
      ))}
    </ul>
  );
}

export function Reports({ resumeId, shop }: { resumeId?: string; shop: Shop }) {
  const api = useShopApi();
  const [range, setRange] = useState<Range>("30");
  const [from, setFrom] = useState(toInput(Date.now() - 30 * DAY));
  const [to, setTo] = useState(toInput(Date.now()));
  const [status, setStatus] = useState<StatusFilter>("sold");
  const [cat, setCat] = useState("");
  const [orders, setOrders] = useState<ShopOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"sales" | "stock">("sales");

  // The period in ISO times; "all" asks for everything.
  const span = (() => {
    if (range === "all") return {};
    if (range === "custom") return { from: new Date(`${from}T00:00:00`).toISOString(), to: new Date(`${to}T23:59:59`).toISOString() };
    return { from: new Date(Date.now() - Number(range) * DAY).toISOString() };
  })();
  const load = () => {
    if (!resumeId) return;
    setError(null);
    setOrders(null);
    api
      .shopOrders(resumeId, { ...span, take: 5000 })
      .then((r) => setOrders(r.orders))
      .catch((e) => setError(errorText(e, "سفارش‌ها دریافت نشد")));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [resumeId, range, range === "custom" ? from : "", range === "custom" ? to : ""]);

  const products = new Map(shop.products.map((p) => [p.id, p]));
  const catName = new Map(shop.categories.map((c) => [c.id, c.name]));
  const catOf = (productId: string) => products.get(productId)?.categoryId ?? "";

  const header = (
    <div className="shm-toolbar shm-report-head">
      <div className="row gap wrap">
        <button type="button" className="btn ghost small" aria-pressed={view === "sales"} onClick={() => setView("sales")}>
          📈 گزارش فروش
        </button>
        <button type="button" className="btn ghost small" aria-pressed={view === "stock"} onClick={() => setView("stock")}>
          📦 گزارش موجودی
        </button>
      </div>
    </div>
  );
  if (view === "stock") return <div className="shm-reports">{header}<StockReport shop={shop} /></div>;

  if (!resumeId) return <div className="shm-reports">{header}<p className="muted shm-hint">گزارش فروش بعد از ذخیره و انتشار سایت این‌جا نمایش داده می‌شود. گزارش موجودی همین حالا در دسترس است.</p></div>;

  /* Filtering */
  const chosen = (orders ?? []).filter((o) => (status === "all" ? true : status === "sold" ? o.status !== "CANCELED" : o.status === status));
  type Line = ShopOrder["items"][number] & { order: ShopOrder };
  const allLines: Line[] = chosen.flatMap((o) => o.items.map((it) => ({ ...it, order: o })));
  const lines = cat ? allLines.filter((l) => catOf(l.id) === cat) : allLines;
  const inCat = cat ? chosen.filter((o) => o.items.some((it) => catOf(it.id) === cat)) : chosen;

  const revenue = cat ? lines.reduce((s, l) => s + l.total, 0) : inCat.reduce((s, o) => s + o.total, 0);
  const goods = lines.reduce((s, l) => s + l.total, 0);
  const discount = inCat.reduce((s, o) => s + (o.discount ?? 0), 0);
  const shipping = inCat.reduce((s, o) => s + o.shipping, 0);
  const units = lines.reduce((s, l) => s + l.qty, 0);
  const buyers = new Set(inCat.map((o) => o.phone)).size;
  const canceled = (orders ?? []).filter((o) => o.status === "CANCELED").length;
  const avg = inCat.length ? Math.round(revenue / inCat.length) : 0;

  const days = Math.ceil(((span.to ? Date.parse(span.to) : Date.now()) - (span.from ? Date.parse(span.from) : Date.parse(inCat[inCat.length - 1]?.createdAt ?? new Date().toISOString()))) / DAY);
  const byTime = days <= 62;
  const timeRows = group(
    [...inCat].reverse(),
    (o) => (byTime ? dayKey(o.createdAt) : monthKey(o.createdAt)),
    (o) => (byTime ? dayName(o.createdAt) : monthName(o.createdAt)),
    (o) => (cat ? o.items.filter((it) => catOf(it.id) === cat).reduce((s, it) => s + it.total, 0) : o.total),
  ).sort((a, b) => a.key.localeCompare(b.key));
  const productRows = group(lines, (l) => l.id + (l.size ?? ""), (l) => (l.size ? `${l.name} (${l.size})` : l.name), (l) => l.total, (l) => l.qty).sort((a, b) => b.count - a.count);
  const catRows = group(allLines, (l) => catOf(l.id) || "-", (l) => catName.get(catOf(l.id)) ?? "بدون دسته", (l) => l.total, (l) => l.qty).sort((a, b) => b.total - a.total);
  const cityRows = group(inCat, (o) => o.city?.trim() || "-", (o) => o.city?.trim() || "نامشخص", (o) => o.total).sort((a, b) => b.total - a.total);
  const couponRows = group(inCat.filter((o) => o.couponCode), (o) => o.couponCode!, (o) => o.couponCode!, (o) => o.discount ?? 0).sort((a, b) => b.count - a.count);
  const statusRows = SHOP_ORDER_STATUSES.map((s) => ({ s, n: (orders ?? []).filter((o) => o.status === s).length }));

  const periodText = range === "all" ? "همه‌ی زمان‌ها" : range === "custom" ? `${new Date(span.from!).toLocaleDateString("fa-IR")} تا ${new Date(span.to!).toLocaleDateString("fa-IR")}` : `${showNumber(Number(range))} روز اخیر`;
  const exportSales = () => {
    const summary: Cell[][] = [
      ["عنوان", "مقدار"],
      ["بازه", periodText],
      ["وضعیت سفارش‌ها", status === "sold" ? "همه به‌جز لغوشده" : status === "all" ? "همه" : SHOP_ORDER_STATUS_LABELS[status]],
      ["دسته", cat ? (catName.get(cat) ?? "") : "همه"],
      ["تعداد سفارش", inCat.length],
      ["مبلغ فروش (تومان)", revenue],
      ["جمع کالاها (تومان)", goods],
      ["جمع تخفیف‌ها (تومان)", discount],
      ["جمع هزینه‌ی ارسال (تومان)", shipping],
      ["میانگین هر سفارش (تومان)", avg],
      ["تعداد کالای فروخته‌شده", units],
      ["تعداد خریداران", buyers],
      ["سفارش‌های لغوشده در بازه", canceled],
      ["تاریخ گزارش", new Date().toLocaleString("fa-IR")],
    ];
    const orderRows: Cell[][] = [
      ["کد سفارش", "تاریخ", "وضعیت", "مشتری", "عضو", "تلفن", "شهر", "نشانی", "کد پستی", "توضیح", "جمع کالاها", "تخفیف", "کد تخفیف", "ارسال", "مبلغ کل"],
      ...inCat.map((o) => [o.code, faDateTime(o.createdAt), SHOP_ORDER_STATUS_LABELS[o.status], o.customerName, o.customerId ? "بله" : "", o.phone, o.city ?? "", o.address, o.postalCode ?? "", o.note ?? "", o.subtotal, o.discount ?? 0, o.couponCode ?? "", o.shipping, o.total]),
    ];
    const itemRows: Cell[][] = [
      ["کد سفارش", "تاریخ", "وضعیت", "محصول", "انتخاب", "دسته", "تعداد", "قیمت واحد", "جمع"],
      ...lines.map((l) => [l.order.code, faDateTime(l.order.createdAt), SHOP_ORDER_STATUS_LABELS[l.order.status], l.name, l.size ?? "", catName.get(catOf(l.id)) ?? "", l.qty, l.unit, l.total]),
    ];
    const g = (title: string, rows: Group[], countLabel = "تعداد سفارش"): Cell[][] => [[title, countLabel, "مبلغ (تومان)"], ...rows.map((r) => [r.label, r.count, r.total])];
    download(
      buildXlsx([
        { name: "خلاصه", rows: summary, widths: [30, 30] },
        { name: "سفارش‌ها", rows: orderRows },
        { name: "اقلام سفارش‌ها", rows: itemRows },
        { name: "پرفروش‌ها", rows: g("محصول", productRows, "تعداد فروش") },
        { name: byTime ? "فروش روزانه" : "فروش ماهانه", rows: g(byTime ? "روز" : "ماه", timeRows) },
        { name: "دسته‌ها", rows: g("دسته", catRows, "تعداد فروش") },
        { name: "شهرها", rows: g("شهر", cityRows) },
        { name: "کدهای تخفیف", rows: g("کد", couponRows, "دفعات استفاده") },
      ]),
      `sales-report-${toInput(Date.now())}.xlsx`,
    );
  };

  return (
    <div className="shm-reports">
      {header}
      <div className="shm-filters">
        <div className="row gap wrap">
          {(
            [
              ["7", "۷ روز"],
              ["30", "۳۰ روز"],
              ["90", "۳ ماه"],
              ["365", "یک سال"],
              ["all", "همه"],
              ["custom", "بازه‌ی دلخواه"],
            ] as [Range, string][]
          ).map(([id, label]) => (
            <button key={id} type="button" className="btn ghost small" aria-pressed={range === id} onClick={() => setRange(id)}>
              {label}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <div className="row gap wrap">
            <label className="shm-inline">
              از <input type="date" dir="ltr" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} />
            </label>
            <label className="shm-inline">
              تا <input type="date" dir="ltr" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} />
            </label>
          </div>
        )}
        <div className="row gap wrap">
          <select value={status} aria-label="وضعیت سفارش" onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            <option value="sold">همه به‌جز لغوشده‌ها</option>
            <option value="all">همه‌ی سفارش‌ها</option>
            {SHOP_ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                فقط {SHOP_ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select value={cat} aria-label="دسته" onChange={(e) => setCat(e.target.value)}>
            <option value="">همه‌ی دسته‌ها</option>
            {shop.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn ghost small" onClick={load}>
            به‌روزرسانی
          </button>
          <button type="button" className="btn small" disabled={!inCat.length} onClick={exportSales}>
            📥 دانلود اکسل گزارش
          </button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {!orders ? (
        !error && <p className="muted shm-hint">در حال دریافت…</p>
      ) : (
        <>
          <div className="shm-stats">
            <div>
              <small>مبلغ فروش</small>
              <b>{formatToman(revenue)}</b>
            </div>
            <div>
              <small>تعداد سفارش</small>
              <b>{showNumber(inCat.length)}</b>
            </div>
            <div>
              <small>میانگین هر سفارش</small>
              <b>{formatToman(avg)}</b>
            </div>
            <div>
              <small>کالای فروخته‌شده</small>
              <b>{showNumber(units)} عدد</b>
            </div>
            <div>
              <small>خریداران</small>
              <b>{showNumber(buyers)} نفر</b>
            </div>
            <div>
              <small>جمع تخفیف‌ها</small>
              <b>{formatToman(discount)}</b>
            </div>
          </div>
          <div className="shm-status-row">
            {statusRows.map(({ s, n }) => (
              <span key={s}>
                {SHOP_ORDER_STATUS_LABELS[s]}: <b>{showNumber(n)}</b>
              </span>
            ))}
          </div>
          {inCat.length === 0 ? (
            <p className="muted shm-hint">در این بازه فروشی ثبت نشده است.</p>
          ) : (
            <div className="shm-report-grid">
              <section className="wide">
                <h4>{byTime ? "فروش روزانه" : "فروش ماهانه"}</h4>
                <Columns rows={timeRows} />
              </section>
              <section>
                <h4>پرفروش‌ترین محصولات</h4>
                <Bars rows={productRows.slice(0, 10)} money={false} />
              </section>
              <section>
                <h4>فروش هر دسته</h4>
                <Bars rows={catRows} />
              </section>
              <section>
                <h4>شهرها</h4>
                <Bars rows={cityRows.slice(0, 10)} />
              </section>
              {couponRows.length > 0 && (
                <section>
                  <h4>کدهای تخفیف (دفعات استفاده)</h4>
                  <Bars rows={couponRows} money={false} />
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Upright bars for sales over time, with the value on hover. */
function Columns({ rows }: { rows: Group[] }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <div className="shm-cols" role="img" aria-label="نمودار فروش">
      {rows.map((r) => (
        <div key={r.key} className="shm-col" title={`${r.label}: ${formatToman(r.total)} (${showNumber(r.count)} سفارش)`}>
          <i style={{ height: `${Math.max(2, (r.total / max) * 100)}%` }} />
          <small>{r.label}</small>
        </div>
      ))}
    </div>
  );
}

/* ───────────── Stock report ───────────── */

type Threshold = "0" | "5" | "10" | "20" | "50" | "custom";

function StockReport({ shop }: { shop: Shop }) {
  const [limit, setLimit] = useState<Threshold>("5");
  const [custom, setCustom] = useState("15");
  const [cat, setCat] = useState("");
  const max = limit === "custom" ? Math.max(0, Number(custom.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))) || 0) : Number(limit);
  const catName = new Map(shop.categories.map((c) => [c.id, c.name]));
  const live = shop.products.filter((p) => !p.trashed && (!cat || p.categoryId === cat));

  // One row per product, or per combination when combinations keep their own stock.
  type Row = { p: Product; choice: string; left: number | undefined; price: number };
  const rows: Row[] = live.flatMap((p) => {
    const keys = allVariantKeys(p);
    if (keys.length && p.variants?.some((v) => v.stock !== undefined)) {
      return keys.map((k) => {
        const v = p.variants?.find((x) => x.key === k);
        return { p, choice: k, left: v?.stock ?? p.stock, price: v?.price ?? unitPrice(p) };
      });
    }
    return [{ p, choice: "", left: stockOf(p), price: unitPrice(p) }];
  });
  const out = rows.filter((r) => r.left === 0);
  const low = rows.filter((r) => r.left !== undefined && r.left > 0 && r.left <= max);
  const value = rows.reduce((s, r) => s + (r.left ?? 0) * r.price, 0);
  const units = rows.reduce((s, r) => s + (r.left ?? 0), 0);

  const table = (list: Row[]): (string | number)[][] =>
    list.map((r) => [r.p.name, r.choice, catName.get(r.p.categoryId ?? "") ?? "", r.left === undefined ? "نامحدود" : r.left, r.price, r.left ? r.left * r.price : 0]);
  const head = ["محصول", "انتخاب", "دسته", "موجودی", "قیمت واحد", "ارزش موجودی"];
  const exportStock = () =>
    download(
      buildXlsx([
        { name: "تمام‌شده‌ها", rows: [head, ...table(out)] },
        { name: max ? `کمتر از ${max}` : "رو به اتمام", rows: [head, ...table(low)] },
        { name: "همه‌ی کالاها", rows: [head, ...table(rows), [], ["جمع", "", "", units, "", value]] },
      ]),
      `stock-report-${toInput(Date.now())}.xlsx`,
    );

  const list = (title: string, items: Row[], empty: string) => (
    <section className="shm-panel-box">
      <h4>
        {title} ({showNumber(items.length)})
      </h4>
      {items.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <div className="shm-table-wrap">
          <table className="shm-table">
            <thead>
              <tr>
                <th>محصول</th>
                <th>دسته</th>
                <th>موجودی</th>
                <th>قیمت</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.p.id + r.choice}>
                  <td>
                    {r.p.name}
                    {r.choice && <small className="muted"> ({r.choice})</small>}
                  </td>
                  <td>{catName.get(r.p.categoryId ?? "") ?? "—"}</td>
                  <td className={r.left === 0 ? "shm-red" : "shm-warn"}>{r.left === 0 ? "تمام شده" : showNumber(r.left ?? 0)}</td>
                  <td>{formatToman(r.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  return (
    <>
      <div className="shm-filters">
        <label className="shm-inline">
          رو به اتمام یعنی موجودی کمتر از
          <select value={limit} onChange={(e) => setLimit(e.target.value as Threshold)}>
            {["5", "10", "20", "50"].map((n) => (
              <option key={n} value={n}>
                {showNumber(Number(n))}
              </option>
            ))}
            <option value="custom">عدد دلخواه</option>
          </select>
          {limit === "custom" && <input inputMode="numeric" value={custom} aria-label="عدد دلخواه" onChange={(e) => setCustom(e.target.value)} style={{ width: 70 }} />}
        </label>
        <select value={cat} aria-label="دسته" onChange={(e) => setCat(e.target.value)}>
          <option value="">همه‌ی دسته‌ها</option>
          {shop.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn small" onClick={exportStock}>
          📥 دانلود اکسل موجودی
        </button>
      </div>
      <div className="shm-stats">
        <div>
          <small>کل کالاها (ردیف)</small>
          <b>{showNumber(rows.length)}</b>
        </div>
        <div>
          <small>تمام‌شده</small>
          <b className={out.length ? "shm-red" : ""}>{showNumber(out.length)}</b>
        </div>
        <div>
          <small>رو به اتمام</small>
          <b className={low.length ? "shm-warn" : ""}>{showNumber(low.length)}</b>
        </div>
        <div>
          <small>ارزش موجودی انبار</small>
          <b>{formatToman(value)}</b>
        </div>
      </div>
      {list("تمام‌شده‌ها", out, "هیچ کالایی تمام نشده است.")}
      {list(`رو به اتمام (موجودی ${showNumber(max)} یا کمتر)`, low, "کالای رو به اتمامی نیست.")}
      <p className="muted">کالاهایی که موجودی‌شان «نامحدود» است در این گزارش شمرده نمی‌شوند.</p>
    </>
  );
}
