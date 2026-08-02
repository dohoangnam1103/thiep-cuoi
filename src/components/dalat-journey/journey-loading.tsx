import type { DalatJourneyCopy } from "@/data/dalat-journey";

export type JourneyLoadingProps = {
  copy: DalatJourneyCopy;
};

export function JourneyLoading({ copy }: JourneyLoadingProps) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center px-6 text-center"
      data-testid="dalat-journey-loading"
      role="status"
    >
      <p className="max-w-[32ch] text-base leading-6 text-[#9db3a4] sm:text-lg sm:leading-7">
        {copy.loading}
      </p>
    </div>
  );
}
