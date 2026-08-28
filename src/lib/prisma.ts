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
  /**
   * Turbopack giữ `globalThis.prisma` qua hot reload. Nếu vừa chạy
   * `prisma generate` để thêm model thì client cũ không có delegate mới (ví dụ
   * `emailDelivery`) dù TypeScript đã thấy nó. Giữ constructor để thay client
   * đang cache khi module generated được nạp lại.
   */
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
