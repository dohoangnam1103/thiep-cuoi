import { verifySession } from "@/lib/dal";
import { getInvitationActivation } from "@/lib/invitation-entitlement";
import { prisma } from "@/lib/prisma";
import { getTemplateLabels, labelFromMap } from "@/lib/template-labels";
import { getTemplateMobileThumbnailOverrides } from "@/lib/template-mobile-thumbnails";
import { logout } from "../(auth)/actions";
import { NewInvitationButton } from "./NewInvitationButton";
import { DashboardInvitationCard } from "./DashboardInvitationCard";

export default async function DashboardPage() {
  const { userId } = await verifySession();

  const [invitations, templateLabels, mobileThumbnailOverrides] = await Promise.all([
    prisma.invitation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        content: { select: { brideFullName: true, groomFullName: true } },
        _count: { select: { rsvps: true, wishes: true } },
      },
    }),
    getTemplateLabels(),
    getTemplateMobileThumbnailOverrides(),
  ]);
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-pattaya text-3xl text-foreground">Thiệp của tôi</h1>
        <div className="flex flex-wrap items-center gap-2">
          <NewInvitationButton
            templateLabels={templateLabels}
            mobileThumbnailOverrides={mobileThumbnailOverrides}
          />
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      </div>

      {invitations.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          Bạn chưa có thiệp nào. Nhấn &quot;Tạo thiệp mới&quot; để bắt đầu.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {invitations.map((inv) => {
            const bride = inv.content?.brideFullName?.trim();
            const groom = inv.content?.groomFullName?.trim();
            const names = [groom, bride].filter(Boolean).join(" & ");
            const templateName = labelFromMap(templateLabels, inv.templateId);
            return (
              <DashboardInvitationCard
                key={inv.id}
                id={inv.id}
                templateId={inv.templateId}
                templateName={templateName}
                title={names || templateName}
                hasNames={Boolean(names)}
                status={inv.status}
                slug={inv.slug}
                activation={getInvitationActivation(inv)}
                publishedAt={inv.publishedAt?.toISOString() ?? null}
                rsvpCount={inv._count.rsvps}
                wishCount={inv._count.wishes}
              />
            );
          })}
        </ul>
      )}
    </main>
  );
}
