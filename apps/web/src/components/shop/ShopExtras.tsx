// Shop manager tab for the small lists of the shop's pages: the feature row ("easy payment", "fast
// delivery"…), popular brands, and the payment / trust logos at the bottom. Site content: saves with
// the editor. Each template shows the ones it has a place for.

import type { ResumeData, Shop } from "@rb/schema";
import { newId } from "../editor/list";
import { ImagePicker } from "./fields";

type Site = NonNullable<ResumeData["site"]>;
type Perk = NonNullable<Shop["perks"]>[number];
type Brand = NonNullable<Site["clients"]>[number];
type Logo = NonNullable<Shop["trustLogos"]>[number];
type Stat = NonNullable<Shop["stats"]>[number];
type Props = { data: ResumeData; onData: (d: ResumeData) => void; shop: Shop; setShop: (s: Partial<Shop>) => void; menu?: boolean };

function moved<T>(list: T[], k: number, by: -1 | 1): T[] {
  const next = [...list];
  const j = k + by;
  if (j < 0 || j >= next.length) return next;
  [next[k], next[j]] = [next[j]!, next[k]!];
  return next;
}

function Order({ k, count, onMove }: { k: number; count: number; onMove: (by: -1 | 1) => void }) {
  return (
    <>
      <button type="button" className="btn ghost small" disabled={k === 0} aria-label="بالاتر" onClick={() => onMove(-1)}>
        ↑
      </button>
      <button type="button" className="btn ghost small" disabled={k === count - 1} aria-label="پایین‌تر" onClick={() => onMove(1)}>
        ↓
      </button>
    </>
  );
}

export function Extras({ data, onData, shop, setShop, menu }: Props) {
  const stats = shop.stats ?? [];
  const saveStats = (next: Stat[]) => setShop({ stats: next.length ? next : undefined });
  const perks = shop.perks ?? [];
  const savePerks = (next: Perk[]) => setShop({ perks: next.length ? next : undefined });
  const brands = data.site?.clients ?? [];
  const saveBrands = (next: Brand[]) => onData({ ...data, site: { gallery: [], ...data.site, clients: next.length ? next : undefined } });
  const logos = shop.trustLogos ?? [];
  const saveLogos = (next: Logo[]) => setShop({ trustLogos: next.length ? next : undefined });

  return (
    <div className="shm-cats">
      <h3>✨ ویژگی‌های فروشگاه</h3>
      <p className="muted">جمله‌های کوتاه مثل «ارسال رایگان» یا «تضمین کیفیت» (حداکثر ۴ تا). بعضی قالب‌ها کنار هرکدام آیکون هم نشان می‌دهند.</p>
      {perks.map((x, k) => (
        <div key={x.id} className="shm-faq">
          <input value={x.title} maxLength={60} placeholder="عنوان" aria-label="عنوان ویژگی" onChange={(e) => savePerks(perks.map((p) => (p.id === x.id ? { ...p, title: e.target.value } : p)))} />
          <input value={x.text ?? ""} maxLength={200} placeholder="توضیح کوتاه (اختیاری)" aria-label="توضیح ویژگی" onChange={(e) => savePerks(perks.map((p) => (p.id === x.id ? { ...p, text: e.target.value || undefined } : p)))} />
          <div className="row gap wrap">
            <ImagePicker value={x.image} label="آیکون (اختیاری)" onChange={(url) => savePerks(perks.map((p) => (p.id === x.id ? { ...p, image: url } : p)))} />
            <Order k={k} count={perks.length} onMove={(by) => savePerks(moved(perks, k, by))} />
            <button type="button" className="btn ghost small danger" onClick={() => savePerks(perks.filter((p) => p.id !== x.id))}>
              حذف
            </button>
          </div>
        </div>
      ))}
      {perks.length < 4 && (
        <button type="button" className="btn small" onClick={() => savePerks([...perks, { id: newId(), title: "ویژگی جدید" }])}>
          + ویژگی جدید
        </button>
      )}

      {menu && (
        <>
          <h3>🔢 اعداد</h3>
          <p className="muted">ردیف اعداد صفحه‌ها، مثل «۲۵۰ نوع قهوه» (حداکثر ۶ تا).</p>
          {stats.map((x, k) => (
            <div key={x.id} className="shm-faq">
              <div className="row gap">
                <input value={x.value} maxLength={20} placeholder="عدد" aria-label="عدد" style={{ maxWidth: 110 }} onChange={(e) => saveStats(stats.map((t) => (t.id === x.id ? { ...t, value: e.target.value } : t)))} />
                <input value={x.label} maxLength={60} placeholder="عنوان" aria-label="عنوان" onChange={(e) => saveStats(stats.map((t) => (t.id === x.id ? { ...t, label: e.target.value } : t)))} />
              </div>
              <input value={x.text ?? ""} maxLength={160} placeholder="توضیح کوتاه (اختیاری)" aria-label="توضیح" onChange={(e) => saveStats(stats.map((t) => (t.id === x.id ? { ...t, text: e.target.value || undefined } : t)))} />
              <div className="row gap">
                <Order k={k} count={stats.length} onMove={(by) => saveStats(moved(stats, k, by))} />
                <button type="button" className="btn ghost small danger" onClick={() => saveStats(stats.filter((t) => t.id !== x.id))}>
                  حذف
                </button>
              </div>
            </div>
          ))}
          {stats.length < 6 && (
            <button type="button" className="btn small" onClick={() => saveStats([...stats, { id: newId(), value: "۱۰۰", label: "عنوان" }])}>
              + عدد جدید
            </button>
          )}
        </>
      )}

      <h3>🏷 {menu ? "آرم همکاران" : "برندهای محبوب"}</h3>
      <p className="muted">{menu ? "آرم کافه‌ها، برندهای قهوه یا همکارانی که با آن‌ها کار می‌کنید." : "آرم و نام برندهایی که می‌فروشید."}</p>
      {brands.map((x, k) => (
        <div key={x.id} className="shm-slide">
          <span className="shm-thumb">{x.image ? <img src={x.image} alt="" /> : "🏷"}</span>
          <div className="shm-slide-fields">
            <input value={x.name} maxLength={80} placeholder="نام برند" aria-label="نام برند" onChange={(e) => saveBrands(brands.map((b) => (b.id === x.id ? { ...b, name: e.target.value } : b)))} />
            <input value={x.text ?? ""} maxLength={200} placeholder="یک خط توضیح (اختیاری)" aria-label="توضیح برند" onChange={(e) => saveBrands(brands.map((b) => (b.id === x.id ? { ...b, text: e.target.value || undefined } : b)))} />
            <div className="row gap wrap">
              <ImagePicker value={x.image} label="انتخاب آرم" onChange={(url) => saveBrands(brands.map((b) => (b.id === x.id ? { ...b, image: url } : b)))} />
              <Order k={k} count={brands.length} onMove={(by) => saveBrands(moved(brands, k, by))} />
              <button type="button" className="btn ghost small danger" onClick={() => window.confirm(`برند «${x.name}» حذف شود؟`) && saveBrands(brands.filter((b) => b.id !== x.id))}>
                حذف
              </button>
            </div>
          </div>
        </div>
      ))}
      {brands.length < 30 && (
        <button type="button" className="btn small" onClick={() => saveBrands([...brands, { id: newId(), name: "برند جدید", image: "" }])}>
          + برند جدید
        </button>
      )}

      <h3>💳 آرم‌های پایین صفحه</h3>
      <p className="muted">آرم روش‌های پرداخت یا نماد اعتماد (مثل اینماد). اگر لینک بگذارید، با کلیک روی آرم باز می‌شود. نماد اعتماد باید به نام خود فروشگاه شما باشد.</p>
      {logos.map((x, k) => (
        <div key={x.id} className="shm-slide">
          <span className="shm-thumb">{x.image ? <img src={x.image} alt="" style={{ objectFit: "contain" }} /> : "💳"}</span>
          <div className="shm-slide-fields">
            <input value={x.title ?? ""} maxLength={60} placeholder="نام (برای نابینایان، اختیاری)" aria-label="نام آرم" onChange={(e) => saveLogos(logos.map((l) => (l.id === x.id ? { ...l, title: e.target.value || undefined } : l)))} />
            <input dir="ltr" value={x.link ?? ""} maxLength={500} placeholder="https://… (لینک، اختیاری)" aria-label="لینک آرم" onChange={(e) => saveLogos(logos.map((l) => (l.id === x.id ? { ...l, link: e.target.value || undefined } : l)))} />
            <div className="row gap wrap">
              <ImagePicker value={x.image} label="انتخاب آرم" onChange={(url) => saveLogos(logos.map((l) => (l.id === x.id ? { ...l, image: url } : l)))} />
              <Order k={k} count={logos.length} onMove={(by) => saveLogos(moved(logos, k, by))} />
              <button type="button" className="btn ghost small danger" onClick={() => saveLogos(logos.filter((l) => l.id !== x.id))}>
                حذف
              </button>
            </div>
          </div>
        </div>
      ))}
      {logos.length < 8 && (
        <button type="button" className="btn small" onClick={() => saveLogos([...logos, { id: newId(), image: "" }])}>
          + آرم جدید
        </button>
      )}
    </div>
  );
}
