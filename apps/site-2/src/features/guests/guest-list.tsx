"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteGuestAction } from "./actions";
import { GuestDialog } from "./guest-dialog";
import type { GuestAttendance, GuestListItem } from "./types";
import vi from "@messages/vi.json";

const ATTENDANCE_LABEL: Record<GuestAttendance, string> = {
  unknown: vi.guests.attendanceUnknown,
  attending: vi.guests.attendanceAttending,
  declined: vi.guests.attendanceDeclined,
};

const ATTENDANCE_FILTERS: ("all" | GuestAttendance)[] = [
  "all",
  "attending",
  "declined",
  "unknown",
];

function attendanceLabel(filter: "all" | GuestAttendance): string {
  return filter === "all" ? vi.guests.filterAll : ATTENDANCE_LABEL[filter];
}

/* Guest manager list: semantic table on desktop, compact cards below 640px.
 * Search and attendance filter share one predicate. Dialog state (create vs
 * the guest being edited) lives here so rows stay presentational. */
export function GuestList({
  invitationId,
  initialGuests,
}: {
  invitationId: string;
  initialGuests: GuestListItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [attendance, setAttendance] = useState<"all" | GuestAttendance>("all");
  const [dialog, setDialog] = useState<
    { mode: "create" } | { mode: "edit"; guest: GuestListItem } | null
  >(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const needle = query.trim().toLowerCase();
  const guests = initialGuests.filter((guest) => {
    if (attendance !== "all" && guest.attendance !== attendance) return false;
    if (!needle) return true;
    return [guest.name, guest.group ?? "", guest.phone ?? ""]
      .join("\n")
      .toLowerCase()
      .includes(needle);
  });

  function closeDialog(saved: boolean) {
    setDialog(null);
    if (saved) router.refresh();
  }

  async function handleDelete(guestId: string) {
    await deleteGuestAction(invitationId, guestId);
    router.refresh();
  }

  async function handleCopy(guest: GuestListItem) {
    try {
      await navigator.clipboard.writeText(guest.personalUrl);
      setCopiedId(guest.id);
      setTimeout(() => {
        setCopiedId((current) => (current === guest.id ? null : current));
      }, 2000);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="block flex-1">
          <span className="sr-only">{vi.guests.searchLabel}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={vi.guests.searchPlaceholder}
            className="w-full rounded-full border border-[var(--s2-line)] bg-[var(--s2-surface)] px-5 py-2.5 text-base outline-none placeholder:text-[var(--s2-muted)] focus:border-[var(--s2-accent)]"
          />
        </label>
        <div
          role="group"
          aria-label={vi.guests.searchLabel}
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {ATTENDANCE_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={attendance === filter}
              onClick={() => setAttendance(filter)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold ${
                attendance === filter
                  ? "bg-[var(--s2-accent)] text-[var(--s2-accent-ink)]"
                  : "border border-[var(--s2-line)] text-[var(--s2-muted)]"
              }`}
            >
              {attendanceLabel(filter)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDialog({ mode: "create" })}
          className="shrink-0 rounded-full bg-[var(--s2-accent)] px-5 py-2.5 text-[14px] font-semibold text-[var(--s2-accent-ink)] transition-transform active:scale-[0.98]"
        >
          {vi.guests.createCta}
        </button>
      </div>

      {guests.length === 0 ? (
        <div className="mt-8 rounded-[var(--s2-card-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] p-8 text-center">
          <p className="text-[15px] font-semibold text-[var(--s2-ink)]">
            {vi.guests.empty}
          </p>
          <p className="mt-1 text-[14px] text-[var(--s2-muted)]">
            {vi.guests.emptyHint}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 hidden overflow-x-auto rounded-[var(--s2-card-radius)] border border-[var(--s2-line)] sm:block">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-[var(--s2-line)] text-[13px] text-[var(--s2-muted)]">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {vi.guests.nameLabel}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {vi.guests.groupLabel}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    RSVP
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {vi.guests.linkLabel}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <GuestRow
                    key={guest.id}
                    guest={guest}
                    copied={copiedId === guest.id}
                    onCopy={() => void handleCopy(guest)}
                    onEdit={() => setDialog({ mode: "edit", guest })}
                    onDelete={() => void handleDelete(guest.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-6 flex flex-col gap-3 sm:hidden">
            {guests.map((guest) => (
              <GuestCard
                key={guest.id}
                guest={guest}
                copied={copiedId === guest.id}
                onCopy={() => void handleCopy(guest)}
                onEdit={() => setDialog({ mode: "edit", guest })}
                onDelete={() => void handleDelete(guest.id)}
              />
            ))}
          </ul>
        </>
      )}

      {dialog ? (
        <GuestDialog
          invitationId={invitationId}
          guest={dialog.mode === "edit" ? dialog.guest : null}
          onClose={closeDialog}
        />
      ) : null}
    </div>
  );
}

function AttendanceBadge({ value }: { value: GuestAttendance }) {
  const color =
    value === "attending"
      ? "text-[var(--s2-success)]"
      : value === "declined"
        ? "text-[var(--s2-danger)]"
        : "text-[var(--s2-muted)]";
  return <span className={`text-[13px] font-semibold ${color}`}>{ATTENDANCE_LABEL[value]}</span>;
}

function PersonalLink({ guest }: { guest: GuestListItem }) {
  if (!guest.personalUrl) return null;
  return (
    <a
      href={guest.personalUrl}
      className="block max-w-44 truncate font-medium text-[var(--s2-accent)]"
    >
      {vi.guests.linkLabel}
    </a>
  );
}

function RowActions({
  guest,
  copied,
  onCopy,
  onEdit,
  onDelete,
}: {
  guest: GuestListItem;
  copied: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {guest.personalUrl ? (
        <button
          type="button"
          onClick={onCopy}
          className="font-semibold text-[var(--s2-accent)]"
        >
          {copied ? vi.guests.copied : vi.guests.copyLink}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onEdit}
        className="font-semibold text-[var(--s2-ink)]"
      >
        {vi.guests.edit}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="font-semibold text-[var(--s2-danger)]"
      >
        {vi.guests.delete}
      </button>
    </span>
  );
}

function GuestRow(props: {
  guest: GuestListItem;
  copied: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { guest } = props;
  return (
    <tr
      data-testid="guest-row"
      className="border-b border-[var(--s2-line)] last:border-0"
    >
      <th scope="row" className="px-4 py-3 font-semibold text-[var(--s2-ink)]">
        {guest.name}
        {guest.phone ? (
          <span className="block text-[13px] font-normal text-[var(--s2-muted)]">
            {guest.phone}
          </span>
        ) : null}
      </th>
      <td className="px-4 py-3 text-[var(--s2-muted)]">{guest.group ?? "-"}</td>
      <td className="px-4 py-3">
        <AttendanceBadge value={guest.attendance} />
      </td>
      <td className="px-4 py-3">
        <PersonalLink guest={guest} />
      </td>
      <td className="px-4 py-3">
        <RowActions {...props} />
      </td>
    </tr>
  );
}

function GuestCard(props: {
  guest: GuestListItem;
  copied: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { guest } = props;
  return (
    <li
      data-testid="guest-row"
      className="rounded-[var(--s2-card-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] p-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-bold text-[var(--s2-ink)]">{guest.name}</p>
        <AttendanceBadge value={guest.attendance} />
      </div>
      <p className="mt-1 text-[13px] text-[var(--s2-muted)]">
        {[guest.group, guest.phone].filter(Boolean).join(" · ") || "-"}
      </p>
      <div className="mt-2">
        <PersonalLink guest={guest} />
      </div>
      <div className="mt-3 border-t border-[var(--s2-line)] pt-3">
        <RowActions {...props} />
      </div>
    </li>
  );
}
