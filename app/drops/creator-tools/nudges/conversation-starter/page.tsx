import { MessageSquareQuote, WandSparkles } from "lucide-react";
import { CreatorToolsRankBadge } from "@/components/design/creator-tools-rank-badge";
import { CreatorToolsShell } from "@/components/design/creator-tools-shell";
import { Badge } from "@/components/ui/badge";
import { getCreatorToolsPillClass } from "@/lib/creator-tools-pill";

export default function CreatorToolsConversationStarterPage() {
  return (
    <CreatorToolsShell
      badge="Nudge Detail"
      title="Conversation Starter"
      description="A low-activity recovery state that proposes prompt ideas based on recent engagement themes."
      backHref="/drops/creator-tools/nudges"
      backLabel="Back to Nudges"
    >
      <section className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/60 px-6 py-5 md:px-8">
          <h2 className="text-2xl font-black tracking-tight">Suggested prompts</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            When engagement drops below the creator&apos;s recent average, the
            system suggests three editable conversation starters instead of
            leaving the creator with a blank page.
          </p>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
          {[
            "What pantry shortcut saves you the most money each week?",
            "What meal do you always prep first when life gets chaotic?",
            "Which grocery reset habit changed your week the most?",
          ].map((prompt, index) => (
            <div key={prompt} className="rounded-[24px] border border-border/60 bg-secondary/20 p-5">
              <div className="flex items-center gap-2">
                <CreatorToolsRankBadge rank={index + 1} />
                {index === 0 ? <WandSparkles className="size-4 text-primary" /> : <MessageSquareQuote className="size-4 text-primary" />}
                <p className="text-sm font-semibold">Prompt option</p>
              </div>
              <Badge
                variant="outline"
                className={`mt-4 rounded-full px-3 py-1 ${getCreatorToolsPillClass(
                  "Conversation starter"
                )}`}
              >
                Conversation starter
              </Badge>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{prompt}</p>
            </div>
          ))}
        </div>
      </section>
    </CreatorToolsShell>
  );
}
