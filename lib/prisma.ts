import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConfigured?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Enable SQLite WAL mode and busy timeout for high concurrency & preventing SQLITE_BUSY errors
if (!globalForPrisma.prismaConfigured) {
  globalForPrisma.prismaConfigured = true;
  prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
  prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000;").catch(() => {});
}

