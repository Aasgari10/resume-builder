// Seeds the initial templates. Idempotent (upsert).
// Usage: npm run db:seed
import { PrismaClient, TemplateKind } from "@prisma/client";

const prisma = new PrismaClient();

const templates = [
  { id: "sidebar-pdf", name: "ستون رنگی", kind: TemplateKind.PDF, isPremium: false, price: 0, sortOrder: 1 },
  { id: "soft-pdf", name: "ستون روشن", kind: TemplateKind.PDF, isPremium: false, price: 0, sortOrder: 2 },
  { id: "banner-pdf", name: "سربرگ", kind: TemplateKind.PDF, isPremium: false, price: 0, sortOrder: 3 },
  { id: "card-pdf", name: "کارت", kind: TemplateKind.PDF, isPremium: false, price: 0, sortOrder: 4 },
  { id: "column-pdf", name: "ستون عکس‌دار", kind: TemplateKind.PDF, isPremium: false, price: 0, sortOrder: 5 },
  { id: "timeline-pdf", name: "مسیر", kind: TemplateKind.PDF, isPremium: false, price: 0, sortOrder: 6 },
  { id: "diagonal-pdf", name: "مورب", kind: TemplateKind.PDF, isPremium: false, price: 0, sortOrder: 7 },
  { id: "night-pdf", name: "شب", kind: TemplateKind.PDF, isPremium: false, price: 0, sortOrder: 8 },
  { id: "line-pdf", name: "خطی", kind: TemplateKind.PDF, isPremium: false, price: 0, sortOrder: 9 },
  { id: "classic-pdf", name: "کلاسیک", kind: TemplateKind.PDF, isPremium: false, price: 0, sortOrder: 10 },
  // Placeholder from the first seed; no code template exists for it.
  { id: "modern-pdf", name: "مدرن", kind: TemplateKind.PDF, isPremium: false, price: 0, sortOrder: 99, isActive: false },
  {
    id: "minimal-portfolio",
    name: "مینیمال",
    kind: TemplateKind.PORTFOLIO,
    isPremium: false,
    price: 0, // everything is free for now; prices are set later in the admin panel
    sortOrder: 1,
  },
  { id: "studio-portfolio", name: "استودیو", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 2 },
  { id: "split-portfolio", name: "دوستونه", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 3 },
  { id: "bento-portfolio", name: "کارت‌ها", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 4 },
  { id: "vitrine-portfolio", name: "ویترین", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 0 },
  { id: "aseman-portfolio", name: "آسمان", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 0 },
  { id: "grid-portfolio", name: "گرید", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 0 },
  { id: "vcard-portfolio", name: "کارت", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 0 },
  { id: "code-portfolio", name: "کد", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 0 },
  { id: "simple-portfolio", name: "ساده", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 0 },
  { id: "sepid-portfolio", name: "سپید", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 0 },
  { id: "golsara-shop", name: "گل‌سرا (گل‌فروشی)", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 0 },
  { id: "boutique-shop", name: "بوتیک (فروشگاه)", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 0 },
  { id: "juno-shop", name: "جونو (اسباب‌بازی)", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 0 },
  { id: "grogin-shop", name: "گروگین (سوپرمارکت)", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 0 },
  { id: "homemart-shop", name: "هوم‌مارت (فروشگاه لوازم خانگی)", kind: TemplateKind.PORTFOLIO, isPremium: false, price: 0, sortOrder: 0 },
];

async function main() {
  for (const t of templates) {
    await prisma.template.upsert({ where: { id: t.id }, update: t, create: t });
  }
  // Templates that were removed stay in the table (sites may still point to them) but are hidden.
  await prisma.template.updateMany({ where: { id: { notIn: templates.map((t) => t.id) } }, data: { isActive: false } });
  console.log(`✅ Seeded ${templates.length} templates`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
