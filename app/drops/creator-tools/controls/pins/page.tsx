import { Pin } from "lucide-react";
import { CreatorToolsRankBadge } from "@/components/design/creator-tools-rank-badge";
import { CreatorToolsShell } from "@/components/design/creator-tools-shell";
import { Badge } from "@/components/ui/badge";
import { getCreatorToolsPillClass } from "@/lib/creator-tools-pill";
import { pinnedPosts } from "@/lib/mock/creator-tools";

export default function CreatorToolsPinsPage() {
  return (
    <CreatorToolsShell
      badge="Controls Detail"
      title="Pinned Posts"
      description="Static pin management view showing the three available top-of-feed slots and what each one is currently doing."
      backHref="/drops/creator-tools/controls"
      backLabel="Back to Controls"
    >
      <section className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-sm">
        <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
          {pinnedPosts.map((post, index) => (
            <div key={post.title} className="rounded-[24px] border border-border/60 bg-secondary/20 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CreatorToolsRankBadge rank={index + 1} />
                  <Pin className="size-4 text-primary" />
                  <p className="text-sm font-semibold">Pin slot</p>
                </div>
                <Badge
                  variant="outline"
                  className={`rounded-full px-3 py-1 ${getCreatorToolsPillClass("Control")}`}
                >
                  Pinning
                </Badge>
              </div>
              <p className="mt-4 text-base font-bold">{post.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.note}</p>
            </div>
          ))}
        </div>
      </section>
    </CreatorToolsShell>
  );
}
