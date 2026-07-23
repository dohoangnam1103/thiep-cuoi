import { TableSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return <TableSkeleton width="max-w-6xl" rows={8} />;
}
