import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_LENGTH = 5;
export const OTP_TTL_MS = 2 * 60 * 1000; // code lifetime
export const OTP_RESEND_MS = 60 * 1000; // minimum interval between sends
export const OTP_MAX_ATTEMPTS = 5; // wrong guesses before the code is locked

/** Cryptographically secure numeric code. */
export function generateOtp(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

/**
 * HMAC of the code, keyed by the server secret. The phone number is part of the input,
 * so a stored hash cannot be reused for a different number.
 */
export function hashOtp(phone: string, code: string, secret: string): string {
  return createHmac("sha256", secret).update(`${phone}:${code}`).digest("hex");
}

/** Constant-time comparison against a stored hash. */
export function verifyOtpHash(phone: string, code: string, hash: string, secret: string): boolean {
  const expected = Buffer.from(hashOtp(phone, code, secret), "hex");
  const actual = Buffer.from(hash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
