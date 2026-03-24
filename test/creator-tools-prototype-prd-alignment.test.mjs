import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("creator tools prototype surfaces align to PRD feature areas", () => {
  const mock = read("lib/mock/creator-tools.ts");
  const themes = read("app/drops/creator-tools/themes/page.tsx");
  const audience = read("app/drops/creator-tools/audience/page.tsx");
  const threads = read("app/drops/creator-tools/threads/page.tsx");
  const actions = read("app/drops/creator-tools/actions/page.tsx");
  const controls = read("app/drops/creator-tools/controls/page.tsx");
  const nudges = read("app/drops/creator-tools/nudges/page.tsx");

  assert.match(mock, /What's Working/);
  assert.match(mock, /label: "Audience"/);
  assert.match(mock, /Show Up Now/);
  assert.match(mock, /Next Steps/);
  assert.match(themes, /performance-understanding layer/i);
  assert.match(audience, /connects performance insight to[\s\S]*retention risk/i);
  assert.match(threads, /worth a creator response/i);
  assert.match(threads, /Views/);
  assert.match(threads, /Engagement/);
  assert.match(actions, /what should the[\s\S]*creator do next/i);
  assert.match(controls, /Post & Community Controls/);
  assert.match(controls, /reducing friction/i);
  assert.match(nudges, /AI-Driven Engagement Nudges/);
  assert.match(nudges, /opt-in, configurable/i);
});

test("creator tools nudge detail pages reflect the PRD nudge types", () => {
  const highSignal = read("app/drops/creator-tools/nudges/high-signal-question/page.tsx");
  const lapsed = read("app/drops/creator-tools/nudges/lapsed-reader/page.tsx");
  const starter = read("app/drops/creator-tools/nudges/conversation-starter/page.tsx");

  assert.match(highSignal, /direct creator mention/i);
  assert.match(highSignal, /Deep-links directly to the reply surface/);
  assert.match(lapsed, /signal is behavioral, not[\s\S]*identifying/i);
  assert.match(starter, /suggests three editable conversation starters/i);
});
