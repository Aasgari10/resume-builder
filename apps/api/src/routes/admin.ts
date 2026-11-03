// Platform administration: sales overview, users, orders, template pricing and site moderation.
// Mounted at /api/admin behind requireAdmin.

import { Router } from "express";
import { z } from "zod";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../db";
import { env, siteUrl } from "../env";
import { HttpError, asyncHandler, parseBody } from "../lib/http";
import { toLatinDigits } from "../lib/phone";
import { getSettings, settingsSchema, startOfTehranDay, updateSettings } from "../lib/settings";
import { requireAdmin } from "../middleware/admin";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const PAGE_SIZE = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Page number from ?page=, 1-based and clamped. */
function pageOf(query: unknown): number {
  const n = Number(query);
  return Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
}

const paged = <T>(items: T[], total: number, page: number) => ({
  items,
  page,
  pageSize: PAGE_SIZE,
  total,
  pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
});

/* ───────────── Overview ───────────── */

/** GET /api/admin/stats — headline numbers for the overview tab. */
adminRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const now = Date.now();
    const since30 = new Date(now - 30 * DAY_MS);
    const since7 = new Date(now - 7 * DAY_MS);

    const [users, newUsers7d, resumes, publishedSites, revenue, revenue30d, pendingOrders, failedOrders30d] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since7 } } }),
      prisma.resume.count(),
      prisma.site.count({ where: { isPublished: true } }),
      prisma.order.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
      prisma.order.aggregate({ where: { status: "PAID", paidAt: { gte: since30 } }, _sum: { amount: true }, _count: true }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "FAILED", createdAt: { gte: since30 } } }),
    ]);

    res.json({
      stats: {
        users,
        newUsers7d,
        resumes,
        publishedSites,
        paidOrders: revenue._count,
        revenue: revenue._sum.amount ?? 0,
        paidOrders30d: revenue30d._count,
        revenue30d: revenue30d._sum.amount ?? 0,
        pendingOrders,
        failedOrders30d,
      },
    });
  })
);

/* ───────────── Users ───────────── */

/** GET /api/admin/users?q=&page= — newest first; q matches phone or name. */
adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const page = pageOf(req.query.page);
    const q = toLatinDigits(String(req.query.q ?? "").trim()).slice(0, 50);
    const where: Prisma.UserWhereInput = q
      ? { OR: [{ phone: { contains: q } }, { name: { contains: q, mode: "insensitive" } }] }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          phone: true,
          name: true,
          role: true,
          createdAt: true,
          _count: { select: { resumes: true, sites: true, purchases: true } },
        },
      }),
    ]);

    res.json(
      paged(
        users.map(({ _count, ...u }) => ({ ...u, resumes: _count.resumes, sites: _count.sites, purchases: _count.purchases })),
        total,
        page
      )
    );
  })
);

/* ───────────── Orders ───────────── */

const ORDER_STATUSES = ["PENDING", "PAID", "FAILED", "CANCELED"] as const satisfies readonly OrderStatus[];

/** GET /api/admin/orders?status=&page= — newest first, with buyer and bank reference. */
adminRouter.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const page = pageOf(req.query.page);
    const status = ORDER_STATUSES.find((s) => s === req.query.status);
    const where: Prisma.OrderWhereInput = status ? { status } : {};

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          user: { select: { phone: true } },
          template: { select: { name: true } },
          transactions: { orderBy: { createdAt: "desc" }, take: 1, select: { provider: true, refId: true } },
        },
      }),
    ]);

    res.json(
      paged(
        orders.map((o) => ({
          id: o.id,
          status: o.status,
          amount: o.amount,
          phone: o.user.phone,
          templateName: o.template?.name ?? null,
          provider: o.transactions[0]?.provider ?? null,
          refId: o.transactions[0]?.refId ?? null,
          createdAt: o.createdAt,
          paidAt: o.paidAt,
        })),
        total,
        page
      )
    );
  })
);

/* ───────────── Templates ───────────── */

/** GET /api/admin/templates — all templates, including inactive ones, with sales counts. */
adminRouter.get(
  "/templates",
  asyncHandler(async (_req, res) => {
    const templates = await prisma.template.findMany({
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
      include: { _count: { select: { purchases: true, sites: true } } },
    });
    res.json({
      templates: templates.map(({ _count, supports: _supports, ...t }) => ({ ...t, sales: _count.purchases, sites: _count.sites })),
    });
  })
);

const templatePatch = z
  .object({
    name: z.string().trim().min(1).max(50),
    price: z.number().int().min(0).max(1_000_000_000), // rials
    isPremium: z.boolean(),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0).max(1000),
  })
  .partial()
  .refine((p) => Object.keys(p).length > 0, "هیچ تغییری ارسال نشده است");

/** PATCH /api/admin/templates/:id — price and visibility. Pending orders keep the price they were created with. */
adminRouter.patch(
  "/templates/:id",
  asyncHandler(async (req, res) => {
    const patch = parseBody(templatePatch, req.body);
    const existing = await prisma.template.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) throw new HttpError(404, "NOT_FOUND", "قالب پیدا نشد");

    const isPremium = patch.isPremium ?? existing.isPremium;
    const price = patch.price ?? existing.price;
    if (isPremium && price <= 0) throw new HttpError(400, "INVALID_PRICE", "قالب پولی باید قیمت داشته باشد");

    const template = await prisma.template.update({ where: { id: existing.id }, data: patch });
    res.json({ template });
  })
);

/* ───────────── Sites ───────────── */

/** GET /api/admin/sites?q=&page= — q matches subdomain or owner phone. */
adminRouter.get(
  "/sites",
  asyncHandler(async (req, res) => {
    const page = pageOf(req.query.page);
    const q = toLatinDigits(String(req.query.q ?? "").trim().toLowerCase()).slice(0, 50);
    const where: Prisma.SiteWhereInput = q ? { OR: [{ subdomain: { contains: q } }, { user: { phone: { contains: q } } }] } : {};

    const [total, sites] = await Promise.all([
      prisma.site.count({ where }),
      prisma.site.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { user: { select: { phone: true } }, template: { select: { name: true } } },
      }),
    ]);

    res.json(
      paged(
        sites.map((s) => ({
          id: s.id,
          subdomain: s.subdomain,
          path: `/s/${s.subdomain}`,
          url: siteUrl(s.subdomain) ?? null,
          phone: s.user.phone,
          templateName: s.template.name,
          isPublished: s.isPublished,
          publishedAt: s.publishedAt,
        })),
        total,
        page
      )
    );
  })
);

/** POST /api/admin/sites/:id/unpublish — takes down a site (e.g. abusive content). The owner can publish again. */
adminRouter.post(
  "/sites/:id/unpublish",
  asyncHandler(async (req, res) => {
    const result = await prisma.site.updateMany({ where: { id: String(req.params.id) }, data: { isPublished: false } });
    if (result.count === 0) throw new HttpError(404, "NOT_FOUND", "سایت پیدا نشد");
    res.json({ ok: true });
  })
);

/* ───────────── AI assistant ───────────── */

/** GET /api/admin/ai — token usage today and over 30 days, top users, and the daily limit. */
adminRouter.get(
  "/ai",
  asyncHandler(async (_req, res) => {
    const today = startOfTehranDay();
    const since30 = new Date(Date.now() - 30 * DAY_MS);

    const [settings, todayUsage, monthUsage, todayUsers, top] = await Promise.all([
      getSettings(),
      prisma.aiUsage.aggregate({ where: { createdAt: { gte: today } }, _sum: { totalTokens: true }, _count: true }),
      prisma.aiUsage.aggregate({ where: { createdAt: { gte: since30 } }, _sum: { totalTokens: true }, _count: true }),
      prisma.aiUsage.groupBy({ by: ["userId"], where: { createdAt: { gte: today } } }),
      prisma.aiUsage.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: since30 } },
        _sum: { totalTokens: true },
        _count: { _all: true },
        orderBy: { _sum: { totalTokens: "desc" } },
        take: 10,
      }),
    ]);

    const phones = await prisma.user.findMany({ where: { id: { in: top.map((t) => t.userId) } }, select: { id: true, phone: true } });

    res.json({
      provider: env.ai.provider,
      model: env.ai.provider === "openai" ? env.ai.model : null,
      dailyTokenLimit: settings.aiDailyTokenLimit,
      today: { tokens: todayUsage._sum.totalTokens ?? 0, requests: todayUsage._count, users: todayUsers.length },
      last30: { tokens: monthUsage._sum.totalTokens ?? 0, requests: monthUsage._count },
      topUsers: top.map((t) => ({
        phone: phones.find((p) => p.id === t.userId)?.phone ?? "—",
        tokens: t._sum.totalTokens ?? 0,
        requests: t._count._all,
      })),
    });
  })
);

/** PATCH /api/admin/settings  { aiDailyTokenLimit? } */
adminRouter.patch(
  "/settings",
  asyncHandler(async (req, res) => {
    const patch = parseBody(settingsSchema.partial(), req.body);
    res.json({ settings: await updateSettings(patch) });
  })
);
