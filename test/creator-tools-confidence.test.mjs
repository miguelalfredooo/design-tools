import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("creator tools overview exposes a data confidence summary", () => {
  const overviewPage = read("app/drops/creator-tools/page.tsx");

  assert.match(overviewPage, /Data confidence/i);
  assert.match(overviewPage, /confirmed evidence anchor/i);
});

test("creator tools mock data includes confidence states", () => {
  const mockData = read("lib/mock/creator-tools.ts");

  assert.match(mockData, /unverified/);
  assert.match(mockData, /in_review|in review/);
  assert.match(mockData, /confirmed/);
});
