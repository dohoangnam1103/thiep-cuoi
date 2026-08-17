"use client";

import { useEffect } from "react";

import { appFontVariables } from "@/lib/fonts";
import { reportClientError } from "@/lib/report-client-error";
import "./globals.css";

/**
 * Replaces the root layout when a render fails above every segment boundary.
 * Must declare its own <html>/<body>, fonts and styles — nothing from the
 * layout tree survives here. Copy is hardcoded Vietnamese rather than
 * next-intl: the provider lives inside the tree that just crashed, so calling
 * a translation hook here would throw a second time and blank the page.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    reportClientError(error, "global");
  }, [error]);

  return (
    <html lang="vi" className={`${appFontVariables} h-full antialiased`}>
      <title>Không tải được trang | Thiệp Mừng Online</title>
      <body className="min-h-full bg-background font-sans text-foreground">
        <main className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-16 text-center">
          <h1 className="text-2xl font-extrabold text-balance">
            Trang chưa tải xong
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Đã có lỗi khi hiển thị trang này trên máy của bạn. Bạn thử tải lại
            giúp chúng tôi nhé — nếu vẫn chưa được, hãy mở lại bằng cửa sổ ẩn
            danh hoặc tạm tắt các tiện ích mở rộng của trình duyệt.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Tải lại trang
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Về trang chủ
            </button>
          </div>
          {error.digest ? (
            <p className="font-mono text-xs text-muted-foreground">
              Mã lỗi: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
