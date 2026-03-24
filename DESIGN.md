# DESIGN.md — Carrier Design Direction

Full design specification for the Carrier workspace. Reference this when building
components, making layout decisions, or resolving visual ambiguity.

---

## Aesthetic direction

Flat. Clean. High-information density without clutter. Every element earns its place.

- No gradients, no shadows, no decorative effects
- 0.5px borders throughout
- Generous whitespace between sections, tight within components
- Status is always communicated by colour + label (never colour alone)
- Typography: two weights only — regular and medium (500). Nothing heavier.

---

## Layout: two-pane with spine rail

```
┌─────────────────────────────────────────────────┐
│  Rail (220px fixed)  │  Main pane (flex)         │
│                      │                           │
│  Session context     │  Topbar                   │
│  ─────────────────   │  ─────────────────────    │
│  Spine nav           │  Summary strip            │
│    · Objective ✓     │  ─────────────────────    │
│    · Analysis ✓      │  Insight cards            │
│  → · Results         │  ─────────────────────    │
│    · Design Ops      │  Design Ops modules       │
│  ─────────────────   │                           │
│  History             │                           │
│    Prior sessions    │                           │
└─────────────────────────────────────────────────┘
```

- Rail is always visible. It never collapses or hides.
- Main pane swaps content as the user moves through the workflow.
- The active spine step is marked with a left accent bar (2.5px, primary color).
- History sits below the spine in the rail, separated by a border.

---

## Topbar

Two elements only:

- **Left:** View toggle — `Private view` / `Shared view` (segmented control)
- **Right:** `Copy share link` button

The active view badge is filled (primary text on primary background).
The inactive badge is outlined only.

---

## Summary strip

Always rendered at the top of the Results view, in both private and shared layers.
Four metric cards in a grid. No expansion required.

| Field | Notes |
|---|---|
| Confidence | High / Medium / Low — colour coded |
| Participants | Integer |
| Insights | Count |
| Recommendation | Short text — 3–6 words max |
| Next steps | Short text — visible in shared view |

Card anatomy: muted label (11px) above, value (16px/500) below.
Background: `--color-background-secondary`. No border. Radius: md.

---

## Spine nav

Ordered list in the rail. Each step:

```
[dot] Step name          [pill]
      State label
```

- **Dot states:** ✓ filled (done), filled dark (active), outlined (idle)
- **Pill states:** `done` (green), `in progress` (amber), none (idle/not started)
- Idle steps are visible but muted (tertiary text color)
- Active step has a left accent bar
- Steps are separated by a 1px connector line

---

## Insight cards

Collapsed (default):
```
[TAG]  Insight text — one or two lines
       Source reference · session ref
```

Expanded:
```
[TAG]  Insight text
       Supporting quotes
       Confidence detail
       Session + run references
```

Tag anatomy: 10px/500, pill shape, semantic background + text color.
Cards are visible in both private and shared views.
Supporting detail (expanded content) is private view only.

---

## Design Ops module list

Accordion pattern. Each row in collapsed state:

```
[●] Module name                    ›
    Next action or completion date
```

- Status dot: 7px circle, semantic color
- Module name: 13px primary
- Next action / date: 11px tertiary
- Chevron: right-aligned, tertiary
- Hover: background shifts to secondary
- No forced sequence — any row is openable
- Blocked rows show reason text below the module name in collapsed state

---

## Color system

### Status / semantic (use CSS variables)

| Semantic | Use |
|---|---|
| `--color-background-success` / `--color-text-success` | Complete state |
| `--color-background-warning` / `--color-text-warning` | In progress state |
| `--color-background-danger` / `--color-text-danger` | Blocked / Risk |
| `--color-background-info` / `--color-text-info` | Informational |

### Categorical (use hex — these are fixed)

| Name | Hex (light bg) | Hex (text) | Use |
|---|---|---|---|
| Gray | `#F1EFE8` | `#888780` | Not started, neutral, structural |
| Amber | `#FAEEDA` | `#854F0B` | In progress |
| Green | `#EAF3DE` | `#3B6D11` | Complete, Opportunity insight |
| Red | `#FCEBEB` | `#A32D2D` | Blocked, Risk insight |
| Teal | `#E1F5EE` | `#0F6E56` | Pattern insight |
| Purple | `#EEEDFE` | `#534AB7` | Private / designer-only surfaces |

---

## Typography scale

| Role | Size | Weight | Color |
|---|---|---|---|
| Section label | 10px | 500 | tertiary |
| Tag / badge | 10–11px | 500 | semantic |
| Meta / source | 11px | 400 | tertiary |
| Card label | 11px | 400 | tertiary |
| Secondary text | 12px | 400 | secondary |
| Body / list | 13px | 400 | primary |
| Card value | 16px | 500 | primary |

Two weights only: 400 and 500. Never 600 or 700.

---

## Spacing

- Component internal gaps: 8px, 12px, 16px
- Section gaps: 1rem, 1.5rem, 2rem
- Rail padding: 16px horizontal
- Main pane padding: 20px
- Card padding: 10px 12px (metric), 12px 14px (insight/module)
- Border radius: md (8px) for most, lg (12px) for cards

---

## Border conventions

- Default: `0.5px solid var(--color-border-tertiary)`
- Hover / emphasis: `0.5px solid var(--color-border-secondary)`
- Active accent bar: `2.5px solid var(--color-text-primary)` (left side only, no radius)
- Featured item: `2px solid var(--color-border-info)` (the only 2px exception)

---

## UI patterns

### 1. Spine navigation with live state
Left rail shows session progress as an ordered list with status pills.
Context is always visible — no tab switching required.

### 2. Summary strip
Key metrics always above the fold. No expansion required to read them.
The test: can the user answer "what did we find and how confident are we?" in under 10 seconds?

### 3. View toggle (private / shared)
Segmented control in the topbar. Same component, filtered output.
Never two routes. Never two pages to keep in sync.

### 4. Typed insight cards
Risk / Opportunity / Pattern tags use traffic-light color logic.
Pre-attentive: audience scans type before reading content.

### 5. Accordion module hierarchy
Status dot + name + next action visible in collapsed state.
Expands inline. No wizard. No forced sequence.

### 6. History rail
Previous sessions below active workflow. Accessible, not competing.
Loads into main pane — no navigation away from the surface.

---

## Shared view spec

Single filtered render. Toggle in topbar. Never a separate route.

**Visible:**
- Summary strip (all fields)
- Top insight cards (tag + text only)
- Next steps

**Hidden:**
- Run-level data
- Internal keys or system labels
- Process notes
- Supporting detail on insight cards
- Design Ops module detail

**Audience mapping:**

| Field | PM reads for | Eng reads for |
|---|---|---|
| Confidence | Roadmap weighting | Signal on research quality |
| Recommendation | Decision input | Scope direction |
| Next steps | Planning context | Handoff state — what to act on |
| Insight cards | Problem framing | Constraint awareness |

---

## What this product is not

- A multi-user collaboration tool
- A reporting dashboard
- A project management system
- A multi-page application

---

## Empty and error states

Every state is a design moment, not a gap.

- **Empty:** Tell the user why it's empty. Surface the next action. Never a blank screen.
- **Loading:** Show progress with context. Never a bare spinner.
- **Running:** Indicate analysis in progress. Show estimated state if possible.
- **Complete:** Surface results immediately. No expansion required.
- **Error:** Plain language. What happened. What to do next.
