import type { Project } from "@rb/schema";
import { Empty, Field, ItemControls, SectionCard, TagInput, TextArea } from "./fields";
import { LIMITS, move, newId, removeAt, replaceAt } from "./list";

export function ProjectsForm({ value, onChange }: { value: Project[]; onChange: (value: Project[]) => void }) {
  const add = () => onChange([...value, { id: newId(), title: "", technologies: [], images: [] }]);

  return (
    <SectionCard title="پروژه‌ها" count={value.length} onAdd={add} addDisabled={value.length >= LIMITS.projects}>
      {value.length === 0 && <Empty>هنوز پروژه‌ای اضافه نشده.</Empty>}
      {value.map((p, i) => {
        const set = (patch: Partial<Project>) => onChange(replaceAt(value, i, patch));
        return (
          <div key={p.id} className="sub-card stack">
            <div className="grid2">
              <Field label="عنوان پروژه *" value={p.title} onChange={(title) => set({ title })} max={100} />
              <Field label="نقش من" value={p.role ?? ""} onChange={(role) => set({ role })} max={100} />
              <Field
                label="لینک پروژه"
                type="url"
                ltr
                placeholder="https://..."
                value={p.url ?? ""}
                onChange={(url) => set({ url })}
                max={500}
              />
              <Field
                label="لینک سورس کد"
                type="url"
                ltr
                placeholder="https://github.com/..."
                value={p.repoUrl ?? ""}
                onChange={(repoUrl) => set({ repoUrl })}
                max={500}
              />
              <Field
                label="لینک تصویر"
                type="url"
                ltr
                placeholder="https://..."
                value={p.images[0] ?? ""}
                onChange={(image) => set({ images: image ? [image, ...p.images.slice(1)] : p.images.slice(1) })}
                max={500}
              />
            </div>
            <TextArea label="توضیحات" max={2000} value={p.description ?? ""} onChange={(description) => set({ description })} />
            <TagInput
              label="تکنولوژی‌ها"
              placeholder="مثلاً React و Enter"
              values={p.technologies}
              onChange={(technologies) => set({ technologies })}
              max={LIMITS.technologies}
              maxLength={40}
            />
            <ItemControls
              index={i}
              count={value.length}
              onMove={(d) => onChange(move(value, i, d))}
              onRemove={() => onChange(removeAt(value, i))}
              removeLabel="حذف این پروژه"
            />
          </div>
        );
      })}
    </SectionCard>
  );
}
