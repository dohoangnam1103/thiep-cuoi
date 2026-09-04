import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { verifyAccountSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

import { SlideshowCheckoutStart } from "./checkout-start";

export default async function SlideshowPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const checkoutPath = `/trinh-chieu/${encodeURIComponent(id)}/thanh-toan`;
  const [{ userId }, t] = await Promise.all([
    verifyAccountSession(checkoutPath, "slideshow"),
    getTranslations("slideshowPayment"),
  ]);
  const project = await prisma.slideshowProject.findFirst({
    where: { id, userId },
    select: { paid: true, complimentary: true },
  });
  if (!project) notFound();
  const activated = project.paid || project.complimentary;

  return (
    <main className="mx-auto min-h-[100dvh] max-w-4xl px-4 py-10 sm:px-6">
      <Link href={`/trinh-chieu/${id}`} className="text-sm text-white/50 hover:text-white">
        {t("back")}
      </Link>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#d8ff3e]">
        {t("eyebrow")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
        {t("description")}
      </p>
      <div className="mt-8">
        {activated ? (
          <p className="rounded-2xl border border-[#d8ff3e]/30 bg-[#d8ff3e]/10 p-8 text-center text-[#d8ff3e]">
            {t("activated")}
          </p>
        ) : (
          <SlideshowCheckoutStart projectId={id} />
        )}
      </div>
    </main>
  );
}
