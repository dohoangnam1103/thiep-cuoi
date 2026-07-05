import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const dir = await mkdtemp(join(tmpdir(), "google-user-linking-"));
const dbUrl = `file:${join(dir, "test.db")}`;

const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

try {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE User (
      id TEXT NOT NULL PRIMARY KEY,
      email TEXT UNIQUE,
      passwordHash TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const { findOrCreateGoogleUser } = await import(
    pathToFileURL(join(process.cwd(), "src/lib/auth/google-user.ts")).href
  );

  const existing = await prisma.user.create({
    data: { email: "couple@example.com", passwordHash: "hashed-password" },
  });

  const linked = await findOrCreateGoogleUser(prisma.user, "couple@example.com");
  if (linked.id !== existing.id) {
    throw new Error("Expected Google login to link the existing user by email");
  }
  if (linked.passwordHash !== "hashed-password") {
    throw new Error("Expected account linking to preserve the existing password hash");
  }

  const created = await findOrCreateGoogleUser(prisma.user, "new-couple@example.com");
  if (created.email !== "new-couple@example.com") {
    throw new Error("Expected Google login to create a user with the Google email");
  }
  if (created.passwordHash !== null) {
    throw new Error("Expected Google-created users to have no password hash");
  }

  const userCount = await prisma.user.count();
  if (userCount !== 2) {
    throw new Error(`Expected exactly 2 users, got ${userCount}`);
  }

  console.log("google user linking verified");
} finally {
  await prisma.$disconnect();
  await rm(dir, { recursive: true, force: true });
}
