# Technology Stack

**Analysis Date:** 2026-03-19

## Languages

**Primary:**
- TypeScript 5.x - All frontend components, API routes, and utility functions
- React 19.2.3 - UI component framework
- SQL - Supabase migrations in `supabase/migrations/`

**Secondary:**
- Python 3.x - Crew AI agent framework in `crew/` directory
- JavaScript - Next.js configuration and build tools

## Runtime

**Environment:**
- Node.js 20+ (inferred from @types/node ^20)
- Python 3.x (for Crew FastAPI server)

**Package Managers:**
- npm - Node dependencies management
- pip - Python dependencies management
- Lockfiles: `package-lock.json` (standard npm lockfile)

## Frameworks

**Core Web:**
- Next.js 16.1.6 - Full-stack React framework with App Router
- React 19.2.3 - UI library with latest features
- React DOM 19.2.3 - DOM rendering

**Styling & UI:**
- Tailwind CSS 4.x - Utility-first CSS framework
- @tailwindcss/postcss 4.x - PostCSS plugin for Tailwind
- shadcn 3.8.5 - Component library builder
- Radix UI 1.4.3 - Headless UI components (buttons, dialogs, etc.)
- class-variance-authority 0.7.1 - Type-safe CSS variants
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.5.0 - Merge Tailwind class conflicts

**Animation & Motion:**
- Motion 12.34.5 - Animation library for React
- @use-gesture/react 10.3.1 - Gesture handling (swipe, pinch, etc.)
- tw-animate-css 1.4.0 - Tailwind animation presets

**Charts & Data Viz:**
- Recharts 3.8.0 - React charting library (used in research insights)

**Theme Management:**
- next-themes 0.4.6 - Dark mode and theme switching

**Icons:**
- lucide-react 0.576.0 - Icon library

**Notifications:**
- sonner 2.0.7 - Toast notification library

**Validation:**
- Zod 4.3.6 - TypeScript-first schema validation

## External Services SDKs

**AI & LLM:**
- @anthropic-ai/sdk 0.78.0 - Claude API client for code generation (in `app/api/figma/generate/route.ts`)

**Database:**
- @supabase/supabase-js 2.98.0 - Supabase PostgRES client

**Agent Framework:**
- crewai 1.10.1 - Multi-agent orchestration (Python)
- litellm - LLM abstraction layer (Python)

**Server Framework (Crew):**
- fastapi - Python async web framework for Crew API
- uvicorn[standard] - ASGI server for FastAPI
- sse-starlette - Server-sent events for Crew streaming
- supabase (Python) - Supabase client for Python crew tasks
- python-dotenv - Environment variable management

## Build & Development

**Bundling & Optimization:**
- Next.js built-in bundling and image optimization

**Compilation:**
- TypeScript 5.x - TypeScript compilation
- Babel (React Compiler) - babel-plugin-react-compiler 1.0.0 - Automatic React optimization

**Linting & Code Quality:**
- ESLint 9.x - JavaScript/TypeScript linting
- eslint-config-next 16.1.6 - Next.js ESLint configuration with core-web-vitals and TypeScript support

## Configuration Files

**Next.js:**
- `next.config.ts` - React Compiler enabled
- `tsconfig.json` - TypeScript paths mapping: `@/*` → `./` (root alias)

**Styling:**
- `postcss.config.mjs` - PostCSS with Tailwind CSS plugin

**Linting:**
- `eslint.config.mjs` - ESLint flat config with Next.js and TypeScript rules

**Supabase:**
- `supabase/migrations/` - 5 SQL migration files managing schema evolution

## Environment Configuration

**Development:**
- `.env.local` present - Contains local Supabase and API keys

**Required Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public, used in `lib/supabase.ts`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public, used in `lib/supabase.ts`)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only, used in API routes)
- `ANTHROPIC_API_KEY` - Claude API key (in `app/api/figma/generate/route.ts`)
- `FIGMA_ACCESS_TOKEN` - Figma API token (in `app/api/figma/generate/route.ts`)
- `OLLAMA_BASE_URL` - Optional, defaults to `http://localhost:11434` (in `lib/ollama.ts`)
- `OLLAMA_MODEL` - Optional, defaults to `llama3.2` (in `lib/ollama.ts`)
- `CREW_API_URL` - Optional, defaults to `http://localhost:8000` (in crew API routes)

## Development Scripts

```bash
npm run dev              # Next.js dev server on port 3500
npm run build           # Build Next.js application
npm run start           # Start production server
npm run lint            # Run ESLint
npm run crew            # Start Crew FastAPI server on port 8000 (./crew/start.sh)
```

## Platform Requirements

**Development:**
- Node.js 20+
- npm/yarn
- Python 3.x (for Crew service)
- Ollama running locally on port 11434 (optional, for local inference)
- Supabase account (or self-hosted instance)

**Production:**
- Node.js 20+ server
- PostgreSQL database (via Supabase)
- Anthropic API key for Claude integration
- Figma API token for design-to-code features
- Optional: Local Ollama instance or remote LLM provider (via LiteLLM)

## Key Dependencies at a Glance

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.6 | App framework |
| react | 19.2.3 | UI library |
| typescript | 5.x | Type safety |
| tailwindcss | 4.x | Styling |
| @supabase/supabase-js | 2.98.0 | Database client |
| @anthropic-ai/sdk | 0.78.0 | Claude API |
| motion | 12.34.5 | Animations |
| zod | 4.3.6 | Schema validation |

---

*Stack analysis: 2026-03-19*
