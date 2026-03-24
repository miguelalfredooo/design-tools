import type { DataConfidenceState } from "@/lib/data-confidence";

export type Phase = "setup" | "voting" | "revealed";

export type MediaType = "none" | "image" | "figma-embed" | "excalidraw";

export type EffortLevel = "low" | "medium" | "high";

export interface ExplorationOption {
  id: string;
  title: string;
  description: string;
  mediaType: MediaType;
  mediaUrl?: string;
  position: number;
  rationale?: string;
  suggested?: boolean;
  suggestedBy?: string;
  /** @deprecated Use mediaUrl instead */
  imageUrl?: string;
}

export interface Reaction {
  id: string;
  sessionId: string;
  optionId: string;
  voterId: string;
  createdAt: number;
}

export interface ReactionRow {
  id: string;
  session_id: string;
  option_id: string;
  voter_id: string;
  created_at: string;
}

export function reactionFromRow(row: ReactionRow): Reaction {
  return {
    id: row.id,
    sessionId: row.session_id,
    optionId: row.option_id,
    voterId: row.voter_id,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export interface Vote {
  id: string;
  optionId: string;
  voterId: string;
  voterName: string;
  comment?: string;
  pinned?: boolean;
  effort?: EffortLevel;
  impact?: EffortLevel;
  createdAt: number;
  /** @deprecated Use voterName instead */
  participantName?: string;
}

export interface SessionValidation {
  state: DataConfidenceState;
  note?: string;
  evidenceSourceOwner?: string;
  evidenceSourceOrigin?: string;
  evidenceSourceDate?: string;
}

export interface ExplorationSession {
  id: string;
  title: string;
  description: string;
  previewUrl?: string;
  topic?: string;
  hypothesis?: string;
  problem?: string;
  goal?: string;
  audience?: string;
  constraints?: string;
  options: ExplorationOption[];
  participantCount: number;
  votes: Vote[];
  voteCount: number;
  phase: Phase;
  creatorToken: string;
  createdAt: number;
  validation?: SessionValidation;
}

// --- Supabase row types (snake_case, matching DB columns) ---

export interface VotingSessionRow {
  id: string;
  title: string;
  description: string;
  preview_url: string | null;
  topic: string | null;
  hypothesis: string | null;
  problem: string | null;
  goal: string | null;
  audience: string | null;
  constraints: string | null;
  phase: Phase;
  participant_count: number;
  creator_token: string;
  created_at: string;
}

export interface VotingOptionRow {
  id: string;
  session_id: string;
  title: string;
  description: string;
  media_type: MediaType;
  media_url: string | null;
  position: number;
  rationale: string | null;
  effort: string | null;
  impact: string | null;
  suggested: boolean | null;
  suggested_by: string | null;
  created_at: string;
}

export interface VotingVoteRow {
  id: string;
  session_id: string;
  option_id: string;
  voter_id: string;
  voter_name: string;
  comment: string | null;
  pinned: boolean | null;
  effort: string | null;
  impact: string | null;
  created_at: string;
}

// --- Conversion helpers ---

export function sessionFromRow(
  row: VotingSessionRow,
  options: VotingOptionRow[],
  votes: VotingVoteRow[],
  voteCount?: number,
): ExplorationSession {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    previewUrl: row.preview_url ?? undefined,
    topic: row.topic ?? undefined,
    hypothesis: row.hypothesis ?? undefined,
    problem: row.problem ?? undefined,
    goal: row.goal ?? undefined,
    audience: row.audience ?? undefined,
    constraints: row.constraints ?? undefined,
    phase: row.phase,
    participantCount: row.participant_count,
    creatorToken: row.creator_token,
    createdAt: new Date(row.created_at).getTime(),
    voteCount: voteCount ?? votes.length,
    options: options
      .sort((a, b) => a.position - b.position)
      .map(optionFromRow),
    votes: votes.map(voteFromRow),
  };
}

export function optionFromRow(row: VotingOptionRow): ExplorationOption {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    mediaType: row.media_type ?? "none",
    mediaUrl: row.media_url ?? undefined,
    position: row.position,
    rationale: row.rationale ?? undefined,
    suggested: row.suggested ?? undefined,
    suggestedBy: row.suggested_by ?? undefined,
  };
}

// --- Spatial comments ---

export interface SpatialComment {
  id: string;
  sessionId: string;
  optionId: string;
  voterId: string;
  voterName: string;
  body: string;
  xPct: number;
  yPct: number;
  createdAt: number;
}

export interface DesignCommentRow {
  id: string;
  session_id: string;
  option_id: string;
  voter_id: string;
  voter_name: string;
  body: string;
  x_pct: number | null;
  y_pct: number | null;
  created_at: string;
}

export function spatialCommentFromRow(row: DesignCommentRow): SpatialComment | null {
  if (row.x_pct == null || row.y_pct == null) return null;
  return {
    id: row.id,
    sessionId: row.session_id,
    optionId: row.option_id,
    voterId: row.voter_id,
    voterName: row.voter_name,
    body: row.body,
    xPct: row.x_pct,
    yPct: row.y_pct,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function voteFromRow(row: VotingVoteRow): Vote {
  return {
    id: row.id,
    optionId: row.option_id,
    voterId: row.voter_id,
    voterName: row.voter_name,
    comment: row.comment ?? undefined,
    pinned: row.pinned ?? undefined,
    effort: (row.effort as EffortLevel) ?? undefined,
    impact: (row.impact as EffortLevel) ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}
