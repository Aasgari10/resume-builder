import { prisma } from "../db";

/** Free templates are usable by everyone; premium ones only after a paid purchase. */
export async function canUseTemplate(userId: string, templateId: string): Promise<boolean> {
  const template = await prisma.template.findUnique({ where: { id: templateId }, select: { isPremium: true, price: true } });
  if (!template) return false;
  if (!template.isPremium || template.price <= 0) return true;
  const purchase = await prisma.templatePurchase.findUnique({
    where: { userId_templateId: { userId, templateId } },
    select: { id: true },
  });
  return purchase !== null;
}

/** Ids of templates the user has purchased. */
export async function purchasedTemplateIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.templatePurchase.findMany({ where: { userId }, select: { templateId: true } });
  return new Set(rows.map((r) => r.templateId));
}
