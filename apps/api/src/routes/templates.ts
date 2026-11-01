import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "../lib/http";

export const templatesRouter = Router();

/** GET /api/templates?kind=PDF|PORTFOLIO — active templates (public). */
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
    res.json({ templates });
  })
);
