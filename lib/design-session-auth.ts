"use client";

import { generateUUID } from "./design-utils";

const CREATOR_TOKENS_KEY = "design-creator-tokens";
const VOTER_ID_KEY = "design-voter-id";

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getCreatorTokens(): Record<string, string> {
  return readJsonStorage(CREATOR_TOKENS_KEY, {});
}

export function setCreatorToken(sessionId: string, token: string) {
  const tokens = getCreatorTokens();
  tokens[sessionId] = token;
  localStorage.setItem(CREATOR_TOKENS_KEY, JSON.stringify(tokens));
}

export function getCreatorToken(sessionId: string): string | null {
  return getCreatorTokens()[sessionId] ?? null;
}

export function getVoterId(): string {
  let id = localStorage.getItem(VOTER_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(VOTER_ID_KEY, id);
  }
  return id;
}
