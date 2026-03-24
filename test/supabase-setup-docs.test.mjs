import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test(".env.example includes the required Carrier backend variables", () => {
  const envExample = read(".env.example");

  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_ANON_KEY=/);
  assert.match(envExample, /SUPABASE_SERVICE_ROLE_KEY=/);
  assert.match(envExample, /DESIGN_TOOLS_PASSWORD=/);
});

test("README explains current local setup and Supabase dependency", () => {
  const readme = read("README.md");

  assert.match(readme, /http:\/\/localhost:3500/);
  assert.match(readme, /existing Supabase project/i);
  assert.match(readme, /NEXT_PUBLIC_SUPABASE_URL/);
});

test("supabase setup doc captures backend scope and migration location", () => {
  const setupDoc = read("docs/supabase-setup.md");

  assert.match(setupDoc, /Carrier stays on the existing Supabase project/i);
  assert.match(setupDoc, /supabase\/migrations/);
  assert.match(setupDoc, /sessions, votes, options, comments, reactions/i);
  assert.match(setupDoc, /research/i);
});
