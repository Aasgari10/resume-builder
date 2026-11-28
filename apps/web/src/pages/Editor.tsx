// Website editor: the live site fills the screen and is edited by clicking its texts and pictures;
// the side panel holds the AI assistant. Changes are saved automatically. Customers do not publish:
// "ثبت سفارش" sends the design to the team (see components/siteOrders).

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DEFAULT_PORTFOLIO_TEMPLATE_ID, getTemplate } from "@rb/templates";
import { Preview } from "../components/Preview";
import { SAVE_LABELS, useResumeDoc } from "../components/editor/useResumeDoc";
import { OrderDialog } from "../components/siteOrders";
import { toast } from "../lib/toast";

export function Editor() {
  const { id } = useParams<{ id: string }>();
  const doc = useResumeDoc(id, (savedId) => `/resumes/${savedId}`);
  const { isDraft, title, setTitle, data, setData, theme, setTheme, loadError, saveState, saveError, save } = doc;
  const [ordering, setOrdering] = useState(false);
  const navigate = useNavigate();

  // Older single-page templates have no click-to-edit; such sites move to the default editable template.
  useEffect(() => {
    if (theme && !getTemplate(theme.templateId).pages) setTheme({ ...theme, templateId: DEFAULT_PORTFOLIO_TEMPLATE_ID });
  }, [theme, setTheme]);

  if (loadError) return <p className="error">{loadError}</p>;
  if (!data || !theme) return <p className="muted">در حال بارگذاری…</p>;

  const bar = (
    <>
      <Link to="/templates" className="ws-chip ws-back" title="بازگشت به قالب‌ها">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
        <span>قالب‌ها</span>
      </Link>
      <Link to="/" className="ws-logo" aria-label="site4site، صفحه‌ی اصلی">
        site<b>4</b>site
      </Link>
      <input className="ws-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} aria-label="نام سایت" />
      {SAVE_LABELS[saveState] && <span className={`save-badge ${saveState}`}>{SAVE_LABELS[saveState]}</span>}
      {isDraft ? (
        <button
          className="btn small"
          onClick={async () => {
            if (await save()) toast("✓ در «رزومه‌های من» ذخیره شد");
          }}
          disabled={saveState === "saving"}
        >
          ذخیره
        </button>
      ) : (
        <Link to={`/resumes/${id}/pdf`} className="ws-chip" title="نسخه‌ی پی‌دی‌اف رزومه">
          PDF
        </Link>
      )}
      <button className="btn small so-order-btn" onClick={() => setOrdering(true)}>
        ثبت سفارش
      </button>
    </>
  );

  return (
    <div className="site-editor" dir={data.locale === "fa" ? "rtl" : "ltr"}>
      {saveError && <p className="error">ذخیره نشد: {saveError}</p>}
      <Preview data={data} theme={theme} onThemeChange={setTheme} onDataChange={setData} bar={bar} resumeId={isDraft ? undefined : id} />
      {ordering && (
        <OrderDialog
          title={title}
          save={save}
          onClose={() => setOrdering(false)}
          onDone={(order) => {
            setOrdering(false);
            toast(`✓ سفارش ثبت شد؛ کد پیگیری ${order.code}`);
            navigate(`/account/orders?open=${order.id}`);
          }}
        />
      )}
    </div>
  );
}
