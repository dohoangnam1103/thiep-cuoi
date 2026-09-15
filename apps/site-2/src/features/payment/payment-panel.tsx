"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { S2Status } from "../../components/ui/status";
import { ensureSite2OrderAction } from "./actions";
import type { PaymentViewState } from "./types";
import vi from "@messages/vi.json";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;

const STATUS_LABEL: Record<PaymentViewState, string> = {
  disabled: vi.payment.disabledTitle,
  unpaid: vi.payment.statusUnpaid,
  pending: vi.payment.statusPending,
  paid: vi.payment.statusPaid,
  expired: vi.payment.statusExpired,
  failed: vi.payment.statusFailed,
};

const STATUS_KIND = {
  disabled: "unknown",
  unpaid: "unpaid",
  pending: "pending",
  paid: "paid",
  expired: "expired",
  failed: "failed",
} as const;

const amountFormatter = new Intl.NumberFormat("vi-VN");

/* Payment panel: order summary, QR while pending, live status and recovery.
 * Polling stops on terminal states, on unmount and after a bounded number of
 * attempts; paid state only ever arrives from the server. */
export function PaymentPanel({
  invitationId,
  initial,
}: {
  invitationId: string;
  initial: { state: PaymentViewState; code: string; amount: number };
}) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  /* Server truth wins after navigations and refreshes; client transitions
   * (polling, just-created orders) patch the same state below. */
  useEffect(() => {
    setView(initial);
  }, [initial.code, initial.state]);

  useEffect(() => {
    if (view.state !== "pending" || !view.code) return;
    attemptsRef.current = 0;
    const timer = setInterval(async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current > POLL_MAX_ATTEMPTS) {
        clearInterval(timer);
        return;
      }
      try {
        const response = await fetch(
          `/api/payment/${encodeURIComponent(view.code)}/status`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          state?: PaymentViewState;
          amount?: number;
        };
        if (
          data.state &&
          data.state !== view.state &&
          ["paid", "expired", "failed"].includes(data.state)
        ) {
          clearInterval(timer);
          setView((current) => ({ ...current, state: data.state as PaymentViewState }));
          router.refresh();
        }
      } catch {
        /* Transient network failure: keep polling until the budget runs out. */
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router, view.code, view.state]);

  async function handleCreate() {
    setPending(true);
    setError(null);
    const result = await ensureSite2OrderAction(invitationId);
    setPending(false);
    if (result.ok) {
      setView((current) => ({
        ...current,
        state: "pending",
        code: result.data.code,
      }));
      router.refresh();
      return;
    }
    setError(result.formError);
  }

  const terminal = view.state === "paid" || view.state === "expired" || view.state === "failed";

  return (
    <div className="s2-workspace-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-[var(--s2-ink)]">
          {vi.payment.planLabel}
        </h2>
        <S2Status kind={STATUS_KIND[view.state]} label={STATUS_LABEL[view.state]} />
      </div>
      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[14px]">
        <div className="flex items-baseline gap-2">
          <dt className="text-[var(--s2-muted)]">{vi.payment.amountLabel}</dt>
          <dd className="text-xl font-extrabold tabular-nums text-[var(--s2-ink)]">
            {amountFormatter.format(view.amount)} ₫
          </dd>
        </div>
        {view.code ? (
          <div className="flex items-baseline gap-2">
            <dt className="text-[var(--s2-muted)]">{vi.payment.orderLabel}</dt>
            <dd className="font-bold tabular-nums text-[var(--s2-ink)]">
              {view.code}
            </dd>
          </div>
        ) : null}
      </dl>

      {view.state === "pending" && view.code ? (
        <div className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/payment/${encodeURIComponent(view.code)}/qr`}
            alt={vi.payment.qrAlt}
            width={240}
            height={240}
            loading="lazy"
            decoding="async"
            className="h-60 w-60 rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-white"
          />
        </div>
      ) : null}

      {view.state === "paid" ? (
        <p role="status" className="mt-4 text-[15px] text-[var(--s2-muted)]">
          {vi.payment.paidBody}
        </p>
      ) : null}
      {view.state === "expired" ? (
        <p role="status" className="mt-4 text-[15px] text-[var(--s2-muted)]">
          {vi.payment.expiredBody}
        </p>
      ) : null}
      {view.state === "failed" ? (
        <p role="status" className="mt-4 text-[15px] text-[var(--s2-muted)]">
          {vi.payment.failedBody}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {view.state === "unpaid" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleCreate()}
            className="rounded-full bg-[var(--s2-accent)] px-7 py-3 text-[15px] font-semibold text-[var(--s2-accent-ink)] transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {vi.payment.createCta}
          </button>
        ) : null}
        {view.state === "expired" || view.state === "failed" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleCreate()}
            className="rounded-full bg-[var(--s2-accent)] px-7 py-3 text-[15px] font-semibold text-[var(--s2-accent-ink)] transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {vi.payment.newOrderCta}
          </button>
        ) : null}
        {!terminal && view.state !== "unpaid" ? (
          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-full border border-[var(--s2-line)] px-6 py-3 text-[15px] font-semibold text-[var(--s2-ink)]"
          >
            {vi.payment.retryCta}
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-[14px] font-medium text-[var(--s2-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
