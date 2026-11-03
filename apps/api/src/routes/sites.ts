// Site settings and publishing for a resume owned by the current user.
// Mounted at /api/resumes/:resumeId/site.

import { Router } from "express";
import { z } from "zod";
import type { Prisma, Site } from "@prisma/client";
import { checkPublishable, defaultTheme, themeSchema } from "@rb/schema";
import { DEFAULT_PORTFOLIO_TEMPLATE_ID, TEMPLATES } from "@rb/templates";
import { prisma } from "../db";
import { siteUrl } from "../env";
import { HttpError, asyncHandler, parseBody } from "../lib/http";
import { canUseTemplate } from "../lib/ownership";
import { validateSubdomain } from "../lib/subdomain";
import { currentUserId, requireAuth } from "../middleware/auth";

export const sitesRouter = Router({ mergeParams: true });
sitesRouter.use(requireAuth);

const settingsBody = z.object({
  subdomain: z.string().max(60),
  seoTitle: z.string().trim().max(70).nullish(),
  seoDescription: z.string().trim().max(160).nullish(),
  noindex: z.boolean().optional(),
});

async function findOwnResume(req: { params: Record<string, string | undefined>; userId?: string }) {
  const resume = await prisma.resume.findFirst({
    where: { id: req.params.resumeId!, userId: currentUserId(req) },
    include: { site: true },
  });
  if (!resume) throw new HttpError(404, "NOT_FOUND", "رزومه پیدا نشد");
  return resume;
}

function requireValidSubdomain(raw: string): string {
  const check = validateSubdomain(raw);
  if (!check.ok) throw new HttpError(400, "INVALID_SUBDOMAIN", check.message, { reason: check.code });
  return check.value;
}

async function isTaken(subdomain: string, resumeId: string): Promise<boolean> {
  const existing = await prisma.site.findUnique({ where: { subdomain }, select: { resumeId: true } });
  return existing !== null && existing.resumeId !== resumeId;
}

/** The theme the editor last saved, or the default theme when missing or invalid. */
function workingTheme(resume: { portfolioTheme: Prisma.JsonValue | null; locale: "fa" | "en" }) {
  const parsed = themeSchema.safeParse(resume.portfolioTheme);
  return parsed.success ? parsed.data : defaultTheme(DEFAULT_PORTFOLIO_TEMPLATE_ID, resume.locale);
}

function toDto(site: Site, hasUnpublishedChanges: boolean) {
  return {
    subdomain: site.subdomain,
    seoTitle: site.seoTitle,
    seoDescription: site.seoDescription,
    noindex: site.noindex,
    isPublished: site.isPublished,
    publishedAt: site.publishedAt,
    path: `/s/${site.subdomain}`,
    url: siteUrl(site.subdomain) ?? null,
    hasUnpublishedChanges,
  };
}

// Both sides are jsonb values, which PostgreSQL stores with normalized key order.
const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** GET /api/resumes/:resumeId/site — site settings and publish state, or null. */
sitesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const resume = await findOwnResume(req);
    const site = resume.site;
    if (!site) {
      res.json({ site: null });
      return;
    }
    const changed =
      !site.publishedData || !sameJson(site.publishedData, resume.data) || !sameJson(site.publishedTheme, resume.portfolioTheme);
    res.json({ site: toDto(site, changed) });
  })
);

/** GET /api/resumes/:resumeId/site/availability?subdomain= — live address check for the editor. */
sitesRouter.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const resume = await findOwnResume(req);
    const check = validateSubdomain(String(req.query.subdomain ?? ""));
    if (!check.ok) {
      res.json({ available: false, reason: check.code, message: check.message });
      return;
    }
    const taken = await isTaken(check.value, resume.id);
    res.json(taken ? { available: false, reason: "TAKEN", message: "این آدرس قبلاً گرفته شده است" } : { available: true });
  })
);

/** PUT /api/resumes/:resumeId/site  { subdomain, seoTitle?, seoDescription?, noindex? } — creates or updates settings. */
sitesRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    const resume = await findOwnResume(req);
    const body = parseBody(settingsBody, req.body);
    const subdomain = requireValidSubdomain(body.subdomain);
    if (await isTaken(subdomain, resume.id)) {
      throw new HttpError(409, "SUBDOMAIN_TAKEN", "این آدرس قبلاً گرفته شده است");
    }

    const settings = {
      subdomain,
      seoTitle: body.seoTitle || null,
      seoDescription: body.seoDescription || null,
      ...(body.noindex !== undefined ? { noindex: body.noindex } : {}),
    };

    const site = await prisma.site.upsert({
      where: { resumeId: resume.id },
      update: settings,
      create: {
        ...settings,
        userId: resume.userId,
        resumeId: resume.id,
        templateId: workingTheme(resume).templateId,
      },
    });
    res.json({ site: toDto(site, true) });
  })
);

/** POST /api/resumes/:resumeId/site/publish — validates and publishes a snapshot of the current resume and theme. */
sitesRouter.post(
  "/publish",
  asyncHandler(async (req, res) => {
    const resume = await findOwnResume(req);
    if (!resume.site) throw new HttpError(400, "NO_SITE", "ابتدا آدرس سایت را تعیین کنید");

    const check = checkPublishable(resume.data);
    if (!check.ok) {
      throw new HttpError(400, "NOT_PUBLISHABLE", "رزومه هنوز برای انتشار کامل نیست", check.issues);
    }

    const theme = workingTheme(resume);
    if (TEMPLATES[theme.templateId]?.kind !== "PORTFOLIO") {
      throw new HttpError(400, "UNKNOWN_TEMPLATE", "قالب انتخاب‌شده معتبر نیست");
    }
    if (!(await canUseTemplate(resume.userId, theme.templateId))) {
      throw new HttpError(402, "TEMPLATE_NOT_PURCHASED", "برای انتشار با این قالب، ابتدا آن را خریداری کنید", {
        templateId: theme.templateId,
      });
    }

    const site = await prisma.site.update({
      where: { id: resume.site.id },
      data: {
        templateId: theme.templateId,
        publishedData: check.data as Prisma.InputJsonValue,
        publishedTheme: theme as Prisma.InputJsonValue,
        isPublished: true,
        publishedAt: new Date(),
      },
    });
    res.json({ site: toDto(site, false) });
  })
);

/** POST /api/resumes/:resumeId/site/unpublish — takes the site offline; settings and snapshot are kept. */
sitesRouter.post(
  "/unpublish",
  asyncHandler(async (req, res) => {
    const resume = await findOwnResume(req);
    if (!resume.site) throw new HttpError(400, "NO_SITE", "سایتی برای این رزومه وجود ندارد");
    const site = await prisma.site.update({ where: { id: resume.site.id }, data: { isPublished: false } });
    res.json({ site: toDto(site, true) });
  })
);
