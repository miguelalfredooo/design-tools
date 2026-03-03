import type {
  VotingSessionRow,
  VotingOptionRow,
  VotingVoteRow,
  DesignCommentRow,
  MediaType,
} from "./design-types";

const BASE = "/api/sessions";

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

export async function apiGetSession(id: string) {
  return api<{
    session: VotingSessionRow;
    options: VotingOptionRow[];
    votes: VotingVoteRow[];
    voteCount: number;
  }>(`${BASE}/${id}`);
}

export async function apiUpdateSession(
  id: string,
  creatorToken: string,
  updates: { phase?: string; participantCount?: number }
) {
  return api<{ ok: true }>(`${BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ creatorToken, ...updates }),
  });
}

export async function apiDeleteSession(id: string, creatorToken: string) {
  return api<{ ok: true }>(`${BASE}/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ creatorToken }),
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
  });
}

// --- Votes ---

export async function apiCastVote(
  sessionId: string,
  params: { optionId: string; voterId: string; voterName: string; comment?: string; effort?: string; impact?: string }
) {
  return api<{ ok: true }>(`${BASE}/${sessionId}/votes`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// --- Comments ---

export async function apiGetComments(sessionId: string) {
  return api<{ comments: DesignCommentRow[] }>(`${BASE}/${sessionId}/comments`);
}

export async function apiAddComment(
  sessionId: string,
  params: { optionId: string; voterId: string; voterName: string; body: string }
) {
  return api<{ comment: DesignCommentRow }>(`${BASE}/${sessionId}/comments`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}
