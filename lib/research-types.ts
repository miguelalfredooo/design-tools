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

// --- Session-level Ollama response shape ---

export interface SessionSynthesisResponse {
  recommendation: {
    option_title: string;
    rationale: string;
  };
  sentiments: {
    option_title: string;
    summary: string;
    tone: "positive" | "mixed" | "negative";
  }[];
  comment_themes: {
    title: string;
    detail: string;
  }[];
  consensus: string[];
  tensions: string[];
  next_steps: string[];
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
  session_id: string | null;
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
  | "one_metric"
  | "recommendation"
  | "sentiment"
  | "comment_theme"
  | "next_step";

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
  sessionId: string | null;
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
    sessionId: row.session_id ?? null,
    createdAt: new Date(row.created_at).getTime(),
  };
}
