import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("design store delegates browser auth and collection queries to dedicated modules", () => {
  const store = read("lib/design-store.tsx");
  const auth = read("lib/design-session-auth.ts");
  const queries = read("lib/design-session-queries.ts");

  assert.match(store, /from "\.\/design-session-auth"/);
  assert.match(store, /from "\.\/design-session-queries"/);
  assert.doesNotMatch(store, /^function getCreatorTokens/m);
  assert.doesNotMatch(store, /^function setCreatorToken/m);
  assert.doesNotMatch(store, /^export function getCreatorToken/m);
  assert.doesNotMatch(store, /^export function getVoterId/m);
  assert.match(auth, /export function getCreatorTokens/);
  assert.match(auth, /export function setCreatorToken/);
  assert.match(auth, /export function getCreatorToken/);
  assert.match(auth, /export function getVoterId/);
  assert.match(queries, /export async function fetchCreatorSessions/);
  assert.match(queries, /export async function fetchAllSessions/);
});
