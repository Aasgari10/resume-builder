import type { Skill } from "@rb/schema";
import { Empty, Field, ItemControls, SectionCard, Select } from "./fields";
import { PH } from "./samples";
import { Hideable } from "./Hideable";
import { LIMITS, move, newId, removeAt, replaceAt } from "./list";

const LEVELS = [
  { value: "", label: "—" },
  { value: "1", label: "۱ (مبتدی)" },
  { value: "2", label: "۲" },
  { value: "3", label: "۳ (متوسط)" },
  { value: "4", label: "۴" },
  { value: "5", label: "۵ (حرفه‌ای)" },
] as const;

type LevelOption = (typeof LEVELS)[number]["value"];

export function SkillsForm({ value, onChange }: { value: Skill[]; onChange: (value: Skill[]) => void }) {
  const add = () => onChange([...value, { id: newId(), name: "" }]);
  const categories = [...new Set(value.map((s) => s.category?.trim()).filter(Boolean))] as string[];

  return (
    <SectionCard title="مهارت‌ها" count={value.length} onAdd={add} addDisabled={value.length >= LIMITS.skills}>
      {value.length === 0 && <Empty>هنوز مهارتی اضافه نشده.</Empty>}
      {categories.length > 0 && (
        <datalist id="skill-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      )}
      {value.map((s, i) => {
        const set = (patch: Partial<Skill>) => onChange(replaceAt(value, i, patch));
        return (
          <div key={s.id} className="skill-row">
            <Field label="مهارت *" placeholder={PH.skills.name} value={s.name} onChange={(name) => set({ name })} max={50} />
            <label className="field">
              <span>دسته</span>
              <input
                list="skill-categories"
                placeholder={PH.skills.category}
                maxLength={50}
                value={s.category ?? ""}
                onChange={(e) => set({ category: e.target.value })}
              />
            </label>
            <Hideable k="skills.level">
              <Select<LevelOption>
                label="سطح"
                value={(s.level ? String(s.level) : "") as LevelOption}
                options={LEVELS}
                onChange={(v) => set({ level: v ? Number(v) : undefined })}
              />
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
