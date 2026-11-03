// Development-only gateway: redirects to a local page where the payment can be approved or canceled.

import { randomBytes } from "node:crypto";
import type { PaymentProvider } from "./types";

export const FAKE_GATEWAY_PATH = "/api/payments/fake";

export function createFakeGateway(appUrl: string): PaymentProvider {
  return {
    name: "fake",
    async request() {
      const authority = `FAKE-${randomBytes(12).toString("hex")}`;
      return { authority, paymentUrl: `${appUrl}${FAKE_GATEWAY_PATH}/${authority}`, raw: { fake: true } };
    },
    async verify({ authority }) {
      return { ok: true, refId: authority.slice(-8).toUpperCase(), cardPan: "6037****1234", raw: { fake: true } };
    },
  };
}
