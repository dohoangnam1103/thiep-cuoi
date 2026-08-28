import assert from "node:assert/strict";
import test from "node:test";

import { isAutomatedUserAgent } from "./user-agent";

test("người thật không bị chặn", () => {
  for (const userAgent of [
    // Chrome trên Android — thiết bị phổ biến nhất của khách mở thiệp.
    "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  ]) {
    assert.equal(isAutomatedUserAgent(userAgent), false, `bị chặn oan: ${userAgent}`);
  }
});

test("bot và bộ sinh link preview bị chặn", () => {
  for (const userAgent of [
    "Googlebot/2.1 (+http://www.google.com/bot.html)",
    "facebookexternalhit/1.1",
    "Zalo Link Preview",
    "curl/8.4.0",
    "python-requests/2.31.0",
    "HeadlessChrome/126.0.0.0",
    "Mozilla/5.0 (compatible; SkypeUriPreview Preview/0.5)",
  ]) {
    assert.equal(isAutomatedUserAgent(userAgent), true, `phải chặn: ${userAgent}`);
  }
});

test("user-agent rỗng hoặc chỉ có khoảng trắng tính là tự động", () => {
  // Mọi trình duyệt và mail client thật đều gửi header này.
  assert.equal(isAutomatedUserAgent(""), true);
  assert.equal(isAutomatedUserAgent("   "), true);
});
