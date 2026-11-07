// Public, unauthenticated rendering of published sites.
// Reachable at /s/<subdomain>, and at <subdomain>.<ROOT_DOMAIN>/ when a root domain is configured.

import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express, { Router, type Request, type Response } from "express";
import { SAMPLE_ASSETS_PATH, applyHiddenFields, resumeDataSchema, themeSchema } from "@rb/schema";
import { getTemplate, resolvePage } from "@rb/templates";
import { prisma } from "../db";
import { env, siteUrl } from "../env";
import { asyncHandler } from "../lib/http";
import { subdomainFromHost, validateSubdomain } from "../lib/subdomain";
import { FONT_ASSETS_PATH, SITE_CSP, renderNotFoundPage, renderSitePage } from "../render/sitePage";
import { readVisitor } from "./shop";

export const publicRouter = Router();

// Vazirmatn font files and CSS from the @fontsource package, cached for a long time.
const fontDir = dirname(createRequire(import.meta.url).resolve("@fontsource/vazirmatn/package.json"));
publicRouter.use(FONT_ASSETS_PATH, express.static(fontDir, { maxAge: "30d", immutable: true, index: false }));

// Sample pictures shown in previews (and kept if the user publishes them). The folder sits next to
// src/ in development and next to dist/ after the build, so both locations are checked.
const here = dirname(fileURLToPath(import.meta.url));
const sampleDir = [resolve(here, "../../assets/samples"), resolve(here, "../assets/samples")].find((d) => existsSync(d));
// No long caching: browsers check for a newer file each time (a cheap 304 when unchanged), so replaced
// pictures show up at once. The ?v= in sample links also forces a fresh copy after an update.
if (sampleDir) publicRouter.use(SAMPLE_ASSETS_PATH, express.static(sampleDir, { maxAge: 0, index: false }));
else console.warn("Sample pictures folder (apps/api/assets/samples) not found; previews will show placeholders.");

function sendPage(res: Response, status: number, html: string, personal = false) {
  res
    .status(status)
    .set({
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": SITE_CSP,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      // Shop pages show the visitor's own cart, so they must never be cached or shared.
      "Cache-Control": status === 200 && !personal ? "public, max-age=60" : "no-store",
    })
    .send(html);
}

/**
 * @param path page path inside the site ("/", "/about", ...)
 * @param base prefix of every link on the page: "" on a subdomain, "/s/<subdomain>" for path-based access
 */
async function renderSite(req: Request, res: Response, rawSubdomain: string, path: string, base: string) {
  const check = validateSubdomain(rawSubdomain);
  const site = check.ok
    ? await prisma.site.findUnique({ where: { subdomain: check.value } })
    : null;

  if (!site || !site.isPublished) {
    sendPage(res, 404, renderNotFoundPage());
    return;
  }

  // Snapshots are validated at publish time; re-check defensively before rendering.
  const data = resumeDataSchema.safeParse(site.publishedData);
  const theme = themeSchema.safeParse(site.publishedTheme);
  if (!data.success || !theme.success) {
    console.error(`Invalid published snapshot for site ${site.subdomain}`);
    sendPage(res, 500, renderNotFoundPage());
    return;
  }

  // Single-page templates only have "/"; multi-page ones list their pages for this content.
  const page = resolvePage(getTemplate(theme.data.templateId), applyHiddenFields(data.data, theme.data.hiddenFields), path);
  if (!page) {
    sendPage(res, 404, renderNotFoundPage());
    return;
  }

  const url = siteUrl(site.subdomain) ?? `${req.protocol}://${req.get("host")}/s/${site.subdomain}`;
  const shop = Boolean(getTemplate(theme.data.templateId).shop);
  const html = renderSitePage({
    data: data.data,
    theme: theme.data,
    seo: { title: site.seoTitle, description: site.seoDescription, noindex: site.noindex },
    url,
    page,
    link: (p) => (p === "/" ? base || "/" : base + p),
    visitor: shop ? readVisitor(req) : undefined,
  });
  sendPage(res, 200, html, shop);
}

/** GET /s/:subdomain and its inner pages — path-based access, used in development and as a fallback. */
publicRouter.get(
  ["/s/:subdomain", "/s/:subdomain/*"],
  asyncHandler(async (req, res) => {
    const subdomain = req.params.subdomain!;
    await renderSite(req, res, subdomain, "/" + ((req.params as Record<string, string>)[0] ?? ""), `/s/${encodeURIComponent(subdomain)}`);
  })
);

/** GET any page on <subdomain>.<ROOT_DOMAIN> — host-based access for production subdomains. */
publicRouter.get(
  "*",
  asyncHandler(async (req, res, next) => {
    const subdomain = subdomainFromHost(req.headers.host, env.rootDomain);
    // Shared assets (/_assets, /_uploads) and the API keep their own routes on every host.
    if (!subdomain || /^\/(_|api\/)/.test(req.path)) {
      next();
      return;
    }
    await renderSite(req, res, subdomain, req.path, "");
  })
);
