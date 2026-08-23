"use client";

import { Check, Clock3, Copy } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { trackEvent } from "@/lib/analytics";
import { BANK, buildVietQrUrl } from "@/lib/payment";
import {
  bodyClass,
  bodySmallClass,
  dashboardTitleClass,
  labelClass,
  sectionDescClass,
} from "@/lib/typography";
import {
  applyVoucherToPayment,
  type PaymentInfo,
  type VoucherErrorCode,
} from "./actions";

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

type PaymentTerminalState = "active" | "paid" | "expired" | "superseded";

/**
 * The pending window is 24h (`PAYMENT_PENDING_EXPIRES_HOURS`), so a per-second
 * tick would re-render the panel 86 400 times to move a minutes-resolution
 * label. Half-minute steps plus focus/visibility events keep the countdown
 * honest when the tab comes back from the background.
 */
const CLOCK_RESOLUTION_MS = 30_000;

function subscribeClock(onStoreChange: () => void) {
  const timer = window.setInterval(onStoreChange, CLOCK_RESOLUTION_MS);
  window.addEventListener("focus", onStoreChange);
  document.addEventListener("visibilitychange", onStoreChange);

  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", onStoreChange);
    document.removeEventListener("visibilitychange", onStoreChange);
  };
}

function getClockSnapshot(): number | null {
  return Math.floor(Date.now() / CLOCK_RESOLUTION_MS) * CLOCK_RESOLUTION_MS;
}

function getServerClockSnapshot(): number | null {
  return null;
}

const cardClass = "rounded-2xl border border-border bg-card shadow";

/**
 * Copies one transfer field and confirms in place for ~1.8s. Silently no-ops
 * where the Clipboard API is unavailable (insecure origin, old in-app browsers)
 * so the row still renders the value to type by hand.
 */
function CopyFieldButton({ value, label }: { value: string; label: string }) {
  const t = useTranslations("paymentActivation.panel");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    if (!navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`${copied ? t("copied") : t("copy")}: ${label}`}
      title={copied ? t("copied") : t("copy")}
      className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground transition hover:border-primary/45 hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {copied ? (
        <Check className="size-3.5 text-green-600" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </button>
  );
}

function TransferRow({
  label,
  value,
  mono = false,
  copyable = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-b-0">
      <dt className={`shrink-0 ${bodyClass} text-muted-foreground`}>{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <span
          className={`truncate ${bodyClass} font-semibold text-foreground ${
            mono ? "font-mono tracking-wide" : ""
          }`}
        >
          {value}
        </span>
        {copyable ? <CopyFieldButton value={value} label={label} /> : null}
      </dd>
    </div>
  );
}

/** Time left on the transfer code, at the resolution the clock store ticks. */
function ExpiryCountdown({ expiresAtMs }: { expiresAtMs: number }) {
  const t = useTranslations("paymentActivation.panel");
  const now = useSyncExternalStore(subscribeClock, getClockSnapshot, getServerClockSnapshot);
  if (now === null) return null;
  if (now >= expiresAtMs) return null;

  // Truncate rather than round up: the clock snapshot is floored to a 30s
  // boundary, so rounding up would advertise "24 giờ 1 phút" left on a window
  // that is 24 hours wide. Never promise more time than the code really has.
  const totalMinutes = Math.floor((expiresAtMs - now) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const remaining =
    hours > 0
      ? minutes > 0
        ? t("remainingHoursMinutes", { hours, minutes })
        : t("remainingHours", { hours })
      : minutes > 0
        ? t("remainingMinutes", { minutes })
        : t("remainingLessThanMinute");

  return (
    <span
      title={t("expiresAtTitle", { time: formatDateTime(new Date(expiresAtMs)) })}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 ${bodySmallClass} font-bold text-secondary-foreground`}
    >
      <Clock3 className="size-3" aria-hidden />
      {t("expiresIn", { remaining })}
    </span>
  );
}

export function PaymentPriceChangedCard() {
  const router = useRouter();
  const t = useTranslations("paymentActivation");

  return (
    <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center shadow">
      <h2 className={`${dashboardTitleClass} text-foreground`}>{t("priceChanged")}</h2>
      <p className={`mx-auto mt-2 max-w-md ${sectionDescClass} text-muted-foreground`}>
        {t("priceChangedDescription")}
      </p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="mt-5 rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground transition hover:bg-primary/90"
      >
        {t("reload")}
      </button>
    </div>
  );
}

export function PaymentPanel({ initial }: { initial: PaymentInfo }) {
  const router = useRouter();
  const t = useTranslations("paymentActivation");
  const [payment, setPayment] = useState(initial);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherError, setVoucherError] = useState<VoucherErrorCode | null>(null);
  const [applying, setApplying] = useState(false);
  const [terminalState, setTerminalState] = useState<PaymentTerminalState>(() => {
    if (initial.status === "paid") return "paid";
    if (initial.status === "superseded") return "superseded";
    if (Date.now() >= new Date(initial.expiresAt).getTime()) return "expired";
    return "active";
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const qrUrl = payment.provider === "payos"
    ? `/api/payment/${payment.code}/qr`
    : buildVietQrUrl({ amount: payment.amount, code: payment.code });
  const expiresAtMs = new Date(payment.expiresAt).getTime();

  useEffect(() => {
    if (initial.status !== "paid") {
      trackEvent("begin_checkout", { currency: "VND", value: initial.amount });
    }
  }, [initial.amount, initial.status]);

  useEffect(() => {
    if (terminalState !== "active") return;
    const timeout = setTimeout(
      () => setTerminalState("expired"),
      Math.max(0, expiresAtMs - Date.now()),
    );
    return () => clearTimeout(timeout);
  }, [expiresAtMs, terminalState]);

  useEffect(() => {
    if (terminalState !== "active") return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/${payment.code}/status`);
        if (!res.ok) return;
        const data = (await res.json()) as { status: string };
        if (data.status === "paid") {
          trackEvent("purchase", {
            transaction_id: payment.code,
            currency: "VND",
            value: payment.amount,
            coupon: payment.voucherCode || undefined,
          });
          setTerminalState("paid");
          if (pollRef.current) clearInterval(pollRef.current);
          router.push("/dashboard");
          router.refresh();
        } else if (data.status === "expired") {
          setTerminalState("expired");
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === "superseded") {
          setTerminalState("superseded");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // ignore transient errors, keep polling
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [payment.amount, payment.code, payment.voucherCode, router, terminalState]);

  async function onApplyVoucher() {
    setApplying(true);
    setVoucherError(null);
    const previousAmount = payment.amount;
    const result = await applyVoucherToPayment(payment.paymentId, voucherInput);
    setApplying(false);
    if (result.ok) {
      trackEvent("apply_voucher", {
        currency: "VND",
        discount: Math.max(0, previousAmount - result.payment.amount),
      });
      setPayment(result.payment);
      setVoucherInput("");
      if (result.payment.status === "paid") {
        setTerminalState("paid");
        router.push("/dashboard");
        router.refresh();
      } else if (result.payment.status === "superseded") {
        setTerminalState("superseded");
      } else if (Date.now() >= new Date(result.payment.expiresAt).getTime()) {
        setTerminalState("expired");
      } else {
        setTerminalState("active");
      }
    } else {
      setVoucherError(result.errorCode);
    }
  }

  if (terminalState === "paid") {
    return (
      <div className={`mt-6 p-8 text-center ${cardClass}`}>
        <h2 className={`${dashboardTitleClass} text-foreground`}>{t("panel.successTitle")}</h2>
        <p className={`mt-2 ${sectionDescClass} text-muted-foreground`}>
          {t("panel.successDescription")}
        </p>
      </div>
    );
  }

  if (terminalState === "superseded") {
    return <PaymentPriceChangedCard />;
  }

  if (terminalState === "expired") {
    return (
      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center shadow">
        <h2 className={`${dashboardTitleClass} text-foreground`}>{t("panel.expiredTitle")}</h2>
        <p className={`mx-auto mt-2 max-w-md ${sectionDescClass} text-muted-foreground`}>
          {t("panel.expiredDescription", { time: formatDateTime(new Date(payment.expiresAt)) })}
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="mt-5 rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground transition hover:bg-primary/90"
        >
          {t("panel.expiredCta")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-5">
      <div className={`flex flex-col items-center justify-center gap-3 p-5 ${cardClass}`}>
        <img
          src={qrUrl}
          alt={t("panel.qrAlt")}
          className="aspect-square w-full max-w-[260px] rounded-xl bg-white"
        />
        <div className="text-center">
          <p className={`${bodyClass} font-semibold text-foreground`}>{t("panel.qrTitle")}</p>
          <p className={`mt-0.5 ${bodySmallClass} text-muted-foreground`}>{t("panel.qrHint")}</p>
        </div>
      </div>

      <div className={`p-5 ${cardClass}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className={`${labelClass} text-muted-foreground`}>{t("panel.amountLabel")}</p>
            <p className="mt-1 font-heading text-3xl font-bold leading-tight text-foreground">
              {formatVnd(payment.amount)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            <span
              className={`inline-flex shrink-0 items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 ${bodySmallClass} font-bold text-amber-700`}
            >
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-amber-500" />
              {t("panel.waiting")}
            </span>
            <ExpiryCountdown expiresAtMs={expiresAtMs} />
          </div>
        </div>

        <p className={`mt-5 ${labelClass} text-muted-foreground`}>
          {t("panel.transferHeading")}
        </p>
        <dl className="mt-1.5">
          <TransferRow label={t("panel.bank")} value={t("panel.bankName")} />
          <TransferRow
            label={t("panel.account")}
            value={payment.bankAccount || BANK.account}
            mono
            copyable
          />
          <TransferRow
            label={t("panel.accountName")}
            value={payment.bankAccountName || BANK.name}
          />
          <TransferRow label={t("panel.transferContent")} value={payment.code} mono copyable />
        </dl>

        <p className={`mt-4 rounded-xl bg-secondary/70 px-3.5 py-3 ${bodyClass} text-muted-foreground`}>
          {t("panel.instruction")}
        </p>

        <div className="mt-4">
          {payment.voucherCode ? (
            <p className={`${bodyClass} text-green-700`}>
              {t.rich("panel.voucherApplied", {
                code: payment.voucherCode,
                b: (chunks) => <span className="font-mono font-semibold">{chunks}</span>,
              })}
            </p>
          ) : payment.voucherAllowed ? (
            <div className="flex items-center gap-2">
              <input
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                placeholder={t("panel.voucherPlaceholder")}
                aria-label={t("panel.voucherPlaceholder")}
                className={`min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 ${bodyClass} text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15`}
              />
              <button
                type="button"
                onClick={onApplyVoucher}
                disabled={applying}
                className={`shrink-0 whitespace-nowrap rounded-full border border-border bg-secondary px-5 py-2.5 ${bodyClass} font-bold text-secondary-foreground transition hover:border-primary/45 hover:bg-muted disabled:opacity-50`}
              >
                {applying ? t("panel.voucherApplying") : t("panel.voucherApply")}
              </button>
            </div>
          ) : null}
          {voucherError ? (
            <p className={`mt-2 ${bodyClass} text-red-600`}>{t(`errors.${voucherError}`)}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
