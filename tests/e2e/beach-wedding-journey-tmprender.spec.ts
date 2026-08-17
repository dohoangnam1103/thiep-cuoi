import { expect, test } from "@playwright/test";

/**
 * Render video theo đúng kịch bản dừng-đi-dừng-đi từ scene 3D thật.
 *
 * KHÔNG phải sinh video bằng AI. Đây là quay lại thế giới 3D đã có, dùng chính cơ
 * chế điều hướng của thiệp: mỗi lần "Đi tiếp" là camera đi 8.5m dọc bãi biển (một
 * chặng đi thật, có parallax vì là 3D), còn giữa các lần bấm thì camera đứng yên
 * mà sóng/nắng vẫn chạy theo clock. Đó chính xác là thứ stock footage không cho:
 * kịch bản do ta quyết, và đoạn dừng có cảnh vật sống thật.
 */
test.use({
  video: { size: { height: 720, width: 1280 }, mode: "on" },
  viewport: { height: 720, width: 1280 },
});

test("render walk script", async ({ page }) => {
  test.setTimeout(600_000);
  await page.goto("/lab/beach-wedding-journey");
  const canvas = page.getByTestId("beach-journey-canvas");
  await expect(canvas).toHaveAttribute("data-world-ready", "true", { timeout: 90_000 });

  const stage = page.getByTestId("beach-journey-stage");
  await page.getByTestId("beach-journey-enter").click();
  await expect(stage).toHaveAttribute("data-journey-phase", "settled", { timeout: 60_000 });

  // Giữ scene render liên tục: frameloop="demand" nên phải nhá chuột để nó vẽ,
  // nếu không đoạn "dừng" sẽ đóng băng thật thay vì sóng vẫn chạy.
  const keepAlive = async (ms: number) => {
    const until = Date.now() + ms;
    let x = 640;
    while (Date.now() < until) {
      x = x === 640 ? 641 : 640;
      await page.mouse.move(x, 360);
      await page.waitForTimeout(40);
    }
  };

  const log: string[] = [];
  for (let step = 0; step < 6; step += 1) {
    // ĐOẠN DỪNG: camera bất động, sóng vẫn vỗ
    await keepAlive(2_600);
    const id = await stage.getAttribute("data-current-scene-id");
    log.push(`dwell@${id}`);
    // ĐOẠN ĐI: camera đi 8.5m sang chặng kế
    await page.getByTestId("beach-journey-next").click();
    await expect(stage).toHaveAttribute("data-journey-phase", "settled", { timeout: 30_000 });
    log.push("travel");
  }
  await keepAlive(2_400);
  console.log(`WALK SCRIPT ${log.join(" -> ")}`);
});
