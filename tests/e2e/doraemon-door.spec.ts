import { expect, test, type Page } from "@playwright/test";

const LAB_PATH = "/lab/doraemon-door";
const DEMO_PATH = "/mau-thiep/doraemon-door/demo";

async function loadDoorLab(page: Page) {
  await page.goto(LAB_PATH, { timeout: 60_000 });

  const openControl = page.getByTestId("doraemon-door-open");
  await expect(openControl).toBeEnabled({ timeout: 45_000 });
  const openControlTagName = await openControl.evaluate(
    (element) => element.tagName,
  );
  expect(openControlTagName).toBe("BUTTON");
  await expect(page.getByTestId("doraemon-door-stage")).toHaveAttribute(
    "data-door-state",
    "closed",
  );
  await expect(page.getByTestId("doraemon-door-stage")).toHaveAttribute(
    "data-door-progress",
    "0",
  );

  return openControl;
}

async function expectOpenedDoor(page: Page) {
  const stage = page.getByTestId("doraemon-door-stage");
  await expect(stage).toHaveAttribute("data-door-state", "opened", {
    timeout: 6_000,
  });
  await expect(stage).toHaveAttribute("data-door-progress", "100");
  await expect(page.getByTestId("doraemon-door-canvas")).toHaveCount(0);
  await expect(page.getByTestId("doraemon-door-dom-hero")).toBeFocused();
}

test.describe("Doraemon Door lab", () => {
  test.describe.configure({ mode: "serial" });

  test("desktop opens only from the explicit door button", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const openControl = await loadDoorLab(page);

    const stage = page.getByTestId("doraemon-door-stage");
    const canvas = page.getByTestId("doraemon-door-canvas");
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("Doraemon door canvas has no layout box");

    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;
    await page.mouse.click(centerX, centerY);
    await expect(stage).toHaveAttribute("data-door-state", "closed");
    await expect(openControl).toBeEnabled();

    if (await stage.getAttribute("data-door-drag-enabled") === "true") {
      await page.mouse.move(centerX - 50, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 70, centerY + 20, { steps: 6 });
      await page.mouse.up();
      await expect(stage).toHaveAttribute("data-door-state", "closed");
      await expect(openControl).toBeEnabled();
    }

    await openControl.click();
    await expectOpenedDoor(page);
    await expect(stage).toHaveAttribute("data-door-pose-captured", "true");
  });

  test("mobile opening and its control stay inside the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const openControl = await loadDoorLab(page);

    await expect(page).toHaveTitle(/Doraemon|Cánh Cửa Thần Kỳ/i);
    await expect.poll(() => page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    )).toBe(true);

    const openBox = await openControl.boundingBox();
    if (!openBox) throw new Error("Doraemon door open button has no layout box");
    expect(openBox.width).toBeGreaterThanOrEqual(44);
    expect(openBox.height).toBeGreaterThanOrEqual(44);
    expect(openBox.x).toBeGreaterThanOrEqual(0);
    expect(openBox.x + openBox.width).toBeLessThanOrEqual(390);
    expect(openBox.y).toBeGreaterThanOrEqual(0);
    expect(openBox.y + openBox.height).toBeLessThanOrEqual(844);

    await openControl.click();
    await expectOpenedDoor(page);
    await expect.poll(() => page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    )).toBe(true);
  });

  test("reduced motion still performs the meaningful door handoff", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    const openControl = await loadDoorLab(page);

    await expect(
      page
        .getByTestId("doraemon-door-stage")
        .getByText("Reduced motion đang hoạt động", { exact: true }),
    ).toBeVisible();
    await openControl.click();
    await expectOpenedDoor(page);
  });

  test("CSS fallback opens through the native button without WebGL", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
        configurable: true,
        value: () => null,
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    const openControl = await loadDoorLab(page);

    const stage = page.getByTestId("doraemon-door-stage");
    const fallback = page.getByTestId("doraemon-door-fallback");
    await expect(fallback).toBeVisible();
    await expect(page.getByTestId("doraemon-door-canvas")).toHaveCount(0);
    await expect(fallback).toHaveAttribute(
      "data-door-fallback-opening",
      "false",
    );

    await fallback.click({ force: true, position: { x: 120, y: 180 } });
    await expect(stage).toHaveAttribute("data-door-state", "closed");
    await expect(openControl).toBeEnabled();

    const backFaceControl = page.getByTestId("doraemon-door-back-face");
    if (await backFaceControl.count()) {
      await expect(backFaceControl).toHaveAttribute("aria-pressed", "false");
      await backFaceControl.click();
      await expect(backFaceControl).toHaveAttribute("aria-pressed", "true");
      await expect(openControl).toBeDisabled();
      await backFaceControl.click();
      await expect(backFaceControl).toHaveAttribute("aria-pressed", "false");
      await expect(openControl).toBeEnabled();
    }

    await openControl.click();
    await expect(fallback).toHaveAttribute(
      "data-door-fallback-opening",
      "true",
    );
    await expectOpenedDoor(page);
  });

  test("production mounts the registered document only after the door handoff", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(DEMO_PATH, { timeout: 60_000 });

    const stage = page.getByTestId("doraemon-door-stage");
    await expect(stage).toHaveAttribute("data-door-state", "closed", {
      timeout: 45_000,
    });
    await expect(
      page.locator('[data-template-renderer="doraemon-door"]'),
    ).toHaveCount(0);

    await page.getByTestId("doraemon-door-open").click();

    await expect(
      page.locator('[data-template-renderer="doraemon-door"]'),
    ).toBeVisible({ timeout: 6_000 });
    await expect(page.locator("[data-template-footer]")).toBeVisible();
    await expect(page.getByTestId("doraemon-door-canvas")).toHaveCount(0);

    await page.getByTestId("doraemon-door-replay-cover").click();
    await expect(stage).toHaveAttribute("data-door-state", "closed");
    await expect(
      page.locator('[data-template-renderer="doraemon-door"]'),
    ).toHaveCount(0);
  });

  test("production capture bypasses the door and retains the full document", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${DEMO_PATH}?capture=1`, { timeout: 60_000 });

    await expect(page.getByTestId("doraemon-door-stage")).toHaveCount(0);
    await expect(page.getByTestId("doraemon-door-canvas")).toHaveCount(0);
    await expect(page.getByTestId("doraemon-door-open")).toHaveCount(0);
    await expect(page.getByTestId("doraemon-door-replay-cover")).toHaveCount(0);
    await expect(
      page.locator('[data-template-renderer="doraemon-door"]'),
    ).toBeVisible();
    await expect(page.locator("[data-door-invitation-body]")).toBeVisible();
    await expect(page.locator("[data-template-footer]")).toBeVisible();
    await expect(page.locator("[data-copy-address]")).toHaveCount(2);
  });

  test("mobile document centers headings and keeps schedule and wishes vertical", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${DEMO_PATH}?capture=1`, { timeout: 60_000 });

    const centeredHeadingIds = [
      "door-invitation-heading",
      "door-family-heading",
      "door-destination-heading",
      "door-timeline-heading",
      "door-guestbook-heading",
    ];
    for (const headingId of centeredHeadingIds) {
      await expect(page.locator(`#${headingId}`)).toHaveCSS(
        "text-align",
        "center",
      );
    }

    const layout = await page.evaluate(() => {
      const schedule = document.querySelector<HTMLElement>(
        '[data-testid="doraemon-door-schedule-list"]',
      );
      const wishes = document.querySelector<HTMLElement>(
        '[data-testid="doraemon-door-wish-list"]',
      );
      if (!schedule || !wishes) {
        throw new Error("Doraemon vertical lists are missing");
      }

      const scheduleRects = Array.from(schedule.children).map((item) => (
        item.getBoundingClientRect()
      ));
      const scheduleIsVertical = scheduleRects.every((rect, index) => (
        index === 0 || rect.top >= scheduleRects[index - 1].bottom
      ));

      return {
        documentFitsViewport:
          document.documentElement.scrollWidth <= window.innerWidth,
        scheduleDisplay: getComputedStyle(schedule).display,
        scheduleFits: schedule.scrollWidth <= schedule.clientWidth,
        scheduleIsVertical,
        wishesDisplay: getComputedStyle(wishes).display,
        wishesFit: wishes.scrollWidth <= wishes.clientWidth,
      };
    });

    expect(layout).toEqual({
      documentFitsViewport: true,
      scheduleDisplay: "grid",
      scheduleFits: true,
      scheduleIsVertical: true,
      wishesDisplay: "grid",
      wishesFit: true,
    });

    await page.setViewportSize({ width: 854, height: 900 });
    const centerOffset = await page.evaluate(() => {
      const body = document.querySelector<HTMLElement>(
        "[data-door-invitation-body]",
      );
      const copy = document.querySelector<HTMLElement>(
        '[data-testid="doraemon-door-invitation-copy"]',
      );
      if (!body || !copy) {
        throw new Error("Doraemon invitation copy is missing");
      }

      const bodyRect = body.getBoundingClientRect();
      const copyRect = copy.getBoundingClientRect();
      const bodyCenter = bodyRect.left + bodyRect.width / 2;
      const copyCenter = copyRect.left + copyRect.width / 2;
      return Math.abs(bodyCenter - copyCenter);
    });
    expect(centerOffset).toBeLessThan(2);
  });
});
