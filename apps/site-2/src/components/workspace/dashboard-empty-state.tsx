import Image from "next/image";
import Link from "next/link";

import { PageState } from "../states/page-state";
import vi from "@messages/vi.json";

/* First-run dashboard: a garden still above one road to the catalog. */
export function DashboardEmptyState() {
  return (
    <div className="s2-workspace-card mt-8 overflow-hidden">
      <div className="relative">
        <Image
          src="/editorial/garden-arch.svg"
          alt=""
          width={1200}
          height={800}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 768px) 768px, 100vw"
          className="aspect-[16/8] w-full object-cover"
        />
      </div>
      <PageState
        kind="empty"
        title={vi.dashboard.title}
        description={vi.dashboard.empty}
        action={
          <Link
            href="/mau-thiep"
            className="inline-block rounded-full bg-[var(--s2-accent)] px-7 py-3 text-[15px] font-semibold text-[var(--s2-accent-ink)] transition-all duration-300 hover:bg-[color-mix(in_oklab,var(--s2-accent)_88%,#0e1a12)] active:scale-[0.98]"
          >
            {vi.home.browseCta}
          </Link>
        }
      />
    </div>
  );
}
