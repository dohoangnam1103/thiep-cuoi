import { createDashboardInvitation } from "../../app/(workspace)/dashboard/actions";
import vi from "@messages/vi.json";

/* New-invitation form. Template availability is validated server-side by the
 * action; the select only ever lists visible catalog templates. */
export function DashboardActions({
  templates,
}: {
  templates: readonly { slug: string; name: string }[];
}) {
  return (
    <section className="s2-workspace-card mt-8 p-6 sm:p-8">
      <h2 className="text-lg font-extrabold text-[var(--s2-ink)]">
        {vi.dashboard.createTitle}
      </h2>
      <form
        action={createDashboardInvitation}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <label className="flex-1 sm:max-w-xs">
          <span className="sr-only">{vi.dashboard.createTitle}</span>
          <select
            name="templateSlug"
            className="w-full rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-3 text-base text-[var(--s2-ink)] outline-none focus:border-[var(--s2-accent)]"
          >
            {templates.map((template) => (
              <option key={template.slug} value={template.slug}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-[var(--s2-accent)] px-7 py-3 text-[15px] font-semibold text-[var(--s2-accent-ink)] transition-transform active:scale-[0.98]"
        >
          {vi.dashboard.createCta}
        </button>
      </form>
    </section>
  );
}
