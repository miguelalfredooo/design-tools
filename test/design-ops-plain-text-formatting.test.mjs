import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("design ops uses a shared plain text formatter for crew output", () => {
  const formatter = read("lib/design-ops-formatting.ts");
  const timeline = read("components/design/design-ops-timeline.tsx");
  const crewRunner = read("components/design/design-ops-crew-runner.tsx");
  const crewMain = read("crew/main.py");

  assert.match(formatter, /export function toPlainText\(/);
  assert.ok(formatter.includes('.replace(/^#{1,6}\\s+/gm, "")'));
  assert.ok(formatter.includes('.replace(/\\*\\*(.*?)\\*\\*/g, "$1")'));
  assert.ok(formatter.includes('.replace(/`([^`]+)`/g, "$1")'));
  assert.match(timeline, /toPlainText\(msg\.body\)/);
  assert.match(timeline, /toPlainText\(msg\.assumptions\)/);
  assert.match(timeline, /toPlainText\(msg\.nextStep\)/);
  assert.match(crewRunner, /toPlainText\(data\.body \|\| ""\)/);
  assert.match(crewMain, /plain_text\(/);
});
