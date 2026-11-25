import assert from "node:assert/strict";
import test from "node:test";

import {
  coordinatesFromGoogleMapsUrl,
  detectMapLocation,
  isGoogleMapsShortUrl,
  isGoogleMapsUrl,
  mapLocationQuery,
} from "./google-maps";

test("recognizes full and shortened Google Maps links", () => {
  assert.equal(isGoogleMapsUrl("https://www.google.com/maps/place/Da+Nang"), true);
  assert.equal(isGoogleMapsUrl("https://maps.google.com/?q=Da+Nang"), true);
  assert.equal(isGoogleMapsUrl("https://maps.app.goo.gl/abc123"), true);
  assert.equal(isGoogleMapsShortUrl("https://maps.app.goo.gl/abc123"), true);
  assert.equal(isGoogleMapsUrl("https://google.com.evil.example/maps/place/test"), false);
});

test("extracts exact coordinates from common Google Maps links", () => {
  assert.equal(
    coordinatesFromGoogleMapsUrl("https://www.google.com/maps/place/Test/@10.8218305,106.6912054,15z"),
    "10.8218305,106.6912054",
  );
  assert.equal(
    coordinatesFromGoogleMapsUrl("https://www.google.com/maps/place/Test/data=!3d10.8218252!4d106.6937803"),
    "10.8218252,106.6937803",
  );
  assert.equal(
    coordinatesFromGoogleMapsUrl("https://maps.google.com/maps?q=10.7769%2C106.7009"),
    "10.7769,106.7009",
  );
});

test("rejects coordinates outside valid latitude and longitude ranges", () => {
  assert.equal(
    coordinatesFromGoogleMapsUrl("https://www.google.com/maps?q=191,220"),
    null,
  );
});

test("distinguishes a typed address from a Google Maps location link", () => {
  assert.deepEqual(detectMapLocation("  123 Nguyễn Huệ, TP. Hồ Chí Minh  "), {
    type: "address",
    value: "123 Nguyễn Huệ, TP. Hồ Chí Minh",
  });
  assert.deepEqual(
    detectMapLocation("https://www.google.com/maps/place/Test/@10.8218305,106.6912054,15z"),
    {
      type: "google-maps",
      value: "https://www.google.com/maps/place/Test/@10.8218305,106.6912054,15z",
      coordinates: "10.8218305,106.6912054",
    },
  );
});

test("uses coordinates or the place query from a Google Maps link", () => {
  assert.equal(
    mapLocationQuery("https://www.google.com/maps/place/Test/@10.8218305,106.6912054,15z"),
    "10.8218305,106.6912054",
  );
  assert.equal(
    mapLocationQuery("https://www.google.com/maps/place/Areca+Garden+Restaurant"),
    "Areca Garden Restaurant",
  );
  assert.equal(mapLocationQuery("Nhà hàng Hoa Mai, 123 Nguyễn Huệ"), "Nhà hàng Hoa Mai, 123 Nguyễn Huệ");
  assert.equal(
    mapLocationQuery("https://www.google.com/maps/place/Test/@10.82,106.69,15z/data=!3d10.77!4d106.7"),
    "10.77,106.7",
  );
  assert.equal(
    mapLocationQuery("https://www.google.com/maps/search/?api=1&query=Nh%C3%A0+h%C3%A0ng+Hoa+Mai&broken=%"),
    "Nhà hàng Hoa Mai",
  );
});
