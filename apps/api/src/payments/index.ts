import { env } from "../env";
import { createFakeGateway } from "./fake";
import type { PaymentProvider } from "./types";
import { createZarinpal } from "./zarinpal";

export type { PaymentProvider } from "./types";
export { PaymentGatewayError } from "./types";

/** The configured platform gateway (template sales). */
export const paymentProvider: PaymentProvider =
  env.payment.provider === "zarinpal"
    ? createZarinpal({ merchantId: env.payment.merchantId, sandbox: env.payment.sandbox })
    : createFakeGateway(env.appUrl);

export const callbackUrl = () => `${env.appUrl}/api/payments/callback`;
