import { expect, test, type Locator, type Page } from "@playwright/test";

const LAB_PATH = "/lab/detective-conan-casebook";

async function forceCssFallback(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => null,
    });
  });
}

async function loadCasebookLab(
  page: Page,
  { navigate = true }: { navigate?: boolean } = {},
) {
  if (navigate) {
    await page.goto(LAB_PATH, { timeout: 60_000 });
  }

  const stage = page.getByTestId("detective-conan-casebook-stage");
  const reader = page.getByTestId("detective-conan-casebook-reader");
  const openControl = page.getByTestId("detective-conan-casebook-open");

  await expect(stage).toHaveAttribute("data-book-state", "closed");
  await expect(stage).toHaveAttribute("data-book-progress", "0");
  await expect(reader).toHaveAttribute("data-active", "false");
  await expect(openControl).toBeEnabled({ timeout: 45_000 });
  expect(await openControl.evaluate((element) => element.tagName)).toBe(
    "BUTTON",
  );

  return { openControl, reader, stage };
}

async function expectOpenedCasebook(page: Page) {
  const stage = page.getByTestId("detective-conan-casebook-stage");
  const reader = page.getByTestId("detective-conan-casebook-reader");

  await expect(stage).toHaveAttribute("data-book-state", "opened", {
    timeout: 8_000,
  });
  await expect(stage).toHaveAttribute("data-book-progress", "100");
  await expect(reader).toHaveAttribute("data-active", "true");
  await expect(reader).toBeVisible();
  await expect(
    reader.locator('[data-position="current"] [data-chapter-heading]'),
  ).toBeFocused();

  return reader;
}

async function openCasebook(page: Page) {
  const loaded = await loadCasebookLab(page);
  await loaded.openControl.click();
  const reader = await expectOpenedCasebook(page);
  return { ...loaded, reader };
}

async function expectDocumentLocked(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const bodyStyle = getComputedStyle(document.body);

    return {
      bodyLocked: ["hidden", "clip"].includes(bodyStyle.overflowY),
      documentFitsViewport:
        document.documentElement.scrollWidth <= window.innerWidth,
      rootLocked: ["hidden", "clip"].includes(rootStyle.overflowY),
    };
  })).toEqual({
    bodyLocked: true,
    documentFitsViewport: true,
    rootLocked: true,
  });

  await page.mouse.wheel(0, 1_200);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

function currentChapterPages(chapter: Locator) {
  return chapter.locator(":scope > section");
}

async function expectTurnSettled(reader: Locator) {
  await expect(reader).toHaveAttribute("data-turn-state", "idle");
}

test.describe("Detective Conan Casebook", () => {
  test.describe.configure({ mode: "serial" });

  test("the physical cover opens only from its explicit native button", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const { openControl, stage } = await loadCasebookLab(page);

    const renderer = await stage.getAttribute("data-renderer");
    const physicalSurface = renderer === "webgl"
      ? page.getByTestId("detective-conan-casebook-canvas")
      : page.getByTestId("detective-conan-casebook-fallback");
    await expect(physicalSurface).toBeVisible();

    const surfaceBox = await physicalSurface.boundingBox();
    if (!surfaceBox) {
      throw new Error("Detective Conan casebook cover has no layout box");
    }

    await page.mouse.click(
      surfaceBox.x + surfaceBox.width / 2,
      surfaceBox.y + surfaceBox.height / 2,
    );
    await expect(stage).toHaveAttribute("data-book-state", "closed");
    await expect(openControl).toBeEnabled();

    await openControl.click();
    await expectOpenedCasebook(page);
    if (renderer === "webgl") {
      await expect(
        page.getByTestId("detective-conan-casebook-canvas"),
      ).toBeAttached();
      await expect(stage).toHaveCSS("opacity", "0");
    }
  });

  test("desktop reader is a locked two-page spread with button, keyboard, history, and query navigation", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await forceCssFallback(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const { reader } = await openCasebook(page);

    await expectDocumentLocked(page);
    await expect(reader).toHaveAttribute("data-current-chapter", "intro");

    const introPages = currentChapterPages(
      page.getByTestId("detective-conan-casebook-chapter-intro"),
    );
    await expect(introPages).toHaveCount(2);
    await expect(introPages.nth(0)).toBeVisible();
    await expect(introPages.nth(1)).toBeVisible();

    const pageBoxes = await introPages.evaluateAll((pages) => pages.map(
      (element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right };
      },
    ));
    expect(pageBoxes[1].left).toBeGreaterThanOrEqual(pageBoxes[0].right - 1);

    const previous = page.getByTestId("detective-conan-casebook-previous");
    const next = page.getByTestId("detective-conan-casebook-next");
    await expect(previous).toBeDisabled();

    await next.click();
    await expect(reader).toHaveAttribute("data-current-chapter", "families");
    await expect(page).toHaveURL(/[?&]chapter=families(?:&|$)/);
    await expect(previous).toBeEnabled();
    await expectTurnSettled(reader);

    await page.keyboard.press("ArrowRight");
    await expect(reader).toHaveAttribute("data-current-chapter", "ceremony");
    await expect(page).toHaveURL(/[?&]chapter=ceremony(?:&|$)/);
    await expectTurnSettled(reader);

    await previous.click();
    await expect(reader).toHaveAttribute("data-current-chapter", "families");
    await expect(page).toHaveURL(/[?&]chapter=families(?:&|$)/);

    await page.reload({ timeout: 60_000 });
    const reloaded = await loadCasebookLab(page, { navigate: false });
    await reloaded.openControl.click();
    const reloadedReader = await expectOpenedCasebook(page);
    await expect(reloadedReader).toHaveAttribute(
      "data-current-chapter",
      "families",
    );

    await page.goBack();
    await expect(reloadedReader).toHaveAttribute(
      "data-current-chapter",
      "ceremony",
    );
    await expect(page).toHaveURL(/[?&]chapter=ceremony(?:&|$)/);
  });

  test("page turns prewarm the compositor and defer the next heavy chapter", async ({
    page,
  }) => {
    await forceCssFallback(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const { reader } = await openCasebook(page);
    const familyChapter = page.getByTestId(
      "detective-conan-casebook-chapter-families",
    );

    await expect(familyChapter).toBeAttached();
    await expect.poll(() => familyChapter.locator("img").evaluate(
      (element) => {
        const image = element as HTMLImageElement;
        return image.complete && image.naturalWidth > 0;
      },
    )).toBe(true);
    await expect(
      page.getByTestId("detective-conan-casebook-chapter-ceremony"),
    ).toHaveCount(0);

    await reader.evaluate((element) => {
      const phases: string[] = [];
      const observer = new MutationObserver(() => {
        const phase = element.getAttribute("data-turn-state");
        if (phase && phases.at(-1) !== phase) phases.push(phase);
        element.setAttribute("data-observed-turn-phases", phases.join(","));
        if (phase === "idle" && phases.includes("running")) {
          observer.disconnect();
        }
      });
      observer.observe(element, {
        attributeFilter: ["data-turn-state"],
      });
    });

    await page.getByTestId("detective-conan-casebook-next").click();
    await expect(reader).toHaveAttribute("data-turn-state", "running");
    await expect(reader.locator('[data-position]')).toHaveCount(2);
    await expect(
      page.getByTestId("detective-conan-casebook-chapter-ceremony"),
    ).toHaveCount(0);
    await expectTurnSettled(reader);
    await expect(reader).toHaveAttribute(
      "data-observed-turn-phases",
      /preparing,running,idle/,
    );
    await expect(
      page.getByTestId("detective-conan-casebook-chapter-ceremony"),
    ).toBeAttached();
  });

  test("mobile keeps one page visible and never introduces document scrolling", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await forceCssFallback(page);
    await page.setViewportSize({ width: 390, height: 844 });
    const { reader } = await openCasebook(page);

    await expectDocumentLocked(page);
    await expect(reader).toHaveAttribute("data-current-chapter", "intro");

    const introPages = currentChapterPages(
      page.getByTestId("detective-conan-casebook-chapter-intro"),
    );
    await expect(introPages).toHaveCount(2);
    await expect(introPages.nth(0)).toBeVisible();
    await expect(introPages.nth(1)).toBeHidden();

    await page.getByTestId("detective-conan-casebook-next").click();
    await expect(reader).toHaveAttribute("data-current-chapter", "families");

    const familyPages = currentChapterPages(
      page.getByTestId("detective-conan-casebook-chapter-families"),
    );
    await expect(familyPages.nth(0)).toBeVisible();
    await expect(familyPages.nth(1)).toBeHidden();
    await expectDocumentLocked(page);
  });

  test("reduced motion preserves the cover-to-reader handoff and removes page transforms", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await forceCssFallback(page);
    await page.setViewportSize({ width: 390, height: 844 });
    const loaded = await loadCasebookLab(page);

    await expect(loaded.stage).toHaveAttribute("data-motion", "reduced");
    await loaded.openControl.click();
    const reader = await expectOpenedCasebook(page);
    await expect(reader).toHaveAttribute("data-reduced-motion", "true");

    const currentLayer = page
      .getByTestId("detective-conan-casebook-chapter-intro")
      .locator("xpath=..");
    await expect(currentLayer).toHaveCSS("transform", "none");
    await expect.poll(() => currentLayer.evaluate((element) => (
      getComputedStyle(element).transitionProperty
    ))).not.toContain("transform");
  });
});
