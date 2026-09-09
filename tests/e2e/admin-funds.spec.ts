import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import vi from "../../messages/vi.json";
import { loginAsAdmin } from "./helpers/auth";
import { getDb, prismaNow } from "./helpers/db";
import { cleanupUser, createInvitation, createPayment, createUser, seededAdminId } from "./helpers/fixtures";

const copy = vi.adminFunds;

type FundTotals = {
  revenue: number;
  withdrawn: number;
  taxReserve: number;
  remaining: number;
};

function formatVnd(amount: number, suffix = "₫"): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}${suffix}`;
}

function seedFundScenario(exhaustAvailable = false) {
  const db = getDb();
  return db.transaction(() => {
    // Other specs may have their own paid rows; preserve them and assert the
    // fixture's contribution against the existing all-time ledger.
    const baseline = db.prepare(`
      SELECT
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE status = 'paid') +
        (SELECT COALESCE(SUM(amount), 0) FROM SlideshowPayment WHERE status = 'paid') AS revenue,
        (SELECT COALESCE(SUM(w.amount), 0) FROM ProjectFundWithdrawal w
         WHERE NOT EXISTS (SELECT 1 FROM ProjectFundWithdrawalVoid v WHERE v.withdrawalId = w.id)) AS withdrawn
    `).get() as { revenue: number; withdrawn: number };
    const adminId = seededAdminId();
    const admin = db.prepare("SELECT email FROM Admin WHERE id = ?").get(adminId) as { email: string };
    const user = createUser();
    const invitation = createInvitation(user.id);
    createPayment(invitation.id, { amount: 180_004, status: "paid" });
    createPayment(invitation.id, { amount: 900_000, status: "pending" });
    // An entitlement without a settled payment is not collected money.
    createInvitation(user.id, { paid: true, complimentary: true });

    const marker = `fund-e2e-${randomUUID()}`;
    const now = prismaNow();
    const historicalDate = prismaNow(new Date("2025-01-15T05:00:00Z"));
    const slideshowId = randomUUID();
    db.prepare(`
      INSERT INTO SlideshowProject
        (id, userId, shareToken, templateId, sourceJson, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(slideshowId, user.id, randomUUID(), "fund-test", "{}", now, now);
    const insertSlideshowPayment = db.prepare(`
      INSERT INTO SlideshowPayment (id, projectId, code, amount, status, createdAt, paidAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertSlideshowPayment.run(randomUUID(), slideshowId, randomUUID(), 120_003, "paid", historicalDate, historicalDate);
    insertSlideshowPayment.run(randomUUID(), slideshowId, randomUUID(), 800_000, "cancelled", now, null);

    // Rounding these sources separately would reserve 30,000 instead of
    // 30,001 in an empty ledger; reserve from the combined collected amount.
    const revenue = baseline.revenue + 300_007;
    const taxReserve = Math.round(revenue / 10);
    const activeAmount = exhaustAvailable
      ? Math.max(1, revenue - baseline.withdrawn - taxReserve + 1_000)
      : 40_000;
    const activeId = randomUUID();
    const voidedId = randomUUID();
    const insertWithdrawal = db.prepare(`
      INSERT INTO ProjectFundWithdrawal
        (id, requestKey, payloadHash, amount, withdrawnAt, purpose, bankReference,
         createdByAdminId, createdByAdminEmail, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const [id, amount, purpose] of [
      [activeId, activeAmount, `${marker}-active`],
      [voidedId, 50_000, `${marker}-voided`],
    ] as const) {
      insertWithdrawal.run(id, randomUUID(), "fixture", amount, historicalDate, purpose, randomUUID(), adminId, admin.email, now);
      db.prepare(`
        INSERT INTO ProjectFundAllocation (id, withdrawalId, recipient, amount, sortOrder)
        VALUES (?, ?, ?, ?, 0)
      `).run(randomUUID(), id, "E2E recipient", amount);
    }
    db.prepare(`
      INSERT INTO ProjectFundWithdrawalVoid
        (id, withdrawalId, reason, createdByAdminId, createdByAdminEmail, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), voidedId, "E2E duplicate entry", adminId, admin.email, now);

    const withdrawn = baseline.withdrawn + activeAmount;
    return {
      userId: user.id,
      adminId,
      marker,
      activeId,
      voidedId,
      expected: { revenue, withdrawn, taxReserve, remaining: revenue - withdrawn - taxReserve },
    };
  })();
}

function cleanupScenario(fixture: ReturnType<typeof seedFundScenario>): void {
  const db = getDb();
  db.pragma("foreign_keys = ON");
  db.transaction(() => {
    db.prepare("DELETE FROM ProjectFundWithdrawalVoid WHERE withdrawalId = ?").run(fixture.voidedId);
    db.prepare("DELETE FROM ProjectFundWithdrawal WHERE id IN (?, ?)").run(fixture.activeId, fixture.voidedId);
    cleanupUser(fixture.userId);
  })();
}

async function expectSummary(page: Page, expected: FundTotals): Promise<void> {
  const summary = page.getByRole("region", { name: copy.summaryLabel });
  for (const [label, amount] of [
    [copy.totalRevenue, expected.revenue],
    [copy.totalWithdrawn, expected.withdrawn],
    [copy.taxReserve, expected.taxReserve],
    [copy.remainingBalance, expected.remaining],
  ] as const) {
    const card = summary.locator("article").filter({ has: page.getByText(label, { exact: true }) });
    await expect(card.locator("p").nth(1)).toHaveText(formatVnd(amount));
  }
}

async function expectOverviewRemaining(page: Page, amount: number): Promise<void> {
  const card = page.locator('a[href="/admin/funds"]').filter({
    has: page.getByText(copy.remainingBalance, { exact: true }),
  });
  await expect(card).toHaveCount(1);
  await expect(card.locator("p").nth(1)).toHaveText(formatVnd(amount, "đ"));
}

test("funds and overview reserve 10% of both paid sources and preview the available balance", async ({ page, context }, testInfo) => {
  const fixture = seedFundScenario();
  try {
    await loginAsAdmin(context, fixture.adminId);
    await page.goto("/admin");
    await expectOverviewRemaining(page, fixture.expected.remaining);
    await page.screenshot({ path: testInfo.outputPath("overview-desktop.png"), fullPage: true });
    await page.locator('a[href="/admin/funds"]').filter({
      has: page.getByText(copy.remainingBalance, { exact: true }),
    }).click();

    await expect(page).toHaveURL(/\/admin\/funds$/);
    await expectSummary(page, fixture.expected);
    await page.screenshot({ path: testInfo.outputPath("funds-desktop.png"), fullPage: true });
    await page.getByRole("button", { name: copy.recordButton, exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(copy.amountLabel, { exact: true }).fill("10000");
    await expect(dialog.getByText(`${copy.balanceBefore}: ${formatVnd(fixture.expected.remaining)}`, { exact: true })).toBeVisible();
    await expect(dialog.getByText(`${copy.balanceAfter}: ${formatVnd(fixture.expected.remaining - 10_000)}`, { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: copy.cancel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expectSummary(page, fixture.expected);
    await page.screenshot({ path: testInfo.outputPath("funds-mobile.png"), fullPage: true });
  } finally {
    cleanupScenario(fixture);
  }
});

test("history and chart filters preserve lifetime reserve and show a negative remaining balance", async ({ page, context }) => {
  const fixture = seedFundScenario(true);
  try {
    await loginAsAdmin(context, fixture.adminId);
    expect(fixture.expected.remaining).toBeLessThan(0);
    await page.goto(`/admin/funds?q=${encodeURIComponent(fixture.marker)}&status=voided`);
    await expectSummary(page, fixture.expected);
    await expect(page.getByRole("alert").filter({ hasText: copy.negativeBalanceWarning })).toBeVisible();
    await expect(page.locator("tbody tr").filter({ hasText: `${fixture.marker}-voided` })).toHaveCount(1);
    await expect(page.locator("tbody tr").filter({ hasText: `${fixture.marker}-active` })).toHaveCount(0);

    // Every seeded withdrawal is in 2025, so this history is empty while the
    // all-time reserve and available balance must remain unchanged.
    await page.goto(`/admin/funds?q=${encodeURIComponent(fixture.marker)}&from=2026-01-01&to=2026-01-31&status=active`);
    await expect(page.locator("tbody tr").filter({ hasText: fixture.marker })).toHaveCount(0);
    await expectSummary(page, fixture.expected);

    await page.goto("/admin?range=90");
    await expectOverviewRemaining(page, fixture.expected.remaining);
  } finally {
    cleanupScenario(fixture);
  }
});
