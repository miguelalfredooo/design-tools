import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { BriefFramingSequence } from "@/components/design/brief-framing-sequence";
import { CreatorToolsDocCard } from "@/components/design/creator-tools-doc-card";
import { CreatorToolsShell } from "@/components/design/creator-tools-shell";
import { Badge } from "@/components/ui/badge";

const userStories = [
  {
    title:
      "As a content creator, I want to know which of my posts are driving engagement and pageviews, so that I can focus on content that actually resonates with my audience.",
  },
  {
    title:
      "As a content creator, I want to maintain a consistent community presence without having to be online in real time, so that my readers stay engaged even when I'm focused on creating.",
  },
  {
    title:
      "As a content creator, I want to know when a conversation is worth my attention, so that I can show up at the right moment without having to monitor the community manually.",
  },
  {
    title:
      "As a creator's team member, I want to support the creator's community presence on their behalf, so that we can keep readers engaged when the creator is unavailable.",
  },
];

const knownSignals = [
  "Creator posting frequency is low relative to reader activity",
  "Pageview spikes correlate with windows of active creator engagement",
  "Reader churn increases when creators go silent for 2+ weeks",
];

const validationQuestions = [
  "Which performance signals creators actually want vs. what we assume",
  "How creators decide when a community conversation is worth joining",
  "Whether intelligent engagement prompts feel helpful or intrusive",
];

const eventsToTrack = [
  {
    behavior: "Post created — scheduled vs. immediate, creator vs. team",
    why: "Measures friction reduction and delegation adoption",
  },
  {
    behavior: "Creator opens performance view",
    why: "Signals whether analytics drives return visits",
  },
  {
    behavior: "Creator acts on an engagement prompt",
    why: "Measures prompt quality and relevance",
  },
  {
    behavior: "Prompt dismissed or ignored",
    why: "Signals fatigue or poor targeting",
  },
  {
    behavior: "Session depth — posts viewed, comments read, reactions given",
    why: "Measures community investment per visit",
  },
];

const successMetrics = [
  {
    metric: "Creator posting frequency",
    target: "+25% posts/creator/month",
    businessKpi: "Content volume -> pageviews",
  },
  {
    metric: "Creator DAU/WAU ratio",
    target: "+15% vs. baseline",
    businessKpi: "Platform habit formation",
  },
  {
    metric: "Pageviews per community session",
    target: "+10% vs. pre-launch",
    businessKpi: "Core monetization signal",
  },
  {
    metric: "Engagement prompt response rate",
    target: ">30% result in creator action",
    businessKpi: "Feature quality signal",
  },
  {
    metric: "Lapsed reader re-engagement",
    target: ">15% return within 7 days",
    businessKpi: "Reader retention",
  },
];

const p0Capabilities = [
  {
    problem: "Creators can't post ahead of time, limiting consistency",
    capability:
      "Creators can control when their posts go live without being online",
    outcome:
      "More consistent posting cadence; less drop-off during busy periods",
  },
  {
    problem:
      "Creators have no way to surface important content for readers",
    capability:
      "Creators can control what stays prominent in their community",
    outcome:
      "Readers are guided to high-value content; creator intent is preserved",
  },
  {
    problem: "Creators have no idea what content is working",
    capability:
      "Creators can see which posts are driving engagement and pageviews",
    outcome:
      "Creators make better content decisions; stronger posts get repeated",
  },
  {
    problem:
      "Creators miss high-value conversations happening without them",
    capability:
      "Creators have a way to identify the moments most worth their attention",
    outcome:
      "More timely creator participation; stronger reader relationships",
  },
  {
    problem:
      "Lapsed readers leave silently with no recovery mechanism",
    capability:
      "Creators have visibility into which of their normal activity has re-engagement potential",
    outcome:
      "Reduced reader churn with no additional creator effort required",
  },
];

const p1Capabilities = [
  {
    problem:
      "Creators can't manage or correct posts after publishing",
    capability:
      "Creators can edit, hide, or remove their content",
    outcome: "Greater creator confidence and content quality",
  },
  {
    problem:
      "Creators can't scale their presence without being the one doing it",
    capability:
      "A team member can maintain the creator's community voice on their behalf",
    outcome:
      "Creator presence is sustained without creator time; reader trust is preserved",
  },
  {
    problem:
      "Creators don't know the best time to post or what topics to explore",
    capability:
      "Creators are shown when and what their audience is most receptive to",
    outcome:
      "Higher engagement on new posts; reduced blank-page friction",
  },
  {
    problem:
      "Engagement prompts may not suit every creator's workflow",
    capability:
      "Creators can configure how and when they receive prompts",
    outcome: "Sustained adoption; reduced notification fatigue",
  },
];

const risks = [
  {
    risk: "Legal / privacy",
    notes:
      "Behavioral data used for lapsed reader signals needs legal review before launch",
  },
  {
    risk: "Authenticity",
    notes:
      "Team posting on behalf of creators requires visible attribution — non-negotiable for reader trust",
  },
  {
    risk: "Advertiser impact",
    notes:
      "Confirm AI-driven prompts don't conflict with existing advertiser agreements",
  },
  {
    risk: "Notification fatigue",
    notes:
      "Over-prompting creators risks disengagement from the feature entirely",
  },
];

const exclusions = [
  {
    title: "Content integrations",
    body:
      "Cross-posting from blog, Instagram, or Substack. Deferred until creator research confirms this is a real workflow need.",
  },
  {
    title: "Exclusive content gating",
    body:
      "Member-only posts and access tiers. Requires a separate monetization discussion.",
  },
  {
    title: "Creator benchmarking",
    body:
      "Community health scores vs. comparable creators. Needs sufficient data density to be meaningful.",
  },
];

const rolloutPlan = [
  "Beta with a small cohort of high-activity creators before broad release",
  "Phased expansion by creator activity tier based on beta learnings",
  "Owners: TBD — eng lead, product (Cyle/Miguel), marketing for creator comms",
];

const supportingDocs = [
  "Sprint 0 interview guide (to be created)",
  "Analytics data availability audit (to confirm with data/eng)",
  "Snowflake integration requirements (needed for engagement signal data)",
  "Prototype repo (Miguel to share access)",
];

const designPlanSections = [
  {
    title: "V1 feature areas",
    body:
      "Post and community controls, analytics dashboard, and AI-driven engagement nudges. The sequence starts by reducing friction, then clarifying performance, then prompting timely follow-through.",
  },
  {
    title: "Design plan",
    body:
      "Discovery with creator interviews and analytics audit, concept prototyping, high-fidelity design/spec, then build support and beta rollout with instrumentation.",
  },
  {
    title: "Primary design principle",
    body:
      "Lead creators toward the next useful action. The interface should make outcomes obvious instead of dumping raw controls or analytics without interpretation.",
  },
];

const researchSections = [
  {
    title: "Research foundation",
    body:
      "Current assumptions center on posting friction, weak visibility into engagement signal, and the need for more useful creator-side controls. Sprint 0 should validate what data creators actually want and when AI nudges feel helpful.",
  },
  {
    title: "Recommended research",
    body:
      "Run creator interviews, audit engagement patterns across top creators, and validate whether creators respond better to opinionated analytics summaries than configurable dashboards.",
  },
  {
    title: "Success metrics",
    body:
      "Posting frequency, creator habit formation, session depth, nudge response rate, and lapsed reader re-engagement within 90 days of launch.",
  },
];

function SectionCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <CreatorToolsDocCard title={title}>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">
        {body}
      </p>
      {children ? <div className="mt-5">{children}</div> : null}
    </CreatorToolsDocCard>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-[24px] border border-border/60 bg-card/85">
      <table className="min-w-full divide-y divide-border/60 text-sm">
        <thead className="bg-muted/30">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${headers[cellIndex]}-${index}`}
                  className="px-4 py-4 align-top leading-7 text-foreground/90"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CreatorToolsPrdPage() {
  return (
    <CreatorToolsShell
      badge="PRD / Brief"
      title="Creator Tools PRD"
      description="Product reference for Creator Tools. This document now lives inside the same global Creator Tools navigation as the rest of the prototype."
      actions={
        <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
          <FileText className="size-3.5" />
          March 2026
        </Badge>
      }
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              PRD / Brief
            </p>
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">
              Product Requirements Document
            </h2>
          </div>
          <BriefFramingSequence />

          <SectionCard
            title="Executive Summary"
            body="Creators on Raptive Community are underengaged, limiting reader retention and pageview growth. We need to give creators the visibility and control they need to show up consistently and meaningfully — so that the community becomes a place they're invested in, not just present on."
          />

          <SectionCard
            title="User Stories & Problem Statement"
            body="Creators are the engine of the community. When they're inactive, reader engagement drops, return visits decline, and pageview revenue suffers. The current platform gives creators no visibility into what's working and no way to manage their presence efficiently."
          >
            <div className="space-y-3 text-sm leading-7 text-foreground/90">
              {userStories.map((story) => (
                <p key={story.title}>{story.title}</p>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Goals, Metrics & Definition of Success"
            body="Success means creators are posting more, engaging more meaningfully, and driving measurable pageview lift — measured 90 days post-launch."
          >
            <DataTable
              headers={["Metric", "Target", "Business KPI"]}
              rows={successMetrics.map((item) => [
                item.metric,
                item.target,
                item.businessKpi,
              ])}
            />
          </SectionCard>

          <CreatorToolsDocCard title="External Forces">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  What we know from existing data
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-foreground/90">
                  {knownSignals.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  What we need to validate
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  6-8 creator interviews planned
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-foreground/90">
                  {validationQuestions.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Market Signal
                </h3>
                <p className="mt-3 text-sm leading-7 text-foreground/90">
                  Substack, Patreon, and Creator.co offer creator-facing analytics and
                  engagement tools as table stakes. Raptive Community currently has none.
                  This is a retention and differentiation gap.
                </p>
              </div>
            </div>
          </CreatorToolsDocCard>

          <section className="space-y-4">
            <SectionCard
              title="Events to Track"
              body="These behaviors make the product legible as both a creator tool and a business lever."
            />
            <DataTable
              headers={["Behavior", "Why it matters"]}
              rows={eventsToTrack.map((item) => [item.behavior, item.why])}
            />
          </section>

          <section className="space-y-4">
            <SectionCard
              title="Functional Requirements & Scope"
              body="The product framing here follows the team's PRD pattern: problem -> proposed capability -> expected outcome."
            />

            <div className="space-y-2">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                P0
              </Badge>
              <DataTable
                headers={["Problem", "Capability Needed", "Expected Outcome"]}
                rows={p0Capabilities.map((item) => [
                  item.problem,
                  item.capability,
                  item.outcome,
                ])}
              />
            </div>

            <div className="space-y-2">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                P1
              </Badge>
              <DataTable
                headers={["Problem", "Capability Needed", "Expected Outcome"]}
                rows={p1Capabilities.map((item) => [
                  item.problem,
                  item.capability,
                  item.outcome,
                ])}
              />
            </div>
          </section>

          <section className="space-y-4">
            <SectionCard
              title="Other Requirements & Risks"
              body="These are the operational and trust constraints that shape how Creator Tools should ship."
            />
            <DataTable
              headers={["Risk", "Notes"]}
              rows={risks.map((item) => [item.risk, item.notes])}
            />
          </section>

          <CreatorToolsDocCard title="What Is Not Covered Here">
            <div className="space-y-4">
              {exclusions.map((item) => (
                <div key={item.title}>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </CreatorToolsDocCard>

          <SectionCard
            title="Timeline & Deadline"
            body="No hard external deadline. Sprint breakdown to be done in partnership with engineering after creator research is complete."
          />

          <CreatorToolsDocCard title="Rollout Plan">
            <ul className="mt-4 space-y-2 text-sm leading-7 text-foreground/90">
              {rolloutPlan.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </CreatorToolsDocCard>

          <CreatorToolsDocCard title="Supporting Docs & Links">
            <ul className="mt-4 space-y-2 text-sm leading-7 text-foreground/90">
              {supportingDocs.map((item) => (
                <li key={item}>- [ ] {item}</li>
              ))}
            </ul>
          </CreatorToolsDocCard>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Design Plan
            </p>
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">
              Design Approach
            </h2>
          </div>
          <div className="grid gap-4">
            {designPlanSections.map((section) => (
              <SectionCard key={section.title} {...section} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Research
            </p>
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">
              Research Foundation
            </h2>
          </div>
          <div className="grid gap-4">
            {researchSections.map((section) => (
              <SectionCard key={section.title} {...section} />
            ))}
          </div>
        </section>
      </div>
    </CreatorToolsShell>
  );
}
