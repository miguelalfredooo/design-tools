"use client";

import {
  Trophy,
  MessageSquareText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ResearchInsight } from "@/lib/research-types";

const toneConfig = {
  positive: { icon: ThumbsUp, color: "text-emerald-500", label: "Positive" },
  mixed: { icon: Minus, color: "text-amber-500", label: "Mixed" },
  negative: { icon: ThumbsDown, color: "text-red-500", label: "Negative" },
};

interface Props {
  insights: ResearchInsight[];
}

export function SessionInsights({ insights }: Props) {
  const recommendation = insights.find((i) => i.type === "recommendation");
  const sentiments = insights.filter((i) => i.type === "sentiment");
  const commentThemes = insights.filter((i) => i.type === "comment_theme");
  const consensusItems = insights.filter((i) => i.type === "consensus");
  const tensions = insights.filter((i) => i.type === "tension");
  const nextSteps = insights.filter((i) => i.type === "next_step");

  if (insights.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Winner Recommendation */}
      {recommendation && (
        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold">
                Recommendation
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold tracking-tight">
              {recommendation.title}
            </p>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {recommendation.body}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Voter Sentiment per Option */}
      {sentiments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sentiments.map((s) => {
            const tone = (s.metadata as Record<string, unknown>)?.tone as string;
            const config = toneConfig[tone as keyof typeof toneConfig] ?? toneConfig.mixed;
            const ToneIcon = config.icon;
            return (
              <Card key={s.id}>
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      <ToneIcon className={`size-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold truncate">
                          {s.title}
                        </p>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {s.body}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Comment Themes + Consensus/Tensions */}
      {(commentThemes.length > 0 || consensusItems.length > 0 || tensions.length > 0) && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-4">
            {/* Comment Themes */}
            {commentThemes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquareText className="size-4 text-muted-foreground" />
                  Comment Themes
                </div>
                {commentThemes.map((theme) => (
                  <div key={theme.id} className="pl-6 space-y-0.5">
                    <p className="text-sm font-medium">{theme.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {theme.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {(commentThemes.length > 0 && (consensusItems.length > 0 || tensions.length > 0)) && (
              <Separator />
            )}

            {/* Consensus */}
            {consensusItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Agreement
                </div>
                {consensusItems.map((item) => (
                  <p
                    key={item.id}
                    className="text-sm text-muted-foreground pl-6 leading-relaxed"
                  >
                    {item.body}
                  </p>
                ))}
              </div>
            )}

            {/* Tensions */}
            {tensions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Contention
                </div>
                {tensions.map((item) => (
                  <p
                    key={item.id}
                    className="text-sm text-muted-foreground pl-6 leading-relaxed"
                  >
                    {item.body}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowRight className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">
                Next Steps
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {nextSteps.map((step, i) => (
                <div key={step.id} className="flex items-start gap-2.5">
                  <div className="size-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
