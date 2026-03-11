"use client";

import { useState, useEffect, useCallback } from "react";
import { Brain } from "lucide-react";
import { toast } from "sonner";
import { DesignOpsObjectives } from "@/components/design/design-ops-objectives";
import { DesignOpsCrewRunner } from "@/components/design/design-ops-crew-runner";
import { DesignOpsTimeline } from "@/components/design/design-ops-timeline";
import { useAdmin } from "@/hooks/use-admin";
import type { Objective, AgentMessage } from "@/lib/design-ops-types";

export function DesignOpsClient() {
  const { isAdmin } = useAdmin();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load objectives
  useEffect(() => {
    fetch("/api/design-ops/objectives")
      .then((r) => r.json())
      .then((data) => {
        setObjectives(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAddObjective = useCallback(
    async (obj: Omit<Objective, "id" | "createdAt">) => {
      try {
        const res = await fetch("/api/design-ops/objectives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(obj),
        });
        if (!res.ok) throw new Error("Failed to add objective");
        const newObj = await res.json();
        setObjectives((prev) => [...prev, newObj]);
        toast.success("Objective added");
      } catch {
        toast.error("Failed to add objective");
      }
    },
    []
  );

  const handleDeleteObjective = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/design-ops/objectives?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setObjectives((prev) => prev.filter((o) => o.id !== id));
      toast.success("Objective removed");
    } catch {
      toast.error("Failed to remove objective");
    }
  }, []);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Brain className="size-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Design Ops</h2>
        <p className="text-muted-foreground text-sm">
          Admin access required. Click the lock icon in the sidebar to unlock.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading Design Ops...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Design Ops</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered research synthesis tied to your business objectives.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left sidebar — Objectives */}
        <div className="space-y-6">
          <DesignOpsObjectives
            objectives={objectives}
            onAdd={handleAddObjective}
            onDelete={handleDeleteObjective}
          />
        </div>

        {/* Main content — Runner + Timeline */}
        <div className="space-y-6">
          <DesignOpsCrewRunner
            objectives={objectives}
            onMessages={setMessages}
            onRunStatusChange={setRunning}
          />

          {(messages.length > 0 || running) && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {running ? "Crew Activity" : "Results"}
              </h3>
              <DesignOpsTimeline messages={messages} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
