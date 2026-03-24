// test/carrier-step-results.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("insight-card renders type tag with CSS var colors", () => {
  const src = read("components/design/insight-card.tsx");
  assert.match(src, /var\(--color-insight-/);
  assert.match(src, /insight\.type/);
});

test("insight-card uses Collapsible and disables trigger in shared view", () => {
  const src = read("components/design/insight-card.tsx");
  assert.match(src, /Collapsible/);
  assert.match(src, /CollapsibleTrigger/);
  assert.match(src, /shared/);
});

test("insight-card shows detail in private view only", () => {
  const src = read("components/design/insight-card.tsx");
  assert.match(src, /insight\.detail/);
  assert.match(src, /private/);
  assert.match(src, /CollapsibleContent/);
});

test("step-results renders SummaryStrip, NewRunCard, RunCard, InsightCard", () => {
  const src = read("components/design/step-results.tsx");
  assert.match(src, /SummaryStrip/);
  assert.match(src, /NewRunCard/);
  assert.match(src, /RunCard/);
  assert.match(src, /InsightCard/);
});

test("step-results passes view and onDelete to RunCard", () => {
  const src = read("components/design/step-results.tsx");
  assert.match(src, /view={view}/);
  assert.match(src, /onDelete={onDeleteArchive}/);
});

test("step-results derives SummaryData from archives", () => {
  const src = read("components/design/step-results.tsx");
  assert.match(src, /research_insights/);
  assert.match(src, /SummaryData/);
  assert.match(src, /latestSynthesis/);
});

test("step-results derives insights from Top findings sections", () => {
  const src = read("components/design/step-results.tsx");
  assert.match(src, /deriveInsights/);
  assert.match(src, /Top findings/);
  assert.match(src, /formatPlainTextSections/);
});

test("step-results shared view shows only SummaryStrip and insights", () => {
  const src = read("components/design/step-results.tsx");
  assert.match(src, /view.*shared/);
  assert.doesNotMatch(src, /shared.*RunCard/);
});

test("step-results renders NewRunCard only in private view", () => {
  const src = read("components/design/step-results.tsx");
  assert.match(src, /private/);
  assert.match(src, /NewRunCard/);
});
