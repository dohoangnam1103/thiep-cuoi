import assert from "node:assert/strict";
import test from "node:test";

import {
  FLOW_DEMO_CHOREOGRAPHIES,
  FLOW_DEMO_ENGINES,
  flowDemoCombinationIds,
} from "./flow-demo-scenes";

test("flow lab registers five engines and four choreographies", () => {
  assert.deepEqual(FLOW_DEMO_ENGINES, [
    "css",
    "waapi",
    "gsap",
    "canvas",
    "webgl",
  ]);
  assert.deepEqual(FLOW_DEMO_CHOREOGRAPHIES, [
    "splitGate",
    "irisBloom",
    "depthPortal",
    "ribbonSweep",
  ]);
});

test("flow lab exposes every engine and choreography combination", () => {
  assert.equal(flowDemoCombinationIds.length, 20);
  assert.equal(new Set(flowDemoCombinationIds).size, 20);
  assert.ok(flowDemoCombinationIds.includes("webgl:ribbonSweep"));
});
