"use client";

import { Badge } from "@/components/ui/badge";
import { dataConfidenceCopy, type DataConfidenceMeta } from "@/lib/data-confidence";

export function CreatorToolsConfidenceBadge({
  confidence,
  className = "",
}: {
  confidence: DataConfidenceMeta;
  className?: string;
}) {
  const badge = dataConfidenceCopy[confidence.state];

  return (
    <div className={className}>
      <Badge variant="outline" className={badge.className}>
        {badge.badge}
      </Badge>
      <p className="mt-2 text-xs text-muted-foreground">
        {confidence.source}
        {confidence.verifiedAt ? ` · Verified ${confidence.verifiedAt}` : ""}
        {confidence.note ? ` · ${confidence.note}` : ""}
      </p>
    </div>
  );
}
