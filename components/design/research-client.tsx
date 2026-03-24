"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BarChart3, ChevronLeft, ClipboardList, Eye, Lightbulb, Users } from "lucide-react";
import type { DashboardData } from "@/lib/research-dashboard-types";
import { ObservationsTab } from "@/components/design/research/observations-tab";
import { OverviewTab } from "@/components/design/research/overview-tab";
import { ResearchBriefSection } from "@/components/design/research/overview-tab";
import { SegmentsTab } from "@/components/design/research/segments-tab";
import { DirectionsTab } from "@/components/design/research/directions-tab";
import { cn } from "@/lib/utils";

type Tab = "brief" | "overview" | "observations" | "segments" | "directions";

const TABS: { tab: Tab; label: string; icon: typeof BarChart3 }[] = [
  { tab: "brief", label: "Project Brief", icon: ClipboardList },
  { tab: "overview", label: "Overview", icon: BarChart3 },
  { tab: "observations", label: "Observations", icon: Eye },
  { tab: "segments", label: "Segments", icon: Users },
  { tab: "directions", label: "Design Directions", icon: Lightbulb },
];

interface Props {
  dashboard: DashboardData | null;
  projectId: string;
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export function ResearchClient({ dashboard, projectId }: Props) {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") ?? "brief") as Tab;
  const [projectName, setProjectName] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [briefFilled, setBriefFilled] = useState(false);

  function fetchHeader() {
    fetch(`/api/design/research/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setProjectName(data.name ?? "");
          setProjectDescription(data.description ?? "");
          setBriefFilled(!!data.problem_statement?.trim());
        }
      })
      .catch(() => {});
  }

  useEffect(() => { fetchHeader(); }, [projectId]);

  return (
    <div className="min-w-0">
      {/* Back nav */}
      <Link
        href="/research"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ChevronLeft className="size-3.5" />
        Back to Projects
      </Link>

      {/* Tile nav */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {TABS.map(({ tab, label, icon: Icon }) => {
          const active = activeTab === tab;
          const locked = tab !== "brief" && !briefFilled;
          if (locked) {
            return (
              <div
                key={tab}
                className="rounded-xl border px-3 py-3 flex items-start justify-between opacity-35 cursor-not-allowed bg-card border-border"
              >
                <p className="text-xs font-semibold leading-snug text-foreground">{label}</p>
                <Icon className="size-3.5 shrink-0 mt-0.5 text-muted-foreground/40" />
              </div>
            );
          }
          return (
            <Link
              key={tab}
              href={`/research/${projectId}?tab=${tab}`}
              className={cn(
                "rounded-xl border px-3 py-3 flex items-start justify-between transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:border-foreground/20"
              )}
            >
              <p className={cn("text-xs font-semibold leading-snug", active ? "text-primary-foreground" : "text-foreground")}>
                {label}
              </p>
              <Icon className={cn("size-3.5 shrink-0 mt-0.5", active ? "text-primary-foreground/60" : "text-muted-foreground/40")} />
            </Link>
          );
        })}
      </div>

      {/* Project header — read-only context on all tabs except brief (which has its own editable version) */}
      {activeTab !== "brief" && (projectName || projectDescription) && (
        <div className="mb-6">
          {projectName && <h2 className="text-2xl font-bold leading-snug">{projectName}</h2>}
          {projectDescription && <p className="text-base text-muted-foreground mt-1 leading-relaxed">{projectDescription}</p>}
        </div>
      )}

      {activeTab === "brief" && <ResearchBriefSection projectId={projectId} onSave={fetchHeader} onStatusChange={setBriefFilled} />}
      {activeTab === "overview" && dashboard && <OverviewTab dashboard={dashboard} projectId={projectId} />}
      {activeTab === "observations" && <ObservationsTab projectId={projectId} />}
      {activeTab === "segments" && <SegmentsTab projectId={projectId} />}
      {activeTab === "directions" && <DirectionsTab />}
    </div>
  );
}
