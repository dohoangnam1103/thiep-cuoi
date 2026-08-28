import assert from "node:assert/strict";
import test from "node:test";

import {
  ADMIN_PAGE_SIZE,
  ADMIN_PAGE_SIZE_OPTIONS,
  adminPageHref,
  adminPageItems,
  adminPageWindow,
  adminResetHref,
  parsePage,
  parsePerPage,
  perPageParam,
} from "./admin-pagination";

test("parsePage co mọi giá trị lạ từ URL về trang 1", () => {
  assert.equal(parsePage(undefined), 1);
  assert.equal(parsePage(""), 1);
  assert.equal(parsePage("0"), 1);
  assert.equal(parsePage("-3"), 1);
  assert.equal(parsePage("1.5"), 1);
  assert.equal(parsePage("abc"), 1);
  assert.equal(parsePage("drop table"), 1);
  assert.equal(parsePage("Infinity"), 1);
  assert.equal(parsePage("2"), 2);
});

test("parsePage chặn trên để skip không thành OFFSET khổng lồ", () => {
  assert.equal(parsePage("99999999"), 100_000);
});

test("adminPageWindow tính skip và khoảng đang hiện", () => {
  const window = adminPageWindow(120, 2, 50);
  assert.equal(window.page, 2);
  assert.equal(window.skip, 50);
  assert.equal(window.take, 50);
  assert.equal(window.totalPages, 3);
  assert.equal(window.from, 51);
  assert.equal(window.to, 100);
});

test("adminPageWindow co trang vượt quá cuối về trang cuối", () => {
  const window = adminPageWindow(120, 99, 50);
  assert.equal(window.page, 3);
  assert.equal(window.skip, 100);
  assert.equal(window.from, 101);
  assert.equal(window.to, 120);
});

test("adminPageWindow xử lý tập rỗng mà không cho from/to âm hay lệch", () => {
  const window = adminPageWindow(0, 3, 50);
  assert.equal(window.page, 1);
  assert.equal(window.skip, 0);
  assert.equal(window.totalPages, 1);
  assert.equal(window.from, 0);
  assert.equal(window.to, 0);
});

test("mặc định là 20 dòng mới nhất", () => {
  assert.equal(ADMIN_PAGE_SIZE, 20);
  const window = adminPageWindow(500, 1);
  assert.equal(window.take, 20);
  assert.equal(window.to, 20);
});

test("parsePerPage chỉ nhận các mức có trong danh sách", () => {
  for (const option of ADMIN_PAGE_SIZE_OPTIONS) {
    assert.equal(parsePerPage(String(option)), option);
  }
});

test("parsePerPage co mọi giá trị khác về mặc định", () => {
  // Một `take` tuỳ ý cho phép một link kéo cả bảng về, đúng thứ phân trang tránh.
  assert.equal(parsePerPage("999999"), ADMIN_PAGE_SIZE);
  assert.equal(parsePerPage("21"), ADMIN_PAGE_SIZE);
  assert.equal(parsePerPage("0"), ADMIN_PAGE_SIZE);
  assert.equal(parsePerPage("-50"), ADMIN_PAGE_SIZE);
  assert.equal(parsePerPage("all"), ADMIN_PAGE_SIZE);
  assert.equal(parsePerPage(""), ADMIN_PAGE_SIZE);
  assert.equal(parsePerPage(undefined), ADMIN_PAGE_SIZE);
});

test("perPageParam chỉ ghi vào URL khi khác mặc định", () => {
  assert.equal(perPageParam(ADMIN_PAGE_SIZE), undefined);
  assert.equal(perPageParam(100), "100");
});

test("adminPageWindow nhận mức số dòng admin chọn", () => {
  const window = adminPageWindow(250, 2, 100);
  assert.equal(window.pageSize, 100);
  assert.equal(window.skip, 100);
  assert.equal(window.totalPages, 3);
  assert.equal(window.from, 101);
  assert.equal(window.to, 200);
});

test("adminResetHref xoá bộ lọc nhưng giữ mức số dòng đang chọn", () => {
  assert.equal(adminResetHref("/admin/users", 100), "/admin/users?perPage=100");
  assert.equal(adminResetHref("/admin/users", ADMIN_PAGE_SIZE), "/admin/users");
});

test("adminPageHref giữ bộ lọc và bỏ page=1 khỏi URL", () => {
  assert.equal(
    adminPageHref("/admin/invitations", { q: "an", status: "published" }, 3),
    "/admin/invitations?q=an&status=published&page=3",
  );
  assert.equal(
    adminPageHref("/admin/invitations", { q: "an" }, 1),
    "/admin/invitations?q=an",
  );
  assert.equal(adminPageHref("/admin/users", {}, 1), "/admin/users");
});

test("adminPageHref bỏ undefined nhưng giữ chuỗi rỗng", () => {
  // Trang lịch sử email dùng `from=` để nói "xem tất cả", khác với việc không
  // có key `from` (mặc định hôm nay), nên chuỗi rỗng phải sống sót.
  assert.equal(
    adminPageHref("/admin/email-logs", { from: "", to: undefined }, 2),
    "/admin/email-logs?from=&page=2",
  );
});

test("adminPageHref bỏ page cũ trong params thay vì ghi hai lần", () => {
  assert.equal(adminPageHref("/admin/users", { page: "7", q: "an" }, 2), "/admin/users?q=an&page=2");
});

test("adminPageItems hiện trang đầu, cuối và lân cận, chèn dấu lược bỏ", () => {
  assert.deepEqual(adminPageItems(1, 1), [1]);
  assert.deepEqual(adminPageItems(1, 3), [1, 2, 3]);
  assert.deepEqual(adminPageItems(5, 10), [1, null, 4, 5, 6, null, 10]);
  assert.deepEqual(adminPageItems(2, 10), [1, 2, 3, null, 10]);
  assert.deepEqual(adminPageItems(10, 10), [1, null, 9, 10]);
});
