// Gold shop panel pieces: the day's gold rate (with the seller's profit and the tax), and the gold
// fields of a product (weight, karat, wage, stones, sale wage). Prices of gold products are worked
// out from these in the panel and saved on the products, so the site, the cart and the orders all
// read the same price; after a new rate, publishing the site puts the new prices on it.

import { useEffect, useState } from "react";
import { formatToman, goldQuote, withGoldPrice, type GoldRate, type Product, type Shop } from "@rb/schema";
import { Field, MoneyInput, showNumber } from "./fields";

/** Reads a number with Persian or Latin digits and a decimal point (۲٫۳۵ or 2.35); empty stays empty. */
export function readDecimal(text: string): number | undefined {
  const t = text
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[٫/،,]/g, ".")
    .replace(/[^\d.]/g, "");
  if (!t) return undefined;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : undefined;
}
const showDecimal = (n: number | undefined) => (n === undefined ? "" : new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 3 }).format(n));

function DecimalInput({ value, onChange, placeholder, unit, max }: { value: number | undefined; onChange: (n: number | undefined) => void; placeholder?: string; unit: string; max: number }) {
  const [text, setText] = useState(showDecimal(value));
  useEffect(() => setText(showDecimal(value)), [value]);
  return (
    <span className="shm-money">
      <input
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = readDecimal(text);
          onChange(n === undefined ? undefined : Math.min(max, Math.max(0, Math.round(n * 1000) / 1000)));
        }}
      />
      <i>{unit}</i>
    </span>
  );
}

export const DEFAULT_RATE: GoldRate = { rate: 0, profit: 7, tax: 10 };
const KARATS = [18, 21, 24];
const today = () => new Date().toLocaleDateString("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** The "day's gold rate" tab: the rate, profit and tax, and what every gold product costs with them. */
export function GoldRateTab({ shop, setShop }: { shop: Shop; setShop: (s: Partial<Shop>) => void }) {
  const rate = { ...DEFAULT_RATE, ...shop.goldRate };
  const gold = shop.products.filter((p) => p.gold && !p.trashed);
  /** A new rate: saved with the time, and every gold product's price worked out again. */
  const save = (patch: Partial<GoldRate>) => {
    const next: GoldRate = { ...rate, ...patch, updatedAt: new Date().toISOString() };
    setShop({ goldRate: next, products: shop.products.map((p) => withGoldPrice(p, next)) });
  };
  const sample = gold[0]?.gold;
  return (
    <div className="shm-gold">
      <p className="muted">
        نرخ هر گرم طلای ۱۸ عیار را وارد کنید؛ قیمت همه‌ی محصولات طلا (از روی وزن، عیار و اجرتشان) همین‌جا دوباره حساب می‌شود و نرخ روز بالای سایت هم نشان داده می‌شود. بعد از
        تغییر نرخ، سایت را «انتشار» کنید تا قیمت‌های تازه روی سایت بیاید.
      </p>
      <div className="shm-grid">
        <Field label="نرخ هر گرم طلای ۱۸ عیار" hint={shop.goldRate?.updatedAt ? `آخرین تغییر: ${new Date(shop.goldRate.updatedAt).toLocaleDateString("fa-IR-u-ca-persian", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}` : `امروز: ${today()}`}>
          <MoneyInput value={rate.rate || undefined} placeholder="مثلاً ۶٬۵۰۰٬۰۰۰" onChange={(n) => save({ rate: n ?? 0 })} />
        </Field>
        <Field label="سود فروشنده" hint="درصدی از طلا و اجرت؛ معمولاً ۷٪.">
          <DecimalInput value={rate.profit} unit="٪" max={50} onChange={(n) => save({ profit: n ?? 0 })} />
        </Field>
        <Field label="مالیات بر ارزش افزوده" hint="درصدی از اجرت و سود؛ الان ۱۰٪.">
          <DecimalInput value={rate.tax} unit="٪" max={30} onChange={(n) => save({ tax: n ?? 0 })} />
        </Field>
      </div>
      {!rate.rate && <p className="shm-warn">تا نرخ را وارد نکنید، قیمت محصولات طلا همان قیمتی است که دستی نوشته‌اید.</p>}
      {rate.rate > 0 && sample && (
        <p className="muted">
          نمونه: «{gold[0]!.name}» ({showDecimal(sample.weight)} گرم، {showNumber(sample.karat)} عیار، اجرت {showDecimal(sample.wage)}٪) ={" "}
          <b>{formatToman(goldQuote(sample, rate).total)}</b>
        </p>
      )}
      {gold.length > 0 ? (
        <table className="shm-table">
          <thead>
            <tr>
              <th>محصول</th>
              <th>وزن</th>
              <th>عیار</th>
              <th>اجرت</th>
              <th>قیمت روی سایت</th>
            </tr>
          </thead>
          <tbody>
            {gold.map((p) => {
              const g = p.gold!;
              const now = withGoldPrice(p, rate);
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{showDecimal(g.weight)} گرم</td>
                  <td>{showNumber(g.karat)}</td>
                  <td>
                    {showDecimal(g.wage)}٪{g.saleWage !== undefined && g.saleWage < g.wage ? ` (حراج ${showDecimal(g.saleWage)}٪)` : ""}
                  </td>
                  <td>
                    {formatToman(now.salePrice ?? now.price)}
                    {now.salePrice !== undefined && <s className="muted"> {formatToman(now.price)}</s>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="muted">هنوز محصولی وزن و عیار ندارد؛ در تب محصولات، بخش «طلا» را برای هر محصول پر کنید.</p>
      )}
    </div>
  );
}

/**
 * The gold part of the product form. With a weight the product is priced from the rate (its price
 * field is then read only); without one it keeps the price typed by hand (silver, watches…).
 */
export function GoldFields({ p, rate, onChange }: { p: Product; rate: GoldRate | undefined; onChange: (patch: Partial<Product>) => void }) {
  const g = p.gold;
  const set = (patch: Partial<NonNullable<Product["gold"]>>) => {
    const next = { karat: 18, wage: 0, ...g, ...patch } as NonNullable<Product["gold"]>;
    if (!next.weight) return onChange({ gold: undefined });
    onChange(withGoldPrice({ ...p, gold: next }, rate));
  };
  const q = g && rate?.rate ? goldQuote(g, rate) : undefined;
  return (
    <fieldset className="shm-gold-fields">
      <legend>💍 طلا</legend>
      <p className="muted">با وارد کردن وزن، قیمت از «نرخ روز طلا» حساب می‌شود و با هر نرخ تازه خودش به‌روز می‌شود. برای قیمت دستی (مثلاً نقره یا ساعت) وزن را خالی بگذارید.</p>
      <div className="shm-grid">
        <Field label="وزن">
          <DecimalInput value={g?.weight} unit="گرم" max={10000} placeholder="مثلاً ۲٫۳۵" onChange={(weight) => set({ weight })} />
        </Field>
        <Field label="عیار">
          <select value={g?.karat ?? 18} disabled={!g} onChange={(e) => set({ karat: Number(e.target.value) })}>
            {KARATS.map((k) => (
              <option key={k} value={k}>
                {showNumber(k)} عیار
              </option>
            ))}
          </select>
        </Field>
        <Field label="اجرت ساخت" hint="درصدی از قیمت طلا.">
          <DecimalInput value={g?.wage} unit="٪" max={100} onChange={(wage) => g && set({ wage: wage ?? 0 })} />
        </Field>
        <Field label="سنگ و متعلقات" hint="مبلغ ثابت، جدا از طلا.">
          <MoneyInput value={g?.stone} placeholder="ندارد" onChange={(stone) => g && set({ stone })} />
        </Field>
        <Field label="اجرت در حراج (تخفیف ویژه)" hint="کمتر از اجرت اصلی؛ قیمت قبلی خط‌خورده نمایش داده می‌شود. خالی: بدون حراج.">
          <DecimalInput value={g?.saleWage} unit="٪" max={100} placeholder="بدون حراج" onChange={(saleWage) => g && set({ saleWage })} />
        </Field>
      </div>
      {g && !rate?.rate && <p className="shm-warn">نرخ روز طلا هنوز وارد نشده؛ از تب «نرخ روز طلا» واردش کنید.</p>}
      {q && (
        <p className="shm-gold-bill">
          طلا {formatToman(q.gold)} + اجرت {formatToman(q.wage)} + سود {formatToman(q.profit)} + مالیات {formatToman(q.tax)}
          {q.stone ? ` + سنگ ${formatToman(q.stone)}` : ""} = <b>{formatToman(q.total)}</b>
        </p>
      )}
    </fieldset>
  );
}
