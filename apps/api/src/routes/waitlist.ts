// Public sign-up for products that are not launched yet. Duplicate sign-ups are accepted silently.

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { HttpError, asyncHandler, parseBody } from "../lib/http";
import { normalizeIranPhone } from "../lib/phone";

export const WAITLIST_PRODUCTS = ["site", "shop", "salon", "clinic", "cafe", "business", "pricing", "consult"] as const;

export const waitlistRouter = Router();

const body = z.object({ product: z.enum(WAITLIST_PRODUCTS), phone: z.string().max(30) });

// Simple per-address limit; a sign-up form does not need more than a few requests per hour.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, { count: number; resetAt: number }>();

function allow(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
    return true;
  }
  entry.count++;
  return entry.count <= MAX_PER_WINDOW;
}

/** POST /api/waitlist  { product, phone } */
waitlistRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!allow(req.ip ?? "unknown")) throw new HttpError(429, "TOO_MANY_REQUESTS", "کمی بعد دوباره امتحان کنید");
    const { product, phone: raw } = parseBody(body, req.body);
    const phone = normalizeIranPhone(raw);
    if (!phone) throw new HttpError(400, "INVALID_PHONE", "شماره موبایل معتبر نیست");
    await prisma.waitlistEntry.upsert({
      where: { product_phone: { product, phone } },
      update: {},
      create: { product, phone },
    });
    res.status(201).json({ ok: true });
  })
);
