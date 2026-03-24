# Session Tabs Plan

## Goal

Restructure the session detail page into three tabs so framing, design work, and research are easier to scan:

- `PRD / Brief`
- `Design Plan`
- `Research`

`Design Plan` is the default selected tab.

## Implementation

1. Add a file-contract test for the tab labels and default tab state.
2. Wrap the session detail content in the shared `Tabs` UI primitive.
3. Move the current page content into the approved groups:
   - `PRD / Brief`: brief + evidence status
   - `Design Plan`: participant controls, voting progress, results, instructions, option grid
   - `Research`: session insights + synthesize state
4. Keep the existing actions, voting behavior, and creator controls unchanged.

## Verification

- `node --test test/session-page-tabs.test.mjs`
- `npx eslint app/explorations/[id]/page.tsx test/session-page-tabs.test.mjs`
