import assert from "node:assert/strict";
import test from "node:test";
import { venueDisplayAddress, venueMapQuery } from "./venue-address";

test("venue text preserves legacy addresses and supports independently cleared name and address", () => {
  assert.equal(venueDisplayAddress("Nhà hàng Hoa Mai", "123 Nguyễn Huệ"), "Nhà hàng Hoa Mai\n123 Nguyễn Huệ");
  assert.equal(venueDisplayAddress(undefined, "Nhà hàng Hoa Mai, 123 Nguyễn Huệ"), "Nhà hàng Hoa Mai, 123 Nguyễn Huệ");
  assert.equal(venueDisplayAddress("", "123 Nguyễn Huệ"), "123 Nguyễn Huệ");
  assert.equal(venueDisplayAddress("Nhà hàng Hoa Mai", ""), "Nhà hàng Hoa Mai");
  assert.equal(venueDisplayAddress(null, ""), "");
});

test("maps follow the street address by default and only use a usable optional pin override", () => {
  assert.equal(venueMapQuery("Nhà hàng Hoa Mai", "123 Nguyễn Huệ", ""), "123 Nguyễn Huệ");
  assert.equal(venueMapQuery("Nhà hàng Hoa Mai", "", ""), "Nhà hàng Hoa Mai");
  assert.equal(venueMapQuery("Nhà hàng Hoa Mai", "123 Nguyễn Huệ", "https://www.google.com/maps?q=10.7,106.6"), "https://www.google.com/maps?q=10.7,106.6");
  assert.equal(venueMapQuery("Nhà hàng Hoa Mai", "123 Nguyễn Huệ", "10.7,106.6"), "10.7,106.6");
  assert.equal(venueMapQuery("Nhà hàng Hoa Mai", "123 Nguyễn Huệ", "https://example.com/not-a-map"), "123 Nguyễn Huệ");
  assert.equal(venueMapQuery("Nhà hàng Hoa Mai", "123 Nguyễn Huệ", "https://maps.app.goo.gl/unresolved"), "123 Nguyễn Huệ");
  assert.equal(venueMapQuery("", "", ""), "");
});
