/** Generate a short, unique ID (for local-only use like form keys). */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Generate a UUID v4 (for voter/creator tokens stored in localStorage). */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/** Extract initials from a name/title string (up to 2 characters). */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const VOTER_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

/** Deterministic color for a voter based on their ID. */
export function getVoterColor(voterId: string): string {
  let hash = 0;
  for (let i = 0; i < voterId.length; i++) {
    hash = ((hash << 5) - hash + voterId.charCodeAt(i)) | 0;
  }
  return VOTER_COLORS[Math.abs(hash) % VOTER_COLORS.length];
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
