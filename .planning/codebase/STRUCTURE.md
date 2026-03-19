# Codebase Structure

**Analysis Date:** 2026-03-19

## Directory Layout

```
design-tools/
├── app/                          # Next.js App Router pages and API routes
│   ├── layout.tsx               # Root layout with theme + context providers
│   ├── page.tsx                 # Home page (session list with tabs)
│   ├── globals.css              # Global styles + Tailwind directives
│   ├── providers.tsx            # Client providers (theme, context, toasts)
│   ├── favicon.ico              # App icon
│   ├── api/                     # API routes (RESTful endpoints)
│   │   ├── design/              # Core design tool endpoints
│   │   │   ├── sessions/        # Session CRUD and sub-resources
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── votes/   # Vote casting, undo, pinning
│   │   │   │   │   ├── options/ # Add/update/remove options
│   │   │   │   │   ├── comments/ # Spatial comments on images
│   │   │   │   │   ├── reactions/ # Heart reactions
│   │   │   │   │   └── synthesize/ # AI session synthesis
│   │   │   ├── research/        # Research data endpoints
│   │   │   │   ├── observations/ # Log research observations
│   │   │   │   ├── segments/    # Segment observations into clusters
│   │   │   │   ├── synthesize/  # Synthesize to themes/opportunities
│   │   │   │   ├── replay-insights/ # Session-level synthesis
│   │   │   │   └── share-tokens/ # Share research links
│   │   │   ├── notifications/   # WebSocket/polling for real-time updates
│   │   │   ├── upload/          # File upload to storage
│   │   │   └── migrations/      # Admin DB migrations
│   │   ├── figma/               # Figma integration
│   │   │   └── generate/        # Generate design variations
│   │   └── admin/               # Admin endpoints
│   ├── explorations/            # Design exploration sessions
│   │   ├── [id]/               # Single session view
│   │   │   ├── page.tsx        # Voting interface
│   │   │   ├── options/        # Option detail pages
│   │   │   └── preview/        # Preview mode
│   │   └── [id]/options/[optionId]/
│   ├── research/                # Research insights and synthesis
│   │   ├── page.tsx            # Main research hub (5 tabs)
│   │   ├── observe/            # Observation logging UI
│   │   ├── log/                # Research log/journal
│   │   ├── segments/           # Segment view
│   │   └── reference/          # External research reference
│   ├── new/                     # Create new session
│   │   └── page.tsx            # Session creation dialog
│   ├── preview/                 # Preview modes
│   │   ├── [sessionId]/
│   │   └── [sessionId]/options/[optionId]/
│   ├── replays/                 # Session replay/history
│   │   └── [sessionId]/
│   ├── design-ops/              # Design operations automation
│   │   └── page.tsx            # Crew AI runner UI
│   └── seed/                    # Seed data endpoints
│
├── components/                  # Reusable React components
│   ├── design/                 # Design tool specific components
│   │   ├── design-nav.tsx      # Top navigation bar
│   │   ├── design-sidebar.tsx  # Left sidebar (logo, nav, settings)
│   │   ├── create-session-dialog.tsx  # 2-step dialog for new session
│   │   ├── voting-option-card.tsx     # Option card in voting phase
│   │   ├── voting-progress.tsx        # Vote count progress bar
│   │   ├── results-reveal.tsx         # Results display component
│   │   ├── session-brief.tsx          # Design brief summary
│   │   ├── spatial-comment-layer.tsx  # Image annotation UI
│   │   ├── feed-option-post.tsx       # Option summary on homepage
│   │   ├── draft-option-card.tsx      # Option editing interface
│   │   ├── option-form.tsx            # Reusable form for option data
│   │   ├── suggest-option-dialog.tsx  # Voter-suggested options
│   │   ├── synthesize-button.tsx      # Trigger AI synthesis
│   │   ├── session-insights.tsx       # Session-level AI insights
│   │   ├── heart-reaction.tsx         # Heart reaction toggle
│   │   ├── voter-identity-dialog.tsx  # Voter name input gate
│   │   ├── research-client.tsx        # Research hub main component (81KB)
│   │   ├── design-ops-client.tsx      # Design Ops runner UI
│   │   ├── design-ops-crew-runner.tsx # Crew task execution
│   │   ├── design-ops-objectives.tsx  # Objectives display
│   │   ├── design-ops-timeline.tsx    # Timeline of runs
│   │   ├── notification-bell.tsx      # Real-time notifications
│   │   ├── empty-session-state.tsx    # Empty state UI
│   │   └── add-option-dialog.tsx      # Add option to session
│   │
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx          # Button component
│   │   ├── badge.tsx           # Badge/tag component
│   │   ├── separator.tsx       # Visual divider
│   │   ├── sonner.tsx          # Toast notification component
│   │   └── ... (20+ other UI primitives)
│   │
│   └── motion/                 # Motion/animation components
│       ├── ... (animation primitives)
│
├── lib/                         # Utilities, types, API clients
│   ├── design-store.tsx         # React Context for session state (20KB)
│   ├── design-api.ts            # API request functions
│   ├── design-types.ts          # TypeScript types for sessions, votes, comments
│   ├── design-utils.ts          # Utility functions (UUID, colors, shuffle)
│   ├── design-ops-types.ts      # Types for automation/Crew
│   ├── research-types.ts        # Types for research insights
│   ├── research-hub-types.ts    # Extended research types
│   ├── supabase.ts              # Client-side Supabase instance
│   ├── supabase-server.ts       # Server-side Supabase admin client
│   ├── supabase-schema.sql      # DB schema definition
│   ├── ollama.ts                # Local LLM client for synthesis
│   ├── figma.ts                 # Figma API integration
│   ├── motion.ts                # Motion animation helpers
│   ├── notifications.ts         # Notification insertion helper
│   ├── replay-data.ts           # Session replay/history utilities
│   └── utils.ts                 # Misc utils (cn for classname merging)
│
├── hooks/                       # Custom React hooks
│   ├── use-voter-identity.ts    # Get/set voter name and ID
│   ├── use-creator-identity.ts  # Check if current browser is session creator
│   ├── use-admin.ts             # Admin password gate
│   ├── use-session-insights.ts  # Fetch session-level AI insights
│   └── use-mobile.ts            # Detect mobile device
│
├── crew/                        # Python Crew AI framework
│   ├── agents/                  # AI agent definitions
│   ├── tasks/                   # Task definitions for agents
│   ├── tools/                   # Tools available to agents
│   ├── crew.py                  # Crew initialization
│   ├── main.py                  # Main entry point
│   ├── requirements.txt         # Python dependencies
│   └── start.sh                 # Run Crew server
│
├── data/                        # Data files
│   └── objectives.json          # Design operation objectives
│
├── docs/                        # Documentation
│   └── ... (markdown docs, guides)
│
├── explorations/                # (Top-level, for routes)
│   └── ... (might be symlink or for build output)
│
├── public/                      # Static assets
│   ├── favicon.ico
│   └── ... (images, fonts, etc.)
│
├── supabase/                    # Supabase migrations and config
│   └── ... (migration files, supabase.json)
│
├── package.json                 # Node dependencies
├── tsconfig.json                # TypeScript config with @ path alias
├── next.config.ts               # Next.js config (React Compiler enabled)
├── components.json              # shadcn/ui config
├── eslint.config.mjs            # ESLint rules
├── postcss.config.mjs           # PostCSS + Tailwind config
└── .env.local                   # (Not committed) Supabase credentials
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router - pages and API endpoints
- Contains: Page components (TSX), route handlers (route.ts)
- Key files: `layout.tsx` (root layout), `page.tsx` (home), `providers.tsx` (global state)

**components/design/:**
- Purpose: Feature-specific React components for design tool UI
- Contains: Session creation dialog, voting cards, results reveal, spatial comments, research UI
- Key files: `create-session-dialog.tsx`, `voting-option-card.tsx`, `results-reveal.tsx`, `research-client.tsx` (81KB - largest component)

**components/ui/:**
- Purpose: Reusable UI primitives from shadcn/ui (button, badge, separator, toast)
- Contains: Unstyled, accessible components with Tailwind styling
- Usage: Imported by design components

**lib/:**
- Purpose: Non-React utilities, types, API clients, data converters
- Contains: TypeScript types, Supabase client setup, API request functions, Ollama integration
- Key files: `design-store.tsx` (state manager), `design-api.ts` (API functions), `design-types.ts` (types)

**hooks/:**
- Purpose: Custom React hooks for state and side effects
- Contains: Voter identity management, creator checks, admin mode, session insights
- Key files: `use-voter-identity.ts`, `use-admin.ts`

**crew/:**
- Purpose: Separate Python application (Anthropic Crew AI framework)
- Contains: AI agents, tasks, tools for design automation
- Language: Python (separate from main Next.js app)

## Key File Locations

**Entry Points:**
- `app/layout.tsx` - Root layout, initializes theme + providers
- `app/page.tsx` - Home page, session list with My Sessions / All Sessions tabs
- `app/explorations/[id]/page.tsx` - Single exploration/voting interface
- `app/research/page.tsx` - Research insights hub with 5 tabs

**Configuration:**
- `tsconfig.json` - TypeScript compiler options, @ alias for imports
- `next.config.ts` - Next.js config, React Compiler enabled
- `components.json` - shadcn/ui component registry
- `.env.local` - Supabase credentials (not committed)

**Core Logic:**
- `lib/design-store.tsx` - Session state management via React Context (20KB)
- `lib/design-api.ts` - API client functions (create/get/update/delete operations)
- `lib/design-types.ts` - Type definitions for sessions, votes, options, comments
- `components/design/create-session-dialog.tsx` - Session creation with 2-step flow

**Testing:**
- Not detected - no test files found

## Naming Conventions

**Files:**
- Page components: `page.tsx` in route folders
- API routes: `route.ts` (POST/GET/PATCH/DELETE)
- Components: PascalCase with `.tsx` (e.g., `CreateSessionDialog.tsx`)
- Utilities/types: camelCase with appropriate extensions (`.ts` for utilities, `.tsx` for React components)
- Hooks: `use-*` (e.g., `use-voter-identity.ts`)

**Directories:**
- App routes: kebab-case (e.g., `design-ops`, `create-session`)
- Dynamic routes: `[paramName]` (e.g., `[id]`, `[optionId]`)
- Feature directories: kebab-case (e.g., `components/design/`, `lib/`)

## Where to Add New Code

**New Feature (e.g., voting on options):**
- Primary code: `app/explorations/[id]/page.tsx` (UI) + `app/api/design/sessions/[id]/votes/route.ts` (API)
- State: Add action to `lib/design-store.tsx` SessionContext
- Types: Add types to `lib/design-types.ts`
- Component: Create in `components/design/` (e.g., `VotingOptionCard.tsx`)

**New Component/Module:**
- Reusable: `components/design/` (if design-specific) or `components/ui/` (if primitive)
- Implementation: Component file + types + hooks as needed
- Example: `components/design/voting-option-card.tsx` + hooks in `hooks/`

**Utilities:**
- Shared helpers: `lib/design-utils.ts` (UUID, colors, shuffle)
- Type converters: `lib/design-types.ts` (row-to-entity functions)
- API clients: `lib/design-api.ts` (fetch wrappers)
- Custom hooks: `hooks/use-*.ts`

**API Endpoints:**
- Sessions: `app/api/design/sessions/route.ts` (list/create)
- Session details: `app/api/design/sessions/[id]/route.ts` (get/update/delete)
- Sub-resources: `app/api/design/sessions/[id]/votes/route.ts`, `comments/`, `reactions/`, etc.
- Research: `app/api/design/research/synthesize/route.ts`, `observations/`, etc.

## Special Directories

**public/:**
- Purpose: Static assets served directly (favicon, images)
- Generated: No
- Committed: Yes

**.planning/:**
- Purpose: GSD (Get Stuff Done) planning artifacts
- Generated: Yes (by orchestrator)
- Committed: Yes (kept as reference)

**.next/:**
- Purpose: Build output directory
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**node_modules/:**
- Purpose: Installed npm packages
- Generated: Yes (by `npm install`)
- Committed: No

**supabase/:**
- Purpose: Database migrations and configuration
- Generated: No (manual)
- Committed: Yes

---

*Structure analysis: 2026-03-19*
