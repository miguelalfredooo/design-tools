import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("design ops timeline receives showProcess as a prop, not via useSearchParams", () => {
  const timeline = read("components/design/design-ops-timeline.tsx");

  // showProcess must come from props, not internal searchParams
  assert.doesNotMatch(timeline, /useSearchParams/);
  assert.match(timeline, /showProcess/);
  assert.match(timeline, /showProcess\s*:\s*boolean/);
});
