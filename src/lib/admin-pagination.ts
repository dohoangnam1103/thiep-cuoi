/**
 * Phân trang cho các bảng quản trị.
 *
 * Trước đây các trang users/invitations/payments lấy toàn bộ bảng về rồi render
 * hết, nên chi phí một lần mở trang tăng tuyến tính theo số dòng trong DB dù
 * admin gần như chỉ đọc vài chục dòng mới nhất ở đầu. Cắt trang ngay trong SQL
 * giữ chi phí đó cố định.
 */

/** Các mức số dòng mỗi trang admin chọn được. */
export const ADMIN_PAGE_SIZE_OPTIONS = [20, 50, 100, 200] as const;

export type AdminPageSize = (typeof ADMIN_PAGE_SIZE_OPTIONS)[number];

/** Mặc định: chỉ 20 dòng mới nhất, đủ cho lần mở trang thường ngày. */
export const ADMIN_PAGE_SIZE: AdminPageSize = 20;

/**
 * Chặn trên cho số trang đọc từ URL. `skip` là số nguyên đi thẳng vào SQL nên
 * một giá trị vô hạn hoặc `NaN` phải bị chặn tại đây, và một con số phi lý cũng
 * không nên biến thành `OFFSET` khổng lồ.
 */
const MAX_PAGE = 100_000;

/** Trang đọc từ URL, nên mọi giá trị lạ phải co về 1 chứ không tới Prisma. */
export function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return Math.min(parsed, MAX_PAGE);
}

/**
 * Số dòng mỗi trang cũng đến từ URL, nên phải là một mức trong danh sách chứ
 * không phải con số bất kỳ: `take` tuỳ ý cho phép một link duy nhất kéo cả bảng
 * về, đúng thứ mà phân trang đang tránh.
 */
export function parsePerPage(value: string | undefined): AdminPageSize {
  const parsed = Number(value);
  return ADMIN_PAGE_SIZE_OPTIONS.find((option) => option === parsed) ?? ADMIN_PAGE_SIZE;
}

/** Giá trị `perPage` cần ghi vào URL; `undefined` khi đang ở mức mặc định. */
export function perPageParam(pageSize: number): string | undefined {
  return pageSize === ADMIN_PAGE_SIZE ? undefined : String(pageSize);
}

export type AdminPageWindow = {
  /** Trang thực sự đang xem, đã co vào khoảng hợp lệ. */
  page: number;
  pageSize: AdminPageSize;
  /** Truyền thẳng vào `findMany`. */
  skip: number;
  take: number;
  totalPages: number;
  total: number;
  /** Thứ tự (đếm từ 1) của dòng đầu trang; 0 khi không có dòng nào. */
  from: number;
  /** Thứ tự của dòng cuối trang; 0 khi không có dòng nào. */
  to: number;
};

/**
 * `page` được co vào `[1, totalPages]` thay vì tin vào URL: một link cũ hoặc
 * một bộ lọc vừa thu hẹp kết quả sẽ trỏ tới trang không còn tồn tại, và cắt
 * bằng `skip` quá lớn chỉ cho ra bảng rỗng không giải thích được.
 */
export function adminPageWindow(
  total: number,
  requestedPage: number,
  pageSize: AdminPageSize = ADMIN_PAGE_SIZE,
): AdminPageWindow {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const skip = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    skip,
    take: pageSize,
    totalPages,
    total,
    from: total === 0 ? 0 : skip + 1,
    to: total === 0 ? 0 : Math.min(skip + pageSize, total),
  };
}

/**
 * Link tới một trang, giữ nguyên bộ lọc hiện tại.
 *
 * `undefined` bị bỏ khỏi query, còn chuỗi rỗng thì giữ lại: trang lịch sử email
 * phân biệt "chưa chọn ngày" (mặc định hôm nay) với "đã xoá ô ngày" (xem tất
 * cả), và cả hai khác nhau đúng ở chỗ key có mặt trong URL hay không.
 */
export function adminPageHref(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined) continue;
    query.set(key, value);
  }
  // Trang 1 là mặc định, không cần ghi vào URL.
  if (page > 1) query.set("page", String(page));
  const search = query.toString();
  return search ? `${basePath}?${search}` : basePath;
}

/**
 * URL của trang sau khi xoá hết bộ lọc. Mức số dòng mỗi trang được giữ lại: đó
 * là lựa chọn về cách xem bảng, không phải một bộ lọc, nên "Xoá lọc" không nên
 * lẳng lặng kéo nó về mặc định.
 */
export function adminResetHref(basePath: string, pageSize: number): string {
  return adminPageHref(basePath, { perPage: perPageParam(pageSize) }, 1);
}

/**
 * Dãy số trang cần hiện: luôn có trang đầu, trang cuối và `span` trang quanh
 * trang hiện tại. `null` là dấu lược bỏ (…) để chỗ trống không bị nhầm thành
 * một trang bấm được.
 */
export function adminPageItems(
  page: number,
  totalPages: number,
  span = 1,
): (number | null)[] {
  const wanted = new Set<number>([1, totalPages]);
  for (let offset = -span; offset <= span; offset += 1) {
    const candidate = page + offset;
    if (candidate >= 1 && candidate <= totalPages) wanted.add(candidate);
  }

  const pages = [...wanted].sort((a, b) => a - b);
  const items: (number | null)[] = [];
  let previous = 0;
  for (const value of pages) {
    if (previous && value - previous > 1) items.push(null);
    items.push(value);
    previous = value;
  }
  return items;
}
