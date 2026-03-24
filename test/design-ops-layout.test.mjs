import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("carrier-shell uses rail + main-pane layout", () => {
  const shell = read("components/design/carrier-shell.tsx");

  // Uses CarrierRail and CarrierMainPane
  assert.match(shell, /CarrierRail/);
  assert.match(shell, /CarrierMainPane/);

  // Step-based navigation (replaced collapsible open/close)
  assert.match(shell, /activeStep/);
  assert.match(shell, /setActiveStep/);

  // No wizard nav primitives
  assert.doesNotMatch(shell, /DesignOpsStepNav/);
  assert.doesNotMatch(shell, /Collapsible/);

  // Workspace hook wired
  assert.match(shell, /useDesignOpsWorkspace/);

  // Archives and run completion handled
  assert.match(shell, /archiveRun/);
  assert.match(shell, /archives/);
  assert.match(shell, /onRunComplete/);
});

test("useDesignOpsWorkspace hook does not export wizard state", () => {
  const hook = read("hooks/use-design-ops-workspace.ts");

  // Wizard state removed
  assert.doesNotMatch(hook, /activeStep/);
  assert.doesNotMatch(hook, /setActiveStep/);
  assert.doesNotMatch(hook, /canOpenSynthesis/);
  assert.doesNotMatch(hook, /canOpenFindings/);
  assert.doesNotMatch(hook, /DesignOpsStep/);

  // Data state still present
  assert.match(hook, /pendingObjectiveDeletes/);
  assert.match(hook, /pendingArchiveDeletes/);
  assert.match(hook, /toast\("Objective removed"/);
  assert.match(hook, /toast\("Synthesis removed"/);
  assert.match(hook, /archiveRun/);
});

test("design-ops-step-nav file is deleted", () => {
  const exists = fs.existsSync(
    path.join(root, "components/design/design-ops-step-nav.tsx")
  );
  assert.equal(exists, false, "design-ops-step-nav.tsx should be deleted");
});

test("DesignOpsObjectives uses getMetricLabel for previous objectives display", () => {
  const objectives = read("components/design/design-ops-objectives.tsx");
  assert.match(objectives, /getMetricLabel/);
  assert.match(objectives, /Load/);
  assert.match(objectives, /Previous objectives/);
});
