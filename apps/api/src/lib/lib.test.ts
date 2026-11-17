// npm test -w @rb/api
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeIranPhone } from "./phone";
import { OTP_LENGTH, generateOtp, hashOtp, verifyOtpHash } from "./otp";
import { SESSION_TTL_MS, createSessionToken, readCookie, verifySessionToken } from "./session";
import { gymDefaults, meetingsOf, priceCart, variantOf, type Shop } from "@rb/schema";
import { adjustShop, checkPassword, hashPassword } from "./shopData";

const SECRET = "test-secret-test-secret-test-secret-1234";

test("phone: normalizes common formats", () => {
  for (const input of ["09121234567", "9121234567", "+989121234567", "00989121234567", "989121234567", "0912 123 4567", "۰۹۱۲۱۲۳۴۵۶۷", "٠٩١٢١٢٣٤٥٦٧"]) {
    assert.equal(normalizeIranPhone(input), "09121234567", input);
  }
});

test("phone: rejects invalid numbers", () => {
  for (const input of ["", "0912123456", "091212345678", "02112345678", "abc", "08121234567"]) {
    assert.equal(normalizeIranPhone(input), null, input);
  }
});

test("otp: generates fixed-length numeric codes", () => {
  for (let i = 0; i < 200; i++) {
    const code = generateOtp();
    assert.match(code, new RegExp(`^\\d{${OTP_LENGTH}}$`));
  }
});

test("otp: accepts the right code, rejects wrong code, phone or secret", () => {
  const hash = hashOtp("09121234567", "12345", SECRET);
  assert.equal(verifyOtpHash("09121234567", "12345", hash, SECRET), true);
  assert.equal(verifyOtpHash("09121234567", "12346", hash, SECRET), false);
  assert.equal(verifyOtpHash("09121234568", "12345", hash, SECRET), false);
  assert.equal(verifyOtpHash("09121234567", "12345", hash, "another-secret-another-secret-12345"), false);
});

test("session: accepts a valid token", () => {
  const token = createSessionToken("user_1", SECRET);
  assert.equal(verifySessionToken(token, SECRET), "user_1");
});

test("session: rejects tampered, foreign-key and expired tokens", () => {
  const token = createSessionToken("user_1", SECRET);
  const [body, sig] = token.split(".");
  const forgedBody = Buffer.from(JSON.stringify({ uid: "admin", exp: Date.now() + 1e9 })).toString("base64url");

  assert.equal(verifySessionToken(`${forgedBody}.${sig}`, SECRET), null);
  assert.equal(verifySessionToken(`${body}.${sig}x`, SECRET), null);
  assert.equal(verifySessionToken(token, "wrong-secret-wrong-secret-wrong-1234"), null);
  assert.equal(verifySessionToken(token, SECRET, Date.now() + SESSION_TTL_MS + 1000), null);
  assert.equal(verifySessionToken("garbage", SECRET), null);
  assert.equal(verifySessionToken("", SECRET), null);
});

test("cookie: reads a value from the Cookie header", () => {
  assert.equal(readCookie("a=1; rb_session=abc.def; b=2", "rb_session"), "abc.def");
  assert.equal(readCookie("a=1", "rb_session"), null);
  assert.equal(readCookie(undefined, "rb_session"), null);
  assert.equal(readCookie("rb_session=%E0%A4%A", "rb_session"), null); // malformed encoding
});

test("uploads: detects image type from bytes, not from the declared type", async () => {
  const { sniffImage } = await import("./image");
  assert.equal(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))?.mime, "image/jpeg");
  assert.equal(sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))?.ext, "png");
  assert.equal(sniffImage(Buffer.from("RIFF\0\0\0\0WEBPVP8 ", "latin1"))?.mime, "image/webp");
  assert.equal(sniffImage(Buffer.from("<svg onload=alert(1)>")), null);
  assert.equal(sniffImage(Buffer.from("GIF89a......")), null);
});

/* ───────────── Shop: prices, discount codes, stock ───────────── */


const testShop = (): Shop => ({
  categories: [{ id: "c1", name: "A", image: "" }, { id: "c2", name: "B", image: "" }],
  products: [
    { id: "p1", name: "One", price: 100000, images: [], categoryId: "c1", stock: 5 },
    { id: "p2", name: "Two", price: 300000, salePrice: 200000, images: [], categoryId: "c2" },
    {
      id: "p3",
      name: "Three",
      price: 1000000,
      salePrice: 800000,
      images: [],
      categoryId: "c2",
      options: [{ name: "Size", values: [{ label: "S" }, { label: "L" }] }],
      variants: [{ key: "L", price: 1500000, stock: 1 }, { key: "S", stock: 0 }],
    },
    { id: "p4", name: "Gone", price: 50000, images: [], trashed: true },
  ],
  shippingFee: 50000,
  freeShippingFrom: 1000000,
  coupons: [
    { id: "k1", code: "ALL10", percent: 10, active: true },
    { id: "k2", code: "CAT2", percent: 50, maxDiscount: 120000, categoryIds: ["c2"], active: true },
    { id: "k3", code: "LATER", amount: 1000, startsAt: new Date(Date.now() + 86400000).toISOString(), active: true },
    { id: "k4", code: "ONLYP1", amount: 30000, productIds: ["p1"], active: true },
  ],
});

test("shop: prices come from the shop; sales, combinations and trashed products", () => {
  const shop = testShop();
  const r = priceCart(shop, [{ id: "p1", qty: 2 }, { id: "p2", qty: 1 }, { id: "p4", qty: 1 }, { id: "p3", qty: 3, size: "L" }]);
  // p3 "L" costs 1,500,000 on its own, the 20% sale applies to it too, and only 1 is in stock.
  assert.equal(variantOf(shop.products[2]!, "L").unit, 1200000);
  assert.deepEqual(r.lines.map((l) => [l.id, l.qty, l.unit]), [["p1", 2, 100000], ["p2", 1, 200000], ["p3", 1, 1200000]]);
  assert.equal(r.subtotal, 1600000);
  assert.equal(r.shipping, 0);
  // A sold-out combination is not sold.
  assert.equal(priceCart(shop, [{ id: "p3", qty: 1, size: "S" }]).lines.length, 0);
});

test("shop: discount codes cover their products and categories only", () => {
  const shop = testShop();
  const cart = [{ id: "p1", qty: 1 }, { id: "p2", qty: 1 }];
  assert.equal(priceCart(shop, cart, "all10").discount, 30000);
  // 50% of the c2 goods (200,000) is 100,000, under the 120,000 cap.
  assert.equal(priceCart(shop, cart, "CAT2").discount, 100000);
  assert.equal(priceCart(shop, [{ id: "p1", qty: 1 }], "CAT2").couponError, "این کد تخفیف برای کالاهای سبد شما نیست.");
  assert.equal(priceCart(shop, cart, "ONLYP1").discount, 30000);
  assert.match(priceCart(shop, cart, "LATER").couponError ?? "", /هنوز فعال نشده/);
  assert.match(priceCart(shop, cart, "NOPE").couponError ?? "", /معتبر نیست/);
  // Shipping is charged when the goods after the discount fall under the free-shipping line.
  assert.equal(priceCart(shop, [{ id: "p3", qty: 1, size: "L" }], "ALL10").shipping, 0);
  assert.equal(priceCart(shop, [{ id: "p2", qty: 1 }]).shipping, 50000);
});

test("shop: orders move stock and code use, and cancelling gives them back", () => {
  const data = { site: { gallery: [], shop: testShop() } };
  const sold = adjustShop(data as never, [{ id: "p1", qty: 2 }, { id: "p3", size: "L", qty: 1 }], -1, "all10", 1);
  const shop = (sold.data as unknown as typeof data).site.shop;
  assert.equal(sold.short, undefined);
  assert.equal(shop.products[0]!.stock, 3);
  assert.equal(shop.products[2]!.variants!.find((v) => v.key === "L")!.stock, 0);
  assert.equal(shop.coupons!.find((c) => c.code === "ALL10")!.used, 1);
  assert.equal(adjustShop(sold.data, [{ id: "p3", size: "L", qty: 1 }], -1).short, "Three (L)");
  const back = adjustShop(sold.data, [{ id: "p1", qty: 2 }], 1, "ALL10", -1);
  const again = (back.data as unknown as typeof data).site.shop;
  assert.equal(again.products[0]!.stock, 5);
  assert.equal(again.coupons!.find((c) => c.code === "ALL10")!.used, 0);
});

test("shop: customer passwords", () => {
  const stored = hashPassword("secret-123");
  assert.ok(checkPassword("secret-123", stored));
  assert.ok(!checkPassword("secret-124", stored));
  assert.ok(!checkPassword("x", "garbage"));
});

/* ───────────── Gold prices ───────────── */
import { goldQuote, withGoldPrice } from "@rb/schema";

test("goldQuote: gold, wage, profit and tax the way gold shops write the bill", () => {
  // 2 g of 18 karat at 10,000,000 a gram, 20% wage, 7% profit, 10% tax on wage and profit.
  const q = goldQuote({ weight: 2, karat: 18, wage: 20 }, { rate: 10_000_000, profit: 7, tax: 10 });
  assert.equal(q.gold, 20_000_000);
  assert.equal(q.wage, 4_000_000);
  assert.equal(q.profit, 1_680_000); // 7% of gold + wage
  assert.equal(q.tax, 568_000); // 10% of wage + profit
  assert.equal(q.total, 26_248_000);
  // 24 karat is 24/18 of the 18 karat rate; stones are added as they are.
  assert.equal(goldQuote({ weight: 1, karat: 24, wage: 0, stone: 500_000 }, { rate: 9_000_000, profit: 0, tax: 0 }).total, 12_500_000);
});

test("withGoldPrice: the price and the sale price follow the rate; other products stay", () => {
  const rate = { rate: 10_000_000, profit: 0, tax: 0 };
  const p = withGoldPrice({ id: "a", name: "انگشتر", price: 1, images: [], gold: { weight: 1, karat: 18, wage: 20, saleWage: 10 } }, rate);
  assert.equal(p.price, 12_000_000);
  assert.equal(p.salePrice, 11_000_000);
  const plain = { id: "b", name: "ساعت", price: 5_000_000, images: [] };
  assert.deepEqual(withGoldPrice(plain, rate), plain);
  // No rate yet: the price typed by hand stays.
  assert.equal(withGoldPrice({ ...p, price: 7 }, undefined).price, 7);
});

test("gym classes: only their weekly meetings, with the places left", () => {
  const now = new Date("2026-11-16T06:00:00Z"); // Monday 9:30 in Tehran
  const s = { ...gymDefaults(), ahead: 7 };
  const sessions = [
    { day: 1, time: "08:00" }, // Monday: today's is already over
    { day: 1, time: "18:00" },
    { day: 3, time: "18:00" },
  ];
  const taken = { "2026-11-16 18:00": 3 };
  const list = meetingsOf(s, sessions, 4, taken, now);
  assert.deepEqual(
    list.map((m) => `${m.date} ${m.time} ${m.free}`),
    ["2026-11-16 18:00 1", "2026-11-18 18:00 4", "2026-11-23 08:00 4", "2026-11-23 18:00 4"],
  );
  // A day off leaves its meetings out; so do closed weekdays.
  assert.equal(meetingsOf({ ...s, closed: ["2026-11-18"] }, sessions, 4, {}, now).some((m) => m.date === "2026-11-18"), false);
  assert.equal(meetingsOf({ ...s, days: [6, 0, 2, 4] }, sessions, 4, {}, now).length, 0);
});
