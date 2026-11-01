// Site address (subdomain) rules: 3–30 chars, lowercase letters, digits and single hyphens,
// starting and ending with a letter or digit, and not a reserved platform name.

export const SUBDOMAIN_MIN = 3;
export const SUBDOMAIN_MAX = 30;

const RESERVED = new Set([
  "www", "api", "app", "admin", "administrator", "root", "mail", "email", "smtp", "ftp",
  "static", "assets", "cdn", "media", "files", "img", "s", "site", "sites",
  "dashboard", "panel", "login", "logout", "signup", "register", "account", "auth",
  "blog", "help", "support", "docs", "status", "about", "contact", "pricing", "billing", "pay",
  "dev", "test", "staging", "demo", "beta", "internal", "localhost",
]);

const fa = (n: number) => n.toLocaleString("fa-IR");

export type SubdomainCheck =
  | { ok: true; value: string }
  | { ok: false; code: "TOO_SHORT" | "TOO_LONG" | "INVALID_CHARS" | "RESERVED"; message: string };

export function validateSubdomain(raw: string): SubdomainCheck {
  const value = raw.trim().toLowerCase();
  if (value.length < SUBDOMAIN_MIN) {
    return { ok: false, code: "TOO_SHORT", message: `آدرس باید حداقل ${fa(SUBDOMAIN_MIN)} کاراکتر باشد` };
  }
  if (value.length > SUBDOMAIN_MAX) {
    return { ok: false, code: "TOO_LONG", message: `آدرس حداکثر ${fa(SUBDOMAIN_MAX)} کاراکتر می‌تواند باشد` };
  }
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value) || value.includes("--")) {
    return {
      ok: false,
      code: "INVALID_CHARS",
      message: "فقط حروف انگلیسی کوچک، عدد و خط تیره؛ بدون خط تیره در ابتدا، انتها یا پشت‌سرهم",
    };
  }
  if (RESERVED.has(value)) {
    return { ok: false, code: "RESERVED", message: "این آدرس رزرو شده است" };
  }
  return { ok: true, value };
}

/**
 * Extracts the site subdomain from a Host header for "<sub>.<rootDomain>".
 * Returns null for the root domain itself, other hosts, or nested subdomains.
 */
export function subdomainFromHost(host: string | undefined, rootDomain: string | undefined): string | null {
  if (!host || !rootDomain) return null;
  const hostname = host.split(":")[0]!.toLowerCase();
  const suffix = `.${rootDomain.toLowerCase()}`;
  if (!hostname.endsWith(suffix)) return null;
  const sub = hostname.slice(0, -suffix.length);
  return sub && !sub.includes(".") ? sub : null;
}
