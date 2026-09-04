"use client";

import { useActionState, useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  recordProjectFundWithdrawal,
  type RecordWithdrawalState,
  voidProjectFundWithdrawal,
  type VoidWithdrawalState,
} from "./actions";

const MAX_WITHDRAWAL_VND = 2_000_000_000;

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}₫`;
}

function moneyDigits(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 10);
}

type AllocationDraft = {
  id: number;
  recipient: string;
  amount: string;
  note: string;
};

const firstAllocation = (): AllocationDraft => ({
  id: 0,
  recipient: "",
  amount: "",
  note: "",
});

export function RecordWithdrawalDialog({
  recordedBalance,
  today,
}: {
  recordedBalance: number;
  today: string;
}) {
  const t = useTranslations("adminFunds");
  const [open, setOpen] = useState(false);
  const [requestKey, setRequestKey] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setRequestKey(window.crypto.randomUUID());
          setOpen(true);
        }}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
      >
        {t("recordButton")}
      </button>
      {open ? (
        <RecordWithdrawalPanel
          key={requestKey}
          requestKey={requestKey}
          recordedBalance={recordedBalance}
          today={today}
          onClose={close}
        />
      ) : null}
    </>
  );
}

function RecordWithdrawalPanel({
  requestKey,
  recordedBalance,
  today,
  onClose,
}: {
  requestKey: string;
  recordedBalance: number;
  today: string;
  onClose: () => void;
}) {
  const t = useTranslations("adminFunds");
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const amountRef = useRef<HTMLInputElement>(null);
  const nextAllocationId = useRef(1);
  const [amount, setAmount] = useState("");
  const [allocations, setAllocations] = useState<AllocationDraft[]>([firstAllocation()]);
  const [state, formAction, pending] = useActionState<RecordWithdrawalState, FormData>(
    recordProjectFundWithdrawal,
    undefined,
  );
  const requestClose = useCallback(() => {
    if (!pending) onClose();
  }, [onClose, pending]);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    onClose();
  }, [onClose, router, state]);

  useEffect(() => {
    const focusFrame = window.requestAnimationFrame(() => amountRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || pending) return;
      event.preventDefault();
      requestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pending, requestClose]);

  if (state?.ok) return null;

  const amountValue = Number(amount) || 0;
  const amountTooLarge = amountValue > MAX_WITHDRAWAL_VND;
  const allocated = allocations.reduce((sum, allocation) => sum + (Number(allocation.amount) || 0), 0);
  const remaining = amountValue - allocated;
  const allocationsMatch = amountValue > 0 && !amountTooLarge && remaining === 0;
  const balanceAfter = recordedBalance - amountValue;

  const updateAllocation = (
    id: number,
    field: "recipient" | "amount" | "note",
    value: string,
  ) => {
    setAllocations((current) =>
      current.map((allocation) =>
        allocation.id === id
          ? { ...allocation, [field]: field === "amount" ? moneyDigits(value) : value }
          : allocation,
      ),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4"
      onClick={requestClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="font-heading text-xl font-semibold text-foreground">
              {t("formTitle")}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("formDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={pending}
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {t("close")}
          </button>
        </div>

        {state && !state.ok ? (
          <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t(`errors.${state.errorCode}`)}
          </p>
        ) : null}

        <form action={formAction} className="mt-5 space-y-5">
          <input type="hidden" name="requestKey" value={requestKey} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="fund-withdrawal-amount" className="text-sm font-medium text-foreground">
                {t("amountLabel")}
              </label>
              <input
                ref={amountRef}
                id="fund-withdrawal-amount"
                name="amount"
                value={amount}
                onChange={(event) => {
                  const nextAmount = moneyDigits(event.target.value);
                  setAllocations((current) =>
                    current.length === 1 &&
                    (current[0].amount === "" || current[0].amount === amount)
                      ? [{ ...current[0], amount: nextAmount }]
                      : current,
                  );
                  setAmount(nextAmount);
                }}
                inputMode="numeric"
                autoComplete="off"
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base font-semibold text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                placeholder="2000000"
              />
              <p className={`text-xs ${amountTooLarge ? "text-destructive" : "text-muted-foreground"}`}>
                {amountTooLarge
                  ? t("amountLimit", { amount: formatVnd(MAX_WITHDRAWAL_VND) })
                  : amountValue > 0
                    ? formatVnd(amountValue)
                    : t("amountHint")}
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="fund-withdrawal-date" className="text-sm font-medium text-foreground">
                {t("dateLabel")}
              </label>
              <input
                id="fund-withdrawal-date"
                name="withdrawnAt"
                type="date"
                defaultValue={today}
                max={today}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">{t("dateHint")}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fund-withdrawal-purpose" className="text-sm font-medium text-foreground">
              {t("purposeLabel")}
            </label>
            <input
              id="fund-withdrawal-purpose"
              name="purpose"
              required
              maxLength={240}
              placeholder={t("purposePlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <fieldset className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
            <legend className="px-1 font-semibold text-foreground">{t("allocationTitle")}</legend>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("allocationDescription")}
            </p>

            <div className="space-y-3">
              {allocations.map((allocation, index) => (
                <div
                  key={allocation.id}
                  className="grid gap-2 rounded-xl border border-border bg-background p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)_auto]"
                >
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs text-muted-foreground" htmlFor={`fund-recipient-${allocation.id}`}>
                      {t("recipientLabel", { number: index + 1 })}
                    </label>
                    <input
                      id={`fund-recipient-${allocation.id}`}
                      name="allocationRecipient"
                      value={allocation.recipient}
                      onChange={(event) => updateAllocation(allocation.id, "recipient", event.target.value)}
                      required
                      maxLength={120}
                      placeholder={t("recipientPlaceholder")}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground" htmlFor={`fund-allocation-amount-${allocation.id}`}>
                      {t("allocationAmountLabel")}
                    </label>
                    <input
                      id={`fund-allocation-amount-${allocation.id}`}
                      name="allocationAmount"
                      value={allocation.amount}
                      onChange={(event) => updateAllocation(allocation.id, "amount", event.target.value)}
                      inputMode="numeric"
                      autoComplete="off"
                      required
                      placeholder="1000000"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllocations((current) => current.filter((item) => item.id !== allocation.id))}
                    disabled={allocations.length === 1}
                    aria-label={t("removeRecipientAria", { number: index + 1 })}
                    className="self-end rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("removeRecipient")}
                  </button>
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs text-muted-foreground" htmlFor={`fund-allocation-note-${allocation.id}`}>
                      {t("allocationNoteLabel")}
                    </label>
                    <input
                      id={`fund-allocation-note-${allocation.id}`}
                      name="allocationNote"
                      value={allocation.note}
                      onChange={(event) => updateAllocation(allocation.id, "note", event.target.value)}
                      maxLength={300}
                      placeholder={t("allocationNotePlaceholder")}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={allocations.length >= 50}
                onClick={() => {
                  const id = nextAllocationId.current;
                  nextAllocationId.current += 1;
                  setAllocations((current) => [
                    ...current,
                    { id, recipient: "", amount: "", note: "" },
                  ]);
                }}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                {t("addRecipient")}
              </button>
              <p className={`text-sm font-medium ${allocationsMatch ? "text-emerald-700" : "text-amber-700"}`}>
                {t("allocationProgress", {
                  allocated: formatVnd(allocated),
                  total: formatVnd(amountValue),
                })}
                {!allocationsMatch && amountValue > 0
                  ? ` · ${t(remaining > 0 ? "allocationRemaining" : "allocationOver", {
                      amount: formatVnd(Math.abs(remaining)),
                    })}`
                  : ""}
              </p>
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="fund-bank-reference" className="text-sm font-medium text-foreground">
                {t("bankReferenceLabel")}
              </label>
              <input
                id="fund-bank-reference"
                name="bankReference"
                required
                minLength={3}
                maxLength={120}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder={t("bankReferencePlaceholder")}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">{t("bankReferenceHint")}</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="fund-withdrawal-note" className="text-sm font-medium text-foreground">
                {t("noteLabel")}
              </label>
              <input
                id="fund-withdrawal-note"
                name="note"
                maxLength={1000}
                placeholder={t("notePlaceholder")}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className={`rounded-xl border px-4 py-3 ${balanceAfter < 0 ? "border-rose-500/30 bg-rose-500/10" : "border-border bg-muted/30"}`}>
            <p className="text-sm text-muted-foreground">
              {t("balanceBefore")}: <span className="font-semibold text-foreground">{formatVnd(recordedBalance)}</span>
            </p>
            <p className={`mt-1 text-base font-semibold ${balanceAfter < 0 ? "text-rose-700" : "text-foreground"}`}>
              {t("balanceAfter")}: {formatVnd(balanceAfter)}
            </p>
            {balanceAfter < 0 ? <p className="mt-1 text-xs text-rose-700">{t("negativeAfterWarning")}</p> : null}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={requestClose}
              disabled={pending}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={pending || !allocationsMatch}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? t("submitting") : t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function VoidWithdrawalDialog({
  withdrawalId,
  amount,
  purpose,
}: {
  withdrawalId: string;
  amount: number;
  purpose: string;
}) {
  const t = useTranslations("adminFunds");
  const [open, setOpen] = useState(false);
  const [generation, setGeneration] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setGeneration((value) => value + 1);
          setOpen(true);
        }}
        className="rounded-lg border border-rose-500/30 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-500/10"
      >
        {t("voidButton")}
      </button>
      {open ? (
        <VoidWithdrawalPanel
          key={generation}
          withdrawalId={withdrawalId}
          amount={amount}
          purpose={purpose}
          onClose={close}
        />
      ) : null}
    </>
  );
}

function VoidWithdrawalPanel({
  withdrawalId,
  amount,
  purpose,
  onClose,
}: {
  withdrawalId: string;
  amount: number;
  purpose: string;
  onClose: () => void;
}) {
  const t = useTranslations("adminFunds");
  const router = useRouter();
  const titleId = useId();
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const [state, formAction, pending] = useActionState<VoidWithdrawalState, FormData>(
    voidProjectFundWithdrawal.bind(null, withdrawalId),
    undefined,
  );

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    onClose();
  }, [onClose, router, state]);

  useEffect(() => {
    const focusFrame = window.requestAnimationFrame(() => reasonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  if (state?.ok) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="font-heading text-xl font-semibold text-foreground">
          {t("voidTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("voidDescription")}</p>
        <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
          <p className="font-semibold text-foreground">{formatVnd(amount)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{purpose}</p>
        </div>

        {state && !state.ok ? (
          <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t(`voidErrors.${state.errorCode}`)}
          </p>
        ) : null}

        <form action={formAction} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={`fund-void-reason-${withdrawalId}`} className="text-sm font-medium text-foreground">
              {t("voidReasonLabel")}
            </label>
            <textarea
              ref={reasonRef}
              id={`fund-void-reason-${withdrawalId}`}
              name="reason"
              required
              minLength={3}
              maxLength={500}
              rows={3}
              placeholder={t("voidReasonPlaceholder")}
              className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-50"
            >
              {pending ? t("voiding") : t("voidSubmit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
