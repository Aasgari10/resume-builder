// Typed API client. The session cookie is httpOnly and sent automatically by the browser.

import type { ResumeData } from "@rb/schema";

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

export type Resume = ResumeSummary & { data: ResumeData };

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
  updateResume: (id: string, patch: { title?: string; data?: ResumeData }) =>
    request<{ resume: Resume }>("PATCH", `/resumes/${id}`, patch),
  deleteResume: (id: string) => request<void>("DELETE", `/resumes/${id}`),
  checkResume: (id: string) =>
    request<{ ok: true } | { ok: false; issues: FieldIssue[] }>("GET", `/resumes/${id}/check`),
};
