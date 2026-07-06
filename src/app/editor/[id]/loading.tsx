import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <div className="pt-24">
      <PageSkeleton width="max-w-4xl" />
    </div>
  );
}
