"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Loader2, Check, Bird, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AREA_TAGS } from "@/lib/research-hub-types";

interface BriefContext {
  title?: string;
  question?: string;
  hypothesis?: string;
  areas?: string[];
  prompts?: string[];
}

interface TokenData {
  token: string;
  context: BriefContext | null;
  observationCount: number;
}

// ── Submission row ────────────────────────────────────────────────────────────

interface Submission {
  body: string;
  area: string;
  sourceUrl: string;
}

// ── Main form ─────────────────────────────────────────────────────────────────

function ContributeInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [contributor, setContributor] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalSubmitted, setTotalSubmitted] = useState(0);

  // Current form entry
  const [body, setBody] = useState("");
  const [area, setArea] = useState("");
  const [customArea, setCustomArea] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Brief visibility toggle
  const [briefExpanded, setBriefExpanded] = useState(true);

  // Load token + brief
  useEffect(() => {
    if (!token) {
      setLoadError("Missing share link. Ask your team for a valid link.");
      setLoading(false);
      return;
    }

    fetch(`/api/design/research/share-tokens/lookup?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setLoadError(
            data.error === "Token expired"
              ? "This contribution link has expired."
              : "Invalid or missing share link. Ask your team for a valid link."
          );
        } else {
          setTokenData(data);
          // Default area to first in brief's areas, or first AREA_TAG
          const areas = data.context?.areas;
          setArea(areas?.length ? areas[0] : AREA_TAGS[0]);
        }
      })
      .catch(() => setLoadError("Could not load the contribution brief."))
      .finally(() => setLoading(false));

    // Restore contributor name
    const saved = localStorage.getItem("research-contributor");
    if (saved) setContributor(saved);
  }, [token]);

  const brief = tokenData?.context ?? null;
  const availableAreas =
    brief?.areas?.length ? brief.areas : [...AREA_TAGS];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !token) return;

    setSubmitting(true);
    try {
      const finalArea = area === "__custom" ? customArea.trim() || "General" : area;
      if (contributor.trim()) {
        localStorage.setItem("research-contributor", contributor.trim());
      }

      const res = await fetch("/api/design/research/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          area: finalArea,
          contributor: contributor.trim() || null,
          sourceUrl: sourceUrl.trim() || null,
          token,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to submit");
        return;
      }

      setSubmissions((prev) => [{ body: body.trim(), area: finalArea, sourceUrl: sourceUrl.trim() }, ...prev]);
      setTotalSubmitted((n) => n + 1);
      setBody("");
      setSourceUrl("");
      setShowSource(false);
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 2500);
    } catch {
      alert("Failed to submit observation");
    } finally {
      setSubmitting(false);
    }
  }

  // ── States ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-6 text-center space-y-2">
            <Bird className="size-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">Link unavailable</p>
            <p className="text-sm text-muted-foreground">{loadError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-2">
        <div className="flex items-center justify-center size-7 rounded-md bg-white border border-border shrink-0">
          <Bird className="size-4 text-black" />
        </div>
        <span className="text-sm font-medium">Carrier</span>
        <span className="text-muted-foreground/40 mx-1">·</span>
        <span className="text-sm text-muted-foreground">Research contribution</span>
        {tokenData && (
          <span className="ml-auto text-xs text-muted-foreground">
            {tokenData.observationCount + totalSubmitted} observation{tokenData.observationCount + totalSubmitted !== 1 ? "s" : ""} in hub
          </span>
        )}
      </div>

      <div className="flex justify-center px-4 pt-8 pb-16">
        <div className="w-full max-w-[600px] space-y-5">

          {/* Brief card */}
          {brief && (
            <Card>
              <CardContent className="p-5">
                <button
                  type="button"
                  className="w-full flex items-start justify-between gap-3 text-left"
                  onClick={() => setBriefExpanded(!briefExpanded)}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-0.5">
                      Research brief
                    </p>
                    <h1 className="text-base font-bold leading-snug">
                      {brief.title || "Contribute an observation"}
                    </h1>
                  </div>
                  {briefExpanded ? (
                    <ChevronUp className="size-4 text-muted-foreground shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-1" />
                  )}
                </button>

                {briefExpanded && (
                  <div className="mt-4 space-y-4">
                    {brief.question && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Research question</p>
                        <p className="text-sm leading-relaxed">{brief.question}</p>
                      </div>
                    )}

                    {brief.hypothesis && (
                      <div className="rounded-lg bg-muted/60 px-3.5 py-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Hypothesis</p>
                        <p className="text-sm leading-relaxed italic text-muted-foreground">{brief.hypothesis}</p>
                      </div>
                    )}

                    {brief.prompts && brief.prompts.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">What to look for</p>
                        <ul className="space-y-1.5">
                          {brief.prompts.map((prompt, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="text-muted-foreground shrink-0">·</span>
                              <span>{prompt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {brief.areas && brief.areas.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs text-muted-foreground mr-1">Areas in scope:</p>
                        {brief.areas.map((a) => (
                          <Badge key={a} variant="secondary" className="text-[11px]">{a}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* No brief — simple title */}
          {!brief && (
            <div>
              <h1 className="text-xl font-bold">Log an observation</h1>
              <p className="text-sm text-muted-foreground mt-1">
                What did you notice in a session replay or hear from a user?
              </p>
            </div>
          )}

          {/* Submission form */}
          <Card>
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  placeholder="Your name"
                  value={contributor}
                  onChange={(e) => setContributor(e.target.value)}
                />

                <Textarea
                  placeholder={
                    brief?.prompts?.[0]
                      ? `e.g. "${brief.prompts[0].toLowerCase()}"`
                      : "What did you observe? Be specific — what did you see, hear, or notice?"
                  }
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[110px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {availableAreas.map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                    <option value="__custom">+ Custom area</option>
                  </select>

                  {area === "__custom" && (
                    <Input
                      placeholder="Area name..."
                      value={customArea}
                      onChange={(e) => setCustomArea(e.target.value)}
                      className="w-36 h-9"
                    />
                  )}

                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowSource(!showSource)}
                  >
                    + Source link
                  </button>

                  <div className="flex-1" />

                  <span className="text-[10px] text-muted-foreground hidden sm:block">⌘+Enter to submit</span>

                  <Button type="submit" size="sm" disabled={submitting || !body.trim()} className="gap-1.5">
                    {justSubmitted ? (
                      <>
                        <Check className="size-3.5 text-emerald-400" />
                        Logged
                      </>
                    ) : submitting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="size-3.5" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>

                {showSource && (
                  <Input
                    placeholder="Mixpanel replay, Slack thread, recording link..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="h-9"
                  />
                )}
              </form>
            </CardContent>
          </Card>

          {/* This session's submissions */}
          {submissions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium px-0.5">
                Logged this session ({submissions.length})
              </p>
              {submissions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 px-3.5 py-3 rounded-lg bg-muted/40">
                  <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed">{s.body}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">{s.area}</Badge>
                      {s.sourceUrl && (
                        <a
                          href={s.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline"
                        >
                          Source
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-[11px] text-muted-foreground/50 pt-2">
            Observations feed directly into the research synthesis.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ContributePage() {
  return (
    <Suspense>
      <ContributeInner />
    </Suspense>
  );
}
