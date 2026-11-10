// Side panel of the site editor, with two tabs:
// - Assistant: the AI chat. The user writes what to change (look, pages, sections, new items) and
//   the assistant does what the template allows. Texts and pictures are edited on the page itself.
// - Publish: site address, search engine settings and publishing.

import { useMemo, type ReactNode } from "react";
import type { ResumeData, Theme } from "@rb/schema";
import type { TemplateDefinition } from "@rb/templates";
import { AssistantChat } from "../AssistantChat";
import { capabilitiesFor } from "./assistantSite";

export type PanelTab = "assistant" | "publish";

type Props = {
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  data: ResumeData;
  theme: Theme;
  /** The chosen site template: what the assistant may show, hide or add. */
  template: TemplateDefinition;
  onData: (data: ResumeData) => void;
  onTheme: (theme: Theme) => void;
  onClose: () => void;
  /** Publishing controls; absent for a draft that has not been saved yet. */
  publish: ReactNode;
};

export function SitePanel({ tab, onTab, data, theme, template, onData, onTheme, onClose, publish }: Props) {
  const capabilities = useMemo(() => capabilitiesFor(template, data), [template, data]);
  return (
    <aside className="sp" aria-label="پنل سایت">
      <div className="sp-head">
        <div className="sp-tabs" role="tablist">
          {(
            [
              ["assistant", "دستیار هوشمند"],
              ["publish", "انتشار"],
            ] as [PanelTab, string][]
          ).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => onTab(id)}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="ep-x" onClick={onClose} aria-label="بستن پنل">
          ×
        </button>
      </div>

      {tab === "assistant" && (
        <div className="sp-assistant">
          <AssistantChat theme={theme} locale={data.locale} onChange={onTheme} capabilities={capabilities} data={data} onData={onData} />
        </div>
      )}
      {tab === "publish" && <div className="sp-publish">{publish}</div>}
    </aside>
  );
}
