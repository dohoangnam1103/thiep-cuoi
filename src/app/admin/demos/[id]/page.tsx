import Link from "next/link";
import { notFound } from "next/navigation";

import { verifyAdmin } from "@/lib/admin-dal";
import { prisma } from "@/lib/prisma";
import { EditorForm } from "@/app/editor/[id]/EditorForm";
import { saveDemo } from "../actions";

export default async function AdminDemoEditPage({ params }: { params: Promise<{ id: string }> }) {
  await verifyAdmin();
  const { id } = await params;

  const invitation = await prisma.invitation.findFirst({
    where: { id, isDemo: true },
    include: {
      content: true,
      schedule: { orderBy: { sortOrder: "asc" } },
      gallery: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!invitation) notFound();

  return (
    <div className="space-y-4">
      <Link href="/admin/demos" className="text-sm text-primary hover:underline">
        ← Danh sách thiệp demo
      </Link>
      <EditorForm
        adminMode
        saveAction={saveDemo}
        invitationId={invitation.id}
        status={invitation.status}
        paid={invitation.paid}
        currentSlug={invitation.slug}
        templateId={invitation.templateId}
        content={invitation.content}
        schedule={invitation.schedule.map((s) => ({ time: s.time, label: s.label }))}
        gallery={invitation.gallery.map((g) => g.url)}
      />
    </div>
  );
}
