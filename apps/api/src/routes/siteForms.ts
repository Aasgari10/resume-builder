// What visitors send through the forms of any published site: bookings (salon appointment,
// restaurant table), contact messages and newsletter sign-ups. The pages have no scripts, so a form
// posts here; the row is saved for the owner's inbox and the browser goes back to the page with
// "?sent=<kind>" (and the booking's tracking code), where a small notice says it arrived.

import { randomInt } from "node:crypto";
import express, { Router, type Request, type Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { env } from "../env";
import { asyncHandler } from "../lib/http";
import { subdomainFromHost, validateSubdomain } from "../lib/subdomain";
import { freeAt, resumeDataSchema, takenFor } from "@rb/schema";
import { signedInCustomer, takenSlots } from "./shop";

export const siteFormsRouter = Router();
const form = express.urlencoded({ extended: false, limit: "20kb", parameterLimit: 40 });

/** Most rows one visitor address may send to one site in an hour (spam guard). */
const HOURLY_LIMIT = 20;
const recent = new Map<string, number[]>();
function tooMany(key: string): boolean {
  const now = Date.now();
  const list = (recent.get(key) ?? []).filter((t) => now - t < 3600_000);
  list.push(now);
  recent.set(key, list);
  if (recent.size > 5000) recent.clear();
  return list.length > HOURLY_LIMIT;
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

// Older forms named their fields after the parts of an email (cc = name, bcc = phone or email,
// body = message); both namings are read.
const body = z.object({
  kind: z.enum(["booking", "contact", "newsletter"]),
  back: z.string().max(200).optional(),
  name: text(80),
  cc: text(80),
  phone: text(20),
  email: text(120),
  bcc: text(120),
  subject: text(160),
  text: text(3000),
  body: text(3000),
  message: text(3000),
  service: text(80),
  date: text(20),
  time: text(10),
  guests: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
  website: z.string().max(200).optional(), // left empty by people, filled only by robots
});

const backPath = (raw: unknown) => {
  const path = typeof raw === "string" ? raw : "/";
  return /^\/[\w\-/%]*$/.test(path) && !path.startsWith("//") && path.length < 200 ? path : "/";
};
const to = (base: string, path: string) => (path === "/" ? base || "/" : base + path);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

async function newCode(): Promise<string> {
  for (;;) {
    const code = `B${randomInt(100000, 999999)}`;
    if (!(await prisma.siteMessage.findUnique({ where: { code } }))) return code;
  }
}

async function sendForm(req: Request, res: Response, rawSubdomain: string, base: string) {
  const check = validateSubdomain(rawSubdomain);
  const site = check.ok ? await prisma.site.findUnique({ where: { subdomain: check.value }, select: { id: true, isPublished: true, publishedData: true } }) : null;
  if (!site?.isPublished) return void res.status(404).end();
  const parsed = body.safeParse(req.body);
  const back = backPath((req.body as Record<string, unknown>)?.back);
  const go = (query: Record<string, string>) => res.redirect(303, `${to(base, back)}?${new URLSearchParams(query)}`);
  if (!parsed.success) return go({ sent: "error" });
  const f = parsed.data;
  // A robot filled the hidden field: answer as if it worked, save nothing.
  if (f.website) return go({ sent: f.kind });
  if (tooMany(`${site.id}:${req.ip}`)) return go({ sent: "error" });

  const contact = f.bcc ?? "";
  const email = f.email ?? (isEmail(contact) ? contact : undefined);
  const phone = f.phone ?? (contact && !isEmail(contact) ? contact.slice(0, 20) : undefined);
  const name = f.name ?? f.cc;
  const message = f.text ?? f.body ?? f.message;
  const kind = f.kind === "booking" ? "BOOKING" : f.kind === "contact" ? "CONTACT" : "NEWSLETTER";

  if (kind === "NEWSLETTER") {
    if (!email || !isEmail(email)) return go({ sent: "error" });
    // One row per address: joining again is not a new sign-up.
    const exists = await prisma.siteMessage.findFirst({ where: { siteId: site.id, kind, email, deletedAt: null }, select: { id: true } });
    if (!exists) await prisma.siteMessage.create({ data: { siteId: site.id, kind, email, page: back } });
    return go({ sent: "newsletter" });
  }
  if (kind === "BOOKING" && (!name || !phone)) return go({ sent: "error" });
  // A site with online booking hours only takes a free time inside them (checked here again: the page may be old).
  const published = resumeDataSchema.safeParse(site.publishedData);
  const schedule = published.success ? published.data.site?.shop?.schedule : undefined;
  if (kind === "BOOKING" && schedule) {
    if (!f.date || !f.time || (schedule.byService && !f.service)) return go({ sent: "error" });
    const taken = takenFor(schedule, await takenSlots(site.id, schedule), f.service);
    const need = schedule.seats ? Math.max(1, f.guests ?? 1) : 1;
    if (freeAt(schedule, taken, f.date, f.time) < need) return go({ sent: "full" });
  }
  if (kind === "CONTACT" && !message && !f.subject) return go({ sent: "error" });

  const customerId = (await signedInCustomer(req, site.id)) ?? undefined;
  const data = { siteId: site.id, kind, name, phone, email, subject: f.subject, text: message, service: f.service, date: f.date, time: f.time, guests: f.guests, page: back, customerId } as const;
  if (kind === "BOOKING") {
    for (let i = 0; ; i++) {
      try {
        const row = await prisma.siteMessage.create({ data: { ...data, code: await newCode() } });
        return go({ sent: "booking", code: row.code! });
      } catch (e) {
        if (i < 3 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
        throw e;
      }
    }
  }
  await prisma.siteMessage.create({ data });
  go({ sent: "contact" });
}

// Path-based access: /s/<subdomain>/_form
siteFormsRouter.post(
  "/s/:subdomain/_form",
  form,
  asyncHandler(async (req, res) => {
    const subdomain = req.params.subdomain!;
    await sendForm(req, res, subdomain, `/s/${encodeURIComponent(subdomain)}`);
  }),
);
// Host-based access: <subdomain>.<ROOT_DOMAIN>/_form
siteFormsRouter.post(
  "/_form",
  form,
  asyncHandler(async (req, res, next) => {
    const subdomain = subdomainFromHost(req.headers.host, env.rootDomain);
    if (!subdomain) return next();
    await sendForm(req, res, subdomain, "");
  }),
);
