# Carrier
**PRD + Design Doc · V1 + V1.1 Addendum · March 2026**

| Product | Focus | Status |
| --- | --- | --- |
| Carrier | Design explorations, research synthesis, and stakeholder-ready prototype drops | Draft |

---

## 01 Overview

### Product Brief

Carrier is a private design workspace for turning ambiguous product questions into structured evidence, aligned options, and clear next actions. It combines lightweight exploration sessions, research synthesis, replay review, and stakeholder-facing project drops in one environment.

Carrier is not the end-user product. It is the operating surface the product team uses to:

- frame a problem
- create and compare options
- collect structured signal from voters and stakeholders
- synthesize research and behavioral evidence
- package a directional narrative for review

### Problem Statement

Product and design teams often work across too many disconnected tools:

- ideas live in notes or Figma
- feedback lives in Slack threads
- research findings live in decks
- evidence from behavior and replays lives somewhere else entirely
- stakeholder review happens after the reasoning is already fragmented

That fragmentation creates three core problems:

1. The team loses the chain of reasoning from problem to option to decision.
2. Feedback becomes subjective and hard to compare across explorations.
3. Stakeholders see outputs without enough context to trust why a direction is emerging.

Carrier exists to keep exploration, evidence, and recommendation in one system.

### Product Vision

Carrier should feel like a design operating system:

- a place to create an exploration session quickly
- a place to gather structured reactions and discussion around options
- a place to pull research and replay evidence into synthesized insight
- a place to package major initiatives as stakeholder-ready drops

### PRD / Brief Framing Rule

Every feature, initiative, or recommendation in Carrier should be framed in this order:

1. **Goal**: what business or product outcome are we trying to move?
2. **Problem or opportunity**: what specific friction, gap, or signal makes this worth solving?
3. **Proposed solution**: what are we recommending only after the goal and problem are clear?
4. **Expected outcome**: what should change if the solution is correct?

This sequence is part of the PRD / Brief itself, not a downstream review artifact. The point is to set context before solutioning starts and to keep the reasoning chain explicit from the beginning.

### Who It Serves

Primary users:

- product designers
- design leads
- product managers
- internal reviewers and stakeholders

Secondary users:

- researchers
- engineers reviewing direction
- leadership consuming synthesized recommendations

### Non-Goals

Carrier is not intended to be:

- a public-facing end-user product
- a generic project management system
- a long-form documentation repository
- a replacement for Figma craft or production analytics tooling

Its job is narrower: structure exploration, preserve evidence, and support decision-making.

---

## 02 Jobs To Be Done

### Core JTBD

When I am shaping a product direction and there are multiple possible paths, I want to gather options, evidence, and reactions in one place, so I can make a defensible decision and communicate it clearly.

### User Jobs

| Job | User Goal | Why Carrier Matters | Priority |
| --- | --- | --- | --- |
| Frame an exploration | Define the problem, goal, audience, and constraints before debate starts | Keeps option review grounded in context | P0 |
| Compare options quickly | Put multiple ideas side by side and collect structured votes/comments | Makes tradeoffs visible early | P0 |
| Preserve evidence | Tie votes, comments, research, and replay findings back to a session or initiative | Prevents decision drift | P0 |
| Synthesize signal | Turn raw research and replay data into themes, tensions, and opportunities | Converts noise into strategic guidance | P1 |
| Package a narrative | Present a larger initiative as a clean project drop for stakeholders | Makes review faster and more credible | P1 |

---

## 03 Product Scope

Carrier currently operates across four connected surfaces.

### Surface 1: Exploration Sessions

Primary routes:

- `/`
- `/new`
- `/explorations/[id]`

Purpose:

- create a session with title, description, brief, and options
- collect option-level voting and comments
- move from setup to voting to revealed results

### Surface 2: Research Synthesis

Primary routes:

- `/research`
- related research log / observe / segments / reference flows

Purpose:

- ingest research artifacts and stored insights
- synthesize findings into themes, opportunities, tensions, and one key metric
- create a strategic summary from raw evidence

### Surface 3: Session Replays

Primary route:

- `/replays`

Purpose:

- review recorded sessions or behavioral traces
- identify friction and severity
- generate recommendations and open questions

### Surface 4: Project Drops

Primary route pattern:

- `/drops/*`

Current example:

- `/drops/creator-tools`

Purpose:

- turn a major initiative into a stakeholder-ready story
- organize findings, themes, audience, threads, and actions
- make a larger product concept reviewable without requiring the viewer to understand the whole workspace

### In Scope for V1

- create, edit, and review exploration sessions
- collect structured votes, comments, and reactions on options
- reveal results and compare option signal
- synthesize stored research into strategic outputs
- review replay findings and summarize friction
- publish initiative-specific project drops inside the workspace

### Out of Scope for V1

- external sharing or public publishing of Carrier work
- permissions beyond lightweight admin/reviewer distinctions
- deep integration with production PM systems
- automated roadmap generation
- broad multi-team workflow management

---

## 04 Why Carrier Exists

### The Core Gap

Most teams do one of two things poorly:

- they explore widely, but lose rigor and traceability
- they document rigorously, but too late in the process

Carrier is meant to bridge that gap.

It should help the team move from:

`question -> options -> signal -> evidence -> recommendation`

without switching systems or rebuilding the story after the fact.

### Strategic Value

For the team:

- faster alignment around options
- stronger continuity from insight to decision
- less reliance on memory, chat threads, and scattered artifacts

For leadership and stakeholders:

- cleaner narratives
- more confidence in why a direction is being recommended
- lower review overhead because evidence is already structured

---

## 05 Design Principles

### 1. Keep the reasoning chain intact

Every recommendation should be traceable back to:

- the original problem framing
- the options considered
- the evidence gathered
- the signal that changed confidence

Carrier should consistently move through:

`goal -> problem/opportunity -> proposed solution -> expected outcome`

rather than presenting solutions before the context that justifies them.

### 2. Structured input beats open-ended chaos

Carrier should prefer:

- scoped votes
- targeted comments
- tagged findings
- explicit tensions and opportunities

over unstructured discussion as the default interaction model.

### 3. Evidence should feel close to action

Users should not need to leave one system to answer:

- What did we learn?
- Why do we believe this?
- What should we do next?

### 4. Support both messy exploration and polished review

Carrier has to hold two modes at once:

- working mode: fast, iterative, exploratory
- review mode: clear, coherent, stakeholder-ready

The product should not force a separate rewrite step to move from one to the other.

### 5. Optimize for decision quality, not documentation volume

The goal is not to create more documents. The goal is to make better product decisions with a cleaner trail of evidence.

### 6. Validate evidence before surfacing it as signal

Data that has not been checked should not look like a conclusion. Carrier should make the distinction between raw, unvetted data and confirmed insight visible at every level: session results, synthesis outputs, and replay findings alike.

In practice this means:

- synthesis outputs should indicate source confidence and recency
- metrics presented in drops or sessions should be traceable to a verified source
- the UI should distinguish between emerging signal and confirmed evidence rather than flattening them into one treatment

This principle reflects the reality that internal data can be inconsistent. Carrier should build trust by being honest about certainty, not by projecting false confidence.

---

## 06 Experience Model

### Primary Flow

The intended Carrier flow is:

1. Create an exploration session.
2. Add context brief and multiple options.
3. Gather votes, comments, and reactions.
4. Review results and emerging signal.
5. Pull in research synthesis or replay findings where relevant.
6. Package a broader initiative as a project drop.
7. Use the drop to align stakeholders on what matters and what happens next.

### Mental Model

Carrier should feel like:

- a lab for testing product directions
- a notebook with memory
- a review surface that can defend itself

It should not feel like:

- a generic project management tool
- a document graveyard
- a one-off presentation builder

### Primary User Flows

#### Flow A: Start a New Exploration

1. User opens `New Session`
2. User enters title, description, and context brief
3. User adds at least two options
4. User sets participant count
5. User creates session
6. Carrier lands them in the exploration detail view

Success condition:

- a new session exists with enough context for meaningful review

#### Flow B: Run an Option Review

1. Reviewer opens a session
2. Reviewer scans context and options
3. Reviewer votes, comments, and reacts on options
4. Carrier aggregates the signal
5. Owner reveals results and inspects leading options

Success condition:

- the team can see which options are strongest and why

#### Flow C: Synthesize Research

1. User opens `Insights`
2. User triggers synthesis on available research/session data
3. Carrier generates themes, opportunities, tensions, and a key metric
4. User reviews synthesized findings
5. Findings inform follow-up sessions or a project drop

Success condition:

- raw evidence becomes structured insight usable in product review

#### Flow D: Package an Initiative

1. User opens or creates a project drop
2. User organizes the story around key findings and actions
3. User ties narrative back to sessions and insights
4. Stakeholders review the drop

Success condition:

- stakeholders can understand the current recommendation without needing the whole backstory recreated live

---

## 07 Feature Requirements

### Exploration Sessions

Carrier must support:

- session creation with title, description, problem, goal, audience, and constraints
- multiple design/product options per session
- participant count / voter setup
- phase-based flow: setup, voting, revealed
- comments and reactions tied to options
- winner or leading-option reveal logic

Acceptance criteria:

- user can create a session with at least 2 options
- session stores title, description, and contextual brief fields
- reviewers can submit votes/comments against options
- session can move between setup, voting, and revealed states
- result view surfaces leading or winning options clearly

### Research Synthesis

Carrier should support:

- collecting stored insights from research inputs
- generating themes, opportunities, tensions, signals, and a key metric
- preserving synthesis batches so outputs can be reviewed over time

Acceptance criteria:

- synthesis can be triggered from the insights surface
- results are grouped into a distinct batch/run
- outputs separate insight types clearly
- user can review the latest batch without leaving the workspace

### Replay Analysis

Carrier should support:

- reviewing replay-based friction findings
- organizing findings by severity and theme
- turning replay evidence into recommendations

Acceptance criteria:

- replay findings can be grouped by severity
- workspace surfaces quick wins, big bets, and open threads
- replay summaries are readable by non-research stakeholders

### Project Drops

Carrier should support:

- a narrative layer above raw sessions
- stakeholder-friendly information architecture
- initiative-specific pages that connect overview, evidence, and actions

Acceptance criteria:

- each drop has a clear overview and supporting sections
- drops can point back to supporting evidence or session work
- drops are readable without requiring users to inspect raw session objects first

### Data Validation Layer *(near-term)*

Problem it solves:

- presenting unvetted data in stakeholder sessions erodes credibility
- teams need a lightweight way to flag data confidence before packaging signal into drops or synthesis

Requirements:

- each metric or data point surfaced in a session, insight batch, or drop can be tagged with `unverified`, `in review`, or `confirmed`
- unverified data is visually distinguishable from confirmed data
- session owners can flag a metric for review before moving a session to `revealed`
- project drops surface a data confidence summary at the page level

Acceptance criteria:

- reviewer can tell at a glance whether a metric has been validated
- confirmed data has a source reference including owner, date, and origin
- drops cannot be published without at least one confirmed evidence anchor

Out of scope:

- automated data verification
- direct integrations with analytics platforms

### Cross-Cutting Requirements

Carrier must also support:

- lightweight admin behavior for privileged actions
- clear navigation between sessions, insights, and drops
- responsive layouts for laptop-first but mobile-safe review
- enough visual clarity that sessions and drops can be reviewed live in meetings

---

## 08 Information Architecture

### Workspace Level

Top-level Carrier navigation currently maps to:

- `Sessions`
- `Insights`
- `Project Drops`
- `New Session`

Recommended interpretation:

- `Sessions` = active explorations
- `Insights` = research and replay evidence
- `Project Drops` = initiative narratives
- `New Session` = create the next unit of work

### Initiative Level

Project Drops should package bigger product stories. The Creator Tools drop is the current example of this pattern.

Recommended long-term rule:

- sessions are working objects
- insights are evidence objects
- drops are communication objects

That separation is one of Carrier's strongest structural ideas and should remain intact.

### Route Model

Current route model:

- `/` -> sessions index
- `/new` -> create session
- `/explorations/[id]` -> session detail
- `/research` -> synthesized insights surface
- `/replays` -> replay analysis surface
- `/drops/*` -> initiative-specific narratives

Recommended rule:

- all routes should map to one of three object types: work, evidence, or communication

---

## 09 Success Metrics

Carrier impact should be measured through an outcome/input pairing lens. Outcome metrics show whether Carrier is improving product and team decisions. Input metrics show whether the behaviors that produce those outcomes are actually happening.

| Metric | Type | What It Indicates |
| --- | --- | --- |
| Recommendation adoption rate | Outcome | Carrier output is credible enough to influence roadmap/design direction |
| Stakeholder review completion rate on drops | Outcome | Narratives are legible and actionable |
| PM/design misalignment incidents per initiative | Outcome | Shared context reduces opinion-based conflict |
| Sessions created per initiative | Input | Teams are using structured exploration instead of ad hoc review |
| Average options reviewed per session | Input | Real comparison is happening, not single-solution validation |
| Research synthesis usage rate | Input | Evidence is being incorporated before decisions are made |
| Data validation completion before drop publish | Input | Data integrity is maintained before stakeholder review |

### Qualitative Signals

- stakeholders say the rationale is easier to follow
- designers spend less time rebuilding context in meetings
- PM/design review shifts from opinion wars to evidence-backed tradeoffs
- PMs can describe why a design direction is being recommended without needing the designer in the room

---

## 10 Risks

| Risk | Consequence | Mitigation |
| --- | --- | --- |
| Carrier becomes too many tools in one | Users stop understanding what it is for | Keep the core model centered on exploration -> evidence -> recommendation |
| Session creation feels heavy | Users fall back to notes/Figma/Slack | Keep the create flow lightweight and fast |
| Research synthesis feels untrustworthy | Teams ignore generated insight | Clearly label evidence vs. inference and keep source grounding visible |
| Project Drops drift into static docs | Carrier loses its connection to live exploration | Require drops to cite sessions, findings, or supporting evidence |
| Stakeholder feedback becomes noisy | Signal quality drops | Favor scoped reactions and structured commentary over freeform discussion |

---

## 11 Functional Spec Summary

### Object Types

Carrier currently revolves around three product objects:

#### 1. Session

Represents a single exploration or comparison exercise.

Core fields:

- title
- description
- problem
- goal
- audience
- constraints
- options
- participant count
- votes
- comments/reactions
- phase

#### 2. Insight Batch

Represents one synthesis run over research or replay evidence.

Core outputs:

- themes
- opportunities
- tensions
- open questions
- signals
- one key metric

#### 3. Project Drop

Represents a narrative wrapper around a larger initiative.

Core roles:

- summarize what matters
- connect evidence to action
- make initiative review legible to stakeholders

### User Roles

#### Workspace owner / admin

- create and delete sessions
- manage privileged actions
- guide review

#### Reviewer / stakeholder

- inspect sessions and drops
- vote, comment, and react
- consume synthesized outputs

### States

#### Session states

- `setup`
- `voting`
- `revealed`

State rule:

- setup defines the exploration
- voting collects signal
- revealed exposes comparative outcome

---

## 12 Design Plan

### Phase 1: Clarify Carrier's product identity

Goal:

- define Carrier as the workspace-level product, not just the container for one drop

Work:

- document the product model
- align names for sessions, insights, and drops
- remove ambiguity between internal tools and stakeholder-facing surfaces

### Phase 2: Tighten the workspace IA

Goal:

- make the workspace-level navigation and page roles more legible

Work:

- clarify what belongs in Sessions vs. Insights vs. Drops
- ensure each top-level route answers a distinct question
- reduce duplicate concepts across surfaces

### Phase 3: Strengthen the evidence chain

Goal:

- make it easier to move from session signal to research/replay support to stakeholder narrative

Work:

- expose links between sessions, findings, and drops
- make recommendations cite evidence more explicitly
- improve context carry-through across surfaces

### Phase 4: Formalize review workflows

Goal:

- make Carrier better for collaborative product review, not just solo design work

Work:

- improve stakeholder feedback patterns
- define admin vs. reviewer roles more clearly
- make `what needs review now` visible at the workspace level

---

## 13 Open Questions

- Is Carrier primarily a solo design workspace, or a team review workspace?
- Should every Project Drop be backed by one or more explicit sessions?
- How opinionated should research synthesis be before trust drops?
- What is the minimum evidence threshold required before a recommendation is shown as strong?
- Should project drops eventually become shareable outside the internal workspace?
- How does Carrier distinguish between directional data and validated evidence in its UI without making the labeling feel bureaucratic?
- What is the right moment in the session lifecycle to require data validation: at creation, at voting, or at drop publication?
- Should AI agent guidelines live inside Carrier's workspace or be maintained as a separate document layer that Carrier references?

---

## 14 Working Definition

Carrier is a private product-design workspace for turning exploration into evidence-backed recommendation.

It helps teams:

- frame questions
- compare options
- gather structured signal
- synthesize research and replay evidence
- package initiatives into stakeholder-ready narratives

That is the product. Creator Tools is one project inside it, not the definition of Carrier itself.

---

## 15 Related Docs

- `docs/carrier-design-ops.md`
