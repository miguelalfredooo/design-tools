# Carrier PRD — Sessions, Insights & Design Ops

**Date:** 2026-03-17
**Status:** Draft
**Scope:** Sessions, Insights, Design Ops flows only
**Platform:** Desktop-only, private workspace

---

## 1. Product

Carrier is a private, desktop-only product-design workspace for running research sessions,
synthesizing insights, and reviewing Design Ops outputs in one place.

---

## 2. Problem

The workspace is powerful but hard to read. Session setup, insights, and Design Ops outputs
share one workspace, but the information hierarchy is weak, the flow is hard to scan, and
the results layer exposes too much internal process detail to shared viewers. The current
experience does not distinguish between what different audiences need to see.

---

## 3. Users

| Role | User | Primary need |
|---|---|---|
| Primary | Solo product designer | Run sessions, review insights, drive Design Ops decisions daily |
| Secondary | Product manager | Review findings and confidence level to inform roadmap decisions |
| Third | Engineering | Consume Design Ops outputs — clear next actions, handoff state, no process noise |

> The shared view must serve all three secondary audiences from a single filtered render.
> PM reads for recommendation and confidence. Engineering reads for next steps and handoff
> state. Neither should see internal labels, run-level data, or process keys.

---

## 4. Goals

- Make the core workflow easy to scan and move through quickly
- Keep session context, insights, and Design Ops status visible without requiring navigation
- Separate shared results from private working views
- Surface human-readable labels and clear state summaries instead of raw system keys
- Reduce cognitive load while preserving the full power of the underlying tool

---

## 5. Core Use Cases

- Create or switch a session objective and run an analysis
- Review insights and results from a completed session
- Share a clean results view with stakeholders (PM, engineering)
- Reopen previous sessions or archived runs for comparison
- Access the full private working view when needed

---

## 6. Information Architecture

Carrier is a four-area product. All areas load into a single desktop surface —
no multi-page navigation.

| Area | Audience | Notes |
|---|---|---|
| Rail | Designer only | Always visible. Session context, spine nav, history. |
| Session / Results | Designer only | Private by default. Summary strip always rendered. Insights and Design Ops below. |
| Shared view | PM + Engineering | Filtered layer, not a separate route. Toggled in the topbar. |
| History | Designer only | Loads into the main pane from the rail. No separate page. |

**IA decisions:**

Results and Insights are one surface, not two. Splitting them would create a navigation
decision after every run. If cross-session aggregation becomes a future need, Results
can be promoted at that point.

The shared view is a filtered render of the same component. It must never become a
separate route — two surfaces in sync is a maintenance problem and a content drift risk.

The shared view serves PM and engineering from the same render. If their needs diverge
significantly in future, revisit as a role-filtered view — not a separate surface.

---

## 7. Product Principles

| Principle | What it means in practice |
|---|---|
| One workspace | Not many routes. The designer never leaves the surface. |
| Summary-first | Default to scannable. Expand on demand. |
| Private by default | Process details, run data, and internal keys are hidden from shared views. |
| Readable labels | No raw system keys. No wizard-style flows. Plain language everywhere. |
| State always visible | Empty / loading / running / complete — each state is explicit and distinct. |

---

## 8. Experience Requirements

### 8.1 Session flow

The primary spine follows the mental model: Objective → Run Analysis → Results.
This sequence must be preserved as the main axis of the workspace.

- The workspace opens to the active or incomplete step, not always to Objective
- Completing analysis surfaces a prompt to view Results — it does not auto-advance
- Previous steps remain accessible and re-openable from the spine nav

### 8.2 Results

The Results surface has two layers rendered from the same component:

| Layer | Content |
|---|---|
| Private (default) | Full working view — all run data, process notes, internal detail, confidence sources |
| Shared (toggled) | Summary strip + top insights + next steps only. No run-level data, no internal labels. |

The summary strip is always rendered at the top of the Results view, in both layers.
It must answer: what did we find, how confident are we, and what do we do next —
in under 10 seconds.

**Summary strip fields and audience mapping:**

| Field | PM reads for | Engineering reads for |
|---|---|---|
| Confidence level | Roadmap weighting | Signal on research quality |
| Participant count | Research scale | Research scale |
| Insight count | Scope | Scope |
| Recommendation | Decision input | Scope direction |
| Next steps | Planning context | Handoff state — what to act on |

### 8.3 Insight cards

Insights render as typed cards. Type is signalled by a colour tag before the text —
readable before the content is processed.

| Type | Colour | Meaning |
|---|---|---|
| Risk | Red | Something observed that could cause harm, friction, or failure |
| Opportunity | Green | Something observed that could be improved or built on |
| Pattern | Teal | Something that recurred across sessions or participants |

- Cards are collapsed by default. Supporting detail expands on demand.
- Each card shows type tag, insight text, and source reference in collapsed state.
- Cards are visible in the shared view. Supporting detail is not.

### 8.4 States

Every state transition must be explicit. No blank screens. No ambiguous spinners.

| State | Requirement |
|---|---|
| Empty | Explain why there is no content and surface the next action |
| Loading | Show progress with context, not a bare spinner |
| Running | Indicate analysis is in progress with estimated state |
| Complete | Surface results immediately without requiring expansion |
| Error | Plain language explanation + recovery path |

---

## 9. Design Ops

### 9.1 Status model

Four states only. Used consistently across all modules and the session spine.
No variants. No custom labels per module.

| State | Label | Indicator |
|---|---|---|
| Not started | Not started | Gray dot |
| In progress | In progress | Amber dot |
| Complete | Complete | Green dot |
| Blocked | Blocked | Red dot |

### 9.2 Requirements

**Hierarchy and scannability**
- Each module must display name, status indicator, and next action (or completion date
  if done) in its collapsed state — no expansion required
- Status must be distinguishable by colour indicator alone, independent of the text label
- A user must be able to identify which module requires attention within 5 seconds,
  without scrolling

**Navigation**
- Modules are not a forced linear sequence — any module may be opened directly
- Completing one module does not auto-advance to the next

**State persistence**
- Completed modules remain visible in the list with their completion date
- They do not collapse into a summary or disappear from view after completion

**Blocked state**
- A blocked module must display a reason (one line, plain language) in collapsed state
  alongside the red indicator
- Blocked does not prevent access — the module remains openable

### 9.3 Acceptance criteria

- [ ] All four states render with correct indicator colour and label in collapsed view
- [ ] Collapsed module rows display: indicator + name + next action or completion date
- [ ] No module state uses an internal key or system label as its display text
- [ ] Any module can be opened regardless of sequence position
- [ ] Completed modules retain their completion date after session reload
- [ ] Blocked modules display a plain-language reason in collapsed state
- [ ] 5-second scan test: a first-time user can identify the in-progress module without
      instruction (hallway test, ≥3/5 pass rate)

---

## 10. UI Patterns

| Pattern | Application |
|---|---|
| Spine nav with live state | Left rail shows session progress as an ordered list. Each step shows name, state label, and status pill. Active step is marked with a left accent bar. |
| Summary strip | Confidence, participants, insight count, recommendation, and next steps — always rendered above the fold. No expansion required. |
| View toggle | Segmented control in the topbar switches between private and shared layers. Same component, filtered output. |
| Typed insight cards | Risk / Opportunity / Pattern tags use semantic colour. Pre-attentive: audience reads the room before reading the text. |
| Accordion module hierarchy | Design Ops shows status dot + name + next action in collapsed state. Expands inline. No wizard, no forced sequence. |
| History rail | Previous sessions below the active workflow in the rail. Accessible, not competing. Loads into main pane. |

---

## 11. Success Criteria

| Criterion | How to test |
|---|---|
| Designer understands session state without expanding anything | Observation — hallway test |
| PM can read recommendation and confidence in under 10 seconds | Timed task in shared view |
| Engineering can identify next steps and handoff state without explanation | Observation — no-instruction test |
| Shared view exposes no internal labels, run data, or process keys | Content audit at handoff |
| Designer reaches full private view in ≤2 clicks | Task analysis |
| In-progress Design Ops module identifiable in ≤5 seconds | Hallway test, ≥3/5 pass rate |

---

## 12. Open Questions

| Question | Recommended direction |
|---|---|
| Should the page open to the active/incomplete step or always to Objective? | Open to the active/incomplete step. Orient to where the user is, not where they started. |
| Should completion automatically open Results? | Prompt, do not auto-advance. Preserve intentional navigation. |
| Formal spec with acceptance criteria or keep as product brief? | Promote to formal spec. The Design Ops section already has testable criteria — apply the same standard to the rest. |
| How does the shared view handle PM vs engineering differences in need? | Single shared view for now. If needs diverge significantly, revisit as a role-filtered view — not a separate surface. |

---

## Appendix: What this product is not

- A multi-user collaboration tool
- A reporting dashboard
- A project management system
- A multi-page application
