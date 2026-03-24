import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("design-ops-label-helpers exports three lookup functions", () => {
  const helpers = read("lib/design-ops-label-helpers.ts");
  assert.match(helpers, /export function getMetricLabel/);
  assert.match(helpers, /export function getSegmentLabel/);
  assert.match(helpers, /export function getCohortLabel/);
});

test("getMetricLabel maps known values to labels", () => {
  const helpers = read("lib/design-ops-label-helpers.ts");
  assert.match(helpers, /growthMetricOptions/);
  assert.match(helpers, /designOpsSegments/);
  assert.match(helpers, /lifecycleCohortOptions/);
});

test("label helpers fall back to raw value when key is unknown", () => {
  const helpers = read("lib/design-ops-label-helpers.ts");
  assert.match(helpers, /\?\? value|\?\? id/);
});
