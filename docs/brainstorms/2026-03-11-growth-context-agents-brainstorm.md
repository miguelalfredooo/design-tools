---
date: 2026-03-11
topic: growth-context-agents
---

# Growth Context for Atlas and Beacon

## What We're Building

We need Atlas and Beacon to reason against Raptive Community's company-level growth strategy, not just the local design prompt in front of them. Today, the agents can synthesize evidence and recommend product moves, but they do not have a durable framing for which business metric a recommendation is supposed to move, which community segment it applies to, or what stage of growth the company is currently in.

The fix is to add a shared growth context layer inside Design Ops. That layer should make the north star, milestone targets, segment strategy, and open questions visible to both the agent runtime and the Design Ops UI.

## Why This Approach

If the agents only know the immediate prompt, they optimize for local usefulness. That produces decent synthesis, but weak strategy. The company objective is not "produce a good design recommendation." The company objective is to scale Raptive Community into a pageview engine that reaches 200MM monthly PVs by the end of 2027 with 10k active communities.

That means recommendations need to be legible through a growth lens:
- which segment this helps
- which metric it should move
- whether it is a Q2 learning question, a Q3 scaling lever, a Q4 expansion lever, or a 2027 system optimization
- whether the output is a product recommendation, a GTM recommendation, or a learning agenda recommendation

The agents should not treat those as optional metadata. They are part of the reasoning frame.

## Shared Growth Context

This is the minimum context Atlas and Beacon should always have available.

### North Star

- End of 2027 goal: `200MM monthly PVs`
- Scale target: `10k active communities`
- Core business framing: community should become a meaningful pageview engine

### Milestone Targets

#### Q3 2026

- Communities: `500`
- Total members: `575k`
- Return rate: `40%`
- Monthly member visitors: `230k`
- PVs / member visitor: `32`
- Monthly PVs: `7.5MM`

#### Q4 2026

- Communities: `2,000`
- Total members: `2MM`
- Return rate: `44%`
- Monthly member visitors: `860k`
- PVs / member visitor: `36`
- Monthly PVs: `31MM`

#### 2027

- Communities: `10,000`
- Total members: `9.4MM`
- Active rate: `46%`
- Monthly member visitors: `4.3MM`
- PVs / member visitor: `47`
- Monthly PVs: `200MM`

### Working Growth Theory

- A small share of communities will create outsized value
- Most communities will not "work"
- Segment selection matters as much as product quality
- Q2 is a learn-and-prepare phase, not a pure scale phase

### Open Strategic Questions

- What defines a community that "works"?
- What defines large vs. mid-size vs. small influencer segments?
- Which segments should be prioritized first in Q3?
- What should the Q2 learning agenda prove before scale?

## Agent Guidance

### Atlas

Atlas should frame every synthesis with:

1. business objective
2. segment or segment hypothesis
3. metric to move
4. current evidence
5. recommendation
6. expected outcome

Atlas should explicitly classify the recommendation as one of:

- `product`
- `go-to-market`
- `segment strategy`
- `learning agenda`

Atlas should also attach a stage label:

- `Q2 learn`
- `Q3 scale`
- `Q4 expand`
- `2027 optimize`

### Beacon

Beacon should always return evidence using this structure:

- `segment relevance`
- `growth lever`
- `confidence`
- `directional implication`
- `recommended next step`

Beacon should map findings to one or more of these levers:

- `community acquisition`
- `community activation`
- `member return rate`
- `PVs per member visitor`
- `community quality`

### Shared Rule

Neither agent should present a recommendation without tying it to:

- a segment
- a metric
- a growth stage

If one of those is unknown, the output should say so explicitly.

## Proposed Objective and Segment Model

The current `Objective` type is too thin for strategy-aware runs. It captures a title and metric, but it does not tell the agents which segment or growth stage the objective is about.

### Recommended Objective Shape

```ts
type GrowthStage = "q2_learn" | "q3_scale" | "q4_expand" | "fy2027_optimize";

type ObjectiveType =
  | "product"
  | "go_to_market"
  | "segment_strategy"
  | "learning_agenda";

type GrowthMetric =
  | "communities"
  | "total_members"
  | "return_rate"
  | "monthly_member_visitors"
  | "pvs_per_member_visitor"
  | "monthly_pvs"
  | "active_rate";

interface Objective {
  id: string;
  title: string;
  description: string;
  type: ObjectiveType;
  stage: GrowthStage;
  metric: GrowthMetric;
  target: string;
  segmentIds: string[];
  theoryOfSuccess?: string;
  owner?: string;
  createdAt: string;
}
```

### Recommended Segment Shape

```ts
type SegmentTier =
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

interface Segment {
  id: string;
  name: string;
  tier: SegmentTier;
  description: string;
  targetCount?: string;
  benefit?: string;
  marketingMessage?: string;
  reachStrategy?: string;
  theoryOfSuccess?: string;
}
```

### Recommended Run Context Shape

```ts
interface CrewRunContext {
  northStar: string;
  stage: GrowthStage;
  objectives: Objective[];
  activeSegments: Segment[];
  openQuestions: string[];
}
```

## How the UI Should Work

The Design Ops UI should make growth context visible before a run starts.

### Recommended IA

1. `Company Objectives`
2. `Segments`
3. `Open Questions`
4. `Run Crew`
5. `Archive`

### Recommended Page Structure

#### Row 1: Company Growth Context

- north star card
- current stage card
- milestone targets card

#### Row 2: Segment Strategy

- segment cards with:
  - name
  - why this segment matters
  - theory of success
  - current status

#### Row 3: Crew Run Setup

- focus prompt
- evaluate against objectives
- evaluate against segments
- optional open questions toggle
- `Run Crew`

#### Row 4: Output

- Atlas framing summary
- Beacon evidence synthesis
- recommendation classification
- expected metric movement
- archive

## Output Requirements for the Agents

Every completed run should answer:

- Which company objective is this tied to?
- Which segment does this apply to?
- What metric should move if this is right?
- What stage of growth is this helping?
- Is this a product change, GTM move, or learning question?
- What should happen next?

That prevents the agents from producing interesting-but-floating synthesis.

## Key Decisions

- Growth context should be first-class runtime input, not just a doc
- Segment strategy should be explicit in the data model
- Open questions should remain visible because they shape decision quality
- Design Ops should support strategy work, not only product critique

## Recommendation

Start with a lightweight local growth-context layer in Design Ops:

1. add a canonical growth context document or JSON seed
2. extend `Objective` to include stage and segment linkage
3. add a `Segment` model
4. make Atlas and Beacon include segment + metric + stage in every output
5. expose that context in the Design Ops UI before runs begin

This is the minimum step that makes the agents strategy-aware without overbuilding the system.

## Next Steps

- update the agent prompts so Atlas and Beacon explicitly reason from growth objectives
- extend the local Design Ops objective model
- add a segment model and a basic UI for segment selection
- make archived runs preserve the business objective and segment context used at runtime
