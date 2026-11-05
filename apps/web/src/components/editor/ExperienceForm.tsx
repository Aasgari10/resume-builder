import type { Experience } from "@rb/schema";
import { Empty, Field, ItemControls, PeriodFields, SectionCard, TextArea } from "./fields";
import { Hideable } from "./Hideable";
import { LIMITS, move, newId, removeAt, replaceAt } from "./list";

export function ExperienceForm({ value, onChange }: { value: Experience[]; onChange: (value: Experience[]) => void }) {
  const add = () =>
    onChange([...value, { id: newId(), company: "", position: "", period: { start: "", current: false }, highlights: [] }]);

  return (
    <SectionCard title="سوابق کاری" count={value.length} onAdd={add} addDisabled={value.length >= LIMITS.experience}>
      {value.length === 0 && <Empty>هنوز سابقه‌ای اضافه نشده.</Empty>}
      {value.map((x, i) => {
        const set = (patch: Partial<Experience>) => onChange(replaceAt(value, i, patch));
        return (
          <div key={x.id} className="sub-card stack">
            <div className="grid2">
              <Field label="سمت *" value={x.position} onChange={(position) => set({ position })} max={100} />
              <Field label="شرکت *" value={x.company} onChange={(company) => set({ company })} max={100} />
              <Hideable k="experience.location">
                <Field label="محل" value={x.location ?? ""} onChange={(location) => set({ location })} max={100} />
              </Hideable>
            </div>
            <PeriodFields value={x.period} onChange={(period) => set({ period })} currentLabel="هنوز اینجا کار می‌کنم" required />
            <Hideable k="experience.description">
              <TextArea label="توضیحات" max={2000} value={x.description ?? ""} onChange={(description) => set({ description })} />
            </Hideable>
            <Hideable k="experience.highlights">
              <TextArea
                label="دستاوردها"
                rows={4}
                hint={`هر دستاورد در یک خط (حداکثر ${LIMITS.highlights} مورد)`}
                value={x.highlights.join("\n")}
                onChange={(text) =>
                  set({
                    highlights: text
                      .split("\n")
                      .slice(0, LIMITS.highlights)
                      .map((line) => line.slice(0, 300)),
                  })
                }
              />
            </Hideable>
            <ItemControls
              index={i}
              count={value.length}
              onMove={(d) => onChange(move(value, i, d))}
              onRemove={() => onChange(removeAt(value, i))}
              removeLabel="حذف این سابقه"
            />
          </div>
        );
      })}
    </SectionCard>
  );
}
