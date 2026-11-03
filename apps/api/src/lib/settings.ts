// Platform settings stored in the Setting table, with typed defaults.

import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";

export const settingsSchema = z.object({
  /** Tokens each user may spend on the AI assistant per day (Tehran time). */
  aiDailyTokenLimit: z.number().int().min(0).max(10_000_000),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = { aiDailyTokenLimit: 20_000 };

export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const merged = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const parsed = settingsSchema.shape[key].safeParse(stored[key]);
    if (parsed.success) merged[key] = parsed.data;
  }
  return merged;
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  await prisma.$transaction(
    Object.entries(patch).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: value as Prisma.InputJsonValue },
        create: { key, value: value as Prisma.InputJsonValue },
      })
    )
  );
  return getSettings();
}

/** Start of the current day in Tehran (UTC+03:30, no daylight saving since 2022). */
export function startOfTehranDay(now = Date.now()): Date {
  const offset = 3.5 * 60 * 60 * 1000;
  const day = 24 * 60 * 60 * 1000;
  return new Date(Math.floor((now + offset) / day) * day - offset);
}
