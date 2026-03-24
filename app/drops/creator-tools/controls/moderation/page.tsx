import { EyeOff, ShieldCheck } from "lucide-react";
import { CreatorToolsShell } from "@/components/design/creator-tools-shell";
import { Badge } from "@/components/ui/badge";
import {
  getCreatorToolsPillClass,
  getCreatorToolsToneClass,
} from "@/lib/creator-tools-pill";

export default function CreatorToolsModerationPage() {
  return (
    <CreatorToolsShell
      badge="Controls Detail"
      title="Moderation Actions"
      description="Static moderation view showing hide, preserve, and review decisions without deleting discussion history."
      backHref="/drops/creator-tools/controls"
      backLabel="Back to Controls"
    >
      <section className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-sm">
        <div className="grid gap-4 p-6 md:grid-cols-2 md:p-8">
          <div className="rounded-[24px] border border-border/60 bg-secondary/20 p-5">
            <div className="flex items-center gap-2">
              <EyeOff className="size-4 text-primary" />
              <p className="text-sm font-semibold">Hide duplicate promo thread</p>
            </div>
            <Badge
              variant="outline"
              className={`mt-4 rounded-full px-3 py-1 ${getCreatorToolsPillClass(
                "Control"
              )}`}
            >
              Reversible moderation
            </Badge>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Two moderators flagged the thread as redundant. The post can be hidden from
              the public feed while preserving creator history and internal context.
            </p>
          </div>

          <div
            className={`rounded-[24px] border p-5 ${getCreatorToolsToneClass(
              "Control"
            )}`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              <p className="text-sm font-semibold">Why this matters</p>
            </div>
            <div className="mt-4 space-y-2 text-sm opacity-80">
              <p>Creators keep control without the stress of permanent deletion.</p>
              <p>Moderation stays lightweight and reversible.</p>
              <p>Reader-facing quality improves without heavy-handed workflow.</p>
            </div>
          </div>
        </div>
      </section>
    </CreatorToolsShell>
  );
}
