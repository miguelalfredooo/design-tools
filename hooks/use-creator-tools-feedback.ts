"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useVoterIdentity } from "@/hooks/use-voter-identity";
import type {
  CreatorToolsFeedbackEntry,
  CreatorToolsFeedbackReactionType,
  CreatorToolsFeedbackSummary,
  CreatorToolsFeedbackTarget,
} from "@/lib/creator-tools-feedback-types";
import { creatorToolsFeedbackReactionOrder } from "@/lib/creator-tools-feedback-types";
import { seedCreatorToolsFeedback } from "@/lib/mock/creator-tools-feedback";

const STORAGE_KEY = "creator-tools-feedback";
const CHANGE_EVENT = "creator-tools-feedback-change";
const EMPTY_ENTRIES: CreatorToolsFeedbackEntry[] = [];

let cachedEntries: CreatorToolsFeedbackEntry[] | null = null;

function readEntries(): CreatorToolsFeedbackEntry[] {
  if (typeof window === "undefined") return EMPTY_ENTRIES;
  if (cachedEntries) return cachedEntries;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCreatorToolsFeedback));
    cachedEntries = seedCreatorToolsFeedback;
    return cachedEntries;
  }

  try {
    cachedEntries = JSON.parse(stored) as CreatorToolsFeedbackEntry[];
    return cachedEntries;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCreatorToolsFeedback));
    cachedEntries = seedCreatorToolsFeedback;
    return cachedEntries;
  }
}

function writeEntries(entries: CreatorToolsFeedbackEntry[]) {
  cachedEntries = entries;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot() {
  return readEntries();
}

function getServerSnapshot() {
  return EMPTY_ENTRIES;
}

function buildSummary(
  entries: CreatorToolsFeedbackEntry[],
  target: CreatorToolsFeedbackTarget,
  voterId: string
): CreatorToolsFeedbackSummary {
  const scoped = entries.filter(
    (entry) =>
      entry.page === target.page &&
      entry.targetType === target.targetType &&
      entry.targetId === target.targetId
  );

  const counts = {
    working: 0,
    unclear: 0,
    not_useful: 0,
    promising: 0,
  };

  for (const entry of scoped) {
    if (entry.reaction) counts[entry.reaction] += 1;
  }

  return {
    counts,
    entries: scoped.sort((a, b) => b.updatedAt - a.updatedAt),
    currentEntry: scoped.find((entry) => entry.voterId === voterId) ?? null,
  };
}

export function useCreatorToolsFeedback(target: CreatorToolsFeedbackTarget) {
  const entries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { voterId, name } = useVoterIdentity();
  const summary = buildSummary(entries, target, voterId);

  const setReaction = useCallback(
    (reaction: CreatorToolsFeedbackReactionType) => {
      const now = Date.now();
      const existing = summary.currentEntry;

      if (existing) {
        writeEntries(
          entries.map((entry) =>
            entry.id === existing.id
              ? {
                  ...entry,
                  reaction,
                  voterName: name || entry.voterName,
                  updatedAt: now,
                }
              : entry
          )
        );
        return;
      }

      writeEntries([
        ...entries,
        {
          id: `${target.targetId}:${voterId}`,
          page: target.page,
          targetType: target.targetType,
          targetId: target.targetId,
          voterId,
          voterName: name || null,
          reaction,
          note: null,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    },
    [entries, name, summary.currentEntry, target, voterId]
  );

  const saveNote = useCallback(
    (note: string) => {
      const trimmed = note.trim();
      if (!trimmed) return;

      const now = Date.now();
      const existing = summary.currentEntry;

      if (existing) {
        writeEntries(
          entries.map((entry) =>
            entry.id === existing.id
              ? {
                  ...entry,
                  note: trimmed,
                  voterName: name || entry.voterName,
                  updatedAt: now,
                }
              : entry
          )
        );
        return;
      }

      writeEntries([
        ...entries,
        {
          id: `${target.targetId}:${voterId}`,
          page: target.page,
          targetType: target.targetType,
          targetId: target.targetId,
          voterId,
          voterName: name || null,
          reaction: null,
          note: trimmed,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    },
    [entries, name, summary.currentEntry, target, voterId]
  );

  return {
    ...summary,
    reactionOrder: creatorToolsFeedbackReactionOrder,
    setReaction,
    saveNote,
  };
}
