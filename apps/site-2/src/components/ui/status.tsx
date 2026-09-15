type S2StatusKind =
  | "draft"
  | "published"
  | "unpaid"
  | "pending"
  | "paid"
  | "expired"
  | "failed"
  | "unknown";

type S2StatusProps = {
  kind: S2StatusKind;
  label: string;
};

/* Semantic status badge. Meaning comes from the label text plus a distinct
 * solid or outlined treatment per state, never from a decorative dot. The
 * label is always provided by the caller so copy stays in the message catalog. */
const KIND_CLASSES: Record<S2StatusKind, string> = {
  published:
    "bg-[var(--s2-accent)] text-[var(--s2-accent-ink)]",
  paid: "bg-[var(--s2-accent)] text-[var(--s2-accent-ink)]",
  pending:
    "border border-[var(--s2-warning)] text-[var(--s2-warning)]",
  failed: "border border-[var(--s2-danger)] text-[var(--s2-danger)]",
  draft: "border border-[var(--s2-line)] text-[var(--s2-muted)]",
  unknown: "border border-[var(--s2-line)] text-[var(--s2-muted)]",
  unpaid: "border border-[var(--s2-line)] text-[var(--s2-muted)]",
  expired: "border border-[var(--s2-line)] text-[var(--s2-muted)]",
};

export function S2Status({ kind, label }: S2StatusProps) {
  return (
    <span
      role="status"
      data-s2-status={kind}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${KIND_CLASSES[kind]}`}
    >
      {label}
    </span>
  );
}
