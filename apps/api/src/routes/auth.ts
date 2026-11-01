import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { env } from "../env";
import { HttpError, asyncHandler, parseBody } from "../lib/http";
import {
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_MS,
  OTP_TTL_MS,
  generateOtp,
  hashOtp,
  verifyOtpHash,
} from "../lib/otp";
import { normalizeIranPhone, toLatinDigits } from "../lib/phone";
import { SESSION_COOKIE, SESSION_TTL_MS, createSessionToken } from "../lib/session";
import { sendOtpSms } from "../lib/sms";
import { currentUserId, requireAuth } from "../middleware/auth";

export const authRouter = Router();

const phoneBody = z.object({ phone: z.string().max(30) });
const verifyBody = z.object({ phone: z.string().max(30), code: z.string().max(10) });

function requirePhone(raw: string): string {
  const phone = normalizeIranPhone(raw);
  if (!phone) throw new HttpError(400, "INVALID_PHONE", "شماره موبایل معتبر نیست");
  return phone;
}

const publicUser = (u: { id: string; phone: string; name: string | null; role: string }) => ({
  id: u.id,
  phone: u.phone,
  name: u.name,
  role: u.role,
});

/** POST /api/auth/request-otp  { phone } — sends a login code. */
authRouter.post(
  "/request-otp",
  asyncHandler(async (req, res) => {
    const phone = requirePhone(parseBody(phoneBody, req.body).phone);

    // Rate limit: one code per OTP_RESEND_MS per phone.
    const last = await prisma.otpCode.findFirst({
      where: { phone },
      orderBy: { createdAt: "desc" },
    });
    if (last) {
      const waitMs = last.createdAt.getTime() + OTP_RESEND_MS - Date.now();
      if (waitMs > 0) {
        throw new HttpError(429, "OTP_TOO_SOON", "کمی صبر کنید و دوباره امتحان کنید", {
          retryAfterSeconds: Math.ceil(waitMs / 1000),
        });
      }
    }

    const code = generateOtp();
    await prisma.otpCode.create({
      data: {
        phone,
        codeHash: hashOtp(phone, code, env.sessionSecret),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    await sendOtpSms(phone, code);

    res.json({
      ok: true,
      expiresInSeconds: OTP_TTL_MS / 1000,
      ...(env.otpDevEcho ? { devCode: code } : {}), // development only
    });
  })
);

/** POST /api/auth/verify-otp  { phone, code } — signs in (creating the user on first login) and sets the session cookie. */
authRouter.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const body = parseBody(verifyBody, req.body);
    const phone = requirePhone(body.phone);
    const code = toLatinDigits(body.code.trim()); // accept codes typed with a Persian keyboard

    const otp = await prisma.otpCode.findFirst({
      where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) throw new HttpError(400, "OTP_EXPIRED", "کد منقضی شده؛ دوباره درخواست دهید");
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new HttpError(429, "OTP_LOCKED", "تلاش‌های زیادی انجام شد؛ کد جدید درخواست دهید");
    }

    if (!verifyOtpHash(phone, code, otp.codeHash, env.sessionSecret)) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      throw new HttpError(400, "OTP_WRONG", "کد اشتباه است");
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    res.cookie(SESSION_COOKIE, createSessionToken(user.id, env.sessionSecret), {
      httpOnly: true, // not readable from page scripts
      sameSite: "lax",
      secure: env.isProd, // HTTPS only in production
      maxAge: SESSION_TTL_MS,
      path: "/",
    });
    res.json({ user: publicUser(user) });
  })
);

/** POST /api/auth/logout */
authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

/** GET /api/auth/me — current user. */
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: currentUserId(req) } });
    if (!user) throw new HttpError(401, "UNAUTHORIZED", "کاربر پیدا نشد");
    res.json({ user: publicUser(user) });
  })
);
