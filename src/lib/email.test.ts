import assert from "node:assert/strict";
import test from "node:test";

import { signEmailClickToken } from "./email-click";
import {
  buildExpiredReminderEmail,
  buildPaymentSuccessEmail,
  buildReminderEmail,
  buildTrialReminderEmail,
  reminderDedupeKey,
  paymentSuccessDedupeKey,
} from "./email";

test("mail thanh toán thành công cảm ơn và dẫn về trang quản lý thiệp", () => {
  const { subject, html } = buildPaymentSuccessEmail({
    recipientName: "Thạch",
    cardName: "Thạch & Jade",
    accountEmail: "thach@example.com",
    manageUrl: "https://thiepmungonline.com/dashboard",
  });
  assert.ok(subject.includes("Thanh toán thành công"));
  assert.ok(html.includes("Cảm ơn bạn"));
  assert.ok(html.includes("Thạch &amp; Jade"));
  assert.ok(html.includes("Mở trang quản lý thiệp"));
  assert.ok(html.includes("đăng nhập bằng đúng email"));
  assert.ok(html.includes("thach@example.com"));
  assert.ok(html.includes("https://thiepmungonline.com/dashboard"));
  assert.equal(paymentSuccessDedupeKey("pay-1"), "payment-success:pay-1");
});

test("mail thanh toán escape email tài khoản trước khi đưa vào HTML", () => {
  const { html } = buildPaymentSuccessEmail({
    recipientName: "bạn",
    cardName: "Thiệp cưới của bạn",
    accountEmail: 'x<fake>@example.com',
    manageUrl: "https://thiepmungonline.com/dashboard",
  });
  assert.ok(!html.includes("x<fake>@example.com"));
  assert.ok(html.includes("x&lt;fake&gt;@example.com"));
});

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
  assert.ok(
    subject.includes("hết hạn sử dụng"),
    `subject phải nói thiệp đã hết hạn: ${subject}`,
  );
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

test("dedupeKey giữ nguyên định dạng đã có trong database production", () => {
  // Đổi chuỗi này là mọi thiệp từng nhận email sẽ sinh delivery mới và khách nhận
  // thư nhắc lần hai. Test khoá lại chính giá trị mà route cron đang ghi.
  assert.equal(
    reminderDedupeKey("trial-ending", "inv-1"),
    "trial-reminder:trial-ending:inv-1",
  );
  assert.equal(reminderDedupeKey("expired", "inv-1"), "trial-reminder:expired:inv-1");
});

test("không cấu hình EMAIL_LINK_SECRET thì nút trỏ thẳng vào trang thanh toán", () => {
  // Suy giảm phải là mất tracking, không phải mất email.
  const previous = process.env.EMAIL_LINK_SECRET;
  delete process.env.EMAIL_LINK_SECRET;
  try {
    const { html } = buildReminderEmail({
      recipientName: "Thạch",
      cardName: "Thạch & Jade",
      invitationId: "inv-1",
      kind: "trial-ending",
    });
    assert.ok(html.includes("/dashboard/inv-1/thanh-toan"), "thiếu link thanh toán");
    assert.ok(!html.includes("/api/email/click"), "không được có link tracking");
  } finally {
    if (previous === undefined) delete process.env.EMAIL_LINK_SECRET;
    else process.env.EMAIL_LINK_SECRET = previous;
  }
});

test("có secret thì nút đi qua endpoint đo click, dòng text vẫn là URL sạch", () => {
  const previous = process.env.EMAIL_LINK_SECRET;
  process.env.EMAIL_LINK_SECRET = "secret-cho-test";
  try {
    const { html } = buildReminderEmail({
      recipientName: "Thạch",
      cardName: "Thạch & Jade",
      invitationId: "inv-1",
      kind: "trial-ending",
    });

    const token = signEmailClickToken(
      reminderDedupeKey("trial-ending", "inv-1"),
      "secret-cho-test",
    );
    assert.ok(
      html.includes(`/api/email/click?t=${encodeURIComponent(token)}`),
      "nút phải trỏ vào endpoint đo click",
    );
    // Dòng "Hoặc mở link" hiện địa chỉ thật của site: khách đọc email tiền bạc mà
    // thấy URL lạ thì mất tin.
    assert.ok(
      html.includes(">http://localhost:3000/dashboard/inv-1/thanh-toan</a>"),
      "dòng text phải hiện URL sạch",
    );
  } finally {
    if (previous === undefined) delete process.env.EMAIL_LINK_SECRET;
    else process.env.EMAIL_LINK_SECRET = previous;
  }
});

test("hai mốc nhắc mang hai token click khác nhau", () => {
  const previous = process.env.EMAIL_LINK_SECRET;
  process.env.EMAIL_LINK_SECRET = "secret-cho-test";
  try {
    const args = { recipientName: "Thạch", cardName: "Thạch & Jade", invitationId: "inv-1" };
    const trial = buildReminderEmail({ ...args, kind: "trial-ending" });
    const expired = buildReminderEmail({ ...args, kind: "expired" });

    const tokenOf = (html: string) => /\/api\/email\/click\?t=([^"]+)/.exec(html)?.[1];
    const trialToken = tokenOf(trial.html);
    const expiredToken = tokenOf(expired.html);
    assert.ok(trialToken, "mốc 1 thiếu token");
    assert.ok(expiredToken, "mốc 2 thiếu token");
    assert.notEqual(trialToken, expiredToken);
  } finally {
    if (previous === undefined) delete process.env.EMAIL_LINK_SECRET;
    else process.env.EMAIL_LINK_SECRET = previous;
  }
});
