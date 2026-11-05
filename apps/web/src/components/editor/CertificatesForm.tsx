import type { Certificate } from "@rb/schema";
import { Empty, Field, ItemControls, SectionCard } from "./fields";
import { Hideable } from "./Hideable";
import { LIMITS, move, newId, removeAt, replaceAt } from "./list";

export function CertificatesForm({ value, onChange }: { value: Certificate[]; onChange: (value: Certificate[]) => void }) {
  const add = () => onChange([...value, { id: newId(), title: "" }]);

  return (
    <SectionCard title="گواهینامه‌ها" count={value.length} onAdd={add} addDisabled={value.length >= LIMITS.certificates}>
      {value.length === 0 && <Empty>هنوز گواهینامه‌ای اضافه نشده.</Empty>}
      {value.map((c, i) => {
        const set = (patch: Partial<Certificate>) => onChange(replaceAt(value, i, patch));
        return (
          <div key={c.id} className="sub-card stack">
            <div className="grid2">
              <Field label="عنوان *" value={c.title} onChange={(title) => set({ title })} max={150} />
              <Hideable k="certificates.issuer">
                <Field label="صادرکننده" value={c.issuer ?? ""} onChange={(issuer) => set({ issuer })} max={100} />
              </Hideable>
              <Hideable k="certificates.date">
                <Field label="تاریخ" type="month" ltr value={c.date ?? ""} onChange={(date) => set({ date: date || undefined })} />
              </Hideable>
              <Hideable k="certificates.url">
                <Field
                  label="لینک تأیید"
                  type="url"
                  ltr
                  placeholder="https://..."
                  value={c.url ?? ""}
                  onChange={(url) => set({ url })}
                  max={500}
                />
              </Hideable>
            </div>
            <ItemControls
              index={i}
              count={value.length}
              onMove={(d) => onChange(move(value, i, d))}
              onRemove={() => onChange(removeAt(value, i))}
              removeLabel="حذف"
            />
          </div>
        );
      })}
    </SectionCard>
  );
}
