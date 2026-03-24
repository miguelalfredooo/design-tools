import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("creator tools overview page delegates major sections to dedicated components", () => {
  const page = read("app/drops/creator-tools/page.tsx");
  const header = read("components/design/creator-tools-overview-header.tsx");
  const signal = read("components/design/creator-tools-overview-signal.tsx");
  const map = read("components/design/creator-tools-overview-map.tsx");
  const pageHeader = read("components/design/creator-tools-page-header.tsx");

  assert.match(page, /from "@\/components\/design\/creator-tools-overview-header"/);
  assert.match(page, /from "@\/components\/design\/creator-tools-overview-signal"/);
  assert.match(page, /from "@\/components\/design\/creator-tools-overview-map"/);
  assert.match(page, /<CreatorToolsOverviewHeader/);
  assert.match(page, /<CreatorToolsOverviewSignal/);
  assert.match(page, /<CreatorToolsOverviewMap/);
  assert.match(header, /export function CreatorToolsOverviewHeader/);
  assert.match(signal, /export function CreatorToolsOverviewSignal/);
  assert.match(map, /export function CreatorToolsOverviewMap/);
  assert.match(pageHeader, /export function CreatorToolsPageHeader/);
  assert.match(header, /CreatorToolsPageHeader/);
  assert.doesNotMatch(pageHeader, /rounded-\[20px\]/);
  assert.match(pageHeader, /md:min-h-\[136px\]/);
});
