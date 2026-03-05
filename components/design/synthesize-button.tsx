"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SynthesizeButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSynthesize() {
    setLoading(true);
    try {
      const res = await fetch("/api/research/synthesize", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Synthesis failed");
        return;
      }
      toast.success(
        `Synthesized ${data.insightCount} insights from ${data.sessionCount} sessions`
      );
      router.refresh();
    } catch {
      toast.error("Could not reach synthesis API");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleSynthesize} disabled={loading} size="sm">
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      {loading ? "Synthesizing..." : "Synthesize"}
    </Button>
  );
}
