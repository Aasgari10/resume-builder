// Comments on site templates (the templates page). Anyone can read them; signed-in users write and like or
// dislike; only an admin answers or removes a comment.
//   /api/template-comments                       — counts per template, one template's comments, writing, votes
//   /api/admin/template-comments                 — every comment for the admin, unanswered first; answer, remove

import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { SITE_TEMPLATES } from "@rb/templates";
import { prisma } from "../db";
import { HttpError, asyncHandler, parseBody } from "../lib/http";
import { requireAdmin } from "../middleware/admin";
import { currentUserId, requireAuth } from "../middleware/auth";

/** Comments one user may write on one template in a day. */
const DAILY_PER_TEMPLATE = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 20;

const live = { deletedAt: null } satisfies Prisma.TemplateCommentWhereInput;

function siteTemplate(id: string) {
  if (!SITE_TEMPLATES.some((t) => t.id === id)) throw new HttpError(404, "NOT_FOUND", "قالب پیدا نشد");
  return id;
}

/** The name shown on a comment: the writer's first name, never their phone. */
const author = (name: string | null) => name?.trim().split(/\s+/)[0] || "کاربر site4site";

type Row = Prisma.TemplateCommentGetPayload<{ include: { user: { select: { name: true } } } }>;

/** A comment as visitors see it, with the reader's own vote. */
function shown(c: Row, myVote = 0) {
  return {
    id: c.id,
    templateId: c.templateId,
    text: c.text,
    author: author(c.user.name),
    createdAt: c.createdAt,
    reply: c.reply,
    repliedAt: c.repliedAt,
    likes: c.likes,
    dislikes: c.dislikes,
    myVote,
  };
}

export const templateCommentsRouter = Router();

/** GET /api/template-comments/counts — { [templateId]: number of comments }. */
templateCommentsRouter.get(
  "/counts",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.templateComment.groupBy({ by: ["templateId"], where: live, _count: { _all: true } });
    res.json({ counts: Object.fromEntries(rows.map((r) => [r.templateId, r._count._all])) });
  }),
);

/** GET /api/template-comments/:templateId — newest first, with the reader's votes when signed in. */
templateCommentsRouter.get(
  "/:templateId",
  asyncHandler(async (req, res) => {
    const templateId = siteTemplate(String(req.params.templateId));
    const comments = await prisma.templateComment.findMany({
      where: { templateId, ...live },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { name: true } } },
    });
    const votes = req.userId
      ? await prisma.templateCommentVote.findMany({ where: { userId: req.userId, commentId: { in: comments.map((c) => c.id) } } })
      : [];
    const mine = new Map(votes.map((v) => [v.commentId, v.value]));
    res.json({ comments: comments.map((c) => shown(c, mine.get(c.id) ?? 0)) });
  }),
);

/** POST /api/template-comments/:templateId { text } — a signed-in user writes a comment. */
templateCommentsRouter.post(
  "/:templateId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const templateId = siteTemplate(String(req.params.templateId));
    const { text } = parseBody(z.object({ text: z.string().trim().min(3, "نظرتان را بنویسید").max(1000, "نظر خیلی بلند است") }), req.body);
    const userId = currentUserId(req);
    const today = await prisma.templateComment.count({ where: { templateId, userId, createdAt: { gte: new Date(Date.now() - DAY_MS) } } });
    if (today >= DAILY_PER_TEMPLATE) throw new HttpError(429, "TOO_MANY_COMMENTS", "امروز برای این قالب به اندازه‌ی کافی نظر داده‌اید؛ فردا دوباره سر بزنید");
    const comment = await prisma.templateComment.create({ data: { templateId, userId, text }, include: { user: { select: { name: true } } } });
    res.status(201).json({ comment: shown(comment) });
  }),
);

/** POST /api/template-comments/c/:id/vote { value: 1 | -1 | 0 } — like, dislike, or take the vote back. */
templateCommentsRouter.post(
  "/c/:id/vote",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { value } = parseBody(z.object({ value: z.union([z.literal(1), z.literal(-1), z.literal(0)]) }), req.body);
    const userId = currentUserId(req);
    const commentId = String(req.params.id);
    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.templateComment.findFirst({ where: { id: commentId, ...live } });
      if (!c) throw new HttpError(404, "NOT_FOUND", "نظر پیدا نشد");
      const before = (await tx.templateCommentVote.findUnique({ where: { commentId_userId: { commentId, userId } } }))?.value ?? 0;
      if (before === value) return tx.templateComment.findUniqueOrThrow({ where: { id: commentId }, include: { user: { select: { name: true } } } });
      if (value === 0) await tx.templateCommentVote.delete({ where: { commentId_userId: { commentId, userId } } });
      else await tx.templateCommentVote.upsert({ where: { commentId_userId: { commentId, userId } }, update: { value }, create: { commentId, userId, value } });
      const likes = (value === 1 ? 1 : 0) - (before === 1 ? 1 : 0);
      const dislikes = (value === -1 ? 1 : 0) - (before === -1 ? 1 : 0);
      return tx.templateComment.update({
        where: { id: commentId },
        data: { likes: { increment: likes }, dislikes: { increment: dislikes } },
        include: { user: { select: { name: true } } },
      });
    });
    res.json({ comment: shown(comment, value) });
  }),
);

/* ───────────── Admin ───────────── */

export const adminTemplateCommentsRouter = Router();
adminTemplateCommentsRouter.use(requireAdmin);

/** GET /api/admin/template-comments?unanswered=1&page= — unanswered first, then newest. */
adminTemplateCommentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const n = Number(req.query.page);
    const page = Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
    const where: Prisma.TemplateCommentWhereInput = { ...live, ...(req.query.unanswered ? { reply: null } : {}) };
    const [rows, total, unanswered] = await Promise.all([
      prisma.templateComment.findMany({
        where,
        orderBy: [{ repliedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
        include: { user: { select: { name: true, phone: true } } },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.templateComment.count({ where }),
      prisma.templateComment.count({ where: { ...live, reply: null } }),
    ]);
    res.json({
      items: rows.map((c) => ({ ...shown(c), phone: c.user.phone })),
      page,
      pageSize: PAGE_SIZE,
      total,
      pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      unanswered,
    });
  }),
);

/** PUT /api/admin/template-comments/:id/reply { text } — answers a comment; an empty text removes the answer. */
adminTemplateCommentsRouter.put(
  "/:id/reply",
  asyncHandler(async (req, res) => {
    const { text } = parseBody(z.object({ text: z.string().trim().max(1000) }), req.body);
    const c = await prisma.templateComment.findFirst({ where: { id: String(req.params.id), ...live } });
    if (!c) throw new HttpError(404, "NOT_FOUND", "نظر پیدا نشد");
    const updated = await prisma.templateComment.update({
      where: { id: c.id },
      data: text ? { reply: text, repliedAt: new Date() } : { reply: null, repliedAt: null },
      include: { user: { select: { name: true } } },
    });
    res.json({ comment: shown(updated) });
  }),
);

/** DELETE /api/admin/template-comments/:id — removes a comment (hidden everywhere). */
adminTemplateCommentsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.templateComment.updateMany({ where: { id: String(req.params.id), ...live }, data: { deletedAt: new Date() } });
    res.json({ ok: true });
  }),
);
