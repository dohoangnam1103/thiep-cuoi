import type { RsvpListItem } from "./types";
import vi from "@messages/vi.json";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/* Every response, newest first. Semantic table on desktop, compact cards on
 * narrow screens. Counts and filters stay out until the backend needs them:
 * search is premature at this volume. */
export function RsvpList({ responses }: { responses: readonly RsvpListItem[] }) {
  if (responses.length === 0) return null;
  return (
    <>
      <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-[var(--s2-line)] sm:block">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-[var(--s2-line)] text-[13px] text-[var(--s2-muted)]">
              <th scope="col" className="px-4 py-3 font-semibold">
                {vi.guests.nameLabel}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                RSVP
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {vi.rsvp.partyHeader}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {vi.rsvp.labels.message}
              </th>
            </tr>
          </thead>
          <tbody>
            {responses.map((response) => (
              <tr
                key={response.id}
                data-testid="rsvp-row"
                className="border-b border-[var(--s2-line)] align-top last:border-0"
              >
                <th scope="row" className="px-4 py-3 font-semibold text-[var(--s2-ink)]">
                  {response.guestName}
                  <span className="block text-[13px] font-normal text-[var(--s2-muted)]">
                    {dateFormatter.format(response.createdAt)}
                  </span>
                </th>
                <td
                  className={`px-4 py-3 font-semibold ${response.attending ? "text-[var(--s2-success)]" : "text-[var(--s2-danger)]"}`}
                >
                  {response.attending
                    ? vi.rsvp.attendingLabel
                    : vi.rsvp.declinedLabel}
                </td>
                <td className="px-4 py-3 tabular-nums text-[var(--s2-ink)]">
                  {response.partySize}
                </td>
                <td className="max-w-64 px-4 py-3 text-[var(--s2-muted)]">
                  {response.message ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-6 flex flex-col gap-3 sm:hidden">
        {responses.map((response) => (
          <li
            key={response.id}
            data-testid="rsvp-row"
            className="rounded-2xl border border-[var(--s2-line)] bg-[var(--s2-surface)] p-4"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-bold text-[var(--s2-ink)]">
                {response.guestName}
              </p>
              <p
                className={`text-[13px] font-semibold ${response.attending ? "text-[var(--s2-success)]" : "text-[var(--s2-danger)]"}`}
              >
                {response.attending
                  ? vi.rsvp.attendingLabel
                  : vi.rsvp.declinedLabel}
              </p>
            </div>
            <p className="mt-1 text-[13px] text-[var(--s2-muted)]">
              {vi.rsvp.partyLabel.replace("{count}", String(response.partySize))}
              {" · "}
              {dateFormatter.format(response.createdAt)}
            </p>
            {response.message ? (
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--s2-ink)]">
                {response.message}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
