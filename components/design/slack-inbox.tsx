"use client";

import { useCallback, useEffect, useState } from "react";
import { Hash, Loader2, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Observation } from "@/lib/research-hub-types";

const CHANNEL_META: Record<string, { label: string; description: string }> = {
  "community-watchdawgs": {
    label: "Community Watch Dawgs",
    description: "General community feedback and watchdog reports",
  },
  "community-tech-support": {
    label: "Community Tech Support",
    description: "Technical support requests and bug reports from community",
  },
  "community-content-escalations": {
    label: "Community Content Escalations",
    description: "Content moderation escalations and policy flags",
  },
};

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

function ChannelSyncCard({
  channelName,
  onSynced,
}: {
  channelName: string;
  onSynced: () => void;
}) {
  const meta = CHANNEL_META[channelName] ?? { label: `#${channelName}`, description: "" };
  const [days, setDays] = useState("7");
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<{ inserted: number; messagesProcessed: number } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/design/research/slack-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelName,
          days: Number(days),
          projectId: null,
        }),
      });
      const data = await res.json() as {
        inserted?: number;
        skipped?: number;
        messagesProcessed?: number;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Sync failed");
        return;
      }
      if (data.message) {
        toast.info(data.message);
      } else {
        toast.success(`Pulled ${data.inserted} new observations from #${channelName}`);
        setLastResult({
          inserted: data.inserted ?? 0,
          messagesProcessed: data.messagesProcessed ?? 0,
        });
        onSynced();
      }
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#4A154B]/10 mt-0.5">
            <Hash className="size-4 text-[#4A154B] dark:text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{meta.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{meta.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex items-center gap-2 mt-1">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 days</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" className="h-8 gap-1.5" onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            {syncing ? "Syncing…" : "Sync"}
          </Button>

          {lastResult && (
            <span className="text-[11px] text-muted-foreground">
              {lastResult.inserted} added · {lastResult.messagesProcessed} msgs scanned
            </span>
          )}
        </div>
      </CardContent>
    </Card>
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
            {observation.sourceUrl?.startsWith("slack://") && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Hash className="size-2.5" />
                {observation.sourceUrl.slice("slack://".length)}
              </span>
            )}
            {observation.contributor && (
              <span className="text-[10px] text-muted-foreground">
                {observation.contributor}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SlackInbox() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState<string>("all");
  const [activeArea, setActiveArea] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchObservations = useCallback(async () => {
    const res = await fetch("/api/design/research/observations?projectId=null");
    if (res.ok) setObservations(await res.json() as Observation[]);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchObservations(); }, [fetchObservations]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Parse channel name from source_url (stored as "slack://<channelName>")
  function channelFromObs(obs: Observation): string | null {
    if (!obs.sourceUrl?.startsWith("slack://")) return null;
    return obs.sourceUrl.slice("slack://".length);
  }

  // Channel counts from loaded observations
  const channelCounts: Record<string, number> = {};
  for (const o of observations) {
    const ch = channelFromObs(o);
    if (ch) channelCounts[ch] = (channelCounts[ch] || 0) + 1;
  }
  const obsChannels = Object.keys(channelCounts).sort();

  // Filter by active channel first, then by area
  const byChannel = activeChannel === "all"
    ? observations
    : observations.filter((o) => channelFromObs(o) === activeChannel);

  const areaCounts: Record<string, number> = {};
  for (const o of byChannel) areaCounts[o.area] = (areaCounts[o.area] || 0) + 1;
  const areas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).map(([area]) => area);
  const visible = activeArea === "all" ? byChannel : byChannel.filter((o) => o.area === activeArea);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Slack Inbox</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pull feedback from monitored channels and review extracted observations.
        </p>
      </div>

      {/* Channel cards */}
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground/80 uppercase mb-3">Channels</p>

        <div className="grid grid-cols-3 gap-3">
          {Object.keys(CHANNEL_META).map((name) => (
            <ChannelSyncCard key={name} channelName={name} onSynced={fetchObservations} />
          ))}
        </div>
      </div>

      {/* Observations */}
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground/80 uppercase mb-3">Observations</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : observations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No observations yet.</p>
              <p className="mt-1 text-xs">Sync a channel above to pull in feedback.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Channel tabs */}
            {obsChannels.length > 1 && (
              <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                <button
                  onClick={() => { setActiveChannel("all"); setActiveArea("all"); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors border",
                    activeChannel === "all"
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  All channels
                  <span className="tabular-nums opacity-70">{observations.length}</span>
                </button>
                {obsChannels.map((ch) => {
                  const meta = CHANNEL_META[ch];
                  return (
                    <button
                      key={ch}
                      onClick={() => { setActiveChannel(ch); setActiveArea("all"); }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors border",
                        activeChannel === ch
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      )}
                    >
                      <Hash className="size-3 shrink-0" />
                      {meta?.label ?? ch}
                      <span className="tabular-nums opacity-70">{channelCounts[ch]}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Area tabs */}
            <div className="flex items-center gap-0.5 border-b border-border -mx-1 px-1 overflow-x-auto mb-4">
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
                <span className="text-[10px] tabular-nums text-muted-foreground">{byChannel.length}</span>
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
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setSelected(new Set(visible.map((o) => o.id)))}
              >
                Select all ({visible.length})
              </Button>
              {selected.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-2">
              {visible.map((obs) => (
                <ObservationCard
                  key={obs.id}
                  observation={obs}
                  selected={selected.has(obs.id)}
                  onToggle={() => toggleSelect(obs.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
