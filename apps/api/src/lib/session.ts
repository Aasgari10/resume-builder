// Stateless signed session token stored in an httpOnly cookie.
// Format: base64url(payload).base64url(hmac-sha256)

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "rb_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type SessionPayload = { uid: string; exp: number };

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSessionToken(userId: string, secret: string, now = Date.now()): string {
  const payload: SessionPayload = { uid: userId, exp: now + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

/** Returns the user id, or null if the token is tampered with, malformed or expired. */
export function verifySessionToken(token: string, secret: string, now = Date.now()): string | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Partial<SessionPayload>;
    if (typeof payload.uid !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < now) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

/** Reads one cookie value from a Cookie header. */
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}
