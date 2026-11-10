// Chat model clients: any OpenAI-compatible API, and a keyword-based fake for development.

import { TEMPLATE_INFO, extractRequest } from "./prompt";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatResult = {
  content: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
};

export interface ChatModel {
  readonly provider: string;
  readonly model: string;
  complete(messages: ChatMessage[], options: { maxTokens: number }): Promise<ChatResult>;
}

export class ModelError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
  }
}

/** Rough token estimate for providers or fakes that do not report usage. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 3);

export function createOpenAiCompatible(options: {
  baseUrl: string;
  apiKey: string;
  model: string;
  jsonMode: boolean;
  fetch?: typeof fetch;
  timeoutMs?: number;
}): ChatModel {
  const doFetch = options.fetch ?? fetch;
  return {
    provider: "openai",
    model: options.model,
    async complete(messages, { maxTokens }) {
      let res: Response;
      try {
        res = await doFetch(`${options.baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${options.apiKey}` },
          body: JSON.stringify({
            model: options.model,
            messages,
            max_tokens: maxTokens,
            temperature: 0.4,
            ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
          }),
          signal: AbortSignal.timeout(options.timeoutMs ?? 60_000),
        });
      } catch (e) {
        throw new ModelError(`AI provider unreachable: ${String(e)}`);
      }
      const body = (await res.json().catch(() => null)) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
        error?: { message?: string };
      } | null;
      if (!res.ok || !body) throw new ModelError(body?.error?.message ?? `AI provider error (HTTP ${res.status})`, res.status);

      const content = body.choices?.[0]?.message?.content ?? "";
      const promptTokens = body.usage?.prompt_tokens ?? estimateTokens(messages.map((m) => m.content).join(""));
      const completionTokens = body.usage?.completion_tokens ?? estimateTokens(content);
      return {
        content,
        usage: { promptTokens, completionTokens, totalTokens: body.usage?.total_tokens ?? promptTokens + completionTokens },
      };
    },
  };
}

/* ───────────── Fake model ───────────── */

type FakeRule = { match: RegExp; reply: string; changes: Record<string, unknown> };

const FAKE_RULES: FakeRule[] = [
  {
    match: /تیره|شب|دارک/,
    reply: "ظاهر را تیره کردم: پس‌زمینه‌ی تیره با متن روشن.",
    changes: { colors: { background: "#0F172A", surface: "#1E293B", text: "#F1F5F9", mutedText: "#94A3B8", primary: "#60A5FA", accent: "#F59E0B" } },
  },
  {
    match: /روشن|سفید/,
    reply: "ظاهر را روشن و ساده کردم.",
    changes: { colors: { background: "#FFFFFF", surface: "#F8FAFC", text: "#1F2937", mutedText: "#6B7280" } },
  },
  {
    match: /گرم|نارنجی|قرمز/,
    reply: "رنگ‌ها را گرم‌تر کردم.",
    changes: { colors: { primary: "#B45309", accent: "#DC2626", surface: "#FFF7ED" } },
  },
  {
    match: /سرد|آبی/,
    reply: "رنگ‌ها را سرد و آبی کردم.",
    changes: { colors: { primary: "#1D4ED8", accent: "#0891B2", surface: "#EFF6FF" } },
  },
  {
    match: /رسمی|جدی/,
    reply: "رنگ‌ها را سرمه‌ای کردم و گوشه‌ها را تیزتر کردم تا رسمی‌تر شود.",
    changes: { colors: { primary: "#1F3A5F", accent: "#4B5563" }, layout: { radius: "sm" } },
  },
  {
    match: /فاصله.*(بیشتر|باز)|جادار/,
    reply: "فاصله‌ها را بیشتر کردم.",
    changes: { layout: { spacing: "relaxed" } },
  },
  {
    match: /فشرده|جمع/,
    reply: "فاصله‌ها را کمتر کردم تا فشرده‌تر شود.",
    changes: { layout: { spacing: "compact" } },
  },
  {
    match: /گرد/,
    reply: "گوشه‌ی کادرها را گردتر کردم.",
    changes: { layout: { radius: "lg" } },
  },
  {
    match: /(نوشته|متن|فونت).*(بزرگ)/,
    reply: "اندازه‌ی نوشته‌ها را بزرگ‌تر کردم.",
    changes: { typography: { scale: "lg" } },
  },
  {
    match: /پروژه/,
    reply: "بخش پروژه‌ها را به ابتدای صفحه منتقل کردم.",
    changes: { sectionOrder: ["projects"] },
  },
];

type FakeInfo = { pages?: { path: string; label: string }[]; blocks?: { key: string; label: string }[]; add?: { kind: string; label: string }[] };

/** Showing, hiding or adding by the names in the template info, e.g. «سوالات متداول را حذف کن». */
function fakeSiteChange(turn: string, request: string): { reply: string; site: Record<string, unknown> } | null {
  const line = turn.split("\n").find((l) => l.startsWith(TEMPLATE_INFO));
  if (!line) return null;
  let info: FakeInfo;
  try {
    info = JSON.parse(line.slice(TEMPLATE_INFO.length)) as FakeInfo;
  } catch {
    return null;
  }
  // «حراج (کالاهای تخفیف‌دار)» is named by «حراج»; «بخش X» and «صفحه‌ی X» by X.
  const named = (label: string) => request.includes(label.replace(/\s*\(.*\)\s*/, "").replace(/^(بخش|صفحه‌ی)\s+/, "").replace(/[«»]/g, "").trim());
  if (/اضافه|بیفزا|جدید/.test(request)) {
    const kind = info.add?.find((a) => named(a.label));
    if (kind) return { reply: `یک ${kind.label} جدید اضافه کردم؛ روی آن در صفحه کلیک کن تا ویرایشش کنی.`, site: { add: [{ kind: kind.kind, count: 1 }] } };
  }
  const hide = /حذف|بردار|پاک|پنهان|نمی‌خوام|نمیخوام/.test(request);
  const show = /نشان|نمایش|برگردان|بیاد|بیار/.test(request);
  if (!hide && !show) return null;
  const page = info.pages?.find((p) => named(p.label));
  if (page) return { reply: `${page.label} را ${hide ? "پنهان کردم" : "دوباره نمایش دادم"}.`, site: { pages: { [page.path]: !hide } } };
  const block = info.blocks?.find((b) => named(b.label));
  if (block) return { reply: `${block.label} را ${hide ? "پنهان کردم" : "دوباره نمایش دادم"}.`, site: { blocks: { [block.key]: !hide } } };
  return null;
}

/** Deterministic stand-in that understands a few Persian keywords; used when no API key is configured. */
export function createFakeModel(): ChatModel {
  return {
    provider: "fake",
    model: "fake-keywords",
    async complete(messages) {
      const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
      const request = extractRequest(last);
      const site = fakeSiteChange(last, request);
      const rule = site ? undefined : FAKE_RULES.find((r) => r.match.test(request));
      const content = JSON.stringify(
        site
          ? { reply: `${site.reply} (پاسخ آزمایشی)`, changes: null, site: site.site }
          : rule
          ? { reply: `${rule.reply} (پاسخ آزمایشی)`, changes: rule.changes }
          : { reply: "در حالت آزمایشی فقط چند درخواست ساده را می‌فهمم؛ مثلاً «حالت تیره»، «رسمی‌تر کن» یا «فاصله‌ها بیشتر».", changes: null }
      );
      const promptTokens = estimateTokens(messages.map((m) => m.content).join(""));
      const completionTokens = estimateTokens(content);
      return { content, usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens } };
    },
  };
}
