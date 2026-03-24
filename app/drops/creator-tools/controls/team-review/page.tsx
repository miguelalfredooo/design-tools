import { ShieldCheck, Users } from "lucide-react";
import { CreatorToolsShell } from "@/components/design/creator-tools-shell";
import { Badge } from "@/components/ui/badge";
import {
  getCreatorToolsPillClass,
  getCreatorToolsToneClass,
} from "@/lib/creator-tools-pill";

export default function CreatorToolsTeamReviewPage() {
  return (
    <CreatorToolsShell
      badge="Controls Detail"
      title="Team Review"
      description="Static approval state for a team-authored draft that will publish as the creator with visible disclosure."
      backHref="/drops/creator-tools/controls"
      backLabel="Back to Controls"
    >
      <section className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-sm">
        <div className="grid gap-4 p-6 xl:grid-cols-2 md:p-8">
          <div className="rounded-[24px] border border-border/60 bg-secondary/20 p-5">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <p className="text-sm font-semibold">Draft awaiting approval</p>
            </div>
            <Badge
              variant="outline"
              className={`mt-4 rounded-full px-3 py-1 ${getCreatorToolsPillClass(
                "Awaiting review"
              )}`}
            >
              Awaiting review
            </Badge>
            <p className="mt-4 text-lg font-bold">Sunday prep Q&A follow-up</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Drafted by Team on Wednesday at 4:12 PM. Proposed publish time: Thursday,
              9:00 AM.
            </p>
            <div className="mt-4 rounded-2xl border border-border/60 bg-background p-4 text-sm text-muted-foreground">
              A lot of you asked for the pantry staples behind my Sunday prep workflow, so
              I pulled them together here before tomorrow’s batch-cooking AMA.
            </div>
          </div>

          <div
            className={`rounded-[24px] border p-5 ${getCreatorToolsToneClass(
              "Control"
            )}`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              <p className="text-sm font-semibold">Reader-facing disclosure</p>
            </div>
            <p className="mt-4 text-sm leading-6 opacity-80">
              By Miguel Arias • Posted by Team • Scheduled for Thu at 9:00 AM
            </p>
            <div className="mt-4 space-y-2 text-sm opacity-80">
              <p>Approval keeps the creator as the visible author.</p>
              <p>Disclosure preserves trust without undermining the team workflow.</p>
              <p>Edits remain versioned for creator review before publish.</p>
            </div>
          </div>
        </div>
      </section>
    </CreatorToolsShell>
  );
}
