import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("my sessions feed renders a dedicated session banner strip", () => {
  const homePage = read("app/page.tsx");

  assert.match(homePage, /SessionCard/);
  assert.doesNotMatch(homePage, /FeedOptionPost/);
  assert.match(homePage, /resolvedActiveTab/);
});

test("session banner strip includes motion-oriented copy", () => {
  const card = read("components/design/session-card.tsx");
  const banner = read("components/design/session-card-banner.tsx");

  assert.match(banner, /SessionCardBanner/);
  assert.match(banner, /Signal is taking shape|Ready for review|Keep momentum/i);
  assert.match(banner, /motion\/react|animate|initial=/);
  assert.match(banner, /scope: "mine" \| "all"/);
  assert.match(card, /SessionCardBanner/);
});
