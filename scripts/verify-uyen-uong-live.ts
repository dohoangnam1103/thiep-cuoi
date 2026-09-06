import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { chromium } from "playwright";
import { SignJWT } from "jose";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { manifest } from "../src/data/templates/uyen-uong.manifest";
import { fromDemoContent } from "../src/lib/from-demo-content";

async function main() {
loadEnvConfig(process.cwd());
const base = "http://localhost:3000";
assert.equal(process.env.DATABASE_URL, "file:./dev.db", "Only the local development database is allowed");
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: "file:./dev.db" }) });
const browser = await chromium.launch();
let userId: string | undefined;
try {
  const user = await db.user.create({ data: { email: `uyen-audit-${Date.now()}@example.invalid`, passwordHash: "" } });
  userId = user.id;
  const seed = fromDemoContent(manifest.demoContent);
  const invitation = await db.invitation.create({ data: {
    userId, templateId: "uyen-uong", slug: `uyen-audit-${Date.now()}`, status: "published", publishedAt: new Date(),
    content: { create: { ...seed.content, brideFirst: true,
      brideShortName: "Nguyễn Thị Hoàng Ngọc Uyên", groomShortName: "Trần Nguyễn Hoàng Minh Quân",
      brideAddress: "Gia đình cô dâu tại số 123 đường Nguyễn Thị Minh Khai, Thành phố Hồ Chí Minh, Việt Nam",
      showHeroImage: false, dressCodeColors: "", address: "", mapAddress: "",
      brideBankName: "", brideAccountNumber: "", brideAccountName: "",
      groomBankName: "", groomAccountNumber: "", groomAccountName: "",
    } },
  } });
  const page = await browser.newPage({ viewport: { width: 320, height: 844 }, reducedMotion: "reduce", locale: "vi-VN" });
  page.setDefaultTimeout(15000);
  await page.goto(`${base}/thiep/${invitation.slug}`, { waitUntil: "networkidle" });
  await page.locator("[data-uyen-cover]").screenshot({ path: "docs/research/uyen-uong/320-long-cover.png" });
  await page.locator("[data-uyen-cover]").getByRole("button", { name: "Mở thiệp" }).click();
  await page.waitForTimeout(3500);
  const toggle = page.getByTestId("invitation-auto-scroll-toggle");
  if (await toggle.getAttribute("aria-pressed") === "true") await toggle.click();
  await page.mouse.wheel(0, 1);
  const article = page.locator('[data-template="uyen-uong"]');
  const names = await article.locator("h1").innerText();
  assert.ok(names.startsWith("Nguyễn Thị Hoàng Ngọc Uyên"));
  for (const name of ["portrait", "album", "dress", "gifts", "location", "schedule"]) assert.equal(await article.locator(`[data-uyen-section="${name}"]`).count(), 0, `${name} hides when empty`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.locator('[data-uyen-section="hero"]').screenshot({ path: "docs/research/uyen-uong/320-long-hero.png" });
  const form = article.locator('form').filter({ has: page.locator('textarea[name="text"]') });
  await form.getByRole("button", { name: "Gửi lời chúc" }).click();
  assert.equal(await db.wish.count({ where: { invitationId: invitation.id } }), 0, "Empty wish is rejected");
  await form.locator('input[name="name"]').fill("Khách Kiểm Tra");
  await form.locator('textarea[name="text"]').fill("Chúc hai bạn hạnh phúc.");
  await form.getByRole("button", { name: "Gửi lời chúc" }).click();
  await page.waitForFunction(() => document.body.innerText.includes("Cảm ơn lời chúc của bạn!"));
  assert.equal(await db.wish.count({ where: { invitationId: invitation.id } }), 1);
  const rsvp = article.locator('form').filter({ has: page.locator('select[name="attending"]') });
  await rsvp.locator('input[name="name"]').fill("Khách Kiểm Tra");
  await rsvp.locator('select[name="attending"]').selectOption("yes");
  await rsvp.locator('input[name="guests"]').fill("2");
  await rsvp.locator('button[type="submit"]').click();
  for (let i = 0; i < 30; i++) { if (await db.rsvp.count({ where: { invitationId: invitation.id } })) break; await page.waitForTimeout(200); }
  const saved = await db.rsvp.findFirst({ where: { invitationId: invitation.id } });
  assert.equal(saved?.attending, true); assert.equal(saved?.guests, 2);
  await page.locator('[data-uyen-section="guestbook"]').screenshot({ path: "docs/research/uyen-uong/320-live-forms.png" });
  const secret = process.env.SESSION_SECRET;
  assert.ok(secret);
  const token = await new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(secret));
  await page.context().addCookies([{ name: "session", value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
  const response = await page.goto(`${base}/editor/${invitation.id}`, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200);
  assert.ok(page.url().includes(`/editor/${invitation.id}`));
  await writeFile("docs/research/uyen-uong/live-audit.json", JSON.stringify({ at: new Date().toISOString(), localOnly: true, longNames320px: true, brideFirst: true, emptySections: true, wishValidation: true, wishPersisted: true, rsvpPersisted: { attending: saved.attending, guests: saved.guests }, editorAccess: true, fixturesDeletedOnExit: true }, null, 2));
  console.log("Passed local published invitation: long names, empty sections, wish validation/persistence, RSVP persistence, editor access.");
} finally {
  await browser.close();
  if (userId) await db.user.delete({ where: { id: userId } });
  await db.$disconnect();
}

}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
