/** Rials to a Persian toman label, e.g. 2000000 → «۲۰۰٬۰۰۰ تومان». */
export function formatToman(rials: number): string {
  return `${Math.round(rials / 10).toLocaleString("fa-IR")} تومان`;
}

/** Where to return after the payment gateway; survives the round trip in this tab only. */
export const RETURN_KEY = "rb:payment-return";

export function rememberReturnPath(path: string) {
  try {
    sessionStorage.setItem(RETURN_KEY, path);
  } catch {
    // storage unavailable; the result page falls back to the dashboard
  }
}

/** Read-only, so repeated renders and page refreshes return the same path. */
export function readReturnPath(): string {
  try {
    const path = sessionStorage.getItem(RETURN_KEY);
    if (path && path.startsWith("/") && !path.startsWith("//")) return path;
  } catch {
    // ignore
  }
  return "/dashboard";
}
