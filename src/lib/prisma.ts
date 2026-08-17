import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

function createClient() {
  // better-sqlite3's default busy timeout is 5s; concurrent webhook settlement,
  // ISR revalidation and page reads can exceed it under load and surface as
  // P1008 (SQLITE_BUSY). Give writers more time to hand the lock over.
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl, timeout: 15_000 });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
