import { isSampleAsset, type ResumeData, type Theme } from "@rb/schema";

type Locale = ResumeData["locale"];
type DateFormat = Theme["display"]["dateFormat"];
type LanguageLevel = ResumeData["languages"][number]["level"];
type LinkType = ResumeData["basics"]["links"][number]["type"];

/* ───────────── Labels ───────────── */

type Labels = {
  sections: Record<"experience" | "education" | "skills" | "projects" | "languages" | "certificates", string>;
  present: string;
  contact: string;
  profile: string;
  personal: {
    born: string;
    marital: string;
    military: string;
    maritalValues: Record<"single" | "married", string>;
    militaryValues: Record<"done" | "exempt" | "serving" | "student" | "none", string>;
  };
  viewProject: string;
  sourceCode: string;
  verify: string;
  general: string;
  languageLevels: Record<LanguageLevel, string>;
  linkTypes: Record<Exclude<LinkType, "other">, string>;
};

export const LABELS: Record<Locale, Labels> = {
  fa: {
    sections: {
      experience: "سوابق کاری",
      education: "تحصیلات",
      skills: "مهارت‌ها",
      projects: "پروژه‌ها",
      languages: "زبان‌ها",
      certificates: "گواهینامه‌ها",
    },
    present: "تا کنون",
    contact: "اطلاعات تماس",
    profile: "درباره‌ی من",
    personal: {
      born: "متولد",
      marital: "وضعیت تأهل",
      military: "وضعیت سربازی",
      maritalValues: { single: "مجرد", married: "متأهل" },
      militaryValues: { done: "پایان خدمت", exempt: "معاف", serving: "در حال خدمت", student: "معافیت تحصیلی", none: "مشمول" },
    },
    viewProject: "مشاهده",
    sourceCode: "سورس کد",
    verify: "تأیید",
    general: "سایر",
    languageLevels: {
      native: "زبان مادری",
      fluent: "مسلط",
      advanced: "پیشرفته",
      intermediate: "متوسط",
      basic: "مبتدی",
    },
    linkTypes: {
      website: "وب‌سایت",
      github: "GitHub",
      linkedin: "LinkedIn",
      telegram: "تلگرام",
      whatsapp: "واتس‌اپ",
      instagram: "اینستاگرام",
      behance: "Behance",
      dribbble: "Dribbble",
    },
  },
  en: {
    sections: {
      experience: "Experience",
      education: "Education",
      skills: "Skills",
      projects: "Projects",
      languages: "Languages",
      certificates: "Certificates",
    },
    present: "Present",
    contact: "Contact",
    profile: "Profile",
    personal: {
      born: "Born",
      marital: "Marital status",
      military: "Military service",
      maritalValues: { single: "Single", married: "Married" },
      militaryValues: { done: "Completed", exempt: "Exempt", serving: "Serving", student: "Student deferment", none: "Not completed" },
    },
    viewProject: "View",
    sourceCode: "Source",
    verify: "Verify",
    general: "Other",
    languageLevels: {
      native: "Native",
      fluent: "Fluent",
      advanced: "Advanced",
      intermediate: "Intermediate",
      basic: "Basic",
    },
    linkTypes: {
      website: "Website",
      github: "GitHub",
      linkedin: "LinkedIn",
      telegram: "Telegram",
      whatsapp: "WhatsApp",
      instagram: "Instagram",
      behance: "Behance",
      dribbble: "Dribbble",
    },
  },
};

/* ───────────── Dates ───────────── */

const formatters = new Map<string, Intl.DateTimeFormat>();

function monthFormatter(locale: Locale, dateFormat: DateFormat): Intl.DateTimeFormat {
  const calendar = dateFormat === "jalali" ? "persian" : "gregory";
  const tag = `${locale === "fa" ? "fa-IR" : "en-US"}-u-ca-${calendar}`;
  let formatter = formatters.get(tag);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(tag, { year: "numeric", month: "long", timeZone: "UTC" });
    formatters.set(tag, formatter);
  }
  return formatter;
}

/** Formats a stored "YYYY-MM" value; returns "" for empty or malformed input. */
export function formatYearMonth(value: string | undefined, locale: Locale, dateFormat: DateFormat): string {
  const match = value ? /^(\d{4})-(\d{2})$/.exec(value) : null;
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return "";
  // Mid-month avoids calendar boundary shifts when converting to Jalali.
  const parts = monthFormatter(locale, dateFormat).formatToParts(new Date(Date.UTC(year, month - 1, 15)));
  // Compose "month year" explicitly: Intl orders the Persian calendar as "year month".
  const monthName = parts.find((p) => p.type === "month")?.value ?? "";
  const yearValue = parts.find((p) => p.type === "year")?.value ?? "";
  return `${monthName} ${yearValue}`.trim();
}

/** Formats a number with the locale's digits (Persian digits for "fa"). */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", { useGrouping: false }).format(value);
}

export function formatPeriod(
  period: { start: string; end?: string; current: boolean } | undefined,
  locale: Locale,
  dateFormat: DateFormat
): string {
  if (!period) return "";
  const start = formatYearMonth(period.start, locale, dateFormat);
  const end = period.current ? LABELS[locale].present : formatYearMonth(period.end, locale, dateFormat);
  return [start, end].filter(Boolean).join(" – ");
}

/* ───────────── Links ───────────── */

/**
 * Returns the URL only for http(s) links. Published sites render user-supplied URLs,
 * so other schemes (javascript:, data:) are dropped.
 */
export function safeUrl(url: string | undefined): string | undefined {
  const trimmed = url?.trim();
  return trimmed && (/^https?:\/\/\S+$/i.test(trimmed) || isSampleAsset(trimmed)) ? trimmed : undefined;
}

/** Placeholder addresses used in sample content; they lead nowhere real. */
export const isDummyUrl = (href: string) => href === "#" || /^https?:\/\/([\w-]+\.)*example\.(com|ir|org)(\/|$)/i.test(href);

export function linkLabel(link: { type: LinkType; label?: string; url: string }, locale: Locale): string {
  if (link.type === "other") return link.label?.trim() || hostname(link.url);
  return LABELS[locale].linkTypes[link.type];
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Up to two initials, used when no avatar image is set. */
export function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
}
