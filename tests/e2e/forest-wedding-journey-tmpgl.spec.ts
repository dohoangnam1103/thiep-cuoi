import { expect, test } from "@playwright/test";

test("measure gl", async ({ page }) => {
  await page.goto("/lab/forest-wedding-journey");
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
  const info = await page.evaluate(() => {
    const gl = document.querySelector("canvas")?.getContext("webgl2");
    if (!gl) return { renderer: "none", vendor: "none" };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      renderer: ext
        ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
        : "no-ext",
      vendor: ext ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)) : "no-ext",
    };
  });
  console.log(`MEASURE ${JSON.stringify(info)}`);
});
