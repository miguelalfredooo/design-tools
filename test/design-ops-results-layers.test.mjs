import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("extractSection is exported from design-ops-formatting", () => {
  const formatting = read("lib/design-ops-formatting.ts");
  assert.match(formatting, /export function extractSection/);
  assert.match(formatting, /sectionName/);
});

test("DesignOpsFindingsSummary component exists and has correct structure", () => {
  const summary = read("components/design/design-ops-findings-summary.tsx");

  // Receives messages array
  assert.match(summary, /messages.*AgentMessage\[\]|AgentMessage\[\].*messages/);

  // Filters to synthesis message
  assert.match(summary, /research_insights/);
  assert.match(summary, /confidence\s*!==\s*["']n\/a["']/);

  // Uses extractSection
  assert.match(summary, /extractSection/);
  assert.match(summary, /RECOMMENDATION/);
  assert.match(summary, /TOP FINDINGS/);

  // Empty state
  assert.match(summary, /Run an analysis to see results here/);

  // No agent names surfaced
  assert.doesNotMatch(summary, /Research & Insights/);
  assert.doesNotMatch(summary, /Design Strategy/);
});

test("carrier-shell wires view param and renders correct layer", () => {
  const shell = read("components/design/carrier-shell.tsx");

  // Reads view param
  assert.match(shell, /view.*shared|"shared"/);

  // Passes view to main pane
  assert.match(shell, /CarrierMainPane/);
  assert.match(shell, /view={view}/);
});

test("step-results renders both private and shared layers", () => {
  const stepResults = read("components/design/step-results.tsx");
  // Private view renders run cards
  assert.match(stepResults, /view.*private|'private'/);
  // Shared view is a filtered render
  assert.match(stepResults, /view.*shared|'shared'/);
  // Both views include the summary strip
  assert.match(stepResults, /SummaryStrip/);
});
