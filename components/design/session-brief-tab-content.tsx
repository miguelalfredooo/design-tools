"use client";

import type { ExplorationSession } from "@/lib/design-types";
import { SessionBrief } from "@/components/design/session-brief";

export function SessionBriefTabContent({
  session,
}: {
  session: ExplorationSession;
  isCreator: boolean;
  onUpdateValidation: (updates: Partial<unknown>) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <SessionBrief session={session} />
    </div>
  );
}
