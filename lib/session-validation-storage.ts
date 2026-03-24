import type { ExplorationSession, SessionValidation } from "@/lib/design-types";

export const VALIDATION_STATE_KEY = "design-session-validation";

export function getValidationStateMap(): Record<string, SessionValidation> {
  try {
    return JSON.parse(localStorage.getItem(VALIDATION_STATE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function setValidationStateMap(map: Record<string, SessionValidation>) {
  localStorage.setItem(VALIDATION_STATE_KEY, JSON.stringify(map));
}

export function saveSessionValidation(sessionId: string, validation: SessionValidation) {
  const currentMap = getValidationStateMap();
  currentMap[sessionId] = validation;
  setValidationStateMap(currentMap);
}

export function getSessionValidation(sessionId: string): SessionValidation | undefined {
  return getValidationStateMap()[sessionId];
}

export function mergeSessionValidation(session: ExplorationSession): ExplorationSession {
  return {
    ...session,
    validation: getSessionValidation(session.id) ?? { state: "unverified" },
  };
}
