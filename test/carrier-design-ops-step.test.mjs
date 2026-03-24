import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("design-ops-module renders status dot with CSS var color", () => {
  const src = read("components/design/design-ops-module.tsx");
  assert.match(src, /var\(--color-status-/);
  assert.match(src, /size-\[7px\]/);
  assert.match(src, /rounded-full/);
});

test("design-ops-module shows correct subtitle per status", () => {
  const src = read("components/design/design-ops-module.tsx");
  assert.match(src, /complete/);
  assert.match(src, /blocked/);
  assert.match(src, /in_progress/);
  assert.match(src, /Not started/);
});

test("design-ops-module uses Collapsible for expand/collapse", () => {
  const src = read("components/design/design-ops-module.tsx");
  assert.match(src, /Collapsible/);
  assert.match(src, /CollapsibleTrigger/);
  assert.match(src, /CollapsibleContent/);
});

test("design-ops-module renders ChevronRight", () => {
  const src = read("components/design/design-ops-module.tsx");
  assert.match(src, /ChevronRight/);
});

test("design-ops-module blocked text uses CSS var color", () => {
  const src = read("components/design/design-ops-module.tsx");
  assert.match(src, /var\(--color-status-blocked\)/);
  assert.match(src, /blockedReason/);
});

test("step-design-ops renders MOCK_MODULES using DesignOpsModule", () => {
  const src = read("components/design/step-design-ops.tsx");
  assert.match(src, /MOCK_MODULES/);
  assert.match(src, /DesignOpsModule/);
});

test("step-design-ops mock data covers all four status states", () => {
  const src = read("components/design/step-design-ops.tsx");
  assert.match(src, /in_progress/);
  assert.match(src, /complete/);
  assert.match(src, /blocked/);
  assert.match(src, /not_started/);
});

test("step-design-ops wraps modules in a Card with divide-y", () => {
  const src = read("components/design/step-design-ops.tsx");
  assert.match(src, /Card/);
  assert.match(src, /divide-y/);
});
