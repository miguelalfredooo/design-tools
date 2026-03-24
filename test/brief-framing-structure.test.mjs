import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("creator tools PRD page uses the global creator tools shell and includes the PRD framing rule", () => {
  const page = read("app/drops/creator-tools/prd/page.tsx");
  const component = read("components/design/brief-framing-sequence.tsx");

  assert.match(page, /CreatorToolsShell/);
  assert.match(page, /PRD \/ Brief/);
  assert.match(page, /Design Plan/);
  assert.match(page, /Research/);
  assert.match(page, /BriefFramingSequence/);
  assert.match(page, /Executive Summary/);
  assert.match(page, /User Stories & Problem Statement/);
  assert.match(page, /Goals, Metrics & Definition of Success/);
  assert.match(page, /Functional Requirements & Scope/);
  assert.match(page, /problem -> proposed capability -> expected outcome/i);
  assert.match(page, /DataTable/);
  assert.doesNotMatch(page, /TabsList/);
  assert.doesNotMatch(page, /max-w-3xl text-sm leading-7 text-muted-foreground/);
  assert.match(component, /Goal -&gt; problem\/opportunity -&gt; proposed solution -&gt; expected outcome/i);
});

test("session brief includes the shared framing rule", () => {
  const brief = read("components/design/session-brief.tsx");
  const component = read("components/design/brief-framing-sequence.tsx");

  assert.match(brief, /BriefFramingSequence/);
  assert.match(component, /Goal/);
  assert.match(component, /Problem \/ Opportunity/);
  assert.match(component, /Proposed Solution/);
  assert.match(component, /Expected Outcome/);
});

test("session creation surfaces mention the same framing order", () => {
  const page = read("app/new/page.tsx");
  const dialog = read("components/design/create-session-dialog.tsx");
  const inputs = read("components/design/session-brief-inputs.tsx");
  const liveDraftFields = read("components/design/live-draft-header-fields.tsx");

  assert.match(page, /SessionBriefInputs/);
  assert.match(dialog, /SessionBriefInputs/);
  assert.match(page, /LiveDraftHeaderFields/);
  assert.match(dialog, /LiveDraftHeaderFields/);
  assert.match(inputs, /BriefFramingSequence/);
  assert.match(page, /Session title\.\.\./i);
  assert.match(page, /Proposed solution or concept summary for voters/i);
  assert.match(dialog, /Homepage hero redesign/i);
  assert.match(dialog, /Proposed solution or concept summary for voters/i);
  assert.match(liveDraftFields, /titlePlaceholder/);
  assert.match(liveDraftFields, /descriptionPlaceholder/);
});
