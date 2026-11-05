// Per-field on/off switch. When a field is off it stays editable-looking but dimmed, and it is
// removed from the rendered resume (see applyHiddenFields). Without a provider the switch is not shown.

import { createContext, useContext, type ReactNode } from "react";

type HiddenFields = { isHidden: (key: string) => boolean; toggle: (key: string) => void };

export const HiddenFieldsContext = createContext<HiddenFields | null>(null);

export function Hideable({ k, children }: { k: string; children: ReactNode }) {
  const ctx = useContext(HiddenFieldsContext);
  if (!ctx) return <>{children}</>;
  const hidden = ctx.isHidden(k);
  return (
    <div className={`hideable${hidden ? " off" : ""}`}>
      <button
        type="button"
        role="switch"
        aria-checked={!hidden}
        className="hide-switch"
        title={hidden ? "این فیلد در رزومه نمایش داده نمی‌شود؛ برای نمایش کلیک کنید" : "حذف این فیلد از رزومه"}
        onClick={() => ctx.toggle(k)}
      >
        <i />
      </button>
      <div className="hideable-body" aria-disabled={hidden || undefined}>
        {children}
      </div>
      {hidden && <small className="hideable-note">در رزومه نمایش داده نمی‌شود</small>}
    </div>
  );
}
