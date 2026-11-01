// Reusable form controls for the resume editor.

import { useState, type ReactNode } from "react";

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "url" | "month";
  ltr?: boolean;
  max?: number;
  disabled?: boolean;
  placeholder?: string;
};

export function Field(props: FieldProps) {
  return props.type === "month" ? <MonthField {...props} /> : <InputField {...props} />;
}

function InputField({ label, value, onChange, type = "text", ltr, max, disabled, placeholder }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        className={ltr ? "ltr" : undefined}
        value={value}
        maxLength={max}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Month input. Browsers without native month support (Firefox, Safari) render a text box;
 * partial input stays local and only complete "YYYY-MM" values (or empty) are reported,
 * so autosave never sends a half-typed date.
 */
function MonthField({ label, value, onChange, disabled }: FieldProps) {
  const [raw, setRaw] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    // External change (load, sample data): adopt it.
    setSynced(value);
    setRaw(value);
  }

  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="month"
        className="ltr"
        placeholder="YYYY-MM"
        value={raw}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          setRaw(next);
          if (next === "" || YEAR_MONTH.test(next)) {
            setSynced(next);
            onChange(next);
          }
        }}
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  max,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  max?: number;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={rows} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="row gap">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/** Start/end month pair with an "ongoing" toggle. */
export function PeriodFields({
  value,
  onChange,
  currentLabel,
  required,
}: {
  value: { start: string; end?: string; current: boolean };
  onChange: (value: { start: string; end?: string; current: boolean }) => void;
  currentLabel: string;
  required?: boolean;
}) {
  return (
    <>
      <div className="grid2">
        <Field
          label={required ? "شروع *" : "شروع"}
          type="month"
          ltr
          value={value.start}
          onChange={(start) => onChange({ ...value, start })}
        />
        <Field
          label="پایان"
          type="month"
          ltr
          disabled={value.current}
          value={value.end ?? ""}
          onChange={(end) => onChange({ ...value, end: end || undefined })}
        />
      </div>
      <Checkbox
        label={currentLabel}
        checked={value.current}
        onChange={(current) => onChange({ ...value, current, end: current ? undefined : value.end })}
      />
    </>
  );
}

/** Free-text tags added with Enter or comma, removed with ×. */
export function TagInput({
  label,
  values,
  onChange,
  max,
  maxLength,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  max: number;
  maxLength: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const full = values.length >= max;

  const commit = () => {
    const tag = draft.trim().replace(/,$/, "").trim();
    if (tag && !values.includes(tag) && !full) onChange([...values, tag]);
    setDraft("");
  };

  return (
    <div className="field">
      <span>{label}</span>
      <div className="tag-input">
        {values.map((tag) => (
          <span key={tag} className="chip">
            {tag}
            <button type="button" aria-label={`حذف ${tag}`} onClick={() => onChange(values.filter((t) => t !== tag))}>
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          maxLength={maxLength}
          disabled={full}
          placeholder={full ? undefined : placeholder}
          onChange={(e) => (e.target.value.endsWith(",") || e.target.value.endsWith("،") ? commit() : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
        />
      </div>
    </div>
  );
}

/** Move up / move down / remove controls for one item in a list. */
export function ItemControls({
  index,
  count,
  onMove,
  onRemove,
  removeLabel,
}: {
  index: number;
  count: number;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="item-controls">
      <button type="button" className="icon-btn" aria-label="بالا" disabled={index === 0} onClick={() => onMove(-1)}>
        ↑
      </button>
      <button type="button" className="icon-btn" aria-label="پایین" disabled={index === count - 1} onClick={() => onMove(1)}>
        ↓
      </button>
      <button type="button" className="btn danger ghost small-btn" onClick={onRemove}>
        {removeLabel}
      </button>
    </div>
  );
}

/** Collapsible editor section with an optional "add" action. */
export function SectionCard({
  title,
  count,
  onAdd,
  addDisabled,
  addLabel = "+ افزودن",
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  onAdd?: () => void;
  addDisabled?: boolean;
  addLabel?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="card section-card" open={defaultOpen}>
      <summary>
        <h2>{title}</h2>
        {count !== undefined && <span className="count">{count}</span>}
      </summary>
      <div className="stack section-body">
        {children}
        {onAdd && (
          <button type="button" className="btn ghost self-start" onClick={onAdd} disabled={addDisabled}>
            {addLabel}
          </button>
        )}
      </div>
    </details>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="muted">{children}</p>;
}
