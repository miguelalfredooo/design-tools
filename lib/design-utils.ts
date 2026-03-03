/** Generate a short, unique ID (for local-only use like form keys). */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Generate a UUID v4 (for voter/creator tokens stored in localStorage). */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Deterministic shuffle using a seed string (e.g. voterId).
 * Returns a new array with elements shuffled consistently for the same seed.
 */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  // Simple hash from seed string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  // Fisher-Yates with seeded pseudo-random
  for (let i = arr.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = Math.abs(hash) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
