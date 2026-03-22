# Local Development Setup

## Prerequisites

- Node.js 18+
- npm or yarn
- Python 3.10+ (for Crew AI agents)

## Environment Variables

### 1. Create `.env.local`

```bash
cp .env.example .env.local
```

Then fill in your actual values:

| Variable | Source | Notes |
|----------|--------|-------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | Required for Claude API calls |
| `DESIGN_TOOLS_PASSWORD` | Your choice | Used for design tool access |
| `PEXELS_API_KEY` | [pexels.com/api](https://www.pexels.com/api) | Optional, for image search |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard | Anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard | Server-side only, keep secret |
| `CREW_API_URL` | `http://localhost:8000` | Local Crew AI server |

### 2. Keep Keys Secure with direnv (Recommended)

Install direnv to auto-load `.env.local` when you `cd` into the project:

```bash
# macOS
brew install direnv

# Linux
sudo apt-get install direnv

# Add to ~/.zshrc or ~/.bashrc:
eval "$(direnv hook bash)"  # or zsh
```

Then allow the project:
```bash
direnv allow
```

**Benefits:**
- Keys auto-load when you enter the folder
- Keys auto-unload when you leave
- Never type secrets in terminal
- Prevents accidental leaks in command history

### 3. Prevent Accidental Key Commits

Install `git-secrets` to scan for exposed API keys:

```bash
# macOS
brew install git-secrets

# Initialize for this project
git secrets --install
git secrets --register-aws
```

This will block commits containing API keys automatically.

## Running Locally

### Start the dev server

```bash
npm run dev
```

This starts:
- **Next.js**: http://localhost:3500
- **Crew API** (if available): http://localhost:8000

### Test Transmitter (Book-Grounded Design)

```bash
# Visit the Transmitter page
open http://localhost:3500/transmitter
```

Or test the API directly:
```bash
curl -X POST http://localhost:3500/api/articulate \
  -H "Content-Type: application/json" \
  -d '{"decision":"test","userRationale":"test","bizRationale":"test"}'
```

## Troubleshooting

### API returns 401 (Unauthorized)

- Check `ANTHROPIC_API_KEY` is valid in `.env.local`
- Verify key hasn't expired on console.anthropic.com

### "ANTHROPIC_API_KEY not configured"

- Ensure `.env.local` exists (copy from `.env.example`)
- If using direnv, run: `direnv allow`
- Restart dev server: `npm run dev`

### Keys showing in terminal history

- Use direnv (see step 2 above)
- Or manually source: `source .env.local`

### "ANTHROPIC_API_KEY not set" when running tsx scripts

Some scripts (like `npm run test:transmitter`) run via tsx/Node.js and don't auto-inherit direnv env vars. Solution:

```bash
# Export API key before running the script
export ANTHROPIC_API_KEY=$(grep "^ANTHROPIC_API_KEY=" .env.local | cut -d'=' -f2)
npm run test:transmitter
```

Or create a helper function in `~/.zshrc`:
```bash
run-with-env() {
  eval $(grep = .env.local | sed 's/^/export /')
  "$@"
}

# Then use: run-with-env npm run test:transmitter
```

## Security Best Practices

✅ **DO:**
- Keep `.env.local` in `.gitignore` (already configured)
- Use `.env.example` as a template
- Rotate API keys periodically
- Use direnv to avoid typing secrets
- Use git-secrets to prevent commits

❌ **DON'T:**
- Commit `.env.local` to git
- Share `.env.local` in Slack/email
- Log or print API keys
- Use the same key across projects
- Leave `.env.local` in terminal history

## Getting Help

See `TRANSMITTER_RESULTS.md` for more info on the book-grounded design feature.
