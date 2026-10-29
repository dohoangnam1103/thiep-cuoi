import { createHmac, randomUUID } from "node:crypto";

import { test, expect, type BrowserContext } from "@playwright/test";

import { loginAsUser } from "./helpers/auth";
import { getDb } from "./helpers/db";
import { cleanupUser, createUser } from "./helpers/fixtures";

const CASSO_CHECKSUM_KEY = "e2e-casso-token";
const TEMPLATE_NAME = "Song Hỷ Đỏ";
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
  context,
  request,
  browser,
}) => {
  test.setTimeout(90_000);

  const unique = randomUUID().slice(0, 8);
  const email = `golden-path-${unique}@e2e.test`;
  const brideName = `Quỳnh Anh ${unique}`;
  const groomName = `Gia Khánh ${unique}`;
  const address = `Trung tâm tiệc cưới E2E ${unique}`;
  let slug = "";
  let userId: string | undefined;
  let guestContext: BrowserContext | undefined;

  try {
    await test.step("sign in", async () => {
      // Auth is Google-SSO only, so the browser cannot complete a real sign-up.
      // Seed the account and forge its session cookie, as the other specs do.
      userId = createUser({ email }).id;
      await loginAsUser(context, userId);
      await page.goto("/dashboard");
      await expect(page.getByRole("heading", { name: "Thiệp của tôi" })).toBeVisible();
    });

    let invitationId = "";
    await test.step("choose a template and open its editor", async () => {
      await page.goto("/mau-thiep");
      const templateCard = page.locator("main article").filter({
        has: page.getByRole("heading", { name: TEMPLATE_NAME, exact: true }),
      });
      await expect(templateCard).toHaveCount(1);
      await templateCard.getByRole("button", { name: "CHỌN THIỆP" }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("heading", { name: TEMPLATE_NAME, exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: "TẠO THIỆP" }).click();

      await page.waitForURL("**/editor2/**");
      invitationId = new URL(page.url()).pathname.split("/").filter(Boolean).at(-1) ?? "";
      expect(invitationId).not.toBe("");
      await expect.poll(() => invitationTemplate(invitationId)).toBe(TEMPLATE_ID);
    });

    await test.step("edit inline and publish the invitation", async () => {
      await page.getByLabel("Họ tên cô dâu", { exact: true }).fill(brideName);
      await page.getByLabel("Họ tên chú rể", { exact: true }).fill(groomName);
      await page.getByLabel("Ngày cưới", { exact: true }).fill("20/12/2026");
      await page.getByRole("button", { name: "Bắt đầu chỉnh sửa trên thiệp", exact: true }).click();

      await page.getByRole("button", { name: "Nội dung", exact: true }).click();
      await page.getByRole("button", { name: "Thời gian tiệc cưới", exact: true }).click();
      await page.getByLabel("Giờ tiệc", { exact: true }).fill("18:00");
      await page.getByRole("button", { name: "Xong", exact: true }).click();
      await page.getByRole("button", { name: "Nội dung", exact: true }).click();
      await page.getByRole("button", { name: "Địa điểm tổ chức", exact: true }).click();
      await page.getByLabel("Địa chỉ địa điểm", { exact: true }).fill(address);
      await page.getByRole("button", { name: "Xong", exact: true }).click();
      await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
      await expect(page.getByRole("dialog").getByRole("heading", { name: "Thiệp đã xuất bản!" })).toBeVisible();

      // The inline editor chooses the public slug from the couple's names.
      const published = getDb().prepare("SELECT slug FROM Invitation WHERE id = ?").get(invitationId) as { slug: string };
      expect(published.slug).toBeTruthy();
      slug = published.slug;
      await page.goto(`/thiep/${slug}`);
      await expect(page.locator("main#top")).toBeVisible();
      // The cover only shows the short names; the full names live inside the
      // invitation body, which mounts after "Mở thiệp".
      // The 3D envelope canvas sits over the button, so dispatch the click
      // directly instead of a real pointer press.
      await page.locator("[data-open-invitation-control]").evaluate((button) => {
        (button as HTMLButtonElement).click();
      });
      await expect(page.getByText(brideName).first()).toBeAttached();
      await expect(page.getByText(groomName).first()).toBeAttached();
    });

    await test.step("open the payment screen and receive a signed Casso webhook", async () => {
      await page.goto("/dashboard");
      const invitationCard = page.locator("main li").filter({ hasText: groomName }).filter({ hasText: brideName });
      await expect(invitationCard).toHaveCount(1);
      await invitationCard.getByRole("link", { name: "Thanh toán ngay" }).click();

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
      // Google Analytics sets its own `_ga*` cookies; what matters is that the
      // guest carries no auth session.
      const guestCookies = await guestContext.cookies();
      expect(guestCookies.map((cookie) => cookie.name)).not.toContain("session");
      await expect(guestPage.locator("main#top")).toBeVisible();
      await guestPage.locator("[data-open-invitation-control]").evaluate((button) => {
        (button as HTMLButtonElement).click();
      });
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
