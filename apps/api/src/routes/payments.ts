// Gateway callback. The user's browser lands here after paying; the payment is verified
// server-to-server using the amount stored on our transaction, then the user is sent to the result page.

import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { env } from "../env";
import { asyncHandler } from "../lib/http";
import { paymentProvider } from "../payments";
import { FAKE_GATEWAY_PATH } from "../payments/fake";
import { escapeHtml } from "../render/sitePage";

export const paymentsRouter = Router();

const resultUrl = (query: Record<string, string>) => `${env.appUrl}/payment/result?${new URLSearchParams(query)}`;

/** GET /api/payments/callback?Authority=&Status=OK|NOK */
paymentsRouter.get(
  "/callback",
  asyncHandler(async (req, res) => {
    const authority = typeof req.query.Authority === "string" ? req.query.Authority : "";
    const status = req.query.Status;

    const tx = authority ? await prisma.transaction.findUnique({ where: { authority }, include: { order: true } }) : null;
    if (!tx) {
      res.redirect(303, resultUrl({ error: "UNKNOWN_PAYMENT" }));
      return;
    }
    const done = () => res.redirect(303, resultUrl({ order: tx.orderId }));

    // Already settled (page refresh or a repeated callback).
    if (tx.status !== "PENDING") return done();

    if (status !== "OK") {
      await markFailed(tx.id, tx.orderId, { canceled: true });
      return done();
    }

    const result = await paymentProvider.verify({ authority, amount: tx.amount });
    if (!result.ok) {
      await markFailed(tx.id, tx.orderId, result.raw);
      return done();
    }

    await prisma.$transaction(async (db) => {
      // Conditional update: only one concurrent callback can move the transaction out of PENDING.
      const claimed = await db.transaction.updateMany({
        where: { id: tx.id, status: "PENDING" },
        data: { status: "SUCCESS", refId: result.refId, verifiedAt: new Date(), raw: result.raw as Prisma.InputJsonValue },
      });
      if (claimed.count === 0) return;

      await db.order.update({ where: { id: tx.orderId }, data: { status: "PAID", paidAt: new Date() } });
      if (tx.order.templateId) {
        await db.templatePurchase.createMany({
          data: [{ userId: tx.order.userId, templateId: tx.order.templateId, orderId: tx.orderId }],
          skipDuplicates: true, // already owned through an earlier order
        });
      }
    });
    done();
  })
);

async function markFailed(txId: string, orderId: string, raw: unknown) {
  await prisma.$transaction([
    prisma.transaction.updateMany({
      where: { id: txId, status: "PENDING" },
      data: { status: "FAILED", verifiedAt: new Date(), raw: raw as Prisma.InputJsonValue },
    }),
    prisma.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "FAILED" } }),
  ]);
}

// Local stand-in for the gateway's payment page.
if (env.payment.provider === "fake") {
  paymentsRouter.get(
    `${FAKE_GATEWAY_PATH.replace("/api/payments", "")}/:authority`,
    asyncHandler(async (req, res) => {
      const raw = String(req.params.authority ?? "");
      const tx = await prisma.transaction.findUnique({ where: { authority: raw }, select: { amount: true } });
      const authority = encodeURIComponent(raw);
      const link = (status: string) => `${env.appUrl}/api/payments/callback?Authority=${authority}&Status=${status}`;
      const amount = tx ? `${(tx.amount / 10).toLocaleString("fa-IR")} تومان` : "نامعتبر";
      res.type("html").send(`<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>درگاه آزمایشی</title>
<body style="font-family:Tahoma,sans-serif;max-width:420px;margin:60px auto;padding:24px;border:1px solid #ddd;border-radius:12px;text-align:center">
<h2>درگاه پرداخت آزمایشی</h2><p>فقط برای محیط توسعه؛ پولی جابه‌جا نمی‌شود.</p>
<p>مبلغ: <b>${escapeHtml(amount)}</b></p>
<p><a href="${escapeHtml(link("OK"))}" style="display:inline-block;padding:10px 20px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none">پرداخت موفق</a>
<a href="${escapeHtml(link("NOK"))}" style="display:inline-block;padding:10px 20px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none">انصراف</a></p>
</body></html>`);
    })
  );
}
