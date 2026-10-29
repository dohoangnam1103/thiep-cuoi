import { expect, type Locator, type Page } from "@playwright/test";

export async function openDateCalendar(page: Page, field: Locator) {
  const calendar = page.getByRole("dialog", { name: "Chọn ngày", exact: true });
  if (!await calendar.isVisible()) await field.click();
  await expect(calendar).toBeVisible();
  return calendar;
}

export async function chooseEditor2Date(page: Page, field: Locator, value: string) {
  const calendar = await openDateCalendar(page, field);
  const [day, month, year] = value.split("/");
  await calendar.locator(".rdp-years_dropdown").selectOption(year);
  await calendar.locator(".rdp-months_dropdown").selectOption(String(Number(month) - 1));
  await calendar.locator(".rdp-day:not(.rdp-outside) .rdp-day_button").filter({ hasText: new RegExp(`^${Number(day)}$`) }).click();
  await expect(calendar).toHaveCount(0);
  await expect(field).toHaveValue(value);
}

/** Keep invalid/empty input coverage for the optional keyboard fallback. */
export async function enterEditor2Date(page: Page, field: Locator, value: string) {
  const calendar = await openDateCalendar(page, field);
  await page.keyboard.press("Escape");
  await expect(calendar).toHaveCount(0);
  await expect(field).toBeFocused();
  await field.fill(value);
}
