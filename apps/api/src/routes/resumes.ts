import { Router } from "express";
import { z } from "zod";
import { checkPublishable, emptyResume, resumeDraftSchema } from "@rb/schema";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { HttpError, asyncHandler, parseBody } from "../lib/http";
import { currentUserId, requireAuth } from "../middleware/auth";

export const resumesRouter = Router();
resumesRouter.use(requireAuth);

const MAX_RESUMES_PER_USER = 20;

const createBody = z.object({
  title: z.string().trim().min(1).max(80),
  locale: z.enum(["fa", "en"]).default("fa"),
});

const updateBody = z
  .object({
    title: z.string().trim().min(1).max(80).optional(),
    data: resumeDraftSchema.optional(), // autosave uses lenient validation
  })
  .refine((b) => b.title !== undefined || b.data !== undefined, {
    message: "حداقل یکی از title یا data لازم است",
  });

/**
 * Every query is scoped by { id, userId }. Another user's resume yields 404 rather than 403,
 * so the response does not reveal whether the id exists.
 */
async function findOwnResume(id: string, userId: string) {
  const resume = await prisma.resume.findFirst({ where: { id, userId } });
  if (!resume) throw new HttpError(404, "NOT_FOUND", "رزومه پیدا نشد");
  return resume;
}

/** GET /api/resumes — the current user's resumes, without content. */
resumesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const resumes = await prisma.resume.findMany({
      where: { userId: currentUserId(req) },
      select: { id: true, title: true, locale: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ resumes });
  })
);

/** POST /api/resumes  { title, locale } — creates a blank resume. */
resumesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const { title, locale } = parseBody(createBody, req.body);

    const count = await prisma.resume.count({ where: { userId } });
    if (count >= MAX_RESUMES_PER_USER) {
      throw new HttpError(400, "LIMIT_REACHED", `حداکثر ${MAX_RESUMES_PER_USER} رزومه می‌توانید داشته باشید`);
    }

    const resume = await prisma.resume.create({
      data: {
        userId,
        title,
        locale,
        data: emptyResume(locale) as Prisma.InputJsonValue,
      },
    });
    res.status(201).json({ resume });
  })
);

/** GET /api/resumes/:id — full resume including content. */
resumesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const resume = await findOwnResume(req.params.id!, currentUserId(req));
    res.json({ resume });
  })
);

/** PATCH /api/resumes/:id  { title?, data? } — saves changes; called by editor autosave. */
resumesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const existing = await findOwnResume(req.params.id!, userId);
    const body = parseBody(updateBody, req.body);

    const resume = await prisma.resume.update({
      where: { id: existing.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.data !== undefined
          ? {
              data: body.data as Prisma.InputJsonValue,
              locale: body.data.locale, // keep the column in sync with content
            }
          : {}),
      },
    });
    res.json({ resume });
  })
);

/** DELETE /api/resumes/:id */
resumesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { count } = await prisma.resume.deleteMany({
      where: { id: req.params.id!, userId: currentUserId(req) },
    });
    if (count === 0) throw new HttpError(404, "NOT_FOUND", "رزومه پیدا نشد");
    res.status(204).end();
  })
);

/** GET /api/resumes/:id/check — strict validation result, with failing field paths. */
resumesRouter.get(
  "/:id/check",
  asyncHandler(async (req, res) => {
    const resume = await findOwnResume(req.params.id!, currentUserId(req));
    const result = checkPublishable(resume.data);
    res.json(result.ok ? { ok: true } : { ok: false, issues: result.issues });
  })
);
