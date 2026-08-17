"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { updateInvitationPrice, type PriceMutationState } from "./actions";

function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

type InvitationPriceDialogProps = {
  userId: string;
  invitationId: string;
  systemPrice: number;
  currentOverride: number | null;
  complimentary: boolean;
  paid: boolean;
};

export function InvitationPriceDialog(props: InvitationPriceDialogProps) {
  const t = useTranslations("adminSupport");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Each open mounts a fresh panel so a previous successful mutation does not
  // hide the dialog again the moment it reopens.
  const [generation, setGeneration] = useState(0);
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  if (props.paid) {
    return <PaidPriceForm {...props} />;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setGeneration((value) => value + 1);
          setOpen(true);
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary"
      >
        {t("setPrice")}
      </button>
      {open ? <PriceDialogPanel key={generation} {...props} onClose={close} /> : null}
    </>
  );
}

function PaidPriceForm({
  invitationId,
  systemPrice,
  currentOverride,
}: InvitationPriceDialogProps) {
  const t = useTranslations("adminSupport");
  const inputId = `admin-price-${invitationId}`;
  const defaultValue = currentOverride !== null ? String(currentOverride) : String(systemPrice);

  return (
    <form data-price-invitation-id={invitationId} className="space-y-2">
      <input type="hidden" name="mode" value="set" />
      <input type="hidden" name="invitationId" value={invitationId} />
      <label htmlFor={inputId} className="block text-xs text-muted-foreground">
        {t("finalPriceLabel")}
      </label>
      <input
        id={inputId}
        name="finalPrice"
        defaultValue={defaultValue}
        disabled
        inputMode="numeric"
        className="w-36 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground"
      />
      <button
        type="submit"
        disabled
        className="rounded-lg bg-primary/60 px-3 py-1.5 text-sm font-semibold text-primary-foreground"
      >
        {t("savePrice")}
      </button>
      <p className="text-xs text-muted-foreground">{t("paidPriceLocked")}</p>
    </form>
  );
}

function PriceDialogPanel({
  userId,
  invitationId,
  systemPrice,
  currentOverride,
  complimentary,
  onClose,
}: InvitationPriceDialogProps & { onClose: () => void }) {
  const t = useTranslations("adminSupport");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [state, formAction, pending] = useActionState<PriceMutationState, FormData>(
    updateInvitationPrice.bind(null, userId),
    undefined,
  );

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    onClose();
  }, [onClose, router, state]);

  useEffect(() => {
    const focusFrame = window.requestAnimationFrame(() => inputRef.current?.focus());
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

  const inputId = `admin-price-${invitationId}`;
  const defaultValue = currentOverride !== null ? String(currentOverride) : String(systemPrice);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md space-y-4 rounded-2xl bg-card p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h2 id={titleId} className="font-heading text-lg font-semibold text-foreground">
            {t("priceDialogTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("priceDialogDescription")}</p>
        </div>

        <p className="text-sm text-muted-foreground">
          {t("systemPrice")}: <span className="font-semibold text-foreground">{formatVnd(systemPrice)}</span>
          {currentOverride !== null ? (
            <>
              {" · "}
              {t("customPrice")}:{" "}
              <span className="font-semibold text-foreground">{formatVnd(currentOverride)}</span>
            </>
          ) : null}
          {complimentary ? (
            <>
              {" · "}
              <span className="font-semibold text-foreground">{t("complimentary")}</span>
            </>
          ) : null}
        </p>

        {state && !state.ok ? (
          <p className="text-sm text-destructive">{t(`errors.${state.errorCode}`)}</p>
        ) : null}

        {/* Set form must come before the reset form: E2E targets the first
            input[name="invitationId"] on the page. */}
        <form
          data-price-invitation-id={invitationId}
          action={formAction}
          className="space-y-3"
          onSubmit={(event) => {
            const value = new FormData(event.currentTarget).get("finalPrice");
            if (
              typeof value === "string" &&
              value.trim() === "0" &&
              !window.confirm(t("confirmFree"))
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="mode" value="set" />
          <input type="hidden" name="invitationId" value={invitationId} />
          <div className="space-y-1">
            <label htmlFor={inputId} className="block text-sm text-foreground">
              {t("finalPriceLabel")}
            </label>
            <input
              ref={inputRef}
              id={inputId}
              name="finalPrice"
              defaultValue={defaultValue}
              inputMode="numeric"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground">{t("freeHint")}</p>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {pending ? t("saving") : t("savePrice")}
          </button>
        </form>

        {/* Reset only makes sense while an override exists; hiding it
            otherwise also keeps input[name="invitationId"] unique for
            E2E strict-mode locators. */}
        {currentOverride !== null ? (
          <form
            action={formAction}
            onSubmit={(event) => {
              if (!window.confirm(t("confirmResetFree"))) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="mode" value="reset" />
            <input type="hidden" name="invitationId" value={invitationId} />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary disabled:opacity-60"
            >
              {t("resetPrice")}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
