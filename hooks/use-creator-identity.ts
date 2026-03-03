"use client";

import { useMemo } from "react";
import { getCreatorToken } from "@/lib/design-store";
import type { ExplorationSession } from "@/lib/design-types";

/**
 * Check if the current browser is the creator of a session.
 * Compares the creatorToken in localStorage with the session's creator_token.
 */
export function useIsCreator(session: ExplorationSession | null): boolean {
  return useMemo(() => {
    if (!session) return false;
    const token = getCreatorToken(session.id);
    return token !== null && token === session.creatorToken;
  }, [session]);
}
