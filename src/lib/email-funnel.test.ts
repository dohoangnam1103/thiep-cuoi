import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEmailFunnel,
  funnelRate,
  sumEmailFunnel,
  type FunnelDelivery,
} from "./email-funnel";

const SENT_AT = new Date("2026-08-28T02:00:00.000Z");
const CLICKED_AT = new Date("2026-08-28T03:00:00.000Z");
const PAID_AT = new Date("2026-08-28T04:00:00.000Z");

function delivery(overrides: Partial<FunnelDelivery> = {}): FunnelDelivery {
  return {
    type: "trial-ending",
    invitationId: "inv-1",
    sentAt: SENT_AT,
    firstClickedAt: null,
    ...overrides,
  };
}

function row(rows: ReturnType<typeof buildEmailFunnel>, type: string) {
  const found = rows.find((candidate) => candidate.type === type);
  assert.ok(found, `thiếu hàng ${type}`);
  return found;
}

test("luôn trả về đủ hàng cho mọi loại email, kể cả khi chưa gửi gì", () => {
  const rows = buildEmailFunnel([], []);
  assert.deepEqual(
    rows.map((r) => r.type),
    ["trial-ending", "expired"],
  );
  assert.deepEqual(rows.map((r) => r.sent), [0, 0]);
});

test("đếm thanh toán sau lúc gửi thư", () => {
  const rows = buildEmailFunnel(
    [delivery()],
    [{ invitationId: "inv-1", paidAt: PAID_AT }],
  );
  assert.equal(row(rows, "trial-ending").sent, 1);
  assert.equal(row(rows, "trial-ending").paidAfterSent, 1);
});

test("thanh toán TRƯỚC lúc gửi thư không được tính", () => {
  // Trường hợp thật: khách trả tiền rồi cron mới chạy, hoặc marker ghi trễ.
  const rows = buildEmailFunnel(
    [delivery()],
    [{ invitationId: "inv-1", paidAt: new Date(SENT_AT.getTime() - 1) }],
  );
  assert.equal(row(rows, "trial-ending").paidAfterSent, 0);
});

test("paidAfterClick chỉ tính khi có click và tiền về sau lần bấm đầu", () => {
  const clickedThenPaid = buildEmailFunnel(
    [delivery({ firstClickedAt: CLICKED_AT })],
    [{ invitationId: "inv-1", paidAt: PAID_AT }],
  );
  assert.equal(row(clickedThenPaid, "trial-ending").clicked, 1);
  assert.equal(row(clickedThenPaid, "trial-ending").paidAfterClick, 1);

  // Trả tiền giữa lúc nhận thư và lúc bấm link: vẫn là chuyển đổi sau email,
  // nhưng không phải chuyển đổi sau click.
  const paidBeforeClick = buildEmailFunnel(
    [delivery({ firstClickedAt: PAID_AT })],
    [{ invitationId: "inv-1", paidAt: CLICKED_AT }],
  );
  assert.equal(row(paidBeforeClick, "trial-ending").paidAfterSent, 1);
  assert.equal(row(paidBeforeClick, "trial-ending").paidAfterClick, 0);

  // Trả tiền mà chưa từng bấm link.
  const neverClicked = buildEmailFunnel(
    [delivery()],
    [{ invitationId: "inv-1", paidAt: PAID_AT }],
  );
  assert.equal(row(neverClicked, "trial-ending").clicked, 0);
  assert.equal(row(neverClicked, "trial-ending").paidAfterClick, 0);
});

test("một thiệp nhận cả hai mốc nhắc thì xuất hiện ở cả hai hàng", () => {
  const rows = buildEmailFunnel(
    [
      delivery({ type: "trial-ending" }),
      delivery({ type: "expired", sentAt: CLICKED_AT }),
    ],
    [{ invitationId: "inv-1", paidAt: PAID_AT }],
  );
  assert.equal(row(rows, "trial-ending").paidAfterSent, 1);
  assert.equal(row(rows, "expired").paidAfterSent, 1);
});

test("nhiều đơn paid: lấy mốc muộn nhất nên vẫn tính là trả sau email", () => {
  const rows = buildEmailFunnel(
    [delivery()],
    [
      { invitationId: "inv-1", paidAt: new Date(SENT_AT.getTime() - 5_000) },
      { invitationId: "inv-1", paidAt: PAID_AT },
    ],
  );
  assert.equal(row(rows, "trial-ending").paidAfterSent, 1);
});

test("đơn chưa trả (paidAt null) không được tính là chuyển đổi", () => {
  const rows = buildEmailFunnel([delivery()], [{ invitationId: "inv-1", paidAt: null }]);
  assert.equal(row(rows, "trial-ending").paidAfterSent, 0);
});

test("delivery mất thiệp vẫn vào mẫu số nhưng không bao giờ chuyển đổi", () => {
  // `EmailDelivery.invitationId` là `onDelete: SetNull`, nên thiệp bị xoá để lại
  // một dòng không còn đường nối sang đơn thanh toán.
  const rows = buildEmailFunnel(
    [delivery({ invitationId: null })],
    [{ invitationId: "inv-1", paidAt: PAID_AT }],
  );
  assert.equal(row(rows, "trial-ending").sent, 1);
  assert.equal(row(rows, "trial-ending").paidAfterSent, 0);
});

test("thanh toán của thiệp khác không lẫn sang", () => {
  const rows = buildEmailFunnel(
    [delivery({ invitationId: "inv-1" })],
    [{ invitationId: "inv-2", paidAt: PAID_AT }],
  );
  assert.equal(row(rows, "trial-ending").paidAfterSent, 0);
});

test("loại email ngoài phễu bị bỏ qua", () => {
  const rows = buildEmailFunnel(
    [delivery({ type: "welcome" }), delivery({ type: "system-notice" })],
    [{ invitationId: "inv-1", paidAt: PAID_AT }],
  );
  assert.equal(sumEmailFunnel(rows).sent, 0);
});

test("sumEmailFunnel cộng dồn mọi cột", () => {
  const rows = buildEmailFunnel(
    [
      delivery({ type: "trial-ending", firstClickedAt: CLICKED_AT }),
      delivery({ type: "expired", invitationId: "inv-2", firstClickedAt: CLICKED_AT }),
    ],
    [
      { invitationId: "inv-1", paidAt: PAID_AT },
      { invitationId: "inv-2", paidAt: PAID_AT },
    ],
  );
  assert.deepEqual(sumEmailFunnel(rows), {
    sent: 2,
    clicked: 2,
    paidAfterSent: 2,
    paidAfterClick: 2,
  });
});

test("funnelRate trả null khi mẫu số 0 để không in '0%' như một kết quả đã đo", () => {
  assert.equal(funnelRate(0, 0), null);
  assert.equal(funnelRate(5, 0), null);
  assert.equal(funnelRate(1, 4), 0.25);
});
