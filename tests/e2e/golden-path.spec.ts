import { createHmac, randomUUID } from "node:crypto";

import { test, expect, type BrowserContext } from "@playwright/test";

import { getDb } from "./helpers/db";
import { cleanupUser } from "./helpers/fixtures";

const CASSO_CHECKSUM_KEY = "e2e-casso-token";
const TEMPLATE_NAME = "Double Happiness Red";
const TEMPLATE_ID = "song-hy-red";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function sortObjectByKey(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(sortObjectByKey);
  if (value !== null && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<{ [key: string]: JsonValue }>((sorted, key) => {
        sorted[key] = sortObjectByKey(value[key]);
        return sorted;
      }, {});
  }
  return value;
}

function signCasso(body: JsonValue): string {
  const timestamp = String(Date.now());
  const message = `${timestamp}.${JSON.stringify(sortObjectByKey(body))}`;
  const signature = createHmac("sha512", CASSO_CHECKSUM_KEY).update(message).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

function findUserId(email: string): string | undefined {
  const row = getDb().prepare("SELECT id FROM User WHERE email = ?").get(email) as
    | { id: string }
    | undefined;
  return row?.id;
}

function invitationTemplate(invitationId: string): string | undefined {
  const row = getDb()
    .prepare("SELECT templateId FROM Invitation WHERE id = ?")
    .get(invitationId) as { templateId: string } | undefined;
  return row?.templateId;
}

function pendingPayment(invitationId: string): { code: string; amount: number } | undefined {
  return getDb()
    .prepare(
      `SELECT code, amount
       FROM Payment
       WHERE invitationId = ? AND status = 'pending'
       ORDER BY createdAt DESC
       LIMIT 1`,
    )
    .get(invitationId) as { code: string; amount: number } | undefined;
}

function paidState(invitationId: string): { invitationPaid: number; paymentStatus: string } | undefined {
  return getDb()
    .prepare(
      `SELECT i.paid AS invitationPaid, p.status AS paymentStatus
       FROM Invitation i
       JOIN Payment p ON p.invitationId = i.id
       WHERE i.id = ?
       ORDER BY p.createdAt DESC
       LIMIT 1`,
    )
    .get(invitationId) as { invitationPaid: number; paymentStatus: string } | undefined;
}

test("real user creates, publishes, pays for, and shares an invitation", async ({
  page,
  request,
  browser,
}) => {
  test.setTimeout(90_000);

  const unique = randomUUID().slice(0, 8);
  const email = `golden-path-${unique}@e2e.test`;
  const brideName = `Quỳnh Anh ${unique}`;
  const groomName = `Gia Khánh ${unique}`;
  const address = `Trung tâm tiệc cưới E2E ${unique}`;
  const slug = `quynh-anh-gia-khanh-${unique}`;
  let userId: string | undefined;
  let guestContext: BrowserContext | undefined;

  try {
    await test.step("sign up through the UI", async () => {
      await page.goto("/signup");
      await page.locator("#email").fill(email);
      await page.locator("#password").fill("golden-path-123");
      await page.locator('button[type="submit"]').click();

      await page.waitForURL("**/dashboard");
      await expect(page.getByRole("heading", { name: "Thiệp của tôi" })).toBeVisible();
      userId = findUserId(email);
      expect(userId).toBeTruthy();
    });

    let invitationId = "";
    await test.step("choose a template and open its editor", async () => {
      await page.goto("/vi/templates");
      const templateCard = page.locator("main article").filter({
        has: page.getByRole("heading", { name: TEMPLATE_NAME, exact: true }),
      });
      await expect(templateCard).toHaveCount(1);
      await templateCard.getByRole("button", { name: "Xem trước" }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("heading", { name: "Xem trước mẫu thiệp" })).toBeVisible();
      await dialog.getByRole("button", { name: "Dùng mẫu này" }).click();

      await page.waitForURL("**/editor/**");
      invitationId = new URL(page.url()).pathname.split("/").filter(Boolean).at(-1) ?? "";
      expect(invitationId).not.toBe("");
      await expect.poll(() => invitationTemplate(invitationId)).toBe(TEMPLATE_ID);
    });

    await test.step("fill the form and publish the invitation", async () => {
      await page.locator("#brideFullName").fill(brideName);
      await page.locator("#groomFullName").fill(groomName);
      await page.locator("#brideShortName").fill("Quỳnh Anh");
      await page.locator("#groomShortName").fill("Gia Khánh");
      await page.locator("#date").fill("2026-12-20");
      await page.locator("#time").fill("18:00");
      await page.locator("#address").fill(address);
      await page.locator("#slug").fill(slug);

      await page.getByRole("button", { name: "Xuất bản thiệp" }).click();
      await page.waitForURL(`**/thiep/${slug}`);
      await expect(page.locator("main#top")).toBeVisible();
      await expect(page.getByText(brideName).first()).toBeAttached();
      await expect(page.getByText(groomName).first()).toBeAttached();
    });

    await test.step("open the payment screen and receive a signed Casso webhook", async () => {
      await page.goto("/dashboard");
      const invitationCard = page.locator("main li").filter({ hasText: groomName }).filter({ hasText: brideName });
      await expect(invitationCard).toHaveCount(1);
      await invitationCard.getByRole("link", { name: "Thanh toán", exact: true }).click();

      await expect(page.getByRole("heading", { name: "Thanh toán" })).toBeVisible();
      await expect(page.getByAltText("Mã QR chuyển khoản VietQR")).toBeVisible();

      await expect.poll(() => pendingPayment(invitationId)).toBeTruthy();
      const createdPayment = pendingPayment(invitationId);
      expect(createdPayment).toBeTruthy();
      if (!createdPayment) throw new Error("Payment was not created");
      await expect(page.getByText(createdPayment.code, { exact: true })).toBeVisible();

      const webhookBody = {
        error: 0,
        data: {
          id: Date.now(),
          description: `Thanh toan don hang ${createdPayment.code}`,
          amount: createdPayment.amount,
        },
      };
      const webhookResponse = await request.post("/api/casso/webhook", {
        headers: { "x-casso-signature": signCasso(webhookBody) },
        data: webhookBody,
      });
      expect(webhookResponse.ok()).toBeTruthy();

      await page.waitForURL("**/dashboard", { timeout: 15_000 });
      await expect(page.locator("main li").filter({ hasText: groomName }).getByText("Đã thanh toán")).toBeVisible();
      await expect.poll(() => paidState(invitationId)).toEqual({ invitationPaid: 1, paymentStatus: "paid" });
    });

    await test.step("open the public share link without a login session", async () => {
      const invitationCard = page.locator("main li").filter({ hasText: groomName }).filter({ hasText: brideName });
      const publicPath = await invitationCard.getByRole("link", { name: "Xem thiệp" }).getAttribute("href");
      expect(publicPath).toBe(`/thiep/${slug}`);

      guestContext = await browser.newContext({ locale: "vi-VN" });
      const guestPage = await guestContext.newPage();
      const response = await guestPage.goto(publicPath ?? "");

      expect(response?.ok()).toBeTruthy();
      expect(await guestContext.cookies()).toHaveLength(0);
      await expect(guestPage.locator("main#top")).toBeVisible();
      await expect(guestPage.getByText(brideName).first()).toBeAttached();
      await expect(guestPage.getByText(groomName).first()).toBeAttached();
      await expect(guestPage.getByText(address).first()).toBeAttached();
    });
  } finally {
    await guestContext?.close();
    userId ??= findUserId(email);
    if (userId) cleanupUser(userId);
  }
});
