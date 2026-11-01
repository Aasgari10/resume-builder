// Loads apps/api/.env (Node 20.12+). Missing file is fine; system env vars are used instead.
try {
  process.loadEnvFile();
} catch {
  // no .env file
}

const isProd = process.env.NODE_ENV === "production";

function sessionSecret(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (isProd) throw new Error("SESSION_SECRET must be at least 32 characters");
  console.warn("⚠️  SESSION_SECRET is not set; using a development fallback. Set it before deploying.");
  return "dev-only-secret-do-not-use-in-production-0000";
}

export const env = {
  isProd,
  port: Number(process.env.PORT ?? 4000),
  sessionSecret: sessionSecret(),
  // Outside production, return the OTP code in the API response so login works without SMS.
  otpDevEcho: !isProd && process.env.OTP_DEV_ECHO !== "false",
  // Sites are served at <subdomain>.<rootDomain> when set (e.g. "example.ir", or "localhost" in development).
  // They are always reachable at /s/<subdomain> as well.
  rootDomain: process.env.ROOT_DOMAIN?.trim().toLowerCase() || undefined,
};

/** Public URL of a site on its own subdomain, or undefined when no root domain is configured. */
export function siteUrl(subdomain: string): string | undefined {
  if (!env.rootDomain) return undefined;
  const protocol = env.isProd ? "https" : "http";
  const port = env.isProd ? "" : `:${env.port}`;
  return `${protocol}://${subdomain}.${env.rootDomain}${port}`;
}
