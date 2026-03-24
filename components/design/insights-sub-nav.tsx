"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Eye,
  Lightbulb,
  Play,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { tab: "overview", label: "Overview", icon: BarChart3 },
  { tab: "observations", label: "Observations", icon: Eye },
  { tab: "segments", label: "Segments", icon: Users },
  { tab: "replays", label: "Replays", icon: Play },
  { tab: "reference", label: "Reference", icon: BookOpen },
  { tab: "directions", label: "Directions", icon: Lightbulb },
];

export function InsightsSubNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";

  // Extract projectId from pathname: /research/[projectId]
  const projectId = pathname.split("/")[2] ?? "";

  return (
    <div className="w-[180px] shrink-0 flex flex-col pt-6 pb-6 px-2 border-r border-border/60 h-svh sticky top-0">
      <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/60 px-3 mb-3 uppercase">
        Insights
      </p>
      <div className="flex flex-col gap-0.5">
        {sections.map(({ tab, label, icon: Icon }) => {
          const active = activeTab === tab;
          return (
            <Link
              key={tab}
              href={`/research/${projectId}?tab=${tab}`}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
