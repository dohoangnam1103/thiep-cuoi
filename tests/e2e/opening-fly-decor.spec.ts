import { expect, test } from "@playwright/test";

import { completedTemplateSlugs } from "@/data/chungdoi";
import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";
import { getVietnameseTemplateSlug } from "@/data/template-route-slugs";

import { getDb } from "./helpers/db";

/**
 * Bất biến: bản sao decor "bay ra" lúc bấm "Mở thiệp" phải BẮT ĐẦU đúng bằng ảnh
 * tĩnh trên bìa, rồi mới phóng to theo keyframe `demo-dragon-fly`.
 *
 * Lớp bay bọc ảnh trong một `div` mang `cardImages[].className` rồi cho ảnh
 * `w-full`; nếu className chốt chiều CAO (`h-36 w-auto`) thì bề rộng của div là
 * shrink-to-fit quanh chính ảnh và bản sao phình lên 1.6-5 lần. Trên màn hình nó
 * thành cú zoom thô bạo, còn build/typecheck/lint vẫn xanh — đã sập hai lần
 * (`crystal-floral-blue`, `minimalism-brown`) và cả hai lần đều do người xem phát
 * hiện, không phải do test.
 *
 * `src/data/opening-fly-decor.test.ts` chặn ở mức tĩnh (className phải có bề rộng
 * xác định hoặc mang `envelope-fly-fit-height`). Spec này đo con số thật trong
 * browser nên bắt được cả kiểu hỏng mà kiểm className không thấy — ví dụ ai đó
 * đổi rule CSS hoặc đổi cách lớp bay dựng markup.
 */

/** Bản sao và ảnh tĩnh phải khớp trong khoảng này. */
const TOLERANCE = 0.15;

function setCover3dEnabled(enabled: boolean): void {
  getDb()
    .prepare("UPDATE AppConfig SET cover3dEnabled = ? WHERE id = 'default'")
    .run(enabled ? 1 : 0);
}

type Measurement = { source: string[]; fly: string[]; ratios: number[] };

const templates = Object.entries(chungdoiThemeConfig)
  .filter(
    ([slug, config]) =>
      completedTemplateSlugs.has(slug) && config.decorations.cardImages.some((image) => image.flyOnOpen),
  )
  .map(([slug]) => ({ slug, routeSlug: getVietnameseTemplateSlug(slug) }));

test.describe("bìa thiệp — decor bay lúc mở", () => {
  /**
   * Đo trên bìa 2D vì đó là đường mặc định của production
   * (`DEFAULT_COVER_3D_ENABLED = false`) và thẻ là DOM thật nên bấm được ngay.
   * Bìa 3D vẽ thẻ thành texture WebGL, muốn bấm phải chờ chụp xong rồi hit-test
   * trên canvas — quá chậm cho 42 mẫu. Cùng một rule CSS phục vụ cả hai đường.
   *
   * `prepare-db.ts` seed cờ = true cho ~40 test bìa 3D ở templates.spec.ts. Suite
   * chạy tuần tự trên cùng một database (`workers: 1`), nên phải trả cờ về true
   * khi xong, kể cả lúc assert fail. Trang demo không nằm trong
   * prerender-manifest nên cờ có tác dụng ngay từ request kế tiếp.
   */
  test.beforeAll(() => {
    setCover3dEnabled(false);
  });

  test.afterAll(() => {
    setCover3dEnabled(true);
  });

  test("bản sao bay ra bắt đầu đúng bằng ảnh tĩnh trên bìa", async ({ page }) => {
    test.setTimeout(600_000);
    expect(templates.length, "không quét được mẫu nào có decor bay").toBeGreaterThan(20);

    const failures: string[] = [];

    for (const { slug, routeSlug } of templates) {
      const response = await page.goto(`/mau-thiep/${routeSlug}/demo`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      expect(response?.ok(), `${slug} — trang demo không mở được`).toBeTruthy();

      // Bìa 2D là DOM thuần: nút mở và decor tĩnh có mặt ngay.
      await expect(page.locator("[data-open-btn]").first(), `${slug} — không thấy nút mở thiệp`).toBeVisible({
        timeout: 30_000,
      });
      await expect(
        page.locator("[data-envelope-fly-source]").first(),
        `${slug} — không thấy decor tĩnh trên bìa`,
      ).toBeAttached();

      const measurement: Measurement | { error: string } = await page.evaluate(async () => {
        // Đóng băng animation để đọc đúng frame 0% của bản sao: `paused` giữ
        // computed transform ở keyframe đầu, khỏi phải đua với ease-in.
        const freeze = document.createElement("style");
        freeze.textContent = "[data-envelope-cover-fly]{animation-play-state:paused !important}";
        document.head.appendChild(freeze);

        const button = document.querySelector<HTMLElement>("[data-open-btn]");
        if (!button) return { error: "không tìm thấy [data-open-btn] trong DOM" };

        const box = (el: Element) => {
          const rect = el.getBoundingClientRect();
          return { w: rect.width, h: rect.height };
        };
        const label = (b: { w: number; h: number }) => `${Math.round(b.w)}x${Math.round(b.h)}`;
        const area = (b: { w: number; h: number }) => b.w * b.h;

        // Đo ảnh tĩnh TRƯỚC khi bấm. Lúc mở nó chỉ bị đặt opacity 0 (vẫn giữ
        // layout), nhưng đo trước thì không phụ thuộc chi tiết đó.
        const sourceBoxes = [...document.querySelectorAll("[data-envelope-fly-source]")].map(box);

        button.click();
        // Hai frame: một để React mount lớp bay, một để style áp xong.
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
        );

        const flyBoxes = [...document.querySelectorAll("[data-envelope-cover-fly]")].map(box);
        if (flyBoxes.length === 0) return { error: "lớp decor bay không mount sau khi bấm" };

        // Ghép cặp theo diện tích thay vì theo thứ tự DOM: cùng một decor có thể
        // được vẽ ở hai lớp (trong thẻ và lớp vượt mép) và thứ tự không bảo đảm.
        const pool = sourceBoxes.filter((b) => area(b) > 0);
        const ratios = flyBoxes.map((fly) => {
          if (area(fly) === 0 || pool.length === 0) return Number.NaN;
          let best = pool[0];
          for (const candidate of pool) {
            if (Math.abs(area(candidate) - area(fly)) < Math.abs(area(best) - area(fly))) best = candidate;
          }
          return Math.sqrt(area(fly) / area(best));
        });

        return { source: sourceBoxes.map(label), fly: flyBoxes.map(label), ratios };
      });

      if ("error" in measurement) {
        failures.push(`${slug} (${routeSlug}): ${measurement.error}`);
        continue;
      }

      const worst = measurement.ratios.reduce(
        (acc, ratio) => (Number.isFinite(ratio) && Math.abs(ratio - 1) > Math.abs(acc - 1) ? ratio : acc),
        1,
      );
      const broken = measurement.ratios.some(
        (ratio) => !Number.isFinite(ratio) || Math.abs(ratio - 1) > TOLERANCE,
      );
      if (broken) {
        failures.push(
          `${slug} (${routeSlug}): bản sao bay lệch ×${worst.toFixed(2)} so với ảnh tĩnh\n` +
            `    tĩnh: ${measurement.source.join(", ")}\n` +
            `    bay : ${measurement.fly.join(", ")}`,
        );
      }
    }

    expect(
      failures,
      `Bản sao decor bay ra không khớp ảnh tĩnh (ngưỡng ±${TOLERANCE * 100}%):\n` +
        failures.join("\n") +
        `\n\nThường là do \`cardImages[].className\` chốt chiều cao (\`h-36 w-auto\`):\n` +
        `thêm \`envelope-fly-fit-height\` vào className, xem globals.css.`,
    ).toEqual([]);
  });
});
