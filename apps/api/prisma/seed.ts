// Seeds the initial templates. Idempotent (upsert).
// Usage: npm run db:seed
import { PrismaClient, TemplateKind } from "@prisma/client";

const prisma = new PrismaClient();

const templates = [
  { id: "classic-pdf", name: "کلاسیک", kind: TemplateKind.PDF, isPremium: false, price: 0, sortOrder: 1 },
  { id: "modern-pdf", name: "مدرن", kind: TemplateKind.PDF, isPremium: false, price: 0, sortOrder: 2 },
  {
    id: "minimal-portfolio",
    name: "مینیمال",
    kind: TemplateKind.PORTFOLIO,
    isPremium: true,
    price: 2_000_000, // in rials; placeholder price
    sortOrder: 1,
  },
];

async function main() {
  for (const t of templates) {
    await prisma.template.upsert({ where: { id: t.id }, update: t, create: t });
  }
  console.log(`✅ Seeded ${templates.length} templates`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
