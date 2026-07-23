"use client";

import { createContext, useActionState, useContext, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { trackEvent } from "@/lib/analytics";

export type PublicState = { error?: string; ok?: boolean } | undefined;
type ActionFn = (prev: PublicState, formData: FormData) => Promise<PublicState>;
export type GuestPrefill = {
  token: string;
  name: string;
  side: string | null;
  role: string | null;
  greeting: string | null;
  maxGuests: number;
} | null;

export type PublicRsvpQuestion = {
  id: string;
  label: string;
  type: "text" | "boolean" | "select";
  required: boolean;
  options: string[];
};

export type PublicRsvpLabels = {
  open: string;
  title: string;
  description: string;
  close: string;
  name: string;
  attending: string;
  attendingYes: string;
  attendingNo: string;
  guestCount: string;
  side: string;
  sideEmpty: string;
  groomSide: string;
  brideSide: string;
  shuttle: string;
  dietary: string;
  songRequest: string;
  message: string;
  answerYes: string;
  answerNo: string;
  selectPlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
};

export type PublicMediaLabels = {
  open: string;
  title: string;
  description: string;
  close: string;
  contributorName: string;
  contributorPlaceholder: string;
  chooseFiles: string;
  fileHint: string;
  selected: string;
  remove: string;
  upload: string;
  uploading: string;
  loading: string;
  empty: string;
  download: string;
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  previous: string;
  next: string;
  imageAlt: string;
  videoAlt: string;
  success: string;
  errorGeneric: string;
  errorInvalidName: string;
  errorTooManyFiles: string;
  errorImageTooLarge: string;
  errorVideoTooLarge: string;
  errorUnsupported: string;
  errorGalleryFull: string;
};

export type LiveForms = {
  wishAction: ActionFn;
  rsvpAction: ActionFn;
  guest: GuestPrefill;
  recipientLabel: string;
  questions: PublicRsvpQuestion[];
  rsvpLabels: PublicRsvpLabels;
  slug: string;
  mediaLabels: PublicMediaLabels;
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
  const router = useRouter();
  const [state, formAction, pending] = useActionState<PublicState, FormData>(live?.wishAction ?? noop, undefined);

  useEffect(() => {
    if (live && state?.ok) {
      trackEvent("submit_wish");
      router.refresh();
    }
  }, [live, router, state]);

  return {
    isLive: Boolean(live),
    formProps: live ? { action: formAction } : { onSubmit: preventDefault },
    pending,
    state,
  };
}
