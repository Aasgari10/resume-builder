// npm test -w @rb/api
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeIranPhone } from "./phone";
import { OTP_LENGTH, generateOtp, hashOtp, verifyOtpHash } from "./otp";
import { SESSION_TTL_MS, createSessionToken, readCookie, verifySessionToken } from "./session";

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
