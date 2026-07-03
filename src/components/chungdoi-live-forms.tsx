"use client";

import { createContext, useActionState, useContext, type FormEvent } from "react";

export type PublicState = { error?: string; ok?: boolean } | undefined;
type ActionFn = (prev: PublicState, formData: FormData) => Promise<PublicState>;
export type GuestPrefill = { token: string; name: string; side: string | null; role: string | null } | null;

export type LiveForms = {
  wishAction: ActionFn;
  rsvpAction: ActionFn;
  guest: GuestPrefill;
} | null;

const LiveFormsContext = createContext<LiveForms>(null);

export const LiveFormsProvider = LiveFormsContext.Provider;

export function useLiveForms() {
  return useContext(LiveFormsContext);
}

const noop: ActionFn = async () => undefined;
const preventDefault = (event: FormEvent<HTMLFormElement>) => event.preventDefault();

type WishBinding = {
  isLive: boolean;
  formProps: { action: (formData: FormData) => void } | { onSubmit: (event: FormEvent<HTMLFormElement>) => void };
  pending: boolean;
  state: PublicState;
};

/** Binds a template's inline "Sổ lưu bút" form to the real submitWish action when rendered on a published page. */
export function useWishFormBinding(): WishBinding {
  const live = useLiveForms();
  const [state, formAction, pending] = useActionState<PublicState, FormData>(live?.wishAction ?? noop, undefined);

  return {
    isLive: Boolean(live),
    formProps: live ? { action: formAction } : { onSubmit: preventDefault },
    pending,
    state,
  };
}
