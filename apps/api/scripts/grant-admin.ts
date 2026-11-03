// Grants or revokes the ADMIN role for an existing user.
// Usage: npm run admin:grant -w @rb/api -- 09121234567 [--revoke]

import "../src/env";
import { prisma } from "../src/db";
import { normalizeIranPhone } from "../src/lib/phone";

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes("--revoke");
  const raw = args.find((a) => !a.startsWith("--"));
  const phone = raw ? normalizeIranPhone(raw) : null;
  if (!phone) {
    console.error("Usage: npm run admin:grant -w @rb/api -- 09121234567 [--revoke]");
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    console.error(`No user with phone ${phone}. Log in once with this number first.`);
    process.exitCode = 1;
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { role: revoke ? "USER" : "ADMIN" } });
  console.log(revoke ? `✅ ${phone} is no longer an admin` : `✅ ${phone} is now an admin`);
}

main().finally(() => prisma.$disconnect());
