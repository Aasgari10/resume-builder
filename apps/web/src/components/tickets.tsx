// Shared pieces of support tickets: topic and status labels, used by the support page and the admin tab.

import type { TicketStatus, TicketTopic } from "../api";

export const TICKET_TOPIC: Record<TicketTopic, string> = {
  ORDER: "سفارش سایت",
  TECHNICAL: "مشکل فنی سایت یا پنل",
  BILLING: "پرداخت",
  OTHER: "سایر",
};

export const TICKET_STATUS: Record<TicketStatus, { label: string; tone: "ok" | "wait" | "fail" | "new" }> = {
  OPEN: { label: "در انتظار پاسخ", tone: "wait" },
  ANSWERED: { label: "پاسخ داده شد", tone: "ok" },
  CLOSED: { label: "بسته شد", tone: "fail" },
};

export function TicketPill({ status }: { status: TicketStatus }) {
  const s = TICKET_STATUS[status];
  return <span className={`status-pill so-${s.tone} tk-${status.toLowerCase()}`}>{s.label}</span>;
}
