// Typed API client. The session cookie is httpOnly and sent automatically by the browser.

import type { ResumeData, ShopOrderStatus, Theme } from "@rb/schema";
import type { Capabilities, SiteChanges } from "./components/site-edit/assistantSite";

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
  site?: { subdomain: string; isPublished: boolean; path: string; url: string | null } | null;
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
export type AssistantResponse = { reply: string; theme: Theme | null; site?: SiteChanges | null; remainingPercent: number };

export type AdminAiUsage = {
  provider: "openai" | "fake" | "disabled";
  model: string | null;
  dailyTokenLimit: number;
  today: { tokens: number; requests: number; users: number };
  last30: { tokens: number; requests: number };
  topUsers: { phone: string; tokens: number; requests: number }[];
};

export type WaitlistProduct = "site" | "shop" | "salon" | "clinic" | "cafe" | "business" | "pricing" | "consult";

export type AdminWaitlist = {
  counts: { product: string; count: number }[];
  latest: { id: string; product: string; phone: string; createdAt: string }[];
};

export type Availability = { available: true } | { available: false; reason: string; message: string };

/* ───────────── Endpoints ───────────── */

/** An order placed on a published shop (see apps/api/src/routes/shop.ts). */
export type ShopCustomer = { id: string; name: string; phone: string; createdAt: string; orders: number; spent: number; lastOrderAt: string | null };
export type ShopCustomerDetail = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  addresses: { id: string; title?: string; city?: string; address: string; postalCode?: string }[];
  orders: ShopOrder[];
  reviews: Omit<ShopReview, "customer">[];
  tickets: { id: string; subject: string; status: ShopTicket["status"]; updatedAt: string }[];
};
export type ShopProductStat = { sold: number; revenue: number; rating?: number; reviews?: number };
export type ShopSummary = { customers: number; orders: number; newOrders: number; openTickets: number; waitingReviews: number; sales: number; monthSales: number; monthOrders: number; recent: ShopOrder[] };
export type ShopOrderQuery = { status?: ShopOrderStatus; q?: string; from?: string; to?: string; take?: number; skip?: number };
export type ShopReview = { id: string; productId: string; rating: number; text: string; approved: boolean; reply: string | null; createdAt: string; customer: { name: string; phone: string } };
export type ShopTicket = {
  id: string;
  subject: string;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  messages: { from: "customer" | "shop"; text: string; at: string }[];
  createdAt: string;
  updatedAt: string;
  customer: { name: string; phone: string };
};

export type ShopOrder = {
  id: string;
  code: string;
  status: ShopOrderStatus;
  customerName: string;
  phone: string;
  city: string | null;
  address: string;
  postalCode: string | null;
  note: string | null;
  items: { id: string; name: string; size: string | null; qty: number; unit: number; total: number }[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  customerId: string | null;
  shipping: number;
  total: number;
  createdAt: string;
};

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
  shopProductStats: (resumeId: string) => request<{ stats: Record<string, ShopProductStat> }>("GET", `/resumes/${resumeId}/site/product-stats`),
  shopSummary: (resumeId: string) => request<{ summary: ShopSummary | null }>("GET", `/resumes/${resumeId}/site/shop-summary`),
  shopOrders: (resumeId: string, query: ShopOrderQuery = {}) => {
    const params = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)]));
    return request<{ orders: ShopOrder[]; total: number }>("GET", `/resumes/${resumeId}/site/orders${params.size ? `?${params}` : ""}`);
  },
  batchShopOrders: (resumeId: string, ids: string[], status: ShopOrderStatus | "DELETE") =>
    request<{ done: number; failed: string[] }>("POST", `/resumes/${resumeId}/site/orders/batch`, { ids, status }),
  deleteShopOrder: (resumeId: string, orderId: string) => request<{ ok: true }>("DELETE", `/resumes/${resumeId}/site/orders/${encodeURIComponent(orderId)}`),
  setShopOrderStatus: (resumeId: string, orderId: string, status: ShopOrderStatus) =>
    request<{ order: ShopOrder }>("PATCH", `/resumes/${resumeId}/site/orders/${encodeURIComponent(orderId)}`, { status }),
  shopCustomers: (resumeId: string) => request<{ customers: ShopCustomer[] }>("GET", `/resumes/${resumeId}/site/customers`),
  shopCustomer: (resumeId: string, id: string) => request<{ customer: ShopCustomerDetail }>("GET", `/resumes/${resumeId}/site/customers/${encodeURIComponent(id)}`),
  deleteShopCustomer: (resumeId: string, id: string) => request<{ ok: true }>("DELETE", `/resumes/${resumeId}/site/customers/${encodeURIComponent(id)}`),
  shopReviews: (resumeId: string) => request<{ reviews: ShopReview[] }>("GET", `/resumes/${resumeId}/site/reviews`),
  updateShopReview: (resumeId: string, id: string, patch: { approved?: boolean; reply?: string | null; text?: string; rating?: number }) =>
    request<{ review: ShopReview }>("PATCH", `/resumes/${resumeId}/site/reviews/${encodeURIComponent(id)}`, patch),
  deleteShopReview: (resumeId: string, id: string) => request<{ ok: true }>("DELETE", `/resumes/${resumeId}/site/reviews/${encodeURIComponent(id)}`),
  batchShopReviews: (resumeId: string, ids: string[], action: "approve" | "hide" | "delete") => request<{ done: number }>("POST", `/resumes/${resumeId}/site/reviews/batch`, { ids, action }),
  shopTickets: (resumeId: string) => request<{ tickets: ShopTicket[] }>("GET", `/resumes/${resumeId}/site/tickets`),
  updateShopTicket: (resumeId: string, id: string, patch: { text?: string; status?: ShopTicket["status"] }) =>
    request<{ ticket: ShopTicket }>("PATCH", `/resumes/${resumeId}/site/tickets/${encodeURIComponent(id)}`, patch),
  deleteShopTicket: (resumeId: string, id: string) => request<{ ok: true }>("DELETE", `/resumes/${resumeId}/site/tickets/${encodeURIComponent(id)}`),
  batchShopTickets: (resumeId: string, ids: string[], action: "close" | "delete") => request<{ done: number }>("POST", `/resumes/${resumeId}/site/tickets/batch`, { ids, action }),

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
    waitlist: () => request<AdminWaitlist>("GET", "/admin/waitlist"),
    updateSettings: (patch: { aiDailyTokenLimit?: number }) =>
      request<{ settings: { aiDailyTokenLimit: number } }>("PATCH", "/admin/settings", patch),
    unpublishSite: (id: string) => request<{ ok: true }>("POST", `/admin/sites/${encodeURIComponent(id)}/unpublish`),
  },
  joinWaitlist: (product: WaitlistProduct, phone: string) =>
    request<{ ok: true }>("POST", "/waitlist", { product, phone }),
  uploadAvatar: (dataUrl: string) => request<{ url: string }>("POST", "/uploads/avatar", { dataUrl }),
  uploadImage: (dataUrl: string) => request<{ url: string }>("POST", "/uploads/image", { dataUrl }),
  assistantQuota: () => request<AssistantQuota>("GET", "/assistant/quota"),
  askAssistant: (body: { message: string; history: AssistantTurn[]; theme: Theme; locale: "fa" | "en"; capabilities?: Capabilities }) =>
    request<AssistantResponse>("POST", "/assistant/theme", body),
  getOrder: (id: string) => request<{ order: Order }>("GET", `/orders/${encodeURIComponent(id)}`),
};
