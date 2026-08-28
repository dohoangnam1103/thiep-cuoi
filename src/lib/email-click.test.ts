import assert from "node:assert/strict";
import test from "node:test";

import {
  parseEmailClickToken,
  signEmailClickToken,
} from "./email-click";

const SECRET = "test-email-link-secret";
const DEDUPE_KEY = "trial-reminder:trial-ending:cmex1234567890abcdef";

test("token đi và về nguyên vẹn dedupeKey", () => {
  const token = signEmailClickToken(DEDUPE_KEY, SECRET);
  assert.equal(parseEmailClickToken(token, SECRET), DEDUPE_KEY);
});

test("token tất định: hai lần ký cho ra cùng một chuỗi", () => {
  // Đây là bất biến quan trọng nhất của file này. `EmailDelivery.html` bất biến và
  // retry phát lại đúng payload đó dưới cùng idempotency key của Resend, nên một
  // token đổi giữa hai lần dựng mail sẽ làm retry mang token sai.
  assert.equal(
    signEmailClickToken(DEDUPE_KEY, SECRET),
    signEmailClickToken(DEDUPE_KEY, SECRET),
  );
});

test("secret khác cho ra token khác và không xác thực chéo được", () => {
  const token = signEmailClickToken(DEDUPE_KEY, SECRET);
  assert.notEqual(token, signEmailClickToken(DEDUPE_KEY, "secret-khac"));
  assert.equal(parseEmailClickToken(token, "secret-khac"), null);
});

test("đổi dedupeKey mà giữ chữ ký cũ thì bị từ chối", () => {
  // Kịch bản thật: ai đó sửa invitationId trong URL để bơm click cho thiệp khác.
  const token = signEmailClickToken(DEDUPE_KEY, SECRET);
  const signature = token.slice(token.lastIndexOf(".") + 1);
  const forged = `${Buffer.from("trial-reminder:trial-ending:thiep-khac").toString("base64url")}.${signature}`;
  assert.equal(parseEmailClickToken(forged, SECRET), null);
});

test("sửa chữ ký thì bị từ chối", () => {
  const token = signEmailClickToken(DEDUPE_KEY, SECRET);
  const tampered = `${token.slice(0, -1)}${token.at(-1) === "A" ? "B" : "A"}`;
  assert.equal(parseEmailClickToken(tampered, SECRET), null);
});

test("token méo mó không làm hàm ném lỗi", () => {
  // Mail client hay chèn ngắt dòng vào URL dài, nên endpoint sẽ gặp đủ loại rác.
  for (const bad of [
    "",
    ".",
    "..",
    "khongcodau",
    ".chicochuky",
    `${Buffer.from(DEDUPE_KEY).toString("base64url")}.`,
    `${Buffer.from(DEDUPE_KEY).toString("base64url")}.ngan`,
    "%%%.%%%%%%%%%%%%%%%%",
  ]) {
    assert.equal(parseEmailClickToken(bad, SECRET), null, `phải từ chối: ${bad}`);
  }
});

test("chữ ký sai độ dài bị từ chối trước khi so sánh", () => {
  const token = signEmailClickToken(DEDUPE_KEY, SECRET);
  const [encoded, signature] = token.split(".");
  assert.equal(parseEmailClickToken(`${encoded}.${signature}extra`, SECRET), null);
  assert.equal(parseEmailClickToken(`${encoded}.${signature.slice(0, -1)}`, SECRET), null);
});

test("chỉ nhận đúng một dạng biểu diễn base64url của dedupeKey", () => {
  // base64url có padding tuỳ chọn nên cùng một chuỗi có nhiều cách viết. Nếu không
  // chuẩn hoá thì hai URL khác nhau cùng ghi click vào một delivery.
  const token = signEmailClickToken(DEDUPE_KEY, SECRET);
  const [encoded, signature] = token.split(".");
  assert.equal(parseEmailClickToken(`${encoded}=.${signature}`, SECRET), null);
});

test("dedupeKey của mốc expired khác token của mốc trial-ending", () => {
  const trial = signEmailClickToken("trial-reminder:trial-ending:inv-1", SECRET);
  const expired = signEmailClickToken("trial-reminder:expired:inv-1", SECRET);
  assert.notEqual(trial, expired);
  assert.equal(parseEmailClickToken(expired, SECRET), "trial-reminder:expired:inv-1");
});
