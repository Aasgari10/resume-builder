import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError, api } from "../api";
import { useAuth } from "../auth";
import { PageHead, UnitPage } from "../site4site/Shell";
import "../site4site/pages.css";

export function Login() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/account";

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  if (user) return <Navigate to={redirectTo} replace />;

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await api.requestOtp(phone);
      setDevCode(r.devCode ?? null);
      setStep("code");
      setResendIn(60);
    } catch (err) {
      if (err instanceof ApiError && err.code === "OTP_TOO_SOON") {
        const seconds = (err.details as { retryAfterSeconds?: number })?.retryAfterSeconds ?? 60;
        setStep("code");
        setResendIn(seconds);
      }
      setError(err instanceof ApiError ? err.message : "خطای ناشناخته");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await api.verifyOtp(phone, code);
      setUser(r.user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطای ناشناخته");
    } finally {
      setBusy(false);
    }
  }

  return (
    <UnitPage>
      <PageHead plate="در ورودی" title="ورود / ثبت‌نام" sub="با شماره‌ی موبایل و کد پیامکی؛ بدون رمز. اگر حساب ندارید، همین‌جا ساخته می‌شود." sides={false} />
      <div className="lg-card">

      {step === "phone" ? (
        <form onSubmit={sendCode} className="sp-form">
          <label>
            <span>شماره موبایل</span>
            <input
              className="ltr"
              inputMode="tel"
              autoComplete="tel"
              placeholder="09121234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
              required
            />
          </label>
          <button className="s4-btn main" disabled={busy}>
            {busy ? "در حال ارسال…" : "دریافت کد"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="sp-form">
          <p className="lg-sent">
            کد به <span className="ltr">{phone}</span> فرستاده شد.{" "}
            <button type="button" className="lg-link" onClick={() => setStep("phone")}>
              تغییر شماره
            </button>
          </p>

          {devCode && (
            <div className="sp-off">
              حالت توسعه: کد ورود <strong className="ltr">{devCode}</strong> است (در ترمینال API هم چاپ شده).
            </div>
          )}

          <label>
            <span>کد ورود</span>
            <input
              className="ltr code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={5}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              required
            />
          </label>
          <button className="s4-btn main" disabled={busy}>
            {busy ? "در حال بررسی…" : "ورود"}
          </button>
          <button type="button" className="s4-btn ghost" disabled={busy || resendIn > 0} onClick={() => sendCode()}>
            {resendIn > 0 ? `ارسال دوباره تا ${resendIn} ثانیه` : "ارسال دوباره‌ی کد"}
          </button>
        </form>
      )}

      {error && <p className="sp-error">{error}</p>}
      </div>
    </UnitPage>
  );
}
