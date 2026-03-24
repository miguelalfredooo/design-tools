// test/carrier-workspace-structure.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolve } from "node:path";

const ROOT = "/Users/miguelarias/cafemedia/design/carrier";
function exists(p) { return fs.existsSync(path.join(ROOT, p)); }
function read(p) { return fs.readFileSync(path.join(ROOT, p), "utf8"); }

// Deleted files must not exist
test("design-ops-client.tsx has been deleted", () => {
  assert.equal(exists("components/design/design-ops-client.tsx"), false);
});
test("design-ops-archive-list.tsx has been deleted", () => {
  assert.equal(exists("components/design/design-ops-archive-list.tsx"), false);
});
test("design-ops-active-objective-summary.tsx has been deleted", () => {
  assert.equal(exists("components/design/design-ops-active-objective-summary.tsx"), false);
});

// .do-* classes must still be present (used by kept components: crew-runner, objectives, objective-fields)
test("globals.css still contains .do-* classes needed by kept components", () => {
  const css = read("app/globals.css");
  assert.match(css, /\.do-/);
  assert.match(css, /\.do-table/);
  assert.match(css, /\.do-badge/);
});

// All new carrier files exist
const REQUIRED = [
  "lib/carrier-types.ts",
  "components/design/carrier-shell.tsx",
  "components/design/carrier-rail.tsx",
  "components/design/spine-nav.tsx",
  "components/design/session-history.tsx",
  "components/design/carrier-topbar.tsx",
  "components/design/carrier-main-pane.tsx",
  "components/design/step-objective.tsx",
  "components/design/step-analysis.tsx",
  "components/design/step-results.tsx",
  "components/design/step-design-ops.tsx",
  "components/design/summary-strip.tsx",
  "components/design/new-run-card.tsx",
  "components/design/run-card.tsx",
  "components/design/insight-card.tsx",
  "components/design/design-ops-module.tsx",
];
for (const f of REQUIRED) {
  test(`${f} exists`, () => assert.equal(exists(f), true));
}

// page.tsx does not import DesignOpsClient
test("page.tsx does not import DesignOpsClient", () => {
  const src = read("app/design-ops/page.tsx");
  assert.doesNotMatch(src, /DesignOpsClient/);
});

// No new carrier component file has hardcoded hex colors in style props or classNames
const CARRIER_COMPONENTS = REQUIRED.filter(f => f.startsWith("components/design/"));
for (const f of CARRIER_COMPONENTS) {
  test(`${f} has no hardcoded hex color`, () => {
    const src = read(f);
    assert.doesNotMatch(src, /style=\{.*#[0-9a-fA-F]{3,6}/);
    assert.doesNotMatch(src, /className=".*#[0-9a-fA-F]/);
  });
}

// globals.css has new color tokens
test('globals.css has carrier color tokens', async () => {
  const css = await readFile(resolve(ROOT, 'app/globals.css'), 'utf8')
  assert.match(css, /--color-status-complete:/, 'missing --color-status-complete')
  assert.match(css, /--color-status-progress:/, 'missing --color-status-progress')
  assert.match(css, /--color-status-blocked:/, 'missing --color-status-blocked')
  assert.match(css, /--color-status-idle:/, 'missing --color-status-idle')
  assert.match(css, /--color-insight-risk-bg:/, 'missing --color-insight-risk-bg')
  assert.match(css, /--color-insight-opportunity-bg:/, 'missing --color-insight-opportunity-bg')
  assert.match(css, /--color-insight-pattern-bg:/, 'missing --color-insight-pattern-bg')
})

// page.tsx positively imports CarrierShell
test('design-ops page imports CarrierShell', async () => {
  const src = await readFile(resolve(ROOT, 'app/design-ops/page.tsx'), 'utf8')
  assert.match(src, /CarrierShell/, 'page.tsx must import CarrierShell')
})

// Design Ops module accepts view prop
test('design-ops-module accepts view prop', async () => {
  const src = await readFile(resolve(ROOT, 'components/design/design-ops-module.tsx'), 'utf8')
  assert.match(src, /view.*private.*shared|view:\s*['"]private/, 'design-ops-module must accept view prop')
})

// carrier-types.ts exports all required types
test('carrier-types.ts exports required types', async () => {
  const src = await readFile(resolve(ROOT, 'lib/carrier-types.ts'), 'utf8')
  assert.match(src, /export\s+type\s+StepId/, 'missing StepId export')
  assert.match(src, /export\s+type\s+StatusId/, 'missing StatusId export')
  assert.match(src, /export\s+type\s+SpineStep/, 'missing SpineStep export')
  assert.match(src, /export\s+type\s+InsightType/, 'missing InsightType export')
  assert.match(src, /export\s+type\s+Insight/, 'missing Insight export (not InsightType)')
  assert.match(src, /export\s+type\s+SummaryData/, 'missing SummaryData export')
})
