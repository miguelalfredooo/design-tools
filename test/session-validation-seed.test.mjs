import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("seed flow saves validation metadata for mock sessions", () => {
  const seedPage = read("app/seed/page.tsx");

  assert.match(seedPage, /saveSessionValidation/);
  assert.match(seedPage, /state: "confirmed"/);
  assert.match(seedPage, /state: "in_review"|state: "unverified"/);
});
