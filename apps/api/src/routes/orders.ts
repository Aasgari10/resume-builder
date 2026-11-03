// Template purchases: creates an order and starts payment at the configured gateway.

import { Router } from "express";
import { z } from "zod";
import { OrderItemType } from "@prisma/client";
import { prisma } from "../db";
import { HttpError, asyncHandler, parseBody } from "../lib/http";
import { currentUserId, requireAuth } from "../middleware/auth";
import { PaymentGatewayError, callbackUrl, paymentProvider } from "../payments";

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

const createBody = z.object({ templateId: z.string().min(1).max(100) });

/** POST /api/orders  { templateId } — creates a pending order and returns the gateway URL. */
ordersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const { templateId } = parseBody(createBody, req.body);

    const template = await prisma.template.findFirst({ where: { id: templateId, isActive: true } });
    if (!template) throw new HttpError(404, "NOT_FOUND", "قالب پیدا نشد");
    if (!template.isPremium || template.price <= 0) throw new HttpError(400, "FREE_TEMPLATE", "این قالب رایگان است");

    const owned = await prisma.templatePurchase.findUnique({ where: { userId_templateId: { userId, templateId } } });
    if (owned) throw new HttpError(409, "ALREADY_OWNED", "این قالب را قبلاً خریده‌اید");

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { phone: true } });
    // Price is copied at order time, so later price changes do not affect pending payments.
    const order = await prisma.order.create({
      data: { userId, itemType: OrderItemType.TEMPLATE, templateId, amount: template.price },
    });

    try {
      const start = await paymentProvider.request({
        amount: order.amount,
        description: `خرید قالب ${template.name}`,
        callbackUrl: callbackUrl(),
        mobile: user.phone,
        orderId: order.id,
      });
      await prisma.transaction.create({
        data: { orderId: order.id, provider: paymentProvider.name, authority: start.authority, amount: order.amount },
      });
      res.status(201).json({ orderId: order.id, paymentUrl: start.paymentUrl });
    } catch (e) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      if (e instanceof PaymentGatewayError) {
        console.error("Payment request failed:", e.message, e.raw);
        throw new HttpError(502, "GATEWAY_ERROR", "اتصال به درگاه پرداخت انجام نشد؛ کمی بعد دوباره تلاش کنید");
      }
      throw e;
    }
  })
);

/** GET /api/orders/:id — status of one of the user's orders (for the payment result page). */
ordersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findFirst({
      where: { id: String(req.params.id), userId: currentUserId(req) },
      include: {
        template: { select: { id: true, name: true } },
        transactions: { where: { status: "SUCCESS" }, select: { refId: true }, take: 1 },
      },
    });
    if (!order) throw new HttpError(404, "NOT_FOUND", "سفارش پیدا نشد");
    res.json({
      order: {
        id: order.id,
        status: order.status,
        amount: order.amount,
        template: order.template,
        refId: order.transactions[0]?.refId ?? null,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
      },
    });
  })
);
