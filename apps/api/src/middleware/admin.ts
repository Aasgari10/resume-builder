import type { RequestHandler } from "express";
import { prisma } from "../db";
import { HttpError, asyncHandler } from "../lib/http";

/**
 * Allows only administrators. The role is read from the database on every request,
 * so revoking access takes effect immediately without waiting for the session to expire.
 */
export const requireAdmin: RequestHandler = asyncHandler(async (req, _res, next) => {
  if (!req.userId) throw new HttpError(401, "UNAUTHORIZED", "ابتدا وارد حساب کاربری شوید");
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
  // 404 rather than 403, so the admin API is not revealed to regular users.
  if (user?.role !== "ADMIN") throw new HttpError(404, "NOT_FOUND", "مسیر پیدا نشد");
  next();
});
