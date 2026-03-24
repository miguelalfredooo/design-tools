import {
  growthMetricOptions,
  lifecycleCohortOptions,
  designOpsSegments,
} from "@/lib/mock/design-ops-growth-context";

/** Maps a raw GrowthMetric key (e.g. "pvs_per_member_visitor") to its display label. */
export function getMetricLabel(value: string): string {
  return growthMetricOptions.find((o) => o.value === value)?.label ?? value;
}

/** Maps a segment id (e.g. "raptive-creators") to its display name. */
export function getSegmentLabel(id: string): string {
  return designOpsSegments.find((s) => s.id === id)?.name ?? id;
}

/** Maps a LifecycleCohort key (e.g. "new_users") to its display label. */
export function getCohortLabel(value: string): string {
  return lifecycleCohortOptions.find((o) => o.value === value)?.label ?? value;
}
