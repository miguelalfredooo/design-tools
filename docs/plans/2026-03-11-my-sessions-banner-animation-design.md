# My Sessions Banner Animation Design

Use the existing `My Sessions` feed structure and introduce a compact animated banner strip inside each session card rather than replacing the card layout.

## Decision

Apply the banner treatment to each card in the `My Sessions` tab only.

## Why

- keeps the current session information hierarchy intact
- reuses the banner motion language already explored in `app/preview/animations`
- adds energy without turning the list into a distracting motion surface

## Interaction Model

- each session card gets a small banner strip under the description or metadata row
- the banner animation plays once when the card enters
- hover can replay or intensify the effect slightly, but nothing should loop forever
- `All Sessions` stays unchanged for now

## Motion Direction

- prefer a softened shimmer or border-draw treatment
- avoid large glow pulses on every card at once
- keep the motion lightweight enough that multiple cards on screen still feel calm

## Scope

- update the `My Sessions` card rendering path
- create a small reusable banner-strip component if needed
- keep this as a presentation-only enhancement; no data model changes
