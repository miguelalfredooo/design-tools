# Carrier Design Ops & Ways of Working
**Operating Addendum · March 2026**

This document captures the practice layer around Carrier: how design directions should be framed, how PM collaboration should work, and how data integrity should be handled before signal is presented as recommendation.

## Feature Advocacy Framework

When proposing a new feature or design direction, lead with this sequence:

1. **Business goal**: what outcome are we trying to move?
2. **Problem or opportunity**: what specific friction or gap exists?
3. **Proposed solution**: only after establishing the goal and problem
4. **Expected outcome**: define success criteria before work starts

This preserves the reasoning chain Carrier is designed to hold and gives PM stakeholders the business framing they need.

## PM Collaboration

Carrier sessions should not be the first time a PM encounters a design direction. The goal is alignment before review, not alignment during review.

In practice:

- share problem framing and constraints with relevant PMs before options are added to a session
- use sessions to collect structured signal, not to introduce the problem for the first time
- when priorities, timelines, or deliverable expectations are unclear, capture that in writing so it remains traceable

## Data Integrity

Before any metric or behavioral finding is surfaced in a Carrier session, insight batch, or project drop:

- confirm the source and recency with the relevant data owner
- distinguish between directional signal and validated evidence
- do not present unvetted data as a confirmed finding

This is not about caution for its own sake. It is about building the credibility that makes Carrier outputs worth trusting.

## AI-Assisted Design Layer

### Near-Term: Human-Readable Principle Documentation

Carrier design principles and component guidelines should be documented in a structured semantic format.

Requirements:

- guidelines cover interaction patterns, visual language, and decision rationale, not just tokens
- documentation is versioned and linked to sessions or drops where decisions were made
- guidelines are findable from within Carrier's workspace

### Future Direction: AI Agent Integration

Longer-term goal:

- enable AI coding agents to consult Carrier principles during feature development
- produce more UX-compliant starting points with less rework

This would require:

- design principles stored in a structured semantic layer
- a defined schema for how agents query and apply guidelines
- a feedback loop where reviewed outputs improve the documentation

Status:

- not in scope for V1
- should influence how principle documentation is structured now
