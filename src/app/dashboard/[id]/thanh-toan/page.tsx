import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { bodyClass, dashboardTitleClass, sectionDescClass } from "@/lib/typography";
import { createOrGetPayment } from "./actions";
import { PaymentPanel, PaymentPriceChangedCard } from "./PaymentPanel";

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const preparation = await createOrGetPayment(id);
  if (preparation.kind === "not-found") notFound();
  const t = await getTranslations("paymentActivation");

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/dashboard" className={`${bodyClass} text-muted-foreground transition hover:text-foreground`}>
        &larr; Về danh sách thiệp
      </Link>
      {preparation.kind === "activated" ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center shadow">
          <h1 className={`${dashboardTitleClass} text-foreground`}>
            {preparation.activation === "paid"
              ? t("paidTitle")
              : t("complimentaryTitle")}
          </h1>
          <p className={`mt-2 ${sectionDescClass} text-muted-foreground`}>
            {preparation.activation === "paid"
              ? t("paidDescription")
              : t("complimentaryDescription")}
          </p>
        </div>
      ) : preparation.kind === "price-changed" ? (
        <PaymentPriceChangedCard />
      ) : (
        <>
          <h1 className={`mt-3 ${dashboardTitleClass} text-foreground`}>Thanh toán</h1>
          <PaymentPanel initial={preparation.payment} />
        </>
      )}
    </main>
  );
}
