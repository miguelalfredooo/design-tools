# Raptive Community — Product Context for Design Tool

## What Is Raptive Community?

**Raptive Community** is a white-label, enterprise community platform built on top of Discourse (open-source forum software). It's used by Raptive — a creator and publisher monetization company — to power branded online communities for media publishers and content creators.

The platform transforms standard forum software into a **gamified, personalized, analytics-driven engagement engine** that helps publishers grow and retain loyal audiences.

---

## Target Users

| User Type | Who They Are |
|---|---|
| **Community Members** | Readers/fans of publisher brands who join to discuss content, connect with others, and participate in community activities |
| **Community Managers** | Brand-side moderators and admins managing their community |
| **Raptive Admins** | Internal team managing platform-wide settings, experimentation, and infrastructure |

---

## Core Product Pillars

### 1. Multi-Community Architecture
Each community is a **subdomain-based, branded space** with its own identity, categories, member groups, and settings. Communities can be independently configured but share the underlying platform.

- Community discovery cards
- Favorited/bookmarked communities
- Per-community onboarding (welcome topics, registration wizard)
- Category-based content organization

### 2. User Engagement & Gamification
The platform drives retention through a **points and achievement system** layered over standard discussion activity.

- **Scoring system** — Users earn points for actions (posting, replying, liking, etc.)
- **Leaderboards** — Community rankings by score
- **Engagement streaks** — Consecutive-day visit/activity tracking
- **Reactions** — Emoji-style responses to posts (beyond simple likes)
- **Social proof signals** — Trending/popular content surfacing
- **Question of the Day (QotD)** — Daily engagement prompts to drive participation

### 3. Personalized Content Discovery
The feed is **interest-driven and AI-assisted**, not a flat chronological list.

- **Interest selection** — Users pick topics they care about during onboarding
- **Composable feed** — Admin-configurable feed layout (with a visual editor and preview system)
- **AI content recommendations** — Powered by semantic embeddings (discourse-ai)
- **Following** — Users follow other members; following generates a personalized feed
- **Semantic search** — Embedding-based search across content

### 4. User Registration & Onboarding
A **multi-step registration wizard** tailors the onboarding experience to the community context.

- Community-specific welcome flows
- Interest selection step
- Multi-provider OAuth (Apple, Facebook, Twitter/X, GitHub)
- Custom login page
- Cross-subdomain session management (SSO-like behavior across communities)

### 5. Notifications & Retention
A layered notification system designed to **pull users back** without causing fatigue.

- In-app notification badges
- Email digests (trending posts, new members, streak reminders)
- Cooldown windows to prevent over-messaging
- **Braze** integration for marketing-grade email campaigns
- Push notifications (mobile)

### 6. AI-Powered Features
LLM capabilities are embedded throughout the product.

- **Reply prompts** — AI-suggested replies to encourage participation
- **Community briefs** — AI-generated community summaries
- **Highlighted posts** — AI surfaces notable content
- **NSFW detection** — AI moderation on profile content
- **Translation & summarization** — Via discourse-ai

### 7. Analytics & Experimentation
A full instrumentation layer tracks every meaningful user action.

- **Custom event registry** — Every tracked event has a formal schema (name, source, category, payload)
- **Session tracking** — Impression and engagement session management
- **A/B testing framework** — Cookie-based variant assignment for experiments
- **Mixpanel** integration for product analytics
- **Sentry** for error monitoring

### 8. Monetization
Ad integration supports publisher revenue streams.

- Ad placement and management
- Publisher-friendly ad tech compatibility

---

## Feature Flag Pattern

Features are rolled out via **site settings** using the pattern `raptive_ff_*`. This means:
- Features can be toggled per-community or globally
- New features default to `off` until enabled
- Design must account for **enabled/disabled states** of features

Key toggleable features: communities, feed, registration wizard, scoring, content discovery, interests, AI features, chat, mobile install banner, ads.

---

## Tech Stack (Design-Relevant)

| Layer | Technology |
|---|---|
| Framework | Discourse (Rails + Ember.js) |
| Frontend templating | Handlebars / GJS components |
| Styling | SCSS (utility + component classes) |
| Mobile | Responsive web + mobile app (PWA-style) |
| Real-time | MessageBus (live presence, notifications) |
| Chat | Native Discourse chat (enhanced) |

---

## Design Guardrails

### 1. Discourse Foundation
The product is built **on top of Discourse** — not from scratch. Core Discourse UI patterns (topic lists, post streams, user cards, composer, admin panels) must be respected or extended, not replaced. Design should work **with** the Discourse component model.

### 2. Plugin Isolation
Each feature lives in its own plugin. **Design changes are scoped** — a new UI for scoring doesn't touch the feed plugin. Designs should be modular and not assume cross-feature layout control.

### 3. Feature Flag Awareness
Every non-core feature can be disabled. Design must handle **graceful degradation** — pages and flows must still work if scoring, AI recommendations, QotD, or other features are turned off.

### 4. Multi-Community Flexibility
Communities have **different branding, categories, and feature configurations**. Design components need to be **brand-neutral and configurable** — avoid hardcoded colors, community-specific copy, or fixed category names.

### 5. Mobile-First Thinking
A significant portion of users access via mobile. The platform has a dedicated mobile plugin with install banners. **All designs must be responsive**, and mobile flows (especially onboarding and registration wizard) must be treated as first-class, not afterthoughts.

### 6. Performance Sensitivity
The platform serves high-traffic publisher audiences. Design should avoid patterns that require heavy client-side computation or large asset loads (e.g., infinite-scroll with no pagination fallback, heavy animations on feed items).

### 7. Engagement-Centric UX
Every major surface area is an opportunity for an engagement hook. Design decisions should consider: *does this surface a notification, streak, score, or social proof signal at the right moment?* These aren't decorative — they're the primary retention mechanism.

### 8. Analytics Integration
Every new user interaction should be **instrumentable**. Design specs should call out what events need to be tracked when introducing new flows or interactions.

### 9. Accessibility & Translatable Strings
All UI strings must be **translatable** (no split strings, no hardcoded English-only copy). Discourse has a built-in i18n system — all copy must go through it.

---

## What This Platform Is NOT

- Not a social network (no direct public profiles in the traditional sense)
- Not a CMS or article publishing tool
- Not a standalone mobile app (web-first, with mobile web optimization)
- Not a single-community product (multi-tenant from the ground up)
- Not a greenfield codebase (built on 10+ years of Discourse history — any design must work within that constraint)
