# Design Principles

## 1. Noticing
*A foundational skill necessary to develop an eye for details.*

The ability to see what others skip past — misaligned spacing, inconsistent tone, an interaction that feels slightly off. Noticing is trained, not innate. It's the discipline of slowing down during review, study, and use. Great designers are students of everything: typography in wayfinding, motion in nature, emotional response in music. In product work, noticing is what catches the gap between intent and execution.

---

## 2. Conceptual Range
*Exploring a wide range of disparate solutions before committing.*

Resist the first good idea. Range means generating concepts that are genuinely different — not variations on the same mental model. In visual design, this means exploring dark and light, dense and sparse, literal and abstract, in the same brief. In product design, it means challenging the assumed interaction paradigm entirely. Range protects against premature convergence and makes your eventual choice defensible.

---

## 3. Conceptual Depth
*Refining a solution through intentional iteration.*

Once direction is chosen, depth is the commitment to make it as good as it can be. Not polishing for polish's sake — but interrogating each decision: Does this type pairing reinforce the tone? Does this spacing create the right rhythm? Does this flow match the user's mental model? Depth is what separates work that's resolved from work that's merely finished.

---

## 4. Live Tuning
*Creating an immediate connection to what you are creating.*

Designing with real content, real data, real constraints — not Lorem Ipsum. It means testing motion in context, viewing type at actual viewport sizes, and feeling the interaction rather than inferring it from static specs. Live tuning collapses the gap between design intent and lived experience. In product work, it means being in the product constantly, not just during design reviews.

---

## 5. Uncommon Care
*Pushing beyond to make people feel something.*

The difference between adequate and memorable. It's the micro-interaction nobody asked for that makes a user smile. The empty state that feels human. The error message that doesn't feel like a wall. Uncommon care requires asking: what would delight someone here? — and then doing it even when no one mandated it. It's a stance, not a feature.

---

## 6. Separation of Concerns
*Focusing attention on resolving discrete concerns.*

Don't try to solve layout, hierarchy, color, and motion simultaneously. Isolate the problem you're solving at each stage. In visual explorations, this might mean working in grayscale first to resolve hierarchy before introducing color. In product design, it means decoupling UX flow from visual execution, and interaction from business logic. Clarity of focus produces clarity of outcome.

---

## 7. Facets of Quality
*Defining and improving the attributes that matter most to you.*

Quality isn't monolithic — it has dimensions: clarity, craft, responsiveness, accessibility, emotional resonance, systemic consistency. Name yours. When you define the facets that matter for a specific product or project, you create an evaluation framework that's specific enough to act on. Vague quality goals produce vague results.

---

## 8. Less, but Better
*A discipline of minimalism.*

From Dieter Rams. The instinct to add is always stronger than the instinct to remove. Every element should earn its place. In visual design: fewer typefaces, tighter color systems, deliberate whitespace. In product: fewer features shipped better, rather than more shipped mediocrely. Restraint requires conviction — it's harder to simplify than to accumulate.

---

## 9. Recreate Everything
*A way of rapidly learning and growing your skillset.*

Reproduction is deep study. Rebuilding a UI you admire forces you to understand every decision that produced it — the grid, the spacing scale, the type hierarchy, the component logic. You can't fake your way through recreation. Apply this to visual design (redraw layouts), product design (rebuild flows from scratch), and writing (retype great copy to feel its rhythm). It compounds fast.

---

## 10. Industry Standards
*Understanding the invisible bar that users expect.*

Users arrive pre-trained. Every app they've used has deposited expectations — about where navigation lives, how gestures behave, what a tap target feels like, what "disabled" looks like. Violating these expectations has a cost that must be paid for with clarity or delight. Knowing the standards lets you make a conscious choice: conform, extend, or deliberately subvert.

### Apple Human Interface Guidelines
The HIG defines quality on iOS/macOS as **clarity, deference, and depth**. Key patterns to internalize:

- **Navigation:** Tab bars for top-level destinations, navigation stacks for hierarchy, sheets for contextual tasks. Never invent a new paradigm without reason.
- **Touch targets:** Minimum 44×44pt. Non-negotiable.
- **SF Symbols + Dynamic Type:** System coherence comes from using the system's own visual language. Fighting it signals poor craft.
- **Gestures:** Swipe to go back, swipe to dismiss sheets, long-press for context menus. These are muscle memory — override them at your peril.
- **Safe areas and adaptivity:** Layouts must respect notches, home indicators, and dynamic type scaling. Ignoring these is a craft failure.

### Google Material Design
Material's contribution is a **systematic interaction language** — every motion, elevation, and state has a rationale:

- **Motion as communication:** Transitions should explain spatial relationships. A modal slides up because it's on a layer above. Drilling into a card expands from the card itself. Motion answers *where did that come from?*
- **States:** Every interactive element must communicate its state — enabled, hovered, focused, pressed, dragged, disabled. Material's state layer system (overlays at defined opacities) provides a consistent grammar.
- **Elevation and shadow:** Z-axis position communicates hierarchy and interactivity. Floating action buttons sit high; bottom sheets sit above content. Don't fake depth without semantic meaning.
- **Color roles:** Material 3's color system (primary, secondary, tertiary, surface, error) isn't aesthetic — it's functional. Using color arbitrarily breaks the communication system.
- **Responsive layout grid:** 4pt base unit, 12-column grid, defined margin/gutter breakpoints. Deviation requires justification.

### The meta-skill
Fluency with both systems reveals a pattern: constraints exist to serve users, not designers. When you know *why* a convention exists — the biomechanics of a thumb reach zone, the cognitive load of an unfamiliar gesture — you can judge when breaking it is worth it. Most of the time, it isn't.
