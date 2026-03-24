import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("creator tools overview uses a separate product-map hub and keeps the PRD as a distinct artifact", () => {
  const page = read("app/drops/creator-tools/page.tsx");
  const map = read("components/design/creator-tools-overview-map.tsx");
  const header = read("components/design/creator-tools-overview-header.tsx");
  const mock = read("lib/mock/creator-tools.ts");

  assert.match(page, /CreatorToolsOverviewMap/);
  assert.match(map, /Start here/);
  assert.match(map, /Three things creators need fast/);
  assert.match(map, /PRD \/ Brief/);
  assert.match(map, /More context/);
  assert.match(map, /Open PRD \/ Brief/);
  assert.match(header, /Creator Tools/);
  assert.match(mock, /creatorToolsModules/);
  assert.match(mock, /creatorToolsSupportingSurfaces/);
  assert.match(mock, /creatorToolsSubNav/);
  assert.match(mock, /Scheduling/);
  assert.match(mock, /Pins/);
  assert.match(mock, /Team Review/);
  assert.match(mock, /Moderation/);
  assert.match(mock, /High-Signal Question/);
  assert.match(mock, /Lapsed Reader/);
  assert.match(mock, /Conversation Starter/);
  assert.match(mock, /ctaLabel/);
  assert.match(mock, /supporting:/);
});

test("creator tools overview reflects the PRD framing instead of a signal dashboard", () => {
  const signal = read("components/design/creator-tools-overview-signal.tsx");
  const page = read("app/drops/creator-tools/page.tsx");
  const mock = read("lib/mock/creator-tools.ts");

  assert.match(signal, /Less guesswork, more useful next steps/);
  assert.match(signal, /Quick read/);
  assert.match(signal, /Success at a glance/);
  assert.match(signal, /Rollout/);
  assert.match(mock, /creatorToolsPrdHighlights/);
  assert.match(mock, /creatorToolsV1Pillars/);
  assert.match(mock, /creatorToolsSuccessMetrics/);
  assert.doesNotMatch(page, /CreatorToolsOverviewAnalytics/);
});

test("creator tools surfaces share a semantic pill system for module differentiation", () => {
  const shell = read("components/design/creator-tools-shell.tsx");
  const map = read("components/design/creator-tools-overview-map.tsx");
  const helper = read("lib/creator-tools-pill.ts");
  const themes = read("app/drops/creator-tools/themes/page.tsx");
  const actions = read("app/drops/creator-tools/actions/page.tsx");
  const controls = read("app/drops/creator-tools/controls/page.tsx");
  const nudges = read("app/drops/creator-tools/nudges/page.tsx");
  const scheduler = read("app/drops/creator-tools/controls/scheduler/page.tsx");
  const teamReview = read("app/drops/creator-tools/controls/team-review/page.tsx");
  const moderation = read("app/drops/creator-tools/controls/moderation/page.tsx");
  const highSignal = read("app/drops/creator-tools/nudges/high-signal-question/page.tsx");
  const lapsedReader = read("app/drops/creator-tools/nudges/lapsed-reader/page.tsx");
  const conversationStarter = read("app/drops/creator-tools/nudges/conversation-starter/page.tsx");
  const insightBlock = read("components/design/creator-tools-insight-block.tsx");
  const metricCard = read("components/design/creator-tools-metric-card.tsx");
  const sectionPanel = read("components/design/creator-tools-section-panel.tsx");
  const linkCard = read("components/design/creator-tools-link-card.tsx");
  const simpleStatCard = read("components/design/creator-tools-simple-stat-card.tsx");
  const pageSurface = read("components/design/creator-tools-page-surface.tsx");
  const docCard = read("components/design/creator-tools-doc-card.tsx");

  assert.match(helper, /export function getCreatorToolsPillClass/);
  assert.match(helper, /export function getCreatorToolsToneClass/);
  assert.match(insightBlock, /export function CreatorToolsInsightBlock/);
  assert.match(metricCard, /export function CreatorToolsMetricCard/);
  assert.match(sectionPanel, /export function CreatorToolsSectionPanel/);
  assert.match(linkCard, /export function CreatorToolsLinkCard/);
  assert.match(simpleStatCard, /export function CreatorToolsSimpleStatCard/);
  assert.match(pageSurface, /export function CreatorToolsPageSurface/);
  assert.match(docCard, /export function CreatorToolsDocCard/);
  assert.match(shell, /CreatorToolsPageHeader/);
  assert.match(map, /getCreatorToolsPillClass/);
  assert.match(themes, /CreatorToolsMetricCard/);
  assert.match(actions, /CreatorToolsPageSurface/);
  assert.match(controls, /getCreatorToolsPillClass/);
  assert.match(nudges, /getCreatorToolsPillClass/);
  assert.match(themes, /CreatorToolsInsightBlock/);
  assert.match(themes, /CreatorToolsMetricCard/);
  assert.match(read("app/drops/creator-tools/audience/page.tsx"), /CreatorToolsInsightBlock/);
  assert.match(read("app/drops/creator-tools/audience/page.tsx"), /CreatorToolsMetricCard/);
  assert.match(read("app/drops/creator-tools/threads/page.tsx"), /CreatorToolsInsightBlock/);
  assert.match(read("app/drops/creator-tools/threads/page.tsx"), /CreatorToolsMetricCard/);
  assert.match(actions, /CreatorToolsSectionPanel/);
  assert.match(actions, /CreatorToolsLinkCard/);
  assert.match(controls, /CreatorToolsSectionPanel/);
  assert.match(controls, /CreatorToolsSimpleStatCard/);
  assert.match(nudges, /CreatorToolsSectionPanel/);
  assert.match(nudges, /CreatorToolsLinkCard/);
  assert.match(nudges, /CreatorToolsSimpleStatCard/);
  assert.match(scheduler, /getCreatorToolsPillClass/);
  assert.match(teamReview, /getCreatorToolsPillClass/);
  assert.match(moderation, /getCreatorToolsPillClass/);
  assert.match(highSignal, /getCreatorToolsPillClass/);
  assert.match(lapsedReader, /getCreatorToolsPillClass/);
  assert.match(conversationStarter, /getCreatorToolsPillClass/);
});
