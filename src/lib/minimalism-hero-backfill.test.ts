import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import Database from "better-sqlite3";

const migrationSql = readFileSync(
  new URL(
    "../../prisma/migrations/20260828103000_backfill_minimalism_hero_image/migration.sql",
    import.meta.url,
  ),
  "utf8",
);

const MINIMALISM_TEMPLATE_SLUGS = [
  "minimalism-dark-red",
  "minimalism-jade",
  "minimalism-sky-blue",
  "minimalism-powder-pink",
] as const;

function createFixtureDatabase(): Database.Database {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE "Invitation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "templateId" TEXT NOT NULL
    );
    CREATE TABLE "InvitationContent" (
      "invitationId" TEXT NOT NULL PRIMARY KEY,
      "heroImage" TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE "GalleryPhoto" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "invitationId" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL DEFAULT 0
    );
  `);
  return db;
}

test("Minimalism hero migration backfills the first ordered album photo only", () => {
  const db = createFixtureDatabase();
  const insertInvitation = db.prepare(
    `INSERT INTO "Invitation" ("id", "templateId") VALUES (?, ?)`,
  );
  const insertContent = db.prepare(
    `INSERT INTO "InvitationContent" ("invitationId", "heroImage") VALUES (?, ?)`,
  );
  const insertPhoto = db.prepare(
    `INSERT INTO "GalleryPhoto" ("id", "invitationId", "url", "sortOrder") VALUES (?, ?, ?, ?)`,
  );

  for (const [index, templateId] of MINIMALISM_TEMPLATE_SLUGS.entries()) {
    const invitationId = `minimalism-${index}`;
    insertInvitation.run(invitationId, templateId);
    insertContent.run(invitationId, "");
    insertPhoto.run(`${invitationId}-later`, invitationId, `/${templateId}-later.webp`, 2);
    insertPhoto.run(`${invitationId}-first`, invitationId, `/${templateId}-first.webp`, 0);
  }

  insertInvitation.run("explicit", "minimalism-dark-red");
  insertContent.run("explicit", "/chosen.webp");
  insertPhoto.run("explicit-first", "explicit", "/album.webp", 0);

  insertInvitation.run("other-template", "song-hy-red");
  insertContent.run("other-template", "");
  insertPhoto.run("other-first", "other-template", "/other.webp", 0);

  insertInvitation.run("no-gallery", "minimalism-jade");
  insertContent.run("no-gallery", "");

  db.exec(migrationSql);
  db.exec(migrationSql);

  const heroFor = db.prepare(
    `SELECT "heroImage" FROM "InvitationContent" WHERE "invitationId" = ?`,
  );
  for (const [index, templateId] of MINIMALISM_TEMPLATE_SLUGS.entries()) {
    assert.equal(
      (heroFor.get(`minimalism-${index}`) as { heroImage: string }).heroImage,
      `/${templateId}-first.webp`,
    );
  }
  assert.equal((heroFor.get("explicit") as { heroImage: string }).heroImage, "/chosen.webp");
  assert.equal((heroFor.get("other-template") as { heroImage: string }).heroImage, "");
  assert.equal((heroFor.get("no-gallery") as { heroImage: string }).heroImage, "");

  db.close();
});
