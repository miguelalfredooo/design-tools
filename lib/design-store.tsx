"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ExplorationSession, DesignComment, MediaType } from "./design-types";
import { sessionFromRow, commentFromRow } from "./design-types";
import { generateUUID } from "./design-utils";
import { supabase } from "./supabase";
import {
  apiCreateSession,
  apiGetSession,
  apiUpdateSession,
  apiDeleteSession,
  apiAddOption,
  apiRemoveOption,
  apiCastVote,
  apiGetComments,
  apiAddComment,
} from "./design-api";

// --- localStorage keys ---
const CREATOR_TOKENS_KEY = "design-creator-tokens";
const VOTER_ID_KEY = "design-voter-id";

// --- Creator token management ---

function getCreatorTokens(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CREATOR_TOKENS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function setCreatorToken(sessionId: string, token: string) {
  const tokens = getCreatorTokens();
  tokens[sessionId] = token;
  localStorage.setItem(CREATOR_TOKENS_KEY, JSON.stringify(tokens));
}

export function getCreatorToken(sessionId: string): string | null {
  return getCreatorTokens()[sessionId] ?? null;
}

// --- Voter ID management ---

export function getVoterId(): string {
  let id = localStorage.getItem(VOTER_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(VOTER_ID_KEY, id);
  }
  return id;
}

// --- Context types ---

interface SessionContextValue {
  /** Current session (for single-session pages) */
  session: ExplorationSession | null;
  /** All sessions created by this browser (for list page) */
  mySessions: ExplorationSession[];
  /** All sessions (for browse view) */
  allSessions: ExplorationSession[];
  /** Loading state */
  loading: boolean;
  /** Load a session by ID */
  loadSession: (id: string) => Promise<void>;
  /** Load all sessions created by this browser */
  loadMySessions: () => Promise<void>;
  /** Load all sessions */
  loadAllSessions: () => Promise<void>;
  /** Create a new session */
  createSession: (
    title: string,
    description: string,
    participantCount: number,
    options: { title: string; description: string; mediaType?: MediaType; mediaUrl?: string; rationale?: string }[],
    previewUrl?: string,
    brief?: { problem?: string; goal?: string; audience?: string; constraints?: string }
  ) => Promise<ExplorationSession>;
  /** Delete a session */
  deleteSession: (id: string) => Promise<void>;
  /** Add an option to a session */
  addOption: (
    sessionId: string,
    option: { title: string; description: string; mediaType?: MediaType; mediaUrl?: string; rationale?: string }
  ) => Promise<void>;
  /** Remove an option */
  removeOption: (sessionId: string, optionId: string) => Promise<void>;
  /** Set participant count */
  setParticipantCount: (sessionId: string, count: number) => Promise<void>;
  /** Start voting phase */
  startVoting: (sessionId: string) => Promise<void>;
  /** Cast a vote */
  castVote: (
    sessionId: string,
    optionId: string,
    voterName: string,
    comment?: string,
    effort?: string,
    impact?: string
  ) => Promise<void>;
  /** Reset session to setup */
  resetSession: (sessionId: string) => Promise<void>;
  /** Reveal results (force) */
  revealResults: (sessionId: string) => Promise<void>;
  /** Comments for current session */
  comments: DesignComment[];
  /** Load comments for a session */
  loadComments: (sessionId: string) => Promise<void>;
  /** Add a comment to an option */
  addComment: (
    sessionId: string,
    optionId: string,
    voterName: string,
    body: string
  ) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ExplorationSession | null>(null);
  const [mySessions, setMySessions] = useState<ExplorationSession[]>([]);
  const [allSessions, setAllSessions] = useState<ExplorationSession[]>([]);
  const [comments, setComments] = useState<DesignComment[]>([]);
  const [loading, setLoading] = useState(false);

  // Load a single session
  const loadSession = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await apiGetSession(id);
      setSession(
        sessionFromRow(data.session, data.options, data.votes, data.voteCount)
      );
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load sessions created by this browser
  const loadMySessions = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const tokens = getCreatorTokens();
      const tokenValues = Object.values(tokens);
      if (tokenValues.length === 0) {
        setMySessions([]);
        setLoading(false);
        return;
      }

      const { data: sessions } = await supabase
        .from("voting_sessions")
        .select("*")
        .in("creator_token", tokenValues)
        .order("created_at", { ascending: false });

      if (!sessions) {
        setMySessions([]);
        setLoading(false);
        return;
      }

      const sessionIds = sessions.map((s) => s.id);

      const revealedIds = sessions.filter((s) => s.phase === "revealed").map((s) => s.id);

      const [optionsRes, voteCountsPromises, votesRes] = await Promise.all([
        supabase
          .from("voting_options")
          .select("*")
          .in("session_id", sessionIds)
          .order("position"),
        Promise.all(
          sessionIds.map((sid) =>
            supabase!.rpc("get_vote_count", { p_session_id: sid })
          )
        ),
        revealedIds.length > 0
          ? supabase
              .from("voting_votes")
              .select("*")
              .in("session_id", revealedIds)
          : Promise.resolve({ data: [] }),
      ]);

      const allOptions = optionsRes.data ?? [];
      const allVotes = votesRes.data ?? [];
      const voteCounts = new Map(
        sessionIds.map((sid, i) => [sid, voteCountsPromises[i].data ?? 0])
      );

      setMySessions(
        sessions.map((s) =>
          sessionFromRow(
            s,
            allOptions.filter((o) => o.session_id === s.id),
            allVotes.filter((v) => v.session_id === s.id),
            voteCounts.get(s.id) ?? 0
          )
        )
      );
    } catch {
      setMySessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all sessions (for browse view)
  const loadAllSessions = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: sessions } = await supabase
        .from("voting_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!sessions) {
        setAllSessions([]);
        setLoading(false);
        return;
      }

      const sessionIds = sessions.map((s) => s.id);

      const revealedIds = sessions.filter((s) => s.phase === "revealed").map((s) => s.id);

      const [optionsRes, voteCountsPromises, votesRes] = await Promise.all([
        supabase
          .from("voting_options")
          .select("*")
          .in("session_id", sessionIds)
          .order("position"),
        Promise.all(
          sessionIds.map((sid) =>
            supabase!.rpc("get_vote_count", { p_session_id: sid })
          )
        ),
        revealedIds.length > 0
          ? supabase
              .from("voting_votes")
              .select("*")
              .in("session_id", revealedIds)
          : Promise.resolve({ data: [] }),
      ]);

      const allOptions = optionsRes.data ?? [];
      const allVotes = votesRes.data ?? [];
      const voteCounts = new Map(
        sessionIds.map((sid, i) => [sid, voteCountsPromises[i].data ?? 0])
      );

      setAllSessions(
        sessions.map((s) =>
          sessionFromRow(
            s,
            allOptions.filter((o) => o.session_id === s.id),
            allVotes.filter((v) => v.session_id === s.id),
            voteCounts.get(s.id) ?? 0
          )
        )
      );
    } catch {
      setAllSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime subscription for current session
  useEffect(() => {
    if (!supabase || !session) return;

    const sessionId = session.id;

    // Subscribe to vote inserts for live progress
    const votesChannel = supabase
      .channel(`votes:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "voting_votes",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Reload session to get updated vote count
          loadSession(sessionId);
        }
      )
      .subscribe();

    // Subscribe to session phase changes
    const sessionChannel = supabase
      .channel(`session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "voting_sessions",
          filter: `id=eq.${sessionId}`,
        },
        () => {
          loadSession(sessionId);
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(votesChannel);
      supabase!.removeChannel(sessionChannel);
    };
  }, [session?.id, loadSession, session]);

  const createSession = useCallback(
    async (
      title: string,
      description: string,
      participantCount: number,
      options: { title: string; description: string; mediaType?: MediaType; mediaUrl?: string; rationale?: string }[],
      previewUrl?: string,
      brief?: { problem?: string; goal?: string; audience?: string; constraints?: string }
    ): Promise<ExplorationSession> => {
      const creatorToken = generateUUID();
      const result = await apiCreateSession({
        title,
        description,
        participantCount,
        options,
        previewUrl,
        ...brief,
        creatorToken,
      });

      setCreatorToken(result.id, creatorToken);

      // Fetch the created session to return it
      const data = await apiGetSession(result.id);
      const newSession = sessionFromRow(data.session, data.options, data.votes, data.voteCount);
      return newSession;
    },
    []
  );

  const deleteSession = useCallback(
    async (id: string) => {
      const token = getCreatorToken(id);
      if (!token) throw new Error("Not the session creator");
      await apiDeleteSession(id, token);
      setMySessions((prev) => prev.filter((s) => s.id !== id));
      if (session?.id === id) setSession(null);
    },
    [session]
  );

  const addOption = useCallback(
    async (
      sessionId: string,
      option: { title: string; description: string; mediaType?: MediaType; mediaUrl?: string; rationale?: string }
    ) => {
      const token = getCreatorToken(sessionId);
      if (!token) throw new Error("Not the session creator");
      await apiAddOption(sessionId, token, option);
      await loadSession(sessionId);
    },
    [loadSession]
  );

  const removeOption = useCallback(
    async (sessionId: string, optionId: string) => {
      const token = getCreatorToken(sessionId);
      if (!token) throw new Error("Not the session creator");
      await apiRemoveOption(sessionId, optionId, token);
      await loadSession(sessionId);
    },
    [loadSession]
  );

  const setParticipantCount = useCallback(
    async (sessionId: string, count: number) => {
      const token = getCreatorToken(sessionId);
      if (!token) throw new Error("Not the session creator");
      await apiUpdateSession(sessionId, token, { participantCount: Math.max(1, count) });
      await loadSession(sessionId);
    },
    [loadSession]
  );

  const startVoting = useCallback(
    async (sessionId: string) => {
      const token = getCreatorToken(sessionId);
      if (!token) throw new Error("Not the session creator");
      await apiUpdateSession(sessionId, token, { phase: "voting" });
      await loadSession(sessionId);
    },
    [loadSession]
  );

  const castVote = useCallback(
    async (
      sessionId: string,
      optionId: string,
      voterName: string,
      comment?: string,
      effort?: string,
      impact?: string
    ) => {
      const voterId = getVoterId();
      await apiCastVote(sessionId, { optionId, voterId, voterName, comment, effort, impact });
      await loadSession(sessionId);
    },
    [loadSession]
  );

  const resetSession = useCallback(
    async (sessionId: string) => {
      const token = getCreatorToken(sessionId);
      if (!token) throw new Error("Not the session creator");
      await apiUpdateSession(sessionId, token, { phase: "setup" });
      await loadSession(sessionId);
    },
    [loadSession]
  );

  const revealResults = useCallback(
    async (sessionId: string) => {
      const token = getCreatorToken(sessionId);
      if (!token) throw new Error("Not the session creator");
      await apiUpdateSession(sessionId, token, { phase: "revealed" });
      await loadSession(sessionId);
    },
    [loadSession]
  );

  const loadComments = useCallback(async (sessionId: string) => {
    try {
      const data = await apiGetComments(sessionId);
      setComments(data.comments.map(commentFromRow));
    } catch {
      setComments([]);
    }
  }, []);

  const addComment = useCallback(
    async (
      sessionId: string,
      optionId: string,
      voterName: string,
      body: string
    ) => {
      const voterId = getVoterId();
      await apiAddComment(sessionId, { optionId, voterId, voterName, body });
      await loadComments(sessionId);
    },
    [loadComments]
  );

  return (
    <SessionContext value={{
      session,
      mySessions,
      allSessions,
      loading,
      loadSession,
      loadMySessions,
      loadAllSessions,
      createSession,
      deleteSession,
      addOption,
      removeOption,
      setParticipantCount,
      startVoting,
      castVote,
      resetSession,
      revealResults,
      comments,
      loadComments,
      addComment,
    }}>
      {children}
    </SessionContext>
  );
}

export function useSessions() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSessions must be used within SessionProvider");
  return ctx;
}
