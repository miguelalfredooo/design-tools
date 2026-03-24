# Shared Session Tiles Design

Use the same modular tile component for both `My Sessions` and `All Sessions`.

## Decision

Replace the current split architecture:

- `My Sessions` feed with embedded options
- `All Sessions` feed with embedded options

with a shared session tile grid for both tabs.

## Why

- the current feed layout makes the banner work fragile
- the two tabs drift when they should share structure
- session-level browsing is clearer when each session is one tile, not one heading plus nested option cards

## Component Model

- `SessionCard` becomes the primary modular session tile
- `SessionCardBanner` is folded into or composed inside `SessionCard`
- `app/page.tsx` only decides:
  - which sessions to show
  - which empty-state copy to use
  - whether ownership actions like delete should appear

## Scope

- convert both tabs to the same grid/tile renderer
- remove option feed rendering from the sessions index page
- keep option-level exploration inside the session detail routes
