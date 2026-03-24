import type { Bucket } from "@/lib/research-hub-types";

export interface SegmentSummary {
  id: string;
  name: string;
  itemCounts: Partial<Record<Bucket, number>>;
  totalItems: number;
}

export interface TopItem {
  bucket: Bucket;
  title: string;
  body: string | null;
  segmentName: string;
  sourceCount: number;
}

export interface DashboardData {
  observationCount: number;
  areaBreakdown: { area: string; count: number }[];
  segmentCount: number;
  totalInsights: number;
  segments: SegmentSummary[];
  topItems: TopItem[];
}
