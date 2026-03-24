# Creator Tools Section Feedback Design

## Overview

Add lightweight stakeholder feedback to creator tools so people can quickly signal what is working, unclear, not useful, or promising without interrupting the review flow.

The feedback model should feel anonymous and lightweight in the UI, while still preserving author identity in the stored data for admins. This keeps participation friction low while preserving accountability and follow-up capability behind the scenes.

## Product Goal

Help stakeholders leave fast, scoped feedback on the creator-tools prototype without requiring full comments or a separate review workflow.

## Recommended Feedback Model

Default interaction:

1. Stakeholder sees a small set of reaction options on a specific card or section.
2. They select one reaction quickly.
3. They may optionally add a short note.
4. The page continues to feel clean and strategic rather than turning into a comment board.

## Feedback Pattern

Each major card or section gets a reusable feedback module:

- Compact reaction row
- Optional `Add note` affordance
- Inline note input
- Aggregate counts visible
- No visible author attribution in the stakeholder-facing UI

## Reactions

Recommended fixed set:

- `Working`
- `Unclear`
- `Not useful`
- `Promising`

These labels are explicit enough to produce directional product signal without requiring interpretation-heavy emoji or generic likes.

## Notes

Notes are optional and short.

Recommended prompt:

`What’s working or not working here?`

Design principles:

- Inline, not modal
- Scoped to the specific card or section
- Hidden or minimally displayed in the prototype UI
- Available to admin for review

## Privacy / Identity Model

### Stakeholder-facing behavior

- Feedback feels anonymous
- Names are not shown beside reactions or notes
- UI emphasizes signal, not authorship

### Admin-facing behavior

Store:

- `voterId`
- `voterName`
- reaction type
- note text
- target id
- target type
- page / route
- timestamp

This allows filtering, review, and follow-up without surfacing identity to all stakeholders.

## Placement Across Creator Tools

### Overview

Add feedback to:

- each finding card
- the primary opportunity block
- supporting conversations block

### Themes

Add feedback to:

- each theme tile

### Audience

Add feedback to:

- each audience segment card

### Threads

Add feedback to:

- each breakout conversation card
- each leading thread card

### Actions

Add feedback to:

- each prioritized action card
- each response opportunity card

## Reusable Component Direction

Build one reusable component:

`SectionFeedback`

Suggested props:

- `targetId`
- `targetType`
- `page`
- `initialCounts`
- `currentSelection`
- `canAddNote`

Suggested responsibilities:

- render reaction chips
- show selected state
- submit/update one reaction
- reveal note composer
- submit note
- remain visually compact

## Data Model Direction

Use a new feedback model rather than overloading design exploration reactions.

Reason:

- current reactions are tied to `sessionId + optionId`
- creator-tools feedback is tied to arbitrary UI sections/cards
- the semantics are different: evaluative feedback, not emotional reaction

Recommended data concepts:

- `feedback_target`
  - page
  - target type
  - target id

- `feedback_reaction`
  - author metadata
  - selected reaction
  - created at / updated at

- `feedback_note`
  - author metadata
  - note body
  - linked target

## UX Principles

- Keep the default action fast
- Do not force comments
- Keep feedback local to the object being reviewed
- Preserve the product’s strategic voice and visual cleanliness
- Avoid making the page feel like a threaded discussion system

## Recommendation

Build section-level reactions plus optional inline notes as the default feedback system for creator tools. Keep feedback visually anonymous, but preserve author metadata for admin review.
