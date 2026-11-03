import { test } from "node:test";
import assert from "node:assert/strict";
import { PaymentGatewayError } from "./types";
import { createZarinpal } from "./zarinpal";

type Call = { url: string; body: Record<string, unknown> };

/** Fake fetch that records calls and answers with the given JSON. */
function mockFetch(reply: unknown, status = 200) {
  const calls: Call[] = [];
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)) });
    return new Response(JSON.stringify(reply), { status, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const input = { amount: 2_000_000, description: "test", callbackUrl: "https://app.test/cb", mobile: "09121234567", orderId: "o1" };

test("zarinpal: request returns authority and StartPay URL", async () => {
  const { fn, calls } = mockFetch({ data: { code: 100, authority: "A0001" }, errors: [] });
  const zp = createZarinpal({ merchantId: "m", fetch: fn });
  const start = await zp.request(input);
  assert.equal(start.authority, "A0001");
  assert.equal(start.paymentUrl, "https://www.zarinpal.com/pg/StartPay/A0001");
  assert.equal(calls[0]?.url, "https://payment.zarinpal.com/pg/v4/payment/request.json");
  assert.equal(calls[0]?.body.amount, 2_000_000);
  assert.equal(calls[0]?.body.callback_url, "https://app.test/cb");
});

test("zarinpal: sandbox uses sandbox hosts", async () => {
  const { fn, calls } = mockFetch({ data: { code: 100, authority: "S1" }, errors: [] });
  const start = await createZarinpal({ merchantId: "m", sandbox: true, fetch: fn }).request(input);
  assert.ok(calls[0]?.url.startsWith("https://sandbox.zarinpal.com/"));
  assert.equal(start.paymentUrl, "https://sandbox.zarinpal.com/pg/StartPay/S1");
});

test("zarinpal: request error throws a gateway error", async () => {
  const { fn } = mockFetch({ data: [], errors: { code: -9, message: "validation error" } });
  await assert.rejects(createZarinpal({ merchantId: "m", fetch: fn }).request(input), PaymentGatewayError);
});

test("zarinpal: network failure throws a gateway error", async () => {
  const fn = (async () => {
    throw new TypeError("fetch failed");
  }) as unknown as typeof fetch;
  await assert.rejects(createZarinpal({ merchantId: "m", fetch: fn }).request(input), PaymentGatewayError);
});

test("zarinpal: verify accepts codes 100 and 101 and sends our amount", async () => {
  for (const code of [100, 101]) {
    const { fn, calls } = mockFetch({ data: { code, ref_id: 201, card_pan: "6037****1234" }, errors: [] });
    const result = await createZarinpal({ merchantId: "m", fetch: fn }).verify({ authority: "A1", amount: 500 });
    assert.deepEqual(result.ok && result.refId, "201");
    assert.equal(calls[0]?.body.amount, 500);
    assert.equal(calls[0]?.body.authority, "A1");
  }
});

test("zarinpal: verify reports failure without throwing", async () => {
  const { fn } = mockFetch({ data: [], errors: { code: -51, message: "Session is not valid" } });
  const result = await createZarinpal({ merchantId: "m", fetch: fn }).verify({ authority: "A1", amount: 500 });
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.code, -51);
});
