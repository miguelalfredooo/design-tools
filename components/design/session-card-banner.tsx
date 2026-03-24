"use client";

import { m } from "motion/react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import type { ExplorationSession } from "@/lib/design-types";
import { springs } from "@/lib/motion";

export function SessionCardBanner({
  session,
  scope,
}: {
  session: ExplorationSession;
  scope: "mine" | "all";
}) {
  const { title, subtitle } = getBannerCopy(session, scope);

  return (
    <m.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springs.smooth}
      className="relative overflow-hidden rounded-xl border border-sky-200/70 bg-gradient-to-r from-sky-100 via-cyan-50 to-white px-4 py-3"
    >
      <m.div
        aria-hidden="true"
        initial={{ x: "-120%" }}
        animate={{ x: "420%" }}
        transition={{ duration: 1.1, delay: 0.2, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-white/60 blur-xl"
      />

      <div className="relative flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-900 text-white shadow-sm">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-950">{title}</div>
          <div className="truncate text-sm text-slate-700">{subtitle}</div>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-700">
          {scope === "mine" ? "Open" : "Review"}
          <ArrowUpRight className="size-3" />
        </div>
      </div>
    </m.div>
  );
}

function getBannerCopy(session: ExplorationSession, scope: "mine" | "all") {
  if (session.validation?.state === "confirmed") {
    return {
      title: scope === "mine" ? "Ready for review" : "Review snapshot",
      subtitle:
        scope === "mine"
          ? "Confirmed evidence is attached and this direction is ready to socialize."
          : "Confirmed evidence is attached and this session is ready for a quick read.",
    };
  }

  if (session.validation?.state === "in_review") {
    return {
      title: "Signal is taking shape",
      subtitle:
        scope === "mine"
          ? "The strongest patterns are visible, but the evidence still needs one more pass."
          : "There is enough signal to inspect, but the evidence has not been fully confirmed yet.",
    };
  }

  return {
    title: "Keep momentum",
    subtitle:
      scope === "mine"
        ? "Directional signal is building. Tighten the evidence before this becomes a drop."
        : "Directional signal is visible here, but it should not be treated as a final recommendation yet.",
  };
}
