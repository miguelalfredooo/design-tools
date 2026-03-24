import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("session detail page defines the approved tab structure", () => {
  const page = read("app/explorations/[id]/page.tsx");

  assert.match(page, /Tabs,\s*TabsContent,\s*TabsList,\s*TabsTrigger/);
  assert.match(page, /defaultValue="design-plan"/);
  assert.match(page, /value="brief"[\s\S]*PRD \/ Brief/);
  assert.match(page, /value="design-plan"[\s\S]*Design Plan/);
  assert.match(page, /value="research"[\s\S]*Research/);
});

test("session detail tabs map the expected content groups", () => {
  const page = read("app/explorations/[id]/page.tsx");

  assert.match(page, /<TabsContent value="brief"[\s\S]*SessionBriefTabContent/);
  assert.match(page, /<TabsContent value="design-plan"[\s\S]*SessionDesignPlanTabContent/);
  assert.match(page, /<TabsContent value="research"[\s\S]*SessionResearchTabContent/);
  assert.match(page, /from "@\/components\/design\/session-brief-tab-content"/);
  assert.match(page, /from "@\/components\/design\/session-design-plan-tab-content"/);
  assert.match(page, /from "@\/components\/design\/session-research-tab-content"/);
});
