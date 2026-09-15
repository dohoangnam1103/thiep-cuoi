import type { ReactNode } from "react";

type PageStateProps = {
  kind: "loading" | "empty" | "error" | "permission";
  title: string;
  description?: string;
  action?: ReactNode;
};

/* Full page state with exactly one recovery action. Copy always comes from
 * props so it stays in the message catalog. Error states announce themselves
 * to assistive tech; loading states expose skeleton geometry plus busy state. */
export function PageState({ kind, title, description, action }: PageStateProps) {
  if (kind === "loading") {
    return (
      <section
        data-s2-state="loading"
        aria-busy="true"
        aria-label={title}
        className="mx-auto w-full max-w-md px-6 py-16"
      >
        <div className="s2-skeleton h-7 w-2/3" />
        <div className="s2-skeleton mt-3 h-4 w-full" />
        <div className="s2-skeleton mt-2 h-4 w-5/6" />
        <div className="s2-skeleton mt-6 h-11 w-40" />
      </section>
    );
  }
  return (
    <section
      data-s2-state={kind}
      role={kind === "error" ? "alert" : undefined}
      className="mx-auto w-full max-w-md px-6 py-16 text-center"
    >
      <h2 className="text-xl font-bold tracking-tight text-[var(--s2-ink)]">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[var(--s2-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </section>
  );
}
