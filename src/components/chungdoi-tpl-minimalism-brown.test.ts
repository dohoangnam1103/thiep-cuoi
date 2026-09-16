import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./chungdoi-tpl-minimalism-brown.tsx", import.meta.url),
  "utf8",
);

test("Minimalism Brown adds reception spacing only when the album is absent", () => {
  assert.match(
    source,
    /\$\{gallery\.length === 0 \? "mt-4 " : ""\}mb-4/,
  );
});
