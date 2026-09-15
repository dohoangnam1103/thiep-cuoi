import type { RsvpSummary } from "./types";
import vi from "@messages/vi.json";

/* Owner RSVP totals. Rendered only when at least one guest or response
 * exists; the page shows its empty state otherwise. */
export function RsvpSummary({ summary }: { summary: RsvpSummary }) {
  const stats = [
    {
      testId: "rsvp-count-attending",
      label: vi.rsvp.attendingLabel,
      value: summary.attendingGuests,
      tone: "text-[var(--s2-success)]",
    },
    {
      testId: "rsvp-count-declined",
      label: vi.rsvp.declinedLabel,
      value: summary.declinedGuests,
      tone: "text-[var(--s2-danger)]",
    },
    {
      testId: "rsvp-count-pending",
      label: vi.rsvp.pendingLabel,
      value: summary.pendingGuests,
      tone: "text-[var(--s2-muted)]",
    },
  ];
  return (
    <dl className="grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.testId}
          data-testid={stat.testId}
          className="s2-workspace-card flex flex-col p-5 text-center sm:p-6"
        >
          <dt className="order-2 mt-1 text-[13px] font-medium text-[var(--s2-muted)]">
            {stat.label}
          </dt>
          <dd
            className={`order-1 text-3xl font-extrabold tabular-nums md:text-4xl ${stat.tone}`}
          >
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
