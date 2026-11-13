// The owner's side of a shop: orders, the overview numbers, customer accounts, product comments and
// support tickets. Mounted inside the site router (/api/resumes/:resumeId/site/...), after sign-in.

import { Router, type Request } from "express";
import { z } from "zod";
import type { Prisma, ShopOrder } from "@prisma/client";
import { SHOP_ORDER_STATUSES } from "@rb/schema";
import { prisma } from "../db";
import { HttpError, asyncHandler, parseBody } from "../lib/http";
import { adjustShop, type StockItem } from "../lib/shopData";
import { currentUserId } from "../middleware/auth";

export const shopAdminRouter = Router({ mergeParams: true });

/** The signed-in owner's site, or null when the resume has no site yet. */
async function ownSite(req: Request) {
  const resume = await prisma.resume.findFirst({ where: { id: req.params.resumeId!, userId: currentUserId(req) }, select: { site: { select: { id: true } } } });
  if (!resume) throw new HttpError(404, "NOT_FOUND", "رزومه پیدا نشد");
  return resume.site;
}
async function siteOf(req: Request) {
  const site = await ownSite(req);
  if (!site) throw new HttpError(404, "NOT_FOUND", "این سایت هنوز منتشر نشده است");
  return site;
}

const ids = z.array(z.string().max(40)).min(1).max(500);

/** Rows that are not in the trash. */
const live = { deletedAt: null };
/** Days a deleted row stays in the trash before it is removed for good. */
export const TRASH_DAYS = 30;

/** Removes for good what has been in this shop's trash longer than TRASH_DAYS. */
async function emptyOldTrash(siteId: string) {
  const where = { siteId, deletedAt: { lt: new Date(Date.now() - TRASH_DAYS * 86400000) } };
  await prisma.shopOrder.deleteMany({ where });
  await prisma.shopReview.deleteMany({ where });
  await prisma.shopTicket.deleteMany({ where });
  await prisma.shopCustomer.deleteMany({ where });
}

/* ───────────── Overview ───────────── */

/** GET …/site/shop-summary — the numbers on the overview tab and the "new" marks on the tabs. */
shopAdminRouter.get(
  "/shop-summary",
  asyncHandler(async (req, res) => {
    const site = await ownSite(req);
    if (!site) return void res.json({ summary: null });
    void emptyOldTrash(site.id).catch(() => undefined);
    const where = { siteId: site.id, ...live };
    const since = new Date(Date.now() - 30 * 86400000);
    const [customers, orders, newOrders, openTickets, waitingReviews, sold, soldMonth, recent] = await Promise.all([
      prisma.shopCustomer.count({ where }),
      prisma.shopOrder.count({ where }),
      prisma.shopOrder.count({ where: { ...where, status: "NEW" } }),
      prisma.shopTicket.count({ where: { ...where, status: "OPEN" } }),
      prisma.shopReview.count({ where: { ...where, approved: false } }),
      prisma.shopOrder.aggregate({ where: { ...where, status: { not: "CANCELED" } }, _sum: { total: true } }),
      prisma.shopOrder.aggregate({ where: { ...where, status: { not: "CANCELED" }, createdAt: { gte: since } }, _sum: { total: true }, _count: true }),
      prisma.shopOrder.findMany({ where, orderBy: { createdAt: "desc" }, take: 8 }),
    ]);
    // Bookings, messages and sign-ups: a site with some of its own shows its real activity, not the sample.
    const messages = await prisma.siteMessage.count({ where: { siteId: site.id, deletedAt: null } });
    res.json({
      summary: {
        customers,
        orders,
        newOrders,
        openTickets,
        waitingReviews,
        sales: sold._sum.total ?? 0,
        monthSales: soldMonth._sum.total ?? 0,
        monthOrders: soldMonth._count,
        messages,
        recent,
      },
    });
  })
);

/** GET …/site/product-stats — units sold and revenue (cancelled orders left out) and comment ratings, per product. */
shopAdminRouter.get(
  "/product-stats",
  asyncHandler(async (req, res) => {
    const site = await ownSite(req);
    if (!site) return void res.json({ stats: {} });
    const [orders, ratings] = await Promise.all([
      prisma.shopOrder.findMany({ where: { siteId: site.id, ...live, status: { not: "CANCELED" } }, select: { items: true }, orderBy: { createdAt: "desc" }, take: 20000 }),
      prisma.shopReview.groupBy({ by: ["productId"], where: { siteId: site.id, ...live, approved: true }, _avg: { rating: true }, _count: true }),
    ]);
    const stats: Record<string, { sold: number; revenue: number; rating?: number; reviews?: number }> = {};
    for (const o of orders) {
      for (const it of (o.items as { id: string; qty: number; total: number }[]) ?? []) {
        const s = (stats[it.id] ??= { sold: 0, revenue: 0 });
        s.sold += it.qty;
        s.revenue += it.total;
      }
    }
    for (const r of ratings) {
      const s = (stats[r.productId] ??= { sold: 0, revenue: 0 });
      s.rating = Math.round((r._avg.rating ?? 0) * 10) / 10;
      s.reviews = r._count;
    }
    res.json({ stats });
  })
);

/* ───────────── Orders ───────────── */

const orderQuery = z.object({
  status: z.enum(SHOP_ORDER_STATUSES).optional(),
  q: z.string().trim().max(60).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  take: z.coerce.number().int().min(1).max(5000).default(300),
  skip: z.coerce.number().int().min(0).default(0),
});

/** GET …/site/orders?status&q&from&to&take&skip — orders, newest first, with the total count. */
shopAdminRouter.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const site = await ownSite(req);
    if (!site) return void res.json({ orders: [], total: 0 });
    const query = orderQuery.safeParse(req.query);
    if (!query.success) throw new HttpError(400, "BAD_QUERY", "جست‌وجو نامعتبر است");
    const { status, q, from, to, take, skip } = query.data;
    const where: Prisma.ShopOrderWhereInput = {
      siteId: site.id,
      ...live,
      status,
      createdAt: from || to ? { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } : undefined,
      OR: q ? [{ code: { contains: q } }, { customerName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { city: { contains: q } }] : undefined,
    };
    const [orders, total] = await Promise.all([prisma.shopOrder.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }), prisma.shopOrder.count({ where })]);
    res.json({ orders, total });
  })
);

/**
 * Moves an order to a new status. Cancelling gives the goods (and the discount-code use) back;
 * un-cancelling takes them again. Moving a live order to the trash ("DELETE") also gives them back,
 * and taking it out of the trash ("RESTORE") takes them again.
 */
async function setOrderStatus(order: ShopOrder, status: ShopOrder["status"] | "DELETE" | "RESTORE") {
  const was = order.status === "CANCELED";
  const sign =
    status === "DELETE" ? (was ? 0 : 1) : status === "RESTORE" ? (was ? 0 : -1) : status === "CANCELED" ? (was ? 0 : 1) : was ? -1 : 0;
  return prisma.$transaction(async (tx) => {
    if (sign) {
      await tx.$queryRaw`SELECT id FROM "Site" WHERE id = ${order.siteId} FOR UPDATE`;
      const site = await tx.site.findUniqueOrThrow({ where: { id: order.siteId }, include: { resume: { select: { id: true, data: true } } } });
      const items = (order.items as StockItem[]) ?? [];
      const published = adjustShop(site.publishedData, items, sign, order.couponCode, -sign);
      if (published.short) throw new HttpError(409, "OUT_OF_STOCK", `موجودی «${published.short}» برای برگرداندن سفارش ${order.code} کافی نیست`);
      const draft = adjustShop(site.resume.data, items, sign, order.couponCode, -sign);
      await tx.site.update({ where: { id: site.id }, data: { publishedData: published.data as Prisma.InputJsonValue } });
      await tx.resume.update({ where: { id: site.resume.id }, data: { data: draft.data as Prisma.InputJsonValue } });
    }
    if (status === "DELETE" || status === "RESTORE") return tx.shopOrder.update({ where: { id: order.id }, data: { deletedAt: status === "DELETE" ? new Date() : null } });
    return tx.shopOrder.update({ where: { id: order.id }, data: { status } });
  });
}

const orderStatusBody = z.object({ status: z.enum(SHOP_ORDER_STATUSES) });

/** PATCH …/site/orders/:orderId — the owner moves an order along (confirmed, sent…). */
shopAdminRouter.patch(
  "/orders/:orderId",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const { status } = parseBody(orderStatusBody, req.body);
    const order = await prisma.shopOrder.findFirst({ where: { id: req.params.orderId!, siteId: site.id, ...live } });
    if (!order) throw new HttpError(404, "NOT_FOUND", "سفارش پیدا نشد");
    res.json({ order: await setOrderStatus(order, status) });
  })
);

/** DELETE …/site/orders/:orderId — moves an order to the trash (its goods go back to stock). */
shopAdminRouter.delete(
  "/orders/:orderId",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const order = await prisma.shopOrder.findFirst({ where: { id: req.params.orderId!, siteId: site.id, ...live } });
    if (order) await setOrderStatus(order, "DELETE");
    res.json({ ok: true });
  })
);

const orderBatchBody = z.object({ ids, status: z.enum([...SHOP_ORDER_STATUSES, "DELETE"]) });

/** POST …/site/orders/batch { ids, status } — the same change for many orders; reports the ones that failed. */
shopAdminRouter.post(
  "/orders/batch",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const body = parseBody(orderBatchBody, req.body);
    const orders = await prisma.shopOrder.findMany({ where: { id: { in: body.ids }, siteId: site.id, ...live } });
    const failed: string[] = [];
    for (const order of orders) {
      if (order.status === body.status) continue;
      try {
        await setOrderStatus(order, body.status);
      } catch (e) {
        failed.push(e instanceof HttpError ? e.message : order.code);
      }
    }
    res.json({ done: orders.length - failed.length, failed });
  })
);

/* ───────────── Customers ───────────── */

/** GET …/site/customers — the shop's customer accounts with their order count and spending. */
shopAdminRouter.get(
  "/customers",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const [customers, spent] = await Promise.all([
      prisma.shopCustomer.findMany({ where: { siteId: site.id, ...live }, orderBy: { createdAt: "desc" }, take: 2000, select: { id: true, name: true, phone: true, createdAt: true, _count: { select: { orders: { where: live } } } } }),
      prisma.shopOrder.groupBy({ by: ["customerId"], where: { siteId: site.id, ...live, customerId: { not: null }, status: { not: "CANCELED" } }, _sum: { total: true }, _max: { createdAt: true } }),
    ]);
    const byId = new Map(spent.map((s) => [s.customerId, s]));
    res.json({
      customers: customers.map(({ _count, ...c }) => ({ ...c, orders: _count.orders, spent: byId.get(c.id)?._sum.total ?? 0, lastOrderAt: byId.get(c.id)?._max.createdAt ?? null })),
    });
  })
);

/** GET …/site/customers/:id — one customer with addresses, orders, comments and tickets. */
shopAdminRouter.get(
  "/customers/:id",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const customer = await prisma.shopCustomer.findFirst({
      where: { id: req.params.id!, siteId: site.id, ...live },
      select: {
        id: true,
        name: true,
        phone: true,
        addresses: true,
        createdAt: true,
        orders: { where: live, orderBy: { createdAt: "desc" }, take: 100 },
        reviews: { where: live, orderBy: { createdAt: "desc" }, take: 50 },
        tickets: { where: live, orderBy: { updatedAt: "desc" }, take: 50, select: { id: true, subject: true, status: true, updatedAt: true } },
      },
    });
    if (!customer) throw new HttpError(404, "NOT_FOUND", "مشتری پیدا نشد");
    res.json({ customer });
  })
);

/**
 * DELETE …/site/customers/:id — moves the account to the trash with its comments and tickets (same
 * time stamp, so restoring the account brings them back too); its orders stay.
 */
shopAdminRouter.delete(
  "/customers/:id",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const customer = await prisma.shopCustomer.findFirst({ where: { id: req.params.id!, siteId: site.id, ...live }, select: { id: true } });
    if (customer) {
      const at = new Date();
      const mine = { siteId: site.id, customerId: customer.id, ...live };
      await prisma.$transaction([
        prisma.shopReview.updateMany({ where: mine, data: { deletedAt: at } }),
        prisma.shopTicket.updateMany({ where: mine, data: { deletedAt: at } }),
        prisma.shopCustomer.update({ where: { id: customer.id }, data: { deletedAt: at } }),
      ]);
    }
    res.json({ ok: true });
  })
);

/* ───────────── Comments ───────────── */

/** GET …/site/reviews — comments on products, newest first (waiting ones included). */
shopAdminRouter.get(
  "/reviews",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const reviews = await prisma.shopReview.findMany({ where: { siteId: site.id, ...live }, orderBy: { createdAt: "desc" }, take: 1000, include: { customer: { select: { name: true, phone: true } } } });
    res.json({ reviews });
  })
);

const reviewBody = z.object({
  approved: z.boolean().optional(),
  reply: z.string().trim().max(1000).nullable().optional(),
  text: z.string().trim().min(1).max(1000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

/** PATCH …/site/reviews/:id — approve, hide, edit or answer a comment. */
shopAdminRouter.patch(
  "/reviews/:id",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const body = parseBody(reviewBody, req.body);
    const found = await prisma.shopReview.findFirst({ where: { id: req.params.id!, siteId: site.id, ...live } });
    if (!found) throw new HttpError(404, "NOT_FOUND", "نظر پیدا نشد");
    const review = await prisma.shopReview.update({
      where: { id: found.id },
      data: { approved: body.approved, text: body.text, rating: body.rating, reply: body.reply === undefined ? undefined : body.reply || null },
    });
    res.json({ review });
  })
);

/** DELETE …/site/reviews/:id — moves a comment to the trash. */
shopAdminRouter.delete(
  "/reviews/:id",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    await prisma.shopReview.updateMany({ where: { id: req.params.id!, siteId: site.id, ...live }, data: { deletedAt: new Date() } });
    res.json({ ok: true });
  })
);

const reviewBatchBody = z.object({ ids, action: z.enum(["approve", "hide", "delete"]) });

/** POST …/site/reviews/batch { ids, action } */
shopAdminRouter.post(
  "/reviews/batch",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const { ids: list, action } = parseBody(reviewBatchBody, req.body);
    const where = { id: { in: list }, siteId: site.id, ...live };
    const done = await prisma.shopReview.updateMany({ where, data: action === "delete" ? { deletedAt: new Date() } : { approved: action === "approve" } });
    res.json({ done: done.count });
  })
);

/* ───────────── Support tickets ───────────── */

/** GET …/site/tickets — support conversations. */
shopAdminRouter.get(
  "/tickets",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const tickets = await prisma.shopTicket.findMany({ where: { siteId: site.id, ...live }, orderBy: { updatedAt: "desc" }, take: 1000, include: { customer: { select: { name: true, phone: true } } } });
    res.json({ tickets });
  })
);

const ticketBody = z.object({ text: z.string().trim().min(1).max(2000).optional(), status: z.enum(["OPEN", "ANSWERED", "CLOSED"]).optional() });

/** PATCH …/site/tickets/:id — answer a ticket and/or change its status. */
shopAdminRouter.patch(
  "/tickets/:id",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const body = parseBody(ticketBody, req.body);
    const ticket = await prisma.shopTicket.findFirst({ where: { id: req.params.id!, siteId: site.id, ...live } });
    if (!ticket) throw new HttpError(404, "NOT_FOUND", "تیکت پیدا نشد");
    const messages = body.text ? [...((ticket.messages as unknown[]) ?? []), { from: "shop", text: body.text, at: new Date().toISOString() }].slice(-100) : undefined;
    const status = body.status ?? (body.text ? "ANSWERED" : undefined);
    res.json({ ticket: await prisma.shopTicket.update({ where: { id: ticket.id }, data: { messages: messages as Prisma.InputJsonValue | undefined, status } }) });
  })
);

/** DELETE …/site/tickets/:id — moves a ticket to the trash. */
shopAdminRouter.delete(
  "/tickets/:id",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    await prisma.shopTicket.updateMany({ where: { id: req.params.id!, siteId: site.id, ...live }, data: { deletedAt: new Date() } });
    res.json({ ok: true });
  })
);

const ticketBatchBody = z.object({ ids, action: z.enum(["close", "delete"]) });

/** POST …/site/tickets/batch { ids, action } */
shopAdminRouter.post(
  "/tickets/batch",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const { ids: list, action } = parseBody(ticketBatchBody, req.body);
    const where = { id: { in: list }, siteId: site.id, ...live };
    const done = await prisma.shopTicket.updateMany({ where, data: action === "delete" ? { deletedAt: new Date() } : { status: "CLOSED" } });
    res.json({ done: done.count });
  })
);

/* ───────────── Trash ───────────── */

const trashed = { deletedAt: { not: null } };

/**
 * GET …/site/trash — deleted orders, customers, comments and tickets (newest first). Comments and
 * tickets of a deleted customer are listed with the customer, not on their own.
 */
shopAdminRouter.get(
  "/trash",
  asyncHandler(async (req, res) => {
    const site = await ownSite(req);
    if (!site) return void res.json({ orders: [], customers: [], reviews: [], tickets: [], days: TRASH_DAYS });
    await emptyOldTrash(site.id);
    const where = { siteId: site.id, ...trashed };
    const ofLive = { ...where, customer: live };
    const [orders, customers, reviews, tickets] = await Promise.all([
      prisma.shopOrder.findMany({ where, orderBy: { deletedAt: "desc" }, take: 500 }),
      prisma.shopCustomer.findMany({ where, orderBy: { deletedAt: "desc" }, take: 500, select: { id: true, name: true, phone: true, createdAt: true, deletedAt: true, _count: { select: { reviews: true, tickets: true } } } }),
      prisma.shopReview.findMany({ where: ofLive, orderBy: { deletedAt: "desc" }, take: 500, include: { customer: { select: { name: true, phone: true } } } }),
      prisma.shopTicket.findMany({ where: ofLive, orderBy: { deletedAt: "desc" }, take: 500, include: { customer: { select: { name: true, phone: true } } } }),
    ]);
    res.json({ orders, customers: customers.map(({ _count, ...c }) => ({ ...c, reviews: _count.reviews, tickets: _count.tickets })), reviews, tickets, days: TRASH_DAYS });
  })
);

const trashBody = z.object({ kind: z.enum(["orders", "customers", "reviews", "tickets"]), ids });

/** POST …/site/trash/restore { kind, ids } — takes rows out of the trash; reports the ones that could not come back. */
shopAdminRouter.post(
  "/trash/restore",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const { kind, ids: list } = parseBody(trashBody, req.body);
    const where = { id: { in: list }, siteId: site.id, ...trashed };
    const failed: string[] = [];
    let done = 0;
    if (kind === "orders") {
      for (const order of await prisma.shopOrder.findMany({ where })) {
        try {
          await setOrderStatus(order, "RESTORE");
          done++;
        } catch (e) {
          failed.push(e instanceof HttpError ? e.message : order.code);
        }
      }
    } else if (kind === "customers") {
      for (const c of await prisma.shopCustomer.findMany({ where, select: { id: true, deletedAt: true } })) {
        // The comments and tickets that went to the trash with the account come back with it.
        const mine = { siteId: site.id, customerId: c.id, deletedAt: c.deletedAt };
        await prisma.$transaction([
          prisma.shopReview.updateMany({ where: mine, data: { deletedAt: null } }),
          prisma.shopTicket.updateMany({ where: mine, data: { deletedAt: null } }),
          prisma.shopCustomer.update({ where: { id: c.id }, data: { deletedAt: null } }),
        ]);
        done++;
      }
    } else {
      const ofLive = { ...where, customer: live };
      const r = kind === "reviews" ? await prisma.shopReview.updateMany({ where: ofLive, data: { deletedAt: null } }) : await prisma.shopTicket.updateMany({ where: ofLive, data: { deletedAt: null } });
      done = r.count;
    }
    res.json({ done, failed });
  })
);

/** POST …/site/trash/purge { kind, ids } — removes rows of the trash for good (a customer with its comments and tickets). */
shopAdminRouter.post(
  "/trash/purge",
  asyncHandler(async (req, res) => {
    const site = await siteOf(req);
    const { kind, ids: list } = parseBody(trashBody, req.body);
    const where = { id: { in: list }, siteId: site.id, ...trashed };
    const r =
      kind === "orders"
        ? await prisma.shopOrder.deleteMany({ where })
        : kind === "customers"
          ? await prisma.shopCustomer.deleteMany({ where })
          : kind === "reviews"
            ? await prisma.shopReview.deleteMany({ where })
            : await prisma.shopTicket.deleteMany({ where });
    res.json({ done: r.count });
  })
);
