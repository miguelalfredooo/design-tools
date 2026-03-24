import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("session types include validation metadata", () => {
  const types = read("lib/design-types.ts");

  assert.match(types, /export interface SessionValidation/);
  assert.match(types, /validation\?: SessionValidation/);
  assert.match(types, /evidenceSourceOwner\?: string/);
});

test("session store supports updating validation metadata", () => {
  const store = read("lib/design-store.tsx");
  const storage = read("lib/session-validation-storage.ts");

  assert.match(store, /updateSessionValidation:/);
  assert.match(storage, /export const VALIDATION_STATE_KEY = "design-session-validation"/);
});

test("session detail page surfaces a validation card", () => {
  const sessionPage = read("app/explorations/[id]/page.tsx");

  assert.match(sessionPage, /SessionValidationCard/);
});
