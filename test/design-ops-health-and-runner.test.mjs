import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("design ops health route mirrors provider-based crew health", () => {
  const route = read("app/api/design-ops/health/route.ts");
  const runRoute = read("app/api/design-ops/run/route.ts");
  const types = read("lib/design-ops-types.ts");

  assert.match(route, /127\.0\.0\.1:8000/);
  assert.match(runRoute, /127\.0\.0\.1:8000/);
  assert.match(route, /provider: data\.provider/);
  assert.match(route, /providerStatus: data\.provider_status/);
  assert.match(route, /configuredModel: data\.configured_model/);
  assert.doesNotMatch(route, /ollama: data\.ollama/);
  assert.match(types, /provider\?: string;/);
  assert.match(types, /providerStatus\?: string;/);
});

test("design ops runner renders a single active objective with mode-based synthesis", () => {
  const runner = read("components/design/design-ops-crew-runner.tsx");
  const summaryStrip = read("components/design/summary-strip.tsx");
  const prompts = read("lib/design-ops-prompts.ts");
  const crewMain = read("crew/main.py");
  const crewLogic = read("crew/crew.py");
  const formatting = read("lib/design-ops-formatting.ts");

  assert.match(runner, /providerName = health\?\.provider === "openai" \? "OpenAI" : "model provider"/);
  assert.match(runner, /const \[mode, setMode\] = useState<SynthesisMode>\("decision_memo"\)/);
  assert.match(runner, /SYNTHESIS_MODES/);
  assert.match(runner, /Run analysis/);
  assert.match(runner, /Analysis in progress/);
  assert.match(runner, /What do you want to understand\?/);
  assert.match(runner, /shortLabel/);
  assert.doesNotMatch(runner, /Synthesis depth/);
  assert.doesNotMatch(runner, /Use recommended prompt/);
  assert.doesNotMatch(runner, /Deep dive reference prompt/);
  assert.doesNotMatch(runner, /getModePromptGuidance/);
  assert.doesNotMatch(runner, /Enter a focus prompt for Oracle/);
  assert.match(runner, /buildRecommendedPrompt/);
  assert.match(runner, /mode,/);
  assert.match(summaryStrip, /SummaryStrip/);
  assert.match(summaryStrip, /SummaryData/);
  assert.match(prompts, /buildRecommendedPrompt/);
  assert.match(runner, /Create or load an objective first/);
  assert.match(runner, /objectives: \[objective\]/);
  assert.match(runner, /currentEvent === "run_start"/);
  assert.match(runner, /subject: "Crew run started"/);
  assert.match(runner, /currentEvent === "agent_start"/);
  assert.match(runner, /\? "Design Strategy"/);
  assert.match(runner, /\? "Research & Insights"/);
  assert.match(runner, /subject: `\$\{agentName\} is working`/);
  assert.match(runner, /split\(\/\\r\?\\n\\r\?\\n\/\)/);
  assert.match(runner, /if \(buffer\.trim\(\)\)/);
  assert.match(runner, /consumeEventChunk/);
  assert.match(runner, /if \(currentEvent === "error"\)/);
  assert.match(runner, /throw new Error\(streamError\);/);
  assert.match(runner, /disabled=\{running \|\| !prompt\.trim\(\) \|\| !objective\}/);
  assert.doesNotMatch(runner, /crewUnavailable/);
  assert.doesNotMatch(runner, /Ollama not running/);
  assert.doesNotMatch(runner, /Ollama/);
  assert.doesNotMatch(runner, /Evaluate against/);
  assert.match(crewMain, /extract_section/);
  assert.match(crewMain, /extract_confidence/);
  assert.match(crewMain, /mode = body\.get\("mode", "quick_read"\)/);
  assert.match(crewMain, /"mode": mode/);
  assert.match(crewMain, /if mode == "quick_read":/);
  assert.match(crewMain, /"agent": "research_insights"/);
  assert.match(crewMain, /"agent": "design_strategy"/);
  assert.match(crewMain, /ADDITIONAL SIGNALS WORTH GATHERING/);
  assert.match(crewMain, /WHAT WOULD IMPROVE CONFIDENCE/);
  assert.match(crewMain, /beacon_readiness/);
  assert.match(crewMain, /beacon_next_step/);
  assert.match(crewLogic, /def get_mode_guidance/);
  assert.match(crewLogic, /session_limit = 3/);
  assert.match(crewLogic, /observation_limit = 6/);
  assert.match(crewLogic, /include_comments = False/);
  assert.match(crewLogic, /agents=\[research_insights\]/);
  assert.match(crewLogic, /SYNTHESIS MODE: Quick read/);
  assert.match(crewLogic, /SYNTHESIS MODE: Decision memo/);
  assert.match(crewLogic, /SYNTHESIS MODE: Deep dive/);
  assert.match(formatting, /READINESS/);
  assert.match(formatting, /ADDITIONAL SIGNALS WORTH GATHERING/);
  assert.match(formatting, /WHAT WOULD IMPROVE CONFIDENCE/);
  assert.match(formatting, /Assumptions/);
  assert.match(formatting, /Additional signals/);
  assert.match(read("crew\/tasks\/frame_brief.py"), /SEGMENT:/);
  assert.match(read("crew\/tasks\/frame_brief.py"), /USER STAGE:/);
  assert.match(read("crew\/tasks\/frame_brief.py"), /PHASE:/);
  assert.match(read("crew\/tasks\/frame_brief.py"), /METRIC TO MOVE:/);
  assert.match(read("crew\/tasks\/frame_brief.py"), /READINESS:/);
  assert.match(read("crew\/tasks\/frame_brief.py"), /WHAT WOULD IMPROVE CONFIDENCE:/);
  assert.match(read("crew\/tasks\/synthesize.py"), /Segment relevance/);
  assert.match(read("crew\/tasks\/synthesize.py"), /User stage relevance/);
  assert.match(read("crew\/tasks\/synthesize.py"), /PHASE:/);
  assert.match(read("crew\/tasks\/synthesize.py"), /ADDITIONAL SIGNALS WORTH GATHERING:/);
  assert.match(read("crew\/tasks\/synthesize.py"), /READINESS:/);
  assert.match(read("crew\/tasks\/synthesize.py"), /if mode == "quick_read":/);
  assert.match(read("crew\/tools\/supabase_tool.py"), /session_limit: int = 6/);
  assert.match(read("crew\/tools\/supabase_tool.py"), /observation_limit: int = 12/);
  assert.match(read("crew\/tools\/supabase_tool.py"), /include_comments: bool = True/);
});
