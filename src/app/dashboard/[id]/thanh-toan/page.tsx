import Link from "next/link";
import { notFound } from "next/navigation";

import { verifySession, ownInvitation } from "@/lib/dal";
import { createOrGetPayment } from "./actions";
import { PaymentPanel } from "./PaymentPanel";

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await verifySession();
  const invitation = await ownInvitation(id, userId);
  if (!invitation) notFound();

  if (invitation.paid) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link href="/dashboard" className="text-sm text-muted-foreground transition hover:text-foreground">
          &larr; Về danh sách thiệp
        </Link>
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center shadow">
          <h1 className="font-heading text-2xl font-semibold text-foreground">Đã thanh toán</h1>
          <p className="mt-2 text-muted-foreground">Thiệp này đã được kích hoạt vĩnh viễn.</p>
        </div>
      </main>
    );
  }

  const payment = await createOrGetPayment(id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/dashboard" className="text-sm text-muted-foreground transition hover:text-foreground">
        &larr; Về danh sách thiệp
      </Link>
      <h1 className="mt-3 font-pattaya text-3xl text-foreground">Thanh toán</h1>
      <PaymentPanel initial={payment} />
    </main>
  );
}
