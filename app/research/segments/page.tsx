"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Target,
  AlertTriangle,
  Lightbulb,
  Zap,
  Link2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  type Segment,
  type SegmentItem,
  type Bucket,
  BUCKET_LABELS,
} from "@/lib/research-hub-types";

const BUCKET_ICONS: Record<Bucket, typeof Target> = {
  needs: Target,
  pain_points: AlertTriangle,
  opportunities: Lightbulb,
  actionable_insights: Zap,
};

const BUCKET_COLORS: Record<Bucket, string> = {
  needs: "text-sky-500",
  pain_points: "text-red-500",
  opportunities: "text-amber-500",
  actionable_insights: "text-emerald-500",
};

// ── Add Segment Form ────────────────────────────────────────────────────────

function AddSegmentForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/design/research/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create segment");
        return;
      }
      setName("");
      setDescription("");
      setOpen(false);
      onCreated();
      toast.success("Segment created");
    } catch {
      toast.error("Failed to create segment");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Plus className="size-3.5" />
        Add Segment
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Segment name (e.g. Active Members)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting || !name.trim()}>
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Segment Card ────────────────────────────────────────────────────────────

function SegmentCard({ segment }: { segment: Segment }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<SegmentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/design/research/segments/${segment.id}/items`
    );
    if (res.ok) {
      setItems(await res.json());
    }
    setLoading(false);
  }, [segment.id]);

  async function handleToggle() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    if (nextExpanded && items.length === 0) {
      await fetchItems();
    }
  }

  const bucketCounts: Partial<Record<Bucket, number>> = {};
  for (const item of items) {
    bucketCounts[item.bucket] = (bucketCounts[item.bucket] || 0) + 1;
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <button
          onClick={() => {
            void handleToggle();
          }}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          )}
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{segment.name}</p>
            {segment.description && (
              <p className="text-xs text-muted-foreground truncate">
                {segment.description}
              </p>
            )}
          </div>
          {items.length > 0 && (
            <div className="flex gap-1.5">
              {(Object.entries(bucketCounts) as [Bucket, number][]).map(
                ([bucket, count]) => {
                  const Icon = BUCKET_ICONS[bucket];
                  return (
                    <div
                      key={bucket}
                      className="flex items-center gap-0.5"
                      title={BUCKET_LABELS[bucket]}
                    >
                      <Icon className={`size-3 ${BUCKET_COLORS[bucket]}`} />
                      <span className="text-[10px] text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </button>

        {/* Expanded Content */}
        {expanded && (
          <div className="border-t border-border px-4 pb-4 pt-3">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No insights yet. Synthesize observations to populate this
                segment.
              </p>
            ) : (
              <div className="space-y-4">
                {(
                  [
                    "needs",
                    "pain_points",
                    "opportunities",
                    "actionable_insights",
                  ] as Bucket[]
                ).map((bucket) => {
                  const bucketItems = items.filter(
                    (i) => i.bucket === bucket
                  );
                  if (bucketItems.length === 0) return null;
                  const Icon = BUCKET_ICONS[bucket];
                  return (
                    <div key={bucket}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Icon
                          className={`size-3.5 ${BUCKET_COLORS[bucket]}`}
                        />
                        <span className="text-xs font-semibold">
                          {BUCKET_LABELS[bucket]}
                        </span>
                        <Badge variant="secondary" className="text-[9px]">
                          {bucketItems.length}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 pl-5">
                        {bucketItems.map((item) => (
                          <div key={item.id} className="space-y-0.5">
                            <p className="text-sm font-medium">{item.title}</p>
                            {item.body && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {item.body}
                              </p>
                            )}
                            {item.sourceObservationIds &&
                              item.sourceObservationIds.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Link2 className="size-2.5 text-muted-foreground/50" />
                                  <span className="text-[9px] text-muted-foreground/50">
                                    {item.sourceObservationIds.length} source
                                    observation
                                    {item.sourceObservationIds.length !== 1
                                      ? "s"
                                      : ""}
                                  </span>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSegments = useCallback(async () => {
    const res = await fetch("/api/design/research/segments");
    if (res.ok) {
      setSegments(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSegments() {
      const res = await fetch("/api/design/research/segments");
      if (!res.ok || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      setSegments(await res.json());
      setLoading(false);
    }

    void loadSegments();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex justify-center min-w-0 pt-6 pb-12 px-4">
      <div className="w-full max-w-[720px] min-w-0 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              User Segments
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Knowledge base of user needs, pain points, and opportunities —
              built from synthesized observations.
            </p>
          </div>
          <AddSegmentForm onCreated={fetchSegments} />
        </div>

        {/* Segments List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : segments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Users className="size-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium">No segments defined yet</p>
              <p className="text-xs mt-1">
                Create segments like &quot;Active Members&quot;,
                &quot;Creators&quot;, or &quot;New Users from Invite&quot; to
                organize your research.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {segments.map((segment) => (
              <SegmentCard key={segment.id} segment={segment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
