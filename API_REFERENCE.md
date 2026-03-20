# API Reference — Carrier Endpoints

Complete reference for all Carrier APIs. Base URL: `http://localhost:3500/api/design` (frontend) or `http://localhost:8000` (crew API).

---

## 🎯 Quick Navigation

- [Voting Sessions](#voting-sessions) — Create, read, update voting sessions
- [Voting Options](#voting-options) — Add design options to sessions
- [Votes](#votes) — Cast and manage votes
- [Reactions](#reactions) — Like/heart options
- [Comments](#comments) — Spatial comments on designs
- [Research](#research) — Observations, segments, insights
- [Design Ops](#design-ops) — Crew synthesis pipeline
- [Notifications](#notifications) — Session notifications
- [Admin](#admin) — Utilities (seed data, migrations)

---

## Voting Sessions

Manage design voting sessions.

### POST /sessions

Create a new voting session.

**Request:**
```typescript
{
  title: string;
  description?: string;
  problem?: string;
  goal?: string;
  audience?: string;
  constraints?: string;
  participant_count?: number;
  preview_url?: string;
}
```

**Response:**
```typescript
{
  id: string (UUID);
  title: string;
  description: string;
  phase: "setup" | "voting" | "revealed";
  participant_count: number;
  creator_token: string; // Save this to update session later
  created_at: string (ISO 8601);
}
```

**Example:**
```bash
curl -X POST http://localhost:3500/api/design/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Checkout Flow Redesign",
    "description": "Compare two checkout flows",
    "problem": "Users abandon at address",
    "participant_count": 5
  }'
```

---

### GET /sessions

List all voting sessions (paginated).

**Query params:**
- `limit` (default 10): Number of sessions to return
- `offset` (default 0): Offset for pagination
- `status` (optional): Filter by phase ("setup", "voting", "revealed")

**Response:**
```typescript
{
  sessions: Array<{
    id: string;
    title: string;
    phase: string;
    participant_count: number;
    created_at: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}
```

---

### GET /sessions/[id]

Get a specific session with voting details.

**Response:**
```typescript
{
  id: string;
  title: string;
  description: string;
  problem: string;
  goal: string;
  audience: string;
  constraints: string;
  phase: "setup" | "voting" | "revealed";
  participant_count: number;
  preview_url: string;
  created_at: string;

  // Voting data (only if phase="revealed")
  options: Array<{
    id: string;
    title: string;
    description: string;
    media_type: "none" | "image" | "figma-embed" | "excalidraw";
    media_url: string;
    vote_count: number;
  }>;
  votes: Array<{
    option_id: string;
    voter_name: string;
    comment: string;
    pinned: boolean;
  }>;
}
```

**Note:** If phase !== "revealed", votes are hidden (privacy during voting).

---

### PATCH /sessions/[id]

Update session details or phase.

**Request:**
```typescript
{
  title?: string;
  description?: string;
  phase?: "setup" | "voting" | "revealed";
  participant_count?: number;
}
```

**Auth:** Requires `creator_token` (sent as header: `X-Creator-Token`)

**Response:** Updated session object

---

### DELETE /sessions/[id]

Delete a session (creator only).

**Auth:** Requires `X-Creator-Token` header

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

## Voting Options

Manage design options within sessions.

### POST /sessions/[id]/options

Add a design option to a session.

**Request:**
```typescript
{
  title: string;
  description?: string;
  media_type?: "none" | "image" | "figma-embed" | "excalidraw";
  media_url?: string;
  rationale?: string;
}
```

**Response:**
```typescript
{
  id: string;
  session_id: string;
  title: string;
  media_type: string;
  media_url: string;
  created_at: string;
}
```

**Constraints:**
- Session must be in "setup" phase
- Minimum 2 options required before voting starts
- Creator token required

---

### PATCH /sessions/[id]/options/[optionId]

Update an option.

**Request:**
```typescript
{
  title?: string;
  description?: string;
  media_url?: string;
  rationale?: string;
}
```

**Auth:** Requires `X-Creator-Token`

---

### DELETE /sessions/[id]/options/[optionId]

Remove an option from a session.

**Auth:** Requires `X-Creator-Token`

---

## Votes

Cast and manage votes.

### POST /sessions/[id]/votes

Cast a vote for an option.

**Request:**
```typescript
{
  option_id: string;
  voter_name?: string;
  comment?: string;
  effort?: 1-5; // For effort-impact matrix
  impact?: 1-5;
}
```

**Response:**
```typescript
{
  id: string;
  session_id: string;
  option_id: string;
  voter_id: string; // Anonymous ID
  comment: string;
  created_at: string;
}
```

**Rules:**
- Session must be in "voting" phase
- One vote per voter (identified by voter_id, stored in localStorage)
- If voter_id already voted, vote is updated

---

### DELETE /sessions/[id]/votes

Remove your vote from a session.

**Response:**
```typescript
{
  success: boolean;
}
```

---

### PATCH /sessions/[id]/votes/[voteId]

Update a vote comment (pin/unpin).

**Request:**
```typescript
{
  pinned?: boolean;
  comment?: string;
}
```

---

## Reactions

Heart/like options.

### POST /sessions/[id]/reactions

Toggle heart reaction on an option.

**Request:**
```typescript
{
  option_id: string;
}
```

**Response:**
```typescript
{
  id: string;
  reacted: boolean; // true if you just liked, false if you unliked
}
```

**Rules:**
- One heart per voter per option
- Toggles (heart again to unlike)

---

### GET /sessions/[id]/reactions

Get all reactions for a session.

**Response:**
```typescript
{
  reactions: Array<{
    option_id: string;
    voter_id: string;
    created_at: string;
  }>;
  reaction_counts: {
    [option_id]: number;
  };
}
```

---

## Comments

Spatial comments on designs.

### POST /sessions/[id]/comments

Add a comment to a specific point on a design.

**Request:**
```typescript
{
  option_id: string;
  body: string;
  x_pct?: number; // 0-100, left position
  y_pct?: number; // 0-100, top position
  voter_name?: string;
}
```

**Response:**
```typescript
{
  id: string;
  session_id: string;
  option_id: string;
  body: string;
  x_pct: number;
  y_pct: number;
  created_at: string;
}
```

---

### DELETE /sessions/[id]/comments/[commentId]

Delete a comment.

**Response:**
```typescript
{
  success: boolean;
}
```

---

## Research

Observations, segments, and insights.

### POST /research/observations

Create a research observation.

**Request:**
```typescript
{
  body: string;
  area?: string; // e.g., "Checkout", "Onboarding"
  source_url?: string;
  contributor?: string;
}
```

**Response:**
```typescript
{
  id: string;
  body: string;
  area: string;
  created_at: string;
}
```

---

### GET /research/observations

List all observations (paginated).

**Query params:**
- `area` (optional): Filter by area
- `limit` (default 50): Number to return
- `offset` (default 0): Offset

**Response:**
```typescript
{
  observations: Array<{
    id: string;
    body: string;
    area: string;
    created_at: string;
  }>;
  total: number;
}
```

---

### GET /research/segments

Get all research segments (user cohorts).

**Response:**
```typescript
{
  segments: Array<{
    id: string;
    name: string;
    description: string;
    created_at: string;
  }>;
}
```

---

### POST /research/segments/[id]/items

Add a finding to a segment.

**Request:**
```typescript
{
  bucket: "needs" | "pain_points" | "opportunities" | "actionable_insights";
  title: string;
  body: string;
  source_observation_ids?: string[]; // Reference observations
}
```

**Response:**
```typescript
{
  id: string;
  segment_id: string;
  bucket: string;
  title: string;
  created_at: string;
}
```

---

### POST /research/synthesize

Synthesize observations using local Ollama LLM.

**Request:**
```typescript
{
  observation_ids?: string[]; // If not provided, use all
  prompt?: string;
  tier?: "quick" | "balanced" | "in-depth";
}
```

**Response:**
```typescript
{
  synthesis: string;
  model: string;
  tokens_used: number;
}
```

---

## Design Ops

Crew synthesis pipeline.

### POST /design-ops/run

Run the three-agent crew synthesis.

**Request:**
```typescript
{
  stage?: "discovery" | "validation" | "solution" | "optimization";
  synthesis_tier?: "quick" | "balanced" | "in-depth"; // Default: balanced
  problem_statement?: string;
  objective?: string;
  hypothesis?: string;
  user_segment?: string;
  metric?: string;
  constraints?: {
    timeline?: string;
    technical?: string;
    scope?: string;
  };
  research_data?: {
    snowflake_results?: string;
    survey_responses?: string;
    supabase_observations?: string;
    prototypes_tested?: Array<{ name: string; votes: number; comments: string[] }>;
    images?: Array<{ url: string; description: string }>;
  };
}
```

**Response:** Server-Sent Events (SSE) stream

```typescript
// Event 1: run_start
{ type: "run_start", synthesis_tier: "balanced" }

// Event 2: agent_start
{ type: "agent_start", agent: "pm" }

// Event 3: agent_message (PM output)
{
  type: "agent_message",
  agent: "pm",
  output: { /* PM output JSON */ }
}

// Event 4: agent_start
{ type: "agent_start", agent: "research" }

// Event 5: agent_message (Research output)
{
  type: "agent_message",
  agent: "research",
  output: { /* Research output JSON */ }
}

// Event 6: agent_start
{ type: "agent_start", agent: "design" }

// Event 7: agent_message (Design output)
{
  type: "agent_message",
  agent: "design",
  output: { /* Design output JSON */ }
}

// Event 8: run_complete
{ type: "run_complete", status: "success" }
```

**Streaming:** Use EventSource or fetch with streaming to subscribe to SSE.

**Example (JavaScript):**
```javascript
const eventSource = new EventSource('/api/design/design-ops/run?problem_statement=...');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.agent, data.output);
};

eventSource.onerror = (error) => {
  console.error('Stream error:', error);
  eventSource.close();
};
```

---

### GET /design-ops/health

Check crew API health.

**Response:**
```typescript
{
  status: "ok" | "error";
  anthropic: "ok" | "error";
  model: "claude-haiku-4-5-20251001";
}
```

---

## Notifications

Session event notifications.

### POST /notifications/setup

Enable notifications for a session.

**Request:**
```typescript
{
  session_id: string;
  user_id?: string;
  type: "session_created" | "voting_started" | "voting_ended" | "results_ready";
}
```

**Response:**
```typescript
{
  id: string;
  session_id: string;
  type: string;
  created_at: string;
}
```

---

### GET /notifications

Get notifications for the current user.

**Response:**
```typescript
{
  notifications: Array<{
    id: string;
    type: string;
    message: string;
    link: string;
    read_at: string | null;
    created_at: string;
  }>;
}
```

---

## Admin

Admin utilities (seed data, migrations).

### POST /migrations

Run database migrations.

**Auth:** Admin only

**Request:**
```typescript
{
  direction: "up" | "down";
}
```

**Response:**
```typescript
{
  success: boolean;
  migrations_applied: number;
}
```

---

### POST /seed

Seed database with sample data.

**Auth:** Admin only

**Response:**
```typescript
{
  success: boolean;
  sessions_created: number;
  observations_created: number;
}
```

---

## Error Handling

All endpoints follow standard HTTP error codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing auth token) |
| 403 | Forbidden (not allowed to access resource) |
| 404 | Not found |
| 500 | Server error |

**Error response format:**
```typescript
{
  error: string;
  message: string;
  details?: any;
}
```

---

## Authentication

Most endpoints don't require authentication (public). Some require a creator token:

**Header:** `X-Creator-Token: <token>`

Tokens are returned when creating a session and stored in localStorage on the client.

---

## Rate Limiting

- Design ops runs: Max 5 concurrent, 100 per minute per IP
- Vote casting: No limit
- Observations: No limit

---

## CORS

Frontend requests from `localhost:3500` are allowed. Crew API requests from frontend use same-origin.

Preflight OPTIONS requests are handled automatically.

---

## Websockets (Future)

Currently using polling + SSE. Websocket support planned for:
- Real-time vote updates
- Live synthesis progress
- Collaborative sessions

---

## See Also

- [README.md](./README.md) — Architecture overview
- [CREW_HANDOFF_SPEC.md](./CREW_HANDOFF_SPEC.md) — Design ops specification (PM → Research → Designer)
- [crew/AGENTS.md](./crew/AGENTS.md) — Agent reference with system prompts
- [crew/JSON_SCHEMA_VALIDATION.md](./crew/JSON_SCHEMA_VALIDATION.md) — Crew output validation
- [crew/README.md](./crew/README.md) — Crew API setup & troubleshooting
- [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md) — Database schema & RLS
- [docs/README.md](./docs/README.md) — Documentation index

