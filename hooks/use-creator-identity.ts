"use client";

import { useMemo } from "react";
import { getCreatorToken } from "@/lib/design-store";
import { isAdminMode } from "@/hooks/use-admin";
import type { ExplorationSession } from "@/lib/design-types";

/**
 * Check if the current browser is the creator of a session.
 * Returns true if admin mode is active (full privileges on all sessions)
 * or if the creatorToken in localStorage matches the session's creator_token.
 */
export function useIsCreator(session: ExplorationSession | null): boolean {
  return useMemo(() => {
    if (!session) return false;
    if (isAdminMode()) return true;
    const token = getCreatorToken(session.id);
    return token !== null && token === session.creatorToken;
  }, [session]);
}
