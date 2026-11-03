// AI appearance assistant: turns a Persian request into a validated theme change.

import { Router } from "express";
import { z } from "zod";
import { themeSchema, type Theme } from "@rb/schema";
import { chatModel } from "../ai";
import { ModelError, type ChatMessage, type ChatResult } from "../ai/models";
import { SYSTEM_PROMPT, userTurn } from "../ai/prompt";
import { applyThemePatch, ensureReadable, parseAssistantReply } from "../ai/themePatch";
import { prisma } from "../db";
import { HttpError, asyncHandler, parseBody } from "../lib/http";
import { getSettings, startOfTehranDay } from "../lib/settings";
import { currentUserId, requireAuth } from "../middleware/auth";

export const assistantRouter = Router();
assistantRouter.use(requireAuth);

const MAX_MESSAGE = 300;
const MAX_HISTORY = 6;
const MAX_REPLY_TOKENS = 600;
const MAX_PER_MINUTE = 6;

const requestBody = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(600) }))
    .max(20)
    .default([]),
  theme: themeSchema,
  locale: z.enum(["fa", "en"]).default("fa"),
});

async function quota(userId: string) {
  const [{ aiDailyTokenLimit }, used] = await Promise.all([
    getSettings(),
    prisma.aiUsage.aggregate({
      where: { userId, createdAt: { gte: startOfTehranDay() } },
      _sum: { totalTokens: true },
    }),
  ]);
  const spent = used._sum.totalTokens ?? 0;
  const remainingPercent = aiDailyTokenLimit > 0 ? Math.max(0, Math.round((1 - spent / aiDailyTokenLimit) * 100)) : 0;
  return { exhausted: spent >= aiDailyTokenLimit, remainingPercent };
}

/** GET /api/assistant/quota — whether the assistant is available and today's remaining budget. */
assistantRouter.get(
  "/quota",
  asyncHandler(async (req, res) => {
    if (!chatModel) {
      res.json({ enabled: false, remainingPercent: 0, demo: false });
      return;
    }
    const q = await quota(currentUserId(req));
    res.json({ enabled: true, remainingPercent: q.remainingPercent, demo: chatModel.provider === "fake" });
  })
);

/** POST /api/assistant/theme  { message, history, theme, locale } — returns a reply and the changed theme (not saved). */
assistantRouter.post(
  "/theme",
  asyncHandler(async (req, res) => {
    if (!chatModel) throw new HttpError(503, "AI_DISABLED", "دستیار هوشمند فعلاً در دسترس نیست");
    const userId = currentUserId(req);
    const body = parseBody(requestBody, req.body);

    const recent = await prisma.aiUsage.count({ where: { userId, createdAt: { gte: new Date(Date.now() - 60_000) } } });
    if (recent >= MAX_PER_MINUTE) throw new HttpError(429, "AI_RATE_LIMIT", "کمی صبر کنید و دوباره امتحان کنید");
    if ((await quota(userId)).exhausted) {
      throw new HttpError(429, "AI_DAILY_LIMIT", "اعتبار امروز دستیار تمام شده است؛ فردا دوباره امتحان کنید");
    }

    // Only the last few turns are sent, so long conversations do not grow the cost.
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      // Earlier turns are marked as history so the model does not answer them again.
      ...body.history.slice(-MAX_HISTORY).map((m) => ({
        role: m.role,
        content: m.role === "user" ? `(earlier request) ${m.content}` : JSON.stringify({ reply: m.content }),
      })),
      { role: "user", content: userTurn(body.theme, body.locale, body.message) },
    ];

    let result: ChatResult;
    try {
      result = await chatModel.complete(messages, { maxTokens: MAX_REPLY_TOKENS });
    } catch (e) {
      console.error("AI request failed:", e instanceof ModelError ? e.message : e);
      throw new HttpError(502, "AI_ERROR", "دستیار پاسخ نداد؛ کمی بعد دوباره امتحان کنید");
    }

    const parsed = parseAssistantReply(result.content);
    let theme: Theme | null = null;
    let adjusted = false;
    if (parsed?.changes) {
      try {
        const readable = ensureReadable(applyThemePatch(body.theme, parsed.changes));
        theme = readable.theme;
        adjusted = readable.adjusted;
      } catch {
        theme = null;
      }
    }
    const ok = parsed !== null && (parsed.changes == null || theme !== null);

    await prisma.aiUsage.create({
      data: {
        userId,
        provider: chatModel.provider,
        model: chatModel.model,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        ok,
      },
    });

    const reply = !ok
      ? "متوجه نشدم چه تغییری بدهم؛ لطفاً ساده‌تر بگویید، مثلاً «رنگ‌ها گرم‌تر» یا «فاصله‌ها بیشتر»."
      : adjusted
        ? `${parsed!.reply} رنگ متن را هم کمی تغییر دادم تا خوانا بماند.`
        : parsed!.reply;

    res.json({ reply, theme, remainingPercent: (await quota(userId)).remainingPercent });
  })
);
