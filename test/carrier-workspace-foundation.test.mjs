import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("globals.css has --color-status-* tokens in :root", () => {
  const css = read("app/globals.css");
  assert.match(css, /--color-status-complete:/);
  assert.match(css, /--color-status-complete-bg:/);
  assert.match(css, /--color-status-progress:/);
  assert.match(css, /--color-status-progress-bg:/);
  assert.match(css, /--color-status-blocked:/);
  assert.match(css, /--color-status-blocked-bg:/);
  assert.match(css, /--color-status-idle:/);
  assert.match(css, /--color-status-idle-bg:/);
});

test("globals.css has --color-insight-* tokens in :root", () => {
  const css = read("app/globals.css");
  assert.match(css, /--color-insight-risk-bg:/);
  assert.match(css, /--color-insight-risk-text:/);
  assert.match(css, /--color-insight-opportunity-bg:/);
  assert.match(css, /--color-insight-opportunity-text:/);
  assert.match(css, /--color-insight-pattern-bg:/);
  assert.match(css, /--color-insight-pattern-text:/);
});

test("carrier-types.ts exports all required types and constants", () => {
  const src = read("lib/carrier-types.ts");
  assert.match(src, /export type StepId/);
  assert.match(src, /export type StatusId/);
  assert.match(src, /export const STATUS_LABELS/);
  assert.match(src, /export type SpineStep/);
  assert.match(src, /export type InsightType/);
  assert.match(src, /export type Insight/);
  assert.match(src, /export type SummaryData/);
});

test("carrier-types.ts SpineStep includes blockedReason", () => {
  const src = read("lib/carrier-types.ts");
  assert.match(src, /blockedReason\?:/);
});
