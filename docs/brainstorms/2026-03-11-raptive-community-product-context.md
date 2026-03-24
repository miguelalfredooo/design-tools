---
date: 2026-03-11
topic: raptive-community-product-context
---

# Raptive Community — Product Context

**Audience:** Cross-functional teams (PM, Eng, Design) and AI agents  
**Purpose:** Shared understanding of what the Raptive Community is, who it serves, and how it's structured  
**Status:** Living document — update as the product evolves

## What Is Raptive?

Raptive is a creator monetization platform that helps independent publishers and content creators grow sustainable businesses through ad management, audience development, and business tools. Their creator base spans bloggers, writers, food creators, lifestyle publishers, and niche media operators — people who run content businesses independently.

## What Is the Raptive Community?

The Raptive Community is a peer-to-peer network embedded within the Raptive platform where creators connect, share knowledge, and support each other's growth. It is not a generic forum — it is a branded, structured space designed to reduce isolation for independent creators and create value that goes beyond ad revenue.

**Core purpose:** Give creators a place to learn from peers, stay motivated, get Raptive-specific guidance, and feel part of something bigger than their solo operation.

**Brand signal:** Community uses orange (`#F97316` / `orange.500`) as its primary link and interaction color, distinct from Raptive's primary blue. This is a deliberate visual identity separation — Community has its own tone.

## Primary Users

**Creator / Publisher** — The primary member. Runs an independent content site. Motivated by growth, income stability, and connection with peers who understand the creator business.

**Raptive Staff / Moderators** — Seed content, manage challenges, surface insights, and ensure quality. Sometimes post as "Raptive" officially.

**AI Agents (emerging)** — The Community Brief AI and Community Answers are AI-assisted surfaces that interact with creators directly. Context in this doc is intended to inform those agents.

## Surface Areas

### 1. Home Feed

The personalized entry point. Surfaces recent activity, recommended posts, challenges in progress, and community updates. Aggregates content from communities a creator has joined. Acts as the creator's daily pulse on the network.

### 2. Cross-Community Feed

A broader view across all communities — not just ones a creator belongs to. Useful for discovery, trending conversations, and exploring adjacent niches. Encourages creators to expand their network beyond their immediate category.

### 3. Single Community Feed

A focused view within one specific community (e.g., Food Creators, Parenting Bloggers, Finance Writers). Contains posts, discussions, pinned resources, and member activity scoped to that group. This is where most deep engagement happens.

**Community types may include:**
- Niche/vertical communities (by content category)
- Topic communities (e.g., SEO, email growth, ad strategy)
- Program communities (e.g., cohorts, beta testers)

### 4. Challenges

Time-bound, goal-oriented activities that prompt creators to take action — publish a post, hit a traffic milestone, try a new strategy. Challenges create motivation loops, surface peer accountability, and generate engagement spikes. They are a key retention and activation mechanic.

### 5. Badges

Recognition system tied to participation, milestones, and challenge completion. Badges are visible on member profiles and signal credibility within the community. They gamify engagement and reward consistent contributors.

### 6. Community Brief AI

An AI-powered feature that summarizes what's happening in a community — trending topics, recent highlights, key conversations. Reduces the cognitive load of keeping up with active communities. Helps creators stay informed without reading every post.

### 7. Community Answers

An AI-assisted Q&A surface. Creators ask questions and receive synthesized answers drawn from community knowledge, Raptive documentation, and peer posts. The goal is to surface the right answer faster than waiting for a reply thread.

## Design Principles for Community

These should guide every design and content decision in this product area:

- **Peer trust over authority** — Content feels creator-to-creator, not brand lecturing down.
- **Progress over perfection** — Challenges and badges reward showing up, not just winning.
- **Reduce creator isolation** — The experience should make creators feel seen and supported.
- **AI as assistant, not replacement** — AI Brief and Answers surface knowledge; they don't replace human connection.
- **Signal without noise** — Feeds, briefs, and answers should be scannable. Creator time is scarce.

## Brand & Visual Identity Notes

| Token | Value | Usage |
|---|---|---|
| `link-community-primary` | `orange.500` | Community links, CTAs |
| `font-family` | DM Sans | All community typography |
| `text-color.primary` | `neutral.1000` | Body text |
| `text-color.secondary` | `neutral.700` | Supporting text |
| `text-color.tertiary` | `neutral.500` | Metadata, timestamps |

Community orange distinguishes this product from core Raptive (blue). Maintain this separation across any new community surfaces.

## Open Questions / TBD

- How do communities get created — user-generated or Raptive-curated only?
- What is the moderation model at scale?
- How does Community Answers source and rank its knowledge base?
- Are challenges creator-created or exclusively Raptive-created?
- What are the notification/email surfaces tied to community activity?

## How Agents Should Use This

- Atlas should frame recommendations in terms of creator value, community health, and business growth.
- Beacon should distinguish between signals from peer behavior, staff-led programs, and AI-assisted surfaces.
- Both agents should preserve the product's design principles:
  - peer trust over authority
  - progress over perfection
  - reduce creator isolation
  - AI as assistant, not replacement
  - signal without noise
- Any recommendation affecting Community surfaces should respect the product's separate orange-forward brand identity rather than collapsing back into core Raptive visual language.

*Last updated: March 2026*
