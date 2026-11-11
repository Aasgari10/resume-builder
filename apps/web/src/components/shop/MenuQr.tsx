// Shop manager tab of menu sites (cafe, restaurant): a QR code that opens the site's menu page, to
// download as a picture or print for the tables. The address comes from the published site.

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { api, type Site } from "../../api";
import { errorText } from "./ShopOrders";

/** The full address of a page of the published site. */
const pageUrl = (site: Site, page: string) => new URL(`${(site.url ?? site.path).replace(/\/$/, "")}${page}`, window.location.origin).href;

export function MenuQr({ resumeId, name }: { resumeId?: string; name: string }) {
  const [site, setSite] = useState<Site | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [png, setPng] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [caption, setCaption] = useState("منوی ما را با دوربین گوشی ببینید");

  useEffect(() => {
    if (!resumeId) return setSite(null);
    api.getSite(resumeId).then(
      (r) => setSite(r.site),
      (e) => setError(errorText(e, "اطلاعات سایت دریافت نشد")),
    );
  }, [resumeId]);

  const url = site ? pageUrl(site, "/menu") : null;
  useEffect(() => {
    if (!url) return;
    const opts = { errorCorrectionLevel: "M" as const, margin: 2, color: { dark: "#121212", light: "#FFFFFF" } };
    QRCode.toDataURL(url, { ...opts, width: 1024 }).then(setPng, () => setError("ساختن QR کد انجام نشد"));
    QRCode.toString(url, { ...opts, type: "svg" }).then(setSvg, () => undefined);
  }, [url]);

  if (error) return <p className="error">{error}</p>;
  if (site === undefined) return <p className="muted shm-hint">در حال دریافت…</p>;
  if (!site || !site.isPublished || !url)
    return <p className="muted shm-hint">اول سایت را منتشر کنید؛ QR کد به صفحه‌ی منوی سایت منتشرشده باز می‌شود.</p>;

  const print = () => {
    const w = window.open("", "_blank", "width=600,height=800");
    if (!w || !svg) return;
    w.document.write(`<!doctype html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>QR منو</title>
<style>body{margin:0;display:grid;place-items:center;min-height:100vh;font-family:Vazirmatn,Tahoma,sans-serif;text-align:center}
.card{display:grid;gap:14px;justify-items:center;padding:28px;border:1px solid #ddd;border-radius:16px}
.card svg{width:260px;height:260px}h1{margin:0;font-size:24px}p{margin:0;color:#555}small{color:#888;direction:ltr}
@media print{.card{border:none}}</style></head><body><div class="card"><h1></h1>${svg}<p></p><small></small></div></body></html>`);
    w.document.querySelector("h1")!.textContent = name;
    w.document.querySelector("p")!.textContent = caption;
    w.document.querySelector("small")!.textContent = url;
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="shm-cats shm-qr">
      <p className="muted">این QR کد را روی میزها یا کنار صندوق بگذارید؛ مشتری با دوربین گوشی آن را اسکن می‌کند و منوی سایت باز می‌شود. با تغییر منو در همین پنل، QR کد عوض نمی‌شود.</p>
      <div className="shm-qr-card">
        {png && <img src={png} alt="QR کد منو" width={240} height={240} />}
        <a href={url} target="_blank" rel="noopener noreferrer" dir="ltr">
          {url}
        </a>
      </div>
      <label className="shm-field">
        <span>متن زیر QR در نسخه‌ی چاپی</span>
        <input value={caption} maxLength={80} onChange={(e) => setCaption(e.target.value)} />
      </label>
      <div className="row gap wrap">
        {png && (
          <a className="btn small" href={png} download="menu-qr.png">
            دانلود عکس QR
          </a>
        )}
        {svg && (
          <a className="btn ghost small" href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} download="menu-qr.svg">
            دانلود برای چاپخانه (SVG)
          </a>
        )}
        <button type="button" className="btn ghost small" onClick={print} disabled={!svg}>
          چاپ کارت میز
        </button>
      </div>
    </div>
  );
}
