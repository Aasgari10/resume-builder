import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "../lib/http";
import { purchasedTemplateIds } from "../lib/ownership";

export const templatesRouter = Router();

/** GET /api/templates?kind=PDF|PORTFOLIO — active templates (public); `owned` reflects the signed-in user. */
templatesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const kind = req.query.kind === "PDF" || req.query.kind === "PORTFOLIO" ? req.query.kind : undefined;
    const templates = await prisma.template.findMany({
      where: { isActive: true, ...(kind ? { kind } : {}) },
      select: {
        id: true,
        name: true,
        kind: true,
        isPremium: true,
        price: true,
        previewImage: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const purchased = req.userId ? await purchasedTemplateIds(req.userId) : new Set<string>();
    res.json({
      templates: templates.map((t) => ({ ...t, owned: !t.isPremium || t.price <= 0 || purchased.has(t.id) })),
    });
  })
);
