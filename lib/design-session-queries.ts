import type { ExplorationSession, VotingSessionRow } from "./design-types";
import { sessionFromRow } from "./design-types";
import { supabase } from "./supabase";
import { mergeSessionValidation } from "./session-validation-storage";

async function fetchSessionCollection(sessionRows: VotingSessionRow[]) {
  if (!supabase || sessionRows.length === 0) {
    return [] as ExplorationSession[];
  }

  const sessionIds = sessionRows.map((session) => session.id);
  const revealedIds = sessionRows
    .filter((session) => session.phase === "revealed")
    .map((session) => session.id);

  const [optionsRes, voteCountsPromises, votesRes] = await Promise.all([
    supabase
      .from("voting_options")
      .select("*")
      .in("session_id", sessionIds)
      .order("position"),
    Promise.all(
      sessionIds.map((sessionId) =>
        supabase.rpc("get_vote_count", { p_session_id: sessionId })
      )
    ),
    revealedIds.length > 0
      ? supabase.from("voting_votes").select("*").in("session_id", revealedIds)
      : Promise.resolve({ data: [] }),
  ]);

  const allOptions = optionsRes.data ?? [];
  const allVotes = votesRes.data ?? [];
  const voteCounts = new Map(
    sessionIds.map((sessionId, index) => [
      sessionId,
      voteCountsPromises[index].data ?? 0,
    ])
  );

  return sessionRows.map((session) =>
    mergeSessionValidation(
      sessionFromRow(
        session,
        allOptions.filter((option) => option.session_id === session.id),
        allVotes.filter((vote) => vote.session_id === session.id),
        voteCounts.get(session.id) ?? 0
      )
    )
  );
}

export async function fetchCreatorSessions(creatorTokens: string[]) {
  if (!supabase || creatorTokens.length === 0) return [] as ExplorationSession[];

  const { data: sessions } = await supabase
    .from("voting_sessions")
    .select("*")
    .in("creator_token", creatorTokens)
    .order("created_at", { ascending: false });

  if (!sessions) return [] as ExplorationSession[];
  return fetchSessionCollection(sessions as VotingSessionRow[]);
}

export async function fetchAllSessions() {
  if (!supabase) return [] as ExplorationSession[];

  const { data: sessions } = await supabase
    .from("voting_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (!sessions) return [] as ExplorationSession[];
  return fetchSessionCollection(sessions as VotingSessionRow[]);
}
