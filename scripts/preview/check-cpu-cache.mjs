// Integration regression against a production build and a DISPOSABLE local DB.
// Never point this at the preview/production database: it creates test fixtures.
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { chromium, expect } from "@playwright/test";
import { SignJWT } from "jose";

const origin = process.env.CPU_TEST_ORIGIN ?? "http://localhost:3107";
const dbPath = process.env.CPU_TEST_DB;
const secret = process.env.CPU_TEST_SECRET;
assert.equal(new URL(origin).hostname, "localhost");
assert.ok(dbPath?.startsWith("/tmp/thiepmung-cpu-check."), "Use an isolated mktemp DB");
assert.ok(secret, "Supply the test server's session secret");
const db = new Database(dbPath, { fileMustExist: true });
const suffix = Date.now().toString(36);
const userId = `cpu-user-${suffix}`;
const adminId = `cpu-admin-${suffix}`;
const invitationId = `cpu-inv-${suffix}`;
const demoId = db.prepare("SELECT id FROM Invitation WHERE isDemo=1 AND templateId='dragon-phoenix-v3-red' ORDER BY createdAt LIMIT 1").get()?.id ?? `cpu-demo-${suffix}`;
const slug = `cpu-fresh-${suffix}`;
const now = new Date().toISOString();
const sourceSlug = "dragon-phoenix-v3-red";
const demo = "/mau-thiep/long-phung-v3-do/demo";
db.prepare("INSERT INTO User(id,email,createdAt) VALUES(?,?,?)").run(userId, `${userId}@example.test`, now);
db.prepare("INSERT INTO Admin(id,email,passwordHash,isSuperAdmin,createdAt) VALUES(?,?,?,?,?)")
  .run(adminId, `${adminId}@example.test`, "not-a-password", 1, now);
for (const [id, publishedSlug, isDemo] of [[invitationId, slug, 0], [demoId, null, 1]]) {
  if (db.prepare("SELECT id FROM Invitation WHERE id=?").get(id)) continue;
  db.prepare("INSERT INTO Invitation(id,userId,slug,templateId,status,paid,isDemo,publishedAt,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?,?,?)")
    .run(id, userId, publishedSlug, sourceSlug, "published", 1, isDemo, now, now, now);
  db.prepare("INSERT INTO InvitationContent(id,invitationId,brideFullName,groomFullName,date,time) VALUES(?,?,?,?,?,?)")
    .run(`${id}-content`, id, "CPU Bride Before", "CPU Groom", "2027-10-12", "11:00");
}
for (const letter of ["A", "B"]) {
  db.prepare("INSERT INTO Guest(id,invitationId,token,name,createdAt) VALUES(?,?,?,?,?)")
    .run(`cpu-guest-${letter}-${suffix}`, invitationId, `${letter}-${suffix}`, `CPU Guest ${letter}`, now);
}
const paymentCode = `CPU${suffix}`;
db.prepare("INSERT INTO Payment(id,invitationId,code,amount,status,provider,createdAt) VALUES(?,?,?,?,?,?,?)")
  .run(`cpu-payment-${suffix}`, invitationId, paymentCode, 123000, "pending", "casso", now);
const browser = await chromium.launch({ headless: true });
const admin = await browser.newContext();
const errors = [];
function inspectResponses(context) {
  context.on("response", (response) => {
    if (response.status() >= 500 && !response.url().includes("/_next/image")) {
      errors.push(`HTTP ${response.status()} ${response.url()}`);
    }
  });
}
inspectResponses(admin);
await admin.route(/googletagmanager|google-analytics/, (route) => route.abort());
const token = await new SignJWT({ adminId }).setProtectedHeader({ alg: "HS256" })
  .setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(secret));
await admin.addCookies([{ name: "admin_session", value: token, url: origin, httpOnly: true }]);
const page = await admin.newPage();
page.on("pageerror", (error) => errors.push(error.message));

async function read(path) {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.ok(!html.includes("NEXT_ERROR_CODE"), `No server error: ${path}`);
  return { html, cache: response.headers.get("x-nextjs-cache"), policy: response.headers.get("cache-control"), bytes: Buffer.byteLength(html) };
}
async function cached(path) {
  await read(path);
  const result = await read(path);
  assert.equal(result.cache, "HIT", path);
  return result;
}
function fresh(result) {
  assert.notEqual(result.cache, "HIT");
  assert.match(result.policy, /no-store/);
}
try {
  // Real server actions invalidate already-warm public HTML for another visitor.
  await cached("/bang-gia");
  await page.goto(`${origin}/admin/vouchers`);
  await page.locator("#productPrice").fill("123000");
  await page.locator("#repeatCustomerPrice").fill("87000");
  await page.getByRole("button", { name: "Lưu giá", exact: true }).click();
  await expect(page.getByText("Đã cập nhật giá sản phẩm.", { exact: true })).toBeVisible();
  assert.match((await read("/bang-gia")).html, /123[.,]000/);
  await cached("/bang-gia");
  await page.locator("#productPrice").fill("124000");
  await page.getByRole("button", { name: "Lưu giá", exact: true }).click();
  await expect.poll(() => db.prepare("SELECT productPrice FROM AppConfig WHERE id='default'").get().productPrice).toBe(124000);
  await expect(page.getByRole("button", { name: "Lưu giá", exact: true })).toBeEnabled();
  assert.match((await read("/bang-gia")).html, /124[.,]000/);
  console.log("PASS price action invalidates warm HTML immediately for guests");

  await cached("/");
  await cached(demo);
  await page.goto(`${origin}/admin/demos`);
  await page.getByRole("button", { name: "Đổi tên", exact: true }).last().click();
  const nameInput = page.locator(`#template-name-${sourceSlug}`);
  await nameInput.fill(`CPU Renamed ${suffix}`);
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(nameInput).toHaveCount(0);
  assert.ok((await read(demo)).html.includes(`CPU Renamed ${suffix}`));
  assert.ok((await read("/")).html.includes(`CPU Renamed ${suffix}`));
  console.log("PASS rename invalidates Home and demo metadata");

  await page.goto(`${origin}/admin/demos/${demoId}`);
  await page.locator("#brideFullName").fill(`CPU Demo Updated ${suffix}`);
  await page.locator('button[type="submit"]').last().click();
  await expect.poll(() => db.prepare("SELECT brideFullName FROM InvitationContent WHERE invitationId=?").get(demoId).brideFullName.toLowerCase()).toBe(`cpu demo updated ${suffix}`);
  await expect(page.locator('button[type="submit"]').last()).toBeEnabled();
  assert.ok((await read(demo)).html.toLowerCase().includes(`cpu demo updated ${suffix}`));
  console.log("PASS demo save invalidates data and HTML together");

  const legacy = await fetch(`${origin}${demo}?capture=1`, { redirect: "manual" });
  assert.equal(legacy.status, 307);
  assert.equal(new URL(legacy.headers.get("location"), origin).pathname, `${demo}/capture`);
  const capture = await read(`${demo}/capture`);
  fresh(capture);
  assert.ok(capture.html.includes('data-capture-mode="true"'));
  assert.ok(!capture.html.includes('data-ga-param-source="template_demo"'));
  const ordinary = await cached(demo);
  assert.ok(!ordinary.html.includes('data-capture-mode="true"'));
  assert.ok(ordinary.html.includes('data-ga-param-source="template_demo"'));
  console.log("PASS legacy capture redirect; dynamic capture cannot poison normal demo cache");

  await page.goto(`${origin}/admin/settings`);
  const toggle = page.getByRole("switch", { name: "Bìa thiệp 3D", exact: true });
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  assert.ok((await read(demo)).html.includes('data-envelope-renderer="3d"'));
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  assert.ok((await read(demo)).html.includes('data-envelope-renderer="2d"'));
  console.log("PASS cover toggle invalidates cached demos in both directions");

  const published = `/thiep/${slug}`;
  fresh(await read(published));
  db.prepare("UPDATE InvitationContent SET brideFullName=? WHERE invitationId=?").run(`CPU Published Updated ${suffix}`, invitationId);
  const changed = await read(published);
  fresh(changed);
  assert.ok(changed.html.includes(`CPU Published Updated ${suffix}`));
  const guestA = await read(`${published}?g=A-${suffix}`);
  const guestB = await read(`${published}?g=B-${suffix}`);
  fresh(guestA); fresh(guestB);
  assert.ok(guestA.html.includes("CPU Guest A") && !guestA.html.includes("CPU Guest B"));
  assert.ok(guestB.html.includes("CPU Guest B") && !guestB.html.includes("CPU Guest A"));
  console.log("PASS published edits are fresh; personalized guest responses remain isolated/no-store");

  const userToken = await new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h").sign(new TextEncoder().encode(secret));
  const cookie = { Cookie: `session=${userToken}` };
  const statusUrl = `${origin}/api/payment/${paymentCode}/status`;
  const initial = await fetch(statusUrl, { headers: cookie });
  assert.match(initial.headers.get("cache-control"), /no-store/);
  assert.equal((await initial.json()).status, "pending");
  db.prepare("UPDATE Payment SET status='paid' WHERE code=?").run(paymentCode);
  assert.equal((await (await fetch(statusUrl, { headers: cookie })).json()).status, "paid");
  const unauth = await fetch(statusUrl, { redirect: "manual" });
  assert.ok([303, 307, 401, 403].includes(unauth.status));
  console.log("PASS payment status remains authenticated and fresh (no provider calls)");

  // The local server must use PAYMENT_PROVIDER=casso. Existing fixtures prevent
  // payment creation, and browser status/QR requests never contact a provider.
  db.prepare("UPDATE Invitation SET paid=0 WHERE id=?").run(invitationId);
  db.prepare("UPDATE Payment SET status='pending' WHERE code=?").run(paymentCode);
  const account = await browser.newContext();
  inspectResponses(account);
  await account.addCookies([{ name: "session", value: userToken, url: origin, httpOnly: true }]);
  await account.route(/googletagmanager|google-analytics/, (route) => route.abort());
  await account.route(/\/api\/(payment\/.*\/qr|vietqr)/, (route) => route.abort());
  let polls = 0;
  let pollStatus = "pending";
  await account.route(`**/api/payment/${paymentCode}/status`, async (route) => {
    polls++;
    await route.fulfill({ json: { status: pollStatus } });
  });
  const checkout = await account.newPage();
  checkout.on("pageerror", (error) => errors.push(error.message));
  await checkout.clock.install();
  await checkout.goto(`${origin}/dashboard/${invitationId}/thanh-toan`);
  await expect(checkout.getByText(paymentCode, { exact: true }).first()).toBeVisible();
  await checkout.clock.fastForward(4000);
  await expect.poll(() => polls).toBe(1);
  await checkout.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await checkout.clock.fastForward(60000);
  assert.equal(polls, 1);
  pollStatus = "paid";
  await checkout.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(checkout).toHaveURL(`${origin}/dashboard`);
  assert.equal(polls, 2);
  console.log("PASS real checkout poller pauses when hidden and handles paid immediately on return");

  const guest = await browser.newContext();
  inspectResponses(guest);
  await guest.route(/googletagmanager|google-analytics/, (route) => route.abort());
  const visitor = await guest.newPage();
  visitor.on("pageerror", (error) => errors.push(error.message));
  visitor.on("console", (message) => {
    if (message.type() === "error" && /MISSING_MESSAGE|INVALID_MESSAGE|IntlError/.test(message.text())) errors.push(message.text());
  });
  for (const path of ["/", "/bang-gia", "/mau-thiep", "/help", "/cong-cu", "/chinh-sach-bao-mat", "/blog", "/home-2/lab/v11", `${demo}/capture`, published]) {
    const response = await visitor.goto(`${origin}${path}`);
    assert.equal(response.status(), 200, path);
    await expect(visitor.locator("body")).not.toBeEmpty();
  }
  assert.deepEqual(errors, []);
  console.log("PASS scoped translations and fallback route groups hydrate without runtime errors");
  console.log(JSON.stringify({ home: await cached("/"), pricing: await cached("/bang-gia"), demo: await cached(demo) }, (key, value) => key === "html" ? undefined : value, 2));
} finally {
  await browser.close();
  db.close();
}
