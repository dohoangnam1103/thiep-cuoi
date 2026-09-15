import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getOwnedInvitation } from "../../../../../lib/dal";
import { getSite2Session } from "../../../../../lib/session";
import { getTemplateMeta } from "../../../../../lib/catalog";
import {
  getSite2OrderView,
  resolveSite2PaymentFeature,
} from "../../../../../features/payment/dal";
import { PaymentPanel } from "../../../../../features/payment/payment-panel";
import { PageState } from "../../../../../components/states/page-state";
import vi from "@messages/vi.json";

export default async function Site2PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSite2Session();
  const { id } = await params;
  if (!session) {
    redirect(`/dang-nhap?next=/dashboard/${id}/thanh-toan`);
  }
  const invitation = await getOwnedInvitation(id, session.userId);
  if (!invitation) {
    notFound();
  }
  if (resolveSite2PaymentFeature() === "disabled") {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6 md:pt-10">
        <PageState
          kind="empty"
          title={vi.payment.disabledTitle}
          description={vi.payment.disabledBody}
        />
      </div>
    );
  }
  const templateName =
    getTemplateMeta(invitation.templateId)?.name ?? invitation.templateId;
  const view = await getSite2OrderView(session.userId, invitation.id);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6 md:pt-10">
      <Link
        href="/dashboard"
        className="text-[14px] font-semibold text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
      >
        ← {vi.editor.backToDashboard}
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--s2-ink)] md:text-4xl">
        {vi.payment.title}
      </h1>
      <p className="mt-2 text-[15px] text-[var(--s2-muted)]">
        {vi.payment.subtitle} {templateName}
      </p>
      <div className="mt-8">
        <PaymentPanel
          invitationId={invitation.id}
          initial={{ state: view.state, code: view.code, amount: view.amount }}
        />
      </div>
    </div>
  );
}
