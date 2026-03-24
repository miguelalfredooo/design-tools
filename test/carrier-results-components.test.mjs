import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("summary-strip renders SummaryData fields", () => {
  const src = read("components/design/summary-strip.tsx");
  assert.match(src, /confidence/);
  assert.match(src, /participants/);
  assert.match(src, /insights/);
  assert.match(src, /recommendation/);
  assert.match(src, /nextSteps/);
});

test("summary-strip renders null values as em dash", () => {
  const src = read("components/design/summary-strip.tsx");
  assert.match(src, /—/);
});

test("summary-strip applies confidence color from CSS var", () => {
  const src = read("components/design/summary-strip.tsx");
  assert.match(src, /var\(--color-status-/);
  assert.match(src, /confidence/);
});

test("summary-strip uses grid layout with Card tiles", () => {
  const src = read("components/design/summary-strip.tsx");
  assert.match(src, /grid/);
  assert.match(src, /Card/);
  assert.match(src, /text-muted-foreground/);
});

test("new-run-card has dashed border and calls onNewRun on click", () => {
  const src = read("components/design/new-run-card.tsx");
  assert.match(src, /border-dashed/);
  assert.match(src, /onNewRun/);
  assert.match(src, /onClick/);
});

test("new-run-card renders Plus icon and New run label", () => {
  const src = read("components/design/new-run-card.tsx");
  assert.match(src, /Plus/);
  assert.match(src, /New run/);
});

test("run-card renders archive prompt and metadata", () => {
  const src = read("components/design/run-card.tsx");
  assert.match(src, /archive\.prompt/);
  assert.match(src, /archive\.createdAt/);
  assert.match(src, /archive\.mode/);
});

test("run-card confidence badge uses CSS var colors", () => {
  const src = read("components/design/run-card.tsx");
  assert.match(src, /var\(--color-status-/);
  assert.match(src, /Badge/);
});

test("run-card opens Sheet on click and shows DesignOpsTimeline or DesignOpsFindingsSummary", () => {
  const src = read("components/design/run-card.tsx");
  assert.match(src, /Sheet/);
  assert.match(src, /DesignOpsTimeline/);
  assert.match(src, /DesignOpsFindingsSummary/);
  assert.match(src, /view.*private/);
});

test("run-card delete triggers onDelete", () => {
  const src = read("components/design/run-card.tsx");
  assert.match(src, /onDelete/);
});
