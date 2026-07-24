import assert from "node:assert/strict";
import test from "node:test";

import { buildTrialReminderEmail } from "./email";

test("subject chứa tên thiệp", () => {
  const { subject } = buildTrialReminderEmail({
    recipientName: "Thạch",
    cardName: "Thạch & Jade",
    payUrl: "https://thiepmungonline.com/dashboard/abc/thanh-toan",
  });
  assert.ok(subject.includes("Thạch & Jade"), `subject: ${subject}`);
});

test("html chứa tên người nhận, tên thiệp và link thanh toán", () => {
  const { html } = buildTrialReminderEmail({
    recipientName: "Thạch",
    cardName: "Thạch & Jade",
    payUrl: "https://thiepmungonline.com/dashboard/abc/thanh-toan",
  });
  assert.ok(html.includes("Thạch"), "thiếu tên người nhận");
  assert.ok(html.includes("Thạch &amp; Jade"), "thiếu tên thiệp");
  assert.ok(html.includes("https://thiepmungonline.com/dashboard/abc/thanh-toan"), "thiếu link");
  assert.ok(html.includes("<table"), "phải là email table-based");
});

test("html escape ký tự đặc biệt trong tên", () => {
  const { html } = buildTrialReminderEmail({
    recipientName: "A<b>",
    cardName: "X & Y",
    payUrl: "https://thiepmungonline.com/dashboard/abc/thanh-toan",
  });
  assert.ok(!html.includes("A<b>"), "tên chưa được escape");
  assert.ok(html.includes("A&lt;b&gt;"), "escape sai");
});
