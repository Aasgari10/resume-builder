// The shop manager's trash: products (site content, saved with the editor) and the server's records —
// orders, customers, comments and tickets. Deleting any of them only moves it here; it can be
// restored, or removed for good, and the server removes it by itself after `days` days.

import { useEffect, useState } from "react";
import { SHOP_ORDER_STATUS_LABELS, formatToman, type Shop } from "@rb/schema";
import type { ShopTrash, ShopTrashKind } from "../../api";
import { showNumber } from "./fields";
import { Trash as ProductTrash } from "./ShopManagerMore";
import { SelectAll, errorText, faDate, useSelection } from "./ShopOrders";
import { NeedsPublish } from "./ShopPeople";
import { useShopApi } from "./shopApi";

type Kind = "products" | ShopTrashKind;
const LABELS: Record<Kind, string> = { products: "محصولات", orders: "سفارش‌ها", customers: "مشتریان", reviews: "نظرها", tickets: "تیکت‌ها" };

/** Days left before the server removes a row deleted at `deletedAt`. */
const daysLeft = (deletedAt: string, days: number) => Math.max(0, Math.ceil(days - (Date.now() - Date.parse(deletedAt)) / 86400000));

export function TrashTabs({ shop, setShop, resumeId, onChanged, productsOnly }: { shop: Shop; setShop: (s: Partial<Shop>) => void; resumeId?: string; onChanged?: () => void; productsOnly?: boolean }) {
  if (productsOnly) return <ProductTrash shop={shop} setShop={setShop} />;
  return <ServerTrash shop={shop} setShop={setShop} resumeId={resumeId} onChanged={onChanged} />;
}

function ServerTrash({ shop, setShop, resumeId, onChanged }: { shop: Shop; setShop: (s: Partial<Shop>) => void; resumeId?: string; onChanged?: () => void }) {
  const api = useShopApi();
  const [kind, setKind] = useState<Kind>("products");
  const [trash, setTrash] = useState<ShopTrash | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const sel = useSelection();
  const reload = () => {
    if (!resumeId) return;
    api.shopTrash(resumeId).then(setTrash, (e) => setError(errorText(e, "سطل زباله دریافت نشد")));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, [resumeId]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => sel.clear(), [kind]);

  const counts: Record<Kind, number> = {
    products: shop.products.filter((p) => p.trashed).length,
    orders: trash?.orders.length ?? 0,
    customers: trash?.customers.length ?? 0,
    reviews: trash?.reviews.length ?? 0,
    tickets: trash?.tickets.length ?? 0,
  };

  const act = async (what: "restore" | "purge", ids: string[]) => {
    if (!resumeId || kind === "products" || !ids.length) return;
    const n = showNumber(ids.length);
    if (what === "purge" && !window.confirm(`${n} مورد برای همیشه پاک شود؟ این کار برگشت ندارد.`)) return;
    setError(null);
    setNote(null);
    try {
      if (what === "restore") {
        const r = await api.restoreShopTrash(resumeId, kind, ids);
        setNote(r.failed.length ? `${showNumber(r.done)} مورد برگشت. برنگشت: ${r.failed.join("، ")}` : `${showNumber(r.done)} مورد برگشت.`);
      } else await api.purgeShopTrash(resumeId, kind, ids);
      sel.clear();
      reload();
      onChanged?.();
    } catch (e) {
      setError(errorText(e, "انجام نشد"));
    }
  };

  const rows: { id: string; title: string; sub: string; deletedAt: string }[] = !trash
    ? []
    : kind === "orders"
      ? trash.orders.map((o) => ({ id: o.id, title: `سفارش ${o.code} — ${o.customerName}`, sub: `${formatToman(o.total)} · ${SHOP_ORDER_STATUS_LABELS[o.status]} · ${faDate(o.createdAt)}`, deletedAt: o.deletedAt }))
      : kind === "customers"
        ? trash.customers.map((c) => ({ id: c.id, title: c.name, sub: `${c.phone}${c.reviews || c.tickets ? ` · همراه با ${showNumber(c.reviews)} نظر و ${showNumber(c.tickets)} تیکت` : ""}`, deletedAt: c.deletedAt }))
        : kind === "reviews"
          ? trash.reviews.map((r) => ({ id: r.id, title: `${"★".repeat(r.rating)} ${r.customer.name}`, sub: r.text, deletedAt: r.deletedAt }))
          : trash.tickets.map((t) => ({ id: t.id, title: t.subject, sub: `${t.customer.name} · ${showNumber(t.messages.length)} پیام`, deletedAt: t.deletedAt }));

  return (
    <div className="shm-cats">
      <div className="shm-chips" role="tablist" aria-label="بخش‌های سطل زباله">
        {(Object.keys(LABELS) as Kind[]).map((k) => (
          <button key={k} type="button" role="tab" className="btn ghost small" aria-pressed={kind === k} aria-selected={kind === k} onClick={() => setKind(k)}>
            {LABELS[k]}
            {counts[k] > 0 && <i className="shm-count">{showNumber(counts[k])}</i>}
          </button>
        ))}
      </div>

      {kind === "products" ? (
        <ProductTrash shop={shop} setShop={setShop} />
      ) : !trash ? (
        <NeedsPublish resumeId={resumeId} error={error} loading />
      ) : (
        <>
          <div className="shm-toolbar">
            <p className="muted">
              {LABELS[kind]} حذف‌شده این‌جا می‌مانند و بعد از {showNumber(trash.days)} روز خودکار پاک می‌شوند.
              {kind === "orders" && " کالاهای سفارش حذف‌شده به موجودی برگشته‌اند و با برگرداندن سفارش دوباره کم می‌شوند."}
              {kind === "customers" && " با برگرداندن مشتری، نظرها و تیکت‌هایی که همراهش حذف شده بودند هم برمی‌گردند."}
            </p>
            {rows.length > 0 && (
              <button type="button" className="btn ghost small danger" onClick={() => act("purge", rows.map((x) => x.id))}>
                خالی کردن این بخش
              </button>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          {note && <p className="muted">{note}</p>}
          {rows.length === 0 ? (
            <p className="muted shm-hint">چیزی در این بخش نیست.</p>
          ) : (
            <>
              <div className="row gap wrap">
                <SelectAll ids={rows.map((x) => x.id)} sel={sel} />
                {sel.picked.size > 0 && (
                  <>
                    <button type="button" className="btn small" onClick={() => act("restore", [...sel.picked])}>
                      برگرداندن انتخاب‌شده‌ها
                    </button>
                    <button type="button" className="btn ghost small danger" onClick={() => act("purge", [...sel.picked])}>
                      پاک کردن همیشگی
                    </button>
                  </>
                )}
              </div>
              {rows.map((x) => (
                <div key={x.id} className="shm-cat shm-trash-row">
                  <input type="checkbox" checked={sel.has(x.id)} onChange={() => sel.toggle(x.id)} aria-label="انتخاب" />
                  <span className="shm-trash-text">
                    <b>{x.title}</b>
                    <small className="muted">{x.sub}</small>
                    <small className="muted">
                      حذف: {faDate(x.deletedAt, true)} · {showNumber(daysLeft(x.deletedAt, trash.days))} روز تا پاک شدن خودکار
                    </small>
                  </span>
                  <button type="button" className="btn small" onClick={() => act("restore", [x.id])}>
                    برگرداندن
                  </button>
                  <button type="button" className="btn ghost small danger" onClick={() => act("purge", [x.id])}>
                    پاک کردن همیشگی
                  </button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
