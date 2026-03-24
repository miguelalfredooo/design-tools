"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  FlaskConical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DesignOpsFindingDialog } from "@/components/design/design-ops-finding-dialog";
import {
  formatPlainTextSections,
  toPlainText,
} from "@/lib/design-ops-formatting";
import { cn } from "@/lib/utils";
import type { AgentMessage, SynthesisMode } from "@/lib/design-ops-types";

interface DesignOpsTimelineProps {
  messages: AgentMessage[];
  mode?: SynthesisMode;
  showProcess: boolean;
}

const AGENT_CONFIG: Record<
  string,
  { icon: typeof Brain; color: string; label: string; role: string }
> = {
  design_strategy: {
    icon: Brain,
    color: "text-violet-400",
    label: "Design Strategy",
    role: "Design Lead",
  },
  research_insights: {
    icon: FlaskConical,
    color: "text-emerald-400",
    label: "Research & Insights",
    role: "Research Analyst",
  },
  system: {
    icon: Brain,
    color: "text-violet-400",
    label: "System",
    role: "System",
  },
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-red-500/20 text-red-400 border-red-500/30",
  "n/a": "bg-muted text-muted-foreground",
};

function isProcessMessage(msg: AgentMessage): boolean {
  const subject = msg.subject.toLowerCase();
  const body = msg.body.toLowerCase();

  return (
    msg.confidence === "n/a" ||
    msg.from === "system" ||
    subject === "crew run started" ||
    subject.endsWith("is working") ||
    subject.includes("synthesis complete") ||
    body.includes("directing research & insights") ||
    body.includes("currently thinking on the request") ||
    body.includes("currently working on the request")
  );
}

function renderPreview(msg: AgentMessage): string {
  return toPlainText(msg.body).replace(/\s+/g, " ").trim();
}

function renderCollapsedPreview(msg: AgentMessage): string {
  const sections = formatPlainTextSections(msg.body);
  const preferredSection =
    sections.find((section) => section.label === "Summary") ??
    sections.find((section) => section.label === "Recommendations") ??
    sections[0];
  const preview = preferredSection
    ? preferredSection.content.join(" ").replace(/\s+/g, " ").trim()
    : renderPreview(msg);

  if (preview.length <= 220) return preview;
  return `${preview.slice(0, 217).trimEnd()}...`;
}

function renderMeta(msg: AgentMessage) {
  const agent =
    AGENT_CONFIG[msg.from] || AGENT_CONFIG.design_strategy;
  const recipient =
    msg.to === "user" ? "You" : AGENT_CONFIG[msg.to]?.label || msg.to;

  return { agent, recipient };
}

function getSectionContent(
  sections: ReturnType<typeof formatPlainTextSections>,
  label: string
) {
  return sections.find((section) => section.label === label)?.content ?? [];
}

function summarizeLines(lines: string[], limit = 3) {
  return lines
    .flatMap((line) =>
      line
        .split(/\s+(?=-\s+)/)
        .map((part) => part.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean)
    )
    .slice(0, limit);
}

function ProcessStep({ msg }: { msg: AgentMessage }) {
  const { agent, recipient } = renderMeta(msg);
  const Icon = agent.icon;
  const preview = renderPreview(msg);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-3">
      <div
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/60",
          agent.color
        )}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] leading-4">
          <span
            className={cn(
              "font-semibold uppercase tracking-[0.18em]",
              agent.color
            )}
          >
            {msg.fromName || agent.label}
          </span>
          <span className="text-muted-foreground">{agent.role}</span>
          <span className="text-muted-foreground">→ {recipient}</span>
        </div>
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {msg.subject}
        </p>
        {preview ? (
          <p className="text-sm leading-6 text-muted-foreground">{preview}</p>
        ) : null}
      </div>
    </div>
  );
}

function SynthesisCard({ msg }: { msg: AgentMessage }) {
  const [open, setOpen] = useState(false);
  const { agent, recipient } = renderMeta(msg);
  const Icon = agent.icon;
  const bodySections = formatPlainTextSections(msg.body);
  const summary = getSectionContent(bodySections, "Summary")[0] ?? renderCollapsedPreview(msg);
  const details = getSectionContent(bodySections, "Details")[0] ?? "";
  const topFindings = summarizeLines(
    getSectionContent(bodySections, "Top findings").length > 0
      ? getSectionContent(bodySections, "Top findings")
      : getSectionContent(bodySections, "Findings")
  );
  const topNeeds = summarizeLines(
    getSectionContent(bodySections, "Top needs").length > 0
      ? getSectionContent(bodySections, "Top needs")
      : getSectionContent(bodySections, "Additional signals")
  );
  const detailSections = bodySections.filter(
    (section) =>
      !["Summary", "Details", "Top findings", "Top needs"].includes(section.label)
  );
  const assumptions = toPlainText(msg.assumptions);
  const nextStep = toPlainText(msg.nextStep);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-border/60 bg-card px-4 py-4 text-left shadow-sm transition-colors hover:bg-muted/20"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60",
              agent.color
            )}
          >
            <Icon className="size-4" />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] leading-4">
                  <span
                    className={cn(
                      "font-semibold uppercase tracking-[0.18em]",
                      agent.color
                    )}
                  >
                    {msg.fromName || agent.label}
                  </span>
                  <span className="text-muted-foreground">{agent.role}</span>
                  <span className="text-muted-foreground">→ {recipient}</span>
                </div>
                <p className="text-lg font-semibold tracking-tight text-foreground">
                  {msg.subject}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {msg.confidence !== "n/a" ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-sm px-1.5 py-0 text-[10px] font-medium uppercase tracking-[0.12em]",
                      CONFIDENCE_STYLES[msg.confidence]
                    )}
                  >
                    {msg.confidence}
                  </Badge>
                ) : null}
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  View
                  <ArrowUpRight className="size-3" />
                </span>
              </div>
            </div>

            <div className="space-y-3 border-t border-border/50 pt-3">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Summary
                </p>
                <p className="text-base leading-7 text-foreground/95">{summary}</p>
              </div>

              {details ? (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Details
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">{details}</p>
                </div>
              ) : null}

              {(topFindings.length > 0 || topNeeds.length > 0) ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Top 3 findings
                    </p>
                    <div className="mt-2 space-y-2">
                      {topFindings.slice(0, 3).map((line, index) => (
                        <p key={`finding-${index}`} className="text-sm leading-6 text-foreground/90">
                          {index + 1}. {line}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Top 3 needs
                    </p>
                    <div className="mt-2 space-y-2">
                      {topNeeds.slice(0, 3).map((line, index) => (
                        <p key={`need-${index}`} className="text-sm leading-6 text-foreground/90">
                          {index + 1}. {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </button>

      <DesignOpsFindingDialog
        open={open}
        onOpenChange={setOpen}
        message={msg}
        summary={summary}
        details={details}
        topFindings={topFindings}
        topNeeds={topNeeds}
        detailSections={detailSections}
        assumptions={assumptions}
        nextStep={nextStep}
      />
    </>
  );
}

function QuickReadSynthesisCard({ msg }: { msg: AgentMessage }) {
  const [open, setOpen] = useState(false);
  const { agent, recipient } = renderMeta(msg);
  const Icon = agent.icon;
  const bodySections = formatPlainTextSections(msg.body);
  const summary = getSectionContent(bodySections, "Summary")[0] ?? renderCollapsedPreview(msg);
  const details = getSectionContent(bodySections, "Details")[0] ?? "";
  const topFindings = summarizeLines(
    getSectionContent(bodySections, "Top findings").length > 0
      ? getSectionContent(bodySections, "Top findings")
      : getSectionContent(bodySections, "Findings"),
    3
  );
  const topNeeds = summarizeLines(
    getSectionContent(bodySections, "Top needs").length > 0
      ? getSectionContent(bodySections, "Top needs")
      : getSectionContent(bodySections, "Additional signals"),
    3
  );
  const recommendations = summarizeLines(
    getSectionContent(bodySections, "Recommendations"),
    2
  );
  const detailSections = bodySections.filter(
    (section) =>
      !["Summary", "Details", "Top findings", "Top needs"].includes(section.label)
  );
  const assumptions = toPlainText(msg.assumptions);
  const nextStep = toPlainText(msg.nextStep);
  const recommendationLead = recommendations[0] ?? nextStep;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-border/60 bg-card px-4 py-4 text-left shadow-sm transition-colors hover:bg-muted/20"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60",
              agent.color
            )}
          >
            <Icon className="size-4" />
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] leading-4">
                  <span
                    className={cn(
                      "font-semibold uppercase tracking-[0.18em]",
                      agent.color
                    )}
                  >
                    {msg.fromName || agent.label}
                  </span>
                  <span className="text-muted-foreground">{agent.role}</span>
                  <span className="text-muted-foreground">→ {recipient}</span>
                  <Badge
                    variant="secondary"
                    className="ml-1 rounded-sm px-1.5 py-0 text-[10px] font-medium uppercase tracking-[0.12em]"
                  >
                    Quick read
                  </Badge>
                </div>
                <p className="text-lg font-semibold tracking-tight text-foreground">
                  {summary}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {msg.confidence !== "n/a" ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-sm px-1.5 py-0 text-[10px] font-medium uppercase tracking-[0.12em]",
                      CONFIDENCE_STYLES[msg.confidence]
                    )}
                  >
                    {msg.confidence}
                  </Badge>
                ) : null}
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  View
                  <ArrowUpRight className="size-3" />
                </span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Recommendation
                  </p>
                  <p className="text-base leading-7 text-foreground/95">
                    {recommendationLead || summary}
                  </p>
                </div>
                {details ? (
                  <p className="text-sm leading-6 text-muted-foreground">{details}</p>
                ) : null}
              </div>

              <div className="space-y-3">
                {topFindings.length > 0 ? (
                  <div className="rounded-xl border border-border/60 bg-emerald-500/5 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Top findings
                    </p>
                    <div className="mt-2 space-y-2">
                      {topFindings.slice(0, 3).map((line, index) => (
                        <p key={`finding-${index}`} className="text-sm leading-6 text-foreground/90">
                          {index + 1}. {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {topNeeds.length > 0 ? (
                  <div className="rounded-xl border border-border/60 bg-amber-500/5 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Top needs
                    </p>
                    <div className="mt-2 space-y-2">
                      {topNeeds.slice(0, 3).map((line, index) => (
                        <p key={`need-${index}`} className="text-sm leading-6 text-foreground/90">
                          {index + 1}. {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-3 text-sm">
              {nextStep ? (
                <span className="inline-flex items-center gap-2 text-foreground/90">
                  <ArrowRight className="size-4 text-muted-foreground" />
                  {nextStep}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </button>

      <DesignOpsFindingDialog
        open={open}
        onOpenChange={setOpen}
        message={msg}
        summary={summary}
        details={details}
        topFindings={topFindings}
        topNeeds={topNeeds}
        detailSections={detailSections}
        assumptions={assumptions}
        nextStep={nextStep}
        mode="quick_read"
      />
    </>
  );
}

export function DesignOpsTimeline({ messages, mode = "decision_memo", showProcess }: DesignOpsTimelineProps) {

  const { synthesisMessages, processMessages } = useMemo(() => {
    const synthesis = messages.filter((msg) => !isProcessMessage(msg));
    const process = messages.filter((msg) => isProcessMessage(msg));
    return {
      synthesisMessages: synthesis,
      processMessages: process,
    };
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No crew runs yet. Define objectives and trigger a synthesis.
        </p>
      </div>
    );
  }

  const latestProcess = processMessages.at(-1);

  return (
    <div className="space-y-4">
      {synthesisMessages.length === 0 && latestProcess ? (
        <div className="rounded-xl border border-border/60 bg-card px-4 py-4 shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
              Live run
            </p>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              Analyzing objective
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Design Strategy is framing the problem and Research & Insights is synthesizing the strongest
              available signals.
            </p>
          </div>
        </div>
      ) : null}

      {synthesisMessages.map((msg, index) =>
        mode === "quick_read" ? (
          <QuickReadSynthesisCard key={`${msg.timestamp}-${index}`} msg={msg} />
        ) : (
          <SynthesisCard key={`${msg.timestamp}-${index}`} msg={msg} />
        )
      )}

      {processMessages.length > 0 && showProcess ? (
        <div className="rounded-xl border border-border/60 bg-card px-4 py-4">
          <div className="space-y-1 mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Process details
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Internal agent choreography for transparency and debugging.
            </p>
          </div>
          <div className="space-y-3">
            {processMessages.map((msg, index) => (
              <ProcessStep key={`${msg.timestamp}-${index}`} msg={msg} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
