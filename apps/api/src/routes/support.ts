// Support tickets between signed-in customers and the site4site team, opened from the support page.
//   /api/support                 — whether new tickets are accepted, and the rules (public)
//   /api/support/tickets         — the signed-in customer's own tickets (supportRouter)
//   /api/admin/support/tickets   — every ticket, for the admin (adminSupportRouter)
// The admin can stop new tickets from the panel (setting "ticketsEnabled"); open tickets carry on.

import { randomInt } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { Prisma, type SupportTicketStatus } from "@prisma/client";
import { prisma } from "../db";
import { HttpError, asyncHandler, parseBody } from "../lib/http";
import { toLatinDigits } from "../lib/phone";
import { getSettings } from "../lib/settings";
import { sendNoticeSms } from "../lib/sms";
import { requireAdmin } from "../middleware/admin";
import { currentUserId, requireAuth } from "../middleware/auth";

/** A line of a ticket's conversation. */
export type TicketLine = { from: "customer" | "admin"; text: string; at: string };

/** Rules of sending a ticket; the support page shows the same numbers. */
export const TICKET_RULES = {
  /** Tickets a customer may have open (not closed) at once. */
  maxOpen: 3,
  /** Shortest and longest message. */
  minText: 10,
  maxText: 2000,
  /** Messages a ticket keeps. */
  maxLines: 100,
};

const TOPICS = ["ORDER", "TECHNICAL", "BILLING", "OTHER"] as const;
const STATUSES = ["OPEN", "ANSWERED", "CLOSED"] as const;
const OPEN: SupportTicketStatus[] = ["OPEN", "ANSWERED"];

const text = z
  .string()
  .trim()
  .min(TICKET_RULES.minText, `پیام دست‌کم ${TICKET_RULES.minText} حرف باشد`)
  .max(TICKET_RULES.maxText, "پیام خیلی بلند است");

function thread(raw: unknown): TicketLine[] {
  return Array.isArray(raw) ? (raw as TicketLine[]) : [];
}

function append(raw: unknown, line: TicketLine): Prisma.InputJsonValue {
  return [...thread(raw), line].slice(-TICKET_RULES.maxLines) as Prisma.InputJsonValue;
}

async function newCode(): Promise<string> {
  for (;;) {
    const code = `T${randomInt(100000, 999999)}`;
    if (!(await prisma.supportTicket.findUnique({ where: { code }, select: { id: true } }))) return code;
  }
}

/** Fields of a row for lists: only the last line of the conversation. */
function summary(t: { messages: unknown } & Record<string, unknown>) {
  const { messages, ...rest } = t;
  const lines = thread(messages);
  return { ...rest, lastLine: lines[lines.length - 1] ?? null, lines: lines.length };
}

const full = <T extends { messages: unknown }>(t: T) => ({ ...t, messages: thread(t.messages) });

/* ───────────── Public ───────────── */

export const supportInfoRouter = Router();

/** GET /api/support — whether new tickets are accepted, and the rules. */
supportInfoRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { ticketsEnabled } = await getSettings();
    res.json({ ticketsEnabled, rules: { maxOpen: TICKET_RULES.maxOpen, minText: TICKET_RULES.minText, maxText: TICKET_RULES.maxText } });
  }),
);

/* ───────────── Customer ───────────── */

export const supportRouter = Router();
supportRouter.use(requireAuth);

const createBody = z.object({
  topic: z.enum(TOPICS),
  subject: z.string().trim().min(3, "موضوع را بنویسید").max(120),
  orderCode: z.string().trim().max(20).optional(),
  text,
});

/** GET /api/support/tickets — the customer's tickets, latest activity first. */
supportRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const tickets = await prisma.supportTicket.findMany({ where: { userId: currentUserId(req) }, orderBy: { updatedAt: "desc" }, take: 100 });
    res.json({ tickets: tickets.map(summary), unread: tickets.filter((t) => t.unreadByUser).length });
  }),
);

/** POST /api/support/tickets — opens a ticket, when tickets are accepted and the customer has room for one. */
supportRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const body = parseBody(createBody, req.body);
    if (!(await getSettings()).ticketsEnabled) throw new HttpError(403, "TICKETS_OFF", "ارسال تیکت تازه فعلاً بسته است؛ از «سفارش‌های من» پیام بفرستید");
    const open = await prisma.supportTicket.count({ where: { userId, status: { in: OPEN } } });
    if (open >= TICKET_RULES.maxOpen) throw new HttpError(429, "TOO_MANY_TICKETS", `${TICKET_RULES.maxOpen.toLocaleString("fa-IR")} تیکت باز دارید؛ تا پاسخ آن‌ها صبر کنید یا یکی را ببندید`);

    // An order code must be one of the customer's own orders.
    let orderCode: string | null = null;
    if (body.orderCode) {
      const code = toLatinDigits(body.orderCode).toUpperCase();
      const order = await prisma.siteOrder.findFirst({ where: { userId, code }, select: { code: true } });
      if (!order) throw new HttpError(400, "NO_ORDER", "سفارشی با این کد در حساب شما نیست");
      orderCode = order.code;
    }

    const data = {
      userId,
      topic: body.topic,
      subject: body.subject,
      orderCode,
      messages: [{ from: "customer", text: body.text, at: new Date().toISOString() }] as Prisma.InputJsonValue,
    };
    for (let i = 0; ; i++) {
      try {
        const ticket = await prisma.supportTicket.create({ data: { ...data, code: await newCode() } });
        return void res.status(201).json({ ticket: full(ticket) });
      } catch (e) {
        if (i < 3 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
        throw e;
      }
    }
  }),
);

async function ownTicket(userId: string, id: string) {
  const ticket = await prisma.supportTicket.findFirst({ where: { id, userId } });
  if (!ticket) throw new HttpError(404, "NOT_FOUND", "تیکت پیدا نشد");
  return ticket;
}

/** GET /api/support/tickets/:id — one ticket with its conversation; opening it marks the answer as read. */
supportRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const ticket = await ownTicket(currentUserId(req), String(req.params.id));
    if (ticket.unreadByUser) await prisma.supportTicket.update({ where: { id: ticket.id }, data: { unreadByUser: false } });
    res.json({ ticket: full({ ...ticket, unreadByUser: false }) });
  }),
);

/** POST /api/support/tickets/:id/messages { text } — the customer writes; a closed ticket takes no more. */
supportRouter.post(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const body = parseBody(z.object({ text }), req.body);
    const ticket = await ownTicket(currentUserId(req), String(req.params.id));
    if (ticket.status === "CLOSED") throw new HttpError(409, "CLOSED", "این تیکت بسته شده است؛ برای موضوع تازه تیکت تازه بفرستید");
    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { messages: append(ticket.messages, { from: "customer", text: body.text, at: new Date().toISOString() }), status: "OPEN", unreadByAdmin: true },
    });
    res.json({ ticket: full(updated) });
  }),
);

/** POST /api/support/tickets/:id/close — the customer closes their ticket (the problem is solved). */
supportRouter.post(
  "/:id/close",
  asyncHandler(async (req, res) => {
    const ticket = await ownTicket(currentUserId(req), String(req.params.id));
    const updated = ticket.status === "CLOSED" ? ticket : await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: "CLOSED" } });
    res.json({ ticket: full(updated) });
  }),
);

/* ───────────── Admin ───────────── */

export const adminSupportRouter = Router();
adminSupportRouter.use(requireAdmin);

const PAGE_SIZE = 20;

/** GET /api/admin/support/tickets?status=&q=&page= — unread first, then latest activity; q matches code, subject or phone. */
adminSupportRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const n = Number(req.query.page);
    const page = Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
    const status = STATUSES.find((s) => s === req.query.status);
    const q = toLatinDigits(String(req.query.q ?? "").trim()).slice(0, 50);
    const where: Prisma.SupportTicketWhereInput = {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
              { orderCode: { contains: q, mode: "insensitive" } },
              { user: { phone: { contains: q } } },
            ],
          }
        : {}),
    };
    const [tickets, total, unread, settings] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: [{ unreadByAdmin: "desc" }, { updatedAt: "desc" }],
        include: { user: { select: { phone: true, name: true } } },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.count({ where: { unreadByAdmin: true } }),
      getSettings(),
    ]);
    res.json({
      items: tickets.map(summary),
      page,
      pageSize: PAGE_SIZE,
      total,
      pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      unread,
      ticketsEnabled: settings.ticketsEnabled,
    });
  }),
);

async function anyTicket(id: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id }, include: { user: { select: { phone: true, name: true } } } });
  if (!ticket) throw new HttpError(404, "NOT_FOUND", "تیکت پیدا نشد");
  return ticket;
}

/** GET /api/admin/support/tickets/:id — the ticket and its conversation; opening it marks it read. */
adminSupportRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const ticket = await anyTicket(String(req.params.id));
    if (ticket.unreadByAdmin) await prisma.supportTicket.update({ where: { id: ticket.id }, data: { unreadByAdmin: false } });
    res.json({ ticket: full({ ...ticket, unreadByAdmin: false }) });
  }),
);

/** POST /api/admin/support/tickets/:id/messages { text } — the team answers; the customer gets an SMS. */
adminSupportRouter.post(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const body = parseBody(z.object({ text: z.string().trim().min(1, "پیام خالی است").max(TICKET_RULES.maxText) }), req.body);
    const ticket = await anyTicket(String(req.params.id));
    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { messages: append(ticket.messages, { from: "admin", text: body.text, at: new Date().toISOString() }), status: "ANSWERED", unreadByUser: true },
      include: { user: { select: { phone: true, name: true } } },
    });
    void sendNoticeSms(ticket.user.phone, `site4site: پاسخ تیکت ${ticket.code} رسید. آن را در صفحه‌ی پشتیبانی ببینید.`);
    res.json({ ticket: full(updated) });
  }),
);

/** PATCH /api/admin/support/tickets/:id { status } — closes or reopens a ticket. */
adminSupportRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { status } = parseBody(z.object({ status: z.enum(STATUSES) }), req.body);
    const ticket = await anyTicket(String(req.params.id));
    const updated = await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status }, include: { user: { select: { phone: true, name: true } } } });
    res.json({ ticket: full(updated) });
  }),
);
