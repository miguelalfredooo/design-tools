# Research Synthesis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace mock data on `/research` with real Ollama-synthesized insights from session votes, comments, and feedback stored in Supabase.

**Architecture:** Next.js API route fetches all session data from Supabase, builds a structured prompt, sends it to Ollama (localhost:11434), parses the JSON response, and writes rows to a `research_insights` table. The `/research` page reads the latest batch.

**Tech Stack:** Next.js 16 (App Router), Supabase (PostgreSQL), Ollama REST API, llama3.2, TypeScript, shadcn/ui, Tailwind CSS 4

---

### Task 1: Create `research_insights` Supabase migration

**Files:**
- Create: `supabase/migrations/20260305_add_research_insights.sql`

**Step 1: Write the migration**

```sql
-- Research insights synthesized by Ollama from session data
create table research_insights (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text,
  body text,
  mentions int,
  tags text[],
  source_session_ids uuid[],
  metadata jsonb,
  batch_id uuid not null,
  created_at timestamptz default now()
);

create index idx_research_insights_batch on research_insights(batch_id);
create index idx_research_insights_type on research_insights(type);

-- RLS off — private tool, single user
alter table research_insights enable row level security;

create policy "Insights are publicly readable"
  on research_insights for select using (true);

create policy "Anyone can insert insights"
  on research_insights for insert with check (true);

create policy "Anyone can delete insights"
  on research_insights for delete using (true);
```

**Step 2: Run the migration against Supabase**

Run: `cd /Users/miguelarias/Code/design-tools && npx supabase db push` or apply manually via Supabase SQL editor.

**Step 3: Commit**

```bash
git add supabase/migrations/20260305_add_research_insights.sql
git commit -m "feat: add research_insights table migration"
```

---

### Task 2: Create research types

**Files:**
- Create: `lib/research-types.ts`

**Step 1: Write the types file**

```typescript
// --- Ollama response shape ---

export type Confidence = "validated" | "assumed" | "speculative";

export interface OllamaTheme {
  title: string;
  summary: string;
  sources: string[];
  mentions: number;
  confidence: Confidence;
}

export interface OllamaOpportunity {
  theme: string;
  hmw: string;
  confidence: Confidence;
}

export interface OllamaSignal {
  title: string;
  detail: string;
}

export interface OllamaOneMetric {
  metric: string;
  rationale: string;
}

export interface OllamaSynthesisResponse {
  themes: OllamaTheme[];
  opportunities: OllamaOpportunity[];
  consensus: string[];
  tensions: string[];
  open_questions: string[];
  signals: OllamaSignal[];
  one_metric: OllamaOneMetric;
}

// --- Supabase row shape ---

export interface ResearchInsightRow {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  mentions: number | null;
  tags: string[] | null;
  source_session_ids: string[] | null;
  metadata: Record<string, unknown> | null;
  batch_id: string;
  created_at: string;
}

// --- Client-side types ---

export type InsightType =
  | "theme"
  | "opportunity"
  | "consensus"
  | "tension"
  | "open_question"
  | "signal"
  | "one_metric";

export interface ResearchInsight {
  id: string;
  type: InsightType;
  title: string | null;
  body: string | null;
  mentions: number | null;
  tags: string[] | null;
  sourceSessionIds: string[] | null;
  metadata: Record<string, unknown> | null;
  batchId: string;
  createdAt: number;
}

export function insightFromRow(row: ResearchInsightRow): ResearchInsight {
  return {
    id: row.id,
    type: row.type as InsightType,
    title: row.title,
    body: row.body,
    mentions: row.mentions,
    tags: row.tags,
    sourceSessionIds: row.source_session_ids,
    metadata: row.metadata,
    batchId: row.batch_id,
    createdAt: new Date(row.created_at).getTime(),
  };
}
```

**Step 2: Commit**

```bash
git add lib/research-types.ts
git commit -m "feat: add research insight types and row converter"
```

---

### Task 3: Create Ollama client helper

**Files:**
- Create: `lib/ollama.ts`

**Step 1: Write the Ollama client**

```typescript
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}

export async function generateWithOllama(prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 4096,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error (${res.status}): ${text}`);
  }

  const data: OllamaGenerateResponse = await res.json();
  return data.response;
}

export function getModelName(): string {
  return OLLAMA_MODEL;
}
```

**Step 2: Commit**

```bash
git add lib/ollama.ts
git commit -m "feat: add Ollama client helper"
```

---

### Task 4: Create synthesis API route

**Files:**
- Create: `app/api/research/synthesize/route.ts`

**Step 1: Write the API route**

```typescript
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { generateWithOllama, getModelName } from "@/lib/ollama";
import type {
  OllamaSynthesisResponse,
  ResearchInsightRow,
} from "@/lib/research-types";
import type {
  VotingSessionRow,
  VotingOptionRow,
  VotingVoteRow,
  DesignCommentRow,
} from "@/lib/design-types";

function formatSessionData(
  sessions: VotingSessionRow[],
  options: VotingOptionRow[],
  votes: VotingVoteRow[],
  comments: DesignCommentRow[]
): string {
  return sessions
    .map((s) => {
      const sOpts = options.filter((o) => o.session_id === s.id);
      const sVotes = votes.filter((v) => v.session_id === s.id);
      const sComments = comments.filter((c) => c.session_id === s.id);

      const optionLines = sOpts
        .map((o) => {
          const optVotes = sVotes.filter((v) => v.option_id === o.id);
          const optComments = sComments.filter((c) => c.option_id === o.id);
          const voteLines = optVotes
            .filter((v) => v.comment)
            .map(
              (v) =>
                `    - ${v.voter_name}: "${v.comment}" (effort: ${v.effort || "n/a"}, impact: ${v.impact || "n/a"})`
            );
          const commentLines = optComments.map(
            (c) => `    - ${c.voter_name}: "${c.body}"`
          );
          return [
            `  Option: "${o.title}" — ${o.description}${o.rationale ? ` (rationale: ${o.rationale})` : ""}`,
            `  Votes: ${optVotes.length}`,
            voteLines.length > 0
              ? `  Vote comments:\n${voteLines.join("\n")}`
              : null,
            commentLines.length > 0
              ? `  Discussion:\n${commentLines.join("\n")}`
              : null,
          ]
            .filter(Boolean)
            .join("\n");
        })
        .join("\n\n");

      return [
        `SESSION: "${s.title}"`,
        s.description ? `Description: ${s.description}` : null,
        s.problem ? `Problem: ${s.problem}` : null,
        s.goal ? `Goal: ${s.goal}` : null,
        s.audience ? `Audience: ${s.audience}` : null,
        s.constraints ? `Constraints: ${s.constraints}` : null,
        `Phase: ${s.phase}`,
        `\nOptions & Feedback:`,
        optionLines,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

function buildPrompt(formattedData: string, sessionCount: number): string {
  return `You are a synthesis analyst helping a product designer extract strategic insights from design exploration sessions.

Below is raw data from ${sessionCount} design sessions including vote comments, feedback, and session context.

--- RAW DATA ---
${formattedData}
--- END DATA ---

Analyze this content and respond with valid JSON in this exact structure:

{
  "themes": [
    {
      "title": "Short descriptive name",
      "summary": "What the data is saying",
      "sources": ["Session: X - voter Y said...", ...],
      "mentions": 0,
      "confidence": "validated" | "assumed" | "speculative"
    }
  ],
  "opportunities": [
    {
      "theme": "Theme title it relates to",
      "hmw": "How might we...",
      "confidence": "validated" | "assumed" | "speculative"
    }
  ],
  "consensus": ["Where multiple sources agree..."],
  "tensions": ["Where sources contradict..."],
  "open_questions": ["What the data leaves unanswered..."],
  "signals": [
    {
      "title": "Surprising finding",
      "detail": "Why it matters"
    }
  ],
  "one_metric": {
    "metric": "The single behavior/outcome to improve",
    "rationale": "Why this has the highest downstream impact"
  }
}

Rules:
- Ground synthesis in what the data actually says
- Flag inferences vs. direct findings explicitly
- Use plain language suitable for stakeholder briefs
- Never fabricate supporting evidence - if something is thin, say so
- Respond with 3-6 themes
- Return ONLY valid JSON, no markdown wrapping`;
}

function synthesisToRows(
  synthesis: OllamaSynthesisResponse,
  batchId: string,
  sessionIds: string[]
): Omit<ResearchInsightRow, "id" | "created_at">[] {
  const rows: Omit<ResearchInsightRow, "id" | "created_at">[] = [];

  for (const theme of synthesis.themes) {
    rows.push({
      type: "theme",
      title: theme.title,
      body: theme.summary,
      mentions: theme.mentions,
      tags: null,
      source_session_ids: sessionIds,
      metadata: {
        confidence: theme.confidence,
        sources: theme.sources,
      },
      batch_id: batchId,
    });
  }

  for (const opp of synthesis.opportunities) {
    rows.push({
      type: "opportunity",
      title: opp.hmw,
      body: null,
      mentions: null,
      tags: null,
      source_session_ids: null,
      metadata: { confidence: opp.confidence, theme: opp.theme },
      batch_id: batchId,
    });
  }

  for (const item of synthesis.consensus) {
    rows.push({
      type: "consensus",
      title: null,
      body: item,
      mentions: null,
      tags: null,
      source_session_ids: null,
      metadata: null,
      batch_id: batchId,
    });
  }

  for (const item of synthesis.tensions) {
    rows.push({
      type: "tension",
      title: null,
      body: item,
      mentions: null,
      tags: null,
      source_session_ids: null,
      metadata: null,
      batch_id: batchId,
    });
  }

  for (const item of synthesis.open_questions) {
    rows.push({
      type: "open_question",
      title: null,
      body: item,
      mentions: null,
      tags: null,
      source_session_ids: null,
      metadata: null,
      batch_id: batchId,
    });
  }

  for (const signal of synthesis.signals) {
    rows.push({
      type: "signal",
      title: signal.title,
      body: signal.detail,
      mentions: null,
      tags: null,
      source_session_ids: null,
      metadata: null,
      batch_id: batchId,
    });
  }

  if (synthesis.one_metric) {
    rows.push({
      type: "one_metric",
      title: synthesis.one_metric.metric,
      body: synthesis.one_metric.rationale,
      mentions: null,
      tags: null,
      source_session_ids: null,
      metadata: null,
      batch_id: batchId,
    });
  }

  return rows;
}

export async function POST() {
  const db = getSupabaseAdmin();

  // Step 1: Fetch all session data
  const [sessionsRes, optionsRes, votesRes, commentsRes] = await Promise.all([
    db.from("voting_sessions").select("*"),
    db.from("voting_options").select("*"),
    db.from("voting_votes").select("*"),
    db.from("design_comments").select("*"),
  ]);

  if (sessionsRes.error) {
    return NextResponse.json(
      { error: sessionsRes.error.message },
      { status: 500 }
    );
  }

  const sessions = sessionsRes.data as VotingSessionRow[];
  const options = (optionsRes.data ?? []) as VotingOptionRow[];
  const votes = (votesRes.data ?? []) as VotingVoteRow[];
  const comments = (commentsRes.data ?? []) as DesignCommentRow[];

  if (sessions.length === 0) {
    return NextResponse.json(
      { error: "No sessions found to synthesize" },
      { status: 400 }
    );
  }

  // Step 2: Build prompt
  const formattedData = formatSessionData(sessions, options, votes, comments);
  const prompt = buildPrompt(formattedData, sessions.length);

  // Step 3: Call Ollama
  let rawResponse: string;
  try {
    rawResponse = await generateWithOllama(prompt);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ollama request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Step 4: Parse JSON — handle possible markdown wrapping
  let synthesis: OllamaSynthesisResponse;
  try {
    let jsonStr = rawResponse.trim();
    // Strip markdown code fences if present
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    synthesis = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to parse Ollama response as JSON",
        raw: rawResponse.slice(0, 500),
      },
      { status: 502 }
    );
  }

  // Step 5: Write to Supabase
  const batchId = crypto.randomUUID();
  const sessionIds = sessions.map((s) => s.id);
  const rows = synthesisToRows(synthesis, batchId, sessionIds);

  const { error: insertErr } = await db
    .from("research_insights")
    .insert(rows);

  if (insertErr) {
    return NextResponse.json(
      { error: insertErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    batchId,
    model: getModelName(),
    insightCount: rows.length,
    sessionCount: sessions.length,
  });
}
```

**Step 2: Commit**

```bash
git add app/api/research/synthesize/route.ts
git commit -m "feat: add /api/research/synthesize route with Ollama pipeline"
```

---

### Task 5: Rewrite `/research` page with real data

**Files:**
- Modify: `app/research/page.tsx` (full rewrite)

**Step 1: Rewrite the research page**

Replace the entire file. The page becomes a server component that reads the latest batch from Supabase, plus a client component for the "Synthesize" button.

First, create the synthesize button client component:

Create: `components/design/synthesize-button.tsx`

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SynthesizeButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSynthesize() {
    setLoading(true);
    try {
      const res = await fetch("/api/research/synthesize", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Synthesis failed");
        return;
      }
      toast.success(
        `Synthesized ${data.insightCount} insights from ${data.sessionCount} sessions`
      );
      router.refresh();
    } catch {
      toast.error("Could not reach synthesis API");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleSynthesize} disabled={loading} size="sm">
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      {loading ? "Synthesizing..." : "Synthesize"}
    </Button>
  );
}
```

Then rewrite `app/research/page.tsx`:

```typescript
import {
  TrendingUp,
  MessageSquareText,
  Target,
  Layers,
  BarChart3,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Gauge,
  CheckCircle2,
  Zap,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SynthesizeButton } from "@/components/design/synthesize-button";
import { supabase } from "@/lib/supabase";
import type { ResearchInsightRow, InsightType } from "@/lib/research-types";
import { insightFromRow } from "@/lib/research-types";

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const confidenceBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  validated: { label: "Validated", variant: "default" },
  assumed: { label: "Assumed", variant: "secondary" },
  speculative: { label: "Speculative", variant: "outline" },
};

async function getLatestBatch() {
  if (!supabase) return null;

  // Get the most recent batch_id
  const { data: latest } = await supabase
    .from("research_insights")
    .select("batch_id, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!latest) return null;

  // Get all rows for that batch
  const { data: rows } = await supabase
    .from("research_insights")
    .select("*")
    .eq("batch_id", latest.batch_id)
    .order("created_at", { ascending: true });

  if (!rows) return null;

  const insights = (rows as ResearchInsightRow[]).map(insightFromRow);
  return {
    batchId: latest.batch_id,
    createdAt: latest.created_at,
    insights,
  };
}

export default async function ResearchPage() {
  const batch = await getLatestBatch();

  const themes = batch?.insights.filter((i) => i.type === "theme") ?? [];
  const opportunities = batch?.insights.filter((i) => i.type === "opportunity") ?? [];
  const consensusItems = batch?.insights.filter((i) => i.type === "consensus") ?? [];
  const tensions = batch?.insights.filter((i) => i.type === "tension") ?? [];
  const openQuestions = batch?.insights.filter((i) => i.type === "open_question") ?? [];
  const signals = batch?.insights.filter((i) => i.type === "signal") ?? [];
  const oneMetric = batch?.insights.find((i) => i.type === "one_metric") ?? null;

  const maxMentions = Math.max(...themes.map((t) => t.mentions ?? 0), 1);

  return (
    <div className="flex justify-center min-w-0 pt-6 pb-12 px-4">
      <div className="flex gap-6 items-start justify-center">
        {/* Left Column */}
        <div className="w-[320px] shrink-0 sticky top-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Research</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {batch
                  ? `Last synthesized ${new Date(batch.createdAt).toLocaleDateString()}`
                  : "No synthesis yet"}
              </p>
            </div>
            <SynthesizeButton />
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Themes", value: themes.length, icon: Target },
              { label: "Opportunities", value: opportunities.length, icon: Lightbulb },
              { label: "Signals", value: signals.length, icon: Zap },
              { label: "Tensions", value: tensions.length, icon: AlertTriangle },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                    <stat.icon className="size-5 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* One Metric That Matters */}
          {oneMetric && (
            <Card className="border-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">One Metric That Matters</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold tracking-tight">{oneMetric.title}</p>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {oneMetric.body}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Signals Worth Watching */}
          {signals.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">Signals Worth Watching</CardTitle>
                </div>
                <CardDescription>Surprising or easy-to-overlook findings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {signals.map((signal) => (
                    <div
                      key={signal.id}
                      className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0"
                    >
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Zap className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{signal.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {signal.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="w-[600px] min-w-0 space-y-4">
          {!batch ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">
                  No synthesis data yet. Click &ldquo;Synthesize&rdquo; to analyze your sessions with Ollama.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Emerging Themes */}
              {themes.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="size-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-semibold">Emerging Themes</CardTitle>
                    </div>
                    <CardDescription>Recurring patterns across sessions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {themes.map((theme, i) => {
                      const conf = (theme.metadata as Record<string, unknown>)?.confidence as string;
                      const badge = conf ? confidenceBadge[conf] : null;
                      return (
                        <div key={theme.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{theme.title}</span>
                              {badge && (
                                <Badge variant={badge.variant} className="text-[10px] shrink-0">
                                  {badge.label}
                                </Badge>
                              )}
                            </div>
                            <span className="text-muted-foreground font-medium tabular-nums shrink-0 ml-2">
                              {theme.mentions ?? 0}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${((theme.mentions ?? 0) / maxMentions) * 100}%`,
                                backgroundColor: chartColors[i % chartColors.length],
                              }}
                            />
                          </div>
                          {theme.body && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {theme.body}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Opportunities (How Might We) */}
              {opportunities.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="size-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-semibold">Opportunities</CardTitle>
                    </div>
                    <CardDescription>How Might We questions from each theme</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {opportunities.map((opp) => {
                      const conf = (opp.metadata as Record<string, unknown>)?.confidence as string;
                      const relatedTheme = (opp.metadata as Record<string, unknown>)?.theme as string;
                      const badge = conf ? confidenceBadge[conf] : null;
                      return (
                        <div key={opp.id} className="space-y-1">
                          <div className="flex items-start gap-2">
                            <p className="text-sm font-medium leading-snug flex-1">
                              {opp.title}
                            </p>
                            {badge && (
                              <Badge variant={badge.variant} className="text-[10px] shrink-0 mt-0.5">
                                {badge.label}
                              </Badge>
                            )}
                          </div>
                          {relatedTheme && (
                            <p className="text-xs text-muted-foreground">
                              Theme: {relatedTheme}
                            </p>
                          )}
                          <Separator className="!mt-2.5" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Consensus vs. Tension Map */}
              {(consensusItems.length > 0 || tensions.length > 0 || openQuestions.length > 0) && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="size-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-semibold">
                        Consensus vs. Tension Map
                      </CardTitle>
                    </div>
                    <CardDescription>Where sources agree, disagree, and leave gaps</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {consensusItems.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          Consensus
                        </div>
                        {consensusItems.map((item) => (
                          <p key={item.id} className="text-sm text-muted-foreground pl-6 leading-relaxed">
                            {item.body}
                          </p>
                        ))}
                      </div>
                    )}

                    {tensions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <AlertTriangle className="size-4 text-amber-500" />
                          Tensions
                        </div>
                        {tensions.map((item) => (
                          <p key={item.id} className="text-sm text-muted-foreground pl-6 leading-relaxed">
                            {item.body}
                          </p>
                        ))}
                      </div>
                    )}

                    {openQuestions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <HelpCircle className="size-4 text-blue-500" />
                          Open Questions
                        </div>
                        {openQuestions.map((item) => (
                          <p key={item.id} className="text-sm text-muted-foreground pl-6 leading-relaxed">
                            {item.body}
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/design/synthesize-button.tsx app/research/page.tsx
git commit -m "feat: rewrite /research page with real Supabase data + synthesize button"
```

---

### Task 6: Add env vars and test end-to-end

**Files:**
- Modify: `.env.local` (add `OLLAMA_MODEL` and `OLLAMA_BASE_URL` if not default)

**Step 1: Verify Ollama is running**

Run: `curl http://localhost:11434/api/tags`
Expected: JSON response listing available models including `llama3.2`

**Step 2: Verify migration was applied**

Run: `curl '<SUPABASE_URL>/rest/v1/research_insights?select=id&limit=1' -H 'apikey: <ANON_KEY>'`
Expected: `[]` (empty array, table exists)

**Step 3: Start dev server and test**

Run: `cd /Users/miguelarias/Code/design-tools && npm run dev`

1. Open `http://localhost:3500/research`
2. Verify empty state shows "No synthesis data yet"
3. Click "Synthesize" button
4. Wait for response (10-30s depending on data volume)
5. Verify page reloads with real themes, opportunities, consensus/tension map, signals, and one metric
6. Check Supabase `research_insights` table has rows with the batch_id

**Step 4: Commit any env var additions**

```bash
git commit --allow-empty -m "chore: verified end-to-end synthesis pipeline"
```

---

Plan complete and saved. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?