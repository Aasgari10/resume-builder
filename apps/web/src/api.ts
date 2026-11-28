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

export type User = { id: string; phone: string; name: string | null; email: string | null; role: string };

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
export type ShopCustomer = { id: string; name: string; phone: string; createdAt: string; orders: number; spent: number; lastOrderAt: string | null; /** Only left a comment; has not signed up. */ guest?: boolean };
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
export type ShopSummary = { customers: number; orders: number; messages?: number; newOrders: number; openTickets: number; waitingReviews: number; sales: number; monthSales: number; monthOrders: number; recent: ShopOrder[] };
/** The panel's trash: deleted orders, customers, comments and tickets, removed for good after `days`. */
export type ShopTrashKind = "orders" | "customers" | "reviews" | "tickets";
export type ShopTrash = {
  orders: (ShopOrder & { deletedAt: string })[];
  customers: { id: string; name: string; phone: string; createdAt: string; deletedAt: string; reviews: number; tickets: number }[];
  reviews: (ShopReview & { deletedAt: string })[];
  tickets: (ShopTicket & { deletedAt: string })[];
  days: number;
};
/** Something a visitor sent through a form of the published site: a booking, a message or a newsletter sign-up. */
export type SiteMessageKind = "BOOKING" | "CONTACT" | "NEWSLETTER";
export type SiteMessageStatus = "NEW" | "SEEN" | "CONFIRMED" | "DONE" | "CANCELED";
export type SiteMessage = {
  id: string;
  kind: SiteMessageKind;
  status: SiteMessageStatus;
  code: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  subject: string | null;
  text: string | null;
  service: string | null;
  date: string | null;
  time: string | null;
  guests: number | null;
  /** A guesthouse stay: nights from the check-in day (date). */
  nights?: number | null;
  page: string | null;
  ownerNote: string | null;
  createdAt: string;
  deletedAt: string | null;
};
export type SiteMessages = { messages: SiteMessage[]; newCounts: { booking: number; contact: number; newsletter: number }; days: number };
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

/* ───────────── Site build orders ───────────── */

export type SiteOrderStatus = "NEW" | "REVIEWING" | "BUILDING" | "DELIVERED" | "CANCELED";
export type SiteOrderLine = { from: "customer" | "admin" | "system"; text: string; at: string; status?: SiteOrderStatus };
export type SiteOrderSummary = {
  id: string;
  code: string;
  resumeId: string | null;
  templateId: string;
  title: string;
  name: string;
  phone: string;
  business: string | null;
  note: string | null;
  status: SiteOrderStatus;
  unreadByUser: boolean;
  unreadByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastLine: SiteOrderLine | null;
  lines: number;
  user?: { phone: string };
};
export type SiteOrder = Omit<SiteOrderSummary, "lastLine" | "lines"> & { messages: SiteOrderLine[] };
export type AdminSiteOrder = SiteOrder & { design: { data: ResumeData; theme: Theme }; templateName: string; user: { phone: string; name: string | null } };
export type TicketTopic = "ORDER" | "TECHNICAL" | "BILLING" | "OTHER";
export type TicketStatus = "OPEN" | "ANSWERED" | "CLOSED";
export type TicketLine = { from: "customer" | "admin"; text: string; at: string };
export type TicketSummary = {
  id: string;
  code: string;
  topic: TicketTopic;
  subject: string;
  orderCode: string | null;
  status: TicketStatus;
  unreadByUser: boolean;
  unreadByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastLine: TicketLine | null;
  lines: number;
  user?: { phone: string; name: string | null };
};
export type Ticket = Omit<TicketSummary, "lastLine" | "lines"> & { messages: TicketLine[] };
export type TicketInput = { topic: TicketTopic; subject: string; orderCode?: string; text: string };
export type SupportInfo = { ticketsEnabled: boolean; rules: { maxOpen: number; minText: number; maxText: number } };
export type TemplateComment = {
  id: string;
  templateId: string;
  text: string;
  author: string;
  createdAt: string;
  reply: string | null;
  repliedAt: string | null;
  likes: number;
  dislikes: number;
  myVote: number;
};
export type AdminTemplateComment = TemplateComment & { phone: string };
export type SiteOrderInput = { resumeId: string; name: string; phone: string; business?: string; note?: string };

export const api = {
  requestOtp: (phone: string) =>
    request<{ ok: true; expiresInSeconds: number; devCode?: string }>("POST", "/auth/request-otp", { phone }),
  verifyOtp: (phone: string, code: string) =>
    request<{ user: User }>("POST", "/auth/verify-otp", { phone, code }),
  logout: () => request<{ ok: true }>("POST", "/auth/logout"),
  me: () => request<{ user: User }>("GET", "/auth/me"),
  updateMe: (patch: { name?: string; email?: string }) => request<{ user: User }>("PATCH", "/auth/me", patch),

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
  siteMessages: (resumeId: string, trash = false) => request<SiteMessages>("GET", `/resumes/${resumeId}/site/messages${trash ? "?trash=1" : ""}`),
  updateSiteMessage: (resumeId: string, id: string, patch: { status?: SiteMessageStatus; ownerNote?: string | null; date?: string; time?: string }) =>
    request<{ message: SiteMessage }>("PATCH", `/resumes/${resumeId}/site/messages/${encodeURIComponent(id)}`, patch),
  batchSiteMessages: (resumeId: string, ids: string[], action: "seen" | "confirm" | "done" | "cancel" | "delete" | "restore" | "purge") =>
    request<{ done: number }>("POST", `/resumes/${resumeId}/site/messages/batch`, { ids, action }),
  shopTrash: (resumeId: string) => request<ShopTrash>("GET", `/resumes/${resumeId}/site/trash`),
  restoreShopTrash: (resumeId: string, kind: ShopTrashKind, ids: string[]) => request<{ done: number; failed: string[] }>("POST", `/resumes/${resumeId}/site/trash/restore`, { kind, ids }),
  purgeShopTrash: (resumeId: string, kind: ShopTrashKind, ids: string[]) => request<{ done: number }>("POST", `/resumes/${resumeId}/site/trash/purge`, { kind, ids }),

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
    updateSettings: (patch: { aiDailyTokenLimit?: number; ticketsEnabled?: boolean }) =>
      request<{ settings: { aiDailyTokenLimit: number; ticketsEnabled: boolean } }>("PATCH", "/admin/settings", patch),
    unpublishSite: (id: string) => request<{ ok: true }>("POST", `/admin/sites/${encodeURIComponent(id)}/unpublish`),
    siteOrders: (page: number, status?: string, q?: string) =>
      request<Paged<SiteOrderSummary> & { unread: number }>("GET", `/admin/site-orders${qs({ page, status, q })}`),
    siteOrder: (id: string) => request<{ order: AdminSiteOrder }>("GET", `/admin/site-orders/${encodeURIComponent(id)}`),
    setSiteOrderStatus: (id: string, status: SiteOrderStatus) =>
      request<{ order: AdminSiteOrder }>("PATCH", `/admin/site-orders/${encodeURIComponent(id)}`, { status }),
    sendSiteOrder: (id: string, text: string) =>
      request<{ order: AdminSiteOrder }>("POST", `/admin/site-orders/${encodeURIComponent(id)}/messages`, { text }),
    tickets: (page: number, status?: string, q?: string) =>
      request<Paged<TicketSummary> & { unread: number; ticketsEnabled: boolean }>("GET", `/admin/support/tickets${qs({ page, status, q })}`),
    ticket: (id: string) => request<{ ticket: Ticket }>("GET", `/admin/support/tickets/${encodeURIComponent(id)}`),
    answerTicket: (id: string, text: string) => request<{ ticket: Ticket }>("POST", `/admin/support/tickets/${encodeURIComponent(id)}/messages`, { text }),
    setTicketStatus: (id: string, status: TicketStatus) => request<{ ticket: Ticket }>("PATCH", `/admin/support/tickets/${encodeURIComponent(id)}`, { status }),
  },
  joinWaitlist: (product: WaitlistProduct, phone: string) =>
    request<{ ok: true }>("POST", "/waitlist", { product, phone }),
  uploadAvatar: (dataUrl: string) => request<{ url: string }>("POST", "/uploads/avatar", { dataUrl }),
  uploadImage: (dataUrl: string) => request<{ url: string }>("POST", "/uploads/image", { dataUrl }),
  /** A song file (MP3, M4A or OGG, up to 8 MB), sent as it is. */
  uploadAudio: async (file: File): Promise<{ url: string }> => {
    const res = await fetch("/api/uploads/audio", { method: "POST", credentials: "include", headers: { "Content-Type": "application/octet-stream" }, body: file }).catch(() => null);
    if (!res) throw new ApiError(0, "NETWORK", "ارتباط با سرور برقرار نشد");
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? "UNKNOWN", res.status === 413 ? "حجم فایل صوتی بیشتر از ۸ مگابایت است" : (json?.error?.message ?? "آپلود انجام نشد"));
    return json as { url: string };
  },
  assistantQuota: () => request<AssistantQuota>("GET", "/assistant/quota"),
  askAssistant: (body: { message: string; history: AssistantTurn[]; theme: Theme; locale: "fa" | "en"; capabilities?: Capabilities }) =>
    request<AssistantResponse>("POST", "/assistant/theme", body),
  getOrder: (id: string) => request<{ order: Order }>("GET", `/orders/${encodeURIComponent(id)}`),

  siteOrders: {
    create: (body: SiteOrderInput) => request<{ order: SiteOrderSummary }>("POST", "/site-orders", body),
    list: () => request<{ orders: SiteOrderSummary[]; unread: number }>("GET", "/site-orders"),
    get: (id: string) => request<{ order: SiteOrder }>("GET", `/site-orders/${encodeURIComponent(id)}`),
    send: (id: string, text: string) => request<{ order: SiteOrder }>("POST", `/site-orders/${encodeURIComponent(id)}/messages`, { text }),
  },

  comments: {
    counts: () => request<{ counts: Record<string, number> }>("GET", "/template-comments/counts"),
    list: (templateId: string) => request<{ comments: TemplateComment[] }>("GET", `/template-comments/${encodeURIComponent(templateId)}`),
    write: (templateId: string, text: string) => request<{ comment: TemplateComment }>("POST", `/template-comments/${encodeURIComponent(templateId)}`, { text }),
    vote: (id: string, value: 1 | -1 | 0) => request<{ comment: TemplateComment }>("POST", `/template-comments/c/${encodeURIComponent(id)}/vote`, { value }),
    reply: (id: string, text: string) => request<{ comment: TemplateComment }>("PUT", `/admin/template-comments/${encodeURIComponent(id)}/reply`, { text }),
    remove: (id: string) => request<{ ok: true }>("DELETE", `/admin/template-comments/${encodeURIComponent(id)}`),
    adminList: (page: number, unanswered?: boolean) =>
      request<Paged<AdminTemplateComment> & { unanswered: number }>("GET", `/admin/template-comments${qs({ page, unanswered: unanswered ? 1 : undefined })}`),
  },

  support: {
    info: () => request<SupportInfo>("GET", "/support"),
    list: () => request<{ tickets: TicketSummary[]; unread: number }>("GET", "/support/tickets"),
    create: (body: TicketInput) => request<{ ticket: Ticket }>("POST", "/support/tickets", body),
    get: (id: string) => request<{ ticket: Ticket }>("GET", `/support/tickets/${encodeURIComponent(id)}`),
    send: (id: string, text: string) => request<{ ticket: Ticket }>("POST", `/support/tickets/${encodeURIComponent(id)}/messages`, { text }),
    close: (id: string) => request<{ ticket: Ticket }>("POST", `/support/tickets/${encodeURIComponent(id)}/close`),
  },
};
