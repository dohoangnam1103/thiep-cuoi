import assert from "node:assert/strict";
import test from "node:test";
import { formatCalendarDate, formatCalendarDateWithWeekday, isCalendarDate, normalizeCalendarDateLabel, parseCalendarDateInput } from "./calendar-date";

test("calendar dates display DD/MM/YYYY and round-trip without guessing month order", () => {
  for (const iso of ["2026-04-03", "2026-03-04", "2026-11-29", "2024-02-29", "2000-02-29", "0099-01-02"]) {
    assert.equal(parseCalendarDateInput(formatCalendarDate(iso)), iso);
  }
  assert.equal(formatCalendarDate("2026-04-03"), "03/04/2026");
  assert.equal(parseCalendarDateInput("03/04/2026"), "2026-04-03");
});

test("invalid, partial, ISO and impossible human dates cannot silently roll into another day", () => {
  for (const value of ["", "1/2/2026", "03/04/26", "2026-04-03", "31/04/2026", "29/02/2026", "29/02/1900", "00/12/2026", "01/13/2026", "01/01/0000"]) {
    assert.equal(parseCalendarDateInput(value), null, value);
  }
  for (const value of ["2026-02-29", "2026-04-31", "0000-01-01", "2026-1-02"]) {
    assert.equal(isCalendarDate(value), false, value);
    assert.equal(formatCalendarDate(value), "");
  }
});

test("weekday labels keep the calendar day across locales", () => {
  assert.match(formatCalendarDateWithWeekday("2026-04-03", "vi-VN"), /03\/04\/2026$/);
  assert.equal(formatCalendarDateWithWeekday("2026-04-03", "en-US"), "Friday, 03/04/2026");
});

test("legacy slideshow and sharing dates normalize to the same visible format", () => {
  for (const value of ["03.04.2026", "3 · 4 · 2026", "2026-04-03", "03/04/2026"]) {
    assert.equal(normalizeCalendarDateLabel(value), "03/04/2026");
  }
  assert.equal(normalizeCalendarDateLabel("Ngày cưới đang cập nhật"), "Ngày cưới đang cập nhật");
});
