"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  startSlideshowCheckout,
  type SlideshowCheckoutActionState,
} from "./actions";
import { SlideshowPaymentPanel } from "./payment-panel";

const initialState: SlideshowCheckoutActionState = { kind: "idle" };

export function SlideshowCheckoutStart({ projectId }: { projectId: string }) {
  const t = useTranslations("slideshowPayment");
  const startAction = startSlideshowCheckout.bind(null, projectId);
  const [state, formAction, pending] = useActionState(startAction, initialState);

  if (state.kind === "payment") {
    return <SlideshowPaymentPanel initial={state.payment} projectId={projectId} />;
  }
  if (state.kind === "activated") {
    return (
      <p className="rounded-2xl border border-[#d8ff3e]/30 bg-[#d8ff3e]/10 p-8 text-center text-[#d8ff3e]">
        {t("activated")}
      </p>
    );
  }

  const error = state.kind === "provider-error"
    ? t("providerError")
    : state.kind === "not-found"
      ? t("notFound")
      : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
      {error ? <p className="mb-5 text-sm text-red-200">{error}</p> : null}
      <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/55">
        {t("confirmation")}
      </p>
      <form action={formAction} className="mt-6">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#d8ff3e] px-6 py-3 text-sm font-semibold text-black disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? t("starting") : t("start")}
        </button>
      </form>
    </div>
  );
}
