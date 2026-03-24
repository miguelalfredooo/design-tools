import type {
  LifecycleCohort,
  GrowthMetric,
  Segment,
} from "@/lib/design-ops-types";

export const growthMetricOptions: Array<{ value: GrowthMetric; label: string }> = [
  { value: "communities", label: "Communities" },
  { value: "total_members", label: "Total members" },
  { value: "return_rate", label: "Return rate" },
  { value: "monthly_member_visitors", label: "Monthly member visitors" },
  { value: "pvs_per_member_visitor", label: "PVs / member visitor" },
  { value: "monthly_pvs", label: "Monthly PVs" },
  { value: "active_rate", label: "Active rate" },
];

export const lifecycleCohortOptions: Array<{
  value: LifecycleCohort;
  label: string;
  description: string;
}> = [
  {
    value: "new_users",
    label: "New users",
    description: "Early onboarding and first-week usage behavior.",
  },
  {
    value: "regular_users",
    label: "Regular users",
    description: "Members with established repeat usage habits.",
  },
  {
    value: "at_risk_users",
    label: "At-risk users",
    description: "Members whose engagement or return behavior is softening.",
  },
  {
    value: "reactivated_users",
    label: "Reactivated users",
    description: "Members who recently returned after a period of inactivity.",
  },
  {
    value: "power_users",
    label: "Power users",
    description: "Highly engaged members who contribute and model desired behavior.",
  },
];

export const designOpsSegments: Segment[] = [
  {
    id: "large-partners-opportunities",
    name: "Large partners / opportunities",
    tier: "large_partner",
    description:
      "Huge influencers, brands, and channel partners with outsized reach potential.",
  },
  {
    id: "large-influencers",
    name: "Large influencers",
    tier: "large_influencer",
    description: "High-scale creator-led communities with strong top-of-funnel leverage.",
  },
  {
    id: "mid-size-influencers",
    name: "Mid-size influencers",
    tier: "mid_influencer",
    description: "Established creators with meaningful audience trust and repeat engagement potential.",
  },
  {
    id: "small-influencers",
    name: "Small influencers",
    tier: "small_influencer",
    description: "Emerging creator-led communities with lower scale but faster experimentation potential.",
  },
  {
    id: "raptive-creators",
    name: "Raptive creators",
    tier: "raptive_creator",
    description: "Existing publisher relationships already inside the Raptive ecosystem.",
  },
  {
    id: "local-neighborhood-groups",
    name: "Local / neighborhood groups",
    tier: "local_group",
    description: "Local community groups, parent networks, and neighborhood organizations.",
  },
  {
    id: "platform-migrants",
    name: "Platform migrants",
    tier: "platform_migrant",
    description: "Community leaders looking for alternatives to Reddit, Facebook, and similar platforms.",
  },
  {
    id: "hosted-raptive-run",
    name: "Hosted / Raptive-run",
    tier: "hosted",
    description: "Communities operated directly by Raptive to seed patterns and learn quickly.",
  },
  {
    id: "emergent-members",
    name: "Emergent members",
    tier: "emergent",
    description: "Members who organically grow into new community leaders.",
  },
  {
    id: "other",
    name: "Other",
    tier: "other",
    description: "Unclassified or experimental segment opportunities.",
  },
];
