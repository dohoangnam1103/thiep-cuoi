import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { orderedCouple } from "@/lib/invitation-display";

export function googleCalendarUrl(content: ChungDoiDemoContent) {
  const { date, time } = content.couple;
  const people = orderedCouple(content);
  const title = `Đám cưới ${people[0].shortName} & ${people[1].shortName}`;
  const start = `${date.replace(/-/g, "")}T${(time || "18:00").replace(":", "")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${start}`,
    location: content.venue.mapAddress || content.venue.address,
    details: content.venue.address,
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}
