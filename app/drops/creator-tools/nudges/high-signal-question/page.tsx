import { BellRing, MessageSquareQuote } from "lucide-react";
import { CreatorToolsShell } from "@/components/design/creator-tools-shell";
import { Badge } from "@/components/ui/badge";
import {
  getCreatorToolsPillClass,
  getCreatorToolsToneClass,
} from "@/lib/creator-tools-pill";

export default function CreatorToolsHighSignalPage() {
  return (
    <CreatorToolsShell
      badge="Nudge Detail"
      title="High-Signal Question"
      description="A priority conversation alert triggered by direct creator mention or unusually strong engagement."
      backHref="/drops/creator-tools/nudges"
      backLabel="Back to Nudges"
    >
      <section className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-sm">
        <div className="grid gap-4 p-6 xl:grid-cols-2 md:p-8">
          <div className="rounded-[24px] border border-border/60 bg-secondary/20 p-5">
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="size-4 text-primary" />
              <p className="text-sm font-semibold">Reader prompt</p>
            </div>
            <Badge
              variant="outline"
              className={`mt-4 rounded-full px-3 py-1 ${getCreatorToolsPillClass(
                "High-signal question"
              )}`}
            >
              High-signal question
            </Badge>
            <p className="mt-4 text-base font-bold">
              “Can you share the freezer-friendly version of this meal prep system?”
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              37 replies, direct creator mention, and unusually high notification
              opens in the first hour. This is the type of nudge that should feel
              clearly actionable within seconds.
            </p>
          </div>

          <div
            className={`rounded-[24px] border p-5 ${getCreatorToolsToneClass(
              "High-signal question"
            )}`}
          >
            <div className="flex items-center gap-2">
              <BellRing className="size-4" />
              <p className="text-sm font-semibold">Why the system surfaced it</p>
            </div>
            <div className="mt-4 space-y-2 text-sm opacity-80">
              <p>Crossed engagement threshold.</p>
              <p>Contains a direct creator mention.</p>
              <p>Matches this week’s top-performing theme cluster.</p>
              <p>Deep-links directly to the reply surface.</p>
            </div>
          </div>
        </div>
      </section>
    </CreatorToolsShell>
  );
}
