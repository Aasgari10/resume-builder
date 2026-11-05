import { useState } from "react";
import type { Basics } from "@rb/schema";
import { AvatarField } from "./AvatarField";
import { PH } from "./samples";
import { Hideable } from "./Hideable";
import { Field, ItemControls, Select, SectionCard, TextArea, Empty } from "./fields";
import { LIMITS, move, newId, removeAt, replaceAt } from "./list";

type Link = Basics["links"][number];

const LINK_TYPES: readonly { value: Link["type"]; label: string }[] = [
  { value: "website", label: "وب‌سایت" },
  { value: "github", label: "GitHub" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "telegram", label: "تلگرام" },
  { value: "whatsapp", label: "واتس‌اپ" },
  { value: "instagram", label: "اینستاگرام" },
  { value: "behance", label: "Behance" },
  { value: "dribbble", label: "Dribbble" },
  { value: "other", label: "سایر" },
];

const LINK_HOSTS: readonly [RegExp, Link["type"]][] = [
  [/(^|\.)github\.com$/, "github"],
  [/(^|\.)linkedin\.com$/, "linkedin"],
  [/(^|\.)(t\.me|telegram\.me)$/, "telegram"],
  [/(^|\.)(wa\.me|whatsapp\.com)$/, "whatsapp"],
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

type Props = { value: Basics; onChange: (value: Basics) => void };
type Personal = NonNullable<Basics["personal"]>;

/** Basic information and social links, as used by the site editor. */
export function BasicsForm({ value, onChange }: Props) {
  return (
    <>
      <BasicsInfoForm value={value} onChange={onChange} />
      <LinksForm value={value} onChange={onChange} />
    </>
  );
}

const JALALI_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

/** Jalali birth date as three selects; reports "YYYY/MM/DD" only when all three are chosen. */
function BirthDate({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [y = "", m = "", d = ""] = value ? value.split("/") : [];
  const [parts, setParts] = useState({ y, m, d });
  const thisYear = Number(new Intl.DateTimeFormat("en-u-ca-persian", { year: "numeric" }).format(new Date()).replace(/\D/g, ""));
  const update = (patch: Partial<typeof parts>) => {
    const next = { ...parts, ...patch };
    setParts(next);
    onChange(next.y && next.m && next.d ? `${next.y}/${next.m}/${next.d}` : "");
  };
  const fa = (n: number) => n.toLocaleString("fa-IR", { useGrouping: false });
  return (
    <div className="field">
      <span>تاریخ تولد</span>
      <div className="birth-date">
        <select value={parts.y} onChange={(e) => update({ y: e.target.value })} aria-label="سال">
          <option value="">سال</option>
          {Array.from({ length: 70 }, (_, i) => thisYear - 15 - i).map((year) => (
            <option key={year} value={String(year)}>
              {fa(year)}
            </option>
          ))}
        </select>
        <select value={parts.m} onChange={(e) => update({ m: e.target.value })} aria-label="ماه">
          <option value="">ماه</option>
          {JALALI_MONTHS.map((name, i) => (
            <option key={name} value={String(i + 1).padStart(2, "0")}>
              {name}
            </option>
          ))}
        </select>
        <select value={parts.d} onChange={(e) => update({ d: e.target.value })} aria-label="روز">
          <option value="">روز</option>
          {Array.from({ length: Number(parts.m) > 6 ? 30 : 31 }, (_, i) => i + 1).map((day) => (
            <option key={day} value={String(day).padStart(2, "0")}>
              {fa(day)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function OptionalSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: readonly { value: T; label: string }[];
  onChange: (value: T | undefined) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value ?? ""} onChange={(e) => onChange((e.target.value || undefined) as T | undefined)}>
        <option value="">انتخاب کنید</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Name, title, contact, photo, personal details and summary. */
export function BasicsInfoForm({ value, onChange }: Props) {
  const set = (patch: Partial<Basics>) => onChange({ ...value, ...patch });
  const personal = value.personal ?? {};
  const setPersonal = (patch: Partial<Personal>) => set({ personal: { ...personal, ...patch } });

  return (
    <>
      <SectionCard title="اطلاعات پایه">
        <div className="grid2">
          <Field label="نام و نام خانوادگی *" placeholder={PH.basics.fullName} value={value.fullName} onChange={(fullName) => set({ fullName })} max={80} />
          <Hideable k="basics.jobTitle">
            <Field label="عنوان شغلی" placeholder={PH.basics.jobTitle} value={value.jobTitle ?? ""} onChange={(jobTitle) => set({ jobTitle })} max={100} />
          </Hideable>
          <Hideable k="basics.email">
            <Field label="ایمیل" type="email" ltr placeholder={PH.basics.email} value={value.email ?? ""} onChange={(email) => set({ email })} max={200} />
          </Hideable>
          <Hideable k="basics.phone">
            <Field label="تلفن" type="tel" ltr placeholder={PH.basics.phone} value={value.phone ?? ""} onChange={(phone) => set({ phone })} max={20} />
          </Hideable>
          <Hideable k="basics.location">
            <Field label="شهر" placeholder={PH.basics.location} value={value.location ?? ""} onChange={(location) => set({ location })} max={100} />
          </Hideable>
        </div>
        <Hideable k="basics.avatar">
          <AvatarField value={value.avatarUrl ?? ""} onChange={(avatarUrl) => set({ avatarUrl })} />
        </Hideable>
        <details className="personal-details" open={Boolean(value.personal)}>
          <summary>اطلاعات تکمیلی (فقط در رزومه‌ی پی‌دی‌اف)</summary>
          <div className="grid2">
            <Hideable k="basics.birthDate">
              <BirthDate value={personal.birthDate ?? ""} onChange={(birthDate) => setPersonal({ birthDate })} />
            </Hideable>
            <Hideable k="basics.marital">
            <OptionalSelect
              label="وضعیت تأهل"
              value={personal.marital}
              options={[
                { value: "single", label: "مجرد" },
                { value: "married", label: "متأهل" },
              ]}
              onChange={(marital) => setPersonal({ marital })}
            />
            </Hideable>
            <Hideable k="basics.military">
              <OptionalSelect
                label="وضعیت سربازی"
                value={personal.military}
                options={[
                  { value: "done", label: "پایان خدمت" },
                  { value: "exempt", label: "معاف" },
                  { value: "student", label: "معافیت تحصیلی" },
                  { value: "serving", label: "در حال خدمت" },
                  { value: "none", label: "مشمول" },
                ]}
                onChange={(military) => setPersonal({ military })}
              />
            </Hideable>
          </div>
        </details>
        <Hideable k="basics.summary">
        <TextArea
          label="درباره‌ی من"
          rows={4}
          max={1500}
          placeholder={PH.basics.summary}
          value={value.summary ?? ""}
          onChange={(summary) => set({ summary })}
        />
        </Hideable>
      </SectionCard>
    </>
  );
}

/** Website and social links. */
export function LinksForm({ value, onChange }: Props) {
  const setLinks = (links: Link[]) => onChange({ ...value, links });
  return (
    <>
      <SectionCard
        title="لینک‌ها و شبکه‌های اجتماعی"
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
                placeholder={PH.basics.link}
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
