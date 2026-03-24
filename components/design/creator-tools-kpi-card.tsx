"use client";

import { TrendingUp } from "lucide-react";
import type { DataConfidenceMeta } from "@/lib/data-confidence";
import { CreatorToolsConfidenceBadge } from "@/components/design/creator-tools-confidence-badge";
import { creatorToolsInsetSurfaceClass } from "@/lib/creator-tools-surfaces";

export function CreatorToolsKpiCard({
  label,
  value,
  delta,
  detail,
  tone,
  confidence,
}: {
  label: string;
  value: string;
  delta: string;
  detail: string;
  tone: "positive" | "neutral";
  confidence: DataConfidenceMeta;
}) {
  return (
    <div className={creatorToolsInsetSurfaceClass}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
      <div
        className={`mt-2 flex items-center gap-2 text-sm ${
          tone === "positive" ? "text-emerald-600" : "text-muted-foreground"
        }`}
      >
        <TrendingUp className="size-4" />
        <span>{delta}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      <CreatorToolsConfidenceBadge confidence={confidence} className="mt-3" />
    </div>
  );
}
