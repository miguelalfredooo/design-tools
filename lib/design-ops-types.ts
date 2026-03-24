export type GrowthMetric =
  | "communities"
  | "total_members"
  | "return_rate"
  | "monthly_member_visitors"
  | "pvs_per_member_visitor"
  | "monthly_pvs"
  | "active_rate";

export type LifecycleCohort =
  | "new_users"
  | "regular_users"
  | "at_risk_users"
  | "reactivated_users"
  | "power_users";

export type SynthesisMode = "quick_read" | "decision_memo" | "deep_dive";

export type SegmentTier =
  | "large_partner"
  | "large_influencer"
  | "mid_influencer"
  | "small_influencer"
  | "raptive_creator"
  | "local_group"
  | "platform_migrant"
  | "hosted"
  | "emergent"
  | "other";

export interface Segment {
  id: string;
  name: string;
  tier: SegmentTier;
  description: string;
  theoryOfSuccess?: string;
}

export interface Objective {
  id: string;
  title: string;
  metric: GrowthMetric | string;
  target: string;
  description: string;
  segmentIds: string[];
  lifecycleCohorts: LifecycleCohort[];
  theoryOfSuccess?: string;
  createdAt: string;
}

export interface AgentMessage {
  from: string;
  fromName: string;
  to: string;
  subject: string;
  priority: "critical" | "standard" | "advisory";
  confidence: "high" | "medium" | "low" | "n/a";
  assumptions: string;
  body: string;
  nextStep: string;
  timestamp: string;
}

export interface DesignOpsArchive {
  id: string;
  prompt: string;
  mode: SynthesisMode;
  objectives: Objective[];
  messages: AgentMessage[];
  provider?: string;
  model?: string;
  createdAt: string;
}

export interface DesignOpsModuleRecord {
  id: string
  name: string
  status: 'not_started' | 'in_progress' | 'complete' | 'blocked'
  nextAction?: string
  completedAt?: string
  blockedReason?: string
  detail?: string
  createdAt: string
}

export interface CrewHealthStatus {
  status: "ok" | "unavailable";
  provider?: string;
  providerStatus?: string;
  models: string[];
  configuredModel: string;
}
