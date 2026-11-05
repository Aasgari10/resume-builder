// Text and pictures that only multi-page website templates show: the line under the name,
// the hero buttons, the "about me" page and the gallery. Empty fields show sample text in the preview.

import type { GalleryItem, SiteContent } from "@rb/schema";
import { Empty, Field, ItemControls, SectionCard, TextArea } from "./fields";
import { move, newId, removeAt, replaceAt } from "./list";
import { PH } from "./samples";

const GALLERY_LIMIT = 40;

export function SiteContentForm({ value, onChange }: { value: SiteContent | undefined; onChange: (value: SiteContent) => void }) {
  const site: SiteContent = value ?? { gallery: [] };
  const set = (patch: Partial<SiteContent>) => onChange({ ...site, ...patch });
  const gallery = site.gallery;
  const setGallery = (next: GalleryItem[]) => set({ gallery: next });

  return (
    <>
      <SectionCard title="متن‌های سایت">
        <Field label="جمله‌ی زیر نام" placeholder={PH.site.tagline} value={site.tagline ?? ""} onChange={(tagline) => set({ tagline })} max={200} />
        <div className="grid2">
          <Field label="دکمه‌ی اول" placeholder={PH.site.ctaPrimary} value={site.ctaPrimary ?? ""} onChange={(ctaPrimary) => set({ ctaPrimary })} max={30} />
          <Field label="دکمه‌ی دوم (تماس)" placeholder={PH.site.ctaSecondary} value={site.ctaSecondary ?? ""} onChange={(ctaSecondary) => set({ ctaSecondary })} max={30} />
        </div>
      </SectionCard>

      <SectionCard title="صفحه‌ی درباره‌ی من">
        <Field label="عنوان" placeholder={PH.site.aboutTitle} value={site.aboutTitle ?? ""} onChange={(aboutTitle) => set({ aboutTitle })} max={120} />
        <TextArea
          label="متن"
          rows={6}
          max={4000}
          placeholder={PH.site.aboutText}
          hint="برای بند جدید یک خط خالی بگذارید. اگر خالی بماند، «درباره‌ی من» اطلاعات پایه نمایش داده می‌شود."
          value={site.aboutText ?? ""}
          onChange={(aboutText) => set({ aboutText })}
        />
        <div className="grid2">
          <Field label="لینک عکس" type="url" ltr placeholder="https://..." value={site.aboutImage ?? ""} onChange={(aboutImage) => set({ aboutImage })} max={500} />
          <Field label="توضیح زیر عکس" placeholder={PH.site.aboutCaption} value={site.aboutCaption ?? ""} onChange={(aboutCaption) => set({ aboutCaption })} max={80} />
        </div>
      </SectionCard>

      <SectionCard
        title="گالری"
        count={gallery.length}
        onAdd={() => setGallery([...gallery, { id: newId(), title: "", image: "" }])}
        addDisabled={gallery.length >= GALLERY_LIMIT}
      >
        {gallery.length === 0 && <Empty>هنوز تصویری اضافه نشده؛ پیش‌نمایش تصویرهای نمونه را نشان می‌دهد.</Empty>}
        {gallery.map((g, i) => (
          <div key={g.id} className="sub-card stack">
            <div className="grid2">
              <Field label="لینک تصویر *" type="url" ltr placeholder="https://..." value={g.image} onChange={(image) => setGallery(replaceAt(gallery, i, { image }))} max={500} />
              <Field label="عنوان" placeholder={PH.site.galleryTitle} value={g.title} onChange={(title) => setGallery(replaceAt(gallery, i, { title }))} max={100} />
            </div>
            <ItemControls
              index={i}
              count={gallery.length}
              onMove={(d) => setGallery(move(gallery, i, d))}
              onRemove={() => setGallery(removeAt(gallery, i))}
              removeLabel="حذف"
            />
          </div>
        ))}
      </SectionCard>
    </>
  );
}
