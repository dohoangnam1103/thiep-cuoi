import Link from "next/link";

import { PageState } from "../states/page-state";
import vi from "@messages/vi.json";

/* First-run dashboard: one road points at the catalog. */
export function DashboardEmptyState() {
  return (
    <PageState
      kind="empty"
      title={vi.dashboard.title}
      description={vi.dashboard.empty}
      action={
        <Link
          href="/mau-thiep"
          className="inline-block rounded-full bg-[var(--s2-accent)] px-7 py-3 text-[15px] font-semibold text-[var(--s2-accent-ink)] transition-transform active:scale-[0.98]"
        >
          {vi.home.browseCta}
        </Link>
      }
    />
  );
}
