---
date: 2026-03-11
topic: prd-template-design-ops-mapping
---

# Using the Product Team PRD Template in Design Ops

## Why This Matters

The product team's PRD template is useful because it can become the canonical structure for both:

- human-readable strategy and product documents
- agent-readable context inside Design Ops

That prevents Carrier from becoming a parallel strategy system with its own vocabulary. Instead, Design Ops can become the place where the PRD logic gets exercised, tested, and archived.

## Recommended Mapping

### Executive summary

Use for:
- run summary
- north star framing
- one-sentence objective statement shown at the top of a run

### User stories and problem statement

Use for:
- Atlas framing
- run setup context
- segment-specific user/job definition

### External forces

Use for:
- Beacon evidence inputs
- research, market, and internal performance context
- confidence labeling

### Goals, metrics, definition of success

Use for:
- objective records in Design Ops
- metric target fields
- run evaluation criteria

### Events to track

Use for:
- instrumentation backlog
- what evidence Beacon should look for in future runs

### Functional requirements and scope

Use for:
- product recommendations
- what is in scope vs exploratory
- whether an output is a real recommendation or just a learning question

### Other requirements and risks

Use for:
- risk framing in agent outputs
- legal, privacy, trust, or platform constraints

### What is NOT covered here

Use for:
- explicit non-goals in runs and PRDs
- keeping Atlas from recommending adjacent but out-of-scope ideas

### Timeline and/or deadline

Use for:
- growth stage tagging
- Q2 / Q3 / Q4 / 2027 context in runs

### Rollout plan

Use for:
- operational recommendation framing
- segment order and beta sequencing

### Who’s doing what?

Use for:
- owner field on objectives
- accountability in archives and follow-up

### Supporting docs and links

Use for:
- linked evidence, archive history, dashboards, and source references

## Product Implication

Design Ops should not ask for a full PRD before every run. That would be too heavy.

Instead, the system should:

1. capture a lightweight objective record using PRD-compatible fields
2. let Atlas assemble a run framing from that structured data
3. let Beacon return evidence using the same structure
4. preserve the result as an archive that can later inform a formal PRD

That turns the PRD template into both a strategic structure and a reusable system prompt shape.
