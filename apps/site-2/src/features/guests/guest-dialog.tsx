"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { createGuestAction, updateGuestAction } from "./actions";
import type { GuestInput, GuestListItem } from "./types";
import vi from "@messages/vi.json";

/* Create/edit dialog built on the native <dialog> element: Escape closes it
 * and focus returns to the trigger without extra code. */
export function GuestDialog({
  invitationId,
  guest,
  onClose,
}: {
  invitationId: string;
  guest: GuestListItem | null;
  onClose: (saved: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(guest?.name ?? "");
  const [group, setGroup] = useState(guest?.group ?? "");
  const [phone, setPhone] = useState(guest?.phone ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setFieldErrors({});
    setFormError(null);
    const input: GuestInput = { name, group, phone };
    const result = guest
      ? await updateGuestAction(invitationId, guest.id, input)
      : await createGuestAction(invitationId, input);
    setPending(false);
    if (result.ok) {
      onClose(true);
      return;
    }
    if (result.fieldErrors) setFieldErrors(result.fieldErrors);
    setFormError(result.formError);
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="guest-dialog-title"
      onClose={() => onClose(false)}
      className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[var(--s2-line)] bg-[var(--s2-surface)] p-6 text-[var(--s2-ink)] backdrop:bg-black/40"
    >
      <h2
        id="guest-dialog-title"
        className="text-lg font-extrabold text-[var(--s2-ink)]"
      >
        {guest ? vi.guests.editTitle : vi.guests.createTitle}
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div>
          <label
            htmlFor="guest-name"
            className="mb-1.5 block text-sm font-semibold text-[var(--s2-ink)]"
          >
            {vi.guests.nameLabel}
          </label>
          <input
            id="guest-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="off"
            aria-invalid={fieldErrors.name ? true : undefined}
            className="w-full rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-2.5 text-base text-[var(--s2-ink)] outline-none focus:border-[var(--s2-accent)] aria-[invalid=true]:border-[var(--s2-danger)]"
          />
          {fieldErrors.name ? (
            <p className="mt-1.5 text-[13px] text-[var(--s2-danger)]">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="guest-group"
              className="mb-1.5 block text-sm font-semibold text-[var(--s2-ink)]"
            >
              {vi.guests.groupLabel}
            </label>
            <input
              id="guest-group"
              name="group"
              value={group}
              onChange={(event) => setGroup(event.target.value)}
              autoComplete="off"
              className="w-full rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-2.5 text-base text-[var(--s2-ink)] outline-none focus:border-[var(--s2-accent)]"
            />
          </div>
          <div>
            <label
              htmlFor="guest-phone"
              className="mb-1.5 block text-sm font-semibold text-[var(--s2-ink)]"
            >
              {vi.guests.phoneLabel}
            </label>
            <input
              id="guest-phone"
              name="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="off"
              className="w-full rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-2.5 text-base text-[var(--s2-ink)] outline-none focus:border-[var(--s2-accent)]"
            />
          </div>
        </div>
        {formError ? (
          <p role="alert" className="text-[14px] font-medium text-[var(--s2-danger)]">
            {formError}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => ref.current?.close()}
            className="rounded-full border border-[var(--s2-line)] px-5 py-2.5 text-[14px] font-semibold text-[var(--s2-ink)] disabled:opacity-60"
          >
            {vi.guests.cancel}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--s2-accent)] px-5 py-2.5 text-[14px] font-semibold text-[var(--s2-accent-ink)] disabled:opacity-60"
          >
            {pending ? vi.auth.pendingCta : vi.guests.saveGuest}
          </button>
        </div>
      </form>
    </dialog>
  );
}
