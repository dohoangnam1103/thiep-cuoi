import assert from "node:assert/strict";
import test from "node:test";

import {
  daysUntilWedding,
  parseWeddingDate,
  parseWeddingPaymentFilter,
  parseWeddingRange,
  sortUpcomingWeddings,
  weddingMatchesFilters,
  type UpcomingWeddingRow,
} from "./admin-upcoming-weddings";

const TODAY = "2026-09-10";

function row(
  id: string,
  date: string | null,
  overrides: Partial<Pick<UpcomingWeddingRow, "paid" | "complimentary" | "slug" | "user" | "content">> = {},
): UpcomingWeddingRow {
  return {
    id,
    slug: null,
    paid: false,
    complimentary: false,
    user: { email: null },
    content: { date, brideFullName: "", groomFullName: "" },
    ...overrides,
  };
}

test("parseWeddingDate strictly accepts valid ISO calendar dates", () => {
  assert.equal(parseWeddingDate("2026-02-28")?.toISOString(), "2026-02-28T00:00:00.000Z");
  assert.equal(parseWeddingDate("2026-02-29"), null);
  assert.equal(parseWeddingDate("2026-02-31"), null);
  assert.equal(parseWeddingDate(" 2026-09-10 ")?.getUTCDate(), 10);
  assert.equal(parseWeddingDate("10/09/2026"), null);
});

test("daysUntilWedding uses calendar days and includes today", () => {
  assert.equal(daysUntilWedding(parseWeddingDate(TODAY)!, TODAY), 0);
  assert.equal(daysUntilWedding(parseWeddingDate("2026-09-11")!, TODAY), 1);
  assert.equal(daysUntilWedding(parseWeddingDate("2026-09-09")!, TODAY), -1);
  // A late-night instant still belongs to the same Vietnamese calendar day.
  assert.equal(daysUntilWedding(parseWeddingDate(TODAY)!, new Date("2026-09-10T16:00:00.000Z")), 0);
});

test("filter parsers collapse unknown values to safe defaults", () => {
  assert.equal(parseWeddingPaymentFilter("paid"), "paid");
  assert.equal(parseWeddingPaymentFilter("nope"), "all");
  assert.equal(parseWeddingRange("30"), 30);
  assert.equal(parseWeddingRange("0"), "all");
  assert.equal(parseWeddingRange(undefined), "all");
});

test("weddingMatchesFilters excludes past, invalid, and out-of-range dates", () => {
  const filters = { today: TODAY, range: 7 as const, payment: "all" as const };
  assert.equal(weddingMatchesFilters(row("today", TODAY), filters), true);
  assert.equal(weddingMatchesFilters(row("day-6", "2026-09-16"), filters), true);
  assert.equal(weddingMatchesFilters(row("day-7", "2026-09-17"), filters), false);
  assert.equal(weddingMatchesFilters(row("past", "2026-09-09"), filters), false);
  assert.equal(weddingMatchesFilters(row("bad", "2026-02-31"), filters), false);
  assert.equal(weddingMatchesFilters(row("empty", null), filters), false);
});

test("payment filters distinguish paid, unpaid, and complimentary invitations", () => {
  const options = (payment: "all" | "paid" | "unpaid" | "complimentary") => ({
    today: TODAY,
    range: "all" as const,
    payment,
  });
  const paid = row("paid", TODAY, { paid: true });
  const free = row("free", TODAY, { complimentary: true });
  const pending = row("pending", TODAY);
  assert.equal(weddingMatchesFilters(paid, options("paid")), true);
  assert.equal(weddingMatchesFilters(pending, options("paid")), false);
  assert.equal(weddingMatchesFilters(pending, options("unpaid")), true);
  assert.equal(weddingMatchesFilters(free, options("unpaid")), false);
  assert.equal(weddingMatchesFilters(free, options("complimentary")), true);
  assert.equal(weddingMatchesFilters(paid, options("complimentary")), false);
});

test("weddingMatchesFilters uses Vietnamese-aware invitation search", () => {
  const match = row("a", TODAY, {
    user: { email: "khach@example.com" },
    content: { date: TODAY, brideFullName: "Đặng Thị Mai", groomFullName: "Nguyễn Văn An" },
  });
  assert.equal(weddingMatchesFilters(match, { today: TODAY, range: "all", payment: "all", search: "đặng" }), true);
  assert.equal(weddingMatchesFilters(match, { today: TODAY, range: "all", payment: "all", search: "khach@" }), true);
  assert.equal(weddingMatchesFilters(match, { today: TODAY, range: "all", payment: "all", search: "không có" }), false);
});

test("sortUpcomingWeddings orders by date then stable id", () => {
  const sorted = sortUpcomingWeddings([
    row("z", "2026-09-11"),
    row("b", "2026-09-10"),
    row("a", "2026-09-10"),
    row("invalid", null),
  ]);
  assert.deepEqual(sorted.map(({ id }) => id), ["a", "b", "z", "invalid"]);
});
