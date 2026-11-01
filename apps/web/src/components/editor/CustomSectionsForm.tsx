import type { CustomSection } from "@rb/schema";
import { Empty, Field, ItemControls, SectionCard, TextArea } from "./fields";
import { LIMITS, move, newId, removeAt, replaceAt } from "./list";

type Item = CustomSection["items"][number];

/** User-defined sections such as awards, volunteering or publications. */
export function CustomSectionsForm({
  value,
  onChange,
}: {
  value: CustomSection[];
  onChange: (value: CustomSection[]) => void;
}) {
  const add = () => onChange([...value, { id: newId(), title: "", items: [] }]);

  return (
    <SectionCard
      title="بخش‌های آزاد"
      count={value.length}
      onAdd={add}
      addDisabled={value.length >= LIMITS.customSections}
      addLabel="+ بخش جدید"
      defaultOpen={value.length > 0}
    >
      {value.length === 0 && <Empty>برای مواردی مثل افتخارات، فعالیت داوطلبانه یا مقالات، یک بخش با عنوان دلخواه بسازید.</Empty>}
      {value.map((section, si) => {
        const setSection = (patch: Partial<CustomSection>) => onChange(replaceAt(value, si, patch));
        const setItems = (items: Item[]) => setSection({ items });
        return (
          <div key={section.id} className="sub-card stack">
            <Field
              label="عنوان بخش *"
              placeholder="مثلاً افتخارات"
              value={section.title}
              onChange={(title) => setSection({ title })}
              max={60}
            />

            {section.items.map((item, ii) => {
              const setItem = (patch: Partial<Item>) => setItems(replaceAt(section.items, ii, patch));
              return (
                <div key={item.id} className="sub-card nested stack">
                  <div className="grid2">
                    <Field label="عنوان *" value={item.title} onChange={(title) => setItem({ title })} max={150} />
                    <Field label="زیرعنوان" value={item.subtitle ?? ""} onChange={(subtitle) => setItem({ subtitle })} max={150} />
                    <Field
                      label="تاریخ"
                      type="month"
                      ltr
                      value={item.date ?? ""}
                      onChange={(date) => setItem({ date: date || undefined })}
                    />
                    <Field
                      label="لینک"
                      type="url"
                      ltr
                      placeholder="https://..."
                      value={item.url ?? ""}
                      onChange={(url) => setItem({ url })}
                      max={500}
                    />
                  </div>
                  <TextArea
                    label="توضیحات"
                    max={1000}
                    value={item.description ?? ""}
                    onChange={(description) => setItem({ description })}
                  />
                  <ItemControls
                    index={ii}
                    count={section.items.length}
                    onMove={(d) => setItems(move(section.items, ii, d))}
                    onRemove={() => setItems(removeAt(section.items, ii))}
                    removeLabel="حذف آیتم"
                  />
                </div>
              );
            })}

            <div className="row gap wrap">
              <button
                type="button"
                className="btn ghost"
                disabled={section.items.length >= LIMITS.customItems}
                onClick={() => setItems([...section.items, { id: newId(), title: "" }])}
              >
                + آیتم جدید
              </button>
              <span className="grow" />
              <ItemControls
                index={si}
                count={value.length}
                onMove={(d) => onChange(move(value, si, d))}
                onRemove={() => onChange(removeAt(value, si))}
                removeLabel="حذف این بخش"
              />
            </div>
          </div>
        );
      })}
    </SectionCard>
  );
}
