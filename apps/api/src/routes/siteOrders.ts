// Site build orders. In catalog mode customers do not publish their sites themselves: they shape a
// template in the editor and order it; the team builds it. Each order keeps a copy of the design as
// it was when ordered and has a message thread between the customer and the admin.
//   /api/site-orders        — the signed-in customer's own orders (siteOrdersRouter)
//   /api/admin/site-orders  — every order, for the admin (adminSiteOrdersRouter)

import { randomInt } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { Prisma, type SiteOrderStatus } from "@prisma/client";
import { getTemplate } from "@rb/templates";
import { prisma } from "../db";
import { HttpError, asyncHandler, parseBody } from "../lib/http";
import { normalizeIranPhone, toLatinDigits } from "../lib/phone";
import { sendNoticeSms } from "../lib/sms";
import { requireAdmin } from "../middleware/admin";
import { currentUserId, requireAuth } from "../middleware/auth";

/** A line of an order's thread. "system" lines record status changes. */
export type ThreadLine = { from: "customer" | "admin" | "system"; text: string; at: string; status?: SiteOrderStatus };

const STATUSES = ["NEW", "REVIEWING", "BUILDING", "DELIVERED", "CANCELED"] as const;
/** Status names in the customer's SMS (the same words as the site shows). */
const STATUS_LABEL: Record<SiteOrderStatus, string> = { NEW: "ثبت شد", REVIEWING: "در حال بررسی", BUILDING: "در حال ساخت", DELIVERED: "تحویل شد", CANCELED: "لغو شد" };
/** Orders that are still being worked on; a customer may have only a few of these at once. */
const OPEN: SiteOrderStatus[] = ["NEW", "REVIEWING", "BUILDING"];
const MAX_OPEN_PER_USER = 5;
const MAX_LINES = 200;

const textBody = z.object({ text: z.string().trim().min(1, "پیام خالی است").max(2000) });

function thread(raw: unknown): ThreadLine[] {
  return Array.isArray(raw) ? (raw as ThreadLine[]) : [];
}

function append(raw: unknown, line: ThreadLine): Prisma.InputJsonValue {
  return [...thread(raw), line].slice(-MAX_LINES) as Prisma.InputJsonValue;
}

async function newCode(): Promise<string> {
  for (;;) {
    const code = `S${randomInt(100000, 999999)}`;
    if (!(await prisma.siteOrder.findUnique({ where: { code }, select: { id: true } }))) return code;
  }
}

/** Fields of a row for lists: no design copy and only the last line of the thread. */
function summary(o: { messages: unknown; design?: unknown } & Record<string, unknown>) {
  const { messages, design: _design, ...rest } = o;
  const lines = thread(messages);
  return { ...rest, lastLine: lines[lines.length - 1] ?? null, lines: lines.length };
}

/* ───────────── Customer ───────────── */

export const siteOrdersRouter = Router();
siteOrdersRouter.use(requireAuth);

const createBody = z.object({
  resumeId: z.string().min(1).max(40),
  name: z.string().trim().min(2, "نام را وارد کنید").max(80),
  phone: z.string().trim().min(1).max(20),
  business: z.string().trim().max(120).optional(),
  note: z.string().trim().max(2000).optional(),
});

/** POST /api/site-orders — orders the site shaped in the editor; returns the order with its tracking code. */
siteOrdersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const body = parseBody(createBody, req.body);
    const phone = normalizeIranPhone(body.phone);
    if (!phone) throw new HttpError(400, "INVALID_PHONE", "شماره‌ی موبایل درست نیست");

    const resume = await prisma.resume.findFirst({ where: { id: body.resumeId, userId } });
    if (!resume) throw new HttpError(404, "NOT_FOUND", "سایت پیدا نشد؛ اول آن را ذخیره کنید");
    const theme = resume.portfolioTheme as { templateId?: string } | null;
    if (!theme?.templateId) throw new HttpError(400, "NO_TEMPLATE", "اول یک قالب برای سایت انتخاب کنید");

    const open = await prisma.siteOrder.count({ where: { userId, status: { in: OPEN } } });
    if (open >= MAX_OPEN_PER_USER) throw new HttpError(429, "TOO_MANY_ORDERS", "چند سفارش باز دارید؛ تا رسیدگی به آن‌ها صبر کنید");

    const data = {
      userId,
      resumeId: resume.id,
      templateId: theme.templateId,
      title: resume.title,
      name: body.name,
      phone,
      business: body.business || null,
      note: body.note || null,
      design: { data: resume.data, theme: resume.portfolioTheme } as Prisma.InputJsonValue,
    };
    for (let i = 0; ; i++) {
      try {
        const order = await prisma.siteOrder.create({ data: { ...data, code: await newCode() } });
        // The customer's name stays on their account for the next order.
        await prisma.user.updateMany({ where: { id: userId, name: null }, data: { name: body.name } });
        return void res.status(201).json({ order: summary(order) });
      } catch (e) {
        if (i < 3 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
        throw e;
      }
    }
  }),
);

/** GET /api/site-orders — the customer's orders, newest first, with how many have news for them. */
siteOrdersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const orders = await prisma.siteOrder.findMany({
      where: { userId: currentUserId(req) },
      orderBy: { createdAt: "desc" },
      omit: { design: true },
      take: 100,
    });
    res.json({ orders: orders.map(summary), unread: orders.filter((o) => o.unreadByUser).length });
  }),
);

async function ownOrder(userId: string, id: string) {
  const order = await prisma.siteOrder.findFirst({ where: { id, userId }, omit: { design: true } });
  if (!order) throw new HttpError(404, "NOT_FOUND", "سفارش پیدا نشد");
  return order;
}

/** GET /api/site-orders/:id — one order with its whole thread; opening it marks the news as read. */
siteOrdersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await ownOrder(currentUserId(req), String(req.params.id));
    if (order.unreadByUser) await prisma.siteOrder.update({ where: { id: order.id }, data: { unreadByUser: false } });
    res.json({ order: { ...order, unreadByUser: false, messages: thread(order.messages) } });
  }),
);

/** POST /api/site-orders/:id/messages { text } — the customer writes in the order's thread. */
siteOrdersRouter.post(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const { text } = parseBody(textBody, req.body);
    const order = await ownOrder(currentUserId(req), String(req.params.id));
    const updated = await prisma.siteOrder.update({
      where: { id: order.id },
      data: { messages: append(order.messages, { from: "customer", text, at: new Date().toISOString() }), unreadByAdmin: true },
      omit: { design: true },
    });
    res.json({ order: { ...updated, messages: thread(updated.messages) } });
  }),
);

/* ───────────── Admin ───────────── */

export const adminSiteOrdersRouter = Router();
adminSiteOrdersRouter.use(requireAdmin);

const PAGE_SIZE = 20;

/** GET /api/admin/site-orders?status=&q=&page= — newest first; q matches the code, phone, name or business. */
adminSiteOrdersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const n = Number(req.query.page);
    const page = Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
    const status = STATUSES.find((s) => s === req.query.status);
    const q = toLatinDigits(String(req.query.q ?? "").trim()).slice(0, 50);
    const where: Prisma.SiteOrderWhereInput = {
      ...(status ? { status } : {}),
      ...(q
        ? { OR: [{ code: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { name: { contains: q, mode: "insensitive" } }, { business: { contains: q, mode: "insensitive" } }] }
        : {}),
    };
    const [orders, total, unread] = await Promise.all([
      prisma.siteOrder.findMany({
        where,
        orderBy: [{ unreadByAdmin: "desc" }, { createdAt: "desc" }],
        omit: { design: true },
        include: { user: { select: { phone: true } } },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.siteOrder.count({ where }),
      prisma.siteOrder.count({ where: { unreadByAdmin: true } }),
    ]);
    res.json({ items: orders.map(summary), page, pageSize: PAGE_SIZE, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), unread });
  }),
);

/** An order as the admin sees it: with the template's name and the thread as a list. */
function forAdmin<T extends { templateId: string; messages: unknown }>(order: T) {
  let templateName = order.templateId;
  try {
    templateName = getTemplate(order.templateId).name;
  } catch {
    /* a template that no longer exists keeps its id as the name */
  }
  return { ...order, messages: thread(order.messages), templateName };
}

async function anyOrder(id: string) {
  const order = await prisma.siteOrder.findUnique({ where: { id }, include: { user: { select: { phone: true, name: true } } } });
  if (!order) throw new HttpError(404, "NOT_FOUND", "سفارش پیدا نشد");
  return order;
}

/** GET /api/admin/site-orders/:id — the order with the design copy (to preview it) and the thread. */
adminSiteOrdersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await anyOrder(String(req.params.id));
    if (order.unreadByAdmin) await prisma.siteOrder.update({ where: { id: order.id }, data: { unreadByAdmin: false } });
    res.json({ order: forAdmin({ ...order, unreadByAdmin: false }) });
  }),
);

const patchBody = z.object({ status: z.enum(STATUSES) });

/** PATCH /api/admin/site-orders/:id { status } — moves the order on; the customer sees it in their thread. */
adminSiteOrdersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { status } = parseBody(patchBody, req.body);
    const order = await anyOrder(String(req.params.id));
    if (order.status === status) return void res.json({ order: forAdmin(order) });
    const updated = await prisma.siteOrder.update({
      where: { id: order.id },
      data: { status, unreadByUser: true, messages: append(order.messages, { from: "system", text: "", status, at: new Date().toISOString() }) },
      include: { user: { select: { phone: true, name: true } } },
    });
    void sendNoticeSms(order.phone, `site4site: وضعیت سفارش ${order.code} شد «${STATUS_LABEL[status]}». جزئیات در «سفارش‌های من».`);
    res.json({ order: forAdmin(updated) });
  }),
);

/** POST /api/admin/site-orders/:id/messages { text } — the admin writes to the customer. */
adminSiteOrdersRouter.post(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const { text } = parseBody(textBody, req.body);
    const order = await anyOrder(String(req.params.id));
    const updated = await prisma.siteOrder.update({
      where: { id: order.id },
      data: { messages: append(order.messages, { from: "admin", text, at: new Date().toISOString() }), unreadByUser: true },
      include: { user: { select: { phone: true, name: true } } },
    });
    void sendNoticeSms(order.phone, `site4site: پیام تازه برای سفارش ${order.code}. پاسخ را در «سفارش‌های من» ببینید.`);
    res.json({ order: forAdmin(updated) });
  }),
);
