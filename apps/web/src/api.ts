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
  getOrder: (id: string) => request<{ order: Order }>("GET", `/orders/${encodeURIComponent(id)}`),
};
