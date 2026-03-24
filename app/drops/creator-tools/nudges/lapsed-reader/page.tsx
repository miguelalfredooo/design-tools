import { RotateCcw, Users } from "lucide-react";
import { CreatorToolsShell } from "@/components/design/creator-tools-shell";
import { Badge } from "@/components/ui/badge";
import {
  getCreatorToolsPillClass,
  getCreatorToolsToneClass,
} from "@/lib/creator-tools-pill";

export default function CreatorToolsLapsedReaderPage() {
  return (
    <CreatorToolsShell
      badge="Nudge Detail"
      title="Lapsed Reader Opportunity"
      description="A retention-focused nudge showing when ordinary creator activity may have outsized re-engagement impact."
      backHref="/drops/creator-tools/nudges"
      backLabel="Back to Nudges"
    >
      <section className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-sm">
        <div className="grid gap-4 p-6 md:grid-cols-2 md:p-8">
          <div className="rounded-[24px] border border-border/60 bg-secondary/20 p-5">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <p className="text-sm font-semibold">Re-engagement signal</p>
            </div>
            <Badge
              variant="outline"
              className={`mt-4 rounded-full px-3 py-1 ${getCreatorToolsPillClass(
                "Lapsed reader"
              )}`}
            >
              Lapsed reader
            </Badge>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Two readers who were active two weeks ago both reappeared in the recent
              budget thread after your last reply. The signal is behavioral, not
              identifying, so the creator sees why the moment matters without
              exposing who specifically went quiet.
            </p>
          </div>

          <div
            className={`rounded-[24px] border p-5 ${getCreatorToolsToneClass(
              "Lapsed reader"
            )}`}
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="size-4" />
              <p className="text-sm font-semibold">Suggested action</p>
            </div>
            <p className="mt-4 text-sm leading-6 opacity-80">
              Reply again in the same thread while momentum is still active. The goal is
              not to identify who returned, but to signal that creator presence has
              outsized retention value here.
            </p>
          </div>
        </div>
      </section>
    </CreatorToolsShell>
  );
}
