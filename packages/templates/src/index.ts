// Public entry point of @rb/templates.
import { ClassicResume } from "./classic-resume";
import { MinimalPortfolio } from "./minimal-portfolio";
import { BannerResume } from "./pdf/banner";
import { CardResume } from "./pdf/card";
import { DiagonalResume } from "./pdf/diagonal";
import { NightResume } from "./pdf/night";
import { TimelineResume } from "./pdf/timeline";
import { ColumnResume } from "./pdf/column";
import { LineResume } from "./pdf/line";
import { SidebarResume } from "./pdf/sidebar";
import { SoftResume } from "./pdf/soft";
import { BentoPortfolio } from "./web/bento";
import { SplitPortfolio } from "./web/split";
import { StudioPortfolio } from "./web/studio";
import { VitrinePortfolio, vitrinePages } from "./web/vitrine";
import { AsemanPortfolio, ASEMAN_BLOCKS, asemanPages, asemanSample } from "./web/aseman";
import { GRID_BLOCKS, GRID_OPTIONAL_PAGES, GridPortfolio, gridPages, gridSample } from "./web/grid";
import { VITRINE_OPTIONAL_PAGES } from "./web/vitrine";
import { VCARD_OPTIONAL_PAGES, VcardPortfolio, vcardPages, vcardSample } from "./web/vcard";
import { CODE_BLOCKS, CodePortfolio, codePages, codeSample } from "./web/code";
import { SIMPLE_BLOCKS, SimplePortfolio, simplePages, simpleSample } from "./web/simple";
import { SEPID_BLOCKS, SEPID_OPTIONAL_PAGES, SepidPortfolio, sepidPages, sepidSample } from "./web/sepid";
import { BOUTIQUE_BLOCKS, BoutiqueShop, boutiquePages, boutiqueSample } from "./web/boutique";
import { GOLSARA_BLOCKS, GOLSARA_OPTIONAL_PAGES, GolsaraShop, golsaraPages, golsaraSample } from "./web/golsara";
import { HOMEMART_BLOCKS, HomeMartShop, homemartPages, homemartSample } from "./web/homemart";
import { KAFE_BLOCKS, KAFE_OPTIONAL_PAGES, KafeSite, kafePages, kafeSample } from "./web/kafe";
import { JUNO_BLOCKS, JUNO_OPTIONAL_PAGES, JunoShop, junoPages, junoSample } from "./web/juno";
import { GROGIN_BLOCKS, GROGIN_OPTIONAL_PAGES, GroginShop, groginPages, groginSample } from "./web/grogin";
import type { ResumeData } from "@rb/schema";
import type { TemplateDefinition, TemplateTag } from "./types";

export type { TemplateDefinition, TemplateProps, TemplateTag } from "./types";
export { sampleResume } from "./sample";
export { withPlaceholders } from "./placeholders";
export { isDummyUrl } from "./format";
export { Silhouette } from "./avatar";
export { formatPeriod, formatYearMonth, safeUrl } from "./format";
export { buildSeo, truncate, type SeoMeta, type SeoOverrides } from "./seo";

const minimalPortfolio: TemplateDefinition = {
  id: "minimal-portfolio",
  name: "مینیمال",
  kind: "PORTFOLIO",
  component: MinimalPortfolio,
};

const classicResume: TemplateDefinition = {
  id: "classic-pdf",
  name: "کلاسیک",
  kind: "PDF",
  component: ClassicResume,
};

const pdf = (
  id: string,
  name: string,
  component: TemplateDefinition["component"],
  tags: readonly TemplateTag[]
): TemplateDefinition => ({ id, name, kind: "PDF", component, tags });

/** Printable resume templates, in the order shown to users. */
export const PDF_TEMPLATES: readonly TemplateDefinition[] = [
  pdf("sidebar-pdf", "ستون رنگی", SidebarResume, ["sidebar", "creative", "photo"]),
  pdf("soft-pdf", "ستون روشن", SoftResume, ["sidebar", "formal", "photo"]),
  pdf("banner-pdf", "سربرگ", BannerResume, ["creative", "photo"]),
  pdf("card-pdf", "کارت", CardResume, ["creative", "photo"]),
  pdf("column-pdf", "ستون عکس‌دار", ColumnResume, ["sidebar", "creative", "photo"]),
  pdf("timeline-pdf", "مسیر", TimelineResume, ["sidebar", "creative", "photo"]),
  pdf("diagonal-pdf", "مورب", DiagonalResume, ["formal", "photo"]),
  pdf("night-pdf", "شب", NightResume, ["dark", "creative", "photo"]),
  pdf("line-pdf", "خطی", LineResume, ["formal", "photo"]),
  { ...classicResume, tags: ["formal"] },
];

const web = (id: string, name: string, component: TemplateDefinition["component"]): TemplateDefinition => ({
  id,
  name,
  kind: "PORTFOLIO",
  component,
});

/** Website templates, in the order shown to users. */
export const PORTFOLIO_TEMPLATES: readonly TemplateDefinition[] = [
  { ...web("vitrine-portfolio", "ویترین", VitrinePortfolio), pages: vitrinePages, optionalPages: VITRINE_OPTIONAL_PAGES },
  { ...web("aseman-portfolio", "آسمان", AsemanPortfolio), pages: asemanPages, sample: asemanSample, blocks: ASEMAN_BLOCKS },
  { ...web("grid-portfolio", "گرید", GridPortfolio), pages: gridPages, sample: gridSample, optionalPages: GRID_OPTIONAL_PAGES, blocks: GRID_BLOCKS },
  { ...web("vcard-portfolio", "کارت", VcardPortfolio), pages: vcardPages, sample: vcardSample, optionalPages: VCARD_OPTIONAL_PAGES },
  { ...web("code-portfolio", "کد", CodePortfolio), pages: codePages, sample: codeSample, blocks: CODE_BLOCKS },
  { ...web("simple-portfolio", "ساده", SimplePortfolio), pages: simplePages, sample: simpleSample, blocks: SIMPLE_BLOCKS },
  { ...web("sepid-portfolio", "سپید", SepidPortfolio), pages: sepidPages, sample: sepidSample, optionalPages: SEPID_OPTIONAL_PAGES, blocks: SEPID_BLOCKS },
  { ...web("boutique-shop", "بوتیک (فروشگاه)", BoutiqueShop), pages: boutiquePages, sample: boutiqueSample, blocks: BOUTIQUE_BLOCKS, shop: true },
  { ...web("golsara-shop", "گل‌سرا (گل‌فروشی)", GolsaraShop), pages: golsaraPages, sample: golsaraSample, blocks: GOLSARA_BLOCKS, optionalPages: GOLSARA_OPTIONAL_PAGES, shop: true },
  { ...web("kafe-site", "کورتو (کافه)", KafeSite), pages: kafePages, sample: kafeSample, blocks: KAFE_BLOCKS, optionalPages: KAFE_OPTIONAL_PAGES, shop: true, menu: true },
  { ...web("juno-shop", "جونو (اسباب‌بازی)", JunoShop), pages: junoPages, sample: junoSample, blocks: JUNO_BLOCKS, optionalPages: JUNO_OPTIONAL_PAGES, shop: true },
  { ...web("grogin-shop", "گروگین (سوپرمارکت)", GroginShop), pages: groginPages, sample: groginSample, blocks: GROGIN_BLOCKS, optionalPages: GROGIN_OPTIONAL_PAGES, shop: true },
  { ...web("homemart-shop", "هوم‌مارت (فروشگاه لوازم خانگی)", HomeMartShop), pages: homemartPages, sample: homemartSample, blocks: HOMEMART_BLOCKS, shop: true },
  minimalPortfolio,
  web("studio-portfolio", "استودیو", StudioPortfolio),
  web("split-portfolio", "دوستونه", SplitPortfolio),
  web("bento-portfolio", "کارت‌ها", BentoPortfolio),
];

/** Registry of available templates, keyed by Template.id in the database. */
export const TEMPLATES: Readonly<Record<string, TemplateDefinition>> = Object.fromEntries(
  [...PORTFOLIO_TEMPLATES, ...PDF_TEMPLATES].map((t) => [t.id, t])
);

/** Website templates offered for new sites: those that support click-to-edit (multi-page ones). */
export const SITE_TEMPLATES: readonly TemplateDefinition[] = PORTFOLIO_TEMPLATES.filter((t) => t.pages);

export const DEFAULT_PORTFOLIO_TEMPLATE_ID = "vitrine-portfolio";
export const DEFAULT_PDF_TEMPLATE_ID = "sidebar-pdf";

/** The printable template with this id, or the default one. */
export function getPdfTemplate(id: string | undefined): TemplateDefinition {
  const found = id ? TEMPLATES[id] : undefined;
  return found?.kind === "PDF" ? found : TEMPLATES[DEFAULT_PDF_TEMPLATE_ID]!;
}

/** Normalizes a request path ("/about/" → "/about", "" → "/"). */
export function normalizePagePath(path: string): string {
  let clean = path;
  try {
    clean = decodeURIComponent(path);
  } catch {
    /* keep it as is */
  }
  clean = "/" + clean.split(/[?#]/)[0]!.replace(/^\/+|\/+$/g, "");
  return clean;
}

/** The page to render for a path, or null when this template and content have no such page. */
export function resolvePage(template: TemplateDefinition, data: ResumeData, path: string): string | null {
  const page = normalizePagePath(path);
  if (page === "/") return "/";
  if (!template.pages) return null;
  return template.pages(data).find((p) => normalizePagePath(p) === page) ?? null;
}

const PAGE_TITLES: Record<string, Record<ResumeData["locale"], string>> = {
  "/gallery": { fa: "گالری", en: "Gallery" },
  "/about": { fa: "درباره‌ی من", en: "About" },
  "/resume": { fa: "رزومه", en: "Resume" },
  "/credentials": { fa: "سوابق", en: "Credentials" },
  "/works": { fa: "نمونه‌کارها", en: "Works" },
  "/services": { fa: "خدمات", en: "Services" },
  "/contact": { fa: "تماس", en: "Contact" },
  "/shop": { fa: "فروشگاه", en: "Shop" },
  "/cart": { fa: "سبد خرید", en: "Cart" },
  "/wishlist": { fa: "علاقه‌مندی‌ها", en: "Wishlist" },
  "/search": { fa: "جست‌وجو", en: "Search" },
  "/checkout": { fa: "ثبت سفارش", en: "Checkout" },
  "/thanks": { fa: "سفارش ثبت شد", en: "Order placed" },
  "/account": { fa: "حساب کاربری", en: "My account" },
  "/support": { fa: "پشتیبانی", en: "Support" },
  "/support/tickets": { fa: "تیکت‌های من", en: "My tickets" },
  "/faq": { fa: "سؤالات متداول", en: "FAQ" },
  "/blog": { fa: "بلاگ", en: "Blog" },
  "/team": { fa: "تیم ما", en: "Our team" },
  "/menu": { fa: "منو", en: "Menu" },
  "/offer": { fa: "آنچه ارائه می‌دهیم", en: "What we offer" },
};

/** Title of an inner page for the browser tab ("About", a project's name); empty for the home page. */
export function pageTitle(data: ResumeData, page: string): string {
  if (page.startsWith("/projects/")) {
    return data.projects.find((p) => `/projects/${encodeURIComponent(p.id)}` === page)?.title ?? "";
  }
  if (page.startsWith("/product/")) return data.site?.shop?.products.find((p) => `/product/${p.id}` === page)?.name ?? "";
  if (page.startsWith("/page/")) return data.site?.shop?.pages?.find((p) => `/page/${p.slug}` === page)?.title ?? "";
  if (page.startsWith("/blog/")) return data.site?.shop?.posts?.find((p) => `/blog/${p.id}` === page)?.title ?? "";
  if (page.startsWith("/category/")) return data.site?.shop?.categories.find((c) => `/category/${c.id}` === page)?.name ?? "";
  return PAGE_TITLES[page]?.[data.locale] ?? "";
}

/** Looks up a template, falling back to the default portfolio template for unknown ids. */
export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES[id] ?? minimalPortfolio;
}

export { PAGE_PRESETS, SITE_PALETTES, ownColors, pageColorsFrom, siteTheme, type PageColors } from "./palettes";
