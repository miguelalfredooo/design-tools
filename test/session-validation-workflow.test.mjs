import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("new session page collects evidence status inputs", () => {
  const page = read("app/new/page.tsx");
  const fields = read("components/design/session-validation-fields.tsx");

  assert.match(page, /SessionValidationFields/);
  assert.match(fields, /Evidence status/i);
  assert.match(fields, /Source owner/i);
});

test("create session dialog collects evidence status inputs", () => {
  const dialog = read("components/design/create-session-dialog.tsx");
  const fields = read("components/design/session-validation-fields.tsx");

  assert.match(dialog, /SessionValidationFields/);
  assert.match(fields, /Source owner/i);
});

test("session creation can accept validation metadata", () => {
  const store = read("lib/design-store.tsx");

  assert.match(store, /validation\?: SessionValidation/);
  assert.match(store, /setValidationStateMap/);
});

test("session detail surfaces a drop-readiness guardrail", () => {
  const card = read("components/design/session-validation-card.tsx");

  assert.match(card, /Confirm at least one evidence anchor before using this in a drop/i);
});
