import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../generated/prisma/client";

// Site-2 database is fully independent from master. Inside the container it
// lives at file:/app/data/prod.db (host: /srv/chungdoi-site2/data). The local
// fallback intentionally uses a distinct filename so no command ever opens
// the master dev.db by accident.
const databaseUrl = process.env.DATABASE_URL ?? "file:./dev-site2.db";

function createClient() {
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl, timeout: 15_000 });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
  prismaConstructor?: unknown;
};

const isDevelopment = process.env.NODE_ENV !== "production";
const cachedPrisma = globalForPrisma.prisma;
const canReuseClient =
  cachedPrisma &&
  (!isDevelopment || globalForPrisma.prismaConstructor === PrismaClient);

export const prisma = canReuseClient && cachedPrisma ? cachedPrisma : createClient();

if (isDevelopment) {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaConstructor = PrismaClient;
}
