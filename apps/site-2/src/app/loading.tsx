import vi from "@messages/vi.json";

/* Loading skeleton mirroring generic page geometry: title block, text lines
 * and one action block. No shell chrome, so invitation routes can use it too. */
export default function Site2Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 md:pt-14">
      <section aria-busy="true" aria-label={vi.states.loading}>
        <span className="sr-only">{vi.states.loading}</span>
        <div className="s2-skeleton h-10 w-2/3 max-w-md" />
        <div className="s2-skeleton mt-4 h-4 w-full max-w-xl" />
        <div className="s2-skeleton mt-2 h-4 w-5/6 max-w-lg" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="s2-skeleton h-56" />
          <div className="s2-skeleton h-56" />
          <div className="s2-skeleton hidden h-56 sm:block lg:block" />
        </div>
      </section>
    </div>
  );
}
