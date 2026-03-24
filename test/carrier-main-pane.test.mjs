import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("carrier-main-pane renders CarrierTopbar", () => {
  const src = read("components/design/carrier-main-pane.tsx");
  assert.match(src, /CarrierTopbar/);
  assert.match(src, /onViewChange/);
});

test("carrier-main-pane renders all four step components conditionally", () => {
  const src = read("components/design/carrier-main-pane.tsx");
  assert.match(src, /StepObjective/);
  assert.match(src, /StepAnalysis/);
  assert.match(src, /StepResults/);
  assert.match(src, /StepDesignOps/);
  assert.match(src, /activeStep.*objective/);
  assert.match(src, /activeStep.*analysis/);
  assert.match(src, /activeStep.*results/);
  assert.match(src, /activeStep.*design-ops/);
});

test("carrier-main-pane passes onNavigateToAnalysis to StepResults", () => {
  const src = read("components/design/carrier-main-pane.tsx");
  assert.match(src, /onNavigateToAnalysis/);
});

test("carrier-main-pane passes onRunComplete to StepAnalysis", () => {
  const src = read("components/design/carrier-main-pane.tsx");
  assert.match(src, /onRunComplete/);
});

test("carrier-main-pane has flex-1 and overflow-hidden", () => {
  const src = read("components/design/carrier-main-pane.tsx");
  assert.match(src, /flex-1/);
  assert.match(src, /overflow-hidden/);
});

test("step-objective wraps DesignOpsObjectives", () => {
  const src = read("components/design/step-objective.tsx");
  assert.match(src, /DesignOpsObjectives/);
});

test("step-analysis wraps DesignOpsCrewRunner", () => {
  const src = read("components/design/step-analysis.tsx");
  assert.match(src, /DesignOpsCrewRunner/);
});

test("step-analysis passes onRunComplete from props", () => {
  const src = read("components/design/step-analysis.tsx");
  assert.match(src, /onRunComplete/);
});
