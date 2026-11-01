import type { Basics } from "@rb/schema";
import { Field, ItemControls, Select, SectionCard, TextArea, Empty } from "./fields";
import { LIMITS, move, newId, removeAt, replaceAt } from "./list";

type Link = Basics["links"][number];

const LINK_TYPES: readonly { value: Link["type"]; label: string }[] = [
  { value: "website", label: "وب‌سایت" },
  { value: "github", label: "GitHub" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "telegram", label: "تلگرام" },
  { value: "instagram", label: "اینستاگرام" },
  { value: "behance", label: "Behance" },
  { value: "dribbble", label: "Dribbble" },
  { value: "other", label: "سایر" },
];

const LINK_HOSTS: readonly [RegExp, Link["type"]][] = [
  [/(^|\.)github\.com$/, "github"],
  [/(^|\.)linkedin\.com$/, "linkedin"],
  [/(^|\.)(t\.me|telegram\.me)$/, "telegram"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)behance\.net$/, "behance"],
  [/(^|\.)dribbble\.com$/, "dribbble"],
];

/** Guesses the link type from its host; undefined when unknown or not a URL yet. */
function detectLinkType(url: string): Link["type"] | undefined {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return LINK_HOSTS.find(([pattern]) => pattern.test(host))?.[1];
  } catch {
    return undefined;
  }
}

export function BasicsForm({ value, onChange }: { value: Basics; onChange: (value: Basics) => void }) {
  const set = (patch: Partial<Basics>) => onChange({ ...value, ...patch });
  const setLinks = (links: Link[]) => set({ links });

  return (
    <>
      <SectionCard title="اطلاعات پایه">
        <div className="grid2">
          <Field label="نام و نام خانوادگی *" value={value.fullName} onChange={(fullName) => set({ fullName })} max={80} />
          <Field label="عنوان شغلی" value={value.jobTitle ?? ""} onChange={(jobTitle) => set({ jobTitle })} max={100} />
          <Field label="ایمیل" type="email" ltr value={value.email ?? ""} onChange={(email) => set({ email })} max={200} />
          <Field label="تلفن" type="tel" ltr value={value.phone ?? ""} onChange={(phone) => set({ phone })} max={20} />
          <Field label="شهر" value={value.location ?? ""} onChange={(location) => set({ location })} max={100} />
          <Field
            label="لینک عکس پروفایل"
            type="url"
            ltr
            placeholder="https://..."
            value={value.avatarUrl ?? ""}
            onChange={(avatarUrl) => set({ avatarUrl })}
            max={500}
          />
        </div>
        <TextArea
          label="درباره‌ی من"
          rows={4}
          max={1500}
          value={value.summary ?? ""}
          onChange={(summary) => set({ summary })}
        />
      </SectionCard>

      <SectionCard
        title="لینک‌ها"
        count={value.links.length}
        onAdd={() => setLinks([...value.links, { id: newId(), type: "website", url: "" }])}
        addDisabled={value.links.length >= LIMITS.links}
      >
        {value.links.length === 0 && <Empty>لینک گیت‌هاب، لینکدین یا وب‌سایت خود را اضافه کنید.</Empty>}
        {value.links.map((link, i) => (
          <div key={link.id} className="sub-card stack">
            <div className="grid2">
              <Select
                label="نوع"
                value={link.type}
                options={LINK_TYPES}
                onChange={(type) => setLinks(replaceAt(value.links, i, { type }))}
              />
              <Field
                label="آدرس *"
                type="url"
                ltr
                placeholder="https://..."
                value={link.url}
                onChange={(url) => {
                  // Auto-select the type unless the user picked one that no longer matches a detection.
                  const auto = link.type === "website" || link.type === detectLinkType(link.url);
                  const type = auto ? (detectLinkType(url) ?? "website") : link.type;
                  setLinks(replaceAt(value.links, i, { url, type }));
                }}
                max={500}
              />
              {link.type === "other" && (
                <Field
                  label="عنوان لینک"
                  value={link.label ?? ""}
                  onChange={(label) => setLinks(replaceAt(value.links, i, { label }))}
                  max={50}
                />
              )}
            </div>
            <ItemControls
              index={i}
              count={value.links.length}
              onMove={(d) => setLinks(move(value.links, i, d))}
              onRemove={() => setLinks(removeAt(value.links, i))}
              removeLabel="حذف لینک"
            />
          </div>
        ))}
      </SectionCard>
    </>
  );
}
