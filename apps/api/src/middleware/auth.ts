import type { RequestHandler } from "express";
import { env } from "../env";
import { HttpError } from "../lib/http";
import { SESSION_COOKIE, readCookie, verifySessionToken } from "../lib/session";

/**
 * Runs on every request: sets req.userId when the session cookie is valid.
 * This is the only source of userId; it is never read from the body or query.
 */
export const loadSession: RequestHandler = (req, _res, next) => {
  const token = readCookie(req.headers.cookie, SESSION_COOKIE);
  if (token) {
    const userId = verifySessionToken(token, env.sessionSecret);
    if (userId) req.userId = userId;
  }
  next();
};

/** Rejects unauthenticated requests with 401. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.userId) {
    next(new HttpError(401, "UNAUTHORIZED", "ابتدا وارد حساب کاربری شوید"));
    return;
  }
  next();
};

/** Authenticated user id; use only behind requireAuth. */
export function currentUserId(req: { userId?: string }): string {
  if (!req.userId) throw new HttpError(401, "UNAUTHORIZED", "ابتدا وارد حساب کاربری شوید");
  return req.userId;
}
