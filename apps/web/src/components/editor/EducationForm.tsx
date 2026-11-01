import type { Education } from "@rb/schema";
import { Empty, Field, ItemControls, PeriodFields, SectionCard, TextArea } from "./fields";
import { LIMITS, move, newId, removeAt, replaceAt } from "./list";

export function EducationForm({ value, onChange }: { value: Education[]; onChange: (value: Education[]) => void }) {
  const add = () => onChange([...value, { id: newId(), institution: "", period: { start: "", current: false } }]);

  return (
    <SectionCard title="تحصیلات" count={value.length} onAdd={add} addDisabled={value.length >= LIMITS.education}>
      {value.length === 0 && <Empty>هنوز سابقه‌ی تحصیلی اضافه نشده.</Empty>}
      {value.map((x, i) => {
        const set = (patch: Partial<Education>) => onChange(replaceAt(value, i, patch));
        return (
          <div key={x.id} className="sub-card stack">
            <div className="grid2">
              <Field label="دانشگاه یا مؤسسه *" value={x.institution} onChange={(institution) => set({ institution })} max={150} />
              <Field label="مقطع" placeholder="کارشناسی" value={x.degree ?? ""} onChange={(degree) => set({ degree })} max={100} />
              <Field label="رشته" value={x.field ?? ""} onChange={(field) => set({ field })} max={100} />
              <Field label="معدل" value={x.grade ?? ""} onChange={(grade) => set({ grade })} max={20} />
            </div>
            <PeriodFields value={x.period} onChange={(period) => set({ period })} currentLabel="در حال تحصیل" required />
            <TextArea label="توضیحات" max={1000} value={x.description ?? ""} onChange={(description) => set({ description })} />
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
