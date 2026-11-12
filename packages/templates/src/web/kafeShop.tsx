/** @jsxRuntime automatic @jsxImportSource react */
// Pinned per file: this package is compiled by different tools (Vite, tsx, tsup).
// The coffee shop of the "Kafe" template: only the categories the owner marked "sold online"
// (packs of beans, capsules, mugs...) can be bought; the rest of the menu stays for reading.
// Shop list, product page, cart, checkout, account and the thank-you page, in the cafe's light look.

import type { CSSProperties, ReactNode } from "react";
import { formatToman, priceCart, unitPrice, type Product, type Shop, type Visitor } from "@rb/schema";
import type { Ctx } from "./kit";
import { safeUrl } from "../format";
import { PageLink, ed } from "./parts";
import { ZoomOpen } from "./zoom";
import { AccountPage, CouponBox, OptionPicker, Reviews, SORTS, SpecsTable, Stars, filterProducts, hasChoices, onSale, percentOff } from "./shopkit";

export type ShopView = { ctx: Ctx; shop: Shop; link: (p: string) => string; editing: boolean; page: string; visitor: Visitor };

const live = (shop: Shop | undefined) => (shop?.products ?? []).filter((p) => !p.hidden && !p.trashed && p.name.trim());
/** Categories sold online. */
export const soldCategories = (shop: Shop | undefined) => (shop?.categories ?? []).filter((c) => c.sell);
/** Products that can be bought: those of a category sold online. */
export const soldProducts = (shop: Shop | undefined) => {
  const ids = new Set(soldCategories(shop).map((c) => c.id));
  return live(shop).filter((p) => p.categoryId && ids.has(p.categoryId));
};
export const productPath = (p: Product) => `/product/${p.id}`;

const money = (view: ShopView, n: number) => formatToman(n, view.ctx.data.locale);
const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
const pic = (p: Product) => safeUrl(p.images[0]);

const PATHS: Record<string, string> = {
  bag: "M6 7h12l1 13H5zM9 7V6a3 3 0 0 1 6 0v1",
  minus: "M5 12h14",
  plus: "M12 5v14M5 12h14",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  check: "M5 12.5l4.5 4.5L19 7.5",
  zoom: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M11 8v6M8 11h6",
  down: "M6 9l6 6 6-6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6",
};
export function KIcon({ name, className = "kf-ico" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

function Price({ view, p }: { view: ShopView; p: Product }) {
  return (
    <span className="kf-sprice">
      {onSale(p) && <s>{money(view, p.price)}</s>}
      <b>{money(view, unitPrice(p))}</b>
    </span>
  );
}

/** A form button for the cart (add, change the number, remove). */
export function Act({ view, op, id, children, className, qty, size, label }: { view: ShopView; op: "add" | "remove" | "set"; id: string; children: ReactNode; className?: string; qty?: number; size?: string; label?: string }) {
  return (
    <form method="post" action={view.link("/_cart")} className="kf-act">
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="back" value={view.page} />
      {qty !== undefined && <input type="hidden" name="qty" value={qty} />}
      {size !== undefined && <input type="hidden" name="size" value={size} />}
      <button type="submit" className={className} aria-label={label} title={label}>
        {children}
      </button>
    </form>
  );
}

/** Header bag with the number of items, linking to the cart. */
export function BagLink({ view }: { view: ShopView }) {
  const count = priceCart(view.shop, view.visitor.cart).count;
  return (
    <PageLink to="/cart" link={view.link} className="kf-bag" current={view.page === "/cart"}>
      <KIcon name="bag" />
      <span className="sr-only">سبد خرید</span>
      {count > 0 && <i>{fa(count)}</i>}
    </PageLink>
  );
}

function Empty({ view, text }: { view: ShopView; text: string }) {
  return (
    <div className="kf-sempty">
      <KIcon name="bag" className="kf-sempty-ico" />
      <p>{text}</p>
      <PageLink to="/shop" link={view.link} className="kf-btn">
        بازگشت به فروشگاه
      </PageLink>
    </div>
  );
}

function Heading({ title, text }: { title: string; text?: string }) {
  return (
    <div className="kf-shead">
      <h1>{title}</h1>
      {text && <p>{text}</p>}
    </div>
  );
}

export function ProductCard({ view, p, i = 0 }: { view: ShopView; p: Product; i?: number }) {
  const img = pic(p);
  const soldOut = p.stock === 0;
  const rating = view.visitor.ratings?.[p.id];
  return (
    <article className="kf-card kf-rise" style={{ "--i": i % 4 } as CSSProperties} data-product={p.id}>
      <PageLink to={productPath(p)} link={view.link} className="kf-card-pic">
        {img ? <img src={img} alt={p.name} loading="lazy" /> : <b>{p.name.charAt(0)}</b>}
        {soldOut ? <span className="kf-tag dark">تمام شد</span> : onSale(p) ? <span className="kf-tag">{fa(percentOff(p))}٪</span> : null}
      </PageLink>
      <PageLink to={productPath(p)} link={view.link} className="kf-card-name">
        {p.name}
      </PageLink>
      <Price view={view} p={p} />
      {rating && <Stars value={rating.avg} count={rating.count} />}
      {!soldOut &&
        (hasChoices(p) ? (
          <PageLink to={productPath(p)} link={view.link} className="kf-card-add">
            انتخاب گزینه‌ها
          </PageLink>
        ) : (
          <Act view={view} op="add" id={p.id} className="kf-card-add" label={`افزودن ${p.name} به سبد`}>
            افزودن به سبد
          </Act>
        ))}
    </article>
  );
}

export function ShopList(view: ShopView & { categoryId?: string }) {
  const { shop, link, visitor } = view;
  const q = visitor.query;
  const { list, cats, cat, active } = filterProducts(soldProducts(shop), soldCategories(shop), q, view.categoryId);
  const here = view.categoryId ? `/category/${view.categoryId}` : "/shop";
  const sort = SORTS.find(([k]) => k === (q.sort ?? "new")) ?? SORTS[0]!;
  return (
    <section className="kf-wrap kf-inner">
      <Heading title={cat?.name ?? "فروشگاه قهوه"} text="دانه‌ی تازه‌برشته و هر آنچه برای یک قهوه‌ی خوب در خانه لازم دارید." />
      {cats.length > 1 && (
        <nav className="kf-scats">
          <PageLink to="/shop" link={link} current={!cat}>
            همه
          </PageLink>
          {cats.map((c) => (
            <PageLink key={c.id} to={`/category/${c.id}`} link={link} current={cat?.id === c.id}>
              {c.name}
            </PageLink>
          ))}
        </nav>
      )}
      <div className="kf-tools">
        <span>
          {fa(list.length)} محصول
          {active && (
            <>
              {" · "}
              <PageLink to={here} link={link}>
                حذف فیلترها
              </PageLink>
            </>
          )}
        </span>
        <details className="kf-sort">
          <summary>
            {sort[1]} <KIcon name="down" />
          </summary>
          <div>
            {SORTS.map(([k, label]) => (
              <form key={k} method="get" action={link(here)}>
                {Object.entries(q)
                  .filter(([key, v]) => v && key !== "sort")
                  .map(([key, v]) => (
                    <input key={key} type="hidden" name={key} value={v} />
                  ))}
                <input type="hidden" name="sort" value={k} />
                <button type="submit" aria-current={k === sort[0] || undefined}>
                  {label}
                </button>
              </form>
            ))}
          </div>
        </details>
      </div>
      {list.length ? (
        <div className="kf-grid">
          {list.map((p, k) => (
            <ProductCard key={p.id} view={view} p={p} i={k} />
          ))}
        </div>
      ) : (
        <p className="kf-notice">{active ? "محصولی با این فیلترها پیدا نشد." : view.editing ? "در پنل، کنار دسته‌ای که می‌فروشید «فروش آنلاین» را روشن کنید." : "به‌زودی محصولات این‌جا قرار می‌گیرند."}</p>
      )}
    </section>
  );
}

export function ProductView(view: ShopView & { id: string }) {
  const { shop, link, visitor } = view;
  const p = soldProducts(shop).find((x) => x.id === view.id)!;
  const cat = shop.categories.find((c) => c.id === p.categoryId);
  const related = soldProducts(shop)
    .filter((x) => x.id !== p.id && x.categoryId === p.categoryId)
    .slice(0, 4);
  const soldOut = p.stock === 0;
  const imgs = p.images.map((u) => safeUrl(u)).filter((u): u is string => Boolean(u));
  const rating = visitor.ratings?.[p.id];
  const [lead, ...rest] = (p.description ?? "").split(/\n\s*\n|\n/).filter((x) => x.trim());
  return (
    <>
      <section className="kf-wrap kf-inner kf-product" data-product={p.id}>
        <div className="kf-gallery-p">
          {(imgs.length ? imgs : [undefined]).map((src, k) =>
            src ? (
              <ZoomOpen key={k} id={`${p.id}-${k}`} className="kf-gal-p">
                <img src={src} alt={p.name} />
              </ZoomOpen>
            ) : (
              <span key={k} className="kf-gal-p" />
            ),
          )}
        </div>
        <div className="kf-pinfo">
          {cat && (
            <PageLink to={`/category/${cat.id}`} link={link} className="kf-pcat">
              {cat.name}
            </PageLink>
          )}
          <h1>{p.name}</h1>
          <Price view={view} p={p} />
          {rating && <Stars value={rating.avg} count={rating.count} />}
          {lead && <p className="kf-plead">{lead}</p>}
          {soldOut ? (
            <p className="kf-out">این محصول فعلاً موجود نیست.</p>
          ) : (
            <form method="post" action={link("/_cart")} className="kf-buy">
              <input type="hidden" name="op" value="add" />
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="back" value={view.page} />
              <OptionPicker p={p} />
              <div className="kf-buy-row">
                <label className="kf-qty">
                  <span className="sr-only">تعداد</span>
                  <input type="number" name="qty" min={1} max={p.stock ?? 50} defaultValue={1} />
                </label>
                <button type="submit" className="kf-btn">
                  افزودن به سبد
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
      <section className="kf-wrap kf-ptabs">
        <input type="radio" name="kf-tab" id="kf-tab-1" defaultChecked />
        <input type="radio" name="kf-tab" id="kf-tab-2" />
        <div className="kf-tab-heads">
          <label htmlFor="kf-tab-1">توضیحات</label>
          <label htmlFor="kf-tab-2">نظرات ({fa(rating?.count ?? 0)})</label>
        </div>
        <div className="kf-tab kf-tab-desc">
          {(rest.length ? rest : lead ? [lead] : []).map((x, k) => (
            <p key={k}>{x}</p>
          ))}
          <SpecsTable p={p} className="kf-specs" />
        </div>
        <div className="kf-tab kf-tab-rev">
          <Reviews p={p} link={link} page={view.page} visitor={visitor} />
        </div>
      </section>
      {related.length > 0 && (
        <section className="kf-wrap kf-inner">
          <Heading title="محصولات مشابه" />
          <div className="kf-grid">
            {related.map((x, k) => (
              <ProductCard key={x.id} view={view} p={x} i={k} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Totals({ view, cart }: { view: ShopView; cart: ReturnType<typeof priceCart> }) {
  return (
    <dl className="kf-totals">
      <dt>جمع کالاها ({fa(cart.count)})</dt>
      <dd>{money(view, cart.subtotal)}</dd>
      {cart.discount > 0 && (
        <>
          <dt>کد تخفیف{cart.coupon ? ` «${cart.coupon}»` : ""}</dt>
          <dd className="kf-minus">− {money(view, cart.discount)}</dd>
        </>
      )}
      <dt>هزینه‌ی ارسال</dt>
      <dd>{cart.shipping ? money(view, cart.shipping) : "رایگان"}</dd>
      <dt className="total">مبلغ قابل پرداخت</dt>
      <dd className="total">{money(view, cart.total)}</dd>
    </dl>
  );
}

export function CartView(view: ShopView) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  return (
    <section className="kf-wrap kf-inner">
      <Heading title="سبد خرید" />
      {cart.lines.length === 0 ? (
        <Empty view={view} text="سبد خرید شما خالی است." />
      ) : (
        <div className="kf-cart">
          <div className="kf-lines">
            {cart.lines.map((l) => (
              <div key={l.id + (l.size ?? "")} className="kf-line">
                <PageLink to={productPath(l.product)} link={link} className="kf-line-pic">
                  {pic(l.product) && <img src={pic(l.product)} alt="" />}
                </PageLink>
                <div className="kf-line-info">
                  <PageLink to={productPath(l.product)} link={link}>
                    <b>{l.product.name}</b>
                  </PageLink>
                  {l.size && (
                    <small>
                      {l.product.optionLabel || "انتخاب"}: {l.size}
                    </small>
                  )}
                  <small>{money(view, l.unit)}</small>
                </div>
                <div className="kf-stepper">
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty - 1} label="یکی کمتر">
                    <KIcon name="minus" />
                  </Act>
                  <span>{fa(l.qty)}</span>
                  <Act view={view} op="set" id={l.id} size={l.size} qty={l.qty + 1} label="یکی بیشتر">
                    <KIcon name="plus" />
                  </Act>
                </div>
                <b className="kf-line-total">{money(view, l.total)}</b>
                <Act view={view} op="remove" id={l.id} size={l.size ?? ""} className="kf-remove" label="حذف از سبد">
                  <KIcon name="trash" />
                </Act>
              </div>
            ))}
          </div>
          <aside className="kf-sum">
            <h2>خلاصه‌ی سفارش</h2>
            <Totals view={view} cart={cart} />
            {shop.freeShippingFrom && cart.shipping > 0 ? <small>برای خریدهای بالای {money(view, shop.freeShippingFrom)} ارسال رایگان است.</small> : null}
            {(shop.coupons ?? []).length > 0 && <CouponBox link={link} page={view.page} visitor={visitor} applied={cart.coupon} error={cart.couponError} />}
            <PageLink to="/checkout" link={link} className="kf-btn">
              ادامه‌ی خرید
            </PageLink>
          </aside>
        </div>
      )}
    </section>
  );
}

export function CheckoutView(view: ShopView) {
  const { shop, visitor, link } = view;
  const cart = priceCart(shop, visitor.cart, visitor.coupon);
  const me = visitor.customer;
  const addr = visitor.account?.addresses[0];
  const error = visitor.query.error;
  if (cart.lines.length === 0)
    return (
      <section className="kf-wrap kf-inner">
        <Heading title="ثبت سفارش" />
        <Empty view={view} text="سبد خرید شما خالی است؛ اول چند محصول اضافه کنید." />
      </section>
    );
  return (
    <section className="kf-wrap kf-inner">
      <Heading title="ثبت سفارش" />
      <div className="kf-cart">
        <form method="post" action={link("/_order")} className="kf-checkout">
          <h2>اطلاعات ارسال</h2>
          {error && <p className="kf-error">{error}</p>}
          {!me && (
            <p className="full kf-muted">
              قبلاً خرید کرده‌اید؟{" "}
              <PageLink to="/account" link={link}>
                وارد شوید
              </PageLink>{" "}
              تا سفارش در حسابتان ثبت شود.
            </p>
          )}
          <label>
            نام و نام خانوادگی *
            <input name="name" required maxLength={80} autoComplete="name" defaultValue={me?.name} />
          </label>
          <label>
            شماره‌ی موبایل *
            <input name="phone" required inputMode="tel" dir="ltr" maxLength={14} autoComplete="tel" placeholder="09xx xxx xxxx" defaultValue={me?.phone} />
          </label>
          <label>
            شهر
            <input name="city" maxLength={60} autoComplete="address-level2" defaultValue={addr?.city} />
          </label>
          <label>
            کد پستی
            <input name="postalCode" maxLength={20} inputMode="numeric" dir="ltr" autoComplete="postal-code" defaultValue={addr?.postalCode} />
          </label>
          <label className="full">
            نشانی کامل *
            <textarea name="address" required maxLength={400} rows={3} autoComplete="street-address" defaultValue={addr?.address} />
          </label>
          <label className="full">
            توضیحات سفارش
            <textarea name="note" maxLength={400} rows={2} />
          </label>
          {/* Left empty by people; filled only by spam robots. */}
          <input name="website" tabIndex={-1} autoComplete="off" className="kf-trap" aria-hidden="true" />
          <button type="submit" className="kf-btn full">
            ثبت سفارش
          </button>
        </form>
        <aside className="kf-sum">
          <h2>سفارش شما</h2>
          <ul className="kf-sum-lines">
            {cart.lines.map((l) => (
              <li key={l.id + (l.size ?? "")}>
                <span>
                  {l.product.name}
                  {l.size && ` (${l.size})`} × {fa(l.qty)}
                </span>
                <b>{money(view, l.total)}</b>
              </li>
            ))}
          </ul>
          <Totals view={view} cart={cart} />
          {shop.paymentNote && (
            <p className="kf-pay" {...ed("site.shop.paymentNote", "multiline", "روش پرداخت")}>
              {shop.paymentNote}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

export function AccountView(view: ShopView) {
  return (
    <section className="kf-wrap kf-inner">
      <Heading title={view.visitor.customer ? "حساب کاربری" : "ورود یا ثبت‌نام"} />
      <AccountPage link={view.link} page={view.page} visitor={view.visitor} />
    </section>
  );
}

export function ThanksView(view: ShopView) {
  const code = view.visitor.query.code;
  const shop = view.shop;
  return (
    <section className="kf-wrap kf-inner">
      <div className="kf-thanks">
        <span className="kf-done" aria-hidden="true">
          <KIcon name="check" />
        </span>
        <h1>سفارش شما ثبت شد</h1>
        {code && (
          <p>
            کد پیگیری سفارش: <b dir="ltr">{code}</b>
          </p>
        )}
        {shop.orderNote && <p {...ed("site.shop.orderNote", "multiline", "پیام بعد از ثبت سفارش")}>{shop.orderNote}</p>}
        {shop.paymentNote && <p className="kf-pay">{shop.paymentNote}</p>}
        <PageLink to="/shop" link={view.link} className="kf-btn">
          بازگشت به فروشگاه
        </PageLink>
      </div>
    </section>
  );
}

/**
 * After "add to cart" the page comes back with ?added=<id>: a small panel says so, with the product,
 * a link to the cart and a close button; it also fades away by itself after a few seconds. No scripts.
 */
export function AddedToast({ view }: { view: ShopView }) {
  const id = view.visitor.query.added;
  const p = id ? live(view.shop).find((x) => x.id === id) : undefined;
  if (!p) return null;
  const img = pic(p);
  const count = priceCart(view.shop, view.visitor.cart).count;
  return (
    <>
      <input type="checkbox" id="kf-toast-x" className="kf-toast-x" />
      <div className="kf-toast" role="status">
        <span className="kf-toast-pic">{img ? <img src={img} alt="" /> : <KIcon name="check" />}</span>
        <div className="kf-toast-text">
          <b>
            <KIcon name="check" className="kf-ico kf-toast-ok" /> به سبد خرید اضافه شد
          </b>
          <small>
            {p.name} · {fa(count)} کالا در سبد
          </small>
          <PageLink to="/cart" link={view.link} className="kf-btn">
            مشاهده‌ی سبد خرید
          </PageLink>
        </div>
        <label htmlFor="kf-toast-x" className="kf-toast-close" aria-label="بستن">
          ×
        </label>
      </div>
    </>
  );
}

export const kafeShopCss = /* css */ `
/* "Added to cart" panel */
.kf-toast-x { position: absolute; opacity: 0; pointer-events: none; }
.kf-toast { position: fixed; bottom: 24px; inset-inline-start: 24px; z-index: 80; display: grid; grid-template-columns: 70px 1fr auto; gap: 14px; align-items: center; width: min(380px, calc(100vw - 32px)); box-sizing: border-box; padding: 16px; background: #fff; color: var(--kf-ink); border: 1px solid #EEE3D8; box-shadow: 0 24px 50px -20px rgb(0 0 0 / .35); animation: kf-toast-in .5s cubic-bezier(.2, .8, .2, 1.2) both, kf-toast-out .6s 6s ease both; }
@keyframes kf-toast-in { from { opacity: 0; transform: translateY(30px); } }
@keyframes kf-toast-out { to { opacity: 0; visibility: hidden; transform: translateY(20px); } }
.kf-toast-x:checked + .kf-toast { display: none; }
.kf-toast:hover { animation-play-state: running, paused; }
.kf-toast-pic { display: grid; place-items: center; width: 70px; height: 70px; background: var(--kf-paper); }
.kf-toast-pic img { width: 80%; height: 80%; object-fit: contain; }
.kf-toast-text { display: grid; justify-items: start; gap: 6px; }
.kf-toast-text b { display: flex; align-items: center; gap: 6px; font-size: 14px; }
.kf-toast-ok { width: 18px; height: 18px; color: #2F7D4F; stroke-width: 2.4; }
.kf-toast-text small { color: var(--kf-muted); font-size: 12px; }
.kf-toast .kf-btn { height: 34px; margin-top: 4px; padding: 0 16px; font-size: 11px; }
.kf-toast-close { align-self: start; padding: 0 4px; color: var(--kf-muted); font-size: 22px; line-height: 1; cursor: pointer; }
@container (max-width: 760px) { .kf-toast { inset-inline: 16px; bottom: 16px; width: auto; } }

.kf-inner { padding-block: 70px 100px; }
.kf-ico { width: 22px; height: 22px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.kf-act { display: contents; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.kf-trap { position: absolute; inset-inline-start: 0; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }
.kf-muted { color: var(--kf-muted); }
.kf-notice { padding: 40px; background: var(--kf-paper); color: var(--kf-muted); text-align: center; }
.kf-shead { display: grid; justify-items: center; gap: 10px; margin-bottom: 44px; text-align: center; }
.kf-shead h1 { font-family: var(--kf-head); font-size: clamp(32px, 3.6cqi, 46px); font-weight: 500; }
.kf-shead p { max-width: 520px; color: var(--kf-muted); line-height: 2; }

/* Header bag */
.kf-bag { position: relative; display: grid; place-items: center; width: 40px; height: 40px; color: inherit; }
.kf-bag i { position: absolute; top: 2px; inset-inline-end: -2px; min-width: 17px; height: 17px; padding: 0 4px; box-sizing: border-box; border-radius: 9px; background: var(--kf-tan); color: #fff; font-size: 10px; font-style: normal; font-weight: 700; line-height: 17px; text-align: center; }

/* Category links, count and sort */
.kf-scats { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 30px; }
.kf-scats a { padding: 8px 20px; border: 1px solid #E4D6C8; font-size: 13px; transition: background .2s, color .2s, border-color .2s; }
.kf-scats a:hover, .kf-scats a[aria-current="page"] { border-color: var(--kf-tan); background: var(--kf-tan); color: #fff; }
.kf-tools { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 30px; color: var(--kf-muted); font-size: 14px; }
.kf-tools a { color: var(--kf-tan); }
.kf-sort { position: relative; }
.kf-sort summary { display: flex; align-items: center; gap: 6px; list-style: none; cursor: pointer; color: var(--kf-ink); }
.kf-sort summary::-webkit-details-marker { display: none; }
.kf-sort summary .kf-ico { width: 16px; height: 16px; }
.kf-sort > div { position: absolute; inset-inline-end: 0; top: calc(100% + 8px); z-index: 5; display: grid; min-width: 200px; padding: 8px; background: #fff; border: 1px solid #EEE3D8; box-shadow: 0 20px 40px -24px rgb(0 0 0 / .4); }
.kf-sort button { width: 100%; padding: 8px 10px; border: 0; background: none; color: var(--kf-ink); font: inherit; font-size: 13px; text-align: start; cursor: pointer; }
.kf-sort button:hover, .kf-sort button[aria-current] { color: var(--kf-tan); }

/* Product cards: the pack on the paper colour, as on the home page */
.kf-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px 26px; }
.kf-card { display: grid; justify-items: center; align-content: start; gap: 10px; text-align: center; }
.kf-card-pic { position: relative; display: grid; place-items: center; width: 100%; aspect-ratio: 1; background: var(--kf-paper); overflow: hidden; }
.kf-card-pic img { width: 78%; height: 78%; object-fit: contain; transition: transform .8s cubic-bezier(.2, .8, .2, 1); }
.kf-card:hover .kf-card-pic img { transform: translateY(-6px) scale(1.04); }
.kf-card-pic b { font-family: var(--kf-head); font-size: 48px; color: var(--kf-tan); }
.kf-tag { position: absolute; top: 12px; inset-inline-start: 12px; padding: 3px 10px; background: var(--kf-tan); color: #fff; font-size: 12px; font-weight: 700; }
.kf-tag.dark { background: var(--kf-ink); }
.kf-card-name { margin-top: 8px; font-family: var(--kf-head); font-size: 22px; }
.kf-card-add { height: 40px; padding: 0 20px; border: 1px solid var(--kf-ink); background: none; color: var(--kf-ink); font: inherit; font-size: 12px; font-weight: 700; line-height: 38px; cursor: pointer; transition: background .25s, color .25s, border-color .25s; }
.kf-card-add:hover { border-color: var(--kf-tan); background: var(--kf-tan); color: #fff; }
.kf-sprice { display: inline-flex; gap: 8px; align-items: baseline; }
.kf-sprice b { color: var(--kf-tan); font-weight: 700; }
.kf-sprice s { color: var(--kf-muted); font-size: 13px; }

/* Product page */
.kf-product { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 60px; align-items: start; }
.kf-gallery-p { display: grid; gap: 14px; width: 100%; max-width: 480px; justify-self: center; }
.kf-gal-p { display: grid; place-items: center; aspect-ratio: 1; background: var(--kf-paper); cursor: zoom-in; }
.kf-gal-p img { display: block; width: 72%; height: 72%; object-fit: contain; }
.kf-pinfo { display: grid; justify-items: start; gap: 16px; position: sticky; top: 30px; }
.kf-pcat { color: var(--kf-tan); font-size: 13px; font-weight: 700; }
.kf-pinfo h1 { font-family: var(--kf-head); font-size: clamp(32px, 3.4cqi, 44px); font-weight: 500; line-height: 1.25; }
.kf-pinfo .kf-sprice b { font-size: 22px; }
.kf-plead { color: var(--kf-muted); line-height: 2; }
.kf-out { color: #B4442F; font-weight: 700; }
.kf-buy { display: grid; gap: 16px; width: 100%; }
.kf-buy-row { display: flex; gap: 12px; }
.kf-qty input { width: 80px; height: 48px; border: 1px solid #E4D6C8; text-align: center; font: inherit; }
.kf-ptabs { padding-bottom: 40px; }
.kf-ptabs > input { position: absolute; opacity: 0; pointer-events: none; }
.kf-tab-heads { display: flex; justify-content: center; gap: 30px; border-bottom: 1px solid #EEE3D8; }
.kf-tab-heads label { padding: 14px 4px; border-bottom: 2px solid transparent; font-weight: 700; cursor: pointer; }
#kf-tab-1:checked ~ .kf-tab-heads label[for="kf-tab-1"], #kf-tab-2:checked ~ .kf-tab-heads label[for="kf-tab-2"] { border-color: var(--kf-tan); color: var(--kf-tan); }
.kf-tab { display: none; max-width: 820px; margin-inline: auto; padding-top: 30px; line-height: 2; }
.kf-tab p + p { margin-top: 12px; }
#kf-tab-1:checked ~ .kf-tab-desc, #kf-tab-2:checked ~ .kf-tab-rev { display: block; }

/* Cart and checkout */
.kf-cart { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 30px; align-items: start; }
.kf-lines, .kf-sum, .kf-checkout { padding: 26px; background: var(--kf-paper); }
.kf-line { display: grid; grid-template-columns: 76px minmax(0, 1fr) auto auto auto; gap: 16px; align-items: center; padding-block: 16px; border-bottom: 1px solid #E4D6C8; }
.kf-line:last-child { border-bottom: 0; }
.kf-line-pic { display: grid; place-items: center; width: 76px; height: 76px; background: #fff; }
.kf-line-pic img { width: 80%; height: 80%; object-fit: contain; }
.kf-line-info { display: grid; gap: 4px; }
.kf-line-info small { color: var(--kf-muted); }
.kf-stepper { display: flex; align-items: center; gap: 4px; border: 1px solid #E4D6C8; background: #fff; }
.kf-stepper button { display: grid; place-items: center; width: 32px; height: 34px; border: 0; background: none; color: var(--kf-ink); cursor: pointer; }
.kf-stepper .kf-ico { width: 14px; height: 14px; }
.kf-stepper span { min-width: 22px; text-align: center; }
.kf-remove { display: grid; place-items: center; width: 34px; height: 34px; border: 0; background: none; color: var(--kf-muted); cursor: pointer; }
.kf-remove:hover { color: #B4442F; }
.kf-remove .kf-ico { width: 18px; height: 18px; }
.kf-sum { display: grid; gap: 16px; position: sticky; top: 30px; }
.kf-sum h2, .kf-checkout h2 { font-family: var(--kf-head); font-size: 26px; font-weight: 500; }
.kf-sum small { color: var(--kf-muted); }
.kf-totals { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin: 0; font-size: 14px; }
.kf-totals dd { margin: 0; }
.kf-totals .total { padding-top: 12px; border-top: 1px solid #E4D6C8; font-weight: 800; font-size: 16px; }
.kf-minus { color: #2F7D4F; }
.kf-sum-lines { display: grid; gap: 10px; padding: 0; list-style: none; font-size: 14px; }
.kf-sum-lines li { display: flex; justify-content: space-between; gap: 10px; }
.kf-pay { padding: 14px; background: #fff; color: var(--kf-muted); font-size: 13px; line-height: 1.9; }
.kf-checkout { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.kf-checkout h2, .kf-checkout .full, .kf-checkout .kf-error { grid-column: 1 / -1; }
.kf-checkout label { display: grid; gap: 8px; font-size: 14px; }
.kf-checkout input, .kf-checkout textarea { width: 100%; padding: 12px 14px; border: 1px solid #E4D6C8; background: #fff; font: inherit; }
.kf-checkout input:focus, .kf-checkout textarea:focus { outline: none; border-color: var(--kf-tan); }
.kf-error { padding: 12px 14px; background: #FBE9E5; color: #B4442F; }
.kf-sempty { display: grid; justify-items: center; gap: 18px; padding: 60px 20px; background: var(--kf-paper); text-align: center; }
.kf-sempty-ico { width: 54px; height: 54px; color: var(--kf-tan); stroke-width: 1.2; }
.kf-thanks { display: grid; justify-items: center; gap: 16px; max-width: 620px; margin-inline: auto; padding: 50px 30px; background: var(--kf-paper); text-align: center; }
.kf-thanks h1 { font-family: var(--kf-head); font-size: 36px; font-weight: 500; }
.kf-done { display: grid; place-items: center; width: 70px; height: 70px; border-radius: 50%; background: var(--kf-tan); color: #fff; }
.kf-done .kf-ico { width: 34px; height: 34px; stroke-width: 2.2; }
.kf-btn.full { grid-column: 1 / -1; }

@container (max-width: 1000px) {
  .kf-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .kf-cart { grid-template-columns: 1fr; }
  .kf-sum { position: static; }
}
@container (max-width: 760px) {
  .kf-inner { padding-block: 44px 70px; }
  .kf-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 30px 14px; }
  .kf-card-name { font-size: 18px; }
  .kf-product { grid-template-columns: 1fr; gap: 30px; }
  .kf-pinfo { position: static; }
  .kf-line { grid-template-columns: 64px minmax(0, 1fr) auto; }
  .kf-line-pic { width: 64px; height: 64px; }
  .kf-line-total { grid-column: 2; }
  .kf-checkout { grid-template-columns: 1fr; padding: 20px; }
  .kf-lines, .kf-sum { padding: 18px; }
}
`;
