import type {
  VotingSessionRow,
  VotingOptionRow,
  VotingVoteRow,
  ReactionRow,
  DesignCommentRow,
  MediaType,
} from "./design-types";

const BASE = "/api/design/sessions";

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `API error: ${res.status}`);
  return data as T;
}

// --- Sessions ---

export async function apiCreateSession(params: {
  title: string;
  description: string;
  participantCount: number;
  options: { title: string; description: string; mediaType?: MediaType; mediaUrl?: string; rationale?: string }[];
  previewUrl?: string;
  problem?: string;
  goal?: string;
  audience?: string;
  constraints?: string;
  creatorToken: string;
}) {
  return api<{ id: string; creatorToken: string }>(BASE, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function apiGetSession(id: string, voterId?: string) {
  const url = voterId ? `${BASE}/${id}?voterId=${encodeURIComponent(voterId)}` : `${BASE}/${id}`;
  return api<{
    session: VotingSessionRow;
    options: VotingOptionRow[];
    votes: VotingVoteRow[];
    voteCount: number;
  }>(url);
}

export async function apiUpdateSession(
  id: string,
  creatorToken: string,
  updates: { phase?: string; participantCount?: number }
) {
  return api<{ ok: true }>(`${BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ creatorToken, ...updates }),
    credentials: "include",
  });
}

export async function apiDeleteSession(id: string, creatorToken: string) {
  return api<{ ok: true }>(`${BASE}/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ creatorToken }),
    credentials: "include",
  });
}

// --- Options ---

export async function apiAddOption(
  sessionId: string,
  creatorToken: string,
  option: { title: string; description: string; mediaType?: MediaType; mediaUrl?: string; rationale?: string }
) {
  return api<{ option: VotingOptionRow }>(`${BASE}/${sessionId}/options`, {
    method: "POST",
    body: JSON.stringify({ ...option, creatorToken }),
    credentials: "include",
  });
}

export async function apiUpdateOption(
  sessionId: string,
  optionId: string,
  creatorToken: string,
  updates: { title?: string; description?: string; mediaType?: MediaType; mediaUrl?: string }
) {
  return api<{ ok: true }>(`${BASE}/${sessionId}/options`, {
    method: "PATCH",
    body: JSON.stringify({ optionId, creatorToken, ...updates }),
    credentials: "include",
  });
}

export async function apiRemoveOption(
  sessionId: string,
  optionId: string,
  creatorToken: string
) {
  return api<{ ok: true }>(`${BASE}/${sessionId}/options`, {
    method: "DELETE",
    body: JSON.stringify({ optionId, creatorToken }),
    credentials: "include",
  });
}

// --- Votes ---

export async function apiCastVote(
  sessionId: string,
  params: { optionId: string; voterId: string; voterName: string; comment?: string }
) {
  return api<{ ok: true }>(`${BASE}/${sessionId}/votes`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function apiUndoVote(sessionId: string, voterId: string) {
  return api<{ ok: true }>(`${BASE}/${sessionId}/votes`, {
    method: "DELETE",
    body: JSON.stringify({ voterId }),
  });
}

export async function apiPinVote(
  sessionId: string,
  voteId: string,
  pinned: boolean,
  creatorToken: string
) {
  return api<{ ok: true }>(`${BASE}/${sessionId}/votes`, {
    method: "PATCH",
    body: JSON.stringify({ voteId, pinned, creatorToken }),
    credentials: "include",
  });
}

// --- Reactions ---

export async function apiGetReactions(sessionId: string) {
  return api<{ reactions: ReactionRow[] }>(`${BASE}/${sessionId}/reactions`);
}

export async function apiToggleReaction(
  sessionId: string,
  params: { optionId: string; voterId: string }
) {
  return api<{ toggled: "added" | "removed" }>(`${BASE}/${sessionId}/reactions`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// --- Spatial Comments ---

export async function apiGetSpatialComments(sessionId: string, optionId: string) {
  return api<{ comments: DesignCommentRow[] }>(
    `${BASE}/${sessionId}/comments?optionId=${encodeURIComponent(optionId)}`
  );
}

export async function apiAddSpatialComment(
  sessionId: string,
  params: { optionId: string; voterId: string; voterName: string; body: string; xPct: number; yPct: number }
) {
  return api<{ comment: DesignCommentRow }>(`${BASE}/${sessionId}/comments`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function apiDeleteSpatialComment(
  sessionId: string,
  commentId: string,
  voterId: string
) {
  return api<{ ok: true }>(`${BASE}/${sessionId}/comments`, {
    method: "DELETE",
    body: JSON.stringify({
      commentId,
      voterId,
      creatorToken: null,
    }),
    credentials: "include",
  });
}

export async function apiDeleteSpatialCommentAsCreator(
  sessionId: string,
  commentId: string,
  creatorToken: string
) {
  return api<{ ok: true }>(`${BASE}/${sessionId}/comments`, {
    method: "DELETE",
    body: JSON.stringify({
      commentId,
      creatorToken,
    }),
    credentials: "include",
  });
}

// --- Suggest Option ---

export async function apiSuggestOption(
  sessionId: string,
  option: { title: string; description: string; mediaType?: MediaType; mediaUrl?: string; rationale?: string; suggestedBy: string }
) {
  return api<{ option: VotingOptionRow }>(`${BASE}/${sessionId}/options`, {
    method: "POST",
    body: JSON.stringify({ ...option, suggested: true }),
  });
}
