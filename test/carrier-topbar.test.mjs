import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("carrier-topbar renders Private and Shared buttons", () => {
  const src = read("components/design/carrier-topbar.tsx");
  assert.match(src, /Private/);
  assert.match(src, /Shared/);
  assert.match(src, /Button/);
});

test("carrier-topbar Private button calls onViewChange with private", () => {
  const src = read("components/design/carrier-topbar.tsx");
  assert.match(src, /onViewChange\('private'\)/);
});

test("carrier-topbar Shared button calls onViewChange with shared", () => {
  const src = read("components/design/carrier-topbar.tsx");
  assert.match(src, /onViewChange\('shared'\)/);
});

test("carrier-topbar Copy share link button builds URL with view=shared", () => {
  const src = read("components/design/carrier-topbar.tsx");
  assert.match(src, /Copy share link/);
  assert.match(src, /view.*shared/);
  assert.match(src, /clipboard/);
});

test("carrier-topbar Copy share link shows toast on click", () => {
  const src = read("components/design/carrier-topbar.tsx");
  assert.match(src, /toast/);
  assert.match(src, /Link copied/);
});

test("carrier-topbar has border-b and flex layout", () => {
  const src = read("components/design/carrier-topbar.tsx");
  assert.match(src, /border-b/);
  assert.match(src, /flex/);
});
