"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { buildVietQrUrl } from "@/lib/payment";
import { createPaymentPoller } from "@/lib/payment-polling";

import type { SlideshowPaymentInfo } from "./actions";

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1_800);
    return () => window.clearTimeout(timer);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard?.writeText(value).then(() => setCopied(true))}
      className="grid size-8 place-items-center rounded-full border border-white/15 text-white/65 hover:bg-white/10"
      aria-label={label}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export function SlideshowPaymentPanel({
  initial,
  projectId,
}: {
  initial: SlideshowPaymentInfo;
  projectId: string;
}) {
  const t = useTranslations("slideshowPayment");
  const router = useRouter();
  const [status, setStatus] = useState(initial.status);
  const qrUrl = initial.provider === "payos"
    ? `/api/slideshow-payments/${initial.code}/qr`
    : buildVietQrUrl({ amount: initial.amount, code: initial.code });

  useEffect(() => {
    if (status !== "pending") return;
    const poller = createPaymentPoller({
      now: Date.now,
      isVisible: () => document.visibilityState !== "hidden",
      setTimer: (callback, delay) => window.setTimeout(callback, delay),
      clearTimer: (handle) => window.clearTimeout(handle as number),
      request: async (signal) => {
        const response = await fetch(`/api/slideshow-payments/${initial.code}/status`, {
          cache: "no-store",
          signal,
        });
        if (!response.ok) {
          if ([401, 403, 404].includes(response.status)) return "unavailable";
          throw new Error(`payment status ${response.status}`);
        }
        const data = await response.json() as { status?: string };
        return data.status ?? "unavailable";
      },
      onStatus: (nextStatus) => {
        setStatus(nextStatus);
        if (nextStatus === "paid") {
          router.push(`/trinh-chieu/${projectId}`);
          router.refresh();
        }
        return ["paid", "expired", "cancelled", "review", "unavailable"].includes(nextStatus);
      },
    });
    const onVisibility = () => poller.visibilityChanged();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      poller.dispose();
    };
  }, [initial.code, projectId, router, status]);

  if (status === "paid") {
    return (
      <p className="rounded-2xl border border-[#d8ff3e]/30 bg-[#d8ff3e]/10 p-6 text-center text-[#d8ff3e]">
        {t("paid")}
      </p>
    );
  }
  if (status !== "pending") {
    return (
      <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-center text-amber-200">
        {t("inactive")}
      </p>
    );
  }

  const details = [
    { label: t("bank"), value: initial.bankBin, copy: false },
    { label: t("account"), value: initial.bankAccount, copy: true },
    { label: t("accountName"), value: initial.bankAccountName, copy: false },
    { label: t("content"), value: initial.code, copy: true },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        {/* QR có thể là data/API URL hoặc VietQR remote URL; giữ img không optimize. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt={t("qrAlt")} className="aspect-square w-full rounded-xl bg-white" />
        <p className="mt-3 text-center text-xs text-white/45">{t("scan")}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-white/40">{t("amount")}</p>
        <p className="mt-1 text-3xl font-semibold text-[#d8ff3e]">{formatVnd(initial.amount)}</p>
        <dl className="mt-6 divide-y divide-white/10 text-sm">
          {details.map((detail) => (
            <div key={detail.label} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-white/45">{detail.label}</dt>
              <dd className="flex items-center gap-2 font-medium text-white/90">
                <span>{detail.value}</span>
                {detail.copy ? <CopyButton label={t("copy")} value={detail.value} /> : null}
              </dd>
            </div>
          ))}
        </dl>
        {initial.checkoutUrl ? (
          <a href={initial.checkoutUrl} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#d8ff3e] px-5 py-2.5 text-sm font-semibold text-black">
            {t("openPayos")} <ExternalLink size={15} />
          </a>
        ) : null}
        <p className="mt-4 text-xs leading-relaxed text-white/40">{t("pollingHint")}</p>
      </div>
    </div>
  );
}
