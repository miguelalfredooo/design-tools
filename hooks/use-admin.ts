"use client";

import { useCallback, useSyncExternalStore } from "react";

const ADMIN_FLAG_KEY = "design-admin";
const ADMIN_PASSWORD_KEY = "design-admin-password";

// --- Plain function exports (usable outside React) ---

export function isAdminMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_FLAG_KEY) === "1";
}

export function getAdminPassword(): string | null {
  if (typeof window === "undefined") return null;
  if (!isAdminMode()) return null;
  return localStorage.getItem(ADMIN_PASSWORD_KEY);
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
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) return false;

    localStorage.setItem(ADMIN_FLAG_KEY, "1");
    localStorage.setItem(ADMIN_PASSWORD_KEY, password);
    notify();
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_FLAG_KEY);
    localStorage.removeItem(ADMIN_PASSWORD_KEY);
    notify();
  }, []);

  return { isAdmin, login, logout };
}
