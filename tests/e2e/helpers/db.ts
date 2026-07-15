import Database from "better-sqlite3";
import path from "node:path";

// Same isolated db the webServer uses. Tests read/write it directly for setup + assertions.
// We use better-sqlite3 directly (not the generated Prisma client) because the Prisma 7
// client uses `import.meta` (ESM) which Playwright's CJS transform cannot load.
export const TEST_DB_URL = "file:./tests/e2e/.data/test.db";
const DB_PATH = path.join(process.cwd(), "tests/e2e/.data/test.db");

let db: Database.Database | undefined;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { timeout: 5_000 });
    db.pragma("journal_mode = WAL");
  }
  return db;
}

/** Prisma stores DateTime as ISO text with a +00:00 offset (not a trailing Z). */
export function prismaNow(d: Date = new Date()): string {
  return d.toISOString().replace("Z", "+00:00");
}
