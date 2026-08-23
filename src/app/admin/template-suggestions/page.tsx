import { Bell, ImageIcon, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { verifyAdmin } from "@/lib/admin-dal";
import { formatVietnamDateTime } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

import { updateTemplateSuggestionStatus } from "./actions";

const statusMeta = {
  pending: { label: "Mới", className: "bg-amber-500/15 text-amber-700" },
  in_progress: { label: "Đang tạo mẫu", className: "bg-blue-500/15 text-blue-700" },
  completed: { label: "Hoàn thành", className: "bg-emerald-500/15 text-emerald-700" },
  rejected: { label: "Từ chối", className: "bg-destructive/15 text-destructive" },
} as const;

const formatDate = formatVietnamDateTime;

export default async function AdminTemplateSuggestionsPage() {
  await verifyAdmin();

  const suggestions = await prisma.templateSuggestion.findMany({
    orderBy: { createdAt: "desc" },
  });
  const pendingCount = suggestions.filter((suggestion) => suggestion.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Gợi ý mẫu thiệp ({suggestions.length})</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pendingCount > 0 ? `${pendingCount} yêu cầu mới đang chờ xử lý.` : "Không có yêu cầu mới đang chờ xử lý."}
        </p>
      </div>

      {suggestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center text-muted-foreground">
          Chưa có người dùng gửi gợi ý mẫu thiệp.
        </div>
      ) : (
        <div className="space-y-5">
          {suggestions.map((suggestion) => {
            const meta = statusMeta[suggestion.status as keyof typeof statusMeta] ?? statusMeta.pending;
            return (
              <article
                key={suggestion.id}
                className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-[240px_minmax(0,1fr)]"
              >
                {suggestion.referenceImageUrl ? (
                  <Link
                    href={suggestion.referenceImageUrl}
                    target="_blank"
                    className="relative min-h-56 overflow-hidden bg-muted md:min-h-full"
                  >
                    <Image
                      src={suggestion.referenceImageUrl}
                      alt="Ảnh tham khảo cho gợi ý mẫu thiệp"
                      fill
                      sizes="240px"
                      className="object-cover transition hover:scale-105"
                    />
                  </Link>
                ) : (
                  <div className="flex min-h-44 items-center justify-center bg-muted/50 text-muted-foreground md:min-h-full">
                    <span className="flex flex-col items-center gap-2 text-sm">
                      <ImageIcon className="size-8" /> Không có ảnh
                    </span>
                  </div>
                )}

                <div className="min-w-0 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>
                    <time className="text-xs text-muted-foreground" dateTime={suggestion.createdAt.toISOString()}>
                      {formatDate(suggestion.createdAt)}
                    </time>
                  </div>

                  <p className="mt-5 whitespace-pre-wrap leading-7 text-foreground">{suggestion.description}</p>

                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                    {suggestion.contactEmail ? (
                      <a href={`mailto:${suggestion.contactEmail}`} className="inline-flex items-center gap-2 hover:text-foreground">
                        <Mail className="size-4" /> {suggestion.contactEmail}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2"><Mail className="size-4" /> Không có email</span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <Bell className="size-4" />
                      {suggestion.notifyWhenAvailable ? "Muốn nhận thông báo" : "Không cần thông báo"}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {suggestion.status !== "in_progress" ? (
                      <form action={updateTemplateSuggestionStatus.bind(null, suggestion.id, "in_progress")}>
                        <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                          Bắt đầu tạo mẫu
                        </button>
                      </form>
                    ) : null}
                    {suggestion.status !== "completed" ? (
                      <form action={updateTemplateSuggestionStatus.bind(null, suggestion.id, "completed")}>
                        <button type="submit" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                          Hoàn thành
                        </button>
                      </form>
                    ) : null}
                    {suggestion.status !== "rejected" ? (
                      <form action={updateTemplateSuggestionStatus.bind(null, suggestion.id, "rejected")}>
                        <button type="submit" className="rounded-full border border-border px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/10">
                          Từ chối
                        </button>
                      </form>
                    ) : null}
                    {suggestion.status !== "pending" ? (
                      <form action={updateTemplateSuggestionStatus.bind(null, suggestion.id, "pending")}>
                        <button type="submit" className="rounded-full border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted">
                          Mở lại
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
