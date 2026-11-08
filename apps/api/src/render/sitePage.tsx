// Server-side rendering of a published portfolio site into a complete HTML document.
// The page ships no JavaScript: templates are pure components rendered to static markup.

import { renderToStaticMarkup } from "react-dom/server";
import { applyHiddenFields, saleEnded, unitPrice, type ResumeData, type Theme, type Visitor } from "@rb/schema";
import { buildSeo, getTemplate, type SeoOverrides, pageTitle, truncate } from "@rb/templates";
import { env } from "../env";

/** Escapes text for HTML element content and quoted attribute values. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Serializes JSON for an inline <script> block so user content cannot close the tag. */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export const FONT_ASSETS_PATH = "/_assets/vazirmatn";

/**
 * Content Security Policy for published pages: no scripts at all, styles and fonts from this origin
 * (inline styles are needed for theme variables), images from any HTTPS source.
 */
export const SITE_CSP = [
  "default-src 'none'",
  "script-src 'none'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  // The app origin is listed so uploaded photos also load in development over plain HTTP.
  `img-src 'self' https: data: ${new URL(env.appUrl).origin}`,
  "base-uri 'none'",
  // Shop buttons post to the site itself; contact forms open the visitor's mail app.
  "form-action 'self' mailto:",
  "frame-ancestors 'none'",
].join("; ");

export function renderSitePage(input: {
  data: ResumeData;
  theme: Theme;
  seo: SeoOverrides;
  /** Site address without a trailing slash; the page path is appended for the canonical link. */
  url?: string;
  /** Page path from resolvePage ("/" by default). */
  page?: string;
  /** Turns a page path into an href (adds the /s/<subdomain> base in development). */
  link?: (path: string) => string;
  /** Shop templates: the visitor's cart, wishlist and query string. */
  visitor?: Visitor;
}): string {
  const { component: Template } = getTemplate(input.theme.templateId);
  const page = input.page ?? "/";
  // Switched-off fields are dropped before anything is rendered, including the SEO tags.
  const data = applyHiddenFields(input.data, input.theme.hiddenFields);
  const url = input.url && page !== "/" ? input.url.replace(/\/$/, "") + page : input.url;
  const seo = buildSeo(data, input.seo, url);
  const inner = pageTitle(data, page);
  if (inner) seo.title = `${inner} | ${seo.title}`;
  // A product page describes the product: its own search title and text, its picture and price.
  const product = page.startsWith("/product/") ? data.site?.shop?.products.find((p) => `/product/${p.id}` === page) : undefined;
  if (product) {
    if (product.seoTitle?.trim()) seo.title = product.seoTitle.trim();
    const about = product.seoDescription?.trim() || (product.description ? truncate(product.description, 160) : "");
    if (about) seo.description = about;
    const picture = product.images[0];
    if (picture) seo.image = /^https?:/.test(picture) || !input.url ? picture : new URL(picture, input.url).href;
    seo.jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      ...(about ? { description: about } : {}),
      ...(seo.image ? { image: seo.image } : {}),
      offers: {
        "@type": "Offer",
        priceCurrency: "IRR",
        price: unitPrice(product) * 10,
        availability: product.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        ...(product.salePrice !== undefined && product.saleEndsAt && !saleEnded(product) ? { priceValidUntil: product.saleEndsAt.slice(0, 10) } : {}),
        ...(url ? { url } : {}),
      },
    };
  }
  // Project rule: placeholder links (example.com) on a published page lead to the top of the page.
  const body = renderToStaticMarkup(<Template data={data} theme={input.theme} page={page} link={input.link} visitor={input.visitor} />).replace(
    /href="https?:\/\/([\w-]+\.)*example\.(com|ir|org)(\/[^"]*)?"( target="_blank")?/gi,
    'href="#"',
  );
  const ogLocale = seo.lang === "fa" ? "fa_IR" : "en_US";

  const head = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${escapeHtml(seo.title)}</title>`,
    seo.description && `<meta name="description" content="${escapeHtml(seo.description)}">`,
    seo.noindex && `<meta name="robots" content="noindex, nofollow">`,
    seo.url && `<link rel="canonical" href="${escapeHtml(seo.url)}">`,
    `<meta property="og:type" content="profile">`,
    `<meta property="og:title" content="${escapeHtml(seo.title)}">`,
    seo.description && `<meta property="og:description" content="${escapeHtml(seo.description)}">`,
    seo.image && `<meta property="og:image" content="${escapeHtml(seo.image)}">`,
    seo.url && `<meta property="og:url" content="${escapeHtml(seo.url)}">`,
    `<meta property="og:locale" content="${ogLocale}">`,
    `<meta name="twitter:card" content="${seo.image ? "summary_large_image" : "summary"}">`,
    `<link rel="stylesheet" href="${FONT_ASSETS_PATH}/400.css">`,
    `<link rel="stylesheet" href="${FONT_ASSETS_PATH}/700.css">`,
    `<style>html,body{margin:0}</style>`,
    `<script type="application/ld+json">${jsonForScript(seo.jsonLd)}</script>`,
  ]
    .filter(Boolean)
    .join("\n    ");

  return `<!doctype html>
<html lang="${seo.lang}" dir="${seo.dir}">
  <head>
    ${head}
  </head>
  <body>${body}</body>
</html>`;
}

/** Minimal standalone page for missing or unpublished sites. */
export function renderNotFoundPage(): string {
  return `<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>سایت پیدا نشد</title>
    <link rel="stylesheet" href="${FONT_ASSETS_PATH}/400.css">
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Vazirmatn, Tahoma, sans-serif; background: #f6f7f9; color: #1f2937; }
      main { text-align: center; padding: 2rem; }
      h1 { font-size: 1.4rem; margin: 0 0 .5rem; }
      p { color: #6b7280; margin: 0; }
    </style>
  </head>
  <body>
    <main>
      <h1>این سایت پیدا نشد</h1>
      <p>ممکن است آدرس اشتباه باشد یا انتشار آن متوقف شده باشد.</p>
    </main>
  </body>
</html>`;
}
