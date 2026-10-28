import { randomUUID } from "node:crypto";
import { expect, type Locator, type Page } from "@playwright/test";
import { chungdoiDemoContent } from "../../../src/data/chungdoi-demo-content";
import vi from "../../../messages/vi.json";
import { getDb } from "./db";
import { createInvitation } from "./fixtures";

export const editor2Copy = vi.editor2;
export type MatrixSection = keyof typeof editor2Copy.sections;

// Deliberately distinct values: a binding which accidentally routes to a
// different person, date or section cannot pass by matching identical samples.
export const matrixInitial = {
  brideFullName: "Nguyễn An Nhiên", brideShortName: "An Nhiên",
  groomFullName: "Trần Minh Khôi", groomShortName: "Minh Khôi",
  brideFather: "Nguyễn Văn Sơn", brideMother: "Lê Thị Hạnh",
  groomFather: "Trần Văn Lâm", groomMother: "Phạm Thị Hoa",
  brideParentTitle: "Ông Bà", groomParentTitle: "Ông Bà",
  brideAddress: "12 Đường Nhà Gái", groomAddress: "34 Đường Nhà Trai",
  date: "2026-11-29", time: "18:37", banquetTime: "18:37",
  venueName: "Nhà Hàng Hoa Mai", address: "56 Nguyễn Huệ, TP. Hồ Chí Minh",
  heroImage: "/chungdoi/icon.png?matrix=bride", heroImage2: "/chungdoi/icon.png?matrix=groom",
};

export function seedEditor2Matrix(userId: string, templateId: string, brideFirst: boolean) {
  const invitation = createInvitation(userId, { templateId });
  const db = getDb();
  const keys = Object.keys(matrixInitial) as (keyof typeof matrixInitial)[];
  db.prepare(`UPDATE InvitationContent SET ${keys.map(key => `"${key}" = ?`).join(", ")}, brideFirst = ? WHERE invitationId = ?`)
    .run(...keys.map(key => matrixInitial[key]), Number(brideFirst), invitation.id);
  db.prepare("INSERT INTO CeremonyItem (id, invitationId, title, date, time, sortOrder) VALUES (?, ?, ?, ?, ?, 0)")
    .run(randomUUID(), invitation.id, "Lễ Vu Quy Kiểm Tra", "2026-11-28", "09:23");
  db.prepare("INSERT INTO ScheduleItem (id, invitationId, time, label, sortOrder) VALUES (?, ?, ?, ?, 0)")
    .run(randomUUID(), invitation.id, "17:45", "Đón Khách Kiểm Tra");
  const gallery = chungdoiDemoContent[templateId]?.gallery.slice(0, 3);
  expect(gallery?.length, `${templateId}: missing independent album fixture`).toBe(3);
  for (const [index, url] of gallery!.entries()) {
    db.prepare("INSERT INTO GalleryPhoto (id, invitationId, url, sortOrder) VALUES (?, ?, ?, ?)")
      .run(randomUUID(), invitation.id, url, index);
  }
  return { ...invitation, gallery: gallery! };
}

export function matrixContent(invitationId: string) {
  return getDb().prepare("SELECT * FROM InvitationContent WHERE invitationId = ?").get(invitationId) as Record<string, string>;
}

export function canvasText(page: Page, text: string | RegExp) {
  // Search actual invitation content, independently of the editor's bindings.
  // Some designs put the fixture's honorific and name in one text node.
  // Accept that literal prefix without accepting a missing/partial name.
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rendered = typeof text === "string" ? new RegExp(`^(?:${escape(matrixInitial.brideParentTitle)}\\s+)?${escape(text)}$`) : text;
  return page.locator("[data-template-renderer]").getByText(rendered).filter({ visible: true }).first();
}

export function canvasCoupleName(page: Page, person: "bride" | "groom", values: typeof matrixInitial) {
  // Native typography can use full names (Hy Uoc) or short names. Both must
  // contain exactly the expected name, never a generic editor marker.
  return canvasText(page, new RegExp(`^(?:${values[`${person}FullName`]}|${values[`${person}ShortName`]})$`));
}

export function canvasEventTime(page: Page, time: string) {
  // Hoa Mai combines its date and reception time on one line with a middle dot.
  // To Hong/Uyen Uong render the catalog's translated atTime phrase.
  const translated = vi.invitationTemplate.atTime.replace("{time}", time);
  return canvasText(page, new RegExp(`^(?:(?:.*\\s·\\s)?${time}|${translated})$`, "i"));
}

export function canvasPhoto(page: Page, source: string) {
  return page.locator("[data-template-renderer] img").filter({ visible: true })
    .and(page.locator(`img[src=${JSON.stringify(source)}], img[src*=${JSON.stringify(encodeURIComponent(source))}]`)).first();
}

/** Real pointer hit-testing also supports continuously moving portraits.
 * Never force a click, dispatch an event or bypass an artwork obstruction. */
export async function clickCanvas(page: Page, target: Locator) {
  await expect(target, "the actual invitation content must exist").toBeVisible();
  await target.evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }));
  let point: { x: number; y: number } | null = null;
  await expect.poll(async () => {
    point = await target.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      for (const dy of [0.5, 0.25, 0.75, 0.1, 0.9]) for (const dx of [0.5, 0.25, 0.75, 0.1, 0.9]) {
        const x = bounds.x + bounds.width * dx;
        const y = bounds.y + bounds.height * dy;
        const hit = document.elementFromPoint(x, y);
        if (hit && (hit === element || element.contains(hit))) return { x, y };
      }
      return null;
    });
    return point !== null;
  }, { message: "invitation content must expose a real clickable area" }).toBe(true);
  await page.mouse.click(point!.x, point!.y);
}

export async function expectSection(page: Page, section: MatrixSection) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveCount(1);
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(editor2Copy.sections[section]);
  const bounds = await dialog.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
  return dialog;
}

export async function closeMatrixDialog(page: Page) {
  await page.getByRole("dialog").getByRole("button", { name: editor2Copy.done, exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect.poll(() => page.locator("body").evaluate(body => getComputedStyle(body).overflow)).not.toBe("hidden");
}

export async function saveMatrix(page: Page) {
  await page.getByRole("button", { name: editor2Copy.save, exact: true }).click();
  await expect(page.getByRole("status").first()).toHaveText(editor2Copy.saved);
}
