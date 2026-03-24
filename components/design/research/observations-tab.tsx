"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Link2,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AREA_TAGS, type Observation } from "@/lib/research-hub-types";

function ObservationForm({ onSubmit, projectId }: { onSubmit: () => void; projectId: string }) {
  const [body, setBody] = useState("");
  const [area, setArea] = useState<string>(AREA_TAGS[0]);
  const [customArea, setCustomArea] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contributor =
    typeof window !== "undefined"
      ? localStorage.getItem("research-contributor") || ""
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setSubmitting(true);
    try {
      const finalArea = area === "__custom" ? customArea : area;
      const res = await fetch("/api/design/research/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          area: finalArea,
          contributor: contributor || null,
          sourceUrl: sourceUrl || null,
          projectId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
        return;
      }
      setBody("");
      setSourceUrl("");
      setShowSource(false);
      onSubmit();
      toast.success("Observation logged");
    } catch {
      toast.error("Failed to save observation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="What did you observe? e.g. 'User hovered over share button for 12s before giving up'"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-[80px] resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {AREA_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
          <option value="__custom">+ Custom tag</option>
        </select>

        {area === "__custom" && (
          <Input
            placeholder="Custom area..."
            value={customArea}
            onChange={(e) => setCustomArea(e.target.value)}
            className="h-9 w-40"
          />
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
          onClick={() => setShowSource(!showSource)}
        >
          <Link2 className="size-3.5" />
          Source
        </Button>

        <div className="flex-1" />

        <span className="text-[10px] text-muted-foreground">{"\u2318"}+Enter to submit</span>

        <Button type="submit" size="sm" disabled={submitting || !body.trim()}>
          {submitting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          Log
        </Button>
      </div>

      {showSource && (
        <Input
          placeholder="Mixpanel replay URL, Slack link, etc."
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className="h-9"
        />
      )}
    </form>
  );
}


function ObservationCard({
  observation,
  selected,
  onToggle,
}: {
  observation: Observation;
  selected: boolean;
  onToggle: () => void;
}) {
  const timeAgo = getTimeAgo(new Date(observation.createdAt));

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors",
        selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      )}
      onClick={onToggle}
    >
      <CardContent className="flex items-start gap-3 p-3">
        <div
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
            selected ? "border-primary bg-primary" : "border-muted-foreground/30"
          )}
        >
          {selected && <Check className="size-2.5 text-primary-foreground" />}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm leading-relaxed">{observation.body}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {observation.area}
            </Badge>
            {observation.contributor && (
              <span className="text-[10px] text-muted-foreground">
                {observation.contributor}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
            {observation.sourceUrl && (
              <a
                href={observation.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Source
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}


export function ObservationsTab({ projectId }: { projectId: string }) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeArea, setActiveArea] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [synthesizing, setSynthesizing] = useState(false);

  const fetchObservations = useCallback(async () => {
    const res = await fetch(`/api/design/research/observations?projectId=${projectId}`);
    if (res.ok) setObservations(await res.json());
    setLoading(false);
  }, [projectId]);

  useEffect(() => { void fetchObservations(); }, [fetchObservations]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSynthesize() {
    if (selected.size === 0) return;
    setSynthesizing(true);
    try {
      const res = await fetch("/api/design/research/observe-synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observationIds: [...selected], projectId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Synthesis failed"); return; }
      toast.success(`Synthesized ${data.insightCount} insights${data.newSegments > 0 ? ` + ${data.newSegments} new segments` : ""}`);
      setSelected(new Set());
    } catch {
      toast.error("Synthesis failed");
    } finally {
      setSynthesizing(false);
    }
  }

  // Build area tabs from loaded data, sorted by count desc
  const areaCounts: Record<string, number> = {};
  for (const o of observations) areaCounts[o.area] = (areaCounts[o.area] || 0) + 1;
  const areas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).map(([area]) => area);

  const visible = activeArea === "all" ? observations : observations.filter((o) => o.area === activeArea);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-4">
          <ObservationForm onSubmit={fetchObservations} projectId={projectId} />
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : observations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No observations yet.</p>
            <p className="mt-1 text-xs">Log your first observation above, or share the link with your team.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Area tab strip */}
          <div className="flex items-center gap-0.5 border-b border-border -mx-1 px-1 overflow-x-auto">
            <button
              onClick={() => setActiveArea("all")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap rounded-t-md transition-colors border-b-2 -mb-px shrink-0",
                activeArea === "all"
                  ? "border-primary text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              All
              <span className="text-[10px] tabular-nums text-muted-foreground">{observations.length}</span>
            </button>
            {areas.map((area) => (
              <button
                key={area}
                onClick={() => setActiveArea(area)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap rounded-t-md transition-colors border-b-2 -mb-px shrink-0",
                  activeArea === area
                    ? "border-primary text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {area}
                <span className="text-[10px] tabular-nums text-muted-foreground">{areaCounts[area]}</span>
              </button>
            ))}
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSelected(new Set(visible.map((o) => o.id)))}>
              Select all ({visible.length})
            </Button>
            {selected.size > 0 && (
              <>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
                <Button size="sm" className="h-8 gap-1.5" onClick={handleSynthesize} disabled={synthesizing}>
                  {synthesizing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  Synthesize ({selected.size})
                </Button>
              </>
            )}
          </div>

          {/* Observations list */}
          <div className="grid grid-cols-2 gap-2">
            {visible.map((obs) => (
              <ObservationCard key={obs.id} observation={obs} selected={selected.has(obs.id)} onToggle={() => toggleSelect(obs.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
