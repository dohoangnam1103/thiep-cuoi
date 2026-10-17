import assert from "node:assert/strict";
import sanitizeHtml from "sanitize-html";

export function ceremonyMarkup(html: string) {
  const regions: string[] = [];
  const items: string[] = [];
  const regionPositions: number[] = [];
  const footerPositions: number[] = [];
  // React SSR emits adjacent text nodes separated by comment markers. Without
  // a separator here, a date such as "Tháng 01" + "2031" collapses into the
  // numerals 1 and 12031, which hides real date assertions.
  sanitizeHtml(html.replace(/<!-- -->/g, " ").replace(/<br\s*\/?>/gi, " ").replace(/></g, "> <"), {
    allowedTags: false, allowedAttributes: false, allowVulnerableTags: true,
    exclusiveFilter(frame) {
      if ("data-template-ceremonies" in frame.attribs) {
        regions.push(frame.text);
        regionPositions.push(frame.tagPosition);
      }
      if ("data-template-ceremony-item" in frame.attribs) items.push(frame.text);
      if (frame.tag === "footer" || "data-template-footer" in frame.attribs) footerPositions.push(frame.tagPosition);
      return false;
    },
  });
  return { regions, items, regionPositions, footerPositions };
}

// Expected values come directly from the fixture, not production formatDate.
// Art-family cards intentionally show only day.month; other native layouts
// display the year too. Text nodes are separated before extracting numerals.
export function assertCeremonyDate(text: string, date: string, time: string, omitYear: boolean, label: string) {
  const [year, month, day] = date.split("-").map(Number);
  const numerals = text.replaceAll(time, "").match(/\d+/g)?.map(Number) ?? [];
  const hasDayAndMonth = numerals.some((value, index) =>
    (value === day && numerals[index + 1] === month)
    || (value === month && numerals[index + 1] === day));
  assert.ok(hasDayAndMonth, `${label}: own day/month ${day}/${month}; actual ${text}`);
  if (!omitYear) assert.ok(numerals.includes(year), `${label}: own year ${year}; actual ${text}`);
}
