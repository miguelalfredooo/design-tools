import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("exploration page delegates orchestration to a dedicated hook", () => {
  const page = read("app/explorations/[id]/page.tsx");
  const hook = read("hooks/use-exploration-session-page.ts");

  assert.match(page, /from "@\/hooks\/use-exploration-session-page"/);
  assert.match(page, /useExplorationSessionPage\(id\)/);
  assert.doesNotMatch(page, /^  async function handleStartVoting/m);
  assert.doesNotMatch(page, /^  async function handleReset/m);
  assert.doesNotMatch(page, /^  async function handleReveal/m);
  assert.doesNotMatch(page, /^  async function handleDelete/m);
  assert.doesNotMatch(page, /^  async function castVoteDirectly/m);
  assert.match(hook, /export function useExplorationSessionPage/);
  assert.match(hook, /async function handleStartVoting/);
  assert.match(hook, /async function handleReset/);
  assert.match(hook, /async function handleReveal/);
  assert.match(hook, /async function handleDelete/);
});
