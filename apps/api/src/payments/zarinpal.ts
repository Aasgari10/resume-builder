// Zarinpal REST v4 adapter. Amounts are sent in rials (the gateway default).

import { PaymentGatewayError, type PaymentProvider } from "./types";

type FetchFn = typeof fetch;

type ZarinpalResponse<T> = {
  data?: T | unknown[];
  errors?: { code?: number; message?: string } | unknown[];
};

const SUCCESS = 100;
const ALREADY_VERIFIED = 101;

export function createZarinpal(options: { merchantId: string; sandbox?: boolean; fetch?: FetchFn; timeoutMs?: number }): PaymentProvider {
  const host = options.sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com";
  const startHost = options.sandbox ? "https://sandbox.zarinpal.com" : "https://www.zarinpal.com";
  const doFetch = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? 15_000;

  async function post<T>(path: string, body: unknown): Promise<{ data: T | null; error: { code?: number; message?: string } | null; raw: unknown }> {
    let res: Response;
    try {
      res = await doFetch(`${host}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      throw new PaymentGatewayError("Zarinpal is unreachable", String(e));
    }
    const raw = (await res.json().catch(() => null)) as ZarinpalResponse<T> | null;
    if (!raw) throw new PaymentGatewayError(`Zarinpal returned an invalid response (HTTP ${res.status})`);
    // The gateway returns an empty array for whichever of data/errors does not apply.
    const data = raw.data && !Array.isArray(raw.data) ? (raw.data as T) : null;
    const error = raw.errors && !Array.isArray(raw.errors) ? raw.errors : null;
    return { data, error, raw };
  }

  return {
    name: "zarinpal",

    async request({ amount, description, callbackUrl, mobile, orderId }) {
      const { data, error, raw } = await post<{ code: number; authority: string }>("/pg/v4/payment/request.json", {
        merchant_id: options.merchantId,
        amount,
        description,
        callback_url: callbackUrl,
        metadata: { ...(mobile ? { mobile } : {}), order_id: orderId },
      });
      if (!data || data.code !== SUCCESS || !data.authority) {
        throw new PaymentGatewayError(`Zarinpal request failed: ${error?.code ?? data?.code ?? "unknown"}`, raw);
      }
      return { authority: data.authority, paymentUrl: `${startHost}/pg/StartPay/${data.authority}`, raw };
    },

    async verify({ authority, amount }) {
      const { data, error, raw } = await post<{ code: number; ref_id?: number | string; card_pan?: string }>(
        "/pg/v4/payment/verify.json",
        { merchant_id: options.merchantId, authority, amount }
      );
      if (data && (data.code === SUCCESS || data.code === ALREADY_VERIFIED) && data.ref_id !== undefined) {
        return { ok: true, refId: String(data.ref_id), cardPan: data.card_pan, raw };
      }
      return { ok: false, code: error?.code ?? data?.code, message: error?.message ?? "verification failed", raw };
    },
  };
}
