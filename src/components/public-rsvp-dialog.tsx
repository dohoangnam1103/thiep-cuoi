"use client";

import { Dialog } from "@base-ui/react/dialog";
import { CheckCircle2, Loader2, Send, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { useLiveForms } from "@/components/chungdoi-live-forms";
import { Combobox } from "@/components/ui/combobox";

const FIELD_CLASS =
  "min-h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-500 focus:border-neutral-700 focus:ring-2 focus:ring-neutral-900/10";

export function PublicRsvpDialog() {
  const live = useLiveForms();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(live?.rsvpAction ?? (async () => undefined), undefined);

  useEffect(() => {
    if (state?.ok) trackEvent("submit_rsvp");
  }, [state]);

  if (!live) return null;

  const { guest, questions, rsvpLabels: label } = live;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="fixed bottom-5 left-4 z-40 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 sm:left-6">
        <Send className="size-4" aria-hidden />
        {label.open}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-[130] flex items-end justify-center overflow-y-auto sm:items-center sm:p-4">
          <Dialog.Popup className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 text-neutral-900 shadow-2xl outline-none transition data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-2xl font-bold">{label.title}</Dialog.Title>
                <Dialog.Description className="mt-1.5 text-sm leading-6 text-neutral-600">
                  {live.recipientLabel || label.description}
                </Dialog.Description>
              </div>
              <Dialog.Close aria-label={label.close} className="grid size-10 shrink-0 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>

            {state?.ok ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
                <p className="mt-4 font-semibold text-neutral-900">{label.success}</p>
                <Dialog.Close className="mt-5 min-h-11 rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800">
                  {label.close}
                </Dialog.Close>
              </div>
            ) : (
              <form action={formAction} className="mt-6 space-y-5">
                {guest ? <input type="hidden" name="guestId" value={guest.token} /> : null}
                <label className="grid gap-2 text-sm font-medium">
                  {label.name}
                  <input name="name" required maxLength={120} defaultValue={guest?.name ?? ""} className={FIELD_CLASS} />
                </label>

                <fieldset className="grid gap-2">
                  <legend className="text-sm font-medium">{label.attending}</legend>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex min-h-12 items-center gap-2 rounded-xl border border-neutral-300 px-3 text-sm font-medium">
                      <input type="radio" name="attending" value="yes" defaultChecked className="accent-neutral-900" />
                      {label.attendingYes}
                    </label>
                    <label className="flex min-h-12 items-center gap-2 rounded-xl border border-neutral-300 px-3 text-sm font-medium">
                      <input type="radio" name="attending" value="no" className="accent-neutral-900" />
                      {label.attendingNo}
                    </label>
                  </div>
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    {label.guestCount}
                    <input name="guests" type="number" min={1} max={guest?.maxGuests ?? 20} defaultValue={1} className={FIELD_CLASS} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    {label.side}
                    <Combobox
                      variant="neutral"
                      aria-label={label.side}
                      name="side"
                      defaultValue={guest?.side ?? ""}
                      options={[
                        { value: "", label: label.sideEmpty },
                        { value: "Nhà trai", label: label.groomSide },
                        { value: "Nhà gái", label: label.brideSide },
                      ]}
                    />
                  </label>
                </div>

                <label className="flex min-h-11 items-center gap-3 rounded-xl border border-neutral-300 px-3.5 text-sm font-medium">
                  <input type="checkbox" name="shuttle" value="yes" className="size-4 accent-neutral-900" />
                  {label.shuttle}
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  {label.dietary}
                  <input name="dietary" maxLength={200} className={FIELD_CLASS} />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  {label.songRequest}
                  <input name="songRequest" maxLength={200} className={FIELD_CLASS} />
                </label>

                {questions.map((question) => (
                  <fieldset key={question.id} className="grid gap-2">
                    <legend className="text-sm font-medium">
                      {question.label}{question.required ? " *" : ""}
                    </legend>
                    {question.type === "text" ? (
                      <input name={`question:${question.id}`} required={question.required} maxLength={500} className={FIELD_CLASS} />
                    ) : question.type === "boolean" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-neutral-300 px-3 text-sm">
                          <input type="radio" name={`question:${question.id}`} value="yes" required={question.required} className="accent-neutral-900" />
                          {label.answerYes}
                        </label>
                        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-neutral-300 px-3 text-sm">
                          <input type="radio" name={`question:${question.id}`} value="no" required={question.required} className="accent-neutral-900" />
                          {label.answerNo}
                        </label>
                      </div>
                    ) : (
                      <Combobox
                        variant="neutral"
                        aria-label={question.label}
                        name={`question:${question.id}`}
                        defaultValue=""
                        placeholder={label.selectPlaceholder}
                        options={question.options.map((option) => ({
                          value: option,
                          label: option,
                        }))}
                      />
                    )}
                  </fieldset>
                ))}

                <label className="grid gap-2 text-sm font-medium">
                  {label.message}
                  <textarea name="message" rows={3} maxLength={1000} className={FIELD_CLASS} />
                </label>
                {state?.error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
                <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60">
                  {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                  {pending ? label.submitting : label.submit}
                </button>
              </form>
            )}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
