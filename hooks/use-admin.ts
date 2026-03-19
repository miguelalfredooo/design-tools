"use client";

import { useCallback, useSyncExternalStore } from "react";

const ADMIN_FLAG_KEY = "design-admin";

// --- Plain function exports (usable outside React) ---

export function isAdminMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_FLAG_KEY) === "1";
}

// --- External store for React hook ---

let listeners: Array<() => void> = [];

function subscribe(cb: () => void) {
  listeners = [...listeners, cb];
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function notify() {
  listeners.forEach((l) => l());
}

function getSnapshot(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(ADMIN_FLAG_KEY) === "1";
}

function getServerSnapshot(): boolean {
  return false;
}

// --- React hook ---

export function useAdmin() {
  const isAdmin = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const login = useCallback(async (password: string): Promise<boolean> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      credentials: "include",
    });
    if (!res.ok) return false;

    localStorage.setItem(ADMIN_FLAG_KEY, "1");
    notify();
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_FLAG_KEY);
    notify();
  }, []);

  return { isAdmin, login, logout };
}
