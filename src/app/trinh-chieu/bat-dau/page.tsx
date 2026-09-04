import { randomBytes } from "node:crypto";

import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  isSlideshowTemplateId,
  slideshowTemplateById,
  type SlideshowTemplateId,
} from "@/components/slideshow/templates/catalog";
import { verifyAccountSession } from "@/lib/dal";

import { createSlideshowProject } from "../create-project";

export default async function StartSlideshowPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; error?: string }>;
}) {
  const { template, error } = await searchParams;
  const templateId: SlideshowTemplateId = template && isSlideshowTemplateId(template)
    ? template
    : "cinematic";
  const returnTo = `/trinh-chieu/bat-dau?template=${encodeURIComponent(templateId)}`;
  await verifyAccountSession(returnTo, "slideshow");
  const t = await getTranslations("slideshowStudio");
  const creationKey = randomBytes(24).toString("base64url");
  const manifest = slideshowTemplateById[templateId];
  const errorMessage = error === "unpaid-limit"
    ? "Bạn đang có 3 slideshow chưa thanh toán. Hãy mở khóa một slideshow trước khi tạo thêm."
    : error === "project-limit"
      ? "Tài khoản đã đạt giới hạn slideshow."
      : error
        ? "Chưa thể tạo slideshow. Vui lòng thử lại."
        : "";

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[radial-gradient(circle_at_top,#35342f,#11110f_68%)] px-5">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8ff3e]">Dùng thử miễn phí 3 ngày</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Tạo slideshow mới</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/50">Mẫu <strong className="text-white/80">{t(manifest.nameKey)}</strong> sẽ được tạo trong tài khoản của bạn. Trial bắt đầu sau khi bạn xác nhận.</p>
        {errorMessage ? <p className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">{errorMessage}</p> : null}
        <form action={createSlideshowProject} className="mt-7">
          <input type="hidden" name="templateId" value={templateId} />
          <input type="hidden" name="creationKey" value={creationKey} />
          <button type="submit" className="w-full rounded-full bg-[#d8ff3e] px-5 py-3 text-sm font-semibold text-black hover:bg-[#e2ff73]">Bắt đầu dùng thử</button>
        </form>
        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          <Link href="/trinh-chieu/mau" className="text-white/45 hover:text-white">Quay lại chọn mẫu</Link>
          <Link href="/trinh-chieu/du-an" className="text-white/45 hover:text-white">Slideshow của tôi</Link>
        </div>
      </div>
    </main>
  );
}
