"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getVoterId } from "@/lib/design-store";

const STORAGE_KEY = "voter-identity";

function getSnapshot() {
  return sessionStorage.getItem(STORAGE_KEY) ?? "";
}

function getServerSnapshot() {
  return "";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useVoterIdentity() {
  const name = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setName = useCallback((newName: string) => {
    sessionStorage.setItem(STORAGE_KEY, newName);
    window.dispatchEvent(new Event("storage"));
  }, []);

  const clearName = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("storage"));
  }, []);

  /** Stable voter ID from localStorage (persists across tabs/sessions) */
  const voterId = typeof window !== "undefined" ? getVoterId() : "";

  return { name, setName, clearName, voterId };
}
