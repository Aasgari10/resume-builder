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

type PaymentConfig =
  | { provider: "zarinpal"; merchantId: string; sandbox: boolean }
  | { provider: "fake" };

// "fake" is a local stand-in gateway for development; production must use a real provider.
function paymentConfig(): PaymentConfig {
  const provider = process.env.PAYMENT_PROVIDER?.trim() || (isProd ? "zarinpal" : "fake");
  if (provider === "fake") {
    if (isProd) throw new Error("PAYMENT_PROVIDER=fake is not allowed in production");
    return { provider };
  }
  if (provider === "zarinpal") {
    const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim();
    if (!merchantId) throw new Error("ZARINPAL_MERCHANT_ID is required when PAYMENT_PROVIDER=zarinpal");
    return { provider, merchantId, sandbox: process.env.ZARINPAL_SANDBOX === "true" };
  }
  throw new Error(`Unknown PAYMENT_PROVIDER: ${provider}`);
}

export const env = {
  isProd,
  // Public origin of the web app; used for gateway callback and post-payment redirects.
  appUrl: (process.env.APP_URL?.trim() || "http://localhost:5173").replace(/\/+$/, ""),
  payment: paymentConfig(),
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
