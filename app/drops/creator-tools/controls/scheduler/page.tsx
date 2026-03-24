import { CalendarClock, Clock3, WandSparkles } from "lucide-react";
import { CreatorToolsShell } from "@/components/design/creator-tools-shell";
import { Badge } from "@/components/ui/badge";
import {
  getCreatorToolsPillClass,
  getCreatorToolsToneClass,
} from "@/lib/creator-tools-pill";

export default function CreatorToolsSchedulerPage() {
  return (
    <CreatorToolsShell
      badge="Controls Detail"
      title="Schedule Post"
      description="Static scheduling flow showing best-time recommendations, queued publish state, and creator review controls."
      backHref="/drops/creator-tools/controls"
      backLabel="Back to Controls"
    >
      <section className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/60 px-6 py-5 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <CalendarClock className="size-4 text-primary" />
                Scheduler
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                My 5-ingredient breakfast reset
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This mock flow shows how a creator or team member schedules a post during
                the audience’s strongest engagement window.
              </p>
            </div>
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1 ${getCreatorToolsPillClass("Scheduled")}`}
            >
              Queued for tomorrow
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 p-6 xl:grid-cols-2 md:p-8">
          <div className="rounded-[24px] border border-border/60 bg-secondary/20 p-5">
            <p className="text-sm font-semibold">Composer snapshot</p>
            <div className="mt-4 rounded-2xl border border-border/60 bg-background p-4 text-sm text-muted-foreground">
              Five breakfast ideas I can prep in one short Sunday reset. Want the grocery
              list too?
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SchedulerField label="Publish date" value="Tomorrow" />
              <SchedulerField label="Publish time" value="8:30 AM" />
              <SchedulerField label="Posted as" value="Miguel Arias" />
              <SchedulerField label="Disclosure" value="Creator-authored" />
            </div>
          </div>

          <div className="space-y-4">
            <div
              className={`rounded-[24px] border p-5 ${getCreatorToolsToneClass(
                "Scheduled"
              )}`}
            >
              <div className="flex items-center gap-2">
                <WandSparkles className="size-4" />
                <p className="text-sm font-semibold">AI-recommended window</p>
              </div>
              <p className="mt-3 text-lg font-bold">Tomorrow, 8:30 AM</p>
              <p className="mt-2 text-sm leading-6 opacity-80">
                Based on your strongest weekday morning click-through and current comment
                momentum.
              </p>
            </div>

            <div className="rounded-[24px] border border-border/60 bg-secondary/20 p-5">
              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-primary" />
                <p className="text-sm font-semibold">Scheduling rules</p>
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>Edit or cancel until 15 minutes before publish.</p>
                <p>Scheduled posts remain private to the creator and team.</p>
                <p>Team-submitted posts require creator approval if disclosure is enabled.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </CreatorToolsShell>
  );
}

function SchedulerField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
