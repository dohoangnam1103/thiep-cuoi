export default function SlideshowProjectsLoading() {
  return (
    <main aria-busy="true" className="min-h-[100dvh] bg-[#11110f]">
      <div className="border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="mx-auto h-10 max-w-6xl animate-pulse rounded-xl bg-white/5" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="h-4 w-32 animate-pulse rounded bg-[#d8ff3e]/10" />
        <div className="mt-4 h-10 w-72 max-w-full animate-pulse rounded-xl bg-white/8" />
        <div className="mt-3 h-5 w-[34rem] max-w-full animate-pulse rounded bg-white/5" />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.035]">
              <div className="aspect-[16/7] animate-pulse bg-white/5" />
              <div className="space-y-4 p-6">
                <div className="h-6 w-2/3 animate-pulse rounded bg-white/8" />
                <div className="h-4 w-full animate-pulse rounded bg-white/5" />
                <div className="h-10 w-56 animate-pulse rounded-full bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
