import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

// Runs inside the webServer command, BEFORE `next start`, so the test db
// exists before the server boots. Playwright starts webServer before globalSetup,
// which is why db prep lives here and not in global-setup.
const DATA_DIR = path.join(process.cwd(), "tests/e2e/.data");
const TEST_DB_URL = "file:./tests/e2e/.data/test.db";

async function main() {
  rmSync(DATA_DIR, { recursive: true, force: true });
  mkdirSync(DATA_DIR, { recursive: true });

  // Prisma 7.8's SQLite schema engine can exit with an empty "Schema engine
  // error" on macOS unless its Rust log level is initialized.
  const env = { ...process.env, DATABASE_URL: TEST_DB_URL, RUST_LOG: "info" };
  execSync(`npx prisma db push --url ${TEST_DB_URL} --accept-data-loss`, {
    stdio: "inherit",
    env,
  });

  const { PrismaClient } = await import("../../src/generated/prisma/client");
  const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
  const bcrypt = (await import("bcryptjs")).default;

  const adapter = new PrismaBetterSqlite3({ url: TEST_DB_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.appConfig.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", productPrice: 150000, repeatCustomerPrice: 99000 },
    });

    const adminHash = await bcrypt.hash("admin123456", 10);
    await prisma.admin.upsert({
      where: { email: "admin@e2e.test" },
      update: { passwordHash: adminHash, isSuperAdmin: true },
      create: { email: "admin@e2e.test", passwordHash: adminHash, isSuperAdmin: true },
    });

    const userHash = await bcrypt.hash("user123456", 10);
    await prisma.user.upsert({
      where: { email: "user@e2e.test" },
      update: { passwordHash: userHash },
      create: { email: "user@e2e.test", passwordHash: userHash },
    });
    console.log("[prepare-db] test db ready");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("[prepare-db] failed", e);
  process.exit(1);
});
