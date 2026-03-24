# PRD: Sessions, Insights & Design Ops

**Date:** 2026-03-17  
**Scope:** carrier — sessions, insights, and Design Ops flows only  
**Status:** Draft

---

## Product

Carrier is a private, desktop-only product-design workspace for running research sessions, synthesizing insights, and reviewing Design Ops outputs in one place.

---

## Problem

The current experience is powerful but too dense. Session setup, insights, and Design Ops outputs all live in the same workspace, but the information hierarchy is weak, the flow is hard to scan, and the results layer exposes too much internal process detail to shared viewers.

---

## Goals

- Make the core workflow easy to scan and move through quickly.
- Keep session context, insights, and Design Ops status visible without making users navigate around.
- Separate shared results from private working views.
- Surface human-readable labels and clear state summaries instead of raw system keys.
- Reduce cognitive load while preserving the full power of the underlying tool.

---

## Primary Users

- **Primary:** A solo product designer using the tool daily to run sessions, review insights, and drive Design Ops decisions.
- **Secondary:** Stakeholders who view shared results and need the recommendation, findings, confidence, and next steps without internal process noise.

---

## Core Use Cases

- Create or switch a session objective and run an analysis.
- Review insights and results from a completed session.
- Share a clean results view with stakeholders.
- Reopen previous sessions or archived runs for comparison.
- Inspect the full private working view when needed.

---

## Product Principles

- One workspace, not many routes.
- Default to scannable summaries.
- Keep private process details private by default.
- Prefer readable labels over internal keys.
- Make the current state obvious at a glance.

---

## Key Experience Requirements

- The session flow should preserve the Objective → Run Analysis → Results mental model.
- The Results experience should support a shared summary view and a private working view.
- Design Ops should present its modules with clear hierarchy and status, not as a flat wizard.
- Previous sessions/runs/archives should remain available but secondary to the active workflow.
- Empty, loading, running, and completed states should each be explicit.

---

## Success Criteria

- Users can understand the current state of a session without expanding everything.
- Shared viewers only see the distilled results layer.
- Designers can still access the full private working view when needed.
- Internal labels and process details are not exposed in the shared experience.
- The workspace feels faster to read and easier to navigate in daily use.

---

## Open Questions

- Should the page always open to the active/incomplete module, or default to Objective?
- Should completion automatically open Results?
- Formal spec with requirements and acceptance criteria, or keep as product brief?
