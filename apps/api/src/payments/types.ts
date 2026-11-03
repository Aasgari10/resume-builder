// Gateway-agnostic payment interface. Amounts are always in rials.

export type PaymentRequest = {
  amount: number;
  description: string;
  callbackUrl: string;
  mobile?: string;
  orderId: string;
};

export type PaymentStart = {
  /** Gateway reference for this payment; stored on the transaction and echoed back on callback. */
  authority: string;
  /** Where the user is redirected to pay. */
  paymentUrl: string;
  raw: unknown;
};

export type PaymentVerification =
  | { ok: true; refId: string; cardPan?: string; raw: unknown }
  | { ok: false; code?: number; message: string; raw: unknown };

export interface PaymentProvider {
  readonly name: string;
  request(input: PaymentRequest): Promise<PaymentStart>;
  /** Amount must come from our database, never from the callback. */
  verify(input: { authority: string; amount: number }): Promise<PaymentVerification>;
}

export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    public raw?: unknown
  ) {
    super(message);
  }
}
