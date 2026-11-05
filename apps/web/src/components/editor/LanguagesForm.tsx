import type { Language } from "@rb/schema";
import { Empty, Field, ItemControls, SectionCard, Select } from "./fields";
import { Hideable } from "./Hideable";
import { LIMITS, move, newId, removeAt, replaceAt } from "./list";

const LEVELS: readonly { value: Language["level"]; label: string }[] = [
  { value: "native", label: "زبان مادری" },
  { value: "fluent", label: "مسلط" },
  { value: "advanced", label: "پیشرفته" },
  { value: "intermediate", label: "متوسط" },
  { value: "basic", label: "مبتدی" },
];

export function LanguagesForm({ value, onChange }: { value: Language[]; onChange: (value: Language[]) => void }) {
  const add = () => onChange([...value, { id: newId(), name: "", level: "intermediate" }]);

  return (
    <SectionCard title="زبان‌ها" count={value.length} onAdd={add} addDisabled={value.length >= LIMITS.languages}>
      {value.length === 0 && <Empty>هنوز زبانی اضافه نشده.</Empty>}
      {value.map((l, i) => {
        const set = (patch: Partial<Language>) => onChange(replaceAt(value, i, patch));
        return (
          <div key={l.id} className="skill-row">
            <Field label="زبان *" value={l.name} onChange={(name) => set({ name })} max={50} />
            <Hideable k="languages.level">
              <Select label="سطح" value={l.level} options={LEVELS} onChange={(level) => set({ level })} />
            </Hideable>
            <ItemControls
              index={i}
              count={value.length}
              onMove={(d) => onChange(move(value, i, d))}
              onRemove={() => onChange(removeAt(value, i))}
              removeLabel="×"
            />
          </div>
        );
      })}
    </SectionCard>
  );
}
