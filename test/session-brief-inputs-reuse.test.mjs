import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("session creation surfaces share the same brief inputs component", () => {
  const newPage = read("app/new/page.tsx");
  const dialog = read("components/design/create-session-dialog.tsx");
  const component = read("components/design/session-brief-inputs.tsx");

  assert.match(newPage, /SessionBriefInputs/);
  assert.match(dialog, /SessionBriefInputs/);
  assert.match(component, /Problem \/ Opportunity/);
  assert.match(component, /What outcome are we trying to move\?/);
});
