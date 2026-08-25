import assert from "node:assert/strict";
import test from "node:test";

import { buildExpiredReminderEmail, buildTrialReminderEmail } from "./email";

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

test("mail nhắc bù nói thiệp ĐÃ ẩn, không nói 'ngày cuối'", () => {
  const { subject, html } = buildExpiredReminderEmail({
    recipientName: "Thạch",
    cardName: "Thạch & Jade",
    payUrl: "https://thiepmungonline.com/dashboard/abc/thanh-toan",
  });
  assert.ok(subject.includes("Thạch & Jade"), `subject: ${subject}`);
  assert.ok(subject.includes("tạm ẩn"), `subject phải nói thiệp đã ẩn: ${subject}`);
  // Lời văn của mốc 1 áp vào thiệp đã hết hạn là sai sự thật và làm mất tin.
  assert.ok(!subject.includes("ngày cuối"), `subject không được nói ngày cuối: ${subject}`);
  assert.ok(!html.includes("Hôm nay là"), "body không được nói hôm nay là ngày cuối");
  assert.ok(html.includes("đang tạm ẩn"), "body phải nói rõ thiệp đang ẩn");
  assert.ok(
    html.includes("https://thiepmungonline.com/dashboard/abc/thanh-toan"),
    "thiếu link thanh toán",
  );
});

test("hai mail nhắc dùng chung vỏ nhưng khác lời văn và nhãn nút", () => {
  const args = {
    recipientName: "Thạch",
    cardName: "Thạch & Jade",
    payUrl: "https://thiepmungonline.com/dashboard/abc/thanh-toan",
  };
  const trial = buildTrialReminderEmail(args);
  const expired = buildExpiredReminderEmail(args);

  assert.notEqual(trial.subject, expired.subject);
  assert.notEqual(trial.html, expired.html);
  // Vỏ dùng chung: cùng header thương hiệu và footer.
  for (const shared of ["Thiệp Mừng Online", "© Thiệp Mừng Online — thiepmungonline.com", "<table"]) {
    assert.ok(trial.html.includes(shared), `mail mốc 1 thiếu ${shared}`);
    assert.ok(expired.html.includes(shared), `mail mốc 2 thiếu ${shared}`);
  }
  assert.ok(trial.html.includes("Thanh toán ngay"), "mốc 1 dùng nhãn 'Thanh toán ngay'");
  assert.ok(expired.html.includes("Mở lại thiệp"), "mốc 2 dùng nhãn 'Mở lại thiệp'");
});

test("mail nhắc bù escape ký tự đặc biệt trong tên", () => {
  const { html } = buildExpiredReminderEmail({
    recipientName: "A<b>",
    cardName: "X & Y",
    payUrl: "https://thiepmungonline.com/dashboard/abc/thanh-toan",
  });
  assert.ok(!html.includes("A<b>"), "tên chưa được escape");
  assert.ok(html.includes("A&lt;b&gt;"), "thiếu bản đã escape");
  assert.ok(html.includes("X &amp; Y"), "tên thiệp chưa escape");
});
