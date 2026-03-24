import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("spine-nav renders each step with dot color from CSS var", () => {
  const src = read("components/design/spine-nav.tsx");
  assert.match(src, /var\(--color-status-/);
  assert.match(src, /rounded-full/);
});

test("spine-nav applies left border accent to active step", () => {
  const src = read("components/design/spine-nav.tsx");
  assert.match(src, /border-l-\[2\.5px\]/);
  assert.match(src, /isActive/);
});

test("spine-nav shows Badge for in_progress and blocked states", () => {
  const src = read("components/design/spine-nav.tsx");
  assert.match(src, /in_progress/);
  assert.match(src, /blocked/);
  assert.match(src, /Badge/);
});

test("spine-nav calls onStepChange on click", () => {
  const src = read("components/design/spine-nav.tsx");
  assert.match(src, /onStepChange/);
  assert.match(src, /onClick/);
});

test("session-history renders each session with status dot", () => {
  const src = read("components/design/session-history.tsx");
  assert.match(src, /status/);
  assert.match(src, /var\(--color-status-/);
  assert.match(src, /rounded-full/);
});

test("session-history is display-only (no onClick handler)", () => {
  const src = read("components/design/session-history.tsx");
  assert.match(src, /onSelect/);
  assert.match(src, /cursor-default/);
});

test("carrier-rail is 220px wide with border-r", () => {
  const src = read("components/design/carrier-rail.tsx");
  assert.match(src, /w-\[220px\]/);
  assert.match(src, /border-r/);
});

test("carrier-rail renders SpineNav and SessionHistory", () => {
  const src = read("components/design/carrier-rail.tsx");
  assert.match(src, /SpineNav/);
  assert.match(src, /SessionHistory/);
});

test("carrier-rail renders New session button", () => {
  const src = read("components/design/carrier-rail.tsx");
  assert.match(src, /New session/);
  assert.match(src, /Button/);
  assert.match(src, /onNewSession/);
});

test("carrier-rail shows activeObjective title or fallback", () => {
  const src = read("components/design/carrier-rail.tsx");
  assert.match(src, /activeObjective/);
  assert.match(src, /No active session/);
});
