import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("design ops archives route persists completed findings locally", () => {
  const route = read("app/api/design-ops/archives/route.ts");
  const types = read("lib/design-ops-types.ts");

  assert.match(route, /design-ops-archives\.json/);
  assert.match(route, /await fs\.mkdir\(FILE_DIR, \{ recursive: true \}\);/);
  assert.match(route, /if \(!prompt \|\| !Array\.isArray\(messages\) \|\| messages\.length === 0\)/);
  assert.match(route, /mode: mode \|\| "quick_read"/);
  assert.match(route, /archives\.unshift\(newArchive\);/);
  assert.match(route, /export async function DELETE/);
  assert.match(route, /const id = searchParams\.get\("id"\)/);
  assert.match(route, /await writeArchives\(filtered\);/);
  assert.match(types, /export interface DesignOpsArchive/);
  assert.match(types, /mode: SynthesisMode;/);
});

test("carrier shell archives completed runs and passes archives to main pane", () => {
  const shell = read("components/design/carrier-shell.tsx");
  const workspaceHook = read("hooks/use-design-ops-workspace.ts");

  assert.match(shell, /useDesignOpsWorkspace/);
  assert.match(shell, /archiveRun/);
  assert.match(shell, /archives/);
  assert.match(workspaceHook, /fetch\("\/api\/design-ops\/archives"\)/);
  assert.match(workspaceHook, /pendingObjectiveDeletes/);
  assert.match(workspaceHook, /pendingArchiveDeletes/);
  assert.match(workspaceHook, /toast\("Objective removed"/);
  assert.match(workspaceHook, /toast\("Synthesis removed"/);
  assert.match(workspaceHook, /label: "Undo"/);
});

test("design ops timeline uses labeled token-scale sections for synthesis output", () => {
  const timeline = read("components/design/design-ops-timeline.tsx");
  const findingDialog = read("components/design/design-ops-finding-dialog.tsx");
  const formatting = read("lib/design-ops-formatting.ts");

  assert.match(formatting, /export function formatPlainTextSections/);
  assert.match(formatting, /FINDINGS|RECOMMENDATIONS|ASSUMPTIONS|SUBJECT/);
  assert.match(formatting, /TOP FINDINGS/);
  assert.match(formatting, /TOP NEEDS/);
  assert.match(formatting, /"Summary"/);
  assert.match(formatting, /"Details"/);
  assert.match(formatting, /"Top findings"/);
  assert.match(formatting, /"Top needs"/);
  assert.match(timeline, /function isProcessMessage/);
  assert.match(timeline, /formatPlainTextSections\(msg\.body\)/);
  assert.match(timeline, /Process details/);
  assert.match(timeline, /Analyzing objective/);
  assert.match(timeline, /View/);
  assert.match(timeline, /Top 3 findings/);
  assert.match(timeline, /Top 3 needs/);
  assert.match(timeline, /DesignOpsFindingDialog/);
  assert.match(timeline, /synthesisMessages\.length === 0/);
  assert.match(findingDialog, /Assumptions/);
  assert.match(findingDialog, /Next step/);
  assert.match(findingDialog, /Detailed synthesis view/);
});
