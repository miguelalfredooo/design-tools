"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TriangleAlert } from "lucide-react";
import { DesignOpsFindingSection } from "@/components/design/design-ops-finding-section";
import { DesignOpsFindingDigestCard } from "@/components/design/design-ops-finding-digest-card";
import type { AgentMessage, SynthesisMode } from "@/lib/design-ops-types";
import {
  designOpsLeadTextClass,
  designOpsReadingTextClass,
  designOpsSupportingTextClass,
} from "@/lib/design-ops-surfaces";

function parseMarkdownTable(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean)
  const tableLines = lines.filter((l) => l.startsWith("|"))
  if (tableLines.length < 3) return null
  const parse = (line: string) =>
    line.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1)
  const headers = parse(tableLines[0])
  const rows = tableLines.slice(2).map(parse)
  return { headers, rows }
}

function AssumptionsTable({ assumptions }: { assumptions: string }) {
  const parsed = parseMarkdownTable(assumptions)

  if (parsed) {
    return (
      <div className="do-table-wrap">
        <table className="do-table">
          <thead>
            <tr>
              {parsed.headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Fallback: plain list
  const rows = assumptions.split(/\n/).map((l) => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean)
  return (
    <div className="do-table-wrap">
      <table className="do-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Assumption</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface FindingSection {
  label: string;
  content: string[];
}

interface DesignOpsFindingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: AgentMessage;
  summary: string;
  details: string;
  topFindings: string[];
  topNeeds: string[];
  detailSections: FindingSection[];
  assumptions: string;
  nextStep: string;
  mode?: SynthesisMode;
}

export function DesignOpsFindingDialog({
  open,
  onOpenChange,
  message,
  summary,
  details,
  topFindings,
  topNeeds,
  detailSections,
  assumptions,
  nextStep,
  mode = "decision_memo",
}: DesignOpsFindingDialogProps) {
  const confidenceSection = detailSections.find((section) => section.label === "Confidence");
  const readinessSection = detailSections.find((section) => section.label === "Readiness");
  const recommendationSection = detailSections.find(
    (section) => section.label === "Recommendations"
  );
  const remainingSections = detailSections.filter(
    (section) =>
      !["Confidence", "Readiness", "Recommendations"].includes(section.label)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] min-w-[800px] max-w-4xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <div className="flex items-center gap-3">
            {message.confidence !== "n/a" ? (
              <Badge variant="outline" className="rounded-sm px-1.5 py-0 text-[10px] uppercase tracking-[0.12em]">
                {message.confidence}
              </Badge>
            ) : null}
            <DialogDescription className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {mode === "quick_read" ? "Quick read synthesis" : "Detailed synthesis view"}
            </DialogDescription>
          </div>
          <DialogTitle className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
            {message.subject}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 px-6 py-6">
          {mode === "quick_read" ? (
            <>
              <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
                <DesignOpsFindingSection
                  eyebrow="Summary"
                  title="What matters most"
                  description="The clearest takeaway from this quick read."
                >
                  <div className="space-y-4">
                    <p className={designOpsLeadTextClass}>{summary}</p>
                    {details ? (
                      <p className={designOpsSupportingTextClass}>{details}</p>
                    ) : null}
                  </div>
                </DesignOpsFindingSection>

                <div className="space-y-4">
                  {recommendationSection ? (
                    <DesignOpsFindingSection
                      eyebrow="Recommendation"
                      title="Best near-term move"
                      description="The highest-leverage action from this fast pass."
                    >
                      <div className="space-y-3">
                        {recommendationSection.content.map((line, index) => (
                          <p
                            key={`recommendation-${index}`}
                            className={designOpsReadingTextClass}
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </DesignOpsFindingSection>
                  ) : null}

                  <section className="grid gap-4 md:grid-cols-2">
                    {confidenceSection ? (
                      <DesignOpsFindingSection
                        eyebrow="Confidence"
                        title="How sure this is"
                        description="How strongly the agents believe the recommendation is supported."
                      >
                        <div className="space-y-2">
                          {confidenceSection.content.map((line, index) => (
                            <p
                              key={`confidence-${index}`}
                              className={designOpsReadingTextClass}
                            >
                              {line}
                            </p>
                          ))}
                        </div>
                      </DesignOpsFindingSection>
                    ) : null}

                    {readinessSection ? (
                      <DesignOpsFindingSection
                        eyebrow="Readiness"
                        title="How ready this is"
                        description="Whether the current evidence is strong enough to act now."
                      >
                        <div className="space-y-2">
                          {readinessSection.content.map((line, index) => (
                            <p
                              key={`readiness-${index}`}
                              className={designOpsReadingTextClass}
                            >
                              {line}
                            </p>
                          ))}
                        </div>
                      </DesignOpsFindingSection>
                    ) : null}
                  </section>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <DesignOpsFindingDigestCard
                  icon={Sparkles}
                  eyebrow="Quick scan"
                  title="Top 3 findings"
                  description="The most important things the agents believe are true from the available evidence."
                  items={topFindings}
                  emptyState="No top findings were returned in this run."
                  accentClass="bg-emerald-500/12 text-emerald-600"
                />

                <DesignOpsFindingDigestCard
                  icon={TriangleAlert}
                  eyebrow="To de-risk"
                  title="Top 3 needs"
                  description="The biggest gaps, risks, or missing signals that would improve confidence."
                  items={topNeeds}
                  emptyState="No additional needs were returned in this run."
                  accentClass="bg-amber-500/12 text-amber-600"
                />
              </section>

              {nextStep ? (
                <DesignOpsFindingSection
                  eyebrow="Action"
                  title="Next step"
                  description="The most useful immediate action to take after reading this synthesis."
                >
                  <p className={designOpsReadingTextClass}>{nextStep}</p>
                </DesignOpsFindingSection>
              ) : null}

              {assumptions ? (
                <DesignOpsFindingSection
                  eyebrow="Guardrails"
                  title="Assumptions"
                  description="What the agents had to assume because the evidence was incomplete."
                >
                  <AssumptionsTable assumptions={assumptions} />
                </DesignOpsFindingSection>
              ) : null}

              {remainingSections.length > 0 ? (
                <DesignOpsFindingSection
                  eyebrow="Extended context"
                  title="Additional detail"
                  description="Useful supporting context from the quick read without switching to a longer memo."
                >
                  <div className="space-y-6">
                    {remainingSections.map((section) => (
                      <div key={section.label} className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {section.label}
                        </p>
                        <div className="space-y-3">
                          {section.content.map((line, index) => (
                            <p
                              key={`${section.label}-${index}`}
                              className={designOpsReadingTextClass}
                            >
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </DesignOpsFindingSection>
              ) : null}
            </>
          ) : (
            <>
          <DesignOpsFindingSection
            eyebrow="Summary"
            title="What matters most"
            description="The clearest takeaway from this synthesis."
          >
            <div className="space-y-4">
              <p className={designOpsLeadTextClass}>{summary}</p>
              {details ? (
                <p className={designOpsSupportingTextClass}>{details}</p>
              ) : null}
            </div>
          </DesignOpsFindingSection>

          <section className="grid gap-4 md:grid-cols-2">
            <DesignOpsFindingDigestCard
              icon={Sparkles}
              eyebrow="Quick scan"
              title="Top 3 findings"
              description="The most important things the agents believe are true from the available evidence."
              items={topFindings}
              emptyState="No top findings were returned in this run."
              accentClass="bg-emerald-500/12 text-emerald-600"
            />

            <DesignOpsFindingDigestCard
              icon={TriangleAlert}
              eyebrow="To de-risk"
              title="Top 3 needs"
              description="The biggest gaps, risks, or missing signals that would improve confidence."
              items={topNeeds}
              emptyState="No additional needs were returned in this run."
              accentClass="bg-amber-500/12 text-amber-600"
            />
          </section>

          {detailSections.map((section, i) => (
            <DesignOpsFindingSection
              key={`${section.label}-${i}`}
              eyebrow="Detailed view"
              title={section.label}
              description={
                section.label === "Confidence"
                  ? "How strongly the agents believe the recommendation is supported."
                  : section.label === "Readiness"
                    ? "Whether the current evidence is strong enough to act now or needs more validation."
                    : section.label === "Recommendations"
                      ? "The most important actions to take based on this synthesis."
                      : section.label === "Findings"
                        ? "The fuller set of patterns, observations, and reasoning behind the recommendation."
                        : ""
              }
            >
              <div className="space-y-3">
                {section.content.map((line, index) => (
                  <p
                    key={`${section.label}-${index}`}
                    className={designOpsReadingTextClass}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </DesignOpsFindingSection>
          ))}

          {assumptions ? (
            <DesignOpsFindingSection
              eyebrow="Guardrails"
              title="Assumptions"
              description="What the agents had to assume because the evidence was incomplete."
            >
              <AssumptionsTable assumptions={assumptions} />
            </DesignOpsFindingSection>
          ) : null}

          {nextStep ? (
            <DesignOpsFindingSection
              eyebrow="Action"
              title="Next step"
              description="The most useful immediate action to take after reading this synthesis."
            >
              <p className={designOpsReadingTextClass}>{nextStep}</p>
            </DesignOpsFindingSection>
          ) : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
