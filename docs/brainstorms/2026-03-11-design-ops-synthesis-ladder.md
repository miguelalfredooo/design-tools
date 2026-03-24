---
date: 2026-03-11
topic: design-ops-synthesis-ladder
---

# Design Ops Synthesis Ladder

## What We're Building

Design Ops should not force every run into the same heavy synthesis mode. The product needs a synthesis ladder that starts with fast signal and expands into richer reasoning only when needed. Every run should still produce a recommendation, but the agents should also surface confidence, assumptions, and the next best missing signals.

## Why This Approach

The current single-depth run makes the product feel slow and overcommitted. A laddered model preserves momentum:

- `Quick read` for fast orientation
- `Decision memo` for standard review
- `Deep dive` for strategic analysis

The shared principle across all three modes is the same: make progress with imperfect information, but never hide uncertainty.

## Recommended Output Contract

Every synthesis should return:

- `SUBJECT`
- `CONFIDENCE`
- `READINESS`
- `RECOMMENDATION`
- `ASSUMPTIONS`
- `FINDINGS`
- `OBJECTIVE MAPPING`
- `ADDITIONAL SIGNALS WORTH GATHERING`
- `NEXT STEPS`

## Readiness Principle

`Readiness` is not a blocker. It is a framing signal.

- `sufficient`: evidence is strong enough to act with reasonable confidence
- `partial`: enough signal exists to make a directional recommendation, but important gaps remain
- `weak`: the synthesis can still outline a path, but confidence is constrained by missing or mismatched evidence

## Additional Signals Principle

Agents should not say “need more data” in the abstract. They should name the next 1–3 signals that would most improve confidence, why each matters, and where they likely come from.

Good examples:

- retention cohort by segment
- feed engagement by lifecycle cohort
- onboarding completion by selected interest

## Key Decisions

- Keep the first answer useful even when evidence is thin
- Standardize `readiness` and `additional signals` in every synthesis
- Treat missing data as a visible input to decision quality, not a hidden failure mode

## Next Steps

- Add synthesis mode selection to Design Ops UI
- Preserve mode and readiness in archived findings
- Consider progressive expansion from `Quick read` into `Decision memo` and `Deep dive`
