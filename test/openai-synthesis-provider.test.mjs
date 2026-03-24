import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("synthesis routes use the shared synthesis abstraction", () => {
  const helper = read("lib/synthesis-llm.ts");
  const research = read("app/api/design/research/synthesize/route.ts");
  const observe = read("app/api/design/research/observe-synthesize/route.ts");
  const replay = read("app/api/design/research/replay-synthesize/route.ts");
  const session = read("app/api/design/sessions/[id]/synthesize/route.ts");

  assert.match(helper, /OPENAI_SYNTHESIS_MODEL/);
  assert.match(helper, /ANTHROPIC_SYNTHESIS_MODEL/);
  assert.match(helper, /SYNTHESIS_PROVIDER/);
  assert.match(helper, /generateSynthesisText/);
  assert.match(helper, /parseLLMJSON/);
  assert.match(helper, /generateWithAnthropic/);

  for (const route of [research, observe, replay, session]) {
    assert.match(route, /from "@\/lib\/synthesis-llm"/);
    assert.match(route, /generateSynthesisText/);
    assert.match(route, /getSynthesisModelName/);
    assert.match(route, /parseLLMJSON/);
    assert.doesNotMatch(route, /generateWithOllama/);
  }
});

test("crew config supports OpenAI-backed provider settings", () => {
  const crew = read("crew/crew.py");
  const main = read("crew/main.py");
  const env = read("crew/.env.example");

  assert.match(crew, /OPENAI_CREW_MODEL/);
  assert.match(crew, /ANTHROPIC_CREW_MODEL/);
  assert.match(crew, /CREW_MODEL_PROVIDER/);
  assert.match(crew, /openai\/\{model\}/);
  assert.match(crew, /anthropic\/\{model\}/);
  assert.match(main, /provider = os\.environ\.get\("CREW_MODEL_PROVIDER", "openai"\)/);
  assert.match(main, /OPENAI_CREW_MODEL/);
  assert.match(main, /ANTHROPIC_CREW_MODEL/);
  assert.match(env, /OPENAI_API_KEY=/);
  assert.match(env, /ANTHROPIC_API_KEY=/);
});
