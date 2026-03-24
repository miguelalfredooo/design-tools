import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("carrier-shell has 'use client' directive", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /'use client'/);
});

test("carrier-shell uses useSearchParams and useRouter", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /useSearchParams/);
  assert.match(src, /useRouter/);
});

test("carrier-shell calls useDesignOpsWorkspace", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /useDesignOpsWorkspace/);
});

test("carrier-shell derives steps SpineStep array", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /SpineStep/);
  assert.match(src, /not_started/);
  assert.match(src, /in_progress/);
  assert.match(src, /complete/);
});

test("carrier-shell defines onViewChange that calls router.replace", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /onViewChange/);
  assert.match(src, /router\.replace/);
});

test("carrier-shell defines onNavigateToAnalysis and onRunComplete", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /onNavigateToAnalysis/);
  assert.match(src, /onRunComplete/);
});

test("carrier-shell defines onNewSession that resets state", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /onNewSession/);
  assert.match(src, /setActiveObjectiveId/);
  assert.match(src, /setMessages/);
});

test("carrier-shell derives sessions list from archives", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /sessionList/);
  assert.match(src, /archives/);
});

test("carrier-shell renders CarrierRail and CarrierMainPane", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /CarrierRail/);
  assert.match(src, /CarrierMainPane/);
});

test("carrier-shell root element is full-height flex row", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /h-screen/);
  assert.match(src, /overflow-hidden/);
});

test("page.tsx uses CarrierShell inside Suspense", () => {
  const src = read("app/design-ops/page.tsx");
  assert.match(src, /CarrierShell/);
  assert.match(src, /Suspense/);
  assert.doesNotMatch(src, /DesignOpsClient/);
});
