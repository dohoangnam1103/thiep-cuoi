type BarProps = { className?: string };

function Bar({ className = "" }: BarProps) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export function PageSkeleton({ width = "max-w-4xl" }: { width?: string }) {
  return (
    <main className={`mx-auto ${width} px-4 py-10 sm:px-6`}>
      <div className="flex items-center justify-between">
        <Bar className="h-8 w-48" />
        <Bar className="h-9 w-28" />
      </div>
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bar key={i} className="h-20 w-full" />
        ))}
      </div>
    </main>
  );
}

export function TableSkeleton({ width = "max-w-4xl", rows = 6 }: { width?: string; rows?: number }) {
  return (
    <main className={`mx-auto ${width} px-4 py-10 sm:px-6`}>
      <div className="flex items-center justify-between">
        <Bar className="h-8 w-40" />
        <Bar className="h-9 w-32" />
      </div>
      <div className="mt-8 overflow-hidden rounded-2xl border border-border">
        <Bar className="h-12 w-full rounded-none" />
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-4 py-4">
              <Bar className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
