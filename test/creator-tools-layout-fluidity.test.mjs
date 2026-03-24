import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("creator tools shared surfaces avoid hard width caps and narrow split grids", () => {
  const shell = read("components/design/creator-tools-shell.tsx");
  const header = read("components/design/creator-tools-overview-header.tsx");
  const map = read("components/design/creator-tools-overview-map.tsx");
  const signal = read("components/design/creator-tools-overview-signal.tsx");

  assert.doesNotMatch(shell, /max-w-2xl/);
  assert.doesNotMatch(header, /max-w-2xl/);
  assert.doesNotMatch(map, /max-w-3xl/);
  assert.doesNotMatch(signal, /max-w-3xl/);
  assert.doesNotMatch(map, /xl:grid-cols-\[/);
  assert.doesNotMatch(signal, /xl:grid-cols-\[/);
});

test("creator tools module pages use fluid layouts for dense content sections", () => {
  const themes = read("app/drops/creator-tools/themes/page.tsx");
  const audience = read("app/drops/creator-tools/audience/page.tsx");
  const threads = read("app/drops/creator-tools/threads/page.tsx");
  const actions = read("app/drops/creator-tools/actions/page.tsx");
  const controls = read("app/drops/creator-tools/controls/page.tsx");
  const nudges = read("app/drops/creator-tools/nudges/page.tsx");
  const scheduler = read("app/drops/creator-tools/controls/scheduler/page.tsx");
  const topPost = read("app/drops/creator-tools/analytics/top-post/page.tsx");

  assert.doesNotMatch(themes, /max-w-2xl/);
  assert.doesNotMatch(audience, /max-w-2xl/);
  assert.doesNotMatch(threads, /max-w-2xl/);
  assert.doesNotMatch(actions, /max-w-2xl/);
  assert.doesNotMatch(controls, /max-w-2xl/);
  assert.doesNotMatch(nudges, /max-w-2xl/);
  assert.doesNotMatch(scheduler, /max-w-2xl/);
  assert.doesNotMatch(topPost, /max-w-2xl/);
  assert.doesNotMatch(threads, /xl:grid-cols-\[/);
  assert.doesNotMatch(actions, /xl:grid-cols-\[/);
  assert.doesNotMatch(controls, /xl:grid-cols-\[/);
  assert.doesNotMatch(nudges, /xl:grid-cols-\[/);
  assert.match(themes, /className="space-y-3 p-6 md:p-8"/);
  assert.doesNotMatch(themes, /md:grid-cols-2/);
});
