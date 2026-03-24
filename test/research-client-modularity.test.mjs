import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("research client delegates major tab bodies to dedicated modules", () => {
  const client = read("components/design/research-client.tsx");
  const overview = read("components/design/research/overview-tab.tsx");
  const observations = read("components/design/research/observations-tab.tsx");
  const replays = read("components/design/research/replays-tab.tsx");
  const reference = read("components/design/research/reference-tab.tsx");
  const segments = read("components/design/research/segments-tab.tsx");

  assert.match(client, /from "@\/components\/design\/research\/overview-tab"/);
  assert.match(client, /from "@\/components\/design\/research\/observations-tab"/);
  assert.match(client, /from "@\/components\/design\/research\/replays-tab"/);
  assert.match(client, /from "@\/components\/design\/research\/reference-tab"/);
  assert.match(client, /from "@\/components\/design\/research\/segments-tab"/);
  assert.doesNotMatch(client, /^function OverviewTab/m);
  assert.doesNotMatch(client, /^function ObservationsTab/m);
  assert.doesNotMatch(client, /^function ReplaysTab/m);
  assert.doesNotMatch(client, /^function ReferenceTab/m);
  assert.doesNotMatch(client, /^function SegmentsTab/m);
  assert.match(overview, /export function OverviewTab/);
  assert.match(observations, /export function ObservationsTab/);
  assert.match(replays, /export function ReplaysTab/);
  assert.match(reference, /export function ReferenceTab/);
  assert.match(segments, /export function SegmentsTab/);
});
