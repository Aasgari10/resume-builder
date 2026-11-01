import { PrismaClient } from "@prisma/client";

// Single shared client. Cached on globalThis so `tsx watch` reloads
// do not open a new connection pool on every restart.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
