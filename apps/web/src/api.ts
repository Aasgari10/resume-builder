// Typed API client. The session cookie is httpOnly and sent automatically by the browser.

import type { ResumeData, Theme } from "@rb/schema";

export type FieldIssue = { path: string; message: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK", "ارتباط با سرور برقرار نشد");
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = json?.error;
    throw new ApiError(res.status, err?.code ?? "UNKNOWN", err?.message ?? "خطای ناشناخته", err?.details);
  }
  return json as T;
}

/* ───────────── Response types ───────────── */

export type User = { id: string; phone: string; name: string | null; role: string };

export type ResumeSummary = {
  id: string;
  title: string;
  locale: "fa" | "en";
  createdAt: string;
  updatedAt: string;
};

export type Resume = ResumeSummary & { data: ResumeData; portfolioTheme: unknown };

export type Site = {
  subdomain: string;
  seoTitle: string | null;
  seoDescription: string | null;
  noindex: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  /** Path on the platform, e.g. /s/sara */
  path: string;
  /** Full subdomain URL when the server has a root domain configured. */
  url: string | null;
  hasUnpublishedChanges: boolean;
};

export type SiteSettings = {
  subdomain: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  noindex?: boolean;
};

export type Template = {
  id: string;
  name: string;
  kind: "PDF" | "PORTFOLIO";
  isPremium: boolean;
  /** Rials. */
  price: number;
  previewImage: string | null;
  /** Free, or purchased by the signed-in user. */
  owned: boolean;
};

export type Order = {
  id: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELED";
  amount: number;
  template: { id: string; name: string } | null;
  refId: string | null;
  createdAt: string;
  paidAt: string | null;
};

/* ───────────── Admin ───────────── */

export type Paged<T> = { items: T[]; page: number; pageSize: number; total: number; pages: number };

export type AdminStats = {
  users: number;
  newUsers7d: number;
  resumes: number;
  publishedSites: number;
  paidOrders: number;
  revenue: number;
  paidOrders30d: number;
  revenue30d: number;
  pendingOrders: number;
  failedOrders30d: number;
};

export type AdminUser = {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  createdAt: string;
  resumes: number;
  sites: number;
  purchases: number;
};

export type AdminOrder = {
  id: string;
  status: Order["status"];
  amount: number;
  phone: string;
  templateName: string | null;
  provider: string | null;
  refId: string | null;
  createdAt: string;
  paidAt: string | null;
};

export type AdminTemplate = {
  id: string;
  name: string;
  kind: "PDF" | "PORTFOLIO";
  isPremium: boolean;
  price: number;
  isActive: boolean;
  sortOrder: number;
  sales: number;
  sites: number;
};

export type AdminTemplatePatch = Partial<Pick<AdminTemplate, "name" | "price" | "isPremium" | "isActive" | "sortOrder">>;

export type AdminSite = {
  id: string;
  subdomain: string;
  path: string;
  url: string | null;
  phone: string;
  templateName: string;
  isPublished: boolean;
  publishedAt: string | null;
};

const qs = (params: Record<string, string | number | undefined>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [string, string | number][];
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}` : "";
};

export type AssistantTurn = { role: "user" | "assistant"; content: string };
export type AssistantQuota = { enabled: boolean; remainingPercent: number; demo: boolean };
export type AssistantResponse = { reply: string; theme: Theme | null; remainingPercent: number };

export type AdminAiUsage = {
  provider: "openai" | "fake" | "disabled";
  model: string | null;
  dailyTokenLimit: number;
  today: { tokens: number; requests: number; users: number };
  last30: { tokens: number; requests: number };
  topUsers: { phone: string; tokens: number; requests: number }[];
};

export type Availability = { available: true } | { available: false; reason: string; message: string };

/* ───────────── Endpoints ───────────── */

export const api = {
  requestOtp: (phone: string) =>
    request<{ ok: true; expiresInSeconds: number; devCode?: string }>("POST", "/auth/request-otp", { phone }),
  verifyOtp: (phone: string, code: string) =>
    request<{ user: User }>("POST", "/auth/verify-otp", { phone, code }),
  logout: () => request<{ ok: true }>("POST", "/auth/logout"),
  me: () => request<{ user: User }>("GET", "/auth/me"),

  listResumes: () => request<{ resumes: ResumeSummary[] }>("GET", "/resumes"),
  createResume: (title: string, locale: "fa" | "en") =>
    request<{ resume: Resume }>("POST", "/resumes", { title, locale }),
  getResume: (id: string) => request<{ resume: Resume }>("GET", `/resumes/${id}`),
  updateResume: (id: string, patch: { title?: string; data?: ResumeData; portfolioTheme?: Theme }) =>
    request<{ resume: Resume }>("PATCH", `/resumes/${id}`, patch),
  deleteResume: (id: string) => request<void>("DELETE", `/resumes/${id}`),
  checkResume: (id: string) =>
    request<{ ok: true } | { ok: false; issues: FieldIssue[] }>("GET", `/resumes/${id}/check`),

  getSite: (resumeId: string) => request<{ site: Site | null }>("GET", `/resumes/${resumeId}/site`),
  checkSubdomain: (resumeId: string, subdomain: string) =>
    request<Availability>("GET", `/resumes/${resumeId}/site/availability?subdomain=${encodeURIComponent(subdomain)}`),
  saveSite: (resumeId: string, settings: SiteSettings) =>
    request<{ site: Site }>("PUT", `/resumes/${resumeId}/site`, settings),
  publishSite: (resumeId: string) => request<{ site: Site }>("POST", `/resumes/${resumeId}/site/publish`),
  unpublishSite: (resumeId: string) => request<{ site: Site }>("POST", `/resumes/${resumeId}/site/unpublish`),

  listTemplates: (kind?: "PDF" | "PORTFOLIO") =>
    request<{ templates: Template[] }>("GET", `/templates${kind ? `?kind=${kind}` : ""}`),
  createOrder: (templateId: string) =>
    request<{ orderId: string; paymentUrl: string }>("POST", "/orders", { templateId }),
  admin: {
    stats: () => request<{ stats: AdminStats }>("GET", "/admin/stats"),
    users: (page: number, q?: string) => request<Paged<AdminUser>>("GET", `/admin/users${qs({ page, q })}`),
    orders: (page: number, status?: string) => request<Paged<AdminOrder>>("GET", `/admin/orders${qs({ page, status })}`),
    templates: () => request<{ templates: AdminTemplate[] }>("GET", "/admin/templates"),
    updateTemplate: (id: string, patch: AdminTemplatePatch) =>
      request<{ template: AdminTemplate }>("PATCH", `/admin/templates/${encodeURIComponent(id)}`, patch),
    sites: (page: number, q?: string) => request<Paged<AdminSite>>("GET", `/admin/sites${qs({ page, q })}`),
    ai: () => request<AdminAiUsage>("GET", "/admin/ai"),
    updateSettings: (patch: { aiDailyTokenLimit?: number }) =>
      request<{ settings: { aiDailyTokenLimit: number } }>("PATCH", "/admin/settings", patch),
    unpublishSite: (id: string) => request<{ ok: true }>("POST", `/admin/sites/${encodeURIComponent(id)}/unpublish`),
  },
  uploadAvatar: (dataUrl: string) => request<{ url: string }>("POST", "/uploads/avatar", { dataUrl }),
  assistantQuota: () => request<AssistantQuota>("GET", "/assistant/quota"),
  askAssistant: (body: { message: string; history: AssistantTurn[]; theme: Theme; locale: "fa" | "en" }) =>
    request<AssistantResponse>("POST", "/assistant/theme", body),
  getOrder: (id: string) => request<{ order: Order }>("GET", `/orders/${encodeURIComponent(id)}`),
};
