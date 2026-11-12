// The owner's inbox: bookings, contact messages and newsletter sign-ups sent through the forms of
// their published site. Mounted inside the site router (/api/resumes/:resumeId/site/...), after sign-in.

import { Router, type Request } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { HttpError, asyncHandler, parseBody } from "../lib/http";
import { currentUserId } from "../middleware/auth";

export const siteMessagesRouter = Router({ mergeParams: true });

/** Days a deleted row stays in the trash before it is removed for good (same as the shop's trash). */
const TRASH_DAYS = 30;

async function ownSite(req: Request) {
  const resume = await prisma.resume.findFirst({ where: { id: req.params.resumeId!, userId: currentUserId(req) }, select: { site: { select: { id: true } } } });
  if (!resume) throw new HttpError(404, "NOT_FOUND", "رزومه پیدا نشد");
  return resume.site;
}



/** GET …/site/messages?trash=1 — everything sent through the site's forms, newest first, with the counts of new rows. */
siteMessagesRouter.get(
  "/messages",
  asyncHandler(async (req, res) => {
    const site = await ownSite(req);
    if (!site) return void res.json({ messages: [], newCounts: { booking: 0, contact: 0, newsletter: 0 }, days: TRASH_DAYS });
    await prisma.siteMessage.deleteMany({ where: { siteId: site.id, deletedAt: { lt: new Date(Date.now() - TRASH_DAYS * 86400000) } } });
    const trash = req.query.trash === "1";
    const [messages, groups] = await Promise.all([
      prisma.siteMessage.findMany({ where: { siteId: site.id, deletedAt: trash ? { not: null } : null }, orderBy: { createdAt: "desc" }, take: 2000 }),
      prisma.siteMessage.groupBy({ by: ["kind"], where: { siteId: site.id, deletedAt: null, status: "NEW" }, _count: true }),
    ]);
    const count = (k: string) => groups.find((g) => g.kind === k)?._count ?? 0;
    res.json({ messages, newCounts: { booking: count("BOOKING"), contact: count("CONTACT"), newsletter: count("NEWSLETTER") }, days: TRASH_DAYS });
  }),
);

const patchBody = z.object({
  status: z.enum(["NEW", "SEEN", "CONFIRMED", "DONE", "CANCELED"]).optional(),
  ownerNote: z.string().trim().max(1000).nullable().optional(),
  date: z.string().trim().max(20).optional(),
  time: z.string().trim().max(10).optional(),
});

/** PATCH …/site/messages/:id — change the status (confirm a booking…), the owner's note, or move a booking's day and time. */
siteMessagesRouter.patch(
  "/messages/:id",
  asyncHandler(async (req, res) => {
    const site = await ownSite(req);
    if (!site) throw new HttpError(404, "NOT_FOUND", "این سایت هنوز منتشر نشده است");
    const body = parseBody(patchBody, req.body);
    const found = await prisma.siteMessage.findFirst({ where: { id: req.params.id!, siteId: site.id, deletedAt: null } });
    if (!found) throw new HttpError(404, "NOT_FOUND", "پیدا نشد");
    const message = await prisma.siteMessage.update({
      where: { id: found.id },
      data: { status: body.status, date: body.date, time: body.time, ownerNote: body.ownerNote === undefined ? undefined : body.ownerNote || null },
    });
    res.json({ message });
  }),
);

const batchBody = z.object({
  ids: z.array(z.string().max(40)).min(1).max(1000),
  action: z.enum(["seen", "confirm", "done", "cancel", "delete", "restore", "purge"]),
});

/** POST …/site/messages/batch { ids, action } — the same change for many rows; delete moves to the trash. */
siteMessagesRouter.post(
  "/messages/batch",
  asyncHandler(async (req, res) => {
    const site = await ownSite(req);
    if (!site) throw new HttpError(404, "NOT_FOUND", "این سایت هنوز منتشر نشده است");
    const { ids, action } = parseBody(batchBody, req.body);
    const live = { id: { in: ids }, siteId: site.id, deletedAt: null };
    const trashed = { id: { in: ids }, siteId: site.id, deletedAt: { not: null } };
    const status = { seen: "SEEN", confirm: "CONFIRMED", done: "DONE", cancel: "CANCELED" } as const;
    const r =
      action === "delete" ? await prisma.siteMessage.updateMany({ where: live, data: { deletedAt: new Date() } })
      : action === "restore" ? await prisma.siteMessage.updateMany({ where: trashed, data: { deletedAt: null } })
      : action === "purge" ? await prisma.siteMessage.deleteMany({ where: trashed })
      : await prisma.siteMessage.updateMany({ where: live, data: { status: status[action] } });
    res.json({ done: r.count });
  }),
);


