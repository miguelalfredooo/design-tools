"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Plus, Loader2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AREA_TAGS } from "@/lib/research-hub-types";

function LogFormInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [body, setBody] = useState("");
  const [area, setArea] = useState<string>(AREA_TAGS[0]);
  const [customArea, setCustomArea] = useState("");
  const [contributor, setContributor] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Remember contributor name
  useEffect(() => {
    const saved = localStorage.getItem("research-contributor");
    if (saved) setContributor(saved);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !token) return;

    setSubmitting(true);
    try {
      const finalArea = area === "__custom" ? customArea : area;
      if (contributor) {
        localStorage.setItem("research-contributor", contributor);
      }
      const res = await fetch("/api/design/research/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          area: finalArea,
          contributor: contributor || null,
          sourceUrl: sourceUrl || null,
          token,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to submit");
        return;
      }
      setSubmitted(true);
      setBody("");
      setSourceUrl("");
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      alert("Failed to submit observation");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-sm">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Invalid or missing share link. Ask your team for a valid link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-bold">Log an Observation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            What did you notice in a session replay or hear from a user?
          </p>
        </div>

        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                placeholder="Your name"
                value={contributor}
                onChange={(e) => setContributor(e.target.value)}
              />

              <Textarea
                placeholder="What did you observe?"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[100px] resize-none"
              />

              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
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
                  placeholder="Custom area tag..."
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                />
              )}

              <Input
                placeholder="Source URL (optional — Mixpanel link, Slack thread)"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />

              <Button
                type="submit"
                className="w-full gap-1.5"
                disabled={submitting || !body.trim()}
              >
                {submitted ? (
                  <>
                    <Check className="size-4 text-emerald-500" />
                    Submitted!
                  </>
                ) : submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="size-4" />
                    Submit Observation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LogPage() {
  return (
    <Suspense>
      <LogFormInner />
    </Suspense>
  );
}
