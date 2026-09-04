import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  getSlideshowEntitlement,
  parseStoredSlideshowProject,
  slideshowTrialEndsAt,
} from "@/lib/slideshow/project";

import { SlideshowStudio } from "../../slideshow-studio";

export const dynamic = "force-dynamic";

export default async function PublicSlideshowPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const project = await prisma.slideshowProject.findUnique({
    where: { shareToken: token },
  });
  if (!project) notFound();
  const entitlement = getSlideshowEntitlement(project);

  if (entitlement === "expired") {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[radial-gradient(circle_at_top,#34332e,#11110f_65%)] px-5 text-center">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Slideshow đang tạm dừng</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Thời gian dùng thử đã kết thúc</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/50">Chủ slideshow cần mở khóa để đường link hoạt động trở lại. Nội dung và hình ảnh vẫn được giữ nguyên.</p>
        </div>
      </main>
    );
  }

  let draft;
  try {
    draft = parseStoredSlideshowProject(project);
  } catch {
    notFound();
  }

  return (
    <SlideshowStudio
      mode="viewer"
      project={{
        id: project.id,
        title: project.title,
        shareToken: project.shareToken,
        draft,
        revision: project.revision,
        entitlement,
        trialEndsAt: slideshowTrialEndsAt(project.trialStartedAt).toISOString(),
      }}
    />
  );
}
