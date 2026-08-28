import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  ADMIN_PAGE_SIZE,
  ADMIN_PAGE_SIZE_OPTIONS,
  adminPageHref,
  adminPageItems,
  perPageParam,
  type AdminPageWindow,
} from "@/lib/admin-pagination";

const LINK_CLASS =
  "min-w-9 rounded-lg border border-border px-3 py-1.5 text-center text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground";
const ACTIVE_CLASS =
  "min-w-9 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-center text-sm font-semibold text-primary";
const DISABLED_CLASS =
  "min-w-9 rounded-lg border border-border/60 px-3 py-1.5 text-center text-sm text-muted-foreground/50";
const SIZE_CLASS = "rounded-lg px-2.5 py-1 text-sm transition";

/**
 * Giữ mức "số dòng mỗi trang" qua một lần submit form lọc.
 *
 * Form GET thay cả query string, nên không mang theo `perPage` thì mỗi lần admin
 * bấm Lọc là mức đang chọn lại về mặc định. `page` thì ngược lại: bỏ đi mới
 * đúng, vì kết quả sau khi lọc phải bắt đầu từ trang 1.
 */
export function AdminPerPageField({ pageSize }: { pageSize: number }) {
  const value = perPageParam(pageSize);
  return value ? <input type="hidden" name="perPage" value={value} /> : null;
}

/**
 * Thanh phân trang dùng chung cho các bảng quản trị.
 *
 * Là server component và điều hướng bằng `<Link>` chứ không bằng state: các
 * trang quản trị đều đọc bộ lọc từ `searchParams`, nên trang hiện tại và số
 * dòng mỗi trang thuộc về URL. Nhờ vậy link chia sẻ được, nút back hoạt động,
 * và không cần gửi thêm JS — kể cả bộ chọn số dòng, vốn hay được làm bằng
 * `<select>` cần onChange phía client.
 */
export async function AdminPagination({
  pagination,
  basePath,
  params,
}: {
  pagination: AdminPageWindow;
  basePath: string;
  /** Bộ lọc hiện tại, để link trang không làm mất chúng. `perPage` tự thêm. */
  params: Record<string, string | undefined>;
}) {
  const t = await getTranslations("adminSupport");
  const { page, pageSize, totalPages, total, from, to } = pagination;

  // Không có gì để lật và cũng không có gì để đổi: bảng ngắn hơn một trang mặc
  // định. Tiêu đề bảng đã có tổng số nên thanh này chỉ là nhiễu.
  if (total <= ADMIN_PAGE_SIZE && pageSize === ADMIN_PAGE_SIZE) return null;

  const href = (target: number, size: number = pageSize): string =>
    adminPageHref(basePath, { ...params, perPage: perPageParam(size) }, target);

  return (
    <nav
      aria-label={t("paginationLabel")}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {t("paginationSummary", { from, to, total })}
        </p>

        <div
          role="group"
          aria-label={t("paginationPerPageLabel")}
          className="flex items-center gap-1 rounded-xl border border-border bg-background p-1"
        >
          <span className="px-1 text-xs text-muted-foreground">{t("paginationPerPage")}</span>
          {ADMIN_PAGE_SIZE_OPTIONS.map((size) => {
            const isActive = size === pageSize;
            return isActive ? (
              <span
                key={size}
                aria-current="true"
                className={`${SIZE_CLASS} bg-primary/10 font-semibold text-primary`}
              >
                {size}
              </span>
            ) : (
              <Link
                key={size}
                // Về trang 1: mốc "đang xem dòng thứ mấy" không còn nghĩa khi
                // kích thước trang đổi, và trang 1 là chỗ admin muốn tới.
                href={href(1, size)}
                aria-label={t("paginationPerPageOption", { size })}
                className={`${SIZE_CLASS} text-muted-foreground hover:bg-muted hover:text-foreground`}
              >
                {size}
              </Link>
            );
          })}
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-1">
          {page > 1 ? (
            <Link href={href(page - 1)} rel="prev" className={LINK_CLASS}>
              {t("paginationPrev")}
            </Link>
          ) : (
            <span aria-hidden="true" className={DISABLED_CLASS}>
              {t("paginationPrev")}
            </span>
          )}

          {adminPageItems(page, totalPages).map((item, index) =>
            item === null ? (
              <span
                // Dấu lược bỏ không có số để làm key, và có thể xuất hiện hai lần.
                key={`gap-${index}`}
                aria-hidden="true"
                className="px-1 text-sm text-muted-foreground"
              >
                …
              </span>
            ) : item === page ? (
              <span key={item} aria-current="page" className={ACTIVE_CLASS}>
                {item}
              </span>
            ) : (
              <Link
                key={item}
                href={href(item)}
                aria-label={t("paginationGoToPage", { page: item })}
                className={LINK_CLASS}
              >
                {item}
              </Link>
            ),
          )}

          {page < totalPages ? (
            <Link href={href(page + 1)} rel="next" className={LINK_CLASS}>
              {t("paginationNext")}
            </Link>
          ) : (
            <span aria-hidden="true" className={DISABLED_CLASS}>
              {t("paginationNext")}
            </span>
          )}
        </div>
      ) : null}
    </nav>
  );
}
