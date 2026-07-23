import type { AnalyticsParams } from "@/lib/analytics";

export function AnalyticsEventOnView({
  eventName,
  params = {},
  additionalEventName,
  cleanQueryParam,
}: {
  eventName: string;
  params?: AnalyticsParams;
  additionalEventName?: string;
  cleanQueryParam?: string;
}) {
  return (
    <span
      hidden
      aria-hidden="true"
      suppressHydrationWarning
      data-ga-view-event={eventName}
      data-ga-view-params={JSON.stringify(params)}
      data-ga-additional-event={additionalEventName}
      data-ga-clean-query-param={cleanQueryParam}
    />
  );
}
