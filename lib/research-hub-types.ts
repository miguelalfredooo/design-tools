// ── Observations ────────────────────────────────────────────────────────────

export const AREA_TAGS = [
  "Sharing",
  "Post Composer",
  "Entry Points",
  "Onboarding",
  "Content Creation",
  "Navigation",
  "Permissions",
  "Notifications",
  "Discovery",
  "Engagement",
] as const;

export type AreaTag = (typeof AREA_TAGS)[number] | string;

export interface ObservationRow {
  id: string;
  body: string;
  area: string;
  contributor: string | null;
  source_url: string | null;
  created_at: string;
}

export interface Observation {
  id: string;
  body: string;
  area: string;
  contributor: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

export function observationFromRow(row: ObservationRow): Observation {
  return {
    id: row.id,
    body: row.body,
    area: row.area,
    contributor: row.contributor,
    sourceUrl: row.source_url,
    createdAt: row.created_at,
  };
}

// ── Segments ────────────────────────────────────────────────────────────────

export interface SegmentRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export function segmentFromRow(row: SegmentRow): Segment {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  };
}

// ── Segment Items ───────────────────────────────────────────────────────────

export type Bucket =
  | "needs"
  | "pain_points"
  | "opportunities"
  | "actionable_insights";

export const BUCKET_LABELS: Record<Bucket, string> = {
  needs: "Needs",
  pain_points: "Pain Points",
  opportunities: "Opportunities",
  actionable_insights: "Actionable Insights",
};

export interface SegmentItemRow {
  id: string;
  segment_id: string;
  bucket: string;
  title: string;
  body: string | null;
  source_observation_ids: string[] | null;
  batch_id: string | null;
  created_at: string;
}

export interface SegmentItem {
  id: string;
  segmentId: string;
  bucket: Bucket;
  title: string;
  body: string | null;
  sourceObservationIds: string[] | null;
  batchId: string | null;
  createdAt: string;
}

export function segmentItemFromRow(row: SegmentItemRow): SegmentItem {
  return {
    id: row.id,
    segmentId: row.segment_id,
    bucket: row.bucket as Bucket,
    title: row.title,
    body: row.body,
    sourceObservationIds: row.source_observation_ids,
    batchId: row.batch_id,
    createdAt: row.created_at,
  };
}

// ── Share Tokens ────────────────────────────────────────────────────────────

export interface ShareTokenRow {
  id: string;
  token: string;
  created_by: string | null;
  expires_at: string | null;
  created_at: string;
}

// ── Synthesis Response ──────────────────────────────────────────────────────

export interface ObservationSynthesisResponse {
  insights: {
    segment: string;
    bucket: Bucket;
    title: string;
    body: string;
    source_observation_ids: string[];
  }[];
  suggested_segments: {
    name: string;
    description: string;
  }[];
}
