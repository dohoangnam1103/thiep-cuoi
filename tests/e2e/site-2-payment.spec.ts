import { createHmac } from "node:crypto";

import { test, expect } from "@playwright/test";

// Site-2 payment in sandbox mode: order lifecycle and webhook isolation.
// No real charge, no real credentials, isolated test database.

const CHECKSUM_KEY = "e2e-sandbox-checksum-key";

function signSandboxEvent(data: Record<string, string | number>): string {
  const payload = Object.keys(data)
    .sort()
    .map((key) => `${key}=${String(data[key])}`)
    .join("&");
  return createHmac("sha256", CHECKSUM_KEY).update(payload).digest("hex");
}

async function registerAndCreateInvitation(page, email: string) {
  await page.goto("/dang-nhap?mode=register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByLabel("Tạo thiệp mới").selectOption("jasmine-white");
  await page.getByRole("button", { name: "Tạo thiệp" }).click();
  await expect(page).toHaveURL(/\/editor\//);
  return new URL(page.url()).pathname.split("/").pop() ?? "";
}

test("payment sandbox creates an order with a scannable QR", async ({
  page,
}) => {
  const invitationId = await registerAndCreateInvitation(
    page,
    `site2-pay-${Date.now()}@example.com`,
  );
  await page.goto("/dashboard");
  await page
    .getByTestId("invitation-card")
    .first()
    .getByRole("link", { name: "Thanh toán" })
    .click();
  await expect(page).toHaveURL(/\/thanh-toan/);

  await expect(page.getByText("99.000 ₫")).toBeVisible();
  await page.getByRole("button", { name: "Tạo đơn thanh toán" }).click();
  const code = await page.getByText(/S2-/).first().textContent();
  expect(code).toMatch(/S2-/);
  await expect(page.getByRole("img", { name: "Mã QR thanh toán" })).toBeVisible();
  await expect(page.getByText("Chờ thanh toán")).toBeVisible();
  expect(invitationId).not.toBe("");
});

test("payment sandbox settles an order through the webhook", async ({
  page,
  request,
}) => {
  const invitationId = await registerAndCreateInvitation(
    page,
    `site2-payhook-${Date.now()}@example.com`,
  );
  await page.goto(`/dashboard/${invitationId}/thanh-toan`);
  await page.getByRole("button", { name: "Tạo đơn thanh toán" }).click();
  const code = (await page.getByText(/S2-/).first().textContent())?.trim() ?? "";
  expect(code).toMatch(/^S2-/);

  const data = { orderCode: `SBX-${code}`, amount: 99000, status: "PAID" };
  const response = await request.post("/api/payos/webhook", {
    data: { data, signature: signSandboxEvent(data) },
  });
  expect(response.ok()).toBe(true);

  await page.goto(`/dashboard/${invitationId}/thanh-toan`);
  await expect(page.getByText("Đã thanh toán")).toBeVisible();
});

test("payment webhook rejects forged and foreign events", async ({
  request,
}) => {
  const forged = await request.post("/api/payos/webhook", {
    data: {
      data: { orderCode: "SBX-nope", amount: 99000, status: "PAID" },
      signature: "0".repeat(64),
    },
  });
  expect(forged.status()).toBe(401);

  const foreignData = { orderCode: "1789440000000", amount: 99000, status: "PAID" };
  const foreign = await request.post("/api/payos/webhook", {
    data: { data: foreignData, signature: signSandboxEvent(foreignData) },
  });
  expect(foreign.ok()).toBe(true);
  expect(await foreign.json()).toMatchObject({ ok: true, ignored: true });
});
